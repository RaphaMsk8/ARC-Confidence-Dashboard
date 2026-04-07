const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

// Chart JS: Linha Suave
const ctx = document.getElementById('marketChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: [1,2,3,4,5,6,7,8,9,10],
        datasets: [{
            data: [198.2, 198.5, 198.3, 198.8, 198.6, 199.04, 198.9, 199.1, 199.04],
            borderColor: '#3d8aff',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            backgroundColor: 'rgba(61, 138, 255, 0.05)',
            tension: 0.4
        }]
    },
    options: {
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        maintainAspectRatio: false
    }
});

async function refreshData() {
    try {
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        const res = await fetch("https://testnet.arcscan.app/api/v2/transactions");
        const data = await res.json();
        
        const whaleTable = document.getElementById('whale-table');
        const streamList = document.getElementById('recent-transactions-list');
        
        whaleTable.innerHTML = ""; streamList.innerHTML = "";

        data.items.slice(0, 10).forEach(tx => {
            const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
            
            whaleTable.innerHTML += `
                <tr>
                    <td>2023-05-23 17:23</td>
                    <td style="font-weight:700">${val.toFixed(2)} USDC</td>
                    <td style="color:#8b9bb4">Institutional...</td>
                    <td style="color:#8b9bb4">Known Cluster</td>
                    <td style="color:#4ade80">Shorterd</td>
                    <td style="color:#3d8aff">${tx.hash.substring(0,10)}...</td>
                </tr>`;

            streamList.innerHTML += `
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.03); font-size:0.8rem;">
                    <span style="color:#8b9bb4">${tx.hash.substring(0,12)}...</span>
                    <span style="color:#4ade80; font-weight:700">${val.toFixed(4)} USDC</span>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

function performSearch() {
    const q = document.getElementById('searchInput').value;
    if (q.length > 40) window.open(`https://testnet.arcscan.app/tx/${q}`, '_blank');
}

setInterval(refreshData, 5000);
refreshData();