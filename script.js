// 1. Configuração das Partículas (Efeito Estelar)
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 100, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#38bdf8" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.4, "random": true },
        "size": { "value": 2, "random": true },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#38bdf8",
            "opacity": 0.2,
            "width": 1
        },
        "move": { "enable": true, "speed": 1, "out_mode": "out" }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": { "enable": true, "mode": "grab" }, // Efeito de ligar pontos ao mouse
            "onclick": { "enable": true, "mode": "push" }
        },
        "modes": { "grab": { "distance": 200, "line_linked": { "opacity": 0.6 } } }
    }
});

// 2. Inicialização do Gráfico de Exemplo
const ctx = document.getElementById('marketChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
            label: 'USDC Vol',
            data: [250, 255, 252, 258, 260, 260.36],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        plugins: { legend: { display: false } },
        scales: { y: { display: false }, x: { grid: { display: false } } }
    }
});

// 3. Funções de Wallet e Métricas (Para preencher depois)
async function connect() {
    if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        document.getElementById('connectWallet').innerText = address.slice(0,6) + '...' + address.slice(-4);
    }
}

document.getElementById('connectWallet').addEventListener('click', connect);

// Mock de atualização de dados (vamos substituir por RPC real em seguida)
setInterval(() => {
    const height = document.getElementById('blockHeight');
    const current = parseInt(height.innerText.replace(/\D/g,'')) || 41903322;
    height.innerText = (current + 1).toLocaleString('pt-BR');
}, 3000);