document.addEventListener('DOMContentLoaded', () => {
    // ... (Mantenha seus códigos anteriores de 1.Partículas, 2.Gráfico e 4.Block Height exatamente iguais)

    // 3. Lógica da Wallet (Mantida, apenas guardando o endereço para uso posterior)
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

    // =========================================================================
    // NOVA IMPLEMENTAÇÃO: GERENCIAMENTO DE ROTA (IDA / VOLTA CCTP)
    // =========================================================================
    
    // Estado interno para rastrear a direção (false = Sepolia -> ARC | true = ARC -> Sepolia)
    let isReversedDirection = false;

    // Captura dos elementos da interface (Adicione esses IDs no seu HTML)
    const swapDirectionBtn = document.getElementById('swapDirection'); // O botão da seta do seu print
    const sourceNetworkLabel = document.getElementById('sourceNetwork'); // Texto da rede de origem
    const destNetworkLabel = document.getElementById('destNetwork');     // Texto da rede de destino
    const bridgeSubmitBtn = document.getElementById('executeBridgeBtn'); // Botão principal de envio

    if (swapDirectionBtn && sourceNetworkLabel && destNetworkLabel) {
        swapDirectionBtn.onclick = () => {
            // Inverte o estado da rota
            isReversedDirection = !isReversedDirection;

            // Altera visualmente os textos para o usuário/agente humano
            if (isReversedDirection) {
                sourceNetworkLabel.innerText = "ARC L1";
                destNetworkLabel.innerText = "Sepolia";
                if(bridgeSubmitBtn) bridgeSubmitBtn.innerText = "Execute Return Bridge (ARC -> Sepolia)";
                
                // Telemetria do Agente (Opcional - Altera seu console inferior de IA)
                updateAgentLogs("[CONTEXT] Direction inverted by Agent/User. Route: ARC -> Sepolia Testnet.");
            } else {
                sourceNetworkLabel.innerText = "Sepolia";
                destNetworkLabel.innerText = "ARC L1";
                if(bridgeSubmitBtn) bridgeSubmitBtn.innerText = "Execute Bridge";
                
                updateAgentLogs("[CONTEXT] Direction inverted by Agent/User. Route: Sepolia -> ARC L1.");
            }
        };
    }

    // Gatilho do Botão de Execução
    if (bridgeSubmitBtn) {
        bridgeSubmitBtn.onclick = async () => {
            const inputAmount = document.getElementById('bridgeInputAmount').value; // Seu campo de input numérico
            if (!inputAmount || inputAmount <= 0) {
                alert("Insira um valor válido");
                return;
            }

            if (isReversedDirection) {
                // Executa a nova rota de volta
                await executeArcToSepoliaBridge(inputAmount);
            } else {
                // Executa a rota padrão atual de ida
                await executeSepoliaToArcBridge(inputAmount);
            }
        };
    }

    // Funções de infraestrutura Web3 (Onde os Agentes e Contratos se comunicam)
    async function executeSepoliaToArcBridge(amount) {
        updateAgentLogs(`[INFO] Initiating Sepolia -> ARC. Amount: ${amount} USDC`);
        updateAgentLogs("[BURN] Calling TokenMessenger on Sepolia...");
        // Seu código atual de mint/burn da Sepolia entra aqui...
    }

    async function executeArcToSepoliaBridge(amount) {
        updateAgentLogs(`[INFO] Initiating Return Route: ARC -> Sepolia. Amount: ${amount} USDC`);
        updateAgentLogs("[BURN] Calling TokenMessenger on ARC L1 Contract...");
        
        // Exemplo tático de inversão de parâmetros para o Agente Autônomo:
        // const domainIdSepolia = 0;
        // await tokenMessengerArc.depositForBurn(amount, domainIdSepolia, ...);
        
        // Simulação de resposta para atualizar sua nova telemetria
        setTimeout(() => {
            updateAgentLogs("[WAIT] Burning complete on ARC. Fetching Circle Attestation (V1/V2 stable)...");
        }, 1500);
    }

    // Função auxiliar para injetar texto na sua nova div de Telemetria Inferior
    function updateAgentLogs(message) {
        const consoleLogDiv = document.getElementById('agentConsoleLogs');
        if (consoleLogDiv) {
            const time = new Date().toLocaleTimeString('pt-BR');
            consoleLogDiv.innerHTML += `<div>[${time}] ${message}</div>`;
            consoleLogDiv.scrollTop = consoleLogDiv.scrollHeight; // Auto-scroll
        }
    }
});