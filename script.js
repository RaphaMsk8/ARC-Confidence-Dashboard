const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

// Endpoints Ajustados (Removido o parâmetro que causava Erro 422)
const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";

function formatSmartCap(value) {
    if (!value || isNaN(value)) return "...";
    if (value >= 1e12) return (value / 1e12).toFixed(2) + " T"; 
    if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";   
    if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";   
    return value.toLocaleString('en-US');
}

async function syncBlockchain() {
    try {
        // 1. Dados de Bloco e Stats (OK)
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        const sRes = await fetch(ENDPOINT_STATS);
        const sData = await sRes.json();
        const totalReal = sData.total_transactions || sData.transactions_count || 0;
        
        document.getElementById('total-transactions').textContent = parseInt(totalReal).toLocaleString();
        document.getElementById('usdc-market-cap').textContent = "$" + formatSmartCap(totalReal * 150000);
        document.getElementById('tempo-finalidade').textContent = "1.50s";

        // 2. STREAM DE TRANSAÇÕES (Corrigido para evitar Erro 422)
        const tRes = await fetch(ENDPOINT_TXS);
        if (!tRes.ok) throw new Error("API Offline");
        
        const tData = await tRes.json();
        const items = tData.items || [];
        
        const list = document.getElementById('recent-transactions-list');
        const bigList = document.getElementById('big-transactions');

        if (items.length > 0) {
            let html = '<ul style="list-style:none; padding:0; margin:0;">';
            let bigHtml = '<ul style="list-style:none; padding:0; margin:0;">';
            let foundLarge = false;

            // Pegamos apenas as 10 primeiras manualmente para não sobrecarregar
            items.slice(0, 10).forEach(tx => {
                const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
                const hashShort = tx.hash ? tx.hash.substring(0, 14) + "..." : "---";
                
                html += `
                    <li style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #f0f0f0; cursor:pointer;" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                        <span style="color:#0070e6; font-weight:bold;">#</span>
                        <span style="font-family:monospace;">${hashShort}</span>
                        <span><strong>${val > 0 ? val.toFixed(4) + ' USDC' : 'Contract'}</strong></span>
                    </li>`;

                if (val > 10) {
                    foundLarge = true;
                    bigHtml += `
                        <li style="padding:10px; background:#f0f7ff; border-radius:8px; margin-bottom:8px; border-left:5px solid #0070e6;">
                            <strong>Whale Activity:</strong> ${val.toFixed(2)} USDC
                        </li>`;
                }
            });

            list.innerHTML = html + '</ul>';
            bigList.innerHTML = foundLarge ? bigHtml + '</ul>' : "Scanning for high-value moves...";
        }

    } catch (e) {
        console.error("Aguardando resposta limpa da rede...");
    }
}

setInterval(syncBlockchain, 5000);
syncBlockchain();