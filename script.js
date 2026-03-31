const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";
const ENDPOINT_USDC_SUPPLY = "https://testnet.arcscan.app/api?module=stats&action=tokensupply&contractaddress=0x3600000000000000000000000000000000000000";

let currentMarketCap = 26064803841;
let whaleTransactions = []; // Memória para as 5 baleias (cascata)

function formatSmartCap(value) {
    if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";
    if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";
    return value.toLocaleString('en-US');
}

async function updateMarketCap() {
    try {
        const sRes = await fetch(ENDPOINT_USDC_SUPPLY);
        const sData = await sRes.json();
        if (sData.status === "1" && sData.result) {
            currentMarketCap = parseFloat(sData.result) / 1000000;
        }

        const mcCard = document.getElementById('mc-card');
        const mcDisplay = document.getElementById('usdc-market-cap');
        
        if (mcCard && mcDisplay) {
            mcCard.classList.add('update-pulse');
            mcDisplay.style.color = "#2ecc71";
            mcDisplay.innerHTML = `<i class="fas fa-chart-line" style="margin-right:10px;"></i>$${formatSmartCap(currentMarketCap)}`;
            
            setTimeout(() => {
                mcCard.classList.remove('update-pulse');
                mcDisplay.style.color = "#0070e6";
            }, 1000);
        }
    } catch (e) { console.error("Erro no MC"); }
}

async function syncBlockchain() {
    try {
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();
        
        const sRes = await fetch(ENDPOINT_STATS);
        const sData = await sRes.json();
        document.getElementById('total-transactions').textContent = parseInt(sData.total_transactions || 0).toLocaleString();

        const tRes = await fetch(ENDPOINT_TXS);
        const tData = await tRes.json();
        const items = tData.items || [];
        
        const listContainer = document.getElementById('recent-transactions-list');
        const whaleContainer = document.getElementById('big-transactions');

        if (items.length > 0) {
            let streamHtml = '<ul style="list-style:none; padding:0; margin:0;">';
            
            // Filtra as transações para a lista Live e para a lista de Baleias
            items.slice(0, 10).forEach(tx => {
                const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
                const hashShort = tx.hash ? tx.hash.substring(0, 14) + "..." : "---";
                
                // LÓGICA DE BALEIA (Captura > 1000 USDC)
                if (val >= 1000) {
                    const jaExiste = whaleTransactions.some(w => w.hash === tx.hash);
                    if (!jaExiste) {
                        whaleTransactions.unshift({ 
                            hash: tx.hash, 
                            value: val, 
                            time: new Date().toLocaleTimeString() 
                        });
                        if (whaleTransactions.length > 5) whaleTransactions.pop(); // Limite de 5
                    }
                }

                streamHtml += `
                    <li class="transaction-item" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                        <span><i class="fas fa-cube" style="color:#ccc; margin-right:8px;"></i>${hashShort}</span>
                        <strong style="color:${val > 0 ? '#2ecc71' : '#999'}">${val.toFixed(4)} USDC</strong>
                    </li>`;
            });
            listContainer.innerHTML = streamHtml + '</ul>';

            // Renderiza Baleias em Cascata (Interativo)
            if (whaleTransactions.length > 0) {
                let whaleHtml = '<ul style="list-style:none; padding:0; margin:0;">';
                whaleTransactions.forEach(w => {
                    whaleHtml += `
                        <li class="whale-item" onclick="window.open('${ARCSCAN_TX_BASE}${w.hash}', '_blank')">
                            <div>
                                <i class="fas fa-whale" style="color:#0070e6; margin-right:10px;"></i>
                                <strong>WHALE MOVE: ${w.value.toLocaleString()} USDC</strong>
                            </div>
                            <div style="text-align:right;">
                                <small style="color:#777; display:block;">${w.time}</small>
                                <i class="fas fa-external-link-alt" style="color:#ccc; font-size:0.7em;"></i>
                            </div>
                        </li>`;
                });
                whaleContainer.innerHTML = whaleHtml + '</ul>';
            }
        }
    } catch (e) { console.error("Sync Error"); }
}

// Inicializa
updateMarketCap();
syncBlockchain();
setInterval(updateMarketCap, 10000);
setInterval(syncBlockchain, 5000);