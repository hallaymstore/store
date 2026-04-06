/* ========== Admin Page ========== */
function formatPrice(n) { return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m'; }
function showToast(msg, type = 'success') {
  const tc = document.getElementById('toastContainer'); if (!tc) return;
  const t = document.createElement('div'); t.className = 'toast' + (type === 'error' ? ' error' : ''); t.textContent = msg;
  tc.appendChild(t); setTimeout(() => t.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('productForm');
  const list = document.getElementById('adminProducts');

  async function fetchProducts() {
    const res = await fetch('/api/admin/products', { headers: { 'x-admin-key': 'admin-secret' } });
    if (!res.ok) { list.innerHTML = '<p style="color:var(--text-muted)">Yuklab bo\'lmadi</p>'; return; }
    const data = await res.json();
    // Stats
    document.getElementById('statProducts').textContent = data.length;
    const cats = new Set(data.map(p => p.category).filter(Boolean));
    document.getElementById('statCategories').textContent = cats.size;

    if (!data.length) { list.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><h3>Mahsulotlar yo\'q</h3></div>'; return; }

    list.innerHTML = `<table class="admin-table"><thead><tr><th>Rasm</th><th>Nomi</th><th>Kategoriya</th><th>Narxi</th><th>Amallar</th></tr></thead><tbody>${data.map(p => `<tr>
      <td><img src="${p.image || 'https://picsum.photos/seed/p' + (p._id || p.id) + '/100/100'}" alt="${p.title}"></td>
      <td><strong>${p.title}</strong></td>
      <td><span class="badge badge-accent">${p.category || '—'}</span></td>
      <td>${formatPrice(p.price)}</td>
      <td><button class="btn-danger btn-sm delete-btn" data-id="${p._id || p.id}">O'chirish</button></td>
    </tr>`).join('')}</tbody></table>`;

    list.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('Bu mahsulotni o\'chirmoqchimisiz?')) return;
      const id = btn.dataset.id;
      const res = await fetch('/api/admin/products/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'x-admin-key': 'admin-secret' } });
      if (res.ok) { showToast('O\'chirildi'); fetchProducts(); } else showToast('Xatolik', 'error');
    }));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Yaratilmoqda...';
    const fd = new FormData(form);
    const file = fd.get('image');
    let imageUrl = '';
    if (file && file.size) {
      const upload = new FormData(); upload.append('image', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: upload });
        const json = await res.json();
        imageUrl = json.url || '';
      } catch (e) { /* ignore upload error */ }
    }
    const payload = {
      title: fd.get('title'), price: Number(fd.get('price')), oldPrice: fd.get('oldPrice') ? Number(fd.get('oldPrice')) : undefined,
      category: fd.get('category'), description: fd.get('description'), image: imageUrl
    };
    try {
      const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'admin-secret' }, body: JSON.stringify(payload) });
      if (res.ok) { showToast('Mahsulot yaratildi ✓'); form.reset(); fetchProducts(); } else showToast('Yaratishda xatolik', 'error');
    } catch (err) { showToast('Tarmoq xatosi', 'error'); }
    btn.disabled = false; btn.textContent = 'Mahsulot yaratish';
  });

  fetchProducts();
});
