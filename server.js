import dotenv from "dotenv";
import stripe from "stripe";
import express from 'express';
import session from 'express-session';
import path from "path";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const db = new sqlite3.Database('./database.db');
const port = 3001;

const app = express();
-
// Configurar el manejo de sesiones 
app.use(session({
    secret: 'mi_secreto', // Cambia esto por una cadena aleatoria y segura
    resave: false,
    saveUninitialized: true
}));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Configurar directorios estáticos
app.use('/imagenes', express.static(path.join(__dirname, 'proyecto', 'Imagenes')));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'login')));
app.use('/Menu_Principal', express.static(path.join(__dirname, 'Menu_Principal')));
app.set('views', path.join(__dirname, 'views'));

// Configurar el uso de bodyParser para analizar datos del formulario
app.use(bodyParser.urlencoded({ extended: true }));


// Ruta para el perfil del usuario
app.get('/perfil', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }   
    res.render('perfil', { user: req.session.user }); // Aquí pasas los datos del usuario a la vista
});


// Ruta para el formulario de inicio de sesión
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login/index.html'));
});

// Configurar el uso de bodyParser para analizar datos del formulario
app.use(bodyParser.urlencoded({ extended: true }));


// Función para obtener todas las compras de un usuario por su ID
function obtenerComprasPorIdUsuario(userId, callback) {
    const sql = `SELECT * FROM compras WHERE usuario_id = ?`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Error al obtener las compras por ID de usuario:", err);
            return callback([]);
        }
        // Devolver las filas de la consulta como resultado
        callback(rows);
    });
}



// Ruta para el inicio de sesión
app.post('/login', (req, res) => {
    const { email, contrasena } = req.body;
    const sqlCheckUser = `SELECT * FROM usuarios WHERE email = ?`;

    db.get(sqlCheckUser, [email], (err, row) => {
        if (err) {
            console.error('Error al buscar usuario en la base de datos:', err);
            return res.status(500).send('Error interno del servidor');
        }

        if (!row) {
            console.log('El correo electrónico no está registrado en la base de datos');
            // Envía un mensaje de correo no encontrado
            return res.status(401).send('<script>alert("El correo electrónico no está registrado."); window.location.href = "/";</script>');
        }

        // Si se encuentra el correo electrónico, devolvemos todos los datos del usuario
        console.log('Correo electrónico encontrado en la base de datos:', row.contrasena);

        if(row.contrasena == contrasena) {
            console.log('La contrasena es correcta');
            req.session.user = {
                id: row.id,
                nombreEsposo: row.nombreEsposo,
                nombreEsposa: row.nombreEsposa,
                email: row.email
            };

            obtenerComprasPorIdUsuario(req.session.user.id, (compras) =>{
                
                res.render('perfil', { user: req.session.user, compras: compras });
            });
            
            // Redirigir al usuario al menú principal
            return res.status(200).redirect('/Menu_Principal');
            

        }else{
            console.log('La contrasena es incorrecta');
            return res.status(200).send('<script>alert("La contrasena es incorrecta."); window.location.href = "/";</script>');
        }

       
    });
});









// Manejar el formulario de registro
app.post('/registro', (req, res) => {
    const { nombreEsposo, nombreEsposa, email, contrasena } = req.body;

    const sqlCheckEmail = `SELECT * FROM usuarios WHERE email = ?`;
    db.get(sqlCheckEmail, [email], (err, row) => {
        if (err) {
            console.error('Error al buscar el correo electrónico en la base de datos:', err);
            return res.status(500).send('Error interno del servidor');
        }
        console.log({nombreEsposo, nombreEsposa, email, contrasena});
        if (row) {
            console.log('El correo electrónico ya está registrado en la base de datos');
            // Envía una respuesta con un script de alerta al cliente
            return res.status(400).send('<script>alert("El correo electrónico ya está registrado. Por favor, intente con otro."); window.location.href = "/";</script>');
        }
        

        const sqlInsertUser = `INSERT INTO usuarios (nombreEsposo, nombreEsposa, email, contrasena) VALUES (?, ?, ?, ?)`;
        const values = [nombreEsposo, nombreEsposa, email, contrasena];

        db.run(sqlInsertUser, values, function(err) {
            if (err) {
                console.error('Error al insertar usuario en la base de datos:', err);
                return res.status(500).send('Error interno del servidor');
            }

            console.log('Usuario registrado exitosamente:', { id: this.lastID, nombreEsposo, nombreEsposa, email, contrasena });

            req.session.user = {
                id: this.lastID,
                nombreEsposo,
                nombreEsposa,
                email,
                contrasena
            };
            
            res.redirect('/Menu_Principal');
        });
    });
});


app.post('/RestContra', (req, res) => {
    

    const email = req.session.user.email;
    const oldPassword = req.body['old-password'];
    const newPassword = req.body['new-password'];
    const confirmPassword = req.body['confirm-password'];

    console.log("Email: ", email, "Vieja Clave: ", oldPassword, "Nueva Clave: ", newPassword, "Confirmar Clave: ", confirmPassword);

    if (newPassword !== confirmPassword) {
        return res.status(400).send('Las nuevas contraseñas no coinciden');
    }

    // Buscar la contraseña antigua en la base de datos
    const sqlCheckPassword = `SELECT contrasena FROM usuarios WHERE email = ?`;
    db.get(sqlCheckPassword, [email], (err, row) => {
        if (err) {
            console.error('Error al buscar usuario en la base de datos:', err);
            return res.status(500).send('Error interno del servidor');
        }

        if (!row) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Comparar la contraseña antigua de la base de datos con la proporcionada por el usuario
        if (row.contrasena !== oldPassword) {
            return res.status(400).send('Contraseña antigua incorrecta');
        }

        // Actualizar la contraseña en la base de datos
        const sqlUpdatePassword = `UPDATE usuarios SET contrasena = ? WHERE email = ?`;
        db.run(sqlUpdatePassword, [newPassword, email], (err) => {
            if (err) {
                console.error('Error al actualizar la contraseña en la base de datos:', err);
                return res.status(500).send('Error interno del servidor');
            }

            res.send('Contraseña actualizada correctamente');
        });
    });
});

// Ruta para eliminar la cuenta del usuario
app.post('/eliminar-cuenta', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const userId = req.session.user.id;

    const sqlDeleteUser = `DELETE FROM usuarios WHERE id = ?`;
    db.run(sqlDeleteUser, userId, (err) => {
        if (err) {
            console.error('Error al eliminar cuenta de usuario:', err);
            return res.status(500).send('Error interno del servidor');
        }

        delete req.session.user;

        res.redirect('/');
    });
});

// Ruta para cerrar sesión
app.get('/cerrar-sesion', (req, res) => {
    delete req.session.user;
    res.redirect('/');
});


//funcion para generar nueva clave
function generarNuevaContrasena(longitud) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nuevaContrasena = '';
    for (let i = 0; i < longitud; i++) {
        nuevaContrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return nuevaContrasena;
}
// Función para enviar correo electrónico

// Ruta para restablecer la contraseña
app.post('/restablecer-contrasena', (req, res) => {
    const { email } = req.body;
    const sqlCheckUser = `SELECT * FROM usuarios WHERE email = ?`;

    // Consulta para verificar si el correo está en la base de datos
    db.get(sqlCheckUser, [email], (err, row) => {
        if (err) {
            console.error('Error al buscar usuario en la base de datos:', err);
            return res.status(500).send('Error interno del servidor');
        }

        // Si no se encuentra ningún usuario con el correo electrónico proporcionado
        if (!row) {
            console.log('El correo electrónico no está registrado en la base de datos');
            // Envía un mensaje de error al cliente
            return res.status(404).send('<script>alert("El correo electrónico no está registrado."); window.location.href = "/";</script>');
        }

        // Generar una nueva contraseña aleatoria
        const nuevaContrasena = generarNuevaContrasena(10); // Generamos una nueva contraseña de longitud 10

        // Actualizar la contraseña en la base de datos
        const sqlUpdatePassword = `UPDATE usuarios SET contrasena = ? WHERE email = ?`;
        db.run(sqlUpdatePassword, [nuevaContrasena, email], (err) => {
            if (err) {
                console.error('Error al actualizar la contraseña en la base de datos:', err);
                return res.status(500).send('Error interno del servidor');
            }

            console.log('Contraseña actualizada en la base de datos');

            // Si la actualización de la contraseña es exitosa, enviamos el correo electrónico de restablecimiento de contraseña
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'p69013530@gmail.com', // tu dirección de correo electrónico de Gmail
                    pass: 'h o c o e y b f n x s t r x f x' // tu contraseña de Gmail
                }
            });

            // Detalles del correo electrónico a enviar
            const mailOptions = {
                from: 'FelicesXSiempre',
                to: email,
                subject: 'Restablecimiento de contraseña',
                html: `<p>Hola,</p><p>Tu nueva contraseña temporal es: <strong>${nuevaContrasena}</strong></p>`
            };

            // Envío del correo electrónico
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar el correo electrónico:', error);
                    return res.status(500).send('Error al enviar el correo electrónico');
                } else {
                    console.log('Correo electrónico enviado:', info.response);
                    return res.status(200).send('<script>alert("Se envió un mensaje al correo con la nueva contraseña temporal."); window.location.href = "/";</script>');
                }
            });
        });
    });
});

//Gestion de Facturacion
// Función para enviar la factura por correo electrónico
async function enviarFactura(correo, lineItems) {
    try {
        console.log('Iniciando envío de factura.');

        // Inicializar el total de la factura
        let totalFactura = 0;

        // Construir el contenido de la factura HTML
        let facturaHTML = '<h2>Factura de compra</h2>';
        facturaHTML += '<table>';
        facturaHTML += '<tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th></tr>';

        // Construir filas de la tabla para cada producto en la factura y calcular el total
        lineItems.forEach((item) => {
            facturaHTML += `<tr><td>${item.price_data.product_data.name}</td><td>${item.quantity}</td><td>${item.price_data.unit_amount / 100}</td></tr>`;
            totalFactura += item.quantity * (item.price_data.unit_amount / 100);
        });

        facturaHTML += '</table>';

        // Agregar el total de la factura al final de la tabla
        facturaHTML += `<p>Total: ${totalFactura}</p>`;

        // Configurar el transporte de correo electrónico
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'p69013530@gmail.com', // Cambia esto por tu dirección de correo electrónico de Gmail
                pass: 'h o c o e y b f n x s t r x f x' // Cambia esto por tu contraseña de Gmail
            }
        });

        // Detalles del correo electrónico a enviar
        const mailOptions = {
            from: 'FelicesXSiempre',
            to: correo,
            subject: 'Factura de compra',
            html: facturaHTML
        };

        // Envío del correo electrónico
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo electrónico enviado:', info.response);
    } catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
    }
}





//pagos en linea con stripe

//---------------------------------------------------------------------------------------------------
dotenv.config();


app.use(express.static('Menu_Principal')); // Configura el middleware para servir archivos estáticos desde la carpeta 'public'

app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile('index.html', { root: "Menu_Principal" });
});
//success
app.get("/success", (req, res) => {
    res.sendFile('success.html', { root: "Menu_Principal" });
});
//cancel
app.get("/cancel", (req, res) => {
    res.sendFile('cancel.html', { root: "Menu_Principal" });
});

let stripeGateway = stripe(process.env.stripe_api);

let DOMAIN = process.env.DOMAIN;


app.post('/stripe-checkout', async (req, res) => {
    try {
        // Extraer los elementos del carrito del cuerpo de la solicitud
        const lineItems = req.body.items.map((item) => {
            // Calcular el monto unitario en centavos
            const unitAmount = parseInt(item.price.replace(/[^0-9.-]+/g, '') * 100);

            // Construir el objeto de elemento de línea para la sesión de pago de Stripe
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.title,
                        images: [item.productImg]
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            };
        });

        // Crear la sesión de pago de Stripe
        const session = await stripeGateway.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${DOMAIN}/success`,
            cancel_url: `${DOMAIN}/cancel`,
            line_items: lineItems,
            // Solicitar la colección de dirección en la página de pago de Stripe
            billing_address_collection: 'required'
        });

        // Extraer el ID de usuario de la sesión (esto depende de cómo manejes las sesiones en tu aplicación)
        const userId = req.session.user.id;

        // Obtener la fecha actual
        const fechaActual = new Date().toISOString();

        // Insertar los detalles de la compra en la base de datos
        const insertQuery = `
            INSERT INTO compras (usuario_id, fecha, nombre_producto, cantidad, precio)
            VALUES (?, ?, ?, ?, ?)
        `;
        lineItems.forEach(async (item) => {
            await db.run(insertQuery, [userId, fechaActual, item.price_data.product_data.name, item.quantity, item.price_data.unit_amount]);
        });

         console.log("Este es su correo para recibir la factura: ", req.session.user.email);
        //await enviarFactura(req.session.user.email, lineItems);
        await enviarFactura(req.session.user.email, lineItems);
        // Redirigir al usuario a la página de pago de Stripe
        res.json(session.url);
    } catch (error) {
        // Manejar los errores
        console.error('Error al procesar el pago:', error);
        res.status(500).send('Error interno del servidor');
    }
});




//--------------------------------------------------------------------------------------------------

// Crear la tabla usuarios si no existe

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombreEsposo TEXT,
        nombreEsposa TEXT,
        email TEXT UNIQUE,
        contrasena TEXT
    )`);

        // Crear la tabla compras si no existe
        db.run(`CREATE TABLE IF NOT EXISTS compras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            fecha TEXT,
            nombre_producto TEXT,
            cantidad INTEGER,
            precio INTEGER,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )`);
    });

// Iniciar el servidor después de crear las tablas
app.listen(port, () => {
    console.log(`El servidor está corriendo en http://localhost:${port}`);
});

