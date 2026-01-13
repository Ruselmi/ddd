const AILogic = {
    analyzeMarket(commodity) {
        // Mock AI Analysis
        const sentiments = ['Bullish', 'Bearish', 'Neutral', 'Volatile'];
        const factors = ['Cuaca Ekstrem', 'Permintaan Tinggi', 'Panen Raya', 'Gangguan Distribusi', 'Inflasi Global'];

        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        const factor = factors[Math.floor(Math.random() * factors.length)];
        const confidence = Math.floor(Math.random() * 20 + 80); // 80-99%

        return {
            sentiment,
            factor,
            confidence,
            prediction: sentiment === 'Bullish' ? 'Harga berpotensi NAIK dalam minggu ini.' :
                sentiment === 'Bearish' ? 'Harga berpotensi TURUN karena pasokan melimpah.' :
                    'Harga diprediksi STABIL dalam jangka pendek.'
        };
    },

    generateDescription(c) {
        return `Harga ${c.name} saat ini ${window.fmt(c.price)} per ${c.unit}. Tren ${c.change >= 0 ? 'positif' : 'negatif'} sebesar ${Math.abs(c.change)}%.`;
    }
};

window.AILogic = AILogic;
