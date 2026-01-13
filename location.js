async function detectLocation() {
    try {
        const res = await fetch('http://ip-api.com/json/?fields=city,regionName');
        const data = await res.json();
        const locEl = document.querySelector('#location span');
        if (locEl) {
            locEl.textContent = data.city || data.regionName || 'Indonesia';
        }
    } catch (e) {
        console.warn('Location detection failed:', e);
        const locEl = document.querySelector('#location span');
        if (locEl) {
            locEl.textContent = 'Indonesia';
        }
    }
}
window.detectLocation = detectLocation;
