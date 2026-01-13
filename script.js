// ============ CONSTANTS & STATE ============
const PROVINCES = [
    { name: 'Aceh', lat: 4.69, lng: 96.75 }, { name: 'Sumatera Utara', lat: 2.11, lng: 99.55 }, { name: 'Sumatera Barat', lat: -0.74, lng: 100.8 },
    { name: 'Riau', lat: 0.29, lng: 101.71 }, { name: 'Jambi', lat: -1.49, lng: 102.44 }, { name: 'Sumatera Selatan', lat: -3.32, lng: 103.91 },
    { name: 'Bengkulu', lat: -3.58, lng: 102.35 }, { name: 'Lampung', lat: -4.56, lng: 105.41 }, { name: 'DKI Jakarta', lat: -6.21, lng: 106.85 },
    { name: 'Jawa Barat', lat: -6.92, lng: 107.62 }, { name: 'Jawa Tengah', lat: -7.15, lng: 110.14 }, { name: 'DI Yogyakarta', lat: -7.80, lng: 110.37 },
    { name: 'Jawa Timur', lat: -7.25, lng: 112.77 }, { name: 'Banten', lat: -6.41, lng: 106.06 }, { name: 'Bali', lat: -8.34, lng: 115.09 },
    { name: 'NTB', lat: -8.65, lng: 117.36 }, { name: 'NTT', lat: -8.66, lng: 121.08 }, { name: 'Kalimantan Barat', lat: -0.28, lng: 111.48 },
    { name: 'Kalimantan Tengah', lat: -1.68, lng: 113.38 }, { name: 'Kalimantan Selatan', lat: -3.09, lng: 115.28 },
    { name: 'Kalimantan Timur', lat: 1.64, lng: 116.42 }, { name: 'Sulawesi Utara', lat: 0.62, lng: 123.98 },
    { name: 'Sulawesi Tengah', lat: -1.43, lng: 121.45 }, { name: 'Sulawesi Selatan', lat: -3.67, lng: 119.97 },
    { name: 'Maluku', lat: -3.24, lng: 130.15 }, { name: 'Papua', lat: -4.27, lng: 138.08 }
];

let currentPage = 'dashboard';
let currentCat = 'Semua';
let map = null;
let markersLayer = null;

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', init);

async function init() {
    const bar = document.getElementById('loading-bar');
    const status = document.getElementById('loading-status');

    status.textContent = 'Memuat Data Komoditas...';
    bar.style.width = '30%';

    status.textContent = 'Menghubungkan ke API...';
    bar.style.width = '50%';
    try { await DataAPI.fetchWithFallback(); } catch (e) { console.log("Offline mode active"); }

    status.textContent = 'Mengambil Harga Internasional...';
    bar.style.width = '70%';
    try {
        const intl = await DataAPI.fetchInternationalPrices();
        if (intl.success) {
            window.EXCHANGE_RATE = intl.rate;
            const exEl = document.querySelector('.exchange-rate');
            if (exEl) exEl.textContent = `1 USD = Rp ${window.fmt(window.EXCHANGE_RATE)}`;
        }
    } catch (e) { }

    status.textContent = 'Menyiapkan Aplikasi...';
    bar.style.width = '90%';
    await window.sleep(500);

    status.textContent = 'Selesai!';
    bar.style.width = '100%';
    await window.sleep(300);

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('app').classList.add('visible');

    // Setup Components
    setupNav();
    setupFilters();
    renderDashboard();
    renderCommodities();
    renderIntl();

    // External Module Setups
    if (window.setupCalc) window.setupCalc();
    if (window.detectLocation) window.detectLocation();

    // Start Simulation
    startRealtime();

    // Setup API Switcher
    const badge = document.getElementById('api-source-badge');
    if (badge) {
        badge.addEventListener('click', () => {
            const sources = Object.keys(API_CONFIG.sources);
            const nextIdx = (sources.indexOf(currentAPISource) + 1) % sources.length;
            DataAPI.switchSource(sources[nextIdx]);
        });
    }
}

// ============ NAVIGATION & MAP FIX ============
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            navigateTo(item.dataset.page);
        });
    });

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

    const searchBox = document.getElementById('search');
    if (searchBox) searchBox.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = window.COMMODITIES.filter(c => c.name.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q));
        renderCommodities(filtered);
        if (currentPage !== 'komoditas') navigateTo('komoditas');
    });

    const modalClose = document.getElementById('modal-close');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeModal);
}

function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);

    document.getElementById('sidebar').classList.remove('open');

    // --- FIX PETA ---
    if (page === 'peta') {
        setTimeout(() => {
            if (!map) {
                initMap();
            } else {
                map.invalidateSize();
                // Restore logic: Jangan reset view jika user sudah zoom/pan, cukup update markers
                if (!markersLayer || markersLayer.getLayers().length === 0) {
                    updateMapMarkers(document.getElementById('map-select').value);
                }
            }
        }, 300);
    }
}

// ============ FILTERS ============
function setupFilters() {
    const container = document.getElementById('filters');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(c =>
        `<button class="filter-chip ${c === 'Semua' ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');

    container.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCat = chip.dataset.cat;
            renderCommodities();
        });
    });
}

// ============ RENDERING ============
function renderDashboard() {
    const stats = window.getStats(window.COMMODITIES);
    const upEl = document.getElementById('stat-up');
    const downEl = document.getElementById('stat-down');
    const totalEl = document.getElementById('stat-total');

    if (upEl) upEl.textContent = stats.up;
    if (downEl) downEl.textContent = stats.down;
    if (totalEl) totalEl.textContent = stats.total;

    renderTopMoversUI();
    if (window.renderCharts) window.renderCharts();
}

function renderTopMoversUI() {
    const movers = window.getTopMovers(window.COMMODITIES);
    const container = document.getElementById('top-movers');
    if (!container) return;

    container.innerHTML = movers.map(c => `
        <div class="mover-card">
            <div class="mover-icon">${c.icon}</div>
            <div>
                <div class="mover-name">${c.name}</div>
                <div class="mover-change ${c.change >= 0 ? 'up' : 'down'}">${c.change >= 0 ? '↑' : '↓'} ${window.fmtChg(c.change)}</div>
            </div>
        </div>
    `).join('');
}

function renderCommodities(list = null) {
    const container = document.getElementById('commodities-grid');
    if (!container) return;

    const data = list || (currentCat === 'Semua' ? window.COMMODITIES : window.COMMODITIES.filter(c => c.cat === currentCat));
    container.innerHTML = data.map(c => `
        <div class="commodity-card" onclick="window.showModal('${c.id}')">
            <div class="commodity-header">
                <div class="commodity-icon">${c.icon}</div>
                <div>
                    <div class="commodity-name">${c.name}</div>
                    <div class="commodity-category">${c.cat}</div>
                </div>
            </div>
            <div class="commodity-price">${window.fmt(c.price)}/${c.unit}</div>
            <div class="commodity-change ${c.change >= 0 ? 'up' : 'down'}">${c.change >= 0 ? '↑' : '↓'} ${window.fmtChg(c.change)}</div>
            <div class="commodity-subs">${c.subs.length} sub-komoditas</div>
        </div>
    `).join('');
}

function renderIntl() {
    const container = document.getElementById('intl-grid');
    if (!container) return;

    container.innerHTML = INTL_PRICES.map(i => `
        <div class="intl-card">
            <h3>${i.name}</h3>
            <div class="intl-symbol">${i.symbol}</div>
            <div class="intl-prices">
                <div class="intl-price-item"><div class="intl-price-label">Internasional</div><div class="intl-price-value global">$${i.usd}/${i.unit}</div></div>
                <div class="intl-price-item"><div class="intl-price-label">Lokal (IDR)</div><div class="intl-price-value local">${window.fmt(i.usd * window.EXCHANGE_RATE)}</div></div>
            </div>
        </div>
    `).join('');
}

// ============ MODAL ============
function showModal(id) {
    const c = window.COMMODITIES.find(x => x.id === id);
    if (!c) return;

    document.getElementById('modal-icon').textContent = c.icon;
    document.getElementById('modal-title').textContent = c.name;
    document.getElementById('sub-list').innerHTML = c.subs.map(s => `
        <div class="sub-commodity-item">
            <div><div class="sub-name">${s.name}</div><div class="sub-variety">${s.variety}</div></div>
            <div><div class="sub-price">${window.fmt(s.price)}</div><div class="commodity-change ${s.change >= 0 ? 'up' : 'down'}" style="font-size:0.7rem">${window.fmtChg(s.change)}</div></div>
        </div>
    `).join('');

    if (window.AILogic) {
        const analysis = window.AILogic.analyzeMarket(c);
        console.log("AI Analysis:", analysis);
    }

    if (window.renderModalChart) window.renderModalChart(c);

    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('active');
}
window.showModal = showModal;

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('active');
}
window.closeModal = closeModal;

// ============ MAP LOGIC (DETERMINISTIC & STABLE) ============

// Helper untuk Random Deterministik based on seed string
function getPseudoRandom(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
}

function initMap() {
    const container = document.getElementById('map-container');
    if (!container) return;

    // Inisialisasi Peta
    map = L.map('map-container').setView([-2.5, 118], 5);

    // Tile Layer Clean & Profesional
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap - Taniku',
        maxZoom: 12,
        minZoom: 4
    }).addTo(map);

    // Layer Group
    markersLayer = L.layerGroup().addTo(map);

    // Setup Selector
    const sel = document.getElementById('map-select');
    if (sel) {
        sel.innerHTML = '<option value="">Semua Komoditas (Indeks Pangan)</option>' +
            window.COMMODITIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');

        sel.addEventListener('change', (e) => {
            updateMapMarkers(e.target.value);
        });
    }

    // Render markers awal
    updateMapMarkers('');

    setTimeout(() => map.invalidateSize(), 150);
}

function updateMapMarkers(commodityId) {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    const comm = commodityId ? window.COMMODITIES.find(c => c.id === commodityId) : null;

    PROVINCES.forEach(p => {
        let price, displayPrice, popupContent;
        let color = '#22c55e'; // Default Hijau

        if (comm) {
            // Gunakan Seed: ID Komoditas + Nama Provinsi
            // Ini menjamin harga "Beras" di "Jawa Barat" SELALU SAMA setiap kali dibuka
            const seed = comm.id + p.name;
            const rand = getPseudoRandom(seed);

            // Variasi harga +/- 15% berdasarkan seed deterministik
            const vari = (rand * 0.3) - 0.15;

            price = comm.price * (1 + vari);
            displayPrice = window.fmt(price);

            // Logika Warna
            if (vari > 0.08) color = '#ef4444';       // Mahal (>8%)
            else if (vari < -0.08) color = '#22c55e'; // Murah (<-8%)
            else color = '#f59e0b';                  // Normal

            popupContent = `
                <div style="text-align:center; min-width:120px; font-family:'Outfit',sans-serif">
                    <b style="color:var(--bg-secondary);display:block;margin-bottom:4px;font-size:1.1em">${p.name}</b>
                    <div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-bottom:6px">
                        <span style="font-size:1.5em">${comm.icon}</span>
                        <span style="font-size:0.9em;color:#666;font-weight:600">${comm.name}</span>
                    </div>
                    <div style="font-size:1.1em;font-weight:bold;color:#fff;padding:6px;background:${color};border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.2)">
                        Rp ${displayPrice}
                    </div>
                </div>`;
        } else {
            // Mode "Semua" - Indeks Pangan Stabil per Provinsi
            const rand = getPseudoRandom(p.name + "INDEX");
            const index = Math.floor(rand * 40) + 60; // 60-100

            if (index > 85) color = '#ef4444'; // Rawan
            else if (index > 75) color = '#f59e0b'; // Waspada

            popupContent = `
                <div style="text-align:center;font-family:'Outfit',sans-serif">
                    <b>${p.name}</b><br>
                    Indeks Ketahanan: <b style="color:${color};font-size:1.2em">${index}</b>
                </div>`;
        }

        // Marker Styling
        L.circleMarker([p.lat, p.lng], {
            radius: comm ? 12 : 10,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        })
            .bindPopup(popupContent)
            .addTo(markersLayer);
    });
}
window.initMap = initMap;

// ============ REAL-TIME SIMULATION ============
function startRealtime() {
    // Mode Realtime: Hanya update perubahan global, tidak merender ulang seluruh peta secara agresif
    // agar tooltip tidak tertutup saat user sedang melihat data.
    setInterval(() => {
        window.COMMODITIES.forEach(c => {
            const chg = (Math.random() * 2 - 1);
            c.change = chg.toFixed(2) * 1;
            c.price = Math.round(c.price * (1 + (chg / 2000)));
        });

        if (currentPage === 'dashboard') {
            renderDashboard();
        }
    }, 5000);
}
