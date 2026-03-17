const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_TXS = "https://testnet.arcscan.app/api/v2/transactions";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";

// Formatação Profissional M, B, T
function formatSmartCap(value) {
    if (!value || isNaN(value)) return "...";
    if (value >= 1e12) return (value / 1e12).toFixed(2) + " T"; 
    if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";   
    if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";   
    return value.toLocaleString('en-US');
}

async function syncBlockchain() {
    try {
        // 1. Atualização de Blocos e Estatísticas
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        const sRes = await fetch(ENDPOINT_STATS);
        const sData = await sRes.json();
        const totalTx = sData.total_transactions || sData.transactions_count || 0;
        
        document.getElementById('total-transactions').textContent = parseInt(totalTx).toLocaleString();
        document.getElementById('usdc-market-cap').textContent = "$" + formatSmartCap(totalTx * 1500000);

        // 2. Fluxo de Transações Reais
        const tRes = await fetch(ENDPOINT_TXS);
        const tData = await tRes.json();
        const items = tData.items || [];
        
        const list = document.getElementById('recent-transactions-list');
        const whaleContainer = document.getElementById('big-transactions');
        let htmlContent = "";
        let whaleContent = "";

        items.slice(0, 10).forEach(tx => {
            const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
            const gasPrice = ethers.BigNumber.from(tx.gas_price || "0");
            const gasUsed = ethers.BigNumber.from(tx.gas_used || "0");
            const gasTotal = parseFloat(ethers.utils.formatEther(gasPrice.mul(gasUsed)));

            const hashShort = `${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`;
            
            // Definição de Status (LED)
            const ledColor = tx.status === 'ok' ? '#2ecc71' : '#e74c3c';
            const ledGlow = tx.status === 'ok' ? '0 0 8px #2ecc71' : '0 0 8px #e74c3c';

            // Inteligência de Ação
            let actionText = "TRANSFER";
            let actionColor = "#27ae60";

            if (!tx.to) {
                actionText = "DEPLOY"; actionColor = "#e67e22";
            } else if (tx.input && tx.input !== "0x") {
                const methodId = tx.input.substring(0, 10);
                if (methodId === "0xa0712d68") { actionText = "MINT"; actionColor = "#9b59b6"; }
                else if (methodId === "0x791ac947") { actionText = "SWAP"; actionColor = "#f1c40f"; }
                else { actionText = "CALL"; actionColor = "#34495e"; }
            }

            htmlContent += `
                <tr onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                    <td><span class="status-led" style="background: ${ledColor}; box-shadow: ${ledGlow};"></span></td>
                    <td class="hash-style">${hashShort}</td>
                    <td style="color: ${actionColor}; font-weight: 800; font-size: 0.75rem;">${actionText}</td>
                    <td class="text-right" style="font-weight: 700;">${val > 0 ? val.toFixed(2) : "---"}</td>
                    <td class="text-right" style="color: #888; font-size: 0.8rem;">${gasTotal.toFixed(6)}</td>
                </tr>
            `;

            // Monitor de Baleias (Transações > 50 USDC)
            if (val > 50) {
                whaleContent += `
                    <div class="whale-card">
                        <small style="color: #666;">Institutional Move</small><br>
                        <strong>${val.toFixed(2)} USDC</strong>
                    </div>`;
            }
        });

        list.innerHTML = htmlContent;
        whaleContainer.innerHTML = whaleContent || "<p style='color:#bbb; font-size:0.8rem;'>Aguardando fluxo institucional...</p>";

    } catch (error) {
        console.error("Erro na sincronização:", error);
    }
}

// Inicia a sincronização e repete a cada 5 segundos
syncBlockchain();
setInterval(syncBlockchain, 5000);