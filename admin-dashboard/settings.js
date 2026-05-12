import { auth } from '../js/firebase-config.js';
import { requireAuth, logout } from './auth-guard.js';
import { updatePassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

requireAuth((user) => {
  document.getElementById('adminEmail').textContent = user.email || 'Admin';
});

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
document.getElementById('logoutDangerBtn').addEventListener('click', logout);
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

document.getElementById('updatePwBtn').addEventListener('click', async () => {
  const newPw  = document.getElementById('newPassword').value;
  const confPw = document.getElementById('confirmPassword').value;
  const btn    = document.getElementById('updatePwBtn');
  const msg    = document.getElementById('pwSuccess');

  msg.style.display = 'none';

  if (newPw.length < 6) { alert('Password must be at least 6 characters.'); return; }
  if (newPw !== confPw)  { alert('Passwords do not match.'); return; }

  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    await updatePassword(auth.currentUser, newPw);
    msg.style.display = 'block';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (err) {
    if (err.code === 'auth/requires-recent-login') {
      alert('Session expired. Please log out and log back in to change your password.');
    } else {
      alert('Failed to update password.');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
});
