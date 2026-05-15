import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('input[type="submit"]');
            const originalBtnText = submitBtn.value;

            // Simple loading state
            submitBtn.value = 'SENDING...';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const inquiry = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                message: formData.get('message'),
                createdAt: serverTimestamp(),
                status: 'new'
            };

            try {
                await addDoc(collection(db, 'inquiries'), inquiry);
                alert('Thank you! Your inquiry has been sent to Pixon Real Estate.');
                contactForm.reset();
            } catch (error) {
                console.error("Error sending inquiry:", error);
                alert('Sorry, there was an error sending your message. Please try again or contact us via phone.');
            } finally {
                submitBtn.value = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
