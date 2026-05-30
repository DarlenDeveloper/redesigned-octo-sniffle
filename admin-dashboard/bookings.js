import { db } from '../js/firebase-config.js';
import { requireAuth, logout } from './auth-guard.js';
import {
  collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

requireAuth(() => loadBookings());

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

let allBookings = [];

async function loadBookings() {
  const list = document.getElementById('bookingsList');
  try {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    allBookings = [];
    
    snapshot.forEach(d => {
      allBookings.push({ id: d.id, ...d.data() });
    });
    
    renderBookings('all');
  } catch (err) {
    console.error('Error loading bookings:', err);
    list.innerHTML = `<div class="empty-state"><i class='bx bx-error'></i>Failed to load reservations.</div>`;
  }
}

function renderBookings(filter) {
  const list = document.getElementById('bookingsList');
  let items = allBookings;
  
  if (filter !== 'all') {
    items = allBookings.filter(b => b.category === filter);
  }

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class='bx bx-calendar'></i>No reservations found.</div>`;
    return;
  }

  list.innerHTML = items.map(book => {
    const time = book.createdAt?.toDate?.()?.toLocaleString() || '—';
    const isNew = book.status === 'New' || !book.status;
    const statusLabel = book.status || 'New';
    
    let badgeClass = 'book';
    let typeLabel = 'Short Stay';
    
    if (book.category === 'rent') {
      badgeClass = 'rent';
      typeLabel = 'Rental';
    } else if (book.category === 'buy') {
      badgeClass = 'buy';
      typeLabel = 'Purchase';
    }
    
    const statusBadge = isNew
      ? `<span style="font-size:11px;background:#e8f1f8;color:var(--blue);padding:2px 8px;border-radius:20px;font-weight:600;">New</span>`
      : `<span style="font-size:11px;background:#e8f8f0;color:#27ae60;padding:2px 8px;border-radius:20px;font-weight:600;">${statusLabel}</span>`;

    // WhatsApp Reply Generator
    let waMessage = `Hello ${book.name || 'there'}! This is Pixon Real Estate Kampala. %0A%0A`;
    if (book.category === 'book') {
      waMessage += `We received your booking request for *${book.propertyTitle}* from *${book.checkIn}* to *${book.checkOut}* (Estimated total: *${book.estimatedTotal}*). %0A%0AWe would love to confirm your reservation details. Let us know if you are ready to proceed.`;
    } else if (book.category === 'rent') {
      waMessage += `We received your rental inquiry for *${book.propertyTitle}* (Price: *${book.estimatedTotal}*). %0A%0AWe would be happy to schedule a viewing or share more details. Let us know when you are free.`;
    } else {
      waMessage += `We received your purchase inquiry for *${book.propertyTitle}* (Price: *${book.estimatedTotal}*). %0A%0AWe would be happy to discuss details or arrange a property tour. Let us know how you would like to proceed.`;
    }

    const cleanPhone = (book.phone || '').replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;

    // Dynamic grid details based on reservation type
    let detailsHtml = '';
    if (book.category === 'book') {
      detailsHtml = `
        <div class="book-details-grid">
          <div class="detail-item">
            <label>Property</label>
            <span><a href="/room-detail.html?id=${book.propertyId}" target="_blank" style="color:var(--blue); text-decoration:none; font-weight:600;">${book.propertyTitle}</a></span>
          </div>
          <div class="detail-item">
            <label>Check In</label>
            <span>${book.checkIn}</span>
          </div>
          <div class="detail-item">
            <label>Check Out</label>
            <span>${book.checkOut}</span>
          </div>
          <div class="detail-item">
            <label>Estimated Total</label>
            <span style="font-weight:700; color:var(--blue);">${book.estimatedTotal}</span>
          </div>
        </div>
      `;
    } else if (book.category === 'rent') {
      detailsHtml = `
        <div class="book-details-grid">
          <div class="detail-item">
            <label>Rental Property</label>
            <span><a href="/room-detail.html?id=${book.propertyId}" target="_blank" style="color:var(--blue); text-decoration:none; font-weight:600;">${book.propertyTitle}</a></span>
          </div>
          <div class="detail-item">
            <label>Monthly Rent / Details</label>
            <span style="font-weight:700; color:var(--orange);">${book.estimatedTotal}</span>
          </div>
        </div>
      `;
    } else {
      detailsHtml = `
        <div class="book-details-grid">
          <div class="detail-item">
            <label>Property for Sale</label>
            <span><a href="/room-detail.html?id=${book.propertyId}" target="_blank" style="color:var(--blue); text-decoration:none; font-weight:600;">${book.propertyTitle}</a></span>
          </div>
          <div class="detail-item">
            <label>Purchase Price / Details</label>
            <span style="font-weight:700; color:#27ae60;">${book.estimatedTotal}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="booking-card" id="book-${book.id}">
        <div>
          <div class="book-title">
            ${book.name || 'Unknown'} 
            <span class="type-badge ${badgeClass}">${typeLabel}</span>
            ${statusBadge}
          </div>
          <div class="book-meta">
            <span><i class='bx bx-envelope'></i> ${book.email || '—'}</span>
            <span><i class='bx bx-phone'></i> ${book.phone || '—'}</span>
          </div>
          <div class="book-details">
            ${detailsHtml}
          </div>
          <div class="book-actions">
            ${isNew ? `<button class="btn-primary" style="font-size:13px;padding:7px 14px;" onclick="markProcessed('${book.id}')">Mark as Processed</button>` : ''}
            <a href="${waUrl}" target="_blank" class="action-btn" title="Contact via WhatsApp" style="background:#25d366; color:white;"><i class='bx bxl-whatsapp' style="font-size: 20px;"></i></a>
            <a href="mailto:${book.email}" class="action-btn" title="Reply via email"><i class='bx bx-reply'></i></a>
            <button class="action-btn del" title="Delete" onclick="deleteBooking('${book.id}')"><i class='bx bx-trash'></i></button>
          </div>
        </div>
        <div class="book-time">${time}</div>
      </div>
    `;
  }).join('');
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBookings(btn.dataset.filter);
  });
});

window.markProcessed = async (id) => {
  try {
    await updateDoc(doc(db, 'bookings', id), { status: 'Processed' });
    const book = allBookings.find(b => b.id === id);
    if (book) book.status = 'Processed';
    renderBookings(document.querySelector('.filter-btn.active').dataset.filter);
  } catch (err) {
    console.error('Error marking booking as processed:', err);
    alert('Failed to update reservation status.');
  }
};

window.deleteBooking = async (id) => {
  if (!confirm('Delete this reservation record? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(db, 'bookings', id));
    allBookings = allBookings.filter(b => b.id !== id);
    renderBookings(document.querySelector('.filter-btn.active').dataset.filter);
  } catch (err) {
    console.error('Error deleting booking:', err);
    alert('Failed to delete reservation.');
  }
};
