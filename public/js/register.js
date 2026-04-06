/* ========== Register Page ========== */
function showToast(msg, type = 'success') {
  const tc = document.getElementById('toastContainer'); if (!tc) return;
  const t = document.createElement('div'); t.className = 'toast' + (type === 'error' ? ' error' : ''); t.textContent = msg;
  tc.appendChild(t); setTimeout(() => t.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) { location.href = '/profile.html'; return; }
  const form = document.getElementById('regForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Yaratilmoqda...';
    const fd = new FormData(form);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: fd.get('username'), password: fd.get('password'), email: fd.get('email') }) });
      const json = await res.json();
      if (res.ok && json.token) {
        localStorage.setItem('token', json.token);
        localStorage.setItem('user', JSON.stringify(json.user || {}));
        showToast('Hisob yaratildi!');
        setTimeout(() => location.href = '/', 500);
      } else {
        showToast(json.error || 'Xatolik', 'error');
        btn.disabled = false; btn.textContent = 'Ro\'yxatdan o\'tish';
      }
    } catch (err) {
      showToast('Tarmoq xatosi', 'error');
      btn.disabled = false; btn.textContent = 'Ro\'yxatdan o\'tish';
    }
  });
});
