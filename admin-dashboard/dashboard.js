import { db, auth, storage } from '../js/firebase-config.js';
import {
  collection, getDocs, deleteDoc, doc, query, orderBy, limit, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { requireAuth, logout } from './auth-guard.js';

// ── AUTH GUARD ──
requireAuth(() => {
  loadDashboard();
  loadInquiries();
});

// ── LOGOUT ──
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

// ── MOBILE MENU ──
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── LOAD DASHBOARD DATA ──
async function loadDashboard() {
  console.log('loadDashboard called');
  try {
    const snapshot = await getDocs(collection(db, 'properties'));
    console.log('Firestore snapshot size:', snapshot.size);
    const properties = [];
    snapshot.forEach(d => properties.push({ id: d.id, ...d.data() }));
    allPropertiesCache = properties;

    // Stats
    const rent  = properties.filter(p => p.category === 'rent').length;
    const sale  = properties.filter(p => p.category === 'buy').length;
    const book  = properties.filter(p => p.category === 'book').length;
    const total = properties.length;

    document.getElementById('statActive').textContent = total;
    document.getElementById('statRent').textContent   = rent;
    document.getElementById('statSale').textContent   = sale;
    document.getElementById('statBook').textContent   = book;

    // Breakdown
    document.getElementById('breakRent').textContent = rent;
    document.getElementById('breakSale').textContent = sale;
    document.getElementById('breakBook').textContent = book;

    if (total > 0) {
      document.getElementById('barRent').style.width = ((rent / total) * 100) + '%';
      document.getElementById('barSale').style.width = ((sale / total) * 100) + '%';
      document.getElementById('barBook').style.width = ((book / total) * 100) + '%';
    }

    // Table
    renderTable(properties);

    // Search
    document.getElementById('tableSearch').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = properties.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q)
      );
      renderTable(filtered);
    });

  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderTable(properties) {
  const tbody = document.getElementById('propertiesTableBody');

  if (properties.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">No properties found.</td></tr>`;
    return;
  }

  tbody.innerHTML = properties.map(p => {
    const img = p.images?.[0] || '../images/pixon-logo.jpeg';
    const statusClass = { rent: 'rented', buy: 'active', book: 'booked' }[p.category] || 'active';
    const statusLabel = { rent: 'For Rent', buy: 'For Sale', book: 'Short Stay' }[p.category] || p.category;
    const currency = p.currency || 'UGX';
    const price = p.price ? `${currency} ${Number(p.price).toLocaleString()}` : '—';

    return `
      <tr>
        <td>
          <div class="prop-cell">
            <img class="prop-thumb" src="${img}" alt="${p.title}" onerror="this.src='../images/pixon-logo.jpeg'">
            <div>
              <div class="prop-name">${p.title || '—'}</div>
              <div class="prop-loc">${p.location || '—'}</div>
            </div>
          </div>
        </td>
        <td>${p.type || '—'}</td>
        <td>${statusLabel}</td>
        <td>${p.location || '—'}</td>
        <td>${price}</td>
        <td><span class="status-badge ${statusClass}">${p.status || 'Active'}</span></td>
        <td>
          <div class="action-btns">
            <a href="#" class="action-btn" title="Edit" onclick="openEditModal('${p.id}'); return false;"><i class='bx bx-edit'></i></a>
            <button class="action-btn del" title="Delete" onclick="deleteProperty('${p.id}')"><i class='bx bx-trash'></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── DELETE ──
window.deleteProperty = async (id) => {
  if (!confirm('Delete this property? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(db, 'properties', id));
    loadDashboard();
  } catch (err) {
    alert('Error deleting property.');
    console.error(err);
  }
};

// ── LOAD INQUIRIES ──
async function loadInquiries() {
  try {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    const container = document.getElementById('recentInquiries');
    const badge = document.getElementById('notifBadge');

    if (snapshot.empty) {
      container.innerHTML = `<p class="empty-msg">No inquiries yet.</p>`;
      badge.textContent = '0';
      return;
    }

    badge.textContent = snapshot.size;
    container.innerHTML = '';

    snapshot.forEach(d => {
      const data = d.data();
      const time = data.createdAt?.toDate?.()?.toLocaleDateString() || '';
      container.innerHTML += `
        <div class="inquiry-item">
          <span class="inquiry-name">${data.name || 'Unknown'}</span>
          <span class="inquiry-msg">${data.message || ''}</span>
          <span class="inquiry-time">${time}</span>
        </div>
      `;
    });
  } catch (err) {
    console.error('Error loading inquiries:', err);
  }
}



// ── EDIT MODAL ──
let editingPropertyId = null;
let allPropertiesCache = [];
let modalNewFiles = [];
let modalExistingImages = [];

window.openEditModal = async (id) => {
  editingPropertyId = id;
  const property = allPropertiesCache.find(p => p.id === id);
  if (!property) return;

  const form = document.getElementById('editForm');
  form.querySelector('[name="title"]').value = property.title || '';
  form.querySelector('[name="category"]').value = property.category || 'buy';
  form.querySelector('[name="type"]').value = property.type || 'Apartment';
  form.querySelector('[name="location"]').value = property.location || 'Kampala';
  form.querySelector('[name="price"]').value = property.price || '';
  form.querySelector('[name="status"]').value = property.status || 'Active';
  form.querySelector('[name="bedrooms"]').value = property.bedrooms || '';
  form.querySelector('[name="availability"]').value = property.availability || '';
  form.querySelector('[name="description"]').value = property.description || '';

  // Amenities
  const amens = property.amenities || [];
  form.querySelectorAll('input[name="amenities"]').forEach(cb => {
    cb.checked = amens.includes(cb.value);
  });

  // Images
  modalExistingImages = property.images || [];
  modalNewFiles = [];
  renderModalImagePreviews();

  document.getElementById('editModal').style.display = 'block';
};

function renderModalImagePreviews() {
  const container = document.getElementById('modalImagePreviews');
  container.innerHTML = '';
  
  // Existing
  modalExistingImages.forEach((url, index) => {
    const div = document.createElement('div');
    div.style = 'position:relative; width:80px; height:60px;';
    div.innerHTML = `
      <img src="${url}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
      <button type="button" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:12px; cursor:pointer;" onclick="removeModalExistingImage(${index})">&times;</button>
    `;
    container.appendChild(div);
  });
  
  // New
  modalNewFiles.forEach((file, index) => {
    const div = document.createElement('div');
    div.style = 'position:relative; width:80px; height:60px;';
    const reader = new FileReader();
    reader.onload = (e) => {
      div.innerHTML = `
        <img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:4px; border:2px solid var(--blue);">
        <button type="button" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:12px; cursor:pointer;" onclick="removeModalNewFile(${index})">&times;</button>
      `;
    };
    reader.readAsDataURL(file);
    container.appendChild(div);
  });
}

window.removeModalExistingImage = (index) => {
  modalExistingImages.splice(index, 1);
  renderModalImagePreviews();
};

window.removeModalNewFile = (index) => {
  modalNewFiles.splice(index, 1);
  renderModalImagePreviews();
};

document.getElementById('modalImageInput').addEventListener('change', (e) => {
  modalNewFiles = [...modalNewFiles, ...e.target.files];
  renderModalImagePreviews();
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('editModal').style.display = 'none';
});

document.getElementById('cancelEdit').addEventListener('click', () => {
  document.getElementById('editModal').style.display = 'none';
});

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveEdit');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const form = e.target;
  try {
    // Upload new images
    const newUrls = [];
    for (const file of modalNewFiles) {
      const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      newUrls.push(url);
    }

    await updateDoc(doc(db, 'properties', editingPropertyId), {
      title: form.querySelector('[name="title"]').value.trim(),
      category: form.querySelector('[name="category"]').value,
      type: form.querySelector('[name="type"]').value,
      location: form.querySelector('[name="location"]').value,
      price: Number(form.querySelector('[name="price"]').value),
      status: form.querySelector('[name="status"]').value,
      bedrooms: Number(form.querySelector('[name="bedrooms"]').value) || 0,
      availability: form.querySelector('[name="availability"]').value.trim(),
      description: form.querySelector('[name="description"]').value.trim(),
      amenities: [...form.querySelectorAll('input[name="amenities"]:checked')].map(cb => cb.value),
      images: [...modalExistingImages, ...newUrls],
      updatedAt: serverTimestamp(),
    });

    document.getElementById('editModal').style.display = 'none';
    loadDashboard();
  } catch (err) {
    alert('Failed to update property.');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
});
