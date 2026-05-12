import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQNemcB9U0rUL6HfOoSdCZXVQ6sGvRyCs",
  authDomain: "pixon-9355a.firebaseapp.com",
  projectId: "pixon-9355a",
  storageBucket: "pixon-9355a.firebasestorage.app",
  messagingSenderId: "695080360388",
  appId: "1:695080360388:web:a1dfde4b8d792ad6de6c91",
  measurementId: "G-MC97H0DJD5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'default');
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
