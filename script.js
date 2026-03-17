// ====================================================================
// AICD ENGINE V23 - REAL-TIME SYNC (ETHERS.JS + ANIMATION + CSS SYNC)
// ====================================================================

const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
const provider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);

const ENDPOINT_STATS = "https://testnet.arcscan.app/api/v2/stats";
const ENDPOINT_COINGECKO = "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd&include_market-cap=true";
const ENDPOINT_RECENT_TX = "https://testnet.arcscan.app/api/v2/transactions?limit=10&sort=desc";
const ENDPOINT_BIG_TX = "https://testnet.arcscan.app/api/v2/token-transfers?limit=50&sort=desc";

const ARCSCAN_SEARCH_BASE = "https://testnet.arcscan.app";
const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";

const INSTITUTIONAL_LIMIT = 1000;
const USDC_DECIMALS = 6;

// --- FUNÇÃO DE ANIMAÇÃO "LISA" ---
function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    const currentText = obj.textContent.replace(/[$, ]/g, '');
    let start = parseInt(currentText) || end - 1;

    let duration = 800; 
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        obj.textContent = value.toLocaleString('en-US');
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// --- BUSCA DE DADOS ---

async function fetchUSDC() {
    try {
        const res = await fetch(ENDPOINT_COINGECKO);
        const data = await res.json();
        const cap = data['usd-coin'].usd_market_cap;
        document.getElementById('usdc-market-cap').textContent = `$${(cap / 1e9).toFixed(2)}B`;
    } catch (e) { console.warn("Syncing USDC..."); }
}

async function fetchStats() {
    try {
        const res = await fetch(ENDPOINT_STATS);
        const data = await res.json();
        const total = parseInt(data.total_transactions || data.transactions_count);
        animateValue('total-transactions', total);
    } catch (e) { console.warn("Syncing Stats..."); }
}

async function fetchRecentTransactions() {
    try {
        const res = await fetch(ENDPOINT_RECENT_TX);
        const data = await res.json();
        displayRecent(data.items);
    } catch (e) {}
}

async function fetchBigTransfers() {
    try {
        const res = await fetch(ENDPOINT_BIG_TX);
        const data = await res.json();
        const filtered = data.items.filter(tx => (Number(tx.total) / 10**USDC_DECIMALS) >= INSTITUTIONAL_LIMIT);
        displayBig(filtered);
    } catch (e) {}
}

// --- EXIBIÇÃO (Sincronizada com CSS) ---

function displayRecent(txs) {
    const list = document.getElementById('recent-transactions-list');
    let html = '<ul class="transaction-list">';
    txs.forEach(tx => {
        const statusClass = tx.status === 'ok' ? 'success' : 'failure';
        const icon = tx.status === 'ok' ? 'fa-check-circle' : 'fa-times-circle';
        
        html += `
            <li class="transaction-item ${statusClass}" onclick="window.open('${ARCSCAN_TX_BASE}${tx.hash}', '_blank')">
                <span class="tx-status-icon"><i class="fas ${icon}"></i></span>
                <span class="tx-hash">${tx.hash.substring(0, 12)}...${tx.hash.slice(-4)}</span>
                <span class="tx-value">$${(Number(tx.value)/1e18).toFixed(2)}</span>
                <span class="tx-timestamp">${new Date(tx.timestamp).toLocaleTimeString()}</span>
            </li>`;
    });
    list.innerHTML = html + '</ul>';
}

function displayBig(txs) {
    const container = document.getElementById('big-transactions');
    let html = '<ul>';
    txs.slice(0, 5).forEach(tx => {
        const val = Number(tx.total) / 10**USDC_DECIMALS;
        const address = tx.from ? tx.from.hash : "0x...";
        html += `
            <li>
                <strong>Value: $${val.toLocaleString('en-US', {maximumFractionDigits:0})}</strong> 
                <span class="tx-address">Address: ${address.substring(0, 10)}...</span>
                <span class="tx-time">Just now</span>
            </li>`;
    });
    container.innerHTML = html + '</ul>';
}

// --- MOTOR DE TEMPO REAL ---

function initEngine() {
    console.log("🚀 AICD Engine: Active");
    document.getElementById('tempo-finalidade').textContent = "1.50s";

    // OUVINTE DE BLOCOS (Ethers.js)
    provider.on("block", (blockNumber) => {
        animateValue('current-block', blockNumber);
        fetchStats(); 
        fetchRecentTransactions();
    });

    setInterval(fetchUSDC, 60000);
    setInterval(fetchBigTransfers, 15000);
}

window.onload = () => {
    fetchUSDC();
    fetchStats();
    fetchRecentTransactions();
    fetchBigTransfers();
    initEngine();
};

function performSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (q) window.open(`${ARCSCAN_SEARCH_BASE}/address/${q}`, '_blank');
}