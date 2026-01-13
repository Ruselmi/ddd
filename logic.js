// Utility Functions
const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtChg = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Market Logic
function getTopMovers(commodities, count = 6) {
    return [...commodities].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, count);
}

function getStats(commodities) {
    return {
        total: commodities.length,
        up: commodities.filter(c => c.change > 0).length,
        down: commodities.filter(c => c.change < 0).length
    };
}

// Make globally available
window.fmt = fmt;
window.fmtChg = fmtChg;
window.sleep = sleep;
window.getTopMovers = getTopMovers;
window.getStats = getStats;
