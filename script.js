const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

// Configuração do Gráfico (Chart.js)
const ctx = document.getElementById('marketChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: [1, 2, 3, 4, 5, 6, 7],
        datasets: [{
            data: [180, 185, 182, 195, 188, 192, 199.04],
            borderColor: '#38bdf8',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            tension: 0.4
        }]
    },
    options: {
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        responsive: true,
        maintainAspectRatio: false
    }
});

async function syncDashboard() {
    try {
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        const tRes = await fetch("https://testnet.arcscan.app/api/v2/transactions");
        const tData = await tRes.json();
        
        const stream = document.getElementById('recent-transactions-list');
        const whaleTable = document.getElementById('big-transactions-body');
        
        if (tData.items) {
            stream.innerHTML = "";
            whaleTable.innerHTML = "";
            
            tData.items.forEach((tx, index) => {
                const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
                
                // Stream (Lista lateral)
                if (index < 8) {
                    stream.innerHTML += `
                        <div class="stream-item">
                            <span>${tx.hash.substring(0,12)}...</span>
                            <span style="color:#4ade80">${val.toFixed(2)} USDC</span>
                        </div>`;
                }

                // Whale Table (Centro)
                if (val > 100) {
                    whaleTable.innerHTML += `
                        <tr>
                            <td>Just now</td>
                            <td style="color:#38bdf8; font-weight:bold;">${val.toFixed(2)}</td>
                            <td>Institutional</td>
                            <td style="color:#94a3b8">${tx.hash.substring(0,10)}...</td>
                        </tr>`;
                }
            });
        }
    } catch (e) { console.warn(e); }
}

function performSearch() {
    const q = document.getElementById('searchInput').value;
    if (q.length > 40) window.open(`https://testnet.arcscan.app/tx/${q}`, '_blank');
}

setInterval(syncDashboard, 5000);
syncDashboard();