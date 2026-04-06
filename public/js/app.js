/* ========== Premium Store — Main App ========== */

// --- Helpers ---
function getCart() { return JSON.parse(localStorage.getItem('premium_cart') || '[]'); }
function saveCart(cart) { localStorage.setItem('premium_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() {
  const c = getCart().reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = c);
}
function showToast(msg, type = 'success') {
  const tc = document.getElementById('toastContainer');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
function formatPrice(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m';
}
function renderStars(rating) {
  const full = Math.floor(rating || 0);
  const half = (rating || 0) - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const pid = product._id || product.id;
  const idx = cart.findIndex(c => (c._id || c.id) === pid);
  if (idx === -1) cart.push({ ...product, qty });
  else cart[idx].qty += qty;
  saveCart(cart);
  showToast('Savatchaga qo\'shildi ✓');
}

// --- State ---
let currentCat = '';
let currentQ = '';
let currentPage = 1;
let totalProducts = 0;
const LIMIT = 12;

// --- API ---
async function fetchProducts(q = '', cat = '', page = 1) {
  const params = new URLSearchParams({ q, category: cat, page, limit: LIMIT });
  const res = await fetch('/api/products?' + params.toString());
  return res.json();
}

// --- Rendering ---
function createProductCard(p) {
  const pid = p._id || p.id;
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const card = document.createElement('article');
  card.className = 'product-card';
  card.innerHTML = `
    <a href="/product.html?id=${encodeURIComponent(pid)}" class="img-wrap">
      <img src="${p.image || 'https://picsum.photos/seed/p' + pid + '/400/400'}" alt="${p.title}" loading="lazy" decoding="async">
      ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
    </a>
    <div class="card-body">
      <a href="/product.html?id=${encodeURIComponent(pid)}" class="card-title">${p.title}</a>
      <div class="rating">
        <span class="stars">${renderStars(p.rating)}</span>
        <span>${p.reviews || 0} sharh</span>
      </div>
      <div class="price-row">
        <span class="current-price">${formatPrice(p.price)}</span>
        ${p.oldPrice ? `<span class="old-price">${formatPrice(p.oldPrice)}</span>` : ''}
      </div>
    </div>
    <div class="card-actions">
      <button class="add-cart-btn">🛒 Savatchaga</button>
    </div>
  `;
  card.querySelector('.add-cart-btn').addEventListener('click', (e) => { e.preventDefault(); addToCart(p); });
  return card;
}

function renderProducts(products, append = false) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  if (!append) grid.innerHTML = '';
  if (!products.length && !append) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><h3>Mahsulot topilmadi</h3><p>Boshqa kalit so\'z bilan qidirib ko\'ring</p></div>';
    return;
  }
  products.forEach(p => grid.appendChild(createProductCard(p)));
}

async function loadProducts(q = '', cat = '', page = 1, append = false) {
  const grid = document.getElementById('productsGrid');
  if (!append && grid) {
    grid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const sk = document.createElement('div');
      sk.style.cssText = 'aspect-ratio:1;border-radius:12px';
      sk.className = 'skeleton';
      grid.appendChild(sk);
    }
  }
  const res = await fetchProducts(q, cat, page);
  totalProducts = res.total || 0;
  currentPage = res.page || 1;
  const products = res.products || [];
  renderProducts(products, append);

  const countEl = document.getElementById('productCount');
  if (countEl) countEl.textContent = totalProducts + ' ta mahsulot';

  const wrap = document.getElementById('loadMoreWrap');
  if (wrap) wrap.style.display = (currentPage * LIMIT < totalProducts) ? 'block' : 'none';
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  // Read category from URL
  const urlParams = new URLSearchParams(location.search);
  currentCat = urlParams.get('cat') || '';
  currentQ = urlParams.get('q') || '';

  loadProducts(currentQ, currentCat, 1);
  updateCartCount();

  // Search
  let searchTimer;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    if (currentQ) searchInput.value = currentQ;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { currentQ = e.target.value; currentPage = 1; loadProducts(currentQ, currentCat, 1); }, 300);
    });
  }

  // Categories
  const catList = document.getElementById('categoriesList');
  if (catList) {
    catList.querySelectorAll('.cat-chip').forEach(chip => {
      if (chip.dataset.cat === currentCat) { catList.querySelector('.cat-chip.active')?.classList.remove('active'); chip.classList.add('active'); }
      chip.addEventListener('click', () => {
        catList.querySelector('.cat-chip.active')?.classList.remove('active');
        chip.classList.add('active');
        currentCat = chip.dataset.cat;
        currentPage = 1;
        const title = document.getElementById('sectionTitle');
        if (title) title.textContent = currentCat ? chip.textContent.trim() : 'Barcha mahsulotlar';
        loadProducts(currentQ, currentCat, 1);
      });
    });
  }

  // Load more
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => { currentPage++; loadProducts(currentQ, currentCat, currentPage, true); });
  }

  // Login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const token = localStorage.getItem('token');
      location.href = token ? '/profile.html' : '/login.html';
    });
  }
});

export {};
