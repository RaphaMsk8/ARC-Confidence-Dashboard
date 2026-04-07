const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

// Mini Chart Setup
const ctx = document.getElementById('miniChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: [1,2,3,4,5,6,7,8,9,10],
        datasets: [{
            data: [40, 35, 55, 45, 60, 50, 75, 70, 85, 90],
            borderColor: '#3d8aff',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            backgroundColor: 'rgba(61, 138, 255, 0.1)',
            tension: 0.4
        }]
    },
    options: {
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        maintainAspectRatio: false
    }
});

async function updateData() {
    try {
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        const res = await fetch("https://testnet.arcscan.app/api/v2/transactions");
        const data = await res.json();
        
        const whaleTable = document.getElementById('whale-table');
        const streamList = document.getElementById('recent-transactions-list');
        
        whaleTable.innerHTML = "";
        streamList.innerHTML = "";

        data.items.slice(0, 10).forEach(tx => {
            const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
            
            // Tabela Institucional
            if (val > 0.01) { // Reduzi para aparecer dados no teste
                whaleTable.innerHTML += `
                    <tr>
                        <td>2023-05-23 17:23</td>
                        <td style="font-weight:600">${val.toFixed(2)} USDC</td>
                        <td style="color:#8b9bb4">Institutional...</td>
                        <td style="color:#8b9bb4">Known Cluster</td>
                        <td style="color:#3d8aff">0xae...</td>
                    </tr>`;
            }

            // Stream List
            streamList.innerHTML += `
                <div class="tx-row">
                    <span style="font-family:monospace; color:#8b9bb4">${tx.hash.substring(0,12)}...</span>
                    <span style="color:#4ade80; font-weight:600">${val.toFixed(4)} USDC</span>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

setInterval(updateData, 5000);
updateData();

function performSearch() {
    const q = document.getElementById('searchInput').value;
    if (q.length > 40) window.open(`https://testnet.arcscan.app/tx/${q}`, '_blank');
}