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
        document.getElementById('propBedrooms').innerText = `${p.bedrooms || 0} Rooms`;
        document.getElementById('propBathrooms').innerText = `${p.bathrooms || 0} Baths`;
        const availText = (() => {
            if (!p.availability) return p.status || 'Luxury and security guaranteed';
            const availDate = new Date(p.availability);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (availDate <= today) return 'Available Now';
            const dateStr = availDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            return `Available on ${dateStr}`;
        })();
        document.getElementById('propStatus').innerText = availText;

        // Price formatting
        const price = p.price ? Number(p.price).toLocaleString() : 'TBD';
        const priceSuffix = p.priceLabel ? `/ ${p.priceLabel}` : (p.category === 'book' ? '/ night' : '');
        const pricePrefix = (p.category === 'rent' || p.category === 'book') ? 'shs. ' : 'UGX ';
        
        document.getElementById('propPrice').innerText = `${pricePrefix}${price}`;
        document.getElementById('priceUnit').innerText = priceSuffix;

        // Dynamic Amenities
        const amenitiesContainer = document.getElementById('propAmenities');
        if (amenitiesContainer) {
            if (p.amenities && p.amenities.length > 0) {
                amenitiesContainer.innerHTML = p.amenities.map(a => {
                    let icon = 'bx-check-circle';
                    if (a.toLowerCase().includes('serviced')) icon = 'bx-heart';
                    if (a.toLowerCase().includes('furnished')) icon = 'bx-home-alt';
                    if (a.toLowerCase().includes('wifi')) icon = 'bx-wifi';
                    if (a.toLowerCase().includes('pool')) icon = 'bx-water';
                    if (a.toLowerCase().includes('gym')) icon = 'bx-dumbbell';
                    if (a.toLowerCase().includes('security')) icon = 'bx-shield-quarter';
                    
                    return `<div class="amenity-pill"><i class="bx ${icon}"></i> ${a}</div>`;
                }).join('');
            } else {
                amenitiesContainer.innerHTML = '<p>No amenities listed.</p>';
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
    
    const pricePrefix = (p.category === 'rent' || p.category === 'book') ? 'shs. ' : 'UGX ';
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

// Helper to parse DD/MM/YYYY
function parseDate(str) {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

window.initHeroSwiper = function() {
    window.heroSwiper = new Swiper('.property-hero-slider', {
        loop: true,
        autoplay: { delay: 5000 },
        forceToKeepLoop: true,
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        pagination: { el: '.swiper-pagination', clickable: true },
    });

    // Handle date changes
    $('[data-toggle="datepicker"]').on('pick.datepicker', function (e) {
        setTimeout(updatePriceCalculation, 100);
    });
};

document.addEventListener('DOMContentLoaded', loadPropertyDetails);
