import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, Phone, Mail, Headphones, MessageCircle, Shield, Bell, Menu, CheckCircle } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { LegalDocs } from './LegalDocs';
import { SideMenu } from '../SideMenu';

interface HomeProps {
  onNavigate: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'contact' | 'legal'>('contact');
  const [systemMessage, setSystemMessage] = useState<{ content: string; type: string } | null>(null);

  useEffect(() => {
    fetch('/api/system/message')
      .then(res => res.json())
      .then(data => {
         if(data && data.content) setSystemMessage(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onOpenLegal={() => { setIsMenuOpen(false); setIsSupportOpen(true); setActiveTab('legal'); }} />
      
      {/* Header Section */}
      <header className="flex justify-between items-center px-6 pt-6 pb-2">
        <div className="flex items-center gap-4">
             <button onClick={() => setIsMenuOpen(true)} className="p-3 -ml-2 text-slate-800 hover:bg-slate-50 rounded-full transition-colors">
                 <Menu className="w-8 h-8" />
             </button>
             <div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none uppercase">SAUKI MART</h1>
                <div className="flex flex-col mt-1.5">
                   <p className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">Premium Services Hub</p>
                   <p className="text-green-600 text-[11px] font-black flex items-center gap-1.5 mt-0.5">
                     Government Certified by SMEDAN <CheckCircle className="w-3.5 h-3.5 fill-green-600 text-white" />
                   </p>
                </div>
             </div>
        </div>
        <div className="w-16 h-16 bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-50 flex items-center justify-center p-2.5 transition-all hover:scale-105 active:scale-95">
            <img src="/logo.png" alt="Sauki" className="w-full h-full object-contain" />
        </div>
      </header>

      <div className="flex-1 flex flex-col px-6 justify-between pt-2 pb-6">
          <div className="space-y-4">
            {/* System Broadcast - Marquee Animation */}
            {systemMessage && (
                <div className={`overflow-hidden rounded-2xl border h-10 flex items-center shadow-sm ${
                    systemMessage.type === 'alert' ? 'bg-red-50 border-red-100 text-red-800' :
                    systemMessage.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                    'bg-blue-50 border-blue-100 text-blue-800'
                }`}>
                    <div className="px-3 bg-inherit z-10 shrink-0 border-r border-current/10 h-full flex items-center">
                        <Bell className="w-4 h-4" />
                    </div>
                    <motion.div 
                        initial={{ x: "100%" }}
                        animate={{ x: "-100%" }}
                        transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                        className="whitespace-nowrap font-black uppercase text-[10px] tracking-tight pl-4"
                    >
                        {systemMessage.content} • {systemMessage.content} • {systemMessage.content}
                    </motion.div>
                </div>
            )}

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('store')}
                className="col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white rounded-[2.75rem] p-7 shadow-2xl shadow-slate-300 cursor-pointer relative overflow-hidden group border border-white/10 min-h-[160px] flex flex-col justify-end"
              >
                <div className="absolute -top-6 -right-6 p-4 opacity-15 group-hover:opacity-25 transition-all duration-700 transform group-hover:scale-110 group-hover:-rotate-12">
                  <Smartphone size={150} />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-2xl border border-white/10 shadow-inner">
                      <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-1.5 tracking-tighter uppercase">Gadget Store</h3>
                  <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Premium Tech & Data Packages</p>
                </div>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('data')}
                className="col-span-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-[2.5rem] p-6 shadow-2xl shadow-blue-100 cursor-pointer relative overflow-hidden group min-h-[145px] flex flex-col justify-end"
              >
                 <div className="absolute -top-4 -right-4 p-4 opacity-15 group-hover:opacity-25 transition-all transform group-hover:scale-110">
                  <Wifi size={100} />
                </div>
                <div className="relative z-10">
                   <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                      <Wifi className="w-5 h-5 text-white" />
                   </div>
                  <h3 className="text-xl font-black leading-none tracking-tighter uppercase">Instant<br/>Data</h3>
                </div>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsSupportOpen(true)}
                className="col-span-1 bg-slate-50 text-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-100 border border-slate-100 cursor-pointer relative overflow-hidden group min-h-[145px] flex flex-col justify-end"
              >
                 <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-all transform group-hover:scale-110">
                  <Headphones size={100} />
                </div>
                <div className="relative z-10">
                   <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                      <Headphones className="w-5 h-5 text-slate-800" />
                   </div>
                  <h3 className="text-xl font-black leading-none tracking-tighter uppercase text-slate-900">Support<br/>& Legal</h3>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Elevated Trust Footer - Centered perfectly between cards and sheet */}
          <div className="flex-1 flex flex-col justify-center items-center py-2">
            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-center gap-12">
                    <img src="/smedan.png" alt="SMEDAN" className="h-10 w-auto object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                    <img src="/coat.png" alt="Nigeria" className="h-10 w-auto object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                </div>
                 <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black text-center opacity-80 leading-relaxed">
                    Subsidiary of Sauki Data Links<br/>SMEDAN Certified SME
                 </div>
            </div>
          </div>
      </div>

      <BottomSheet isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} title="Corporate Concierge">
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
              <button 
                onClick={() => setActiveTab('contact')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'contact' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-500'}`}
              >
                  Contact Hub
              </button>
              <button 
                onClick={() => setActiveTab('legal')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'legal' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-500'}`}
              >
                  Legal Portal
              </button>
          </div>

          {activeTab === 'contact' ? (
              <div className="space-y-4">
                  <div className="grid gap-3">
                      <div className="flex items-center p-5 rounded-[2rem] bg-slate-50 border border-slate-100 justify-between shadow-sm group">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                                  <MessageCircle className="w-6 h-6" />
                              </div>
                              <div>
                                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Help Desk I</p>
                                  <p className="font-black text-slate-900 text-xl tracking-tighter">08061934056</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <a href="tel:+2348061934056" className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 transition-all"><Phone className="w-5 h-5" /></a>
                             <a href="https://wa.me/2348061934056" className="w-12 h-12 flex items-center justify-center bg-green-500 border-green-600 border rounded-full text-white hover:bg-green-600 shadow-2xl shadow-green-100 transition-all"><MessageCircle className="w-5 h-5" /></a>
                          </div>
                      </div>

                      <div className="flex items-center p-5 rounded-[2rem] bg-slate-50 border border-slate-100 justify-between shadow-sm group">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                                  <MessageCircle className="w-6 h-6" />
                              </div>
                              <div>
                                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Help Desk II</p>
                                  <p className="font-black text-slate-900 text-xl tracking-tighter">07044647081</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <a href="tel:+2347044647081" className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 transition-all"><Phone className="w-5 h-5" /></a>
                             <a href="https://wa.me/2347044647081" className="w-12 h-12 flex items-center justify-center bg-green-500 border-green-600 border rounded-full text-white hover:bg-green-600 shadow-2xl shadow-green-100 transition-all"><MessageCircle className="w-5 h-5" /></a>
                          </div>
                      </div>

                      <a href="mailto:saukidatalinks@gmail.com" className="flex items-center p-6 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100 justify-between shadow-sm group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner group-hover:rotate-6 transition-transform">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Corporate Email</p>
                                <p className="font-black text-slate-900 text-sm tracking-tight uppercase">saukidatalinks@gmail.com</p>
                            </div>
                          </div>
                      </a>
                  </div>
              </div>
          ) : (
              <LegalDocs />
          )}
      </BottomSheet>
    </div>
  );
};