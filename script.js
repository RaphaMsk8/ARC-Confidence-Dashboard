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

    // Gatilho de Execução
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

    // Sistema Avançado de Logs com Filtro de Cores e Limitador de Linhas (Buffer Cíclico)
    function updateAgentLogs(message) {
        const consoleLogDiv = document.getElementById('agentConsoleLogs');
        if (!consoleLogDiv) return;

        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        let styledMessage = message;

        // Injeta cores específicas baseadas nas tags padrão de engenharia Web3
        if (message.includes("[SYSTEM]")) {
            styledMessage = `<span style="color: #38bdf8;">${message}</span>`;
        } else if (message.includes("[CONTEXT]")) {
            styledMessage = `<span style="color: #eab308;">${message}</span>`;
        } else if (message.includes("[ACTION]")) {
            styledMessage = `<span style="color: #a3e635;">${message}</span>`;
        } else if (message.includes("[BURN]") || message.includes("[MINT]")) {
            styledMessage = `<span style="color: #f43f5e;">${message}</span>`;
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