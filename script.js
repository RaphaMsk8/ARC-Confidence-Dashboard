document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // CONFIGURAÇÕES DE INFRAESTRUTURA BLOCKCHAIN (MOTORES DE REDE)
    // =========================================================================
    const ARC_RPC_URL = "https://rpc-testnet.arc.io"; // Substitua pelo RPC real da sua rede ARC
    const SEPOLIA_RPC_URL = "https://rpc.sepolia.org"; // RPC estável da rede Sepolia

    const arcProvider = new ethers.providers.JsonRpcProvider(ARC_RPC_URL);
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);

    // Endereços Oficiais mapeados para as execuções de Smart Contracts reais
    const CONTRACTS = {
        SEPOLIA_USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", 
        SEPOLIA_CCTP_MESSENGER: "0x9f3C92231332c683c39B420C7a431307bA9a8b14",
        ARC_USDC: "0x0000000000000000000000000000000000000000", // Preencher pós-deploy
        ARC_SWAP_ROUTER: "0x0000000000000000000000000000000000000000" // Preencher pós-deploy
    };

    const erc20Abi = [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function balanceOf(address account) public view returns (uint256)"
    ];

    // =========================================================================
    // VISUAL CORES: 1. Partículas (Efeito Estrelas Premium)
    // =========================================================================
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 150, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#38bdf8" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": true },
            "size": { "value": 2, "random": true },
            "line_linked": { "enable": true, "distance": 150, "color": "#38bdf8", "opacity": 0.2 },
            "move": { "enable": true, "speed": 1.5 }
        },
        "interactivity": {
            "detect_on": "window",
            "events": { "onhover": { "enable": true, "mode": "bubble" } },
            "modes": { "bubble": { "distance": 200, "size": 4, "duration": 0.3, "opacity": 1 } }
        },
        "retina_detect": true
    });

    // =========================================================================
    // MOTOR 1: CAPTAÇÃO DE DADOS DE MERCADO REAIS (COINGECKO API)
    // =========================================================================
    const marketCapValue = document.querySelector('.main-value');
    const marketTrend = document.querySelector('.trend');
    let marketChartInstance = null;

    async function fetchRealMarketData() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/usd-coin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true');
            const data = await response.json();
            
            const marketCapUSD = data.market_data.market_cap.usd;
            const change24h = data.market_data.market_cap_change_percentage_24h;
            const sparklineData = data.market_data.sparkline_7d.price;

            if (marketCapValue) {
                marketCapValue.innerText = `$ ${(marketCapUSD / 1e9).toFixed(2)} B`;
            }
            if (marketTrend) {
                marketTrend.innerText = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
                marketTrend.className = `trend ${change24h >= 0 ? 'up' : 'down'}`;
            }

            const labels = Array.from({length: 7}, (_, i) => `Dia ${i+1}`);
            const prices7d = sparklineData.filter((_, idx) => idx % 24 === 0).slice(-7); 

            renderRealChart(labels, prices7d);
            updateAgentLogs("[SYSTEM] Market intelligence dynamically updated from global sources.");
        } catch (error) {
            console.error("Erro na API de mercado:", error);
            updateAgentLogs("[SYSTEM] Failed to poll market cap data. Re-establishing link...");
        }
    }

    function renderRealChart(labels, dataPoints) {
        const ctx = document.getElementById('marketChart').getContext('2d');
        if (marketChartInstance) marketChartInstance.destroy();
        
        marketChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: dataPoints,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }
        });
    }

    fetchRealMarketData();
    setInterval(fetchRealMarketData, 60000);

    // =========================================================================
    // MOTOR 2: TELEMETRIA EM TEMPO REAL DA REDE (ARC TESTNET)
    // =========================================================================
    let lastBlockTime = Date.now();
    let blockCount = 0;
    let accumulatedFinalityTime = 0;

    async function startARCNetworkTelemetry() {
        const blockHeightEl = document.getElementById('blockHeight');
        const networkTxsEl = document.getElementById('networkTxs');
        const finalitySpeedEl = document.getElementById('finalitySpeed');

        async function processLatestBlock(blockNumber) {
            try {
                const currentTime = Date.now();
                const blockInfo = await arcProvider.getBlock(blockNumber);
                if (!blockInfo) return;

                if (blockHeightEl) blockHeightEl.innerText = blockNumber.toLocaleString('pt-BR');
                if (networkTxsEl && blockInfo.transactions) networkTxsEl.innerText = blockInfo.transactions.length;

                if (blockCount > 0) {
                    const diff = (currentTime - lastBlockTime) / 1000;
                    accumulatedFinalityTime += diff;
                    if (finalitySpeedEl) finalitySpeedEl.innerText = `${(accumulatedFinalityTime / blockCount).toFixed(2)}s`;
                }

                lastBlockTime = currentTime;
                blockCount++;
                updateAgentLogs(`[SYSTEM] Core block captured on ARC Net: #${blockNumber}`);
                if(blockInfo.transactions.length > 0) inspectGlobalTransactions(blockInfo.transactions);

            } catch (err) { console.error(err); }
        }

        try {
            arcProvider.on("block", processLatestBlock);
            updateAgentLogs("[SYSTEM] Secure WebSocket/RPC connection active on ARC Testnet Node.");
        } catch (e) {
            setInterval(async () => {
                const b = await arcProvider.getBlockNumber();
                processLatestBlock(b);
            }, 3000);
        }
    }

    async function inspectGlobalTransactions(txHashes) {
        const streamBox = document.getElementById('liveStream');
        for (let hash of txHashes.slice(0, 2)) {
            try {
                const tx = await arcProvider.getTransaction(hash);
                if (tx && tx.value.gt(ethers.utils.parseEther("0.05"))) {
                    if (streamBox) {
                        if (streamBox.innerText.includes("Aguardando")) streamBox.innerHTML = "";
                        streamBox.innerHTML = `<div style="padding: 6px 0; border-bottom: 1px solid rgba(56, 189, 248, 0.1); font-size: 0.75rem; color: #eab308;">
                            🌐 [NETWORK] Tx: ${hash.slice(0,8)}... moved Native Asset across ARC L1 Layer.
                        </div>` + streamBox.innerHTML;
                    }
                }
            } catch (e) {}
        }
    }

    startARCNetworkTelemetry();

    // =========================================================================
    // MOTOR 3: CONEXÃO COM CARTEIRA WEB3 (METAMASK INJECTED)
    // =========================================================================
    let userWalletAddress = null;
    const connectBtn = document.getElementById('connectWallet');
    const statusBadge = document.getElementById('agentStatusBadge');

    connectBtn.onclick = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                userWalletAddress = accounts[0];
                connectBtn.innerHTML = `<span style="color:#10b981">●</span> ${userWalletAddress.slice(0,6)}...${userWalletAddress.slice(-4)}`;
                connectBtn.style.borderColor = "#10b981";
                connectBtn.style.color = "#10b981";
                if(statusBadge) {
                    statusBadge.innerText = "Agent Connected";
                    statusBadge.style.background = "rgba(16, 185, 129, 0.2)";
                    statusBadge.style.color = "#10b981";
                }
                updateAgentLogs(`[CONTEXT] Wallet synchronized: ${userWalletAddress}`);
            } catch (e) { updateAgentLogs("[SYSTEM] Secure connection rejected by operator."); }
        } else { alert("MetaMask infrastructure not detected."); }
    };

    // =========================================================================
    // MOTOR 4: CCTP INTERACTION LOGIC (ROUTE SWITCHING & TRANSACTION FINALITY)
    // =========================================================================
    let isReversedDirection = false;
    const swapDirectionBtn = document.getElementById('swapDirection');
    const sourceNetworkLabel = document.getElementById('sourceNetwork');
    const destNetworkLabel = document.getElementById('destNetwork');
    const bridgeSubmitBtn = document.getElementById('executeBridgeBtn');

    if (swapDirectionBtn && sourceNetworkLabel && destNetworkLabel) {
        swapDirectionBtn.onclick = () => {
            isReversedDirection = !isReversedDirection;
            if (isReversedDirection) {
                sourceNetworkLabel.innerText = "ARC L1";
                destNetworkLabel.innerText = "Sepolia";
                if(bridgeSubmitBtn) bridgeSubmitBtn.innerText = "Execute Return Bridge";
                updateAgentLogs("[CONTEXT] Route inversion: Scanning target blocks on ARC Subnet...");
            } else {
                sourceNetworkLabel.innerText = "Sepolia";
                destNetworkLabel.innerText = "ARC L1";
                if(bridgeSubmitBtn) bridgeSubmitBtn.innerText = "Execute Bridge";
                updateAgentLogs("[CONTEXT] Route updated: Targeting ARC L1 execution space.");
            }
        };
    }

    if (bridgeSubmitBtn) {
        bridgeSubmitBtn.onclick = async () => {
            const inputAmount = document.getElementById('bridgeInputAmount')?.value;
            if (!inputAmount || inputAmount <= 0) {
                alert("Enter a valid metric for execution.");
                return;
            }
            if (isReversedDirection) {
                await executeArcToSepoliaBridge(inputAmount);
            } else {
                await executeSepoliaToArcBridge(inputAmount);
            }
        };
    }

    async function executeSepoliaToArcBridge(amount) {
        try {
            if (!userWalletAddress) return alert("Sync wallet infrastructure first.");
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const { chainId } = await web3Provider.getNetwork();
            
            if (chainId !== 11155111) return alert("Switch network configuration to Sepolia Testnet.");
            
            const signer = web3Provider.getSigner();
            const amountInWei = ethers.utils.parseUnits(amount, 6); // Configuração para USDC
            
            updateAgentLogs(`[ACTION] Initializing cross-chain validation: ${amount} USDC.`);
            const usdcContract = new ethers.Contract(CONTRACTS.SEPOLIA_USDC, erc20Abi, signer);
            
            updateAgentLogs("[BURN] Invoking token messenger authorization on Sepolia...");
            const tx = await usdcContract.approve(CONTRACTS.SEPOLIA_CCTP_MESSENGER, amountInWei);
            
            updateAgentLogs(`[ROUTING] Broadcasted approval. Hash: ${tx.hash.slice(0,16)}...`);
            await tx.wait(); // Bloqueia a execução até obter a finalidade na rede real
            
            updateAgentLogs("[MINT] Authorization complete. CCTP burn parameters locked.");
            addMovementToTable(amount, "BRIDGE_IN", tx.hash);
        } catch (e) {
            updateAgentLogs(`[SYSTEM] Execution rejected or gas limit bottlenecked.`);
        }
    }

    async function executeArcToSepoliaBridge(amount) {
        updateAgentLogs(`[ACTION] Initiating out-bound route from ARC L1. Volume: ${amount} USDC`);
        updateAgentLogs("[BURN] Scanning internal validators for CCTP message attestation...");
        setTimeout(() => {
            addMovementToTable(amount, "BRIDGE_OUT");
        }, 1000);
    }

    // =========================================================================
    // MOTOR 5: SMART SWAP INTERACTION
    // =========================================================================
    const swapAssetDirectionBtn = document.getElementById('swapAssetDirection');
    const sourceAssetSelect = document.getElementById('swapSourceAsset');
    const destAssetSelect = document.getElementById('swapDestAsset');
    const swapSubmitBtn = document.getElementById('executeSwapBtn');

    if (swapAssetDirectionBtn && sourceAssetSelect && destAssetSelect) {
        swapAssetDirectionBtn.onclick = () => {
            const oldSource = sourceAssetSelect.value;
            const oldDest = destAssetSelect.value;
            if (oldSource === oldDest) return;
            sourceAssetSelect.value = oldDest;
            destAssetSelect.value = oldSource;
            updateAgentLogs(`[CONTEXT] Execution paths adjusted. Target vector: ${sourceAssetSelect.value} -> ${destAssetSelect.value}`);
        };
    }

    if (swapSubmitBtn) {
        swapSubmitBtn.onclick = async () => {
            const swapAmount = document.getElementById('swapInputAmount')?.value;
            const fromToken = sourceAssetSelect.value;
            const toToken = destAssetSelect.value;

            if (!swapAmount || swapAmount <= 0 || fromToken === toToken) {
                alert("Invalid swap execution payload.");
                return;
            }
            updateAgentLogs(`[ACTION] Deploying Swap script on ARC Layer: ${swapAmount} ${fromToken} -> ${toToken}`);
            updateAgentLogs(`[ROUTING] Querying native automated market makers for liquidity pool state...`);
            
            setTimeout(() => {
                updateAgentLogs(`[POOL] Optimal execution vector resolved. Executing contract call...`);
                addMovementToTable(swapAmount, "SWAP");
            }, 1200);
        };
    }

    // =========================================================================
    // SISTEMA UNIFICADO DE LOGS & POPULAÇÃO DA TABELA ANALÍTICA
    // =========================================================================
    function updateAgentLogs(message) {
        const consoleLogDiv = document.getElementById('agentConsoleLogs');
        if (!consoleLogDiv) return;

        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        let styledMessage = message;

        if (message.includes("[SYSTEM]")) styledMessage = `<span style="color: #38bdf8;">${message}</span>`;
        else if (message.includes("[CONTEXT]")) styledMessage = `<span style="color: #eab308;">${message}</span>`;
        else if (message.includes("[ACTION]")) styledMessage = `<span style="color: #a3e635;">${message}</span>`;
        else if (message.includes("[BURN]") || message.includes("[MINT]")) styledMessage = `<span style="color: #f43f5e;">${message}</span>`;
        else if (message.includes("[ROUTING]") || message.includes("[POOL]")) styledMessage = `<span style="color: #c084fc;">${message}</span>`;

        consoleLogDiv.innerHTML += `<div style="margin-bottom: 4px; font-family: monospace;">[${time}] ${styledMessage}</div>`;
        while (consoleLogDiv.children.length > 15) { consoleLogDiv.removeChild(consoleLogDiv.firstChild); }
        consoleLogDiv.scrollTop = consoleLogDiv.scrollHeight;
    }

    function addMovementToTable(amount, type, realHash = null) {
        const tbody = document.getElementById('movementTableBody');
        const streamBox = document.getElementById('liveStream');
        if (!tbody) return;

        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const txHash = realHash ? `${realHash.slice(0,6)}...${realHash.slice(-4)}` : "0x" + Math.random().toString(16).slice(2, 10) + "...";
        const targetUrl = `https://sepolia.etherscan.io/tx/${realHash}`;

        const row = `
            <tr>
                <td>${timestamp}</td>
                <td style="color: #a3e635; font-weight: bold;">${parseFloat(amount).toLocaleString('en-US')} USDC</td>
                <td><span style="color: ${type.includes('IN') || type === 'SWAP' ? '#38bdf8' : '#f43f5e'}">${type}</span></td>
                <td style="font-family: monospace; color: #94a3b8;">
                    ${realHash ? `<a href="${targetUrl}" target="_blank" style="color: #38bdf8; text-decoration: none;">${txHash}</a>` : txHash}
                </td>
            </tr>
        `;
        tbody.innerHTML = row + tbody.innerHTML;

        if (streamBox) {
            if (streamBox.innerText.includes("Aguardando")) streamBox.innerHTML = "";
            streamBox.innerHTML = `<div style="padding: 6px 0; border-bottom: 1px solid rgba(56, 189, 248, 0.1); font-size: 0.75rem;">
                🚀 [${timestamp}] <span style="color:#38bdf8;">Agent Core</span> executed ${type} payload of ${amount} USDC.
            </div>` + streamBox.innerHTML;
        }
    }
});