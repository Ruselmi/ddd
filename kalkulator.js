function setupCalc() {
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`calc-${tab.dataset.tab}`).classList.add('active');
        });
    });

    const btnLahan = document.getElementById('calc-lahan-btn');
    if (btnLahan) btnLahan.addEventListener('click', calcLahan);

    const btnBenih = document.getElementById('calc-benih-btn');
    if (btnBenih) btnBenih.addEventListener('click', calcBenih);

    const btnPupuk = document.getElementById('calc-pupuk-btn');
    if (btnPupuk) btnPupuk.addEventListener('click', calcPupuk);

    const btnPanen = document.getElementById('calc-panen-btn');
    if (btnPanen) btnPanen.addEventListener('click', calcPanen);

    // Cuaca Button might be added dynamically or if exists
    const btnCuaca = document.getElementById('calc-cuaca-btn');
    if (btnCuaca) btnCuaca.addEventListener('click', calcCuaca);

    // Welcome popup close
    const welcomeClose = document.getElementById('welcome-close');
    if (welcomeClose) welcomeClose.addEventListener('click', () => {
        document.getElementById('welcome-modal').classList.remove('active');
    });
}

function calcLahan() {
    const nilai = parseFloat(document.getElementById('lahan-nilai').value) || 1;
    const dari = document.getElementById('lahan-dari').value;

    const toM2 = { hektar: 10000, are: 100, m2: 1, bata: 14.0625, tumbak: 14.0625, acre: 4046.86 };
    const m2 = nilai * toM2[dari];

    document.getElementById('lahan-result').innerHTML = `
        <div style="font-weight:600;margin-bottom:1rem">📐 Hasil Konversi:</div>
        <div style="display:grid;gap:0.5rem">
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>Hektar (Ha)</span><span style="font-weight:700;color:var(--text-secondary)">${(m2 / 10000).toFixed(4)} Ha</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>Are</span><span style="font-weight:700;color:var(--text-secondary)">${(m2 / 100).toFixed(2)} Are</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>Meter Persegi</span><span style="font-weight:700;color:var(--text-secondary)">${m2.toLocaleString('id')} m²</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>Bata/Ru (Jawa)</span><span style="font-weight:700;color:var(--text-secondary)">${(m2 / 14.0625).toFixed(2)} Bata</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>Acre</span><span style="font-weight:700;color:var(--text-secondary)">${(m2 / 4046.86).toFixed(4)} Acre</span>
            </div>
        </div>
    `;
}

function calcBenih() {
    const luas = parseFloat(document.getElementById('benih-luas').value) || 1;
    const jenis = document.getElementById('benih-jenis').value;

    const benihData = {
        padi: { kebutuhan: 25, satuan: 'kg', harga: 15000 },
        jagung: { kebutuhan: 20, satuan: 'kg', harga: 85000 },
        kedelai: { kebutuhan: 40, satuan: 'kg', harga: 12000 },
        cabai: { kebutuhan: 0.15, satuan: 'kg', harga: 350000 },
        tomat: { kebutuhan: 0.2, satuan: 'kg', harga: 450000 },
        bawang: { kebutuhan: 1000, satuan: 'kg', harga: 38000 },
        kentang: { kebutuhan: 1500, satuan: 'kg', harga: 14000 },
        kopi: { kebutuhan: 1100, satuan: 'pohon', harga: 5000 },
        kakao: { kebutuhan: 1000, satuan: 'pohon', harga: 8000 }
    };

    const data = benihData[jenis];
    const total = luas * data.kebutuhan;
    const biaya = total * data.harga;

    document.getElementById('benih-result').innerHTML = `
        <div style="font-weight:600;margin-bottom:1rem">🌱 Kebutuhan Benih untuk ${luas} Hektar:</div>
        <div style="display:grid;gap:0.75rem">
            <div style="padding:1rem;background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05));border-radius:10px;text-align:center">
                <div style="font-size:2rem;font-weight:700;color:var(--primary)">${total.toLocaleString('id')} ${data.satuan}</div>
                <div style="font-size:0.875rem;color:var(--text-muted)">Total Kebutuhan Benih</div>
            </div>
            <div style="padding:1rem;background:var(--bg-primary);border-radius:10px;text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--gold)">Rp ${new Intl.NumberFormat('id-ID').format(biaya)}</div>
                <div style="font-size:0.875rem;color:var(--text-muted)">Estimasi Biaya Benih</div>
            </div>
        </div>
        <div style="margin-top:1rem;font-size:0.75rem;color:var(--text-muted)">* Harga benih berdasarkan data Kementan RI</div>
    `;
}

function calcPupuk() {
    const luas = parseFloat(document.getElementById('pupuk-luas').value) || 1;
    const jenis = document.getElementById('pupuk-jenis').value;

    const pupukData = {
        padi: { urea: 200, sp36: 100, kcl: 100, npk: 300 },
        jagung: { urea: 300, sp36: 150, kcl: 100, npk: 400 },
        sayuran: { urea: 150, sp36: 200, kcl: 150, npk: 350 },
        buah: { urea: 100, sp36: 150, kcl: 200, npk: 300 },
        perkebunan: { urea: 250, sp36: 100, kcl: 150, npk: 400 }
    };

    const harga = { urea: 2250, sp36: 2400, kcl: 5500, npk: 2500 };
    const data = pupukData[jenis];
    const biayaUrea = data.urea * luas * harga.urea;
    const biayaSP36 = data.sp36 * luas * harga.sp36;
    const biayaKCL = data.kcl * luas * harga.kcl;
    const biayaNPK = data.npk * luas * harga.npk;
    const totalBiaya = biayaUrea + biayaSP36 + biayaKCL + biayaNPK;
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    document.getElementById('pupuk-result').innerHTML = `
        <div style="font-weight:600;margin-bottom:1rem">🧪 Kebutuhan Pupuk untuk ${luas} Hektar:</div>
        <div style="display:grid;gap:0.5rem">
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>Urea</span><span style="font-weight:600">${(data.urea * luas).toLocaleString('id')} kg</span><span style="color:var(--gold)">${fmt(biayaUrea)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>SP-36</span><span style="font-weight:600">${(data.sp36 * luas).toLocaleString('id')} kg</span><span style="color:var(--gold)">${fmt(biayaSP36)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>KCL</span><span style="font-weight:600">${(data.kcl * luas).toLocaleString('id')} kg</span><span style="color:var(--gold)">${fmt(biayaKCL)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-primary);border-radius:8px">
                <span>NPK</span><span style="font-weight:600">${(data.npk * luas).toLocaleString('id')} kg</span><span style="color:var(--gold)">${fmt(biayaNPK)}</span>
            </div>
        </div>
        <div style="margin-top:1rem;padding:1rem;background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.05));border-radius:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:var(--gold)">${fmt(totalBiaya)}</div>
            <div style="font-size:0.875rem;color:var(--text-muted)">Total Estimasi Biaya Pupuk</div>
        </div>
        <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--text-muted)">* Harga pupuk berdasarkan HET Kementan RI</div>
    `;
}

function calcPanen() {
    const luas = parseFloat(document.getElementById('panen-luas').value) || 1;
    const jenis = document.getElementById('panen-jenis').value;

    const panenData = {
        padi: { hasil: 5000, harga: 5500, nama: 'Gabah Kering' },
        jagung: { hasil: 8000, harga: 4500, nama: 'Jagung Pipil' },
        kedelai: { hasil: 1500, harga: 9500, nama: 'Kedelai' },
        cabai: { hasil: 12000, harga: 45000, nama: 'Cabai Merah' },
        tomat: { hasil: 25000, harga: 8000, nama: 'Tomat' },
        bawang: { hasil: 10000, harga: 38000, nama: 'Bawang Merah' },
        kentang: { hasil: 20000, harga: 12000, nama: 'Kentang' },
        kopi: { hasil: 800, harga: 85000, nama: 'Kopi Biji' },
        kakao: { hasil: 1000, harga: 45000, nama: 'Kakao Biji' },
        sawit: { hasil: 20000, harga: 2800, nama: 'TBS Sawit' }
    };
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const data = panenData[jenis];
    const hasilKg = data.hasil * luas;
    const pendapatan = hasilKg * data.harga;

    document.getElementById('panen-result').innerHTML = `
        <div style="font-weight:600;margin-bottom:1rem">📦 Estimasi Panen ${data.nama} untuk ${luas} Hektar:</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div style="padding:1.5rem;background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05));border-radius:12px;text-align:center">
                <div style="font-size:0.875rem;color:var(--text-muted);margin-bottom:0.5rem">Hasil Panen</div>
                <div style="font-size:2rem;font-weight:700;color:var(--primary)">${(hasilKg / 1000).toFixed(1)} Ton</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${hasilKg.toLocaleString('id')} kg</div>
            </div>
            <div style="padding:1.5rem;background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(59,130,246,0.05));border-radius:12px;text-align:center">
                <div style="font-size:0.875rem;color:var(--text-muted);margin-bottom:0.5rem">Harga/kg</div>
                <div style="font-size:1.5rem;font-weight:700;color:var(--blue)">${fmt(data.harga)}</div>
            </div>
        </div>
        <div style="margin-top:1rem;padding:1.5rem;background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.05));border:1px solid var(--gold);border-radius:12px;text-align:center">
            <div style="font-size:0.875rem;color:var(--text-muted);margin-bottom:0.5rem">💰 Estimasi Pendapatan Kotor</div>
            <div style="font-size:2.5rem;font-weight:700;color:var(--gold)">${fmt(pendapatan)}</div>
        </div>
        <div style="margin-top:1rem;font-size:0.75rem;color:var(--text-muted)">* Estimasi berdasarkan produktivitas rata-rata nasional & harga pasar terkini</div>
    `;
}

function calcCuaca() {
    // New Feature
    const curah = parseFloat(document.getElementById('cuaca-hujan').value) || 0;
    const suhu = parseFloat(document.getElementById('cuaca-suhu').value) || 25;
    const tanaman = document.getElementById('cuaca-tanaman').value;

    let rek = 'Cocok';
    let detail = '';

    // Simple logic logic
    if (tanaman === 'padi') {
        if (curah < 100) { rek = 'Kurang Air'; detail = 'Perlu irigasi tambahan karena curah hujan rendah.'; }
        else if (curah > 300) { rek = 'Waspada Banjir'; detail = 'Curah hujan sangat tinggi, pastikan drainase baik.'; }
        else { detail = 'Kondisi air ideal untuk padi sawah.'; }
    } else if (tanaman === 'cabai') {
        if (curah > 200) { rek = 'Berisiko'; detail = 'Risiko tinggi patek/jamur pada kelembaban tinggi.'; }
        else { detail = 'Cuaca mendukung.'; }
    }

    document.getElementById('cuaca-result').innerHTML = `
        <div style="font-weight:600;margin-bottom:0.5rem">🌦️ Analisis Cuaca: <span style="color:${rek === 'Cocok' ? 'var(--primary)' : 'var(--gold)'}">${rek}</span></div>
        <p style="font-size:0.9rem;color:var(--text-muted)">${detail}</p>
    `;
}

// Attach calculators
window.setupCalc = setupCalc;
