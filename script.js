//code to get the data from contentful
const client = contentful.createClient({
  accessToken: 'vD83emaPKUan3HvA4_Myli07FSOLQaLIdOvpKnvl27s',
  space: '56nh6t1bofms'
})

const productsDOM = document.querySelector(".products-center");
const cartItemsCount = document.querySelector(".cart-items");
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const cartContainer = document.querySelector('.cart-container');
const cart = document.querySelector('.cart');
const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-btn');
const clearCartBtn = document.querySelector('.clear-cart');


let cartItems = [];
let cartBtnsDOM = [];

class Products {
    async getProducts() {
        try {
            //get products from contentful, the contentful.js library returns calls to getentries
            let conentfulRes = await client.getEntries({content_type: 'comfyHouse'});
            console.log(conentfulRes.items);

            //get products from json file
            // let response = await fetch('./data/products.json');
            // let data = await response.json();

            let products = conentfulRes.items.map(item => {
                const { id } = item.sys;
                const { title, price } = item.fields;
                const img = item.fields.image.fields.file.url;

                return { id, title, price, img };
            })
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

class Ui {
    dispalyProducts(products) {
        let productView = '';

        products.forEach(product => {
            productView += `<article class="product">
                    <div class="product-container">
                        <img src=${product.img} alt="" class="product-img">
                        <button class="addtocart-btn" data-id=${product.id}>
                            <i class="fa-solid fa-cart-shopping"> Add to Cart</i>                            
                        </button>
                    </div>
                    <div class="product-details">
                        <h3>${product.title}</h3>
                        <h4>$${product.price}</h4>
                    </div>

                </article>
            `
        });
        productsDOM.innerHTML = productView;
    }

    calculateCartTotal(cart) {
        let totalItems = 0;
        let tempTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.quantity;
            totalItems += item.quantity;
        });
        cartItemsCount.innerText = totalItems;
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    }

    updateCartItems(item) {
        let cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');

        cartItemDiv.innerHTML = `<div class="cart-left">
                <img src="${item.img}" alt="product">
                <div class="details">
                    <h4>${item.title}</h4>
                    <h5>Price: $${item.price}</h5>
                </div>
            </div>
            <div class="cart-right">
                <div class="quantity">
                    <i class="fa-solid fa-circle-chevron-left decr-qty" data-id=${item.id}></i>
                    <p class="count">${item.quantity}</p>
                    <i class="fa-solid fa-circle-chevron-right incr-qty" data-id=${item.id}></i>
                </div>
                <i class="fa-solid fa-trash-can remove-cart" data-id=${item.id}></i>
            </div>`
        cartContent.appendChild(cartItemDiv);
    }

    viewCart() {
        cartContainer.classList.toggle('show-cart');
        cart.classList.toggle('cart-transform');
    }

    getCartBtn() {
        const cartBtns = [...document.querySelectorAll('.addtocart-btn')];
        cartBtnsDOM = cartBtns

        cartBtns.forEach(btn => {
            let id = btn.dataset.id;
            let inCart = cartItems.find(item => item.id === id);

            if (inCart) {
                btn.innerText = 'In Cart';
                btn.disabled = true;
            } else {
                btn.addEventListener("click", event => {
                    event.target.innerText = "In Cart";
                    event.target.disabled = true;

                    //get the product from localstorage
                    let cartItem = { ...LocalStorage.getProduct(id), quantity: 1 };

                    //add product to the cartItems
                    cartItems = [...cartItems, cartItem];

                    //save cart items in local storage
                    LocalStorage.saveCartItems(cartItems);

                    //calculate cart value for each product
                    this.calculateCartTotal(cartItems);

                    //Update products in Cart
                    this.updateCartItems(cartItem);

                    //show cart items
                    // this.viewCart();
                })
            }
        })
    }

    getCartBtnId(id) {
        return cartBtnsDOM.find(toCart => toCart.dataset.id === id);
    }

    removeItemCart(id) {
        cartItems = cartItems.filter(item => item.id != id);
        //calculate cart total and update the item count in cart
        this.calculateCartTotal(cartItems);

        //remove from local storage cart
        LocalStorage.saveCartItems(cartItems);

        // Change IN-cart btn to Add-to-cart
        //get id of the item removed from cart
        let toCartBtn = this.getCartBtnId(id);
        toCartBtn.disabled = false;
        toCartBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"> Add to Cart </i>`;
    }

    clearCart(){
        let cartContentId = cartItems.map(item => item.id);
        cartContentId.forEach(id => this.removeItemCart(id));
        while(cartContent.children.length > 0){
            cartContent.removeChild(cartContent.children[0]);
        }
    }

    cartLogic() {
        //Clear cart button
        clearCartBtn.addEventListener('click', () => this.clearCart());

        //increase, decrease quantity or remove the item frm cart
        cartContent.addEventListener('click', event => {
            if (event.target.classList.contains('remove-cart')) {
                //get the item to be removed from cart
                let removeItem = event.target;
                let itemId = event.target.dataset.id;

                //remove from cart container
                cartContent.removeChild(removeItem.parentElement.parentElement);

                //remove from local cart storage
                this.removeItemCart(itemId);
            } else if (event.target.classList.contains('incr-qty')) {
                let incrItem = event.target;
                let itemId = incrItem.dataset.id;

                //increase count by 1 in local storage cart
                let tempItem = cartItems.find(item => item.id === itemId);
                tempItem.quantity++;

                //store the updated value in local storage
                LocalStorage.saveCartItems(cartItems);

                //calculate cart total and update the item count in cart
                this.calculateCartTotal(cartItems);

                //update the count of item in cart-container
                incrItem.previousElementSibling.innerText = tempItem.quantity;
            } else if (event.target.classList.contains('decr-qty')) {
                let decrItem = event.target;
                let itemId = decrItem.dataset.id;
                
                //decrease the count by 1 in local storage
                let tempItem = cartItems.find(item => item.id === itemId);

                tempItem.quantity--;
                //check if quantity > 0
                if (tempItem.quantity <= 0) {
                     //remove from cart container
                     cartContent.removeChild(decrItem.parentElement.parentElement.parentElement);

                     //remove from local cart storage
                     this.removeItemCart(itemId);
                }
                    //update localstorage
                    LocalStorage.saveCartItems(cartItems);

                    //calculate cart total and update item count in cart
                    this.calculateCartTotal(cartItems);

                    //update count of item in cart container
                    decrItem.nextElementSibling.innerText = tempItem.quantity;

            }
        })
    }

    onLoadApp() {
        //get cart items if any
        cartItems = LocalStorage.getCartItems();

        //display in the cart 
        cartItems.forEach(item => this.updateCartItems(item));

        //Calculate total amount and count items in cart
        this.calculateCartTotal(cartItems);

        //add event to cart button
        cartBtn.addEventListener("click", this.viewCart);
        closeCartBtn.addEventListener("click", this.viewCart);
    }

}

class LocalStorage {
    static saveProducts(products) {
        localStorage.setItem("Products", JSON.stringify(products));
    }

    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem('Products'));
        return products.find(product => product.id === id);
    }

    static saveCartItems(cartItems) {
        localStorage.setItem("Cart", JSON.stringify(cartItems));
    }

    static getCartItems() {
        return localStorage.getItem("Cart") ? JSON.parse(localStorage.getItem("Cart")) : [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const products = new Products();
    const ui = new Ui();

    ui.onLoadApp();
    products.getProducts().then(product => {
        ui.dispalyProducts(product);
        LocalStorage.saveProducts(product);
    }).then(e => {
        ui.getCartBtn();
        ui.cartLogic();
    });
})