// Contact Form Handling
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmission);
    }
});

// Form submission handler
async function handleFormSubmission(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const formObject = Object.fromEntries(formData);
    
    // Validate required fields
    if (!validateForm(formObject)) {
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    try {
        // For now, we'll simulate the submission
        // In production, this would connect to Google Sheets
        await simulateFormSubmission(formObject);
        
        // Show success message
        showNotification('Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.', 'success');
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        console.error('Form submission error:', error);
        showNotification('Sorry, there was an error sending your message. Please try again or contact us directly.', 'error');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Form validation
function validateForm(data) {
    const requiredFields = ['fullName', 'email', 'phone'];
    const errors = [];
    
    // Check required fields
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    });
    
    // Validate email format
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Validate phone number (basic validation)
    if (data.phone && data.phone.replace(/\D/g, '').length < 10) {
        errors.push('Please enter a valid phone number');
    }
    
    if (errors.length > 0) {
        showNotification(errors.join('\n'), 'error');
        return false;
    }
    
    return true;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Simulate form submission (replace with actual Google Sheets integration)
async function simulateFormSubmission(data) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log the data (in production, this would be sent to Google Sheets)
    console.log('Form data to be sent to Google Sheets:', {
        timestamp: new Date().toISOString(),
        ...data
    });
    
    // For actual Google Sheets integration, you would use:
    // 1. Google Apps Script as a web app
    // 2. Or a service like Formspree, Netlify Forms, etc.
    // 3. Or a custom backend API
    
    return true;
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
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
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .notification-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
        .notification-close:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Google Sheets Integration Setup (for future implementation)
function setupGoogleSheetsIntegration() {
    // This function would be implemented when you're ready to connect to Google Sheets
    // You'll need to:
    // 1. Create a Google Apps Script
    // 2. Deploy it as a web app
    // 3. Replace simulateFormSubmission with actual API call
    
    const GOOGLE_SHEETS_WEBAPP_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL';
    
    async function submitToGoogleSheets(data) {
        try {
            const response = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit form');
            }
            
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    }
    
    return submitToGoogleSheets;
}

// Form enhancement features
document.addEventListener('DOMContentLoaded', () => {
    // Auto-save form data to localStorage
    const form = document.getElementById('contactForm');
    if (form) {
        // Load saved data
        const savedData = localStorage.getItem('contactFormData');
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = data[key];
                }
            });
        }
        
        // Save data on input
        form.addEventListener('input', (e) => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            localStorage.setItem('contactFormData', JSON.stringify(data));
        });
        
        // Clear saved data on successful submission
        form.addEventListener('submit', () => {
            localStorage.removeItem('contactFormData');
        });
    }
    
    // Character counter for message field
    const messageField = document.getElementById('message');
    if (messageField) {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = `
            font-size: 0.8rem;
            color: #6b7280;
            text-align: right;
            margin-top: 0.25rem;
        `;
        messageField.parentNode.appendChild(counter);
        
        function updateCounter() {
            const count = messageField.value.length;
            const maxLength = 1000; // Set your desired max length
            counter.textContent = `${count}/${maxLength} characters`;
            
            if (count > maxLength * 0.9) {
                counter.style.color = '#ef4444';
            } else {
                counter.style.color = '#6b7280';
            }
        }
        
        messageField.addEventListener('input', updateCounter);
        updateCounter(); // Initial count
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleFormSubmission,
        validateForm,
        isValidEmail,
        showNotification
    };
} 