import React, { forwardRef } from 'react';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../types';

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
  };
}

export const SharedReceipt = forwardRef<HTMLDivElement, ReceiptProps>(({ transaction }, ref) => {
  return (
    <div className="fixed -left-[9999px]">
      <div 
        ref={ref} 
        className="w-[450px] bg-white p-10 font-sans text-slate-900 relative overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900"></div>

        {/* Header */}
        <div className="flex justify-between items-start mb-8 mt-2">
          <div>
            <img src="/logo.png" alt="Sauki Mart" className="h-20 w-auto object-contain mb-2" />
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-500">Official Receipt</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">SAUKI MART</h2>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-medium">Premium Services</p>
            <p className="text-[10px] text-slate-400 mt-0.5">SMEDAN Certified</p>
          </div>
        </div>

        <div className="border-t border-b border-slate-100 py-6 mb-8">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1">Total Amount</p>
                    <p className="text-4xl font-black text-slate-900">{formatCurrency(transaction.amount)}</p>
                </div>
                <div className="text-right">
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-green-100 inline-block">
                        {transaction.status === 'delivered' ? 'Successful' : transaction.status}
                    </div>
                </div>
            </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm font-medium">Tracking ID</span>
                <span className="text-slate-900 text-sm font-bold font-mono">{transaction.customerPhone}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm font-medium">Date Issued</span>
                <span className="text-slate-900 text-sm font-semibold">{transaction.date}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm font-medium">Service Type</span>
                <span className="text-slate-900 text-sm font-semibold capitalize">{transaction.type}</span>
            </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm font-medium">Item Details</span>
                <span className="text-slate-900 text-sm font-semibold text-right max-w-[200px] truncate">{transaction.description}</span>
            </div>
            {transaction.customerName && (
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-slate-500 text-sm font-medium">Customer</span>
                    <span className="text-slate-900 text-sm font-semibold capitalize">{transaction.customerName}</span>
                </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm font-medium">Payment Ref</span>
                <span className="text-slate-400 text-xs font-mono">{transaction.tx_ref}</span>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 rounded-xl text-center space-y-2">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Support & Inquiries</p>
            <div className="flex justify-center gap-4 text-xs font-bold text-slate-800">
                <span>09024099561</span>
                <span className="text-slate-300">•</span>
                <span>09076872520</span>
                <span className="text-slate-300">•</span>
                <span>saukidatalinks@gmail.com</span>
            </div>
            <p className="text-[9px] text-slate-400 pt-2">
                Thank you for choosing Sauki Mart. Subsidiary of Sauki Data Links.
            </p>
        </div>
      </div>
    </div>
  );
});

SharedReceipt.displayName = 'SharedReceipt';