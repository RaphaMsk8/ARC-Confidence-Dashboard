const ARC_RPC_URL = "https://rpc.testnet.arc.network/";
// Sintaxe Ethers v6
const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);

const ARCSCAN_TX_BASE = "https://testnet.arcscan.app/tx/";
const ARCSCAN_ADDR_BASE = "https://testnet.arcscan.app/address/";
const ENDPOINT_USDC_SUPPLY = "https://testnet.arcscan.app/api?module=stats&action=tokensupply&contractaddress=0x3600000000000000000000000000000000000000";

// --- LOGICA DE CONEXÃO ---
async function connectWallet() {
    if (window.ethereum) {
        try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const signer = await browserProvider.getSigner();
            const address = await signer.getAddress();
            document.getElementById('connectBtn').innerHTML = `${address.substring(0,6)}... Connected`;
            console.log("Conectado como:", address);
        } catch (e) { console.error("Falha na conexão", e); }
    } else { alert("MetaMask not found!"); }
}

// --- LOGICA DE EXECUÇÃO (THE FORGE) ---
async function executeBridge() {
    const amt = document.getElementById('bridge-amt').value;
    const dir = document.getElementById('bridge-dir').value;
    alert(`Iniciando Bridge de ${amt} USDC via CCTP (${dir}). Assine na sua carteira.`);
    // Aqui entra a chamada do contrato Circle futuramente
}

async function executeSwap() {
    const amt = document.getElementById('swap-amt').value;
    const from = document.getElementById('swap-from').value;
    const to = document.getElementById('swap-to').value;
    alert(`Preparando Swap agêntico: ${amt} ${from} para ${to}.`);
    // Aqui entra a rota de liquidez da rede ARC
}

// --- SUAS FUNÇÕES ORIGINAIS (Sincronização de Métricas) ---
const ctx = document.getElementById('marketChart').getContext('2d');
const marketChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['', '', '', '', '', '', ''],
        datasets: [{
            data: [198.5, 198.8, 198.4, 199.1, 198.9, 199.04],
            borderColor: '#38bdf8',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            tension: 0.4
        }]
    },
    options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
});

async function sync() {
    try {
        const block = await provider.getBlockNumber();
        document.getElementById('current-block').textContent = block.toLocaleString();

        const sRes = await fetch(ENDPOINT_USDC_SUPPLY);
        const sData = await sRes.json();
        if (sData.result) {
            const cap = parseFloat(sData.result) / 1000000;
            document.getElementById('usdc-market-cap').textContent = "$" + (cap / 1e9).toFixed(2) + " B";
        }
        // ... (resto da sua lógica de listagem de transações continua aqui igual)
    } catch (e) { console.error(e); }
}

setInterval(sync, 5000);
sync();