:root {
    --bg-dark: #05070a;
    --accent: #38bdf8;
    --glass: rgba(15, 23, 42, 0.6); /* High Translucency */
    --border: rgba(56, 189, 248, 0.15);
}

body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: var(--bg-dark);
    color: #f1f5f9;
    overflow-x: hidden;
}

#particles-js {
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: radial-gradient(circle at center, #0a111a 0%, #05070a 100%);
}

/* Header */
.header-content { padding: 40px 20px; text-align: center; }
.glow { color: var(--accent); text-shadow: 0 0 15px var(--accent); }

.header-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
}

.premium-search-box {
    display: flex;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid var(--border);
    border-radius: 12px;
    width: 550px;
    padding: 4px;
}

.premium-search-box input {
    background: transparent;
    border: none;
    color: white;
    padding: 10px 20px;
    flex: 1;
    outline: none;
}

.btn-search-glow {
    background: var(--accent);
    color: #05070a;
    border: none;
    padding: 10px 25px;
    border-radius: 8px;
    font-weight: 800;
    cursor: pointer;
}

.btn-wallet-premium {
    background: rgba(56, 189, 248, 0.1);
    border: 1px dashed var(--accent);
    color: var(--accent);
    padding: 0 25px;
    border-radius: 12px;
    height: 52px;
    font-weight: bold;
    cursor: pointer;
}

/* Dashboard Cards */
.dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px 50px;
    display: flex;
    flex-direction: column;
    gap: 25px;
}

.card {
    background: var(--glass);
    backdrop-filter: blur(10px); /* Glassmorphism effect */
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 25px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.metrics-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
.stats-column { display: flex; flex-direction: column; gap: 15px; }

.main-value { font-size: 2.8rem; font-weight: 800; }
.trend.up { color: #10b981; margin-left: 10px; font-size: 1rem; }

/* Forge Section */
.forge-header { display: flex; justify-content: space-between; margin-bottom: 25px; }
.status-badge { color: var(--accent); font-size: 0.8rem; border: 1px solid var(--accent); padding: 4px 12px; border-radius: 20px; }
.forge-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.action-box { background: rgba(0,0,0,0.4); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); }

.btn-forge {
    width: 100%; padding: 15px; background: var(--accent); color: #000; border: none;
    border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 15px;
}

.swap-inputs { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.arrow { color: var(--accent); font-weight: bold; }

input, select {
    width: 100%; background: #000; border: 1px solid var(--border);
    color: white; padding: 12px; border-radius: 8px; margin-bottom: 10px;
    font-family: inherit;
}