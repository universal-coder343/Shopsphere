// We start with empty arrays until fetched from the API
let products = [];
let cart     = [];
let currentCategory = 'all';
let currentSearch   = '';
let currentSort     = 'all';

function formatPrice(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

function getFilteredProducts() {
  let list = products.filter(p => {
    const matchCat    = currentCategory === 'all' || p.cat === currentCategory;
    const matchSearch = p.name.toLowerCase().includes(currentSearch.toLowerCase());
    const matchSale   = currentSort !== 'sale' || p.badge === 'Sale';
    return matchCat && matchSearch && matchSale;
  });

  if (currentSort === 'price-asc')  list = list.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') list = list.sort((a, b) => b.price - a.price);
  if (currentSort === 'rating')     list = list.sort((a, b) => b.rating - a.rating);

  return list;
}

function filterByCategory(cat) {
  currentCategory = cat;

  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
  const catOrder = ['all', 'electronics', 'clothes', 'home', 'beauty', 'sports'];
  const index = catOrder.indexOf(cat);
  if (index >= 0) {
    const cards = document.querySelectorAll('.cat-card');
    if (cards[index]) cards[index].classList.add('active');
  }

  renderProducts();
  document.getElementById('featured').scrollIntoView({ behavior: 'smooth' });
}

function filterProducts() {
  currentSearch = document.getElementById('searchInput').value;
  renderProducts();
}

function sortProducts(type, btn) {
  currentSort = type;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const list = getFilteredProducts();

  if (list.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:60px 0; font-size:16px;">No products found 😕</div>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.05}s">
      <div class="product-img">
        ${p.badge ? `<div class="product-badge ${p.badge === 'New' ? 'new' : ''}">${p.badge}</div>` : ''}
        <button class="product-wishlist" id="wish-${p.id}" onclick="toggleWish(${p.id}, event)">♡</button>
        ${p.emoji}
      </div>
      <div class="product-info">
        <div class="product-cat">${p.cat}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <span class="stars">${'★'.repeat(Math.floor(p.rating))}${p.rating % 1 ? '☆' : ''}</span>
          <span class="rating-num">${p.rating} (${p.reviews})</span>
        </div>
        <div class="product-footer">
          <div class="product-price">
            ${formatPrice(p.price)}
            ${p.oldPrice ? `<span class="old-price">${formatPrice(p.oldPrice)}</span>` : ''}
          </div>
          <button class="add-cart" id="btn-${p.id}" onclick="handleAddToCart(${p.id})" title="Add to cart">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const footer    = document.getElementById('cartFooter');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="e-icon">🛒</div>
        <p>Your cart is empty.<br>Add some products!</p>
      </div>`;
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-icon">${item.emoji || '📦'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty(${item.cart_item_id}, -1, ${item.product_id})">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.cart_item_id}, 1, ${item.product_id})">+</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  document.getElementById('cartTotal').textContent = formatPrice(total);
}

// --- AUTH LOGIC ---
// --- AUTH LOGIC (Simplified, moved to auth.html) ---

function updateAuthUI(user) {
    const authActions = document.getElementById('authActions');
    const userProfile = document.getElementById('userProfile');
    const nameDisplay = document.getElementById('userNameDisplay');
    const adminLink = document.getElementById('adminLink');

    if (user) {
        if (authActions) authActions.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        if (nameDisplay) nameDisplay.innerText = user.name;
        if (adminLink) adminLink.style.display = user.role === 'admin' ? 'block' : 'none';
    } else {
        if (authActions) authActions.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
}

async function handleLogout() {
    await window.logoutUser(); // This triggers window reload via api.js
}

async function handleAddToCart(id) {
  const user = getCurrentUser();
  if (!user) {
      window.location.replace('auth.html');
      return;
  }

  const product  = products.find(p => p.id === id);
  
  try {
    console.log("Adding to cart API:", id);
    // Await API call
    await window.addToCart(id, 1);
    

    updateCartUI();

    const btn = document.getElementById(`btn-${id}`);
    btn.classList.add('added');
    btn.textContent = '✓';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.textContent = '+';
    }, 1200);

    showToast(`${product.name} added to cart!`);

    // Fetch the true latest cart from server
    await syncCart();

  } catch(err) {
      alert("Error adding to cart: " + err.message);
  }
}

async function changeQty(cartItemId, delta, productId) {
  const item = cart.find(c => c.product_id === productId) || cart.find(c => c.cart_item_id === cartItemId);
  if (!item) return;

  const newQty = item.qty + delta;
  try {
      if (newQty <= 0) {
        await window.removeFromCart(item.cart_item_id);
      } else {
        await window.updateCartItem(item.cart_item_id, newQty);
      }
      await syncCart();
    } catch(err) {
      alert("Failed to update cart: " + err.message);
  }
}

async function handleCheckout() {
  if (cart.length === 0) return alert("Cart is empty");
  
  try {
     const res = await window.placeOrder();
     cart = [];
     updateCartUI();
     toggleCart();
     // Show toast with link to view orders
     showToast('Order placed! <a href="orders.html" style="color:#000; font-weight:700; text-decoration:underline;">View Orders →</a>');
  } catch (err) {
      // Error handled by api.js
  }
}


function updateCartUI() {
  renderCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartCount').textContent = count;
}

async function syncCart() {
  const user = getCurrentUser();
  if(user) {
      cart = await window.loadCart();
      console.log("Cart fetched from server:", JSON.parse(JSON.stringify(cart)));
  } else {
      cart = [];
  }
  updateCartUI();
}





function toggleCart() {
  document.getElementById('cartDrawer').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

function toggleWish(id, e) {
  e.stopPropagation();
  const btn = document.getElementById(`wish-${id}`);
  btn.classList.toggle('liked');
  btn.textContent = btn.classList.contains('liked') ? '♥' : '♡';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').innerHTML = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}


function startTimer() {
  let total = (8 * 3600) + (24 * 60);

  setInterval(() => {
    total--;
    if (total < 0) total = 8 * 3600;

    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    document.getElementById('t-h').textContent = String(h).padStart(2, '0');
    document.getElementById('t-m').textContent = String(m).padStart(2, '0');
    document.getElementById('t-s').textContent = String(s).padStart(2, '0');
  }, 1000);
}
// --- INIT & SETUP ---
async function initApp() {
  try {
    // Check user session FIRST
    const user = await window.checkSession();
    if (!user) {
      window.location.replace('auth.html');
      return; // Stop execution
    }

    updateAuthUI(user);

    // Load products from API
    products = await window.loadProducts();
    renderProducts();

    // Sync cart from API
    await syncCart();
    
    startTimer();
  } catch (err) {
    console.error("Initialization error:", err);
    document.getElementById('productsGrid').innerHTML = `<p style="text-align:center;width:100%;">Error loading content from backend: ${err.message}</p>`;
  }
}

// Ensure the page waits for load
window.addEventListener('DOMContentLoaded', initApp);
