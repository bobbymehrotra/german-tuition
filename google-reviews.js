/**
 * Google Business reviews for Bobi's German Classes
 * Maps listing: https://maps.app.goo.gl/5BZKs6qd9RHL9gxo8
 *
 * To show reviews on the site, add entries to google-reviews.json
 * (copy text from your Google Business Profile).
 */
const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/zCTNLH9FUfzd3zof8';

function renderStars(rating) {
    const full = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) =>
        `<i class="fas fa-star${i < full ? '' : ' star-muted'}"></i>`
    ).join('');
}

function renderReviewCard(review) {
    const author = review.author || 'Google reviewer';
    const initial = author.charAt(0).toUpperCase();
    return `
        <article class="google-review-card">
            <div class="google-review-card-header">
                <div class="google-review-avatar" aria-hidden="true">${initial}</div>
                <div>
                    <h4>${author}</h4>
                    <div class="google-review-stars">${renderStars(review.rating || 5)}</div>
                    ${review.time ? `<span class="google-review-time">${review.time}</span>` : ''}
                </div>
                <i class="fab fa-google google-review-badge" title="Google review"></i>
            </div>
            <p>${review.text}</p>
            <a href="${GOOGLE_MAPS_URL}" target="_blank" rel="noopener noreferrer" class="google-review-link">
                View on Google <i class="fas fa-external-link-alt"></i>
            </a>
        </article>
    `;
}

function renderEmptyState() {
    return `
        <div class="google-reviews-empty">
            <i class="fab fa-google"></i>
            <p>Student reviews are published on our Google Business profile. Open Google Maps to read every review or share your experience.</p>
            <a href="${GOOGLE_MAPS_URL}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                Open Google Reviews
            </a>
        </div>
    `;
}

function updateRatingSummary(data) {
    const summary = document.getElementById('google-rating-summary');
    if (!summary || !data.rating) return;

    const textEl = summary.querySelector('.google-rating-text');
    if (textEl) {
        const count = data.reviewCount ? ` · ${data.reviewCount} reviews` : '';
        textEl.textContent = `${data.rating} on Google${count}`;
    }

    const stars = summary.querySelector('.google-stars');
    if (stars) {
        stars.innerHTML = renderStars(data.rating);
    }
}

async function loadGoogleReviews() {
    const list = document.getElementById('google-reviews-list');
    if (!list) return;

    let data = { rating: null, reviewCount: null, reviews: [] };

    try {
        const response = await fetch('google-reviews.json');
        if (response.ok) {
            data = await response.json();
        }
    } catch (err) {
        console.warn('Could not load google-reviews.json', err);
    }

    updateRatingSummary(data);

    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    if (reviews.length === 0) {
        list.innerHTML = renderEmptyState();
        return;
    }

    list.innerHTML = reviews.map(renderReviewCard).join('');
}

document.addEventListener('DOMContentLoaded', loadGoogleReviews);
