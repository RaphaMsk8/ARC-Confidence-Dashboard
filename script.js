const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";
const ARCSCAN_ADDR_BASE = "https://testnet.arcscan.app/address/";

// ENDPOINT DO CONTRATO NATIVO USDC
const ENDPOINT_USDC_SUPPLY = "https://testnet.arcscan.app/api?module=stats&action=tokensupply&contractaddress=0x3600000000000000000000000000000000000000";

let currentMarketCap = 26064803841; 

function formatSmartCap(value) {
    if (!value || isNaN(value)) return "...";
    if (value >= 1e12) return (value / 1e12).toFixed(2) + " T"; 
    if (value >= 1e9) return (value / 1e9).toFixed(2) + " B"; 
    if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";    
    return value.toLocaleString('en-US');
}

// FUNÇÃO DE BUSCA RESTAURADA
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) return;

    // Lógica para definir se é Transação ou Endereço
    if (query.length === 66) {
        window.open(`${ARCSCAN_TX_BASE}${query}`, '_blank');
    } else if (query.length === 42) {
        window.open(`${ARCSCAN_ADDR_BASE}${query}`, '_blank');
    } else {
        alert("Invalid Format: Use a 0x... Address or Tx Hash.");
    }
}

// Suporte ao Enter na busca
document.getElementById('searchInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') performSearch();
});

async function updateMarketCap() {
    try {
        const sRes = await fetch(ENDPOINT_USDC_SUPPLY);
        const sData = await sRes.json();
        if (sData.status === "1" && sData.result) {
            const rawSupply = parseFloat(sData.result);
            currentMarketCap = rawSupply / 1000000; 
        }
    } catch (e) {
        console.warn("Using Market Cap backup.");
    }

    const mcElement = document.getElementById('usdc-market-cap');
    if (mcElement) {
        mcElement.innerHTML = `<i class="fas fa-chart-line" style="font-size:0.8em; margin-right:10px;"></i>$` + formatSmartCap(currentMarketCap);
    }
}

async function syncBlockchain() {
    try {
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        const sRes = await fetch(ENDPOINT_STATS);
        const sData = await sRes.json();
        const totalReal = sData.total_transactions || sData.transactions_count || 0;
        
        document.getElementById('total-transactions').textContent = parseInt(totalReal).toLocaleString();

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
                const hashShort = tx.hash ? tx.hash.substring(0, 14) + "..." : "---";
                
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

                if (val > 1000) { // Limite institucional ajustado para 1000
                    foundLarge = true;
                    bigHtml += `
                        <li class="whale-item" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')" style="cursor:pointer;">
                            <i class="fas fa-landmark" style="color:#0070e6;"></i> 
                            <strong style="font-size:0.9em;">INSTITUTIONAL: ${val.toLocaleString()} USDC</strong>
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

updateMarketCap();
syncBlockchain();
setInterval(updateMarketCap, 10000);
setInterval(syncBlockchain, 5000);