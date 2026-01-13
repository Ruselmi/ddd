let weeklyChart = null;
let categoryChart = null;
let modalChart = null;

function renderCharts() {
    // Dashboard Charts
    const ctx1 = document.getElementById('weekly-chart');
    if (ctx1) {
        if (weeklyChart) weeklyChart.destroy();
        const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const data = labels.map(() => Math.floor(Math.random() * 10000 + 12000));

        weeklyChart = new Chart(ctx1, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Rata-rata', data, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: true, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } } }
        });
    }

    const ctx2 = document.getElementById('category-chart');
    if (ctx2) {
        if (categoryChart) categoryChart.destroy();
        const cats = ['Pangan', 'Sayuran', 'Buah', 'Protein', 'Bumbu', 'Perkebunan'];
        // Use global COMMODITIES
        const catData = cats.map(c => window.COMMODITIES.filter(x => x.cat === c).length);

        categoryChart = new Chart(ctx2, {
            type: 'doughnut',
            data: { labels: cats, datasets: [{ data: catData, backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#86efac' } } } }
        });
    }
}

function renderModalChart(c) {
    const ctx = document.getElementById('modal-chart');
    if (!ctx) return;

    if (modalChart) modalChart.destroy();
    const labels = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 29 + i); return d.toLocaleDateString('id', { day: 'numeric', month: 'short' }); });
    // Simulate history based on current price
    const data = labels.map(() => Math.floor(c.price * (0.9 + Math.random() * 0.2)));

    modalChart = new Chart(ctx, {
        type: 'line', data: { labels, datasets: [{ label: c.name, data, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

window.renderCharts = renderCharts;
window.renderModalChart = renderModalChart;
