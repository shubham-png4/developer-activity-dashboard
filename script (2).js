// 1. Initial Data Engine & Chart Mapping Layout
const ctx = document.getElementById('activityChart').getContext('2d');
const activityChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Data Packets Synthesized',
            data: [65, 78, 72, 89, 56, 92, 104],
            borderColor: '#38bdf8',
            tension: 0.3,
            fill: false
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// 2. Fetch API Integration Handler (Using Public Live CoinDesk API Stream)
async function fetchCryptoMetric() {
    const display = document.getElementById('crypto-data');
    display.innerText = "Synchronizing stream data...";
    
    try {
        const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
        const data = await response.json();
        const rate = data.bpi.USD.rate_float;
        
        display.innerHTML = `BTC/USD: $${rate.toFixed(2)} <br><span style="font-size: 0.8rem; color:#94a3b8;">Updated: ${data.time.updated}</span>`;
    } catch (error) {
        display.innerText = "⚠️ Network error syncing data stream.";
    }
}

// Initial fire on load
fetchCryptoMetric();