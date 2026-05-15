import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let allProperties = [];
let filteredProperties = [];
let currentPage = 1;
const itemsPerPage = 6;

async function loadProperties() {
    const grid = document.querySelector('.featured-grid');
    if (!grid) return;

    showLoading();

    try {
        // Fetch all properties once (since the dataset is manageable) 
        // to provide a smooth filtering/pagination experience
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        allProperties = [];
        snapshot.forEach(doc => allProperties.push({ id: doc.id, ...doc.data() }));
        
        filteredProperties = [...allProperties];
        
        // Populate dynamic filters based on actual data
        populateDynamicFilters();

        // Timeout to simulate "premium" loading feel as requested
        setTimeout(() => {
            renderProperties();
            hideLoading();
        }, 800);

    } catch (error) {
        console.error("Error loading properties:", error);
        grid.innerHTML = '<p class="text-center">Failed to load properties. Please try again later.</p>';
    }
}

function renderProperties() {
    const grid = document.querySelector('.featured-grid');
    grid.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredProperties.slice(startIndex, endIndex);

    if (pageItems.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center" style="padding: 50px;"><p>No properties match your search.</p></div>';
        renderPagination();
        return;
    }

    pageItems.forEach(p => {
        const mainImage = p.images && p.images.length > 0 ? p.images[0] : 'images/pixon-logo.jpeg';
        
        let categoryLabel = 'FOR SALE FROM';
        let pricePrefix = 'UGX ';
        
        if (p.category === 'rent') {
            categoryLabel = 'FOR RENT';
            pricePrefix = 'shs. ';
        } else if (p.category === 'book') {
            categoryLabel = 'SHORT STAY FROM';
            pricePrefix = 'shs. ';
        }

        const formattedPrice = p.price ? Number(p.price).toLocaleString() : 'TBD';

        const card = document.createElement('div');
        card.className = 'room-box';
        card.innerHTML = `
            <a href="room-detail.html?id=${p.id}">
                <figure>
                    <img src="${mainImage}" class="no-copy" alt="${p.title}" onerror="this.src='images/pixon-logo.jpeg'">
                    <div class="watermark-overlay"></div>
                    <div class="protection-overlay"></div>
                </figure>
            </a>
            <div class="content">
                <div class="price-line"><span>${categoryLabel}</span> ${pricePrefix}${formattedPrice}</div>
                ${(() => {
                    if (!p.availability) return '';
                    const availDate = new Date(p.availability);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    if (availDate <= today) {
                        return `<div class="availability-badge" style="font-size: 12px; color: #27ae60; font-weight: 700; margin-bottom: 5px; text-transform: uppercase;">• Available Now</div>`;
                    } else {
                        const dateStr = availDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                        return `<div class="availability-badge" style="font-size: 12px; color: #286192; font-weight: 700; margin-bottom: 5px; text-transform: uppercase;">• Available on ${dateStr}</div>`;
                    }
                })()}
                <h3><a href="room-detail.html?id=${p.id}">${p.title}</a></h3>
                <p>${p.description ? p.description.substring(0, 100) + '...' : 'Luxury living in the heart of Kampala.'}</p>
                <div class="bottom-specs">
                    <div class="icons">
                        <i class="bx bx-bed" title="${p.bedrooms || 0} Bedrooms"></i>
                        <i class="bx bx-bath" title="${p.bathrooms || 0} Bathrooms"></i>
                        <i class="bx bx-building" title="${p.type || 'Apartment'}"></i>
                        <i class="bx bx-wifi" title="WiFi"></i>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    const container = document.querySelector('.pagination-container');
    if (!container) return;

    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHtml = '<ul class="pagination">';
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<li><a href="#listings" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a></li>`;
    }
    paginationHtml += '</ul>';
    
    container.innerHTML = paginationHtml;

    // Add click events to pagination links
    container.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = parseInt(e.target.dataset.page);
            renderProperties();
            // Scroll back to top of grid
            document.getElementById('listings').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function showLoading() {
    const grid = document.querySelector('.featured-grid');
    grid.style.opacity = '0.4';
    const loader = document.getElementById('grid-loader');
    if (loader) loader.style.display = 'block';
}

function hideLoading() {
    const grid = document.querySelector('.featured-grid');
    grid.style.opacity = '1';
    const loader = document.getElementById('grid-loader');
    if (loader) loader.style.display = 'none';
}

function populateDynamicFilters() {
    const locationSelect = document.getElementById('searchLocation');
    const typeSelect = document.getElementById('searchType');
    
    if (!locationSelect || !typeSelect) return;

    // Get unique locations and types
    const locations = [...new Set(allProperties.map(p => p.location).filter(Boolean))];
    const types = [...new Set(allProperties.map(p => p.type).filter(Boolean))];

    // Preserve first option (placeholder)
    const locPlaceholder = locationSelect.options[0].text;
    const typePlaceholder = typeSelect.options[0].text;

    locationSelect.innerHTML = `<option value="">${locPlaceholder}</option>`;
    locations.sort().forEach(loc => {
        locationSelect.innerHTML += `<option value="${loc.toLowerCase()}">${loc}</option>`;
    });

    typeSelect.innerHTML = `<option value="">${typePlaceholder}</option>`;
    types.sort().forEach(t => {
        typeSelect.innerHTML += `<option value="${t.toLowerCase()}">${t}</option>`;
    });
}

// ── SEARCH LOGIC ──
function handleSearch() {
    const category = document.getElementById('searchCategory').value.toLowerCase();
    const type = document.getElementById('searchType').value.toLowerCase();
    const location = document.getElementById('searchLocation').value.toLowerCase();
    const budget = document.getElementById('searchBudget').value;

    filteredProperties = allProperties.filter(p => {
        const pCategory = (p.category || '').toLowerCase();
        const pType = (p.type || '').toLowerCase();
        const pLocation = (p.location || '').toLowerCase();

        const matchCategory = !category || pCategory === category;
        const matchType = !type || pType === type;
        const matchLocation = !location || pLocation.includes(location);
        
        let matchBudget = true;
        if (budget) {
            const price = Number(p.price);
            if (budget === '0-100k') matchBudget = price < 100000;
            else if (budget === '100k-500k') matchBudget = price >= 100000 && price <= 500000;
            else if (budget === '500k-2m') matchBudget = price > 500000 && price <= 2000000;
            else if (budget === '2m+') matchBudget = price > 2000000;
        }

        return matchCategory && matchType && matchLocation && matchBudget;
    });

    currentPage = 1;
    showLoading();
    setTimeout(() => {
        renderProperties();
        hideLoading();
    }, 600);
}

// Global search trigger (for nav links)
window.triggerSearch = function(category) {
    const select = document.getElementById('searchCategory');
    if (select) {
        select.value = category;
        handleSearch();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProperties();
    
    // Check if we arrived with a hash (e.g., from Buy/Rent nav link on another page)
    const hash = window.location.hash;
    if (hash === '#listings') {
        const urlParams = new URL(window.location.href);
        // We can't easily pass category in hash without query params, 
        // but we can check if there's a need to trigger.
        // For now, let's just listen for the click events which handle internal navigation.
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    // Intercept nav clicks
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('a');
        if (!navLink) return;

        const href = navLink.getAttribute('href');
        if (!href) return;

        if (href.includes('#listings')) {
            const text = navLink.innerText.toLowerCase().trim();
            if (text === 'buy') {
                window.triggerSearch('buy');
            } else if (text === 'rent') {
                window.triggerSearch('rent');
            } else if (text === 'book') {
                window.triggerSearch('book');
            }
        }
    });
});
