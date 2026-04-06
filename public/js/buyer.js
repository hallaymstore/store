/* ========== Order Confirmation Page ========== */
function formatPrice(n) { return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m'; }

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const el = document.getElementById('orderInfo');
  if (!id) { el.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>Buyurtma ID topilmadi</h3><a href="/" class="btn-primary" style="display:inline-flex;margin-top:12px">Bosh sahifaga</a></div>'; return; }
  try {
    const res = await fetch('/api/orders/guest/' + encodeURIComponent(id));
    if (!res.ok) { el.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>Buyurtma topilmadi</h3></div>'; return; }
    const o = await res.json();
    const statusMap = { pending: ['Kutilmoqda', 'badge-accent', '⏳'], processing: ['Jarayonda', 'badge-accent', '🔄'], delivered: ['Yetkazildi', 'badge-green', '✅'], cancelled: ['Bekor qilindi', 'badge-red', '❌'] };
    const [statusLabel, statusCls, statusIcon] = statusMap[o.status] || ['Kutilmoqda', 'badge-accent', '⏳'];
    const itemsHtml = (o.items || []).map(it => `
      <div class="cart-item">
        <img src="${it.image || 'https://picsum.photos/seed/p' + (it._id || it.id) + '/100/100'}" alt="${it.title}">
        <div class="cart-item-info">
          <div class="cart-item-title">${it.title}</div>
          <div style="color:var(--text-muted);font-size:13px">${it.qty || 1} × ${formatPrice(it.price)}</div>
        </div>
        <div class="cart-item-price">${formatPrice((it.qty || 1) * (it.price || 0))}</div>
      </div>`).join('');

    el.innerHTML = `
      <div style="text-align:center;margin-bottom:32px">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <h1 style="font-size:24px;margin-bottom:8px">Buyurtma qabul qilindi!</h1>
        <p style="color:var(--text-secondary)">Buyurtma raqami: <strong>#${(o._id || o.id || '').slice(-6)}</strong></p>
      </div>
      <div style="background:var(--bg-white);border-radius:var(--radius-lg);padding:24px;border:1px solid var(--border-light)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-size:16px">Buyurtma tafsilotlari</h3>
          <span class="badge ${statusCls}">${statusIcon} ${statusLabel}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">${itemsHtml}</div>
        <div style="border-top:1px solid var(--border);padding-top:12px;display:flex;justify-content:space-between;font-size:18px;font-weight:700">
          <span>Jami</span><span>${formatPrice(o.total)}</span>
        </div>
        ${o.shipping ? `<div style="margin-top:16px;padding:12px;background:var(--bg);border-radius:var(--radius-sm);font-size:14px;color:var(--text-secondary)">
          📍 ${o.shipping.name || ''} ${o.shipping.phone ? '• ' + o.shipping.phone : ''} ${o.shipping.address ? '• ' + o.shipping.address : ''} ${o.shipping.city ? ', ' + o.shipping.city : ''}
        </div>` : ''}
      </div>
      <div style="text-align:center;margin-top:24px">
        <a href="/" class="btn-primary" style="display:inline-flex">Xaridni davom ettirish</a>
      </div>`;
  } catch (e) { el.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><h3>Xatolik: ' + e.message + '</h3></div>'; }
});
