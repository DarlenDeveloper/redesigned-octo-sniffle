import { db } from '../js/firebase-config.js';
import { requireAuth, logout } from './auth-guard.js';
import {
  collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

requireAuth(() => loadInquiries());

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

let allInquiries = [];

async function loadInquiries() {
  const list = document.getElementById('inquiriesList');
  try {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    allInquiries = [];
    snapshot.forEach(d => allInquiries.push({ id: d.id, ...d.data() }));
    renderInquiries('all');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><i class='bx bx-error'></i>Failed to load inquiries.</div>`;
  }
}

function renderInquiries(filter) {
  const list = document.getElementById('inquiriesList');
  let items = allInquiries;
  if (filter === 'new')  items = allInquiries.filter(i => !i.read);
  if (filter === 'read') items = allInquiries.filter(i => i.read);

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class='bx bxs-inbox'></i>No inquiries found.</div>`;
    return;
  }

  list.innerHTML = items.map(inq => {
    const time = inq.createdAt?.toDate?.()?.toLocaleString() || '—';
    const readBadge = inq.read
      ? `<span style="font-size:11px;color:var(--text-muted);">Read</span>`
      : `<span style="font-size:11px;background:#e8f1f8;color:var(--blue);padding:2px 8px;border-radius:20px;font-weight:600;">New</span>`;
    return `
      <div class="inquiry-card" id="inq-${inq.id}">
        <div>
          <div class="inq-name">${inq.name || 'Unknown'} ${readBadge}</div>
          <div class="inq-meta">
            <span><i class='bx bx-envelope'></i> ${inq.email || '—'}</span>
            <span><i class='bx bx-phone'></i> ${inq.phone || '—'}</span>
          </div>
          <div class="inq-msg">${inq.message || '—'}</div>
          <div class="inq-actions">
            ${!inq.read ? `<button class="btn-primary" style="font-size:13px;padding:7px 14px;" onclick="markRead('${inq.id}')">Mark as Read</button>` : ''}
            <a href="mailto:${inq.email}" class="action-btn" title="Reply via email"><i class='bx bx-reply'></i></a>
            <button class="action-btn del" title="Delete" onclick="deleteInquiry('${inq.id}')"><i class='bx bx-trash'></i></button>
          </div>
        </div>
        <div class="inq-time">${time}</div>
      </div>
    `;
  }).join('');
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderInquiries(btn.dataset.filter);
  });
});

window.markRead = async (id) => {
  await updateDoc(doc(db, 'inquiries', id), { read: true });
  const inq = allInquiries.find(i => i.id === id);
  if (inq) inq.read = true;
  renderInquiries(document.querySelector('.filter-btn.active').dataset.filter);
};

window.deleteInquiry = async (id) => {
  if (!confirm('Delete this inquiry?')) return;
  await deleteDoc(doc(db, 'inquiries', id));
  allInquiries = allInquiries.filter(i => i.id !== id);
  renderInquiries(document.querySelector('.filter-btn.active').dataset.filter);
};
