document.addEventListener("DOMContentLoaded", function() {
    const registerLink = document.querySelector(".registrarse-link");
    const loginLink = document.querySelector(".login-link");
    const recuperarLink = document.querySelector(".recuperar-link");
    const loginForm = document.querySelector(".login-form");
    const registerForm = document.querySelector(".register-form");
    const recuperarForm = document.querySelector(".rest-contra");

    // Función para cambiar al formulario de registro
    registerLink.addEventListener("click", function(event) {
        event.preventDefault();
        if (loginForm.style.display !== "none") {
            loginForm.style.transition = "opacity 0.8s ease-in-out";
            loginForm.style.opacity = 0;
            setTimeout(function() {
                loginForm.style.display = "none";
                registerForm.style.transition = "opacity 0.8s ease-in-out";
                registerForm.style.opacity = 1;
                registerForm.style.display = "block";
            }, 800);
        }
    });

    // Función para cambiar al formulario de inicio de sesión
    loginLink.addEventListener("click", function(event) {
        event.preventDefault();
        if (registerForm.style.display !== "none") {
            registerForm.style.transition = "opacity 0.8s ease-in-out";
            registerForm.style.opacity = 0;
            setTimeout(function() {
                registerForm.style.display = "none";
                loginForm.style.transition = "opacity 0.8s ease-in-out";
                loginForm.style.opacity = 1;
                loginForm.style.display = "block";
            }, 800);
        }
    });

    // Función para cambiar al formulario de restablecimiento de contraseña
    recuperarLink.addEventListener("click", function(event) {
        event.preventDefault();
        if (loginForm.style.display !== "none") {
            loginForm.style.transition = "opacity 0.8s ease-in-out";
            loginForm.style.opacity = 0;
            setTimeout(function() {
                loginForm.style.display = "none";
                recuperarForm.style.transition = "opacity 0.8s ease-in-out";
                recuperarForm.style.opacity = 1;
                recuperarForm.style.display = "block";
            }, 800);
        }
    });

    // Función para cambiar al formulario de inicio de sesión desde el formulario de restablecimiento de contraseña
    const backToLoginLink = document.querySelector(".restablecer .login-link");
    backToLoginLink.addEventListener("click", function(event) {
        event.preventDefault();
        if (recuperarForm.style.display !== "none") {
            recuperarForm.style.transition = "opacity 0.8s ease-in-out";
            recuperarForm.style.opacity = 0;
            setTimeout(function() {
                recuperarForm.style.display = "none";
                loginForm.style.transition = "opacity 0.8s ease-in-out";
                loginForm.style.opacity = 1;
                loginForm.style.display = "block";
            }, 800);
        }
    });
});


document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const email = formData.get('email');
    const contrasena = formData.get('contrasena');

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, contrasena })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(errorMessage => {
                alert(errorMessage);
            });
        } else {
            return response.text().then(successMessage => {
                alert(successMessage);
                window.location.href = '/perfil';
            });
        }
    })
    .catch(error => {
        console.error('Error al iniciar sesión:', error);
        alert('Se produjo un error al iniciar sesión');
    });
});
