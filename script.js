const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";

// ENDPOINT DO CONTRATO NATIVO USDC (0x3600...)
const ENDPOINT_USDC_SUPPLY = "https://testnet.arcscan.app/api?module=stats&action=tokensupply&contractaddress=0x3600000000000000000000000000000000000000";

// Valor de segurança baseado no seu print do ArcScan ($26.06B)
let currentMarketCap = 26064803841; 

function formatSmartCap(value) {
    if (!value || isNaN(value)) return "...";
    
    if (value >= 1e12) return (value / 1e12).toFixed(2) + " T"; 
    if (value >= 1e9) return (value / 1e9).toFixed(2) + " B"; // Alvo: 26.06 B
    if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";    
    return value.toLocaleString('en-US');
}

async function updateMarketCap() {
    try {
        const sRes = await fetch(ENDPOINT_USDC_SUPPLY);
        const sData = await sRes.json();
        
        // O result da API retorna o valor bruto (sem decimais)
        if (sData.status === "1" && sData.result) {
            const rawSupply = parseFloat(sData.result);
            // Dividimos por 1.000.000 porque o USDC tem 6 casas decimais
            currentMarketCap = rawSupply / 1000000; 
        }
    } catch (e) {
        console.warn("Usando backup do Market Cap.");
    }

    const mcElement = document.getElementById('usdc-market-cap');
    if (mcElement) {
        // Efeito visual de atualização (pisca verde)
        mcElement.style.transition = "0.5s";
        mcElement.style.color = "#2ecc71";
        
        mcElement.innerHTML = `
            <i class="fas fa-chart-line" style="font-size:0.8em; margin-right:10px;"></i>` + 
            "$" + formatSmartCap(currentMarketCap);
            
        setTimeout(() => { mcElement.style.color = "#0070e6"; }, 1000);
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
        document.getElementById('tempo-finalidade').textContent = "1.50s";

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

// Inicialização e Intervalos
updateMarketCap();
syncBlockchain();
setInterval(updateMarketCap, 10000); // 10s para o Market Cap
setInterval(syncBlockchain, 5000);   // 5s para o resto