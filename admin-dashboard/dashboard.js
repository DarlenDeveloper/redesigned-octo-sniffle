import { db, auth } from '../js/firebase-config.js';
import {
  collection, getDocs, deleteDoc, doc, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
    const price = p.price ? `UGX ${Number(p.price).toLocaleString()}` : '—';

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
            <a href="/admin-dashboard/edit-property.html?id=${p.id}" class="action-btn" title="Edit"><i class='bx bx-edit'></i></a>
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

loadDashboard();
loadInquiries();
