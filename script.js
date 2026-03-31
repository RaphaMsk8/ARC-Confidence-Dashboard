const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";
const ENDPOINT_USDC_SUPPLY = "https://testnet.arcscan.app/api?module=stats&action=tokensupply&contractaddress=0x3600000000000000000000000000000000000000";

let whaleTransactions = [];

function formatSmartCap(value) {
    if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";
    if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";
    return value.toLocaleString('en-US');
}

async function updateMarketCap() {
    try {
        const response = await fetch(ENDPOINT_USDC_SUPPLY);
        const data = await response.json();
        let cap = 26064803841; // Fallback baseado no ArcScan

        if (data.status === "1" && data.result) {
            cap = parseFloat(data.result) / 1000000;
        }

        const mcCard = document.getElementById('mc-card');
        const mcDisplay = document.getElementById('usdc-market-cap');
        
        if (mcDisplay) {
            mcCard.classList.add('update-pulse');
            mcDisplay.innerHTML = `<i class="fas fa-chart-line" style="margin-right:10px;"></i>$${formatSmartCap(cap)}`;
            setTimeout(() => mcCard.classList.remove('update-pulse'), 1000);
        }
    } catch (e) { console.warn("Erro ao buscar Market Cap"); }
}

async function syncBlockchain() {
    try {
        // 1. Bloco e Stats
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();
        
        const sRes = await fetch(ENDPOINT_STATS);
        const sData = await sRes.json();
        document.getElementById('total-transactions').textContent = parseInt(sData.total_transactions || 0).toLocaleString();

        // 2. Transações
        const tRes = await fetch(ENDPOINT_TXS);
        const tData = await tRes.json();
        const items = tData.items || [];
        
        const listContainer = document.getElementById('recent-transactions-list');
        const whaleContainer = document.getElementById('big-transactions');

        if (items.length > 0) {
            let streamHtml = '<div style="margin-top:10px;">';
            
            items.slice(0, 8).forEach(tx => {
                const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
                const hashShort = tx.hash.substring(0, 12) + "...";
                
                // Lógica de Baleia
                if (val >= 1000 && !whaleTransactions.some(w => w.hash === tx.hash)) {
                    whaleTransactions.unshift({ hash: tx.hash, value: val, time: new Date().toLocaleTimeString() });
                    if (whaleTransactions.length > 5) whaleTransactions.pop();
                }

                streamHtml += `
                    <div class="transaction-item" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                        <span><i class="fas fa-cube" style="color:#ddd; margin-right:10px;"></i>${hashShort}</span>
                        <strong style="color:var(--success-green)">${val.toFixed(4)} USDC</strong>
                    </div>`;
            });
            listContainer.innerHTML = streamHtml + '</div>';

            if (whaleTransactions.length > 0) {
                let whaleHtml = '';
                whaleTransactions.forEach(w => {
                    whaleHtml += `
                        <div class="whale-item" onclick="window.open('${ARCSCAN_TX_BASE}${w.hash}', '_blank')">
                            <span><i class="fas fa-whale" style="margin-right:10px;"></i><strong>BALEIA: ${w.value.toLocaleString()} USDC</strong></span>
                            <small>${w.time} <i class="fas fa-external-link-alt" style="margin-left:5px; font-size:0.8em;"></i></small>
                        </div>`;
                });
                whaleContainer.innerHTML = whaleHtml;
            }
        }
    } catch (e) { console.error("Erro na sincronização geral"); }
}

// Inicialização
updateMarketCap();
syncBlockchain();
setInterval(updateMarketCap, 15000); // Aumentado para 15s para evitar bloqueio de API
setInterval(syncBlockchain, 8000);   // Aumentado para 8s