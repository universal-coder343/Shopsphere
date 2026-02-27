const products = [
  { id: 1,  name: 'Wireless Headphones Pro',  cat: 'electronics', price: 12499, oldPrice: 16599, rating: 4.8, reviews: 234, emoji: '🎧', badge: 'Sale' },
  { id: 2,  name: 'iPhone 15 Pro Case',        cat: 'electronics', price: 2449,  oldPrice: null,  rating: 4.5, reviews: 89,  emoji: '📱', badge: 'New' },
  { id: 3,  name: '4K Smart TV 55"',           cat: 'electronics', price: 58299, oldPrice: 74999, rating: 4.7, reviews: 156, emoji: '📺', badge: 'Sale' },
  { id: 4,  name: 'Mechanical Keyboard',       cat: 'electronics', price: 9899,  oldPrice: 12499, rating: 4.9, reviews: 312, emoji: '⌨️', badge: 'Sale' },
  { id: 5,  name: 'Premium Sneakers',          cat: 'clothes',     price: 10799, oldPrice: null,  rating: 4.6, reviews: 201, emoji: '👟', badge: 'New' },
  { id: 6,  name: 'Winter Hoodie',             cat: 'clothes',     price: 4949,  oldPrice: 6599,  rating: 4.4, reviews: 145, emoji: '🧥', badge: 'Sale' },
  { id: 7,  name: 'Linen Summer Dress',        cat: 'clothes',     price: 7449,  oldPrice: null,  rating: 4.7, reviews: 98,  emoji: '👗', badge: 'New' },
  { id: 8,  name: 'Slim Fit Jeans',            cat: 'clothes',     price: 6599,  oldPrice: 8299,  rating: 4.5, reviews: 267, emoji: '👖', badge: 'Sale' },
  { id: 9,  name: 'Air Fryer XL',              cat: 'home',        price: 7449,  oldPrice: 9999,  rating: 4.8, reviews: 445, emoji: '🫕', badge: 'Sale' },
  { id: 10, name: 'Robot Vacuum',              cat: 'home',        price: 24999, oldPrice: 33299, rating: 4.6, reviews: 332, emoji: '🤖', badge: 'Sale' },
  { id: 11, name: 'Coffee Machine',            cat: 'home',        price: 14999, oldPrice: null,  rating: 4.9, reviews: 189, emoji: '☕', badge: 'New' },
  { id: 12, name: 'Blender Pro 2000',          cat: 'home',        price: 5799,  oldPrice: 7449,  rating: 4.4, reviews: 122, emoji: '🌀', badge: 'Sale' },
  { id: 13, name: 'Vitamin C Serum',           cat: 'beauty',      price: 3299,  oldPrice: null,  rating: 4.7, reviews: 567, emoji: '💆', badge: 'New' },
  { id: 14, name: 'Perfume Luxe',              cat: 'beauty',      price: 8299,  oldPrice: 10799, rating: 4.8, reviews: 213, emoji: '🌸', badge: 'Sale' },
  { id: 15, name: 'Yoga Mat Pro',              cat: 'sports',      price: 4099,  oldPrice: null,  rating: 4.6, reviews: 178, emoji: '🧘', badge: 'New' },
  { id: 16, name: 'Smart Fitness Watch',       cat: 'sports',      price: 16599, oldPrice: 20799, rating: 4.7, reviews: 389, emoji: '⌚', badge: 'Sale' },
];

let cart            = [];
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
          <button class="add-cart" id="btn-${p.id}" onclick="addToCart(${p.id})" title="Add to cart">+</button>
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
      <div class="cart-item-icon">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  document.getElementById('cartTotal').textContent = formatPrice(total);
}

function addToCart(id) {
  const product  = products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCart();

  const btn = document.getElementById(`btn-${id}`);
  btn.classList.add('added');
  btn.textContent = '✓';
  setTimeout(() => {
    btn.classList.remove('added');
    btn.textContent = '+';
  }, 1200);

  showToast(`${product.name} added to cart!`);
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }

  updateCart();
}

function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartCount').textContent = count;
  renderCart();
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
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
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

renderProducts();
renderCart();
startTimer();