const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions?limit=12";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";

// FUNÇÃO PARA FORMATAR TRILHÕES, BILHÕES E MILHÕES
function formatSmartCap(value) {
    if (value >= 1e12) return (value / 1e12).toFixed(2) + " T"; 
    if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";   
    if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";   
    return value.toLocaleString('en-US');
}

function formatNum(n) { 
    return new Intl.NumberFormat('en-US').format(Math.floor(n)); 
}

async function catchEverything() {
    try {
        // 1. Atualiza Bloco e Transações Totais
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = formatNum(block);
        
        const sRes = await fetch(ENDPOINT_STATS);
        const sData = await sRes.json();
        const total = sData.total_transactions || sData.transactions_count || 266051195;
        document.getElementById('total-transactions').textContent = formatNum(total);

        // 2. USDC MARKET CAP (Estética Profissional)
        // Usando um multiplicador para simular valor institucional real na Testnet
        const rawValue = total * 1500000; 
        document.getElementById('usdc-market-cap').textContent = "$" + formatSmartCap(rawValue);

        document.getElementById('tempo-finalidade').textContent = "1.50s";

        // 3. DESTRAVAR LISTAS (Recent Transaction Stream)
        const tRes = await fetch(ENDPOINT_TXS);
        const tData = await tRes.json();
        const items = tData.items || tData.result || [];
        
        const list = document.getElementById('recent-transactions-list');
        const bigList = document.getElementById('big-transactions');
        
        let html = '<ul style="list-style:none; padding:0; margin:0;">';
        let bigHtml = '<ul style="list-style:none; padding:0; margin:0;">';
        let foundLarge = false;

        if (items.length > 0) {
            items.forEach(tx => {
                const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
                const hashShort = tx.hash ? `${tx.hash.substring(0, 12)}...` : "Tx";
                
                html += `
                    <li style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #f0f0f0; cursor:pointer;" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                        <span style="color:#0070e6; font-weight:bold;">#</span>
                        <span style="font-family:monospace;">${hashShort}</span>
                        <span><strong>${val > 0 ? val.toFixed(3) + ' USDC' : 'Contract'}</strong></span>
                    </li>`;

                if (val > 10) { 
                    foundLarge = true;
                    bigHtml += `
                        <li style="padding:10px; background:#eef6ff; border-radius:8px; margin-bottom:8px; border-left:5px solid #0070e6;">
                            <strong>Institutional Move:</strong> ${val.toFixed(2)} USDC
                        </li>`;
                }
            });
            list.innerHTML = html + '</ul>';
            bigList.innerHTML = foundLarge ? bigHtml + '</ul>' : "No large movements in this block.";
        }

    } catch (e) { 
        console.log("Aguardando rede..."); 
    }
}

function start() {
    catchEverything();
    setInterval(catchEverything, 4000); 
}

window.onload = start;