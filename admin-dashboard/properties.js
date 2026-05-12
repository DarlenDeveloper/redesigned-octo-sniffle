import { db } from '../js/firebase-config.js';
import { requireAuth, logout } from './auth-guard.js';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

requireAuth(() => loadProperties());

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

let allProperties = [];
let currentFilter = 'all';

async function loadProperties() {
  try {
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    allProperties = [];
    snapshot.forEach(d => allProperties.push({ id: d.id, ...d.data() }));
    renderTable();
  } catch (err) {
    document.getElementById('propertiesTableBody').innerHTML =
      `<tr><td colspan="7" class="loading-row">Failed to load properties.</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('propertiesTableBody');
  const search = document.getElementById('propSearch').value.toLowerCase();

  let items = allProperties;
  if (currentFilter !== 'all') items = items.filter(p => p.category === currentFilter);
  if (search) items = items.filter(p =>
    p.title?.toLowerCase().includes(search) ||
    p.location?.toLowerCase().includes(search)
  );

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">No properties found.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(p => {
    const img = p.images?.[0] || '../images/pixon-logo.jpeg';
    const statusClass = { rent: 'rented', buy: 'active', book: 'booked' }[p.category] || 'active';
    const categoryLabel = { rent: 'For Rent', buy: 'For Sale', book: 'Short Stay' }[p.category] || p.category;
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
        <td>${categoryLabel}</td>
        <td>${p.location || '—'}</td>
        <td>${price}</td>
        <td><span class="status-badge ${statusClass}">${p.status || 'Active'}</span></td>
        <td>
          <div class="action-btns">
            <a href="/admin-dashboard/edit-property.html?id=${p.id}" class="action-btn" title="Edit"><i class='bx bx-edit'></i></a>
            <button class="action-btn del" title="Delete" onclick="deleteProp('${p.id}')"><i class='bx bx-trash'></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTable();
  });
});

document.getElementById('propSearch').addEventListener('input', renderTable);

window.deleteProp = async (id) => {
  if (!confirm('Delete this property? This cannot be undone.')) return;
  await deleteDoc(doc(db, 'properties', id));
  allProperties = allProperties.filter(p => p.id !== id);
  renderTable();
};
