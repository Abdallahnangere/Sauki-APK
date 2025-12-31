
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn, formatCurrency } from '../../lib/utils';
import { Loader2, Upload, Lock, Trash2, Edit2, Send, Download, Search, Package, Wifi, LayoutDashboard, LogOut, Terminal, Play, RotateCcw, Megaphone, CreditCard, Wallet, Activity } from 'lucide-react';
import { DataPlan, Product, Transaction } from '../../types';
import { SharedReceipt } from '../../components/SharedReceipt';
import { toPng } from 'html-to-image';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'dashboard' | 'products' | 'plans' | 'orders' | 'transactions' | 'manual' | 'console' | 'broadcast' | 'flw_console'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Forms
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', description: '', price: 0, image: '', category: 'device' });
  const [planForm, setPlanForm] = useState<Partial<DataPlan>>({ network: 'MTN', data: '', validity: '30 Days', price: 0, planId: 0 });
  const [manualForm, setManualForm] = useState({ phone: '', planId: '' });
  const [editMode, setEditMode] = useState(false);
  
  // Broadcast Form
  const [broadcastForm, setBroadcastForm] = useState({ content: '', type: 'info', isActive: true });
  
  // Amigo Console State
  const [consoleEndpoint, setConsoleEndpoint] = useState('/data/');
  const [consolePayload, setConsolePayload] = useState('{\n  "network": 1,\n  "mobile_number": "09000000000",\n  "plan": 1001,\n  "Ported_number": true\n}');
  const [consoleHistory, setConsoleHistory] = useState<Array<{ type: 'req' | 'res', data: any, time: string }>>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Flutterwave Console State
  const [flwEndpoint, setFlwEndpoint] = useState('/balances');
  const [flwMethod, setFlwMethod] = useState('GET');
  const [flwPayload, setFlwPayload] = useState('{}');
  const [flwHistory, setFlwHistory] = useState<Array<{ type: 'req' | 'res', data: any, time: string }>>([]);
  const flwEndRef = useRef<HTMLDivElement>(null);

  // Receipt
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (isAuthenticated && view !== 'console' && view !== 'flw_console') fetchData();
  }, [isAuthenticated, view]);

  useEffect(() => {
    if (view === 'console') consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (view === 'flw_console') flwEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleHistory, flwHistory, view]);

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

  // CRUD
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

  const deleteProduct = async (id: string) => {
      if(!confirm("Delete?")) return;
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
      if(!confirm("Delete?")) return;
      await fetch(`/api/data-plans?id=${id}`, { method: 'DELETE' });
      fetchData();
  };

  const handleManualTopup = async () => {
      if (!manualForm.phone || !manualForm.planId) return alert("Fill all fields");
      setLoading(true);
      const res = await fetch('/api/admin/manual-topup', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...manualForm, password }) 
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
          alert("Topup Successful!");
          setManualForm({ phone: '', planId: '' });
          fetchData();
      } else {
          alert("Failed: " + JSON.stringify(data));
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
      } else {
          alert("Failed");
      }
  };

  const handleClearHistory = async () => {
      if (!confirm("⚠️ WARNING: This will permanently delete ALL transaction history. Tracking will be empty. Are you sure?")) return;
      
      const pass = prompt("Confirm Admin Password to Delete:");
      if (!pass) return;

      setLoading(true);
      const res = await fetch('/api/admin/transactions/clear', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pass }) 
      });
      
      setLoading(false);
      if (res.ok) {
          alert("History Wiped.");
          fetchData();
      } else {
          alert("Failed to wipe history. Check password.");
      }
  };

  const generateReceipt = async (tx: Transaction) => {
      setReceiptTx(tx);
      setTimeout(async () => {
          if (receiptRef.current) {
              const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
              const link = document.createElement('a');
              link.download = `RECEIPT-${tx.tx_ref}.png`;
              link.href = dataUrl;
              link.click();
              setReceiptTx(null);
          }
      }, 500);
  };

  const getTransactionDescription = (tx: Transaction) => {
      if (tx.type === 'data') {
          if (tx.dataPlan) {
              return `${tx.dataPlan.network} ${tx.dataPlan.data} (${tx.dataPlan.validity})`;
          }
          return 'Data Bundle';
      }
      if (tx.type === 'ecommerce') {
          if (tx.product) {
              return tx.product.name;
          }
          return 'Mobile Device';
      }
      return 'Item Order';
  };

  // --- AMIGO CONSOLE ---
  const sendConsoleRequest = async () => {
      let parsedPayload;
      try {
          parsedPayload = JSON.parse(consolePayload);
      } catch (e) {
          alert("Invalid JSON Format");
          return;
      }

      const timestamp = new Date().toLocaleTimeString();
      setConsoleHistory(prev => [...prev, { type: 'req', data: { endpoint: consoleEndpoint, payload: parsedPayload }, time: timestamp }]);
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
      } finally {
          setLoading(false);
      }
  };

  // --- FLUTTERWAVE CONSOLE ---
  const sendFlwRequest = async () => {
      let parsedPayload;
      try {
          parsedPayload = JSON.parse(flwPayload);
      } catch (e) {
          alert("Invalid JSON Format");
          return;
      }

      const timestamp = new Date().toLocaleTimeString();
      setFlwHistory(prev => [...prev, { type: 'req', data: { method: flwMethod, endpoint: flwEndpoint, payload: parsedPayload }, time: timestamp }]);
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
      } finally {
          setLoading(false);
      }
  };

  const loadFlwTemplate = (type: 'balance' | 'verify' | 'banks') => {
      if (type === 'balance') {
          setFlwMethod('GET');
          setFlwEndpoint('/balances');
          setFlwPayload('{}');
      } else if (type === 'verify') {
          setFlwMethod('GET');
          setFlwEndpoint('/transactions/verify_by_reference?tx_ref=TX_REF_HERE');
          setFlwPayload('{}');
      } else if (type === 'banks') {
          setFlwMethod('GET');
          setFlwEndpoint('/banks/NG');
          setFlwPayload('{}');
      }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><Lock className="text-white" /></div>
            <h1 className="text-xl font-black mb-1">Admin Portal</h1>
            <p className="text-slate-400 text-xs mb-6 uppercase tracking-wider">Restricted Access</p>
            <input type="password" className="border p-4 rounded-xl w-full mb-4 bg-slate-50" placeholder="Security Key" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={checkAuth} className="bg-slate-900 text-white p-4 rounded-xl w-full font-bold shadow-lg hover:bg-slate-800 transition">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Access Dashboard'}</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-10">
            <div className="p-8 border-b border-slate-800">
                <h1 className="text-xl font-black tracking-tight">SAUKI ADMIN</h1>
                <p className="text-slate-500 text-xs mt-1">v2.0.0 Pro</p>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
                {[
                    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                    { id: 'orders', label: 'Store Orders', icon: Package },
                    { id: 'transactions', label: 'All Transactions', icon: Search },
                    { id: 'products', label: 'Manage Store', icon: Package },
                    { id: 'plans', label: 'Manage Plans', icon: Wifi },
                    { id: 'manual', label: 'Manual Topup', icon: Send },
                    { id: 'broadcast', label: 'App Broadcast', icon: Megaphone },
                    { id: 'console', label: 'Amigo Console', icon: Terminal },
                    { id: 'flw_console', label: 'Flutterwave', icon: CreditCard },
                ].map(item => (
                    <button key={item.id} onClick={() => setView(item.id as any)} className={cn("flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium transition-colors", view === item.id ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
                        <item.icon className="w-4 h-4" /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full p-3"><LogOut className="w-4 h-4" /> Logout</button>
            </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 z-20 flex justify-between items-center">
            <h1 className="font-bold">SAUKI ADMIN</h1>
            <div className="flex gap-2">
                <button onClick={() => setView('dashboard')} className="p-2 bg-slate-800 rounded">Home</button>
                <button onClick={() => setIsAuthenticated(false)} className="p-2 bg-red-900 rounded">Exit</button>
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-8 pt-20 md:pt-8 overflow-y-auto h-screen">
            {receiptTx && <SharedReceipt ref={receiptRef} transaction={{ 
                tx_ref: receiptTx.tx_ref, 
                amount: receiptTx.amount, 
                date: new Date(receiptTx.createdAt).toLocaleString(), 
                type: receiptTx.type === 'ecommerce' ? 'Devices' : 'Data Bundle', 
                description: getTransactionDescription(receiptTx), 
                status: receiptTx.status, 
                customerPhone: receiptTx.phone, 
                customerName: receiptTx.customerName 
            }} />}

            {/* View Logic remains same, only showing changed Product Form below */}
            
            {(view === 'products' || view === 'plans') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* List */}
                     <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                         <div className="p-6 border-b border-slate-100 flex justify-between">
                            <h3 className="font-bold text-lg">Existing {view}</h3>
                            <button onClick={() => { setEditMode(false); setProductForm({category: 'device'}); setPlanForm({}); }} className="text-blue-600 text-sm font-bold">+ Add New</button>
                         </div>
                         <div className="max-h-[600px] overflow-y-auto p-4 space-y-2">
                            {(view === 'products' ? products : plans).length === 0 ? (
                                <p className="text-center p-8 text-slate-500">No items found.</p>
                            ) : (
                                (view === 'products' ? products : plans).map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            {view === 'products' && <img src={item.image} className="w-10 h-10 object-contain rounded-md bg-white border" />}
                                            <div>
                                                <div className="font-bold text-slate-900">{item.name || `${item.network} ${item.data}`}</div>
                                                <div className="text-xs text-slate-500">
                                                    {formatCurrency(item.price)} 
                                                    {view === 'products' && <span className="ml-2 uppercase bg-slate-100 px-1 rounded">{item.category}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditMode(true); view === 'products' ? setProductForm(item) : setPlanForm(item); }} className="p-2 bg-white border rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4 text-slate-600" /></button>
                                            <button onClick={() => view === 'products' ? deleteProduct(item.id) : deletePlan(item.id)} className="p-2 bg-white border rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-600" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                         </div>
                     </div>

                     {/* Form */}
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                         <h3 className="font-bold text-lg mb-6">{editMode ? 'Edit' : 'Create'} {view === 'products' ? 'Product' : 'Plan'}</h3>
                         {view === 'products' ? (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed p-6 rounded-xl text-center relative hover:bg-slate-50 transition cursor-pointer">
                                    {productForm.image ? <img src={productForm.image} className="h-24 mx-auto object-contain" /> : <div className="text-slate-400"><Upload className="mx-auto mb-2" /> <span className="text-xs">Upload Image</span></div>}
                                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                
                                <select 
                                    className="border p-3 w-full rounded-xl bg-white" 
                                    value={productForm.category || 'device'} 
                                    onChange={e => setProductForm({...productForm, category: e.target.value as 'device' | 'sim'})}
                                >
                                    <option value="device">Data Device (Router/Modem)</option>
                                    <option value="sim">Data SIM Card</option>
                                </select>

                                <input className="border p-3 w-full rounded-xl" placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                                <input className="border p-3 w-full rounded-xl" placeholder="Description / Mini Note" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                                <input className="border p-3 w-full rounded-xl" type="number" placeholder="Price (NGN)" value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                                <button onClick={saveProduct} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold">{loading ? 'Saving...' : 'Save Product'}</button>
                            </div>
                         ) : (
                            <div className="space-y-4">
                                <select className="border p-3 w-full rounded-xl bg-white" value={planForm.network} onChange={e => setPlanForm({...planForm, network: e.target.value as any})}>
                                    <option value="MTN">MTN</option><option value="AIRTEL">AIRTEL</option><option value="GLO">GLO</option>
                                </select>
                                <input className="border p-3 w-full rounded-xl" placeholder="Data (e.g. 1GB)" value={planForm.data} onChange={e => setPlanForm({...planForm, data: e.target.value})} />
                                <input className="border p-3 w-full rounded-xl" placeholder="Validity (e.g. 30 Days)" value={planForm.validity} onChange={e => setPlanForm({...planForm, validity: e.target.value})} />
                                <input className="border p-3 w-full rounded-xl" type="number" placeholder="Price" value={planForm.price || ''} onChange={e => setPlanForm({...planForm, price: Number(e.target.value)})} />
                                <input className="border p-3 w-full rounded-xl" type="number" placeholder="Amigo Plan ID (e.g. 201)" value={planForm.planId || ''} onChange={e => setPlanForm({...planForm, planId: Number(e.target.value)})} />
                                <button onClick={savePlan} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">{loading ? 'Saving...' : 'Save Data Plan'}</button>
                            </div>
                         )}
                     </div>
                </div>
            )}
        </main>
    </div>
  );
}
