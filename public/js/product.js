/* ========== Product Detail Page ========== */
const params = new URLSearchParams(location.search);
const id = params.get('id');
const container = document.getElementById('productDetail');

function getCart() { return JSON.parse(localStorage.getItem('premium_cart') || '[]'); }
function saveCart(c) { localStorage.setItem('premium_cart', JSON.stringify(c)); }
function updateCartCount() { const c = getCart().reduce((s, i) => s + (i.qty || 1), 0); document.querySelectorAll('#cartCount').forEach(el => el.textContent = c); }
function showToast(msg, type = 'success') {
  const tc = document.getElementById('toastContainer'); if (!tc) return;
  const t = document.createElement('div'); t.className = 'toast' + (type === 'error' ? ' error' : ''); t.textContent = msg;
  tc.appendChild(t); setTimeout(() => t.remove(), 3000);
}
function formatPrice(n) { return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m'; }
function renderStars(r) { const f = Math.floor(r || 0); return '★'.repeat(f) + '☆'.repeat(5 - f); }

function addToCart(product, qty = 1) {
  const cart = getCart();
  const pid = product._id || product.id;
  const idx = cart.findIndex(c => (c._id || c.id) === pid);
  if (idx === -1) cart.push({ ...product, qty }); else cart[idx].qty += qty;
  saveCart(cart); updateCartCount();
  showToast('Savatchaga qo\'shildi ✓');
}

async function load() {
  if (!id) { container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>Mahsulot topilmadi</h3></div>'; return; }
  // Skeleton
  container.innerHTML = '<div class="product-detail"><div class="skeleton" style="aspect-ratio:1;border-radius:12px"></div><div style="display:flex;flex-direction:column;gap:16px"><div class="skeleton" style="height:32px;width:80%;border-radius:8px"></div><div class="skeleton" style="height:20px;width:40%;border-radius:8px"></div><div class="skeleton" style="height:36px;width:50%;border-radius:8px"></div></div></div>';

  const res = await fetch('/api/products/' + encodeURIComponent(id));
  if (!res.ok) { container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>Mahsulot topilmadi</h3><a href="/" class="btn-primary" style="display:inline-flex;margin-top:12px">Bosh sahifaga</a></div>'; return; }
  const p = await res.json();

  // SEO
  try {
    document.title = `${p.title} — Premium Store`;
    const setMeta = (sel, attr, val) => { let el = document.querySelector(sel); if (el) el[attr] = val; };
    setMeta('meta[name="description"]', 'content', (p.description || '').substring(0, 160));
    setMeta('meta[property="og:title"]', 'content', p.title);
    setMeta('meta[property="og:description"]', 'content', (p.description || '').substring(0, 200));
    const ld = { '@context': 'https://schema.org/', '@type': 'Product', name: p.title, image: [p.image || ''], description: p.description || '', sku: p._id || p.id || '', offers: { '@type': 'Offer', url: location.href, priceCurrency: 'UZS', price: p.price || 0, availability: 'http://schema.org/InStock' } };
    const script = document.getElementById('productJsonLd'); if (script) script.textContent = JSON.stringify(ld);
  } catch (e) { /* ignore */ }

  // Breadcrumb
  const bc = document.getElementById('breadcrumb');
  if (bc) bc.innerHTML = `<a href="/">Bosh sahifa</a> <span>/</span> ${p.category ? `<a href="/?cat=${encodeURIComponent(p.category)}">${p.category}</a> <span>/</span>` : ''} <span>${p.title}</span>`;

  render(p);
}

function render(p) {
  const pid = p._id || p.id;
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  container.innerHTML = `
    <div class="product-detail">
      <div class="product-gallery">
        <img src="${p.image || 'https://picsum.photos/seed/p' + pid + '/600/600'}" alt="${p.title}">
      </div>
      <div class="product-info">
        <h1>${p.title}</h1>
        <div class="meta">
          <span style="color:var(--orange)">${renderStars(p.rating)}</span>
          <span>${p.rating || 0} / 5</span>
          <span>•</span>
          <span>${p.reviews || 0} sharh</span>
          ${p.category ? `<span class="badge badge-accent">${p.category}</span>` : ''}
        </div>
        <div>
          <span class="detail-price">${formatPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="detail-old">${formatPrice(p.oldPrice)}</span><span class="badge badge-red" style="margin-left:8px">-${discount}%</span>` : ''}
        </div>
        ${p.description ? `<p class="desc">${p.description}</p>` : ''}
        <div class="qty-selector">
          <button id="qtyMinus">−</button>
          <input id="qtyInput" type="number" value="1" min="1" max="99">
          <button id="qtyPlus">+</button>
        </div>
        <div class="detail-actions">
          <button id="addCartBtn" class="btn-primary">🛒 Savatchaga qo'shish</button>
          <button id="buyNowBtn" class="btn-outline">⚡ Hozir sotib olish</button>
        </div>
      </div>
    </div>`;

  // Qty controls
  const qtyInput = document.getElementById('qtyInput');
  document.getElementById('qtyMinus').addEventListener('click', () => { qtyInput.value = Math.max(1, +qtyInput.value - 1); });
  document.getElementById('qtyPlus').addEventListener('click', () => { qtyInput.value = Math.min(99, +qtyInput.value + 1); });
  document.getElementById('addCartBtn').addEventListener('click', () => addToCart(p, +qtyInput.value || 1));
  document.getElementById('buyNowBtn').addEventListener('click', () => { addToCart(p, +qtyInput.value || 1); location.href = '/cart.html'; });
}

document.addEventListener('DOMContentLoaded', () => {
  load(); updateCartCount();
  const lb = document.getElementById('loginBtn');
  if (lb) lb.addEventListener('click', () => { location.href = localStorage.getItem('token') ? '/profile.html' : '/login.html'; });
});

export {};
