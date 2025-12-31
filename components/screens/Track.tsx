
import React, { useState, useRef } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { Transaction } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { Search, Download, RefreshCw, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { SharedReceipt } from '../SharedReceipt';
import { toast } from '../../lib/toast';

export const Track: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Receipt Generation State
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  const handleTrack = async () => {
    if (phone.length < 10) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await api.trackTransactions(phone);
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (tx_ref: string, id: string) => {
      setRetryingId(id);
      toast.info("Verifying with payment gateway...");
      try {
          // 1. Verify Payment & Auto-Trigger Delivery if Paid
          const res = await api.verifyTransaction(tx_ref);
          
          // 2. Re-fetch current state
          const refreshRes = await api.trackTransactions(phone);
          if (refreshRes?.transactions) {
            setTransactions(refreshRes.transactions);
          }
          
          if (res.status === 'delivered') {
              toast.success("Transaction Complete: Item Delivered!");
          } else if (res.status === 'paid') {
              toast.success("Payment confirmed! Logistics team notified.");
          } else if (res.status === 'pending') {
              toast.error("Still awaiting payment transfer.");
          } else {
              toast.error("Status: " + res.status);
          }
      } catch (e) {
          toast.error("Sync failed. Check connection.");
      } finally {
          setRetryingId(null);
      }
  };

  const handleDownloadReceipt = async (tx: Transaction) => {
      setReceiptTx(tx);
      setTimeout(async () => {
          if (receiptRef.current) {
              try {
                  const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
                  const link = document.createElement('a');
                  link.download = `SAUKI-RECEIPT-${tx.tx_ref}.png`;
                  link.href = dataUrl;
                  link.click();
                  toast.success("Receipt downloaded");
              } catch (err) {
                  toast.error("Failed to generate receipt");
              }
              setReceiptTx(null);
          }
      }, 500);
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
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
      return 'Unknown Item';
  };

  return (
    <div className="p-6 pb-32 min-h-screen">
      <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Order Tracking</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Real-time gateway status verification</p>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-slate-100 border border-slate-100 mb-8">
        <div className="space-y-4">
            <Input 
                label="Tracking Number / Phone"
                className="h-14 rounded-2xl font-black tracking-tight text-lg"
                placeholder="080..." 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
            />
            <Button onClick={handleTrack} isLoading={isLoading} className="h-14 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
                <Search className="w-5 h-5 mr-3" />
                Locate Records
            </Button>
        </div>
      </div>

      {receiptTx && (
        <SharedReceipt 
            ref={receiptRef}
            transaction={{
                tx_ref: receiptTx.tx_ref,
                amount: receiptTx.amount,
                date: new Date(receiptTx.createdAt).toLocaleString(),
                type: receiptTx.type === 'ecommerce' ? 'Corporate Order' : 'Data Bundle',
                description: getTransactionDescription(receiptTx),
                status: receiptTx.status,
                customerPhone: receiptTx.phone,
                customerName: receiptTx.customerName
            }}
        />
      )}

      {hasSearched && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Gateway Records</h3>
            {transactions.length > 0 ? (
                <div className="space-y-4">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-50 relative overflow-hidden group">
                            {tx.status === 'delivered' && <CheckCircle2 className="absolute -right-4 -top-4 w-20 h-20 text-green-500/5 group-hover:rotate-12 transition-transform" />}
                            
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{tx.tx_ref}</p>
                                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                        {getTransactionDescription(tx)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{new Date(tx.createdAt).toLocaleString()}</div>
                                </div>
                                <span className={cn("text-[9px] uppercase font-black px-4 py-2 rounded-xl", getStatusColor(tx.status))}>
                                    {tx.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                <div className="text-xl font-black text-slate-900 tracking-tighter">{formatCurrency(tx.amount)}</div>
                                
                                <div className="flex gap-2">
                                    {tx.status !== 'delivered' && (
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleRetry(tx.tx_ref, tx.id)}
                                            disabled={retryingId === tx.id}
                                            className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200"
                                        >
                                            {retryingId === tx.id ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                            Sync Now
                                        </Button>
                                    )}

                                    {(tx.status === 'delivered' || (tx.type === 'ecommerce' && tx.status === 'paid')) && (
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => handleDownloadReceipt(tx)}
                                            className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-100"
                                        >
                                            <Download className="w-4 h-4 mr-2" /> Receipt
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No matching records found.</p>
                </div>
            )}
          </div>
      )}
    </div>
  );
};
