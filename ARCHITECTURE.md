# AICD Technical Architecture 🏗️

This document describes the technical foundation and data flow of the **ARC Institutional Confidence Dashboard**.

## 1. High-Level Flow
The application operates as a real-time observer of the ARC Network, focusing on institutional liquidity metrics and network performance.

- **Data Source:** ARC Network RPC Endpoints & Explorer APIs.
- **Frontend:** Responsive Vanilla JS / Tailwind architecture for sub-second UI updates.
- **State Management:** Reactive data binding for live market cap and block height tracking.

## 2. Key Integration Points

### A. Liquidity Monitoring (USDC)
The dashboard is designed to track the `totalSupply()` and `Transfer` events of the USDC contract on the ARC Network. This allows the "Whale Watcher" to trigger alerts for transactions exceeding institutional thresholds (e.g., >$10k).

### B. Network Performance (Confidence Metrics)
- **Time to Finality:** Monitoring the interval between block proposal and irreversible confirmation.
- **Block Propagation:** Tracking current block height to ensure the dashboard reflects the live state of the ledger.

## 3. Future Scalability
- **WebSocket Integration:** Transitioning from REST polling to WebSockets for instant "Whale" alerts.
- **Historical Data:** Implementation of an indexing layer to provide 7-day or 30-day liquidity trends.

---
*Document Version: 1.0.0 (Pre-Mainnet Phase)*
