import React, { forwardRef } from 'react';
import { formatCurrency } from '../lib/utils';

interface ReceiptProps {
  transaction: {
    tx_ref: string;
    amount: number;
    date: string;
    type: string;
    description: string;
    status: string;
    customerName?: string;
    customerPhone: string;
    deliveryAddress?: string;
  };
}

export const SharedReceipt = forwardRef<HTMLDivElement, ReceiptProps>(({ transaction }, ref) => {
  return (
    // Rendered off-screen but available for high-res capture
    <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -100, width: '500px' }}>
      <div 
        ref={ref} 
        className="w-[500px] bg-white p-12 font-sans text-slate-900 relative border border-slate-100 shadow-none"
        style={{ fontFamily: "'Inter', sans-serif", minHeight: '700px' }}
      >
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-slate-900"></div>

        {/* Header */}
        <div className="flex justify-between items-start mb-10 mt-4">
          <div>
            <img src="/logo.png" alt="Sauki Mart" className="h-24 w-auto object-contain mb-3" crossOrigin="anonymous" />
            <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-500">Official Receipt</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900">SAUKI MART</h2>
            <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-black">Premium Services Hub</p>
            <p className="text-[10px] text-slate-400 mt-1">SMEDAN Certified SME</p>
          </div>
        </div>

        <div className="border-t border-b-2 border-slate-100 py-8 mb-8">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-1">Total Payment</p>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(transaction.amount)}</p>
                </div>
                <div className="text-right">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-100 border-none">
                        {transaction.status === 'delivered' ? 'SUCCESSFUL' : transaction.status.toUpperCase()}
                    </div>
                </div>
            </div>
        </div>

        {/* Details Grid - Using flex-col for responsiveness to text length */}
        <div className="space-y-5 mb-12">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-slate-400 text-[11px] font-black uppercase tracking-wider">Tracking ID</span>
                <span className="text-slate-900 text-sm font-black font-mono">{transaction.customerPhone}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-slate-400 text-[11px] font-black uppercase tracking-wider">Date Issued</span>
                <span className="text-slate-900 text-sm font-black uppercase">{transaction.date}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-slate-400 text-[11px] font-black uppercase tracking-wider">Service Category</span>
                <span className="text-slate-900 text-sm font-black uppercase tracking-tight">{transaction.type}</span>
            </div>
            
            {/* Extended Item Details - Handles long text */}
             <div className="flex flex-col gap-2 pb-3 border-b border-slate-50">
                <span className="text-slate-400 text-[11px] font-black uppercase tracking-wider">Order Manifest</span>
                <span className="text-slate-900 text-sm font-black uppercase leading-relaxed break-words">
                    {transaction.description}
                </span>
            </div>

            {transaction.customerName && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                    <span className="text-slate-400 text-[11px] font-black uppercase tracking-wider">Customer Name</span>
                    <span className="text-slate-900 text-sm font-black uppercase">{transaction.customerName}</span>
                </div>
            )}

            {transaction.deliveryAddress && (
                <div className="flex flex-col gap-2 pb-3 border-b border-slate-50">
                    <span className="text-slate-400 text-[11px] font-black uppercase tracking-wider">Delivery Logistics</span>
                    <span className="text-slate-900 text-xs font-black uppercase leading-relaxed break-words italic">
                        {transaction.deliveryAddress}
                    </span>
                </div>
            )}

            <div className="flex justify-between items-center pb-3">
                <span className="text-slate-400 text-[11px] font-black uppercase tracking-wider">Transaction Ref</span>
                <span className="text-slate-500 text-[10px] font-mono break-all text-right max-w-[250px]">{transaction.tx_ref}</span>
            </div>
        </div>

        {/* Footer with Updated Contact Numbers */}
        <div className="bg-slate-900 p-8 rounded-[2rem] text-center space-y-4">
            <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">Customer Support Hub</p>
            <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center gap-6 text-sm font-black text-white tracking-tighter">
                    <span>0806 193 4056</span>
                    <span className="text-white/20">|</span>
                    <span>0704 464 7081</span>
                </div>
                <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">saukidatalinks@gmail.com</p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5">
                <p className="text-[10px] text-white/30 leading-relaxed font-medium">
                    Thank you for choosing Nigeria's most reliable premium data mart.<br/>
                    Subsidiary of Sauki Data Links.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
});

SharedReceipt.displayName = 'SharedReceipt';