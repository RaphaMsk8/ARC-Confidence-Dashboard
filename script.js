// ====================================================================
// FILE: script.js - AICD LOGIC (V18 - Final Fix: Search + Scroll Optimization)
// ====================================================================

// ** 1. ARC NETWORK CONSTANTS & API ENDPOINTS **
const ARC_RPC_URL = "https://rpc.testnet.arc.network/"; 
const ENDPOINT_COINGECKO_USDC = "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd&include_market-cap=true";
const ENDPOINT_STATS_COUNTERS = "https://testnet.arcscan.app/api/v2/stats/counters"; 
const ENDPOINT_BIG_TRANSFERS = "https://testnet.arcscan.app/api/v2/token-transfers"; // Used for Big Tx Watch
const ENDPOINT_RECENT_TRANSACTIONS = "https://testnet.arcscan.app/api/v2/transactions?limit=10&sort=desc"; // NEW: General Tx List

// ** SEARCH FIX V6 **: Force Address Path (Final attempt to fix 404)
const ARCSCAN_SEARCH_BASE_URL = "https://testnet.arcscan.app"; 

const ARCSCAN_TX_BASE_URL = "https://testnet.arcscan.app/tx/";

// Dashboard Settings
const INSTITUTIONAL_LIMIT = 1000; // Filter for transactions larger than $1000
const USDC_TOKEN_NAME = 'USDC'; 
const USDC_DECIMALS = 6; 
const FINALITY_TIME = 1.5; // Sub-second finality specification

// STATIC FALLBACK DATA
const FALLBACK_USDC_MARKET_CAP = 55000000000; 
const FALLBACK_BLOCK_HEIGHT = 14661297; 
const FALLBACK_TOTAL_TRANSACTIONS = 145890; 
const FALLBACK_BIG_TRANSFERS = [
    { value: 500000, address: "0x1A2B...A9C1", time: "5 mins ago" },
    { value: 12500, address: "0x3C4D...F8E2", time: "15 mins ago" },
    { value: 2500, address: "0x5E6F...G7H3", time: "30 mins ago" }
];
const FALLBACK_RECENT_TRANSACTIONS = [ // NEW FALLBACK DATA
    { hash: "0x6d9f8e404f1234567890abcdef1234567890abcdef", value: 500, time: "2 seconds ago", status: "SUCCESS" },
    { hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012", value: 12000, time: "25 seconds ago", status: "SUCCESS" },
    { hash: "0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f", value: 15.5, time: "45 seconds ago", status: "PENDING" },
    { hash: "0x8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z", value: 980000, time: "1 minute ago", status: "SUCCESS" },
    { hash: "0x9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a", value: 100, time: "1 minute ago", status: "FAILURE" },
];

// AUTOMATIC UPDATE INTERVAL
const UPDATE_INTERVAL_MS = 10000; // 10 seconds

// ====================================================================

/**
 * INITIALIZATION FUNCTION: Sets Fallback values immediately.
 */
function initializeMetrics() {
    const capFormatted = (FALLBACK_USDC_MARKET_CAP / 1e9).toFixed(2) + 'B';
    document.getElementById('usdc-market-cap').textContent = `$${capFormatted}`;
    document.getElementById('current-block').textContent = FALLBACK_BLOCK_HEIGHT.toLocaleString('en-US');
    document.getElementById('total-transactions').textContent = FALLBACK_TOTAL_TRANSACTIONS.toLocaleString('en-US');
    displayFinalityTime(FINALITY_TIME);
    
    // Display initial fallback data for big transactions
    displayBigTransfers(FALLBACK_BIG_TRANSFERS, true);
    
    // Display initial fallback data for transaction stream
    displayRecentTransactions(FALLBACK_RECENT_TRANSACTIONS, true);
}


/**
 * MAIN DATA LOADING FUNCTION (Called every 10 seconds)
 * **OPTIMIZATION NOTE:** Removed scroll position saving/restoring logic.
 */
async function loadMetrics() {
    try {
        // Fetch calls ensure real-time updates
        await fetchUSDCMarketCap();         
        await fetchCurrentBlockHeight();     
        await fetchTotalTransactions(); 
        await fetchBigTransfers();
        await fetchRecentTransactions();
    } catch (error) {
        console.error("Error during data update cycle:", error);
    }
}

// --------------------------------------------------------------------
// CORE DATA FETCH FUNCTIONS
// --------------------------------------------------------------------

async function fetchUSDCMarketCap() {
    const display = document.getElementById('usdc-market-cap');
    try {
        const response = await fetch(ENDPOINT_COINGECKO_USDC);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const marketCap = data['usd-coin'].usd_market_cap; 
        
        let capFormatted;
        if (marketCap >= 1e12) { capFormatted = (marketCap / 1e12).toFixed(2) + 'T'; } 
        else if (marketCap >= 1e9) { capFormatted = (marketCap / 1e9).toFixed(2) + 'B'; } 
        else { capFormatted = marketCap.toLocaleString('en-US'); }
        
        display.textContent = `$${capFormatted}`;

    } catch (error) {
        console.warn("Failed to fetch Market Cap (CoinGecko). Using Fallback.");
    }
}

async function fetchCurrentBlockHeight() {
    const display = document.getElementById('current-block');
    try {
        const response = await fetch(ARC_RPC_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 })
        });
        const data = await response.json();
        const blockNumber = parseInt(data.result, 16); 
        display.textContent = blockNumber.toLocaleString('en-US');

    } catch (error) {
        console.warn("Failed to fetch Block Height (ARC RPC). Using Fallback.");
    }
}

async function fetchTotalTransactions() {
    const display = document.getElementById('total-transactions');
    let finalValue = 0;

    try {
        const response = await fetch(ENDPOINT_STATS_COUNTERS);
        const data = await response.json();
        finalValue = data.transactions_count || data.total_transactions || 0;
    } catch (error) { /* Attempt Failover */ }

    if (finalValue === 0 || typeof finalValue !== 'number') {
        finalValue = FALLBACK_TOTAL_TRANSACTIONS; 
    }

    display.textContent = finalValue.toLocaleString('en-US');
}

// --------------------------------------------------------------------
// TRANSACTION LIST FUNCTIONS
// --------------------------------------------------------------------

async function fetchBigTransfers() {
    const container = document.getElementById('big-transactions');
    let bigTransfers = [];
    let isFallback = false;

    try {
        const response = await fetch(`${ENDPOINT_BIG_TRANSFERS}?limit=100&sort=desc`);
        const data = await response.json();
        
        bigTransfers = data.items.filter(tx => {
            if (tx.token && tx.token.symbol === USDC_TOKEN_NAME) {
                const decimalValue = Number(tx.total) / (10 ** USDC_DECIMALS);
                return decimalValue >= INSTITUTIONAL_LIMIT;
            }
            return false;
        });

    } catch (error) { 
        console.warn("Failed to fetch Big Transfers (ARCScan). Using Fallback.");
    }

    if (bigTransfers.length < 1) {
        bigTransfers = FALLBACK_BIG_TRANSFERS;
        isFallback = true;
    }
    
    displayBigTransfers(bigTransfers, isFallback);
}

function displayBigTransfers(bigTransfers, isFallback) {
    const container = document.getElementById('big-transactions');
    container.innerHTML = '<ul>'; 
    bigTransfers.slice(0, 5).forEach(tx => { 
        const value = tx.value || (Number(tx.total) / (10 ** USDC_DECIMALS));
        const time = tx.time || (tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString('en-US') : 'Just now');
        const address = tx.address || tx.from.hash || "0x000...ARC"; 

        container.innerHTML += `
            <li>
                <strong>Value: $${value.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</strong> 
                <span class="tx-address">Address: ${address.substring(0, 8)}...</span>
                <span class="tx-time">${time}</span>
            </li>`;
    });
    container.innerHTML += '</ul>';
}


// Function to fetch and display Recent Transaction Stream
async function fetchRecentTransactions() {
    let transactions = [];
    let isFallback = false;

    try {
        const response = await fetch(ENDPOINT_RECENT_TRANSACTIONS); 
        const data = await response.json();
        transactions = data.items || [];
        
        // Format transaction data to match required fields (hash, value, time, status)
        transactions = transactions.map(tx => ({
            hash: tx.hash,
            value: Number(tx.value) || 0, // Using general value, or could parse token value
            time: new Date(tx.timestamp).toLocaleTimeString('en-US'),
            status: tx.status === 'ok' ? 'SUCCESS' : 'FAILURE' 
        }));

    } catch (error) {
        console.warn("Failed to fetch Recent Transactions (ARCScan). Using Fallback.");
    }

    if (transactions.length < 1) {
        transactions = FALLBACK_RECENT_TRANSACTIONS;
        isFallback = true;
    }
    
    displayRecentTransactions(transactions, isFallback);
}

function displayRecentTransactions(transactions, isFallback) {
    const listContainer = document.getElementById('recent-transactions-list');
    
    let htmlContent = ''; 
    
    // Display warning message if API failed
    if (isFallback) {
        htmlContent += '<p class="fallback-warning">⚠️ API Inactive. Showing static presentation data.</p>';
    }

    htmlContent += '<ul class="transaction-list">';
    
    transactions.slice(0, 10).forEach(tx => { 
        const hash = tx.hash || "0xARC-TX-HASH"; 
        const link = `${ARCSCAN_TX_BASE_URL}${hash}`;
        const time = tx.time || "Just now";
        const statusClass = (tx.status === 'SUCCESS' || tx.status === 1) ? 'success' : 
                            (tx.status === 'PENDING') ? 'pending' : 'failure';
        
        // Determine icon based on status
        const statusIcon = (statusClass === 'success') ? '<i class="fas fa-check-circle"></i>' :
                           (statusClass === 'pending') ? '<i class="fas fa-clock"></i>' :
                           '<i class="fas fa-times-circle"></i>';

        htmlContent += `
            <li class="transaction-item ${statusClass}" onclick="window.open('${link}', '_blank')">
                <span class="tx-status-icon">${statusIcon}</span>
                <span class="tx-hash">${hash.substring(0, 10)}...${hash.slice(-4)}</span>
                <span class="tx-value">$${(tx.value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span class="tx-timestamp">${time}</span>
            </li>
        `;
    });
    htmlContent += '</ul>';

    listContainer.innerHTML = htmlContent;
}


function displayFinalityTime(timeSeconds) {
    document.getElementById('tempo-finalidade').textContent = `${timeSeconds.toFixed(2)}s`;
}

// ** SEARCH FUNCTION FIX V6 (FINAL ATTEMPT) **: Force Address Path
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        alert("Please enter a wallet, contract, or domain name.");
        return;
    }

    // Forces the path to /address/ and appends the query.
    // Ex: https://testnet.arcscan.app/address/0x123...
    window.open(`${ARCSCAN_SEARCH_BASE_URL}/address/${query}`, '_blank');
}

// ====================================================================
// INITIALIZATION AND AUTOREFRESH
// ====================================================================

// 1. INITIALIZATION: Set fallback values immediately
initializeMetrics();

// 2. START LOADING AND REFRESH LOOP (10 seconds)
loadMetrics(); 
setInterval(loadMetrics, UPDATE_INTERVAL_MS);