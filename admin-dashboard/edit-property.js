import { db, storage } from '../js/firebase-config.js';
import { requireAuth, logout } from './auth-guard.js';
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const params = new URLSearchParams(window.location.search);
const propertyId = params.get('id');
let existingImages = [];
let newFiles = [];

requireAuth(() => {
  if (!propertyId) {
    window.location.href = '/admin-dashboard/properties.html';
    return;
  }
  loadProperty();
});

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

async function loadProperty() {
  try {
    const snap = await getDoc(doc(db, 'properties', propertyId));
    if (!snap.exists()) { window.location.href = 'properties.html'; return; }

    const p = snap.data();
    const form = document.getElementById('editPropertyForm');
    existingImages = p.images || [];

    // Populate fields
    form.querySelector('[name="title"]').value       = p.title || '';
    form.querySelector('[name="category"]').value    = p.category || 'buy';
    form.querySelector('[name="type"]').value        = p.type || 'Apartment';
    form.querySelector('[name="location"]').value    = p.location || 'Kampala';
    form.querySelector('[name="currency"]').value    = p.currency || 'UGX';
    form.querySelector('[name="price"]').value       = p.price || '';
    form.querySelector('[name="priceLabel"]').value  = p.priceLabel || 'per month';
    form.querySelector('[name="bedrooms"]').value    = p.bedrooms || '';
    form.querySelector('[name="bathrooms"]').value   = p.bathrooms || '';
    form.querySelector('[name="status"]').value      = p.status || 'Active';
    form.querySelector('[name="availability"]').value = p.availability || '';
    form.querySelector('[name="description"]').value = p.description || '';
    
    // Update currency label
    const currencyLabel = document.getElementById('editPriceCurrency');
    if (currencyLabel) {
      currencyLabel.textContent = `(${p.currency || 'UGX'})`;
    }
    
    // Add currency change listener
    const currencySelect = form.querySelector('[name="currency"]');
    if (currencySelect) {
      currencySelect.addEventListener('change', () => {
        if (currencyLabel) {
          currencyLabel.textContent = `(${currencySelect.value})`;
        }
      });
    }

    // Amenities
    if (p.amenities) {
      form.querySelectorAll('input[name="amenities"]').forEach(cb => {
        cb.checked = p.amenities.includes(cb.value);
      });
    }

    // Show existing images
    const previews = document.getElementById('imagePreviews');
    existingImages.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.className = 'preview-thumb';
      previews.appendChild(img);
    });

  } catch (err) {
    console.error(err);
  }
}

// Image upload
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
uploadArea.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', () => {
  newFiles = [...imageInput.files];
  const previews = document.getElementById('imagePreviews');
  newFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-thumb';
      img.style.border = '2px solid #286192';
      previews.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// Submit
document.getElementById('editPropertyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn        = document.getElementById('submitBtn');
  const successMsg = document.getElementById('successMsg');
  const errorMsg   = document.getElementById('errorMsg');
  const form       = e.target;

  btn.disabled = true;
  btn.textContent = 'Saving...';
  successMsg.style.display = 'none';
  errorMsg.style.display   = 'none';

  try {
    // Upload new images
    const newUrls = [];
    for (const file of newFiles) {
      const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
      const snapshot   = await uploadBytes(storageRef, file);
      const url        = await getDownloadURL(snapshot.ref);
      newUrls.push(url);
    }

    const amenities = [...form.querySelectorAll('input[name="amenities"]:checked')].map(cb => cb.value);

    await updateDoc(doc(db, 'properties', propertyId), {
      title:       form.querySelector('[name="title"]').value.trim(),
      category:    form.querySelector('[name="category"]').value,
      type:        form.querySelector('[name="type"]').value,
      location:    form.querySelector('[name="location"]').value,
      currency:    form.querySelector('[name="currency"]').value,
      price:       Number(form.querySelector('[name="price"]').value),
      priceLabel:  form.querySelector('[name="priceLabel"]').value,
      bedrooms:    Number(form.querySelector('[name="bedrooms"]').value) || 0,
      bathrooms:   Number(form.querySelector('[name="bathrooms"]').value) || 0,
      status:      form.querySelector('[name="status"]').value,
      availability: form.querySelector('[name="availability"]').value.trim(),
      description: form.querySelector('[name="description"]').value.trim(),
      amenities,
      images:      [...existingImages, ...newUrls],
      updatedAt:   serverTimestamp(),
    });

    successMsg.style.display = 'block';
    newFiles = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error(err);
    errorMsg.textContent = 'Failed to update property.';
    errorMsg.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
});
