/* ========== Admin Page ========== */
function formatPrice(n) { return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m'; }
function showToast(msg, type = 'success') {
  const tc = document.getElementById('toastContainer'); if (!tc) return;
  const t = document.createElement('div'); t.className = 'toast' + (type === 'error' ? ' error' : ''); t.textContent = msg;
  tc.appendChild(t); setTimeout(() => t.remove(), 3000);
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (token) return { 'Authorization': 'Bearer ' + token };
  return { 'x-admin-key': 'admin-secret' };
}

document.addEventListener('DOMContentLoaded', () => {
  const loginPage = document.getElementById('adminLoginPage');
  const panelWrap = document.getElementById('adminPanelWrap');
  const loginForm = document.getElementById('adminLoginForm');
  const loginError = document.getElementById('loginError');

  // --- Check existing session ---
  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const res = await fetch('/api/profile', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) return false;
      const user = await res.json();
      return user.isAdmin === true;
    } catch { return false; }
  }

  async function init() {
    const isAdmin = await checkAuth();
    if (isAdmin) {
      showPanel();
    } else {
      loginPage.style.display = 'flex';
      panelWrap.style.display = 'none';
    }
  }

  function showPanel() {
    loginPage.style.display = 'none';
    panelWrap.style.display = 'block';
    initPanel();
  }

  // --- Login form ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type="submit"]');
    const fd = new FormData(loginForm);
    const username = fd.get('username');
    const password = fd.get('password');

    btn.disabled = true; btn.textContent = 'Tekshirilmoqda...';
    loginError.style.display = 'none';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = await res.json();

      if (!res.ok) {
        loginError.textContent = json.error || 'Login xatosi';
        loginError.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Kirish';
        return;
      }

      if (!json.user || !json.user.isAdmin) {
        loginError.textContent = 'Sizda admin huquqi yo\'q. Faqat admin foydalanuvchi kirishi mumkin.';
        loginError.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Kirish';
        return;
      }

      localStorage.setItem('token', json.token);
      localStorage.setItem('user', JSON.stringify(json.user));
      showToast('Admin paneliga xush kelibsiz!');
      showPanel();
    } catch (err) {
      loginError.textContent = 'Tarmoq xatosi';
      loginError.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Kirish';
    }
  });

  // --- Admin panel logic ---
  function initPanel() {
    const form = document.getElementById('productForm');
    const list = document.getElementById('adminProducts');

    // Mobile sidebar toggle
    const menuBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (menuBtn && sidebar && overlay) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      });
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

    // Logout
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.reload();
      });
    }

    async function fetchProducts() {
      try {
        const res = await fetch('/api/admin/products', { headers: getAuthHeaders() });
        if (!res.ok) { list.innerHTML = '<p style="color:var(--text-muted)">Yuklab bo\'lmadi</p>'; return; }
        const data = await res.json();
        document.getElementById('statProducts').textContent = data.length;
        const cats = new Set(data.map(p => p.category).filter(Boolean));
        document.getElementById('statCategories').textContent = cats.size;

        if (!data.length) { list.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><h3>Mahsulotlar yo\'q</h3></div>'; return; }

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
          const res = await fetch('/api/admin/products/' + encodeURIComponent(id), { method: 'DELETE', headers: getAuthHeaders() });
          if (res.ok) { showToast('O\'chirildi'); fetchProducts(); } else showToast('Xatolik', 'error');
        }));
      } catch (err) {
        list.innerHTML = '<p style="color:var(--text-muted)">Tarmoq xatosi</p>';
      }
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
        const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
        const res = await fetch('/api/admin/products', { method: 'POST', headers, body: JSON.stringify(payload) });
        if (res.ok) { showToast('Mahsulot yaratildi'); form.reset(); fetchProducts(); } else showToast('Yaratishda xatolik', 'error');
      } catch (err) { showToast('Tarmoq xatosi', 'error'); }
      btn.disabled = false; btn.textContent = 'Mahsulot yaratish';
    });

    fetchProducts();
  }

  init();
});
