const translations = {
    en: { navStatus: "LIVE FEED", blockHeight: "Block Height", totalTxs: "Total Transactions", mCap: "ARC Market Cap", finality: "Avg Finality", cascadeTitle: "TRANSACTION CASCADE", itemsPage: "Page 1 / 150 Items", thHash: "HASH", thType: "TYPE", thValue: "VALUE (USDC)", thTime: "TIMESTAMP", whaleTitle: "INSTITUTIONAL WATCH" },
    pt: { navStatus: "AO VIVO", blockHeight: "Altura do Bloco", totalTxs: "Transações Totais", mCap: "Cap. de Mercado", finality: "Finalidade Média", cascadeTitle: "CASCATA DE TRANSAÇÕES", itemsPage: "Pág 1 / 150 Itens", thHash: "HASH", thType: "TIPO", thValue: "VALOR (USDC)", thTime: "HORA", whaleTitle: "MONITOR DE BALEIAS" },
    es: { navStatus: "EN VIVO", blockHeight: "Altura del Bloque", totalTxs: "Transacciones Totales", mCap: "Cap. de Mercado", finality: "Finalidad Promedio", cascadeTitle: "CASCADA DE TRANSACCIONES", itemsPage: "Pág 1 / 150 Ítems", thHash: "HASH", thType: "TIPO", thValue: "VALOR (USDC)", thTime: "HORA", whaleTitle: "ALERTA DE BALLENAS" }
};
const provider = new ethers.providers.JsonRpcProvider("https://rpc.testnet.arc.network/");
let renderedHashes = new Set();
async function update() {
    try {
        const b = await provider.getBlockNumber();
        document.getElementById('currentBlock').innerText = b.toLocaleString();
        const res = await fetch("https://testnet.arcscan.app/api/v2/transactions");
        const data = await res.json();
        const txBody = document.getElementById('txCascadeBody');
        const whaleList = document.getElementById('whaleAlertList');
        const newTxs = data.items.filter(tx => !renderedHashes.has(tx.hash)).reverse();
        newTxs.forEach(tx => {
            renderedHashes.add(tx.hash);
            const val = parseFloat(ethers.utils.formatEther(tx.value || "0"));
            const row = document.createElement('tr');
            row.className = 'new-tx';
            row.innerHTML = `<td style="color:var(--accent)">${tx.hash.substring(0,14)}...</td><td style="font-weight:bold;color:var(--success)">TRANSFER</td><td>${val.toFixed(2)}</td><td style="color:var(--dim)">${new Date().toLocaleTimeString()}</td>`;
            txBody.prepend(row);
            if(txBody.children.length > 150) txBody.removeChild(txBody.lastChild);
            if(val > 50) {
                const card = document.createElement('div'); card.className = 'whale-card';
                card.innerHTML = `<small>WHALE MOVE</small><div style="color:var(--success);font-weight:bold">$ ${val.toLocaleString()} USDC</div>`;
                whaleList.prepend(card); if(whaleList.children.length > 8) whaleList.lastChild.remove();
            }
        });
    } catch (e) {}
}
document.getElementById('langSwitcher').addEventListener('change', (e) => {
    const lang = e.target.value;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerText = translations[lang][el.getAttribute('data-i18n')]; });
});
setInterval(update, 4000); update();