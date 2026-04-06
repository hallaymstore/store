/* ========== Order Confirmation Page ========== */
function formatPrice(n) { return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m'; }

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const el = document.getElementById('orderInfo');
  if (!id) { el.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>Buyurtma ID topilmadi</h3><a href="/" class="btn-primary" style="display:inline-flex;margin-top:12px">Bosh sahifaga</a></div>'; return; }
  try {
    const res = await fetch('/api/orders/guest/' + encodeURIComponent(id));
    if (!res.ok) { el.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>Buyurtma topilmadi</h3></div>'; return; }
    const o = await res.json();
    const statusMap = { pending: ['Kutilmoqda', 'badge-accent', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'], processing: ['Jarayonda', 'badge-accent', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>'], delivered: ['Yetkazildi', 'badge-green', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'], cancelled: ['Bekor qilindi', 'badge-red', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'] };
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
        <div style="font-size:48px;margin-bottom:12px"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ${o.shipping.name || ''} ${o.shipping.phone ? '• ' + o.shipping.phone : ''} ${o.shipping.address ? '• ' + o.shipping.address : ''} ${o.shipping.city ? ', ' + o.shipping.city : ''}
        </div>` : ''}
      </div>
      <div style="text-align:center;margin-top:24px">
        <a href="/" class="btn-primary" style="display:inline-flex">Xaridni davom ettirish</a>
      </div>`;
  } catch (e) { el.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3>Xatolik: ' + e.message + '</h3></div>'; }
});
