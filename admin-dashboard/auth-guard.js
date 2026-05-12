import { auth } from '../js/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function requireAuth(onReady) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace('/admin-dashboard/login.html');
    } else {
      onReady(user);
    }
  });
}

export async function logout() {
  await signOut(auth);
  window.location.replace('/admin-dashboard/login.html');
}
