particlesJS("particles-js", {
  "particles": {
    "number": { "value": 130, "density": { "enable": true, "value_area": 800 } },
    "color": { "value": "#38bdf8" },
    "shape": { "type": "circle" },
    "opacity": { "value": 0.6, "random": true },
    "size": { "value": 2, "random": true }, 
    "line_linked": { "enable": true, "distance": 150, "color": "#38bdf8", "opacity": 0.2 },
    "move": { "enable": true, "speed": 1.2 }
  },
  "interactivity": {
    "detect_on": "window",
    "events": {
      "onhover": { "enable": true, "mode": "bubble" } // Efeito de destaque/atração
    },
    "modes": {
      "bubble": { "distance": 200, "size": 4, "duration": 0.3, "opacity": 1, "speed": 3 }
    }
  }
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
    const connectBtn = document.getElementById('connectWallet');
    connectBtn.onclick = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const acc = accounts[0];
                connectBtn.innerHTML = `<span style="color:#10b981">●</span> ${acc.slice(0,6)}...${acc.slice(-4)}`;
                connectBtn.style.borderColor = "#10b981";
                connectBtn.style.color = "#10b981";
            } catch (e) { console.log("Rejeitado"); }
        } else { alert("Instale MetaMask"); }
    };

    // 4. Mock de Block Height (Simulação)
    setInterval(() => {
        const bh = document.getElementById('blockHeight');
        let val = parseInt(bh.innerText.replace(/\./g, ''));
        bh.innerText = (val + 1).toLocaleString('pt-BR');
    }, 3000);
});