import { supabase } from './config.js';

let cart = [];
const productList = document.getElementById('product-list');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalQty = document.getElementById('cart-total-qty');

// 1. Fetch Products
async function loadProducts() {
    // Fetch newest items first
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !data) {
        productList.innerHTML = `<div class="col-12 text-center"><p class="text-danger">Error loading products. Please refresh.</p></div>`;
        return;
    }

    if (data.length === 0) {
        productList.innerHTML = `<div class="col-12 text-center"><p class="text-muted">No items available yet.</p></div>`;
        return;
    }

    productList.innerHTML = '';
    
    data.forEach(product => {
        // Parse sizes (split "S, M, L" into an array)
        const sizes = product.size ? product.size.split(',').map(s => s.trim()) : ['One Size'];
        
        // Create Size Selector HTML
        let sizeSelectorHtml = '';
        if (sizes.length > 1) {
            sizeSelectorHtml = `
                <select class="form-select form-select-sm mb-2 rounded-0 border-dark size-select-${product.id}">
                    ${sizes.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>`;
        } else {
            sizeSelectorHtml = `
                <input type="hidden" class="size-select-${product.id}" value="${sizes[0]}">
                <p class="text-muted small mb-2">Size: ${sizes[0]}</p>`;
        }

        // Generate Card HTML
        const card = `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card product-card h-100 border-0">
                    <div class="card-img-wrapper position-relative">
                        <img src="${product.image_url}" class="card-img-top" alt="${product.name}" loading="lazy">
                    </div>
                    <div class="card-body px-0 text-center">
                        <h6 class="card-title fw-bold mb-1 text-uppercase small">${product.name}</h6>
                        <p class="card-text fw-bold mb-2">₦${product.price.toLocaleString()}</p>
                        
                        <div class="px-2">
                            ${sizeSelectorHtml}
                            <button class="btn btn-dark w-100 btn-sm rounded-0 add-to-cart-btn" 
                                data-id="${product.id}" 
                                data-name="${product.name}" 
                                data-price="${product.price}">
                                ADD TO BAG
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        
        productList.innerHTML += card;
    });

    // Attach Event Listeners
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });
}

// 2. Add to Cart Logic
function handleAddToCart(e) {
    const btn = e.target;
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = btn.dataset.price;
    
    const sizeInput = document.querySelector(`.size-select-${id}`);
    const selectedSize = sizeInput.value;

    cart.push({ id, name, price, size: selectedSize });
    
    const originalText = btn.innerText;
    btn.innerText = "ADDED ✓";
    btn.classList.replace('btn-dark', 'btn-success');
    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.replace('btn-success', 'btn-dark');
    }, 1000);

    updateCartUI();
    
    const bsOffcanvas = new bootstrap.Offcanvas('#cartSidebar');
    bsOffcanvas.show();
}

// 3. Update Cart Sidebar
function updateCartUI() {
    cartCount.innerText = cart.length;
    cartTotalQty.innerText = cart.length;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center text-muted mt-5">Your bag is empty.</p>';
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => `
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <div>
                <div class="fw-bold small text-uppercase">${item.name}</div>
                <small class="text-muted">Size: ${item.size}</small>
            </div>
            <div class="text-end">
                <div class="fw-bold small">₦${parseInt(item.price).toLocaleString()}</div>
                <button class="btn btn-link text-danger p-0 text-decoration-none small remove-btn" data-index="${index}" style="font-size: 0.8rem;">
                    Remove
                </button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            cart.splice(e.target.dataset.index, 1);
            updateCartUI();
        });
    });
}

// 4. Checkout to WhatsApp
document.addEventListener('triggerCheckout', () => {
    if (cart.length === 0) return alert('Your bag is empty!');
    
    const phone = "2348130481575"; 
    
    let msg = `*NEW ORDER - NEXA FORMS* 👖%0A%0AHello! I'd like to purchase:%0A----------------------------%0A`;
    
    let total = 0;
    cart.forEach(item => {
        msg += `• ${item.name} (Size: ${item.size}) - ₦${parseInt(item.price).toLocaleString()}%0A`;
        total += parseInt(item.price);
    });
    
    msg += `----------------------------%0A*Total Estimate: ₦${total.toLocaleString()}*%0A%0APlease confirm availability and shipping.`;
    
    const url = `https://wa.me/${phone}?text=${msg}`;
    window.open(url, '_blank');
});

// Initialize
loadProducts();