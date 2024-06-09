//Cart

if(document.readyState == 'loading'){
    document.addEventListener("DOMContentLoaded", ready);
} else{
    ready();
}

function ready(){
    var removeCartButtons = document.getElementsByClassName('cart-remove');
    for(var i=0; i<removeCartButtons.length; i++){
        var button = removeCartButtons[i];
        button.addEventListener("click", removeCartItem);
    }
    var quantityInputs = document.getElementsByClassName("cart-quantity");
    for(var i=0; i < quantityInputs.length; i++){
        var input = quantityInputs[i];
        input.addEventListener("change", quantityChanged);
    }
    var addCart = document.getElementsByClassName('add-cart');
    for(var i=0; i < addCart.length; i++){
        var button = addCart[i];
        button.addEventListener("click", addCartClicked);
    }
    loadCartItems();
}



//remove cart item

function removeCartItem(event){
    var buttonClicked = event.target;
    buttonClicked.parentElement.remove();
    updatetotal();
    saveCartItems();
}

    
//quantity change
function quantityChanged(event){
    var input= event.target;
    if(isNaN(input.value) || input.value <= 0){
        input.value = 1;
    }
    updatetotal();
    saveCartItems();
}

//add cart

function addCartClicked(event) {
    var button = event.target;
    var shopProducts = button.closest('.card-product'); // Obtener el contenedor del producto
    if (shopProducts) {
        var titleElement = shopProducts.querySelector('.product-title'); // Buscar el elemento del título dentro del contenedor del producto
        var priceElement = shopProducts.querySelector('.price'); // Buscar el elemento del precio dentro del contenedor del producto

        // Verificar si se encontraron los elementos del título y del precio
        if (titleElement && priceElement) {
            var title = titleElement.innerText;
            var price = priceElement.innerText;
            var productImg = shopProducts.querySelector('.product-img').src;
            addProductCart(title, price, productImg);
            updatetotal();
            saveCartItems();
        } else {
            console.error("No se pudieron encontrar los elementos 'product-title' o 'price'");
        }
    } else {
        console.error("No se pudo encontrar el contenedor del producto (shopProducts)");
    }
}


function addProductCart(title, price, productImg){
    var cartShopBox = document.createElement('div');
    cartShopBox.classList.add('cart-box');
    var cartItems = document.getElementsByClassName('cart-content')[0];
    var cartItemsIds = cartItems.getElementsByClassName('cart-product-id');
    var productId = title.replace(/\s+/g, '-').toLowerCase(); // Generar un ID único basado en el título

    for (var i=0; i<cartItemsIds.length; i++){
        if(cartItemsIds[i].innerText === productId){
            return;
        }
    }

    var cartBoxContent =`
    <img src="${productImg}" alt="" class="cart-img">
    <div class="detail-box">
        <div class="cart-product-id" style="display: none;">${productId}</div> <!-- Agregar un campo oculto para el ID -->
        <div class="cart-product-title">${title}</div>
        <div class="cart-price">${price}</div>
        <input type="number" name="" id="" value="1" class="cart-quantity">
    </div>
    <i class="fa-solid fa-trash cart-remove"></i>`;
    cartShopBox.innerHTML = cartBoxContent;
    cartItems.append(cartShopBox);
    cartShopBox.getElementsByClassName('cart-remove')[0].addEventListener('click', removeCartItem);
    cartShopBox.getElementsByClassName('cart-quantity')[0].addEventListener('change', quantityChanged);

    // Actualizar el precio total después de agregar el producto al carrito
    updatetotal();
    saveCartItems();
}




//update total

function updatetotal(){
    var cartContent = document.getElementsByClassName('cart-content')[0];
    var cartBoxes = cartContent.getElementsByClassName('cart-box');
    var total = 0;
    for(var i=0; i < cartBoxes.length; i++){
        var cartBox = cartBoxes[i];
        var priceElement = cartBox.getElementsByClassName('cart-price')[0];
        var quantityElement = cartBox.getElementsByClassName('cart-quantity')[0];
        var priceText = priceElement.innerText.replace(/[^\d.]/g, ''); // Eliminar todos los caracteres que no sean dígitos o puntos
var price = parseFloat(priceText);
        var quantity = quantityElement.value;
        total += price * quantity;

        
    }
    total=Math.round(total*100)/100;
    document.getElementsByClassName('total-price')[0].innerText = '$' + total;
    localStorage.setItem('cartTotal', total)
}



function saveCartItems(){
    var cartContent = document.getElementsByClassName('cart-content')[0];
    var cartBoxes = cartContent.getElementsByClassName('cart-box');
    var cartItems = [];

    for(var i=0;i<cartBoxes.length;i++){
        cartBox = cartBoxes[i];
        var titleElement = cartBox.getElementsByClassName('cart-product-title')[0];
        var priceElement = cartBox.getElementsByClassName('cart-price')[0];
        var quantityElement = cartBox.getElementsByClassName('cart-quantity')[0];
        var productImg = cartBox.getElementsByClassName('cart-img')[0].src;


        var item = {
            title: titleElement.innerText,
            price: priceElement.innerText,
            quantity: quantityElement.value,
            productImg: productImg,
        };
        cartItems.push(item)
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

//loads in cart

function loadCartItems(){
    var cartItems = localStorage.getItem('cartItems');
    if(cartItems){
        cartItems = JSON.parse(cartItems);

        for(var i=0; i<cartItems.length; i++){
            var item= cartItems[i];
            addProductCart(item.title, item.price, item.productImg);

            var cartBoxes=document.getElementsByClassName('cart-box');
            var cardBox = cartBoxes[cartBoxes.length - 1];
            var quantityElement = cartBox.getElementsByClassName("cart-quantity")[0];
            quantityElement.value = item.quantity;

        }
    }
    var cartTotal = localStorage.getItem('cartTotal');
    if(cartTotal){
        document.getElementsByClassName('total-price')[0].innerText = "$" + cartTotal;
    }
}


//Limpiar carrito de compras despues de hacer el pago


function clearCart(){
    var cartContent = document.getElementsByClassName("cart-content")[0];
    cartContent.innerHTML = "";
    updatetotal();
    localStorage.removeItem("cartItems");
}



