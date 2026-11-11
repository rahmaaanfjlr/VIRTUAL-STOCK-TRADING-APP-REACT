# StockSim - Virtual Stock Trading App

A React + Vite virtual stock trading simulator. All money and prices are simulated and data is stored in the browser's Local Storage (no backend).

## Modules

**User**
- Signup / Login (Local Storage) with Rs 1,00,000 virtual balance
- Dashboard (wallet, portfolio value, investment, profit/loss, recent transactions)
- Market (simulated prices, Buy / Sell)
- Portfolio, Transaction history (filter Buy/Sell), Profile

**Admin**
- Admin login (demo credentials: `admin` / `admin123`)
- Dashboard (total users, transactions, listed stocks)
- Manage Users (reset balance, delete)
- Manage Stocks (edit price)

## Run locally
```
npm install
npm run dev
```

## Build
```
npm run build
```

## Deploy (Vercel)
```
npm install -g vercel
vercel login
vercel
```
