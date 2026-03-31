const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";

// Valor real de mercado aproximado para a rede ARC
let currentMarketCap = 399085210; 
let lastMcUpdate = 0;

function formatSmartCap(value) {
    if (!value || isNaN(value)) return "...";
    if (value >= 1e12) return (value / 1e12).toFixed(2) + " T"; 
    if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";    
    if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";    
    return value.toLocaleString('en-US');
}

async function updateMarketCap() {
    const now = Date.now();
    // 3 horas em milissegundos = 10800000
    if (now - lastMcUpdate > 10800000) {
        try {
            const sRes = await fetch(ENDPOINT_STATS);
            const sData = await sRes.json();
            // Tenta pegar o market cap da API, se não houver, mantém o base real
            currentMarketCap = sData.market_cap || 399085210;
            lastMcUpdate = now;
            console.log("Market Cap atualizado com sucesso.");
        } catch (e) {
            console.warn("Erro ao atualizar Market Cap, mantendo valor base.");
        }
    }
    document.getElementById('usdc-market-cap').textContent = "$" + formatSmartCap(currentMarketCap);
}

async function syncBlockchain() {
    try {
        // Atualiza Bloco
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        // Atualiza Stats Gerais (Exceto MC que tem timer próprio)
        const sRes = await fetch(ENDPOINT_STATS);
        const sData = await sRes.json();
        const totalReal = sData.total_transactions || sData.transactions_count || 0;
        
        document.getElementById('total-transactions').textContent = parseInt(totalReal).toLocaleString();
        document.getElementById('tempo-finalidade').textContent = "1.50s";
        
        // Chama a função de Market Cap (que só age de 3 em 3 horas)
        updateMarketCap();

        // Transações Recentes
        const tRes = await fetch(ENDPOINT_TXS);
        const tData = await tRes.json();
        const items = tData.items || [];
        
        const list = document.getElementById('recent-transactions-list');
        const bigList = document.getElementById('big-transactions');

        if (items.length > 0) {
            let html = '<ul style="list-style:none; padding:0; margin:0;">';
            let bigHtml = '<ul style="list-style:none; padding:0; margin:0;">';
            let foundLarge = false;

            items.slice(0, 12).forEach(tx => {
                const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
                const hashShort = tx.hash ? tx.hash.substring(0, 12) + "..." : "---";
                
                let typeLabel = "";
                if (tx.to === null || tx.created_contract) {
                    typeLabel = "<span style='color:#e67e22; font-weight:bold;'>DEPLOY</span>";
                } else if (tx.input && tx.input !== "0x") {
                    typeLabel = "<span style='color:#9b59b6; font-weight:bold;'>CALL/MINT</span>";
                } else {
                    typeLabel = `<span style='color:#2ecc71; font-weight:bold;'>${val.toFixed(4)} USDC</span>`;
                }
                
                html += `
                    <li class="transaction-item" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-cube" style="color:#ccc; font-size:0.8em;"></i>
                            <span style="font-family:'Courier New', monospace; font-size:0.9em;">${hashShort}</span>
                        </div>
                        <div style="text-align:right;">${typeLabel}</div>
                    </li>`;

                if (val > 50) {
                    foundLarge = true;
                    bigHtml += `
                        <li class="whale-item">
                            <i class="fas fa-landmark" style="color:#0070e6;"></i> 
                            <strong style="font-size:0.9em;">INSTITUTIONAL: ${val.toFixed(2)} USDC</strong>
                        </li>`;
                }
            });

            list.innerHTML = html + '</ul>';
            bigList.innerHTML = foundLarge ? bigHtml + '</ul>' : "<p style='color:#999; font-size:0.9em; padding:10px;'>Monitoring high-value whale flow...</p>";
        }

    } catch (e) {
        console.error("Sync error:", e);
    }
}

// Inicia os loops
setInterval(syncBlockchain, 5000);
syncBlockchain();