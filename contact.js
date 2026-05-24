/**
 * Contact form handling for BoloGerman
 *
 * Two routes are supported:
 *   1. "Send Message"  -> POSTs to a Google Apps Script web app that appends a row in Google Sheets.
 *   2. "Send via WhatsApp" -> opens WhatsApp with the form data pre-filled as a chat message.
 *
 * To enable Google Sheets storage, paste the deployed Apps Script web app URL into
 * GOOGLE_SHEETS_WEBAPP_URL below. Until that's filled in, submissions are logged to
 * the browser console as a fallback so the form still feels responsive.
 */

// === CONFIG =================================================================
// Deployed Google Apps Script web app — appends form submissions to Google Sheets.
const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzNJheJRBvtvhLVcX4HF1oKt9YI9KL2i6JaD8HZcRt0V5PDzri2b6rda0ParoHCnnTv/exec';

// WhatsApp number in international format (country code + number, no '+' or spaces)
const WHATSAPP_NUMBER = '919810397634';
// ===========================================================================

// Per-country digit counts for phone number validation
const COUNTRY_DIGITS = {
    '+91': 10,  // India
    '+1':  10,  // US / Canada
    '+44': 10,  // UK
    '+49': 11,  // Germany
    '+971': 9,  // UAE
    '+65':  8,  // Singapore
    '+61':  9,  // Australia
    '+33':  9,  // France
    '+81': 10,  // Japan
    '+7':  10,  // Russia
};

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmission);
    }

    // WhatsApp button is now a plain <a> tag above the form — no JS needed

    initPhoneInput();
});

/**
 * Phone input initialiser.
 * - Restricts input to digits only (fixes backspace "snap-back" caused by browser
 *   autofill re-injecting a stored value after non-numeric input is detected).
 * - Enforces the correct max-length for the selected country code.
 * - Updates the placeholder and maxlength whenever the country changes.
 */
function initPhoneInput() {
    const countrySelect = document.getElementById('countryCode');
    const phoneInput    = document.getElementById('phone');
    if (!countrySelect || !phoneInput) return;

    function getMaxDigits() {
        return COUNTRY_DIGITS[countrySelect.value] || 15;
    }

    function applyMaxLength() {
        const max = getMaxDigits();
        phoneInput.setAttribute('maxlength', max);
        phoneInput.setAttribute('placeholder', `${max}-digit number`);
    }

    // When country changes, update limit and trim any excess digits already typed
    countrySelect.addEventListener('change', () => {
        applyMaxLength();
        const max = getMaxDigits();
        if (phoneInput.value.length > max) {
            phoneInput.value = phoneInput.value.slice(0, max);
        }
    });

    // On every input event: strip non-digits and enforce max length.
    // This is the key fix — by explicitly setting value to digits-only we prevent
    // browser autofill / autocomplete from restoring an old value after backspace.
    phoneInput.addEventListener('input', () => {
        const max    = getMaxDigits();
        const digits = phoneInput.value.replace(/\D/g, '').slice(0, max);
        if (phoneInput.value !== digits) {
            // Preserve cursor position when we rewrite the value
            const selStart = phoneInput.selectionStart;
            const diff     = phoneInput.value.length - digits.length;
            phoneInput.value = digits;
            try {
                phoneInput.setSelectionRange(selStart - diff, selStart - diff);
            } catch (_) { /* ignore on older browsers */ }
        }
    });

    applyMaxLength();
}

// Form submission handler
async function handleFormSubmission(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formObject = Object.fromEntries(formData);

    if (!validateForm(formObject)) {
        return;
    }

    // Merge countryCode + phone into a single value for Google Sheets
    // (the sheet has no countryCode column; countryCode is just for front-end UX)
    if (formObject.countryCode && formObject.phone) {
        formObject.phone = formObject.countryCode.replace('+', '') + ' ' + formObject.phone;
    }
    delete formObject.countryCode;

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;

    try {
        if (GOOGLE_SHEETS_WEBAPP_URL) {
            await submitToGoogleSheets(formObject);
        } else {
            await simulateFormSubmission(formObject);
        }

        // Track successful lead in Google Analytics 4
        if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
                event_category: 'contact_form',
                event_label: formObject.learningGoal || 'unspecified',
                level: formObject.currentLevel || 'unspecified',
                target_level: formObject.targetLevel || 'unspecified'
            });
        }

        showNotification(
            "Thank you! Your message has been received. Bobby will get back to you within 24 hours. " +
            "For a faster response, you can also message on WhatsApp.",
            'success'
        );

        e.target.reset();
        localStorage.removeItem('contactFormData');
    } catch (error) {
        console.error('Form submission error:', error);
        showNotification(
            "We couldn't submit your message right now. Please try WhatsApp or call +91 98103 97634.",
            'error'
        );
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Send the form to Google Sheets via the deployed Apps Script web app.
// Uses URL-encoded body + mode:'no-cors' so the request doesn't trigger a CORS preflight.
// Trade-off: we can't read the response, so we assume success if the network call doesn't throw.
async function submitToGoogleSheets(data) {
    const body = new URLSearchParams();
    body.append('timestamp', new Date().toISOString());
    body.append('source', 'website_contact_form');
    Object.keys(data).forEach(key => {
        body.append(key, data[key] ?? '');
    });

    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body
    });
    return true;
}

// Open WhatsApp with the form data pre-filled. If the form is empty,
// just opens a generic chat — useful as a quick contact option.
function sendViaWhatsApp(e) {
    if (e) e.preventDefault();

    const form = document.getElementById('contactForm');
    let message = "Hi Bobby, I'm interested in your German classes.";

    if (form) {
        const data = Object.fromEntries(new FormData(form));
        const lines = [];
        if (data.fullName) lines.push(`Name: ${data.fullName}`);
        if (data.email) lines.push(`Email: ${data.email}`);
        if (data.phone) {
            const cc = data.countryCode || '+91';
            lines.push(`Phone: ${cc} ${data.phone}`);
        }
        if (data.currentLevel) lines.push(`Current Level: ${data.currentLevel}`);
        if (data.targetLevel) lines.push(`Target Exam: ${data.targetLevel}`);
        if (data.timeline) lines.push(`Timeline: ${data.timeline}`);
        if (data.learningGoal) lines.push(`Goal: ${data.learningGoal}`);
        if (data.preferredTime) lines.push(`Preferred Time: ${data.preferredTime}`);
        if (data.preferredMode) lines.push(`Mode: ${data.preferredMode}`);
        if (data.message) lines.push(`\nMessage: ${data.message}`);

        if (lines.length > 0) {
            message = "Hi Bobby, I'm interested in your German classes.\n\n" + lines.join('\n');
        }
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    if (typeof gtag === 'function') {
        gtag('event', 'whatsapp_click', {
            event_category: 'contact',
            event_label: 'contact_form_page'
        });
    }

    window.open(url, '_blank', 'noopener,noreferrer');
}

// Form validation
function validateForm(data) {
    const requiredFields = ['fullName', 'email', 'phone'];
    const errors = [];

    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            const labels = { fullName: 'Full Name', email: 'Email', phone: 'Phone' };
            errors.push(`${labels[field]} is required`);
        }
    });

    if (data.email && !isValidEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }

    if (data.phone) {
        const digits      = data.phone.replace(/\D/g, '');
        const countryCode = data.countryCode || '+91';
        const required    = COUNTRY_DIGITS[countryCode] || 10;
        if (digits.length !== required) {
            errors.push(`Phone number must be exactly ${required} digits for ${countryCode}`);
        }
    }

    if (errors.length > 0) {
        showNotification(errors.join('\n'), 'error');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fallback used until GOOGLE_SHEETS_WEBAPP_URL is configured
async function simulateFormSubmission(data) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.warn(
        '[BoloGerman] Form submitted but GOOGLE_SHEETS_WEBAPP_URL is not configured. ' +
        'Data was NOT saved to Google Sheets. See contact.js for setup instructions.'
    );
    console.log('Form data:', { timestamp: new Date().toISOString(), ...data });
    return true;
}

// Notification system
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close">&times;</button>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        white-space: pre-line;
    `;

    if (!document.getElementById('notification-keyframes')) {
        const style = document.createElement('style');
        style.id = 'notification-keyframes';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex; align-items: flex-start;
                justify-content: space-between; gap: 1rem;
            }
            .notification-close {
                background: none; border: none; color: white;
                font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1;
            }
            .notification-close:hover { opacity: 0.8; }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 7000);
}

// Auto-save form data + character counter
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (form) {
        const savedData = localStorage.getItem('contactFormData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field) field.value = data[key];
                });
            } catch (e) { /* ignore corrupted localStorage */ }
        }

        form.addEventListener('input', () => {
            const data = Object.fromEntries(new FormData(form));
            localStorage.setItem('contactFormData', JSON.stringify(data));
        });
    }

    const messageField = document.getElementById('message');
    if (messageField) {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = `
            font-size: 0.8rem; color: #6b7280;
            text-align: right; margin-top: 0.25rem;
        `;
        messageField.parentNode.appendChild(counter);

        const maxLength = 1000;
        function updateCounter() {
            const count = messageField.value.length;
            counter.textContent = `${count}/${maxLength} characters`;
            counter.style.color = count > maxLength * 0.9 ? '#ef4444' : '#6b7280';
        }
        messageField.addEventListener('input', updateCounter);
        updateCounter();
    }
});
