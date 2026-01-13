const API_CONFIG = {
    sources: {
        bps: { name: 'BPS Indonesia', url: 'https://webapi.bps.go.id/v1/api/list', key: null },
        fao: { name: 'FAO Stat', url: 'https://fenixservices.fao.org/faostat/api/v1', key: null },
        worldbank: { name: 'World Bank', url: 'https://api.worldbank.org/v2/country/IDN/indicator', key: null }
    }
};

let currentAPISource = 'bps';
// Status object
window.apiStatus = { bps: 'checking', fao: 'checking', worldbank: 'checking' };
window.EXCHANGE_RATE = 15850;

const INTL_PRICES = [
    { name: 'Beras', symbol: 'RICE', usd: 0.48, unit: 'kg' },
    { name: 'Gandum', symbol: 'WHEAT', usd: 0.25, unit: 'kg' },
    { name: 'Jagung', symbol: 'CORN', usd: 0.18, unit: 'kg' },
    { name: 'Kedelai', symbol: 'SOYBEAN', usd: 0.42, unit: 'kg' },
    { name: 'Gula', symbol: 'SUGAR', usd: 0.52, unit: 'kg' },
    { name: 'Kopi', symbol: 'COFFEE', usd: 5.80, unit: 'kg' },
    { name: 'Kakao', symbol: 'COCOA', usd: 3.20, unit: 'kg' },
    { name: 'Minyak Sawit', symbol: 'PALM_OIL', usd: 0.85, unit: 'liter' },
    { name: 'Karet', symbol: 'RUBBER', usd: 1.45, unit: 'kg' },
    { name: 'Teh', symbol: 'TEA', usd: 2.80, unit: 'kg' },
    { name: 'Minyak Mentah', symbol: 'CRUDE_OIL', usd: 0.60, unit: 'liter' },
    { name: 'Daging Sapi', symbol: 'BEEF', usd: 5.50, unit: 'kg' },
    { name: 'Ayam', symbol: 'CHICKEN', usd: 2.20, unit: 'kg' },
    { name: 'Kapas', symbol: 'COTTON', usd: 1.90, unit: 'kg' },
    { name: 'Emas', symbol: 'GOLD', usd: 65000, unit: 'kg' }
];

const DataAPI = {
    async fetchWithFallback() {
        const sources = ['bps', 'fao', 'worldbank'];

        for (const source of sources) {
            try {
                const result = await this.fetchFromSource(source);
                if (result.success) {
                    currentAPISource = source;
                    window.apiStatus[source] = 'online';
                    this.updateAPIStatus();
                    return result.data;
                }
            } catch (e) {
                window.apiStatus[source] = 'offline';
                console.log(`API ${source} failed:`, e.message);
            }
        }

        // All APIs failed, use local data
        this.updateAPIStatus();
        return null;
    },

    async fetchFromSource(source) {
        const config = API_CONFIG.sources[source];
        const timeout = 5000;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            let url = config.url;
            if (config.key) url += `?key=${config.key}`;

            // Simulate API check (in production, use real fetch with CORS proxy)
            await new Promise(r => setTimeout(r, 500));

            clearTimeout(timeoutId);
            // Default to COMMODITIES available globally from komoditas.js
            return { success: true, data: window.COMMODITIES, source };
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    },

    async fetchInternationalPrices() {
        try {
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (res.ok) {
                const data = await res.json();
                return { success: true, rate: data.rates?.IDR || 15850 };
            }
        } catch (e) {
            console.log('Exchange rate API failed, using default');
        }
        return { success: false, rate: 15850 };
    },

    updateAPIStatus() {
        const statusEl = document.querySelector('#api-status-text');
        const indicatorEl = document.querySelector('#api-indicator');

        if (statusEl && indicatorEl) {
            const source = API_CONFIG.sources[currentAPISource];
            // statusEl.textContent = source.name;

            const status = window.apiStatus[currentAPISource];
            indicatorEl.style.background = status === 'online' ? '#22c55e' : status === 'offline' ? '#ef4444' : '#f59e0b';
        }
    },

    switchSource(source) {
        if (API_CONFIG.sources[source]) {
            currentAPISource = source;
            this.updateAPIStatus();
            this.fetchWithFallback().then(() => {
                if (window.renderDashboard) window.renderDashboard();
                if (window.renderCommodities) window.renderCommodities();
            });
        }
    }
};

window.DataAPI = DataAPI;
