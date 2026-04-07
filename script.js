const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";
const ARCSCAN_ADDR_BASE = "https://testnet.arcscan.app/address/";
const ENDPOINT_USDC_SUPPLY = "https://testnet.arcscan.app/api?module=stats&action=tokensupply&contractaddress=0x3600000000000000000000000000000000000000";

// Gráfico de Market Cap
const ctx = document.getElementById('marketChart').getContext('2d');
const marketChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['', '', '', '', '', '', ''],
        datasets: [{
            data: [198.5, 198.8, 198.4, 199.1, 198.9, 199.04],
            borderColor: '#38bdf8',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            tension: 0.4
        }]
    },
    options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
});

function performSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (q.length === 66) window.open(`${ARCSCAN_TX_BASE}${q}`, '_blank');
    else if (q.length === 42) window.open(`${ARCSCAN_ADDR_BASE}${q}`, '_blank');
}

async function sync() {
    try {
        // Block Height
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        // USDC Supply
        const sRes = await fetch(ENDPOINT_USDC_SUPPLY);
        const sData = await sRes.json();
        if (sData.result) {
            const cap = parseFloat(sData.result) / 1000000;
            document.getElementById('usdc-market-cap').textContent = "$" + (cap / 1e9).toFixed(2) + " B";
        }

        // Transactions (Simulação de Stream para manter a UI viva)
        const tRes = await fetch("https://testnet.arcscan.app/api/v2/transactions");
        const tData = await tRes.json();
        
        const stream = document.getElementById('recent-transactions-list');
        const tableBody = document.getElementById('big-transactions-body');
        
        if (tData.items) {
            stream.innerHTML = "";
            tableBody.innerHTML = "";
            
            tData.items.slice(0, 10).forEach(tx => {
                const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
                
                // Stream List
                stream.innerHTML += `
                    <div class="transaction-item" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                        <span>${tx.hash.substring(0,10)}...</span>
                        <span style="color:${val > 0 ? '#4ade80' : '#94a3b8'}">${val.toFixed(2)} USDC</span>
                    </div>`;

                // Whale Table (> 50 USDC para teste)
                if (val > 50) {
                    tableBody.innerHTML += `
                        <tr>
                            <td>Just now</td>
                            <td style="color:#38bdf8; font-weight:bold;">${val.toFixed(2)}</td>
                            <td><span class="badge">INSTITUTIONAL</span></td>
                            <td style="cursor:pointer; color:#94a3b8" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">${tx.hash.substring(0,8)}...</td>
                        </tr>`;
                }
            });
        }
    } catch (e) { console.error(e); }
}

setInterval(sync, 5000);
sync();