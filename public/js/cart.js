/* ========== Cart Page ========== */
function getCart() { return JSON.parse(localStorage.getItem('premium_cart') || '[]'); }
function saveCart(c) { localStorage.setItem('premium_cart', JSON.stringify(c)); updateCartCount(); }
function updateCartCount() { const c = getCart().reduce((s, i) => s + (i.qty || 1), 0); document.querySelectorAll('#cartCount').forEach(el => el.textContent = c); }
function formatPrice(n) { return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m'; }
function showToast(msg, type = 'success') {
  const tc = document.getElementById('toastContainer'); if (!tc) return;
  const t = document.createElement('div'); t.className = 'toast' + (type === 'error' ? ' error' : ''); t.textContent = msg;
  tc.appendChild(t); setTimeout(() => t.remove(), 3000);
}

function renderCart() {
  const area = document.getElementById('cartArea');
  const cart = getCart();
  if (!cart.length) {
    area.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></div><h3>Savatcha bo\'sh</h3><p>Mahsulotlar qo\'shish uchun bosh sahifaga o\'ting</p><a href="/" class="btn-primary" style="display:inline-flex;margin-top:16px">Xarid qilish</a></div>';
    return;
  }
  const total = cart.reduce((s, i) => s + (i.qty || 1) * (i.price || 0), 0);
  const count = cart.reduce((s, i) => s + (i.qty || 1), 0);

  let itemsHtml = cart.map((it, idx) => {
    const pid = it._id || it.id;
    return `<div class="cart-item">
      <a href="/product.html?id=${encodeURIComponent(pid)}"><img src="${it.image || 'https://picsum.photos/seed/p' + pid + '/200/200'}" alt="${it.title}"></a>
      <div class="cart-item-info">
        <div class="cart-item-title"><a href="/product.html?id=${encodeURIComponent(pid)}">${it.title}</a></div>
        <div class="cart-item-price">${formatPrice(it.price)}</div>
      </div>
      <div class="qty-selector">
        <button data-idx="${idx}" data-dir="-1" class="qty-change">−</button>
        <input data-idx="${idx}" class="qty-input" type="number" value="${it.qty || 1}" min="1" max="99" readonly>
        <button data-idx="${idx}" data-dir="1" class="qty-change">+</button>
      </div>
      <div style="font-weight:700;min-width:100px;text-align:right">${formatPrice((it.qty || 1) * (it.price || 0))}</div>
      <button data-idx="${idx}" class="remove-btn btn-ghost" title="O'chirish"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>`;
  }).join('');

  area.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items-list">${itemsHtml}</div>
      <div class="cart-summary">
        <h3>Buyurtma xulosasi</h3>
        <div class="summary-row"><span>Mahsulotlar (${count})</span><span>${formatPrice(total)}</span></div>
        <div class="summary-row"><span>Yetkazib berish</span><span style="color:var(--green)">Bepul</span></div>
        <div class="summary-row total"><span>Jami</span><span>${formatPrice(total)}</span></div>
        <form id="checkoutForm" style="margin-top:20px">
          <div class="form-group"><label>Ism</label><input name="name" required placeholder="To'liq ismingiz"></div>
          <div class="form-group"><label>Telefon</label><input name="phone" required placeholder="+998 90 123 45 67"></div>
          <div class="form-group"><label>Manzil</label><input name="address" required placeholder="Yetkazib berish manzili"></div>
          <div class="form-group"><label>Shahar</label><input name="city" placeholder="Shahar nomi"></div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:8px">Buyurtma berish</button>
        </form>
      </div>
    </div>`;

  // Events
  area.querySelectorAll('.qty-change').forEach(btn => btn.addEventListener('click', (e) => {
    const idx = +e.target.dataset.idx; const dir = +e.target.dataset.dir;
    const cart = getCart();
    cart[idx].qty = Math.max(1, Math.min(99, (cart[idx].qty || 1) + dir));
    saveCart(cart); renderCart();
  }));
  area.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', (e) => {
    const idx = +e.target.dataset.idx;
    const cart = getCart(); cart.splice(idx, 1); saveCart(cart); renderCart();
    showToast('Mahsulot o\'chirildi');
  }));
  document.getElementById('checkoutForm').addEventListener('submit', checkout);
}

async function checkout(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const items = getCart();
  if (!items.length) { showToast('Savatcha bo\'sh', 'error'); return; }
  const total = items.reduce((s, i) => s + (i.qty || 1) * (i.price || 0), 0);
  const payload = { items, total, shipping: { name: fd.get('name'), phone: fd.get('phone'), address: fd.get('address'), city: fd.get('city') }, status: 'pending' };
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  try {
    const res = await fetch('/api/orders', { method: 'POST', headers, body: JSON.stringify(payload) });
    const json = await res.json();
    if (res.ok && json.id) {
      localStorage.removeItem('premium_cart'); updateCartCount();
      location.href = '/buyer.html?id=' + encodeURIComponent(json.id);
    } else showToast(json.error || 'Xatolik yuz berdi', 'error');
  } catch (err) { showToast('Tarmoq xatosi', 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart(); updateCartCount();
  const lb = document.getElementById('loginBtn');
  if (lb) lb.addEventListener('click', () => { location.href = localStorage.getItem('token') ? '/profile.html' : '/login.html'; });
});

export {};
