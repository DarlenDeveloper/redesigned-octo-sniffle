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
  const locationSelect = document.getElementById('locationSelect');
  const statusSelect = document.getElementById('statusSelect');
  const availabilitySelect = document.getElementById('availabilitySelect');
  const titleDeedSelect = document.getElementById('titleDeedSelect');
  const utilitiesSelect = document.getElementById('utilitiesSelect');
  const priceLabelSelect = document.getElementById('priceLabelSelect');
  
  // Custom field groups
  const customCategoryGroup = document.getElementById('customCategoryGroup');
  const customCategoryInput = document.getElementById('customCategoryInput');
  const customTypeGroup = document.getElementById('customTypeGroup');
  const customTypeInput = document.getElementById('customTypeInput');
  const customLocationGroup = document.getElementById('customLocationGroup');
  const customLocationInput = document.getElementById('customLocationInput');
  const customStatusGroup = document.getElementById('customStatusGroup');
  const customStatusInput = document.getElementById('customStatusInput');
  const customAvailabilityGroup = document.getElementById('customAvailabilityGroup');
  const customAvailabilityInput = document.getElementById('customAvailabilityInput');
  const customTitleDeedGroup = document.getElementById('customTitleDeedGroup');
  const customTitleDeedInput = document.getElementById('customTitleDeedInput');
  const customUtilitiesGroup = document.getElementById('customUtilitiesGroup');
  const customUtilitiesInput = document.getElementById('customUtilitiesInput');
  const customAmenityGroup = document.getElementById('customAmenityGroup');
  const customAmenityInput = document.getElementById('customAmenityInput');
  
  const currencySelect = document.querySelector('[name="currency"]');

  if (categorySelect) categorySelect.addEventListener('change', () => {
    updateFieldVisibility();
    toggleCustomField(categorySelect, customCategoryGroup, customCategoryInput);
  });
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      updateFieldVisibility();
      toggleCustomField(typeSelect, customTypeGroup, customTypeInput);
    });
  }
  if (locationSelect) {
    locationSelect.addEventListener('change', () => {
      toggleCustomField(locationSelect, customLocationGroup, customLocationInput);
    });
  }
  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      toggleCustomField(statusSelect, customStatusGroup, customStatusInput);
    });
  }
  if (availabilitySelect) {
    availabilitySelect.addEventListener('change', () => {
      toggleCustomField(availabilitySelect, customAvailabilityGroup, customAvailabilityInput);
    });
  }
  if (titleDeedSelect) {
    titleDeedSelect.addEventListener('change', () => {
      toggleCustomField(titleDeedSelect, customTitleDeedGroup, customTitleDeedInput);
    });
  }
  if (utilitiesSelect) {
    utilitiesSelect.addEventListener('change', () => {
      toggleCustomField(utilitiesSelect, customUtilitiesGroup, customUtilitiesInput);
    });
  }

  // Amenity checkbox handler
  document.querySelectorAll('input[name="amenities"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const otherChecked = document.querySelector('input[name="amenities"][value="Other"]:checked');
      if (otherChecked) {
        customAmenityGroup.classList.remove('hidden');
        customAmenityInput.setAttribute('required', 'required');
      } else {
        customAmenityGroup.classList.add('hidden');
        customAmenityInput.removeAttribute('required');
        customAmenityInput.value = '';
      }
    });
  });

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

  function toggleCustomField(selectElement, groupElement, inputElement) {
    if (selectElement.value === 'Other' || selectElement.value === 'other') {
      groupElement.classList.remove('hidden');
      inputElement.setAttribute('required', 'required');
    } else {
      groupElement.classList.add('hidden');
      inputElement.removeAttribute('required');
      inputElement.value = '';
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

  // ========== IMAGE UPLOAD ==========
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  const imagePreviews = document.getElementById('imagePreviews');
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
    handleImageFiles(e.dataTransfer.files);
  });

  imageInput.addEventListener('change', () => handleImageFiles(imageInput.files));

  function handleImageFiles(files) {
    const newFiles = [...files];
    selectedFiles = [...selectedFiles, ...newFiles];
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview-thumb';
        img.title = file.name;
        imagePreviews.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  // ========== VIDEO UPLOAD ==========
  const uploadVideoArea = document.getElementById('uploadVideoArea');
  const videoInput = document.getElementById('videoInput');
  const videoPreviews = document.getElementById('videoPreviews');
  let selectedVideoFiles = [];

  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

  uploadVideoArea.addEventListener('click', () => videoInput.click());

  uploadVideoArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadVideoArea.style.borderColor = '#286192';
  });

  uploadVideoArea.addEventListener('dragleave', () => {
    uploadVideoArea.style.borderColor = '#e2e8f0';
  });

  uploadVideoArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadVideoArea.style.borderColor = '#e2e8f0';
    handleVideoFiles(e.dataTransfer.files);
  });

  videoInput.addEventListener('change', () => handleVideoFiles(videoInput.files));

  function handleVideoFiles(files) {
    const newFiles = [...files];
    
    for (let file of newFiles) {
      // Validate file type
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only MP4, WebM, and MOV are allowed.`);
        continue;
      }
      
      // Validate file size
      if (file.size > MAX_VIDEO_SIZE) {
        alert(`File too large: ${file.name}. Maximum size is 100MB.`);
        continue;
      }
      
      selectedVideoFiles.push(file);
      createVideoPreview(file);
    }
  }

  function createVideoPreview(file) {
    const videoThumb = document.createElement('div');
    videoThumb.className = 'video-thumb';
    
    const icon = document.createElement('i');
    icon.className = 'bx bx-play-circle';
    
    const nameLabel = document.createElement('div');
    nameLabel.className = 'video-name';
    nameLabel.textContent = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
    
    videoThumb.appendChild(icon);
    videoThumb.appendChild(nameLabel);
    videoPreviews.appendChild(videoThumb);
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

      // Upload videos (optional)
      const videoUrls = [];
      if (selectedVideoFiles.length > 0) {
        for (let i = 0; i < selectedVideoFiles.length; i++) {
          const file = selectedVideoFiles[i];
          btn.textContent = `Uploading video ${i + 1}/${selectedVideoFiles.length}...`;
          console.log(`Uploading: ${file.name} (${file.size} bytes)`);
          const storageRef = ref(storage, `properties/videos/${Date.now()}_${file.name}`);
          const snapshot   = await uploadBytes(storageRef, file);
          console.log(`Uploaded: ${file.name}`);
          const url = await getDownloadURL(snapshot.ref);
          console.log(`Video URL: ${url}`);
          videoUrls.push(url);
        }
      }

      btn.textContent = 'Saving to database...';
      console.log('Saving to Firestore...');

      // Collect amenities - handle "Other" option
      const amenities = [...form.querySelectorAll('input[name="amenities"]:checked')]
        .map(cb => cb.value === 'Other' ? customAmenityInput.value.trim() : cb.value);

      // Build property object
      const property = {
        title:       form.querySelector('[name="title"]').value.trim(),
        category:    categorySelect.value === 'other' ? customCategoryInput.value.trim() : categorySelect.value,
        type:        typeSelect.value === 'Other' ? customTypeInput.value.trim() : typeSelect.value,
        location:    locationSelect.value === 'Other' ? customLocationInput.value.trim() : locationSelect.value,
        status:      statusSelect.value === 'Other' ? customStatusInput.value.trim() : statusSelect.value,
        currency:    form.querySelector('[name="currency"]').value,
        price:       Number(form.querySelector('[name="price"]').value),
        priceLabel:  form.querySelector('[name="priceLabel"]').value,
        bedrooms:    Number(form.querySelector('[name="bedrooms"]').value) || 0,
        bathrooms:   Number(form.querySelector('[name="bathrooms"]').value) || 0,
        availability: availabilitySelect.value === 'Other' ? customAvailabilityInput.value.trim() : availabilitySelect.value,
        description: form.querySelector('[name="description"]').value.trim(),
        amenities,
        images:      imageUrls,
        videos:      videoUrls, // Optional videos
        createdAt:   serverTimestamp(),
      };

      // Add optional fields if they exist and have values
      const optionalFields = ['landSizeAcres', 'landSizeSqm', 'titleDeed', 'floorArea', 'deposit', 'utilitiesIncluded', 'minStay', 'checkInTime', 'checkOutTime'];
      optionalFields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input && input.value) {
          // Handle special case for titleDeed "Other"
          if (field === 'titleDeed' && input.value === 'Other') {
            property[field] = customTitleDeedInput.value.trim();
          } else if (field === 'utilitiesIncluded' && input.value === 'Other') {
            property[field] = customUtilitiesInput.value.trim();
          } else {
            property[field] = input.type === 'number' ? Number(input.value) : input.value;
          }
        }
      });

      await addDoc(collection(db, 'properties'), property);
      console.log('Saved to Firestore successfully.');

      successMsg.style.display = 'block';
      form.reset();
      imagePreviews.innerHTML = '';
      videoPreviews.innerHTML = '';
      selectedFiles = [];
      selectedVideoFiles = [];
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
