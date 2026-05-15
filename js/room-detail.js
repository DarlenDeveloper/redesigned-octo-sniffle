import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadPropertyDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        console.error("No property ID provided in URL.");
        return;
    }

    try {
        const docRef = doc(db, 'properties', id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            console.error("Property not found.");
            document.getElementById('propTitle').innerText = "Property Not Found";
            return;
        }

        const p = snapshot.data();

        // Update DOM elements
        document.getElementById('propTitle').innerText = p.title || 'Untitled Property';
        document.getElementById('propLocation').innerHTML = `<i class="bx bx-map" style="color: #286192;"></i> ${p.location || 'Kampala, Uganda'}`;
        document.getElementById('propDescription').innerText = p.description || 'No description available.';
        document.getElementById('propType').innerText = p.type || 'Apartment';
        document.getElementById('propBedrooms').innerText = `${p.bedrooms || 0} Rooms`;
        document.getElementById('propBathrooms').innerText = `${p.bathrooms || 0} Baths`;
        document.getElementById('propStatus').innerText = p.status || 'Luxury and security guaranteed';

        // Price formatting
        const price = p.price ? Number(p.price).toLocaleString() : 'TBD';
        const priceSuffix = p.priceLabel ? `/ ${p.priceLabel}` : (p.category === 'book' ? '/ night' : '');
        const pricePrefix = (p.category === 'rent' || p.category === 'book') ? 'shs. ' : 'UGX ';
        
        document.getElementById('propPrice').innerText = `${pricePrefix}${price}`;
        document.getElementById('priceUnit').innerText = priceSuffix;

        // Dynamic Amenities
        const amenitiesContainer = document.getElementById('propAmenities');
        if (amenitiesContainer && p.amenities && p.amenities.length > 0) {
            amenitiesContainer.innerHTML = p.amenities.map(a => `
                <div class="amenity-pill"><i class="bx bx-check-circle"></i> ${a}</div>
            `).join('');
        }

        // Load Images into Swiper
        const imagesContainer = document.getElementById('propImages');
        if (p.images && p.images.length > 0) {
            imagesContainer.innerHTML = p.images.map(img => `
                <div class="swiper-slide"><img src="${img}" alt="${p.title}" onerror="this.src='images/pixon-logo.jpeg'"></div>
            `).join('');
        } else {
            imagesContainer.innerHTML = `<div class="swiper-slide"><img src="images/pixon-logo.jpeg" alt="No image available"></div>`;
        }

        // Share functionality
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                const shareData = {
                    title: p.title || 'Check out this property',
                    text: p.description ? p.description.substring(0, 100) + '...' : 'Look at this property on Pixon Real Estate',
                    url: `https://pixonrealestate.com/room-detail.html?id=${id}`
                };

                try {
                    if (navigator.share) {
                        await navigator.share(shareData);
                    } else {
                        await navigator.clipboard.writeText(shareData.url);
                        alert('Link copied to clipboard!');
                    }
                } catch (err) {
                    console.error('Error sharing:', err);
                }
            });
        }

        window.initHeroSwiper();

    } catch (error) {
        console.error("Error loading property details:", error);
    }
}

window.initHeroSwiper = function() {
    window.heroSwiper = new Swiper('.property-hero-slider', {
        loop: true,
        autoplay: { delay: 5000 },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        pagination: { el: '.swiper-pagination', clickable: true },
    });
};

document.addEventListener('DOMContentLoaded', loadPropertyDetails);
