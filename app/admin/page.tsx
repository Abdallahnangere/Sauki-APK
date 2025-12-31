'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn, formatCurrency } from '../../lib/utils';
import { Loader2, Upload, Lock, Trash2, Edit2, Send, Download, Search, Package, Wifi, LayoutDashboard, LogOut, Terminal, Play, RotateCcw, Megaphone, CreditCard, Activity, TrendingUp, CheckCircle, Smartphone, MapPin, List } from 'lucide-react';
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
  const [receiptTx, setReceiptTx] = useState<any>(null);

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

  const handleStatusUpdate = async (tx_ref: string, status: string) => {
      setLoading(true);
      try {
          const res = await fetch('/api/admin/transactions/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tx_ref, status, password })
          });
          if (res.ok) {
              await fetchData();
              alert(`Order status updated to ${status}`);
          } else {
              alert("Update failed");
          }
      } catch (e) { alert("Error updating status"); }
      finally { setLoading(false); }
  };

  const handleDownloadReceipt = async (tx: Transaction) => {
      const getDesc = (tx: Transaction) => {
        if (tx.type === 'data') return `${tx.dataPlan?.network} ${tx.dataPlan?.data}`;
        // Extract manifest from deliveryData if available
        return (tx.deliveryData as any)?.manifest || tx.product?.name || 'Device Package';
      };
      
      setReceiptTx({
          tx_ref: tx.tx_ref,
          amount: tx.amount,
          date: new Date(tx.createdAt).toLocaleDateString() + ' ' + new Date(tx.createdAt).toLocaleTimeString(),
          type: tx.type === 'ecommerce' ? 'Corporate Order' : 'Data Bundle',
          description: getDesc(tx),
          status: tx.status,
          customerPhone: tx.phone,
          customerName: tx.customerName,
          deliveryAddress: tx.deliveryState || (tx.deliveryData as any)?.address
      });
      
      // Delay to ensure SharedReceipt component re-renders with new props
      setTimeout(async () => {
          if (receiptRef.current) {
              try {
                  const dataUrl = await toPng(receiptRef.current, { 
                      cacheBust: true, 
                      pixelRatio: 4, // Ultra-high res
                      backgroundColor: '#ffffff'
                  });
                  const link = document.createElement('a');
                  link.download = `SAUKI-ADMIN-RECEIPT-${tx.tx_ref}.png`;
                  link.href = dataUrl;
                  link.click();
                  setReceiptTx(null);
              } catch (err) {
                  alert("Receipt capture failed. Ensure off-screen container is initialized.");
              }
          }
      }, 800);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setProductForm({ ...productForm, image: reader.result as string });
        reader.readAsDataURL(file);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete product?")) return;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    fetchData();
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

  const deletePlan = async (id: string) => {
    if (!window.confirm("Delete plan?")) return;
    await fetch(`/api/data-plans?id=${id}`, { method: 'DELETE' });
    fetchData();
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
          alert("Broadcast Launched!");
          setBroadcastForm({ content: '', type: 'info', isActive: true });
      } else alert("Failed");
  };

  const handleManualTopup = async () => {
      if (!manualForm.phone || !manualForm.planId) return alert("Missing data");
      setLoading(true);
      const res = await fetch('/api/admin/manual-topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...manualForm, password })
      });
      setLoading(false);
      if (res.ok) {
          alert("Provisioned Successfully");
          setManualForm({ phone: '', planId: '' });
          fetchData();
      } else alert("Failed");
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

  const filteredTransactions = transactions.filter(t => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
          t.tx_ref.toLowerCase().includes(query) ||
          t.phone.includes(query) ||
          (t.customerName && t.customerName.toLowerCase().includes(query)) ||
          (t.product && t.product.name.toLowerCase().includes(query)) ||
          (t.dataPlan && t.dataPlan.network.toLowerCase().includes(query))
      );
  });

  const ecommerceOrders = filteredTransactions.filter(t => t.type === 'ecommerce');

  const stats = {
    totalRevenue: transactions.filter(t => t.status === 'paid' || t.status === 'delivered').reduce((acc, t) => acc + t.amount, 0),
    totalOrders: transactions.filter(t => t.type === 'ecommerce').length,
    totalData: transactions.filter(t => t.type === 'data' && t.status === 'delivered').length,
    activePlans: plans.length,
    activeProducts: products.length
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-slate-100">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl"><Lock className="text-white w-8 h-8" /></div>
            <h1 className="text-2xl font-black mb-2 tracking-tight">Admin Portal</h1>
            <p className="text-slate-400 text-xs mb-8 uppercase tracking-[0.2em] font-bold">Encrypted Connection</p>
            <input type="password" title="password" className="border-2 border-slate-100 p-5 rounded-2xl w-full mb-6 bg-slate-50 focus:border-slate-900 outline-none transition-all font-mono" placeholder="Security Key" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAuth()} />
            <button onClick={checkAuth} className="bg-slate-900 text-white p-5 rounded-[1.5rem] w-full font-black shadow-xl hover:bg-slate-800 transition active:scale-95 uppercase tracking-widest">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Enter Dashboard'}</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
        {/* Off-screen Receipt for High-Quality Capture */}
        {receiptTx && <SharedReceipt ref={receiptRef} transaction={receiptTx} />}

        {/* Sidebar */}
        <aside className="w-72 bg-slate-900 text-white hidden lg:flex flex-col fixed h-full z-10 shadow-2xl">
            <div className="p-10 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" className="w-10 h-10 bg-white rounded-xl p-1.5" alt="Logo" />
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
        <main className="flex-1 lg:ml-72 p-10 overflow-y-auto h-screen">
            <header className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{view}</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search orders..." className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-slate-900 w-64 shadow-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={fetchData} title="Sync/Restore Analytics" className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 group">
                        <RotateCcw className={cn("w-5 h-5 text-slate-600 group-active:rotate-180 transition-transform duration-500", loading && "animate-spin")} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden md:block">Restore Analytics</span>
                    </button>
                </div>
            </header>

            {view === 'dashboard' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Store Sales', value: stats.totalOrders, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Bundles Push', value: stats.totalData, icon: Wifi, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Active Items', value: stats.activeProducts, icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'orders' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-400">Recipient & Logistics</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-400">Order Ref</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-400">Full Items Manifest</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-400">Status</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">Fulfillment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ecommerceOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 min-w-[250px]">
                                            <p className="font-black text-slate-900 text-sm uppercase leading-none">{order.customerName}</p>
                                            <p className="text-[11px] text-blue-600 font-black mt-1.5">{order.phone}</p>
                                            <div className="mt-3 flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-inner">
                                                <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                                <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed break-words">
                                                    {order.deliveryState || (order.deliveryData as any)?.address || "N/A"}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-6 font-mono text-[10px] text-slate-400 uppercase tracking-tighter">{order.tx_ref}</td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1.5 max-w-[300px]">
                                                <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase">
                                                    <List className="w-3.5 h-3.5 text-blue-600" />
                                                    {(order.deliveryData as any)?.manifest || order.product?.name || "Multiple Items"}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{formatCurrency(order.amount)}</p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={cn("text-[9px] font-black uppercase px-4 py-2 rounded-xl tracking-widest", order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-3">
                                                {order.status !== 'delivered' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(order.tx_ref, 'delivered')}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-green-100 transition-all active:scale-95"
                                                    >
                                                        Mark Delivered
                                                    </button>
                                                )}
                                                <button onClick={() => handleDownloadReceipt(order)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"><Download className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'transactions' && (
                <div className="space-y-4">
                    {filteredTransactions.map(tx => (
                        <div key={tx.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-xl transition-all">
                            <div className="flex items-center gap-8">
                                <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner", tx.type === 'data' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600')}>
                                    {tx.type === 'data' ? <Wifi className="w-7 h-7" /> : <Package className="w-7 h-7" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tx.tx_ref}</p>
                                    <p className="font-black text-slate-900 text-lg uppercase tracking-tighter">
                                        {tx.type === 'data' ? `${tx.dataPlan?.network} ${tx.dataPlan?.data}` : (tx.deliveryData as any)?.manifest || tx.product?.name || 'Device Package'}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-[11px] text-blue-600 font-black uppercase tracking-widest">{tx.phone}</p>
                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                                <div className="text-left md:text-right flex-1 md:flex-none">
                                    <p className="font-black text-slate-900 text-2xl tracking-tighter">{formatCurrency(tx.amount)}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{tx.type === 'ecommerce' ? 'Direct Sale' : 'Bundle Topup'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-[9px] font-black uppercase px-5 py-2.5 rounded-xl tracking-widest", tx.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
                                        {tx.status}
                                    </span>
                                    {(tx.status === 'delivered' || tx.status === 'paid') && (
                                        <button onClick={() => handleDownloadReceipt(tx)} className="p-4 bg-slate-900 rounded-2xl text-white hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200"><Download className="w-6 h-6" /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(view === 'products' || view === 'plans') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden h-fit">
                         <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-lg uppercase tracking-tight">Existing Inventory</h3>
                            <button onClick={() => { setEditMode(false); setProductForm({category: 'device'}); setPlanForm({}); }} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">+ New Entry</button>
                         </div>
                         <div className="max-h-[650px] overflow-y-auto p-8 space-y-4 no-scrollbar">
                            {(view === 'products' ? products : plans).map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center p-6 bg-white rounded-[1.75rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="flex items-center gap-6">
                                        {view === 'products' && (
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-center overflow-hidden">
                                                <img src={item.image} className="w-full h-full object-contain" alt="Preview" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-black text-slate-900 uppercase text-base tracking-tight">{item.name || `${item.network} ${item.data}`}</div>
                                            <div className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-3 mt-1">
                                                <span className="text-blue-600">{formatCurrency(item.price)}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                {view === 'products' && <span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black">{item.category}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditMode(true); view === 'products' ? setProductForm(item) : setPlanForm(item); }} className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"><Edit2 className="w-5 h-5" /></button>
                                        <button onClick={() => view === 'products' ? deleteProduct(item.id) : deletePlan(item.id)} className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            ))}
                         </div>
                     </div>

                     <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 h-fit sticky top-10">
                         <h3 className="font-black text-2xl mb-10 uppercase tracking-tighter">{editMode ? 'Modify Entry' : 'Create Entry'}</h3>
                         {view === 'products' ? (
                            <div className="space-y-6">
                                <div className="border-4 border-dashed border-slate-100 p-10 rounded-[2.5rem] text-center relative hover:bg-slate-50 transition-all cursor-pointer group overflow-hidden">
                                    {productForm.image ? <img src={productForm.image} className="h-40 mx-auto object-contain drop-shadow-2xl" alt="Upload" /> : <div className="text-slate-400 py-6"><Upload className="mx-auto mb-4 w-10 h-10 opacity-30" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Select Visual Asset</span></div>}
                                    <input type="file" title="image" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Category Designation</label>
                                    <select className="border-2 border-slate-50 p-5 w-full rounded-2xl bg-white font-black text-xs uppercase" value={productForm.category || 'device'} onChange={e => setProductForm({...productForm, category: e.target.value as any})}>
                                        <option value="device">Standalone Hardware</option>
                                        <option value="sim">Network Data SIM</option>
                                        <option value="package">Full Solution Suite</option>
                                    </select>
                                </div>

                                <input className="border-2 border-slate-50 p-5 w-full rounded-2xl outline-none focus:border-slate-900 transition-all text-sm font-black uppercase tracking-tight" placeholder="Product Identifier" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                                <textarea className="border-2 border-slate-50 p-5 w-full rounded-2xl outline-none focus:border-slate-900 transition-all text-sm font-medium h-28" placeholder="Marketing Copy (Features & Specs)" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                                <input className="border-2 border-slate-50 p-5 w-full rounded-2xl outline-none focus:border-slate-900 transition-all text-sm font-black" type="number" placeholder="Retail Price (NGN)" value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                                <button onClick={saveProduct} className="w-full bg-slate-900 text-white p-6 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Synchronize Inventory'}</button>
                            </div>
                         ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Carrier Provider</label>
                                    <select className="border-2 border-slate-50 p-5 w-full rounded-2xl bg-white font-black text-xs uppercase" value={planForm.network} onChange={e => setPlanForm({...planForm, network: e.target.value as any})}>
                                        <option value="MTN">MTN NIGERIA</option><option value="AIRTEL">AIRTEL NIGERIA</option><option value="GLO">GLO WORLD</option>
                                    </select>
                                </div>
                                <input className="border-2 border-slate-50 p-5 w-full rounded-2xl text-sm font-black uppercase" placeholder="Data Payload (e.g. 100GB)" value={planForm.data} onChange={e => setPlanForm({...planForm, data: e.target.value})} />
                                <input className="border-2 border-slate-50 p-5 w-full rounded-2xl text-sm font-medium uppercase" placeholder="Validity Timeline" value={planForm.validity} onChange={e => setPlanForm({...planForm, validity: e.target.value})} />
                                <input className="border-2 border-slate-50 p-5 w-full rounded-2xl text-sm font-black" type="number" placeholder="Retail Price (NGN)" value={planForm.price || ''} onChange={e => setPlanForm({...planForm, price: Number(e.target.value)})} />
                                <input className="border-2 border-slate-50 p-5 w-full rounded-2xl text-[11px] font-mono" type="number" placeholder="Tunnel Plan ID" value={planForm.planId || ''} onChange={e => setPlanForm({...planForm, planId: Number(e.target.value)})} />
                                <button onClick={savePlan} className="w-full bg-slate-900 text-white p-6 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Synchronize Plan'}</button>
                            </div>
                         )}
                     </div>
                </div>
            )}

            {view === 'manual' && (
                <div className="max-w-2xl mx-auto bg-white p-16 rounded-[4rem] border border-slate-100 shadow-2xl mt-10">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl text-white"><Send className="w-10 h-10" /></div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Direct Tunnel Injection</h3>
                        <p className="text-slate-500 text-sm font-black mt-3 uppercase tracking-widest opacity-60">Push data payloads via Amigo Direct tunnel.</p>
                    </div>
                    <div className="space-y-8">
                        <input className="w-full p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 outline-none focus:border-blue-600 transition-all font-mono text-2xl tracking-widest text-center" placeholder="080XXXXXXXX" value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} />
                        <select className="w-full p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 outline-none focus:border-blue-600 transition-all font-black text-sm uppercase text-center" value={manualForm.planId} onChange={e => setManualForm({...manualForm, planId: e.target.value})}>
                            <option value="">Select Payload Bundle...</option>
                            {plans.map(p => <option key={p.id} value={p.id}>{p.network} {p.data} ({formatCurrency(p.price)})</option>)}
                        </select>
                        <button onClick={handleManualTopup} disabled={loading} className="w-full p-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition active:scale-95">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Execute Injection'}
                        </button>
                    </div>
                </div>
            )}

            {view === 'broadcast' && (
                <div className="max-w-2xl mx-auto bg-white p-16 rounded-[4rem] border border-slate-100 shadow-2xl mt-10">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 bg-orange-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl text-white"><Megaphone className="w-10 h-10" /></div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Ticker Update</h3>
                        <p className="text-slate-500 text-sm font-black mt-3 uppercase tracking-widest opacity-60">Update global moving broadcast for all users.</p>
                    </div>
                    <div className="space-y-8">
                        <textarea className="w-full p-8 rounded-3xl bg-slate-50 border-2 border-slate-100 outline-none focus:border-orange-500 transition-all font-black text-sm min-h-[160px] uppercase leading-relaxed" placeholder="Type your broadcast message here..." value={broadcastForm.content} onChange={e => setBroadcastForm({...broadcastForm, content: e.target.value})} />
                        <div className="grid grid-cols-3 gap-4">
                            {['info', 'warning', 'alert'].map(type => (
                                <button key={type} onClick={() => setBroadcastForm({...broadcastForm, type})} className={cn("p-6 rounded-2xl border-2 font-black text-[11px] uppercase tracking-widest transition-all", broadcastForm.type === type ? 'border-orange-500 bg-orange-500 text-white shadow-xl shadow-orange-100' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200')}>
                                    {type}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleBroadcast} disabled={loading} className="w-full p-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Deploy Ticker Update'}
                        </button>
                    </div>
                </div>
            )}

            {(view === 'console' || view === 'flw_console') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-[calc(100vh-220px)]">
                    <div className="flex flex-col gap-8">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex-1 flex flex-col">
                            <h3 className="font-black text-xl mb-10 uppercase tracking-tighter flex items-center gap-4">
                                <Terminal className="w-6 h-6 text-blue-600" /> Endpoint Terminal
                            </h3>
                            <div className="space-y-6 flex-1 flex flex-col">
                                {view === 'flw_console' && (
                                    <select className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 font-black text-xs uppercase" value={flwMethod} onChange={e => setFlwMethod(e.target.value)}>
                                        <option value="GET">GET REQUEST</option><option value="POST">POST REQUEST</option>
                                    </select>
                                )}
                                <input className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 font-mono text-xs" value={view === 'console' ? consoleEndpoint : flwEndpoint} onChange={e => view === 'console' ? setConsoleEndpoint(e.target.value) : setFlwEndpoint(e.target.value)} />
                                <textarea className="w-full flex-1 p-6 rounded-[1.5rem] bg-slate-900 text-blue-400 font-mono text-xs outline-none shadow-inner" value={view === 'console' ? consolePayload : flwPayload} onChange={e => view === 'console' ? setConsolePayload(e.target.value) : setFlwPayload(e.target.value)} />
                                <button onClick={view === 'console' ? sendConsoleRequest : sendFlwRequest} className="w-full p-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Play className="w-5 h-5 fill-current" />} Execute API Call
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col relative overflow-hidden shadow-2xl">
                        <h3 className="text-white font-black text-xl mb-10 uppercase tracking-tighter relative z-10 flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div> Server Response
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar relative z-10 font-mono text-xs">
                            {(view === 'console' ? consoleHistory : flwHistory).map((h, i) => (
                                <div key={i} className={cn("p-6 rounded-[1.5rem] border animate-in slide-in-from-bottom-2", h.type === 'req' ? 'bg-slate-800/50 text-blue-300 border-slate-700' : 'bg-slate-950/80 text-green-400 border-slate-800 shadow-2xl')}>
                                    <div className="flex justify-between items-center mb-4 text-[9px] font-black uppercase opacity-40">
                                        <span>{h.type === 'req' ? 'Sent Request' : 'Received Response'}</span>
                                        <span>{h.time}</span>
                                    </div>
                                    <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(h.data, null, 2)}</pre>
                                </div>
                            ))}
                            {(view === 'console' ? consoleHistory : flwHistory).length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-700 py-40">
                                    <Activity className="w-12 h-12 mb-4 opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Interaction...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
}