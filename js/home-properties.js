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
            renderMap();
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
        const currency = p.currency || 'UGX';
        let pricePrefix = `${currency} `;
        
        if (p.category === 'rent') {
            categoryLabel = 'FOR RENT';
        } else if (p.category === 'book') {
            categoryLabel = 'SHORT STAY FROM';
        }

        const formattedPrice = p.price ? Number(p.price).toLocaleString() : 'TBD';

        const card = document.createElement('div');
        card.className = 'room-box';
        card.innerHTML = `
            <a href="room-detail.html?id=${p.id}" onclick="localStorage.setItem('currentPropertyId', '${p.id}')">
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
                <h3><a href="room-detail.html?id=${p.id}" onclick="localStorage.setItem('currentPropertyId', '${p.id}')">${p.title}</a></h3>
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

    filteredProperties = allProperties.filter(p => {
        const pCategory = (p.category || '').toLowerCase();
        const pType = (p.type || '').toLowerCase();
        const pLocation = (p.location || '').toLowerCase();

        const matchCategory = !category || pCategory === category;
        const matchType = !type || pType === type;
        const matchLocation = !location || pLocation.includes(location);

        return matchCategory && matchType && matchLocation;
    });

    currentPage = 1;
    showLoading();
    setTimeout(() => {
        renderProperties();
        renderMap();
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
    
    // Bind search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('a');
        if (!navLink) return;

        const href = navLink.getAttribute('href');
        if (!href) return;

        const text = navLink.innerText.toLowerCase().trim();

        // Handle listings links (Buy, Rent, Book)
        if (href.includes('#listings')) {
            e.preventDefault();
            
            // Apply filter based on link text
            if (text === 'buy') {
                window.triggerSearch('buy');
            } else if (text === 'rent') {
                window.triggerSearch('rent');
            } else if (text === 'book') {
                window.triggerSearch('book');
            }
            
            // Scroll to listings section
            setTimeout(() => {
                const listingsSection = document.getElementById('listings');
                if (listingsSection) {
                    // Try smooth scrollbar first
                    if (typeof Scrollbar !== 'undefined') {
                        const mainScrollbar = Scrollbar.get(document.querySelector('#main'));
                        if (mainScrollbar) {
                            mainScrollbar.scrollIntoView(listingsSection, {
                                offsetTop: 80,
                                alignToTop: true
                            });
                            return;
                        }
                    }
                    // Fallback to regular scroll
                    listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 200);
        }
        
        // Handle contact links
        if (href.includes('#contact')) {
            e.preventDefault();
            
            setTimeout(() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    // Try smooth scrollbar first
                    if (typeof Scrollbar !== 'undefined') {
                        const mainScrollbar = Scrollbar.get(document.querySelector('#main'));
                        if (mainScrollbar) {
                            mainScrollbar.scrollIntoView(contactSection, {
                                offsetTop: 80,
                                alignToTop: true
                            });
                            return;
                        }
                    }
                    // Fallback to regular scroll
                    contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 200);
        }
    });
});

// Map Integration
const locationCoords = {
    'kololo': [0.3297, 32.5898],
    'nakasero': [0.3228, 32.5786],
    'naguru': [0.3340, 32.6133],
    'bugolobi': [0.3150, 32.6200],
    'kisaasi': [0.3705, 32.6160],
    'kisasi': [0.3705, 32.6160],
    'garuga': [0.0384, 32.5020],
    'ntinda': [0.3475, 32.6160],
    'muyenga': [0.2942, 32.6145],
    'kampala': [0.3136, 32.5811]
};

let propertyMap = null;
function renderMap() {
    const mapDiv = document.getElementById('dynamicPropertyMap');
    if (!mapDiv) return;
    
    if (!propertyMap) {
        propertyMap = L.map('dynamicPropertyMap').setView([0.3136, 32.5811], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(propertyMap);
    }
    
    // Clear existing markers
    propertyMap.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            propertyMap.removeLayer(layer);
        }
    });

    const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `<i class="bx bxs-map" style="font-size: 36px; color: #286192; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));"></i>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });

    filteredProperties.forEach(p => {
        const locName = (p.location || 'Kampala').toLowerCase();
        let coords = null;
        
        for (const key in locationCoords) {
            if (locName.includes(key)) {
                coords = locationCoords[key];
                break;
            }
        }
        // Default to Kampala city center if unknown
        if (!coords) coords = locationCoords['kampala'];
        
        // Add tiny random jitter so properties in the exact same neighborhood don't overlap completely
        const jitterLat = coords[0] + (Math.random() - 0.5) * 0.01;
        const jitterLng = coords[1] + (Math.random() - 0.5) * 0.01;

        const mainImage = p.images?.length > 0 ? p.images[0] : 'images/pixon-logo.jpeg';
        const price = p.price ? Number(p.price).toLocaleString() : 'TBD';
        const currency = p.currency || 'UGX';

        const marker = L.marker([jitterLat, jitterLng], {icon: customIcon}).addTo(propertyMap);
        marker.bindPopup(`
            <div style="font-family: 'Outfit', sans-serif; text-align: center; width: 160px; padding: 5px;">
                <a href="room-detail.html?id=${p.id}" onclick="localStorage.setItem('currentPropertyId', '${p.id}')" style="text-decoration: none;">
                    <img src="${mainImage}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
                    <strong style="display:block; color: #111; font-size: 14px; margin-bottom: 5px; line-height: 1.2;">${p.title}</strong>
                </a>
                <span style="color: #286192; font-weight: 700; font-size: 13px;">${currency} ${price}</span>
            </div>
        `);
    });
}
