import { auth } from '../js/firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = '/admin-dashboard/index.html';
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('loginBtn');
  const errorMsg = document.getElementById('errorMsg');

  btn.disabled = true;
  btn.textContent = 'Signing in...';
  errorMsg.style.display = 'none';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = '/admin-dashboard/index.html';
  } catch (err) {
    const messages = {
      'auth/user-not-found':  'No account found with this email.',
      'auth/wrong-password':  'Incorrect password.',
      'auth/invalid-email':   'Invalid email address.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    errorMsg.textContent = messages[err.code] || 'Login failed. Please try again.';
    errorMsg.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});
