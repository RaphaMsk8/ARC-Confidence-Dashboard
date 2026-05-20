document.addEventListener('DOMContentLoaded', () => {
    // 1. Partículas (Estrelas pequenas e efeito de atração)
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
            "events": {
                "onhover": { "enable": true, "mode": "bubble" }
            },
            "modes": {
                "bubble": { "distance": 200, "size": 4, "duration": 0.3, "opacity": 1 }
            }
        },
        "retina_detect": true
    });

    // 2. Gráfico USDC
    const ctx = document.getElementById('marketChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                data: [240, 255, 245, 258, 260, 260.36],
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }
    });

    // 3. Lógica da Wallet
    let userWalletAddress = null;
    const connectBtn = document.getElementById('connectWallet');
    connectBtn.onclick = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                userWalletAddress = accounts[0];
                connectBtn.innerHTML = `<span style="color:#10b981">●</span> ${userWalletAddress.slice(0,6)}...${userWalletAddress.slice(-4)}`;
                connectBtn.style.borderColor = "#10b981";
                connectBtn.style.color = "#10b981";
            } catch (e) { console.log("Rejeitado"); }
        } else { alert("Instale MetaMask"); }
    };

    // 4. Mock de Block Height
    setInterval(() => {
        const bh = document.getElementById('blockHeight');
        if(bh) {
            let val = parseInt(bh.innerText.replace(/\./g, ''));
            bh.innerText = (val + 1).toLocaleString('pt-BR');
        }
    }, 3000);

    // =========================================================================
    // IMPLEMENTAÇÃO LOGICA DA SETA DE ALTERNAÇÃO (IDA / VOLTA CCTP)
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
                updateAgentLogs("[CONTEXT] Route updated by agent/user: ARC L1 -> Sepolia Testnet.");
            } else {
                sourceNetworkLabel.innerText = "Sepolia";
                destNetworkLabel.innerText = "ARC L1";
                if(bridgeSubmitBtn) bridgeSubmitBtn.innerText = "Execute Bridge";
                updateAgentLogs("[CONTEXT] Route updated by agent/user: Sepolia -> ARC L1.");
            }
        };
    }

    // Gatilho de Execução da Bridge
    if (bridgeSubmitBtn) {
        bridgeSubmitBtn.onclick = async () => {
            const inputElement = document.getElementById('bridgeInputAmount');
            const inputAmount = inputElement ? inputElement.value : 0;

            if (!inputAmount || inputAmount <= 0) {
                alert("Please enter a valid amount for the operation.");
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
        updateAgentLogs(`[ACTION] Initiating Bridge Request: Sepolia -> ARC L1. Volume: ${amount} USDC`);
        updateAgentLogs("[BURN] Invoking TokenMessenger contract on Sepolia Network...");
    }

    async function executeArcToSepoliaBridge(amount) {
        updateAgentLogs(`[ACTION] Initiating Return Bridge Request: ARC L1 -> Sepolia. Volume: ${amount} USDC`);
        updateAgentLogs("[BURN] Invoking TokenMessenger contract on ARC L1 Infrastructure...");
    }

    // =========================================================================
    // NOVA IMPLEMENTAÇÃO: SMART SWAP INTERATIVO E MULTI-ATIVOS (LADO DIREITO)
    // =========================================================================
    const swapAssetDirectionBtn = document.getElementById('swapAssetDirection');
    const sourceAssetSelect = document.getElementById('swapSourceAsset');
    const destAssetSelect = document.getElementById('swapDestAsset');
    const swapSubmitBtn = document.getElementById('executeSwapBtn');

    if (swapAssetDirectionBtn && sourceAssetSelect && destAssetSelect) {
        swapAssetDirectionBtn.onclick = () => {
            // Guarda temporariamente os ativos selecionados para fazer a inversão
            const oldSource = sourceAssetSelect.value;
            const oldDest = destAssetSelect.value;

            // Se os ativos forem iguais, previne o travamento invertendo as posições de forma inteligente
            if (oldSource === oldDest) {
                return; 
            }

            sourceAssetSelect.value = oldDest;
            destAssetSelect.value = oldSource;

            updateAgentLogs(`[CONTEXT] Swap pair inverted by agent/user. Target path: ${destAssetSelect.value} ⇄ ${sourceAssetSelect.value}`);
        };
    }

    // Monitoramento de mudanças manuais nos Seletores
    if(sourceAssetSelect && destAssetSelect) {
        sourceAssetSelect.onchange = () => {
            updateAgentLogs(`[CONTEXT] Source asset updated: ${sourceAssetSelect.value}`);
        };
        destAssetSelect.onchange = () => {
            updateAgentLogs(`[CONTEXT] Destination asset updated: ${destAssetSelect.value}`);
        };
    }

    // Gatilho de Execução do Smart Swap
    if (swapSubmitBtn) {
        swapSubmitBtn.onclick = async () => {
            const swapInputElement = document.getElementById('swapInputAmount');
            const swapAmount = swapInputElement ? swapInputElement.value : 0;
            const fromToken = sourceAssetSelect.value;
            const toToken = destAssetSelect.value;

            if (!swapAmount || swapAmount <= 0) {
                alert("Please enter a valid amount for the swap operation.");
                return;
            }

            if (fromToken === toToken) {
                alert("Source and Destination assets cannot be identical.");
                return;
            }

            await executeSmartSwap(swapAmount, fromToken, toToken);
        };
    }

    async function executeSmartSwap(amount, fromToken, toToken) {
        updateAgentLogs(`[ACTION] Requesting Smart Swap Order: ${amount} ${fromToken} -> ${toToken}`);
        updateAgentLogs(`[ROUTING] Querying Liquidity Pools on ARC L1 router for ${fromToken}/${toToken}...`);
        
        // Simula uma resposta assíncrona do Agente de Liquidez para fins visuais na telemetria
        setTimeout(() => {
            updateAgentLogs(`[POOL] Optimal route located. Estimated Price Impact: < 0.08%. Executing Swap contract call...`);
        }, 1200);
    }

    // =========================================================================
    // SISTEMA AVANÇADO DE LOGS COM FILTRO DE CORES E AUTO-CLEANUP
    // =========================================================================
    function updateAgentLogs(message) {
        const consoleLogDiv = document.getElementById('agentConsoleLogs');
        if (!consoleLogDiv) return;

        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        let styledMessage = message;

        // Injeta cores específicas baseadas nas tags padrão de engenharia Web3 / DeFI
        if (message.includes("[SYSTEM]")) {
            styledMessage = `<span style="color: #38bdf8;">${message}</span>`; // Cyan para o núcleo
        } else if (message.includes("[CONTEXT]")) {
            styledMessage = `<span style="color: #eab308;">${message}</span>`; // Amarelo para mudanças de estado
        } else if (message.includes("[ACTION]")) {
            styledMessage = `<span style="color: #a3e635;">${message}</span>`; // Verde para cliques principais
        } else if (message.includes("[BURN]") || message.includes("[MINT]")) {
            styledMessage = `<span style="color: #f43f5e;">${message}</span>`; // Vermelho/Rosa para chamadas on-chain
        } else if (message.includes("[ROUTING]") || message.includes("[POOL]")) {
            styledMessage = `<span style="color: #c084fc;">${message}</span>`; // Roxo/Púrpura para operações de Swap e Liquidez
        }

        // Adiciona a nova linha de log estruturada
        consoleLogDiv.innerHTML += `<div style="margin-bottom: 4px; font-family: monospace;">[${time}] ${styledMessage}</div>`;

        // Engenharia de Memória: Mantém estritamente os últimos 10 logs no DOM
        const maxLogs = 10;
        while (consoleLogDiv.children.length > maxLogs) {
            consoleLogDiv.removeChild(consoleLogDiv.firstChild);
        }

        // Força o scroll automático para o log mais recente
        consoleLogDiv.scrollTop = consoleLogDiv.scrollHeight;
    }
});