import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Product, PaymentInitResponse } from '../../types';
import { api } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader2, CheckCircle2, Copy, Download, RefreshCw, ShoppingBag, Plus, Smartphone, ShieldCheck, Truck, Zap } from 'lucide-react';
import { toPng } from 'html-to-image';
import { SharedReceipt } from '../SharedReceipt';
import { toast } from '../../lib/toast';

export const Store: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'device' | 'sim'>('device');
  
  const [step, setStep] = useState<'details' | 'form' | 'payment' | 'success'>('details');
  const [formData, setFormData] = useState({ name: '', phone: '', state: '' });
  const [selectedSimId, setSelectedSimId] = useState<string>(''); 
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentInitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      loadProducts();
  }, []);

  const loadProducts = async () => {
      setIsLoading(true);
      try {
        const data = await api.getProducts();
        setProducts(data);
      } catch (e) {
          console.error("Failed to load products");
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    let interval: any;
    if (paymentDetails && step === 'payment') {
      setIsPolling(true);
      interval = setInterval(async () => {
        try {
          const res = await api.verifyTransaction(paymentDetails.tx_ref);
          if (res.status === 'paid' || res.status === 'delivered') {
            setStep('success');
            setIsPolling(false);
            clearInterval(interval);
            toast.success("Payment confirmed!");
          }
        } catch (e) { }
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [paymentDetails, step]);

  const handleBuyNow = () => {
    if (formData.name && formData.phone && formData.state) {
        handleFormSubmit();
    } else {
        setStep('form');
    }
  };

  const handleFormSubmit = async () => {
    if (!selectedProduct) return;
    setIsLoading(true);
    try {
      const res = await api.initiateEcommercePayment({
        productId: selectedProduct.id,
        simId: selectedSimId || undefined, 
        ...formData
      });
      setPaymentDetails(res);
      setStep('payment');
    } catch (e: any) {
      toast.error(e.message || "Error creating order");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheck = async () => {
      if (!paymentDetails) return;
      setIsLoading(true);
      try {
          const res = await api.verifyTransaction(paymentDetails.tx_ref);
          if (res.status === 'paid' || res.status === 'delivered') {
              setStep('success');
              toast.success("Payment confirmed!");
          } else {
              toast.info("Payment not received yet.");
          }
      } catch (e) {
          toast.error("Verification failed.");
      } finally {
          setIsLoading(false);
      }
  };

  const downloadReceipt = async () => {
    if (receiptRef.current === null) return;
    try {
        const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `SAUKI-STORE-${paymentDetails?.tx_ref}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Receipt downloaded");
    } catch (err) {
        toast.error("Failed to generate receipt");
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setStep('details');
    setPaymentDetails(null);
    setFormData({ name: '', phone: '', state: '' });
    setSelectedSimId('');
  };

  const displayedProducts = products.filter(p => (p.category || 'device') === activeTab);
  const availableSims = products.filter(p => (p.category === 'sim'));
  const upsellSim = availableSims.find(s => s.id === selectedSimId);
  const currentTotal = selectedProduct ? (selectedProduct.price + (upsellSim ? upsellSim.price : 0)) : 0;

  return (
    <div className="p-6 pb-32">
      <h1 className="text-2xl font-black mb-4 text-slate-900 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-200">
           <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        Premium Store
      </h1>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] mb-6">
          <button 
            onClick={() => setActiveTab('device')}
            className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'device' ? "bg-white text-slate-900 shadow-md" : "text-slate-500")}
          >
            Data Devices
          </button>
          <button 
            onClick={() => setActiveTab('sim')}
            className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'sim' ? "bg-white text-slate-900 shadow-md" : "text-slate-500")}
          >
            Data SIM Cards
          </button>
      </div>
      
      {isLoading && products.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-slate-200" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
            {displayedProducts.length === 0 ? (
                <div className="col-span-2 text-center text-slate-400 py-20 font-black uppercase tracking-widest text-[10px]">No Inventory Available</div>
            ) : displayedProducts.map((product) => (
            <motion.div
                key={product.id}
                whileTap={{ scale: 0.96 }}
                className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-2xl hover:shadow-slate-100 transition-all group"
                onClick={() => setSelectedProduct(product)}
            >
                <div className="aspect-square bg-slate-50 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center p-4">
                    <img src={product.image} alt={product.name} className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                </div>
                <h3 className="font-black text-slate-900 text-[10px] line-clamp-2 min-h-[32px] leading-tight mb-2 uppercase tracking-tight">{product.name}</h3>
                <div className="mt-auto">
                   <div className="font-black text-blue-600 text-sm tracking-tighter">{formatCurrency(product.price)}</div>
                </div>
            </motion.div>
            ))}
        </div>
      )}

      <BottomSheet isOpen={!!selectedProduct} onClose={handleClose} title={step === 'payment' ? 'Order Fulfillment' : 'Product Showcase'}>
         {step === 'details' && selectedProduct && (
             <div className="space-y-6">
                 <div className="aspect-[4/3] bg-slate-50 rounded-[2.5rem] overflow-hidden flex items-center justify-center p-8 border border-slate-100 shadow-inner">
                     <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl" />
                 </div>
                 
                 <div className="space-y-4">
                     <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(selectedProduct.price)}</h2>
                            <p className="text-lg font-black text-slate-900 mt-1 uppercase leading-none tracking-tight">{selectedProduct.name}</p>
                        </div>
                        <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-green-100 flex items-center gap-1 shadow-sm">
                            <Zap className="w-3 h-3 fill-green-600" /> In Stock
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                            <ShieldCheck className="w-5 h-5 text-blue-600 mb-1" />
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Premium</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                            <Truck className="w-5 h-5 text-blue-600 mb-1" />
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">NATIONWIDE</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                            <Zap className="w-5 h-5 text-blue-600 mb-1" />
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">INSTANT</span>
                        </div>
                     </div>

                     <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Product Description</h4>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                            {selectedProduct.description || "Unleash high-speed performance with Sauki Mart's flagship connectivity suite. This device is optimized for maximum network stability and consistent delivery across all Nigerian regions."}
                        </p>
                     </div>

                     {/* SIM UPSELL moved to Description page */}
                     {(selectedProduct.category === 'device' || !selectedProduct.category) && availableSims.length > 0 && (
                         <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl shadow-slate-200">
                             <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                 <Plus className="w-4 h-4 text-blue-400" /> Bundle with Data SIM?
                             </label>
                             <select 
                                className="w-full p-4 rounded-2xl border-none bg-white/10 text-white font-black text-sm backdrop-blur-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                value={selectedSimId}
                                onChange={(e) => setSelectedSimId(e.target.value)}
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                             >
                                 <option value="" className="text-slate-900">None, Just the Device</option>
                                 {availableSims.map(sim => (
                                     <option key={sim.id} value={sim.id} className="text-slate-900">
                                         {sim.name} (+{formatCurrency(sim.price)})
                                     </option>
                                 ))}
                             </select>
                         </div>
                     )}
                 </div>

                 <Button onClick={handleBuyNow} className="h-16 text-xl font-black bg-slate-900 text-white shadow-2xl shadow-slate-200 rounded-[2rem] uppercase tracking-tighter">
                     Proceed to Secure Checkout {upsellSim && `(${formatCurrency(currentTotal)})`}
                 </Button>
             </div>
         )}

         {step === 'form' && selectedProduct && (
             <div className="space-y-4">
                 <div className="bg-slate-50 p-5 rounded-[1.5rem] mb-4 flex items-center gap-4 border border-slate-100 shadow-inner">
                    <img src={selectedProduct.image} className="w-14 h-14 object-contain mix-blend-multiply" />
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Summary</p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedProduct.name} {upsellSim && `+ ${upsellSim.name}`}</p>
                        <p className="text-blue-600 font-black text-xs">{formatCurrency(currentTotal)} Total</p>
                    </div>
                 </div>
                 <Input label="Receiver Full Name" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-2xl h-14 font-black text-sm uppercase" />
                 <Input label="Contact Phone" type="tel" placeholder="080..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-2xl h-14 font-black text-sm" />
                 <Input label="Detailed Delivery Address" placeholder="Street, City, State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="rounded-2xl h-14 font-black text-sm uppercase" />
                 
                 <Button onClick={handleFormSubmit} isLoading={isLoading} className="mt-4 h-16 text-xl font-black bg-blue-600 rounded-[2rem] uppercase tracking-tighter shadow-xl shadow-blue-100">
                     Initialize Payment ({formatCurrency(currentTotal)})
                 </Button>
             </div>
         )}

         {step === 'payment' && paymentDetails && (
             <div className="space-y-6">
                 <div className="bg-orange-50 border-2 border-orange-100 p-8 rounded-[2.5rem] text-center relative overflow-hidden shadow-inner">
                     {isPolling && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-4 right-4 text-[9px] text-orange-600 font-black uppercase tracking-widest flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Verifying</motion.div>}
                     <p className="text-[10px] text-orange-800 mb-2 font-black uppercase tracking-widest">Transfer EXACTLY</p>
                     <p className="text-5xl font-black text-orange-900 tracking-tighter">{formatCurrency(paymentDetails.amount)}</p>
                     <p className="text-[10px] text-orange-600 mt-3 font-bold uppercase tracking-wider">Gateway Secure Provisioning</p>
                 </div>
                 
                 <div className="space-y-3">
                     <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                         <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Bank Name</p>
                         <p className="font-black text-slate-900 text-xl tracking-tight uppercase">{paymentDetails.bank}</p>
                     </div>
                     <div className="bg-white border-2 border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                         <div>
                             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Account Number</p>
                             <p className="font-black text-3xl tracking-tight text-slate-900 font-mono">{paymentDetails.account_number}</p>
                         </div>
                         <Button variant="ghost" className="w-14 h-14 p-0 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full shadow-inner" onClick={() => {
                             navigator.clipboard.writeText(paymentDetails.account_number);
                             toast.success("Account number copied");
                         }}>
                             <Copy className="w-6 h-6" />
                         </Button>
                     </div>
                     <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                         <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Beneficiary Name</p>
                         <p className="font-black text-slate-900 text-base uppercase">{paymentDetails.account_name}</p>
                     </div>
                 </div>

                 <div className="space-y-2">
                    <Button onClick={handleManualCheck} isLoading={isLoading} className="bg-green-600 hover:bg-green-700 h-16 text-white text-xl font-black shadow-2xl shadow-green-100 rounded-[2rem] uppercase tracking-tighter">
                        Confirm Transfer Made
                    </Button>
                    <div className="bg-slate-50 p-5 rounded-3xl text-center border border-slate-100">
                        <div className="flex items-center justify-center gap-3 text-slate-600 mb-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Gateway Signal</span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Transaction is monitored 24/7</p>
                    </div>
                 </div>
             </div>
         )}

         {step === 'success' && selectedProduct && paymentDetails && (
             <div className="text-center space-y-6 py-4">
                 <SharedReceipt 
                    ref={receiptRef}
                    transaction={{
                        tx_ref: paymentDetails.tx_ref,
                        amount: paymentDetails.amount,
                        date: new Date().toLocaleString(),
                        type: 'Corporate Order',
                        description: selectedProduct.name + (upsellSim ? ` + ${upsellSim.name}` : ''),
                        status: 'paid',
                        customerName: formData.name,
                        customerPhone: formData.phone
                    }}
                 />

                 <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-200 animate-in zoom-in duration-500 scale-110">
                     <CheckCircle2 className="w-12 h-12 text-white" />
                 </div>
                 <div>
                     <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">ORDER CONFIRMED!</h2>
                     <p className="text-slate-500 mt-2 text-xs font-bold uppercase tracking-widest">Verification Successful • Dispatching Shortly</p>
                     <div className="bg-blue-600 p-6 rounded-[2.5rem] mt-8 border-none text-left relative overflow-hidden shadow-2xl shadow-blue-100">
                         <Zap className="absolute -right-6 -top-6 w-24 h-24 text-white/10" />
                         <p className="font-black text-white text-sm flex items-center gap-2 uppercase tracking-tight">
                             <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                             Logistics Priority
                         </p>
                         <p className="text-[10px] text-blue-100 mt-2 font-bold uppercase tracking-wide">Our logistics hub will contact <strong>{formData.phone}</strong> to coordinate final delivery.</p>
                     </div>
                 </div>
                 
                 <div className="flex flex-col gap-3 pt-6">
                     <Button 
                        onClick={downloadReceipt}
                        className="bg-slate-900 text-white shadow-2xl shadow-slate-200 h-16 text-xl font-black rounded-[2rem] uppercase tracking-tighter"
                    >
                        <Download className="w-5 h-5 mr-3" /> Get Digital Receipt
                     </Button>
                     <Button variant="ghost" onClick={handleClose} className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Close Dashboard</Button>
                 </div>
             </div>
         )}
      </BottomSheet>
    </div>
  );
};