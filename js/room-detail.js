import { db } from './firebase-config.js';
import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadPropertyDetails() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');

    if (!id) {
        // Fallback to localStorage if local server strips URL parameters (e.g., serve cleanUrls)
        id = localStorage.getItem('currentPropertyId');
        if (id) {
            // Restore URL visually without reloading to ensure sharing functionality works
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + id;
            window.history.replaceState({path: newUrl}, '', newUrl);
        }
    }

    if (!id) {
        console.error("No property ID provided in URL or LocalStorage.");
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
        window.currentProperty = p; // Store globally for price updates

        // Update DOM elements
        document.getElementById('propTitle').innerText = p.title || 'Untitled Property';
        document.getElementById('propLocation').innerHTML = `<i class="bx bx-map" style="color: #286192;"></i> ${p.location || 'Kampala, Uganda'}`;
        document.getElementById('propDescription').innerText = p.description || 'No description available.';
        document.getElementById('propType').innerText = p.type || 'Apartment';
        document.getElementById('propBedrooms').innerText = `${p.bedrooms || 0}`;
        document.getElementById('propBathrooms').innerText = `${p.bathrooms || 0}`;
        
        // Availability display
        const availText = (() => {
            if (!p.availability || p.availability === '') return 'Available Now';
            const availDate = new Date(p.availability);
            if (isNaN(availDate.getTime())) return 'Available Now';
            const today = new Date();
            today.setHours(0,0,0,0);
            if (availDate <= today) return 'Available Now';
            const dateStr = availDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            return `Available on ${dateStr}`;
        })();
        document.getElementById('propAvailability').innerText = availText;
        document.getElementById('propStatus').innerText = p.status || 'Luxury and security guaranteed';

        // Price formatting
        const price = p.price ? Number(p.price).toLocaleString() : 'TBD';
        const priceSuffix = p.priceLabel ? `/ ${p.priceLabel}` : (p.category === 'book' ? '/ night' : '');
        const currency = p.currency || 'UGX';
        const pricePrefix = `${currency} `;
        
        document.getElementById('propPrice').innerText = `${pricePrefix}${price}`;
        document.getElementById('priceUnit').innerText = priceSuffix;

        // Dynamic Amenities with enhanced icons
        const amenitiesContainer = document.getElementById('propAmenities');
        if (amenitiesContainer) {
            if (p.amenities && p.amenities.length > 0) {
                amenitiesContainer.innerHTML = p.amenities.map(a => {
                    let icon = 'bx-check-circle';
                    const lower = a.toLowerCase();
                    
                    // Enhanced icon mapping
                    if (lower.includes('wifi')) icon = 'bx-wifi';
                    else if (lower.includes('tv') || lower.includes('dstv')) icon = 'bx-tv';
                    else if (lower.includes('ac') || lower.includes('air')) icon = 'bx-wind';
                    else if (lower.includes('kitchen')) icon = 'bx-dish';
                    else if (lower.includes('washing') || lower.includes('laundry')) icon = 'bxs-washer';
                    else if (lower.includes('solar') || lower.includes('generator')) icon = 'bx-bolt-circle';
                    else if (lower.includes('water') || lower.includes('borehole')) icon = 'bx-droplet';
                    else if (lower.includes('warm') || lower.includes('hot')) icon = 'bx-water';
                    else if (lower.includes('parking')) icon = 'bx-car';
                    else if (lower.includes('security')) icon = 'bx-shield-quarter';
                    else if (lower.includes('cctv')) icon = 'bx-cctv';
                    else if (lower.includes('gated')) icon = 'bx-home-circle';
                    else if (lower.includes('pool') || lower.includes('swim')) icon = 'bx-swim';
                    else if (lower.includes('gym')) icon = 'bx-dumbbell';
                    else if (lower.includes('elevator') || lower.includes('lift')) icon = 'bx-up-arrow-circle';
                    else if (lower.includes('balcony') || lower.includes('terrace')) icon = 'bx-home-smile';
                    else if (lower.includes('garden')) icon = 'bx-leaf';
                    else if (lower.includes('study')) icon = 'bx-book-reader';
                    else if (lower.includes('servant') || lower.includes('quarters')) icon = 'bx-home-alt';
                    else if (lower.includes('serviced')) icon = 'bx-heart';
                    else if (lower.includes('furnished')) icon = 'bx-home-heart';
                    
                    return `<div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: #f9f9f9; border-radius: 10px;">
                        <i class="bx ${icon}" style="font-size: 24px; color: #286192;"></i>
                        <span style="font-size: 15px; font-weight: 500;">${a}</span>
                    </div>`;
                }).join('');
            } else {
                amenitiesContainer.innerHTML = '<p style="color: #717171;">No amenities listed.</p>';
            }
        }



        // Hide/Show booking logic based on category
        const breakdown = document.getElementById('bookingBreakdown');
        const inputs = document.querySelector('.booking-inputs');
        if (p.category === 'book') {
            if (inputs) inputs.style.display = 'block';
            updatePriceCalculation();
        } else {
            if (inputs) inputs.style.display = 'none';
            if (breakdown) {
                if (p.category === 'buy') {
                    document.getElementById('breakdownLabel').innerText = 'Total Purchase Price';
                } else if (p.category === 'rent') {
                    document.getElementById('breakdownLabel').innerText = 'Total Rent Amount';
                } else {
                    document.getElementById('breakdownLabel').innerText = 'Total Price';
                }
                updatePriceCalculation();
            }
        }

        // Load Images into Swiper
        const imagesContainer = document.getElementById('propImages');
        if (p.images && p.images.length > 0) {
            imagesContainer.innerHTML = p.images.map(img => `
                <div class="swiper-slide">
                    <img src="${img}" class="no-copy" alt="${p.title}" onerror="this.src='images/pixon-logo.jpeg'">
                    <div class="watermark-overlay"></div>
                    <div class="protection-overlay"></div>
                </div>
            `).join('');
        } else {
            imagesContainer.innerHTML = `
                <div class="swiper-slide">
                    <img src="images/pixon-logo.jpeg" class="no-copy" alt="No image available">
                    <div class="watermark-overlay"></div>
                    <div class="protection-overlay"></div>
                </div>
            `;
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

        // WhatsApp Reservation functionality
        const reserveBtn = document.getElementById('reserveBtn');
        if (reserveBtn) {
            reserveBtn.addEventListener('click', async () => {
                const nameInput = document.getElementById('inqName');
                const phoneInput = document.getElementById('inqPhone');
                const emailInput = document.getElementById('inqEmail');

                if (nameInput && phoneInput) {
                    if (!nameInput.value.trim() || !phoneInput.value.trim()) {
                        alert("Please enter your Full Name and Phone Number.");
                        return;
                    }
                }

                const checkIn = document.getElementById('checkIn')?.value || 'N/A';
                const checkOut = document.getElementById('checkOut')?.value || 'N/A';
                const totalText = document.getElementById('breakdownTotal')?.innerText || 'N/A';
                
                // Save to Firestore Inquiries
                try {
                    reserveBtn.disabled = true;
                    reserveBtn.innerText = 'Connecting...';
                    await addDoc(collection(db, 'inquiries'), {
                        name: nameInput?.value.trim() || 'N/A',
                        phone: phoneInput?.value.trim() || 'N/A',
                        email: emailInput?.value.trim() || '',
                        propertyId: id,
                        propertyTitle: p.title || 'Unknown',
                        category: p.category || 'unknown',
                        checkIn: p.category === 'book' ? checkIn : 'N/A',
                        checkOut: p.category === 'book' ? checkOut : 'N/A',
                        estimatedTotal: totalText,
                        createdAt: serverTimestamp(),
                        status: 'New'
                    });
                } catch (err) {
                    console.error('Error saving inquiry:', err);
                    // Silently fail so we don't break the WhatsApp flow if DB write fails
                } finally {
                    reserveBtn.disabled = false;
                    reserveBtn.innerText = 'Reserve This Listing';
                }
                
                let message = `Hello Pixon Real Estate! I am interested in *${p.title}* (%0ALink: ${window.location.href}).%0A%0A`;
                if (nameInput && nameInput.value.trim()) {
                    message += `*My Details*:%0AName: ${nameInput.value.trim()}%0APhone: ${phoneInput.value.trim()}%0A%0A`;
                }

                if (p.category === 'book') {
                    message += `*Service*: Short Stay%0A`;
                    message += `*Dates*: ${checkIn} to ${checkOut}%0A`;
                    message += `*Estimated Total*: ${totalText}`;
                } else if (p.category === 'buy') {
                    message += `*Service*: Property Purchase%0A`;
                    message += `*Price*: ${totalText}`;
                } else {
                    message += `*Service*: Rental Inquiry%0A`;
                    message += `*Price*: ${totalText}`;
                }

                const phoneNumber = "256782603730"; // Geoffrey's real number
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                
                window.open(whatsappUrl, '_blank');
            });
        }

        window.initHeroSwiper();

    } catch (error) {
        console.error("Error loading property details:", error);
    }
}

function updatePriceCalculation() {
    const p = window.currentProperty;
    if (!p) return;

    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    let nights = 1;
    if (checkInInput && checkOutInput && p.category !== 'buy') {
        const start = parseDate(checkInInput.value);
        const end = parseDate(checkOutInput.value);
        if (start && end && end > start) {
            const diffTime = Math.abs(end - start);
            nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    }

    const price = Number(p.price) || 0;
    const isShortStay = p.category === 'book';
    const totalPrice = isShortStay ? price * nights : price;
    
    const currency = p.currency || 'UGX';
    const pricePrefix = `${currency} `;
    const formattedTotal = totalPrice.toLocaleString();

    if (isShortStay) {
        document.getElementById('breakdownLabel').innerText = `Total for ${nights} ${nights === 1 ? 'night' : 'nights'}`;
    } else if (p.category === 'buy') {
        document.getElementById('breakdownLabel').innerText = 'Total Purchase Price';
    } else if (p.category === 'rent') {
        document.getElementById('breakdownLabel').innerText = 'Total Rent Amount';
    } else {
        document.getElementById('breakdownLabel').innerText = 'Total Price';
    }
    
    document.getElementById('breakdownSubtotal').innerText = `${pricePrefix}${formattedTotal}`;
    document.getElementById('breakdownTotal').innerText = `${pricePrefix}${formattedTotal}`;
}

// Helper to parse HTML5 Date inputs (YYYY-MM-DD)
function parseDate(str) {
    if (!str) return null;
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

window.initHeroSwiper = function() {
    window.heroSwiper = new Swiper('.property-hero-slider', {
        loop: true,
        autoplay: { delay: 5000 },
        forceToKeepLoop: true,
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        pagination: { el: '.swiper-pagination', clickable: true },
    });

    // Handle native HTML5 date changes
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    if (checkInInput) checkInInput.addEventListener('change', updatePriceCalculation);
    if (checkOutInput) checkOutInput.addEventListener('change', updatePriceCalculation);
};

document.addEventListener('DOMContentLoaded', loadPropertyDetails);
