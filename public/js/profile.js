/* ========== Profile Page ========== */
function formatPrice(n) { return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m'; }
function updateCartCount() { const c = JSON.parse(localStorage.getItem('premium_cart') || '[]').reduce((s, i) => s + (i.qty || 1), 0); document.querySelectorAll('#cartCount').forEach(el => el.textContent = c); }

document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();
  const token = localStorage.getItem('token');
  if (!token) { location.href = '/login.html'; return; }

  // Profile
  try {
    const pRes = await fetch('/api/profile', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!pRes.ok) { localStorage.removeItem('token'); location.href = '/login.html'; return; }
    const profile = await pRes.json();
    document.getElementById('avatarLetter').textContent = (profile.username || 'U')[0].toUpperCase();
    document.getElementById('userName').textContent = profile.username || profile.name || '—';
    document.getElementById('userEmail').textContent = profile.email || '—';
  } catch (e) { localStorage.removeItem('token'); location.href = '/login.html'; return; }

  // Orders
  const ordersList = document.getElementById('ordersList');
  try {
    const oRes = await fetch('/api/orders/me', { headers: { 'Authorization': 'Bearer ' + token } });
    if (oRes.ok) {
      const orders = await oRes.json();
      if (!orders.length) {
        ordersList.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><h3>Buyurtmalar yo\'q</h3><p>Hali buyurtma bermadingiz</p><a href="/" class="btn-primary" style="display:inline-flex;margin-top:12px">Xarid qilish</a></div>';
      } else {
        const statusMap = { pending: ['Kutilmoqda', 'badge-accent'], processing: ['Jarayonda', 'badge-accent'], delivered: ['Yetkazildi', 'badge-green'], cancelled: ['Bekor qilindi', 'badge-red'] };
        ordersList.innerHTML = `<table class="admin-table"><thead><tr><th>Buyurtma</th><th>Mahsulotlar</th><th>Jami</th><th>Holat</th></tr></thead><tbody>${orders.map(o => {
          const [label, cls] = statusMap[o.status] || ['Kutilmoqda', 'badge-accent'];
          const count = (o.items || []).reduce((s, i) => s + (i.qty || 1), 0);
          return `<tr style="cursor:pointer" data-href="/buyer.html?id=${o._id || o.id}"><td><strong>#${(o._id || o.id || '').slice(-6)}</strong></td><td>${count} ta mahsulot</td><td>${formatPrice(o.total)}</td><td><span class="badge ${cls}">${label}</span></td></tr>`;
        }).join('')}</tbody></table>`;
        ordersList.querySelectorAll('tr[data-href]').forEach(tr => tr.addEventListener('click', () => location.href = tr.dataset.href));
      }
    } else ordersList.innerHTML = '<p style="color:var(--text-muted)">Buyurtmalarni yuklashda xatolik</p>';
  } catch (e) { ordersList.innerHTML = '<p style="color:var(--text-muted)">Tarmoq xatosi</p>'; }

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    location.href = '/';
  });
});
