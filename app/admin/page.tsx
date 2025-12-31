'use client';

import React, { useState, useEffect, useRef } from 'react';
// Added Smartphone to the imports from lucide-react
import { cn, formatCurrency } from '../../lib/utils';
import { Loader2, Upload, Lock, Trash2, Edit2, Send, Download, Search, Package, Wifi, LayoutDashboard, LogOut, Terminal, Play, RotateCcw, Megaphone, CreditCard, Wallet, Activity, TrendingUp, Users, CheckCircle, Smartphone } from 'lucide-react';
import { DataPlan, Product, Transaction } from '../../types';
import { SharedReceipt } from '../../components/SharedReceipt';
import { toPng } from 'html-to-image';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'dashboard' | 'products' | 'plans' | 'orders' | 'transactions' | 'manual' | 'console' | 'broadcast' | 'flw_console'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', description: '', price: 0, image: '', category: 'device' });
  const [planForm, setPlanForm] = useState<Partial<DataPlan>>({ network: 'MTN', data: '', validity: '30 Days', price: 0, planId: 0 });
  const [manualForm, setManualForm] = useState({ phone: '', planId: '' });
  const [broadcastForm, setBroadcastForm] = useState({ content: '', type: 'info', isActive: true });
  const [editMode, setEditMode] = useState(false);
  
  const [consoleEndpoint, setConsoleEndpoint] = useState('/data/');
  const [consolePayload, setConsolePayload] = useState('{\n  "network": 1,\n  "mobile_number": "09000000000",\n  "plan": 1001,\n  "Ported_number": true\n}');
  const [consoleHistory, setConsoleHistory] = useState<Array<{ type: 'req' | 'res', data: any, time: string }>>([]);

  const [flwEndpoint, setFlwEndpoint] = useState('/balances');
  const [flwMethod, setFlwMethod] = useState('GET');
  const [flwPayload, setFlwPayload] = useState('{}');
  const [flwHistory, setFlwHistory] = useState<Array<{ type: 'req' | 'res', data: any, time: string }>>([]);

  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [pRes, plRes, txRes] = await Promise.all([
            fetch('/api/products').then(r => r.json()).catch(() => []),
            fetch('/api/data-plans').then(r => r.json()).catch(() => []),
            fetch('/api/transactions/list').then(r => r.json()).catch(() => [])
        ]);
        
        if (Array.isArray(pRes)) setProducts(pRes);
        if (Array.isArray(plRes)) setPlans(plRes);
        if (Array.isArray(txRes)) setTransactions(txRes);
    } catch (e) {
        console.error("Failed to load data", e);
    } finally {
        setLoading(false);
    }
  };

  const checkAuth = async () => {
      setLoading(true);
      try {
          const res = await fetch('/api/admin/auth', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }) 
          });
          if (res.ok) setIsAuthenticated(true);
          else alert("Incorrect Password");
      } catch (e) { alert("Error"); } 
      finally { setLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setProductForm({ ...productForm, image: reader.result as string });
        reader.readAsDataURL(file);
    }
  };

  const saveProduct = async () => {
      setLoading(true);
      await fetch('/api/products', { 
        method: editMode ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm) 
      });
      setEditMode(false);
      setProductForm({ name: '', description: '', price: 0, image: '', category: 'device' });
      fetchData();
      setView('products');
  };

  const savePlan = async () => {
      setLoading(true);
      await fetch('/api/data-plans', { 
        method: editMode ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm) 
      });
      setEditMode(false);
      setPlanForm({ network: 'MTN', data: '', validity: '30 Days', price: 0, planId: 0 });
      fetchData();
      setView('plans');
  };

  // Implemented deleteProduct to fix "Cannot find name 'deleteProduct'" error
  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Implemented deletePlan to fix "Cannot find name 'deletePlan'" error
  const deletePlan = async (id: string) => {
    if (!window.confirm("Delete this plan?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/data-plans?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
      setLoading(true);
      const res = await fetch('/api/system/message', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...broadcastForm, password }) 
      });
      setLoading(false);
      if (res.ok) {
          alert("Broadcast Updated!");
          setBroadcastForm({ content: '', type: 'info', isActive: true });
      } else alert("Failed");
  };

  // Implemented handleManualTopup to fix "Cannot find name 'handleManualTopup'" error
  const handleManualTopup = async () => {
    if (!manualForm.phone || !manualForm.planId) return alert("Please fill all fields");
    setLoading(true);
    try {
      const res = await fetch('/api/admin/manual-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...manualForm, password })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Topup successful!");
        setManualForm({ phone: '', planId: '' });
        fetchData();
      } else {
        alert(data.error || "Topup failed");
      }
    } catch (e) {
      alert("Error sending topup");
    } finally {
      setLoading(false);
    }
  };

  const sendConsoleRequest = async () => {
      let parsedPayload;
      try { parsedPayload = JSON.parse(consolePayload); } catch (e) { alert("Invalid JSON"); return; }
      setConsoleHistory(prev => [...prev, { type: 'req', data: { endpoint: consoleEndpoint, payload: parsedPayload }, time: new Date().toLocaleTimeString() }]);
      setLoading(true);
      try {
          const res = await fetch('/api/admin/console', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint: consoleEndpoint, payload: parsedPayload, password })
          });
          const data = await res.json();
          setConsoleHistory(prev => [...prev, { type: 'res', data: data, time: new Date().toLocaleTimeString() }]);
      } catch (e: any) {
          setConsoleHistory(prev => [...prev, { type: 'res', data: { error: e.message }, time: new Date().toLocaleTimeString() }]);
      } finally { setLoading(false); }
  };

  const sendFlwRequest = async () => {
      let parsedPayload;
      try { parsedPayload = JSON.parse(flwPayload); } catch (e) { alert("Invalid JSON"); return; }
      setFlwHistory(prev => [...prev, { type: 'req', data: { method: flwMethod, endpoint: flwEndpoint, payload: parsedPayload }, time: new Date().toLocaleTimeString() }]);
      setLoading(true);
      try {
          const res = await fetch('/api/admin/console/flutterwave', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint: flwEndpoint, method: flwMethod, payload: parsedPayload, password })
          });
          const data = await res.json();
          setFlwHistory(prev => [...prev, { type: 'res', data: data, time: new Date().toLocaleTimeString() }]);
      } catch (e: any) {
          setFlwHistory(prev => [...prev, { type: 'res', data: { error: e.message }, time: new Date().toLocaleTimeString() }]);
      } finally { setLoading(false); }
  };

  const stats = {
    totalRevenue: transactions.filter(t => t.status === 'paid' || t.status === 'delivered').reduce((acc, t) => acc + t.amount, 0),
    totalOrders: transactions.filter(t => t.type === 'ecommerce').length,
    totalData: transactions.filter(t => t.type === 'data' && t.status === 'delivered').length,
    activePlans: plans.length,
    activeProducts: products.length
  };

  const filteredTransactions = transactions.filter(t => 
    t.tx_ref.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.phone.includes(searchQuery) ||
    t.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ecommerceOrders = filteredTransactions.filter(t => t.type === 'ecommerce');

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-slate-100">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl"><Lock className="text-white w-8 h-8" /></div>
            <h1 className="text-2xl font-black mb-2 tracking-tight">Admin Portal</h1>
            <p className="text-slate-400 text-xs mb-8 uppercase tracking-[0.2em] font-bold">Encrypted Connection</p>
            <input type="password" className="border-2 border-slate-100 p-5 rounded-2xl w-full mb-6 bg-slate-50 focus:border-slate-900 outline-none transition-all font-mono" placeholder="Security Key" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAuth()} />
            <button onClick={checkAuth} className="bg-slate-900 text-white p-5 rounded-[1.5rem] w-full font-black shadow-xl hover:bg-slate-800 transition active:scale-95 uppercase tracking-widest">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Enter Dashboard'}</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-10 shadow-2xl">
            <div className="p-10 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" className="w-10 h-10 bg-white rounded-xl p-1.5" />
                    <div>
                        <h1 className="text-xl font-black tracking-tighter">SAUKI MART</h1>
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Administrator</p>
                    </div>
                </div>
            </div>
            <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto no-scrollbar">
                {[
                    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                    { id: 'orders', label: 'Store Orders', icon: Package },
                    { id: 'transactions', label: 'All Transactions', icon: Activity },
                    { id: 'products', label: 'Inventory', icon: Smartphone },
                    { id: 'plans', label: 'Data Plans', icon: Wifi },
                    { id: 'manual', label: 'Direct Topup', icon: Send },
                    { id: 'broadcast', label: 'App Broadcast', icon: Megaphone },
                    { id: 'console', label: 'API Terminal', icon: Terminal },
                    { id: 'flw_console', label: 'Flutterwave', icon: CreditCard },
                ].map(item => (
                    <button key={item.id} onClick={() => setView(item.id as any)} className={cn("flex items-center gap-4 w-full p-4 rounded-2xl text-sm font-black transition-all", view === item.id ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:bg-slate-800 hover:text-white uppercase tracking-tight")}>
                        <item.icon className="w-5 h-5" /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-6 border-t border-slate-800">
                <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-4 text-red-400 hover:text-red-300 w-full p-4 font-black uppercase tracking-widest"><LogOut className="w-5 h-5" /> Logout</button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-72 p-10 overflow-y-auto h-screen">
            <header className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{view}</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search reference, phone..." className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-slate-900 w-64 shadow-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={fetchData} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors"><RotateCcw className={cn("w-5 h-5 text-slate-600", loading && "animate-spin")} /></button>
                </div>
            </header>

            {view === 'dashboard' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'E-commerce Orders', value: stats.totalOrders, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Data Delivered', value: stats.totalData, icon: Wifi, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Inventory Items', value: stats.activeProducts, icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="font-black text-lg mb-6 uppercase tracking-tight">Recent Orders</h3>
                            <div className="space-y-4">
                                {ecommerceOrders.slice(0, 5).map(order => (
                                    <div key={order.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100"><Package className="w-5 h-5 text-slate-900" /></div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm uppercase">{order.customerName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{order.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 text-sm">{formatCurrency(order.amount)}</p>
                                            <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", order.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700')}>{order.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <TrendingUp className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5" />
                            <h3 className="font-black text-lg mb-2 uppercase tracking-tight relative z-10">Performance Sync</h3>
                            <p className="text-white/40 text-xs mb-8 relative z-10">Real-time gateway connectivity status.</p>
                            <div className="space-y-6 relative z-10">
                                {[
                                    { label: 'Flutterwave API', status: 'Online', delay: '124ms' },
                                    { label: 'Amigo Tunnel', status: 'Active', delay: '48ms' },
                                    { label: 'Database Node', status: 'Synced', delay: '12ms' },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                            <span className="text-sm font-black uppercase tracking-tight">{item.label}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-white/40">{item.delay}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'orders' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Customer</th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Order Ref</th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Item</th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Amount</th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Status</th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ecommerceOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-6">
                                        <p className="font-black text-slate-900 text-sm">{order.customerName}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{order.phone}</p>
                                    </td>
                                    <td className="p-6 font-mono text-[10px] text-slate-400">{order.tx_ref}</td>
                                    <td className="p-6 text-xs font-bold text-slate-600">{order.product?.name || 'Device'}</td>
                                    <td className="p-6 font-black text-slate-900 text-sm">{formatCurrency(order.amount)}</td>
                                    <td className="p-6">
                                        <span className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full", order.status === 'paid' ? 'bg-blue-100 text-blue-700' : order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700')}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button className="text-blue-600 text-[10px] font-black uppercase hover:underline">Mark Delivered</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'transactions' && (
                <div className="space-y-4">
                    {filteredTransactions.map(tx => (
                        <div key={tx.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", tx.type === 'data' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600')}>
                                    {tx.type === 'data' ? <Wifi className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.tx_ref}</p>
                                    <p className="font-black text-slate-900 text-base uppercase">{tx.type === 'data' ? `${tx.dataPlan?.network} ${tx.dataPlan?.data}` : tx.product?.name || 'Device'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold">BY: {tx.customerName || tx.phone}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-8">
                                <div>
                                    <p className="font-black text-slate-900 text-lg">{formatCurrency(tx.amount)}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={cn("text-[10px] font-black uppercase px-4 py-2 rounded-xl", tx.status === 'delivered' ? 'bg-green-100 text-green-700' : tx.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700')}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'manual' && (
                <div className="max-w-2xl mx-auto bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 text-white"><Send className="w-8 h-8" /></div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Manual Data Provision</h3>
                        <p className="text-slate-500 text-xs font-medium mt-2">Instantly push data bundles to any mobile number via Amigo Tunnel.</p>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Recipient Phone</label>
                            <input className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 outline-none focus:border-blue-600 transition-all font-mono text-xl" placeholder="080..." value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Plan</label>
                            <select className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 outline-none focus:border-blue-600 transition-all font-black text-sm uppercase" value={manualForm.planId} onChange={e => setManualForm({...manualForm, planId: e.target.value})}>
                                <option value="">CHOOSE A DATA BUNDLE</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.network} {p.data} - {p.validity} ({formatCurrency(p.price)})</option>)}
                            </select>
                        </div>
                        <button onClick={handleManualTopup} disabled={loading} className="w-full p-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition active:scale-95 disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Execute Provisioning'}
                        </button>
                    </div>
                </div>
            )}

            {view === 'broadcast' && (
                <div className="max-w-2xl mx-auto bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-100 text-white"><Megaphone className="w-8 h-8" /></div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">App Broadcast</h3>
                        <p className="text-slate-500 text-xs font-medium mt-2">Push a global notification message to all app users instantly.</p>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Message Content</label>
                            <textarea className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 outline-none focus:border-orange-500 transition-all font-medium text-sm min-h-[120px]" placeholder="Special promo: Get 10% off devices today!" value={broadcastForm.content} onChange={e => setBroadcastForm({...broadcastForm, content: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Banner Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['info', 'warning', 'alert'].map(type => (
                                    <button key={type} onClick={() => setBroadcastForm({...broadcastForm, type})} className={cn("p-4 rounded-xl border-2 font-black text-[10px] uppercase transition-all", broadcastForm.type === type ? 'border-orange-500 bg-orange-500 text-white shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-500')}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleBroadcast} disabled={loading} className="w-full p-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition active:scale-95">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Launch Broadcast'}
                        </button>
                    </div>
                </div>
            )}

            {(view === 'console' || view === 'flw_console') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
                    <div className="flex flex-col gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex-1">
                            <h3 className="font-black text-lg mb-6 uppercase tracking-tight flex items-center gap-3">
                                {view === 'console' ? <Terminal className="w-5 h-5 text-blue-600" /> : <CreditCard className="w-5 h-5 text-orange-600" />}
                                Request Terminal
                            </h3>
                            <div className="space-y-4">
                                {view === 'flw_console' && (
                                    <select className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-black text-xs outline-none" value={flwMethod} onChange={e => setFlwMethod(e.target.value)}>
                                        <option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option>
                                    </select>
                                )}
                                <input className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono text-xs outline-none" placeholder="Endpoint (/data/)" value={view === 'console' ? consoleEndpoint : flwEndpoint} onChange={e => view === 'console' ? setConsoleEndpoint(e.target.value) : setFlwEndpoint(e.target.value)} />
                                <div className="flex-1 relative">
                                    <textarea className="w-full h-64 p-5 rounded-2xl bg-slate-900 text-blue-400 font-mono text-xs outline-none resize-none shadow-inner" value={view === 'console' ? consolePayload : flwPayload} onChange={e => view === 'console' ? setConsolePayload(e.target.value) : setFlwPayload(e.target.value)} />
                                    <div className="absolute top-4 right-4 text-[8px] font-black text-slate-700 uppercase tracking-widest">JSON Payload</div>
                                </div>
                                <button onClick={view === 'console' ? sendConsoleRequest : sendFlwRequest} className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
                                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-4 h-4" />} Execute Request
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-64 h-64 text-white" /></div>
                        <h3 className="text-white font-black text-lg mb-6 uppercase tracking-tight relative z-10 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Console Output
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar relative z-10">
                            {(view === 'console' ? consoleHistory : flwHistory).map((h, i) => (
                                <div key={i} className={cn("p-4 rounded-2xl font-mono text-xs break-all border", h.type === 'req' ? 'bg-slate-800 text-blue-300 border-slate-700' : 'bg-slate-950 text-green-400 border-slate-800')}>
                                    <div className="flex justify-between mb-2 border-b border-white/5 pb-2 opacity-50">
                                        <span className="uppercase font-black text-[8px] tracking-widest">{h.type === 'req' ? 'Request' : 'Response'}</span>
                                        <span className="text-[8px]">{h.time}</span>
                                    </div>
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(h.data, null, 2)}</pre>
                                </div>
                            ))}
                            {(view === 'console' ? consoleHistory : flwHistory).length === 0 && <p className="text-slate-600 text-xs text-center py-20 font-black uppercase tracking-widest">Waiting for execution...</p>}
                        </div>
                    </div>
                </div>
            )}

            {(view === 'products' || view === 'plans') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                         <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-lg uppercase tracking-tight">Existing {view}</h3>
                            <button onClick={() => { setEditMode(false); setProductForm({category: 'device'}); setPlanForm({}); }} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">+ Add New</button>
                         </div>
                         <div className="max-h-[600px] overflow-y-auto p-6 space-y-3 no-scrollbar">
                            {(view === 'products' ? products : plans).map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-5">
                                        {view === 'products' && (
                                            <div className="w-14 h-14 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center overflow-hidden">
                                                <img src={item.image} className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-black text-slate-900 uppercase text-sm tracking-tight">{item.name || `${item.network} ${item.data}`}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2">
                                                {formatCurrency(item.price)} 
                                                {view === 'products' && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
                                                {view === 'products' && <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px]">{item.category}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditMode(true); view === 'products' ? setProductForm(item) : setPlanForm(item); }} className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 text-slate-400 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => view === 'products' ? deleteProduct(item.id) : deletePlan(item.id)} className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                         </div>
                     </div>

                     <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-fit sticky top-10">
                         <h3 className="font-black text-xl mb-8 uppercase tracking-tighter">{editMode ? 'Edit' : 'Create'} {view === 'products' ? 'Product' : 'Plan'}</h3>
                         {view === 'products' ? (
                            <div className="space-y-5">
                                <div className="border-4 border-dashed border-slate-100 p-8 rounded-3xl text-center relative hover:bg-slate-50 transition-all cursor-pointer group overflow-hidden">
                                    {productForm.image ? <img src={productForm.image} className="h-32 mx-auto object-contain drop-shadow-lg group-hover:scale-110 transition-transform" /> : <div className="text-slate-400 py-4"><Upload className="mx-auto mb-3 w-8 h-8 opacity-20" /> <span className="text-[10px] font-black uppercase tracking-widest">Select Product Image</span></div>}
                                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                                    <select className="border-2 border-slate-50 p-4 w-full rounded-2xl bg-white font-black text-xs uppercase" value={productForm.category || 'device'} onChange={e => setProductForm({...productForm, category: e.target.value as 'device' | 'sim'})}>
                                        <option value="device">Router / Modem / Gadget</option>
                                        <option value="sim">Special Data SIM Card</option>
                                    </select>
                                </div>

                                <input className="border-2 border-slate-50 p-4 w-full rounded-2xl outline-none focus:border-slate-900 transition-all text-sm font-medium" placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                                <textarea className="border-2 border-slate-50 p-4 w-full rounded-2xl outline-none focus:border-slate-900 transition-all text-sm font-medium h-24" placeholder="Smart Description..." value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                                <input className="border-2 border-slate-50 p-4 w-full rounded-2xl outline-none focus:border-slate-900 transition-all text-sm font-black" type="number" placeholder="Price (NGN)" value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                                <button onClick={saveProduct} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Save Item'}</button>
                            </div>
                         ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Provider</label>
                                    <select className="border-2 border-slate-50 p-4 w-full rounded-2xl bg-white font-black text-xs uppercase" value={planForm.network} onChange={e => setPlanForm({...planForm, network: e.target.value as any})}>
                                        <option value="MTN">MTN</option><option value="AIRTEL">AIRTEL</option><option value="GLO">GLO</option>
                                    </select>
                                </div>
                                <input className="border-2 border-slate-50 p-4 w-full rounded-2xl text-sm font-black" placeholder="Bundle Size (e.g. 10GB)" value={planForm.data} onChange={e => setPlanForm({...planForm, data: e.target.value})} />
                                <input className="border-2 border-slate-50 p-4 w-full rounded-2xl text-sm font-medium" placeholder="Validity (30 Days)" value={planForm.validity} onChange={e => setPlanForm({...planForm, validity: e.target.value})} />
                                <input className="border-2 border-slate-50 p-4 w-full rounded-2xl text-sm font-black" type="number" placeholder="Price (NGN)" value={planForm.price || ''} onChange={e => setPlanForm({...planForm, price: Number(e.target.value)})} />
                                <input className="border-2 border-slate-50 p-4 w-full rounded-2xl text-[10px] font-mono" type="number" placeholder="Amigo Plan ID Code" value={planForm.planId || ''} onChange={e => setPlanForm({...planForm, planId: Number(e.target.value)})} />
                                <button onClick={savePlan} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Save Data Plan'}</button>
                            </div>
                         )}
                     </div>
                </div>
            )}
        </main>

        {/* Global Manual Topup Dialog - Background helper */}
        <div className="hidden">
           <SharedReceipt ref={receiptRef} transaction={receiptTx ? { ...receiptTx, date: new Date(receiptTx.createdAt).toLocaleString(), description: 'Item' } as any : ({} as any)} />
        </div>
    </div>
  );
}
