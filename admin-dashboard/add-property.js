// Auth guard
import { requireAuth, logout } from './auth-guard.js';
import { db, storage } from '../js/firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

requireAuth(() => {
  initializeForm();
});

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

function initializeForm() {
  // Progressive Form Logic
  let currentStep = 1;
  const totalSteps = 4;

  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const submitBtn = document.getElementById('submitBtn');

  if (!nextBtn || !prevBtn || !submitBtn) {
    console.error('Form buttons not found');
    return;
  }

  nextBtn.addEventListener('click', () => {
    if (validateStep(currentStep)) {
      currentStep++;
      showStep(currentStep);
    }
  });

  prevBtn.addEventListener('click', () => {
    currentStep--;
    showStep(currentStep);
  });

  function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => {
      s.classList.remove('active', 'completed');
    });

    // Show current step
    document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');

    // Mark completed steps
    for (let i = 1; i < step; i++) {
      document.querySelector(`.step[data-step="${i}"]`).classList.add('completed');
    }

    // Button visibility
    prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
    nextBtn.style.display = step === totalSteps ? 'none' : 'inline-block';
    submitBtn.style.display = step === totalSteps ? 'inline-block' : 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(step) {
    const currentStepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    const requiredFields = currentStepEl.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
      if (!field.value.trim()) {
        field.focus();
        alert('Please fill in all required fields');
        return false;
      }
    }
    
    // Step 3: Validate at least one amenity is selected
    if (step === 3) {
      const checkedAmenities = document.querySelectorAll('input[name="amenities"]:checked');
      if (checkedAmenities.length === 0) {
        alert('Please select at least one amenity');
        return false;
      }
    }
    
    // Step 4: Validate at least one image is uploaded
    if (step === 4) {
      if (selectedFiles.length === 0) {
        alert('Please upload at least one property image');
        return false;
      }
    }
    
    return true;
  }

  // Dynamic field visibility based on category and type
  const categorySelect = document.getElementById('categorySelect');
  const typeSelect = document.getElementById('typeSelect');
  const priceLabelSelect = document.getElementById('priceLabelSelect');
  const customTypeGroup = document.getElementById('customTypeGroup');
  const customTypeInput = document.getElementById('customTypeInput');
  const currencySelect = document.querySelector('[name="currency"]');

  if (categorySelect) categorySelect.addEventListener('change', updateFieldVisibility);
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      updateFieldVisibility();
      toggleCustomTypeField();
    });
  }
  
  // Update currency labels when currency changes
  if (currencySelect) {
    currencySelect.addEventListener('change', updateCurrencyLabels);
  }
  
  function updateCurrencyLabels() {
    const currency = currencySelect.value;
    const priceCurrencyLabel = document.getElementById('priceCurrencyLabel');
    const depositCurrency = document.getElementById('depositCurrency');
    
    if (priceCurrencyLabel) {
      priceCurrencyLabel.textContent = `(${currency})`;
    }
    if (depositCurrency) {
      depositCurrency.textContent = `(${currency})`;
    }
  }

  function toggleCustomTypeField() {
    const type = typeSelect.value;
    if (type === 'Other') {
      customTypeGroup.classList.remove('hidden');
      customTypeInput.setAttribute('required', 'required');
    } else {
      customTypeGroup.classList.add('hidden');
      customTypeInput.removeAttribute('required');
      customTypeInput.value = '';
    }
  }

  function updateFieldVisibility() {
    const category = categorySelect.value;
    const type = typeSelect.value;

    // Hide all conditional fields first
    document.querySelectorAll('.land-only, .building-only, .rent-only, .book-only').forEach(el => {
      el.classList.add('hidden');
      // Remove required from hidden fields
      el.querySelectorAll('input, select').forEach(input => input.removeAttribute('required'));
    });

    // Show relevant fields based on type
    if (type === 'Land') {
      document.querySelectorAll('.land-only').forEach(el => el.classList.remove('hidden'));
    } else {
      document.querySelectorAll('.building-only').forEach(el => el.classList.remove('hidden'));
    }

    // Show relevant fields based on category
    if (category === 'rent') {
      document.querySelectorAll('.rent-only').forEach(el => el.classList.remove('hidden'));
      priceLabelSelect.value = 'per month';
    } else if (category === 'book') {
      document.querySelectorAll('.book-only').forEach(el => el.classList.remove('hidden'));
      priceLabelSelect.value = 'per night';
    } else if (category === 'buy') {
      priceLabelSelect.value = 'total';
    }
  }

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

    const btn        = submitBtn;
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
        type:        typeSelect.value === 'Other' ? customTypeInput.value.trim() : typeSelect.value,
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
        images:      imageUrls,
        createdAt:   serverTimestamp(),
      };

      // Add optional fields if they exist and have values
      const optionalFields = ['landSizeAcres', 'landSizeSqm', 'titleDeed', 'floorArea', 'deposit', 'utilitiesIncluded', 'minStay', 'checkInTime', 'checkOutTime'];
      optionalFields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input && input.value) {
          property[field] = input.type === 'number' ? Number(input.value) : input.value;
        }
      });

      await addDoc(collection(db, 'properties'), property);
      console.log('Saved to Firestore successfully.');

      successMsg.style.display = 'block';
      form.reset();
      previews.innerHTML = '';
      selectedFiles = [];
      currentStep = 1;
      showStep(1);
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
}
