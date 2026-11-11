import React, { useState, useEffect } from 'react';

// --- INITIAL DATA ---
const INITIAL_STOCKS = [
  { id: 1, name: "Apple Inc.", symbol: "AAPL", price: 175.50, change: 2.30, changePercent: 1.33 },
  { id: 2, name: "Microsoft Corp.", symbol: "MSFT", price: 415.20, change: -4.10, changePercent: -0.98 },
  { id: 3, name: "Amazon.com Inc.", symbol: "AMZN", price: 178.75, change: 3.45, changePercent: 1.97 },
  { id: 4, name: "Tesla Inc.", symbol: "TSLA", price: 172.80, change: -5.60, changePercent: -3.14 },
  { id: 5, name: "NVIDIA Corp.", symbol: "NVDA", price: 878.35, change: 18.50, changePercent: 2.15 },
  { id: 6, name: "Alphabet Inc.", symbol: "GOOGL", price: 152.40, change: 1.10, changePercent: 0.73 },
  { id: 7, name: "Meta Platforms", symbol: "META", price: 485.10, change: 7.20, changePercent: 1.51 },
  { id: 8, name: "Netflix Inc.", symbol: "NFLX", price: 612.90, change: -2.30, changePercent: -0.37 },
  { id: 9, name: "Coca-Cola Co.", symbol: "KO", price: 60.15, change: 0.25, changePercent: 0.42 },
  { id: 10, name: "JPMorgan Chase", symbol: "JPM", price: 198.60, change: 1.80, changePercent: 0.91 }
];

export default function App() {
  const [stocks, setStocks] = useState(() => JSON.parse(localStorage.getItem('stocks')) || INITIAL_STOCKS);
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('users')) || []);
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('transactions')) || []);
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('currentUser')) || null);
  const [currentAdmin, setCurrentAdmin] = useState(() => JSON.parse(localStorage.getItem('currentAdmin')) || null);
  
  const [currentView, setCurrentView] = useState(() => {
    if (localStorage.getItem('currentAdmin')) return 'admin-dashboard';
    if (localStorage.getItem('currentUser')) return 'dashboard';
    return 'login';
  });

  const [toast, setToast] = useState(null);
  const [tradeModal, setTradeModal] = useState({ isOpen: false, type: null, stock: null });
  const [tradeQty, setTradeQty] = useState(1);
  const [txFilter, setTxFilter] = useState('ALL');

  useEffect(() => { localStorage.setItem('stocks', JSON.stringify(stocks)); }, [stocks]);
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
    else localStorage.removeItem('currentUser');
  }, [currentUser]);
  useEffect(() => { 
    if (currentAdmin) localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));
    else localStorage.removeItem('currentAdmin');
  }, [currentAdmin]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const simulateMarket = () => {
    setStocks(prev => prev.map(stock => {
      const pChange = Number((Math.random() * 6 - 3).toFixed(2));
      const pDiff = Number((stock.price * (pChange / 100)).toFixed(2));
      return {
        ...stock,
        price: Math.max(1, Number((stock.price + pDiff).toFixed(2))),
        change: pDiff,
        changePercent: pChange
      };
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const identifier = e.target.identifier.value;
    const password = e.target.password.value;
    const user = users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
    if (user) {
      setCurrentUser(user);
      setCurrentView('dashboard');
      showToast('Login successful!');
    } else {
      showToast('Invalid credentials', 'error');
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (users.some(u => u.username === username)) {
      showToast('Username already taken', 'error');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      showToast('Email already registered', 'error');
      return;
    }
    const newUser = {
      id: 'USER_' + Date.now(),
      username, email, password,
      balance: 100000,
      portfolio: [],
      createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
    showToast('Account created! Please log in.');
    setCurrentView('login');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (e.target.adminUser.value === 'admin' && e.target.adminPass.value === 'admin123') {
      setCurrentAdmin({ username: 'admin' });
      setCurrentView('admin-dashboard');
      showToast('Admin login successful!');
    } else {
      showToast('Invalid admin credentials', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentAdmin(null);
    setCurrentView('login');
    showToast('Logged out successfully');
  };

  const executeTrade = () => {
    const qty = parseInt(tradeQty);
    if (!qty || qty <= 0) return showToast('Enter valid quantity', 'error');
    const { type, stock } = tradeModal;

    if (type === 'BUY') {
      const totalCost = stock.price * qty;
      if (currentUser.balance < totalCost) return showToast('Insufficient balance', 'error');

      const updatedBalance = currentUser.balance - totalCost;
      const existing = currentUser.portfolio.find(h => h.symbol === stock.symbol);
      const portfolio = existing
        ? currentUser.portfolio.map(h => {
            if (h.symbol !== stock.symbol) return h;
            const totalQty = h.quantity + qty;
            const totalInv = h.quantity * h.avgPrice + totalCost;
            return { ...h, quantity: totalQty, avgPrice: totalInv / totalQty };
          })
        : [...currentUser.portfolio, { symbol: stock.symbol, name: stock.name, quantity: qty, avgPrice: stock.price }];

      const updatedUser = { ...currentUser, balance: updatedBalance, portfolio };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));

      const newTx = {
        id: 'TX_' + Date.now(), userId: updatedUser.id, username: updatedUser.username,
        symbol: stock.symbol, type: 'BUY', quantity: qty, price: stock.price, total: totalCost, date: new Date().toISOString()
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Successfully bought ${qty} shares of ${stock.symbol}`);
    } else {
      const holding = currentUser.portfolio.find(h => h.symbol === stock.symbol);
      if (!holding || holding.quantity < qty) return showToast('You do not own enough shares', 'error');

      const proceeds = stock.price * qty;
      const updatedBalance = currentUser.balance + proceeds;
      let portfolio = currentUser.portfolio.map(h => {
        if (h.symbol === stock.symbol) return { ...h, quantity: h.quantity - qty };
        return h;
      }).filter(h => h.quantity > 0);

      const updatedUser = { ...currentUser, balance: updatedBalance, portfolio };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));

      const newTx = {
        id: 'TX_' + Date.now(), userId: updatedUser.id, username: updatedUser.username,
        symbol: stock.symbol, type: 'SELL', quantity: qty, price: stock.price, total: proceeds, date: new Date().toISOString()
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Successfully sold ${qty} shares of ${stock.symbol}`);
    }
    setTradeModal({ isOpen: false, type: null, stock: null });
    setTradeQty(1);
  };

  const getPortfolioStats = () => {
    if (!currentUser) return { val: 0, inv: 0, pl: 0 };
    let val = 0, inv = 0;
    currentUser.portfolio.forEach(h => {
      const currentStock = stocks.find(s => s.symbol === h.symbol);
      const cp = currentStock ? currentStock.price : h.avgPrice;
      val += h.quantity * cp;
      inv += h.quantity * h.avgPrice;
    });
    return { val, inv, pl: val - inv };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans w-full">
      {/* Disclaimer Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-400 text-center py-2.5 text-xs font-semibold px-4 tracking-wide">
        SIMULATED MARKET — FOR EDUCATIONAL PURPOSES ONLY. All money and transactions are virtual.
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-950 border-red-800 text-red-200' : 'bg-slate-800 border-slate-700 text-slate-200 border-l-4 border-l-emerald-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* App Layout */}
      <div className="flex flex-1 w-full">
        {currentUser || currentAdmin ? (
          <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0 shadow-lg">
            <div className="p-6 text-xl font-bold text-blue-400 border-b border-slate-700 tracking-tight">
              {currentUser ? 'StockSim V.1' : 'Admin Portal'}
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {currentUser && <>
                <button onClick={() => setCurrentView('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Dashboard</button>
                <button onClick={() => setCurrentView('market')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${currentView === 'market' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Market</button>
                <button onClick={() => setCurrentView('portfolio')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${currentView === 'portfolio' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Portfolio</button>
                <button onClick={() => setCurrentView('transactions')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${currentView === 'transactions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Transactions</button>
                <button onClick={() => setCurrentView('profile')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${currentView === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Profile</button>
              </>}
              {currentAdmin && <>
                <button onClick={() => setCurrentView('admin-dashboard')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${currentView === 'admin-dashboard' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Dashboard</button>
                <button onClick={() => setCurrentView('admin-users')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${currentView === 'admin-users' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Manage Users</button>
                <button onClick={() => setCurrentView('admin-stocks')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${currentView === 'admin-stocks' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Manage Stocks</button>
              </>}
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-red-500/10 mt-6 transition">Logout</button>
            </nav>
          </aside>
        ) : null}

        <main className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-18 bg-slate-800 border-b border-slate-700 px-8 flex items-center justify-between shadow-sm">
            <span className="font-semibold text-slate-200 text-base">Welcome, {currentUser?.username || currentAdmin?.username || 'Guest'}</span>
            {currentUser && <span className="font-bold text-emerald-400 text-base bg-emerald-500/10 px-4 py-1.5 rounded-lg border border-emerald-500/20">Wallet: ₹{currentUser.balance.toLocaleString('en-IN', {maximumFractionDigits:2})}</span>}
            {currentAdmin && <span className="bg-red-500/20 text-red-400 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-500/30">Admin Mode</span>}
          </header>

          {/* Dynamic Centering wrapper for Auth vs Dashboard */}
          <div className={`p-8 flex-1 overflow-y-auto ${!currentUser && !currentAdmin ? 'flex items-center justify-center bg-slate-950/40' : ''}`}>
            
            {/* AUTH VIEWS */}
            {currentView === 'login' && (
              <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
                <h2 className="text-3xl font-extrabold mb-2 text-center text-white tracking-tight">User Login</h2>
                <p className="text-sm text-slate-400 text-center mb-6">Log in to manage your virtual portfolio</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-300 mb-1.5 block font-semibold uppercase tracking-wider">Username or Email</label>
                    <input name="identifier" className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3.5 text-white focus:border-blue-500 focus:outline-none transition" placeholder="Enter username or email" required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 mb-1.5 block font-semibold uppercase tracking-wider">Password</label>
                    <input type="password" name="password" className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3.5 text-white focus:border-blue-500 focus:outline-none transition" placeholder="••••••••" required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-blue-600/30 mt-2">Log In</button>
                </form>
                <div className="mt-6 text-center text-sm text-slate-400">
                  Don't have an account? <button onClick={() => setCurrentView('signup')} className="text-blue-400 hover:underline font-semibold">Sign Up</button> | <button onClick={() => setCurrentView('admin-login')} className="text-red-400 hover:underline font-semibold">Admin Portal</button>
                </div>
              </div>
            )}

            {currentView === 'signup' && (
              <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
                <h2 className="text-3xl font-extrabold mb-2 text-center text-white tracking-tight">Create Account</h2>
                <p className="text-sm text-slate-400 text-center mb-6">Receive ₹1,00,000 in virtual starting balance</p>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-300 mb-1.5 block font-semibold uppercase tracking-wider">Username</label>
                    <input name="username" className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3.5 text-white focus:border-blue-500 focus:outline-none transition" placeholder="Choose a username" required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 mb-1.5 block font-semibold uppercase tracking-wider">Email</label>
                    <input type="email" name="email" className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3.5 text-white focus:border-blue-500 focus:outline-none transition" placeholder="name@example.com" required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 mb-1.5 block font-semibold uppercase tracking-wider">Password</label>
                    <input type="password" name="password" minLength={6} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3.5 text-white focus:border-blue-500 focus:outline-none transition" placeholder="At least 6 characters" required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-blue-600/30 mt-2">Sign Up</button>
                </form>
                <div className="mt-6 text-center text-sm text-slate-400">
                  Already have an account? <button onClick={() => setCurrentView('login')} className="text-blue-400 hover:underline font-semibold">Log In</button>
                </div>
              </div>
            )}

            {currentView === 'admin-login' && (
              <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
                <h2 className="text-3xl font-extrabold mb-2 text-center text-red-400 tracking-tight">Admin Portal</h2>
                <p className="text-sm text-slate-400 text-center mb-6">Academic Demonstration Access</p>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-300 mb-1.5 block font-semibold uppercase tracking-wider">Admin Username</label>
                    <input name="adminUser" defaultValue="admin" className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3.5 text-white focus:border-red-500 focus:outline-none transition" required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 mb-1.5 block font-semibold uppercase tracking-wider">Admin Password</label>
                    <input type="password" name="adminPass" defaultValue="admin123" className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3.5 text-white focus:border-red-500 focus:outline-none transition" required />
                  </div>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-red-600/30 mt-2">Admin Login</button>
                </form>
                <div className="mt-6 text-center text-sm text-slate-400">
                  <button onClick={() => setCurrentView('login')} className="text-blue-400 hover:underline font-semibold">Back to User Login</button>
                </div>
              </div>
            )}

            {/* USER DASHBOARD */}
            {currentUser && currentView === 'dashboard' && (() => {
              const stats = getPortfolioStats();
              const userTx = transactions.filter(t => t.userId === currentUser.id).slice(0, 5);
              return (
                <div className="space-y-8">
                  <div className="grid grid-cols-4 gap-6">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md"><h3 className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Wallet Balance</h3><p className="text-2xl font-bold mt-2 text-white">₹{currentUser.balance.toLocaleString('en-IN', {maximumFractionDigits:2})}</p></div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md"><h3 className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Portfolio Value</h3><p className="text-2xl font-bold mt-2 text-white">₹{stats.val.toLocaleString('en-IN', {maximumFractionDigits:2})}</p></div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md"><h3 className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Total Investment</h3><p className="text-2xl font-bold mt-2 text-white">₹{stats.inv.toLocaleString('en-IN', {maximumFractionDigits:2})}</p></div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md"><h3 className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Profit / Loss</h3><p className={`text-2xl font-bold mt-2 ${stats.pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>₹{stats.pl.toLocaleString('en-IN', {maximumFractionDigits:2})}</p></div>
                  </div>
                  <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-md">
                    <h2 className="text-lg font-bold mb-4 text-white">Recent Transactions</h2>
                    <table className="w-full text-left text-sm">
                      <thead><tr className="border-b border-slate-700 text-slate-400"><th className="pb-3">Date</th><th className="pb-3">Type</th><th className="pb-3">Symbol</th><th className="pb-3">Qty</th><th className="pb-3">Total</th></tr></thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {userTx.length ? userTx.map(t => (
                          <tr key={t.id} className="hover:bg-slate-700/20"><td className="py-3.5">{new Date(t.date).toLocaleDateString()}</td><td className={`py-3.5 font-bold ${t.type==='BUY'?'text-emerald-400':'text-red-400'}`}>{t.type}</td><td className="py-3.5">{t.symbol}</td><td className="py-3.5">{t.quantity}</td><td className="py-3.5">₹{t.total.toLocaleString()}</td></tr>
                        )) : <tr><td colSpan="5" className="text-center py-6 text-slate-400">No transactions yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* MARKET VIEW */}
            {currentUser && currentView === 'market' && (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Simulated Market Watch</h2>
                  <button onClick={simulateMarket} className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition text-white shadow-md shadow-blue-600/20">Simulate Price Shift</button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-700 text-slate-400"><th className="pb-3">Company</th><th className="pb-3">Price</th><th className="pb-3">Change</th><th className="pb-3">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {stocks.map(s => (
                      <tr key={s.id} className="hover:bg-slate-700/20">
                        <td className="py-4 font-medium text-white">{s.name} <span className="text-xs text-slate-400 block mt-0.5">{s.symbol}</span></td>
                        <td className="py-4 font-semibold">₹{s.price.toFixed(2)}</td>
                        <td className={`py-4 font-semibold ${s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{s.change >= 0 ? '+' : ''}{s.change} ({s.changePercent}%)</td>
                        <td className="py-4 space-x-2">
                          <button onClick={() => setTradeModal({ isOpen: true, type: 'BUY', stock: s })} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-xs font-bold text-white transition shadow-sm">Buy</button>
                          <button onClick={() => setTradeModal({ isOpen: true, type: 'SELL', stock: s })} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-xs font-bold text-white transition shadow-sm">Sell</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PORTFOLIO VIEW */}
            {currentUser && currentView === 'portfolio' && (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-md">
                <h2 className="text-xl font-bold mb-6 text-white">My Portfolio Holdings</h2>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-700 text-slate-400"><th className="pb-3">Stock</th><th className="pb-3">Qty</th><th className="pb-3">Avg Price</th><th className="pb-3">Current</th><th className="pb-3">Invested</th><th className="pb-3">Current Val</th><th className="pb-3">P&L</th></tr></thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {currentUser.portfolio.length ? currentUser.portfolio.map(h => {
                      const st = stocks.find(s => s.symbol === h.symbol);
                      const cp = st ? st.price : h.avgPrice;
                      const inv = h.quantity * h.avgPrice;
                      const val = h.quantity * cp;
                      const pl = val - inv;
                      return (
                        <tr key={h.symbol} className="hover:bg-slate-700/20">
                          <td className="py-4 font-medium text-white">{h.name} <span className="text-xs text-slate-400 block mt-0.5">{h.symbol}</span></td>
                          <td className="py-4">{h.quantity}</td>
                          <td className="py-4">₹{h.avgPrice.toFixed(2)}</td>
                          <td className="py-4">₹{cp.toFixed(2)}</td>
                          <td className="py-4">₹{inv.toFixed(2)}</td>
                          <td className="py-4">₹{val.toFixed(2)}</td>
                          <td className={`py-4 font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>₹{pl.toFixed(2)}</td>
                        </tr>
                      );
                    }) : <tr><td colSpan="7" className="text-center py-10 text-slate-400">Your portfolio is empty. Buy stocks from the Market!</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* TRANSACTIONS VIEW */}
            {currentUser && currentView === 'transactions' && (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Transaction History</h2>
                  <select value={txFilter} onChange={(e) => setTxFilter(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 text-sm text-white focus:outline-none">
                    <option value="ALL">All Transactions</option><option value="BUY">BUY Only</option><option value="SELL">SELL Only</option>
                  </select>
                </div>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-700 text-slate-400"><th className="pb-3">Date</th><th className="pb-3">Type</th><th className="pb-3">Symbol</th><th className="pb-3">Qty</th><th className="pb-3">Price</th><th className="pb-3">Total</th></tr></thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {transactions.filter(t => t.userId === currentUser.id && (txFilter === 'ALL' || t.type === txFilter)).map(t => (
                      <tr key={t.id} className="hover:bg-slate-700/20"><td className="py-4">{new Date(t.date).toLocaleString()}</td><td className={`py-4 font-bold ${t.type==='BUY'?'text-emerald-400':'text-red-400'}`}>{t.type}</td><td className="py-4">{t.symbol}</td><td className="py-4">{t.quantity}</td><td className="py-4">₹{t.price.toFixed(2)}</td><td className="py-4">₹{t.total.toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PROFILE VIEW */}
            {currentUser && currentView === 'profile' && (
              <div className="max-w-xl bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-md space-y-4">
                <h2 className="text-xl font-bold mb-4 text-white">User Profile</h2>
                <div className="text-slate-300 flex justify-between border-b border-slate-700 pb-3"><span>Username:</span> <strong className="text-white">{currentUser.username}</strong></div>
                <div className="text-slate-300 flex justify-between border-b border-slate-700 pb-3"><span>Email:</span> <strong className="text-white">{currentUser.email}</strong></div>
                <div className="text-slate-300 flex justify-between border-b border-slate-700 pb-3"><span>Account Created:</span> <strong className="text-white">{new Date(currentUser.createdAt).toLocaleDateString()}</strong></div>
                <div className="text-slate-300 flex justify-between border-b border-slate-700 pb-3"><span>Starting Balance:</span> <strong className="text-white">₹1,00,000</strong></div>
                <div className="text-slate-300 flex justify-between pt-1"><span>Current Wallet Balance:</span> <strong className="text-emerald-400">₹{currentUser.balance.toLocaleString('en-IN')}</strong></div>
              </div>
            )}

            {/* ADMIN DASHBOARD */}
            {currentAdmin && currentView === 'admin-dashboard' && (
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md"><h3 className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Total Users</h3><p className="text-2xl font-bold mt-2 text-white">{users.length}</p></div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md"><h3 className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Transactions</h3><p className="text-2xl font-bold mt-2 text-white">{transactions.length}</p></div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md"><h3 className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Listed Stocks</h3><p className="text-2xl font-bold mt-2 text-white">{stocks.length}</p></div>
              </div>
            )}

            {currentAdmin && currentView === 'admin-users' && (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-md">
                <h2 className="text-xl font-bold mb-6 text-white">Manage Registered Users</h2>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-700 text-slate-400"><th className="pb-3">Username</th><th className="pb-3">Email</th><th className="pb-3">Balance</th><th className="pb-3">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-700/20">
                        <td className="py-4 font-medium text-white">{u.username}</td>
                        <td className="py-4">{u.email}</td>
                        <td className="py-4">₹{u.balance.toLocaleString()}</td>
                        <td className="py-4 space-x-2">
                          <button onClick={() => {
                            setUsers(users.map(us => us.id === u.id ? { ...us, balance: 100000, portfolio: [] } : us));
                            showToast("User balance reset");
                          }} className="bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg text-xs font-bold text-white transition">Reset Balance</button>
                          <button onClick={() => {
                            setUsers(users.filter(us => us.id !== u.id));
                            showToast("User deleted");
                          }} className="bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-lg text-xs font-bold text-white transition">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {currentAdmin && currentView === 'admin-stocks' && (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-md">
                <h2 className="text-xl font-bold mb-6 text-white">Manage Stocks</h2>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-700 text-slate-400"><th className="pb-3">Stock</th><th className="pb-3">Price</th><th className="pb-3">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {stocks.map(s => (
                      <tr key={s.symbol} className="hover:bg-slate-700/20">
                        <td className="py-4 font-medium text-white">{s.name} ({s.symbol})</td>
                        <td className="py-4 font-semibold">₹{s.price.toFixed(2)}</td>
                        <td className="py-4">
                          <button onClick={() => {
                            const newP = prompt("Enter new price:", s.price);
                            if (newP && !isNaN(newP) && parseFloat(newP) > 0) {
                              setStocks(stocks.map(st => st.symbol === s.symbol ? { ...st, price: parseFloat(newP) } : st));
                              showToast("Stock price updated");
                            }
                          }} className="bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg text-xs font-bold text-white transition">Edit Price</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* TRADE MODAL */}
      {tradeModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-md space-y-5 shadow-2xl">
            <h3 className="text-xl font-bold text-white">{tradeModal.type} {tradeModal.stock.name} ({tradeModal.stock.symbol})</h3>
            <div className="text-sm text-slate-300 flex justify-between"><span>Current Price:</span> <strong className="text-white">₹{tradeModal.stock.price.toFixed(2)}</strong></div>
            {tradeModal.type === 'BUY' && <div className="text-sm text-slate-300 flex justify-between"><span>Wallet Balance:</span> <strong className="text-white">₹{currentUser.balance.toLocaleString()}</strong></div>}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-semibold uppercase tracking-wider">Quantity</label>
              <input type="number" min="1" value={tradeQty} onChange={(e) => setTradeQty(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="text-sm text-slate-300 flex justify-between pt-2 border-t border-slate-700"><span>Total Cost/Proceeds:</span> <strong className="text-white text-base">₹{(tradeModal.stock.price * (parseInt(tradeQty) || 0)).toLocaleString('en-IN', {maximumFractionDigits:2})}</strong></div>
            <div className="flex space-x-3 pt-2">
              <button onClick={executeTrade} className={`flex-1 py-3.5 rounded-xl font-bold text-white transition shadow-lg ${tradeModal.type === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}>Confirm {tradeModal.type}</button>
              <button onClick={() => setTradeModal({ isOpen: false, type: null, stock: null })} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-3.5 rounded-xl font-bold transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}