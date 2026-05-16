import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQNemcB9U0rUL6HfOoSdCZXVQ6sGvRyCs",
  authDomain: "pixon-9355a.firebaseapp.com",
  projectId: "pixon-9355a",
  storageBucket: "pixon-9355a.firebasestorage.app",
  messagingSenderId: "695080360388",
  appId: "1:695080360388:web:a1dfde4b8d792ad6de6c91"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'default');

async function test() {
  console.log("Testing with named db 'default'...");
  try {
    const docRef = doc(db, 'properties', 'testing');
    const snapshot = await getDoc(docRef);
    console.log("Exists:", snapshot.exists());
    if (snapshot.exists()) console.log(snapshot.data());
  } catch(e) { console.error("Error:", e.message); }
  
  console.log("Testing with default db...");
  try {
    const db2 = getFirestore(app);
    const docRef2 = doc(db2, 'properties', 'testing');
    const snapshot2 = await getDoc(docRef2);
    console.log("Exists:", snapshot2.exists());
    if (snapshot2.exists()) console.log(snapshot2.data());
  } catch(e) { console.error("Error:", e.message); }
  process.exit();
}
test();
