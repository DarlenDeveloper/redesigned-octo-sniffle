// Auth guard
import { requireAuth, logout } from './auth-guard.js';
import { db, storage } from '../js/firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

requireAuth(() => {});

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Image preview
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const previews   = document.getElementById('imagePreviews');
let selectedFiles = [];

uploadArea.addEventListener('click', () => imageInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#286192';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '#e2e8f0';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#e2e8f0';
  handleFiles(e.dataTransfer.files);
});

imageInput.addEventListener('change', () => handleFiles(imageInput.files));

function handleFiles(files) {
  const newFiles = [...files];
  selectedFiles = [...selectedFiles, ...newFiles];
  newFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-thumb';
      img.title = file.name;
      previews.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

// Submit
document.getElementById('addPropertyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('Form submitted');

  const btn        = document.getElementById('submitBtn');
  const successMsg = document.getElementById('successMsg');
  const errorMsg   = document.getElementById('errorMsg');
  const form       = e.target;

  btn.disabled = true;
  btn.textContent = 'Saving...';
  successMsg.style.display = 'none';
  errorMsg.style.display   = 'none';

  try {
    // Upload images
    const imageUrls = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      btn.textContent = `Uploading image ${i + 1}/${selectedFiles.length}...`;
      console.log(`Uploading: ${file.name} (${file.size} bytes)`);
      const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
      const snapshot   = await uploadBytes(storageRef, file);
      console.log(`Uploaded: ${file.name}`);
      const url = await getDownloadURL(snapshot.ref);
      console.log(`URL: ${url}`);
      imageUrls.push(url);
    }

    btn.textContent = 'Saving to database...';
    console.log('Saving to Firestore...');

    // Collect amenities
    const amenities = [...form.querySelectorAll('input[name="amenities"]:checked')]
      .map(cb => cb.value);

    // Build property object
    const property = {
      title:       form.querySelector('[name="title"]').value.trim(),
      category:    form.querySelector('[name="category"]').value,
      type:        form.querySelector('[name="type"]').value,
      location:    form.querySelector('[name="location"]').value,
      price:       Number(form.querySelector('[name="price"]').value),
      priceLabel:  form.querySelector('[name="priceLabel"]').value,
      bedrooms:    Number(form.querySelector('[name="bedrooms"]').value) || 0,
      bathrooms:   Number(form.querySelector('[name="bathrooms"]').value) || 0,
      status:      form.querySelector('[name="status"]').value,
      availability: form.querySelector('[name="availability"]').value.trim(),
      description: form.querySelector('[name="description"]').value.trim(),
      amenities,
      images:      imageUrls,
      createdAt:   serverTimestamp(),
    };

    await addDoc(collection(db, 'properties'), property);
    console.log('Saved to Firestore successfully.');

    successMsg.style.display = 'block';
    form.reset();
    previews.innerHTML = '';
    selectedFiles = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error('Save failed:', err.code, err.message);
    errorMsg.textContent = `Error: ${err.message}`;
    errorMsg.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Property';
  }
});
