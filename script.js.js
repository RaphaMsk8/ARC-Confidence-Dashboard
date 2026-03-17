const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";

function formatNumbers(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + " T";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + " B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + " M";
    return n.toLocaleString();
}

async function runTerminal() {
    try {
        // 1. Stats Superior
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        const sRes = await fetch(ENDPOINT_STATS);
        const sData = await sRes.json();
        const txs = sData.total_transactions || 0;
        
        document.getElementById('total-transactions').textContent = formatNumbers(txs);
        document.getElementById('usdc-market-cap').textContent = "$" + formatNumbers(txs * 0.85);

        // 2. Transações
        const tRes = await fetch(ENDPOINT_TXS);
        const tData = await tRes.json();
        const items = tData.items || [];
        
        const list = document.getElementById('recent-transactions-list');
        const whales = document.getElementById('big-transactions');
        
        let txRows = "";
        let whaleRows = "";

        items.slice(0, 12).forEach(tx => {
            const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
            const gas = parseFloat(ethers.utils.formatUnits(tx.gas_used || "0", "gwei"));
            const hashShort = `${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`;
            
            const dotColor = tx.status === 'ok' ? '#00ffa3' : '#ff3b3b';
            
            let type = "TRANSFER", typeColor = "#00ffa3";
            if (!tx.to) { type = "DEPLOY"; typeColor = "#ff9f43"; }
            else if (tx.input !== "0x") { type = "CALL"; typeColor = "#a29bfe"; }

            txRows += `
                <tr onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                    <td><span class="status-led" style="background:${dotColor}; box-shadow: 0 0 8px ${dotColor}"></span></td>
                    <td class="hash-link">${hashShort}</td>
                    <td style="color:${typeColor}; font-weight:bold; font-size:0.7rem;">${type}</td>
                    <td class="text-right" style="font-weight:bold;">${val > 0 ? val.toFixed(2) : "---"}</td>
                    <td class="text-right" style="color:#64748b; font-size:0.75rem;">${gas.toFixed(4)}</td>
                </tr>`;

            if (val > 100) {
                whaleRows += `
                <div class="whale-card">
                    <small>INSTITUTIONAL DETECTED</small>
                    <strong>${val.toFixed(2)} USDC</strong>
                </div>`;
            }
        });

        list.innerHTML = txRows;
        whales.innerHTML = whaleRows || "<p style='color:#444; font-size:0.8rem;'>Scanning...</p>";

    } catch (err) {
        console.warn("Conexão instável... tentando reconectar.");
    }
}

// Inicia e agenda
runTerminal();
setInterval(runTerminal, 5000);