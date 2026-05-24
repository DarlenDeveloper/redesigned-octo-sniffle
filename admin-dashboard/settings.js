import { auth } from '../js/firebase-config.js';
import { requireAuth, logout } from './auth-guard.js';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

requireAuth((user) => {
  document.getElementById('adminEmail').textContent = user.email || 'Admin';
});

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
document.getElementById('logoutDangerBtn').addEventListener('click', logout);
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

document.getElementById('updatePwBtn').addEventListener('click', async () => {
  const currentPw = document.getElementById('currentPassword').value;
  const newPw     = document.getElementById('newPassword').value;
  const confPw    = document.getElementById('confirmPassword').value;
  const btn       = document.getElementById('updatePwBtn');
  const successMsg = document.getElementById('pwSuccess');
  const errorMsg = document.getElementById('pwError');

  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';

  // Validation
  if (!currentPw || !newPw || !confPw) {
    showError('Please fill in all fields.');
    return;
  }

  if (newPw.length < 6) {
    showError('New password must be at least 6 characters.');
    return;
  }

  if (newPw !== confPw) {
    showError('New passwords do not match.');
    return;
  }

  if (currentPw === newPw) {
    showError('New password must be different from current password.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Updating...';

  try {
    // First, re-authenticate with current password
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPw
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // If re-authentication succeeds, update to new password
    await updatePassword(auth.currentUser, newPw);
    
    // Success!
    successMsg.style.display = 'block';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 5000);
    
  } catch (err) {
    console.error('Password update error:', err);
    
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      showError('Current password is incorrect.');
    } else if (err.code === 'auth/weak-password') {
      showError('New password is too weak. Please use a stronger password.');
    } else if (err.code === 'auth/too-many-requests') {
      showError('Too many failed attempts. Please try again later.');
    } else {
      showError('Failed to update password. Please try again.');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bx bx-save"></i> Update Password';
  }
});

function showError(message) {
  const errorMsg = document.getElementById('pwError');
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  
  // Hide error after 5 seconds
  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 5000);
}
