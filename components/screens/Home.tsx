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
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onOpenLegal={() => { setIsMenuOpen(false); setIsSupportOpen(true); setActiveTab('legal'); }} />
      
      {/* Header - Compact & Certified */}
      <header className="flex justify-between items-center px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
             <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-slate-800 hover:bg-slate-50 rounded-full">
                 <Menu className="w-6 h-6" />
             </button>
             <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">SAUKI MART</h1>
                <div className="flex items-center gap-1 mt-1">
                   <p className="text-slate-500 text-[9px] font-bold tracking-tight">PREMIUM SERVICES</p>
                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   <p className="text-green-600 text-[9px] font-bold flex items-center gap-0.5">
                     Govt Certified by SMEDAN <CheckCircle className="w-2.5 h-2.5 fill-green-600 text-white" />
                   </p>
                </div>
             </div>
        </div>
        <div className="w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center p-1.5 transition-transform hover:scale-105">
            <img src="/logo.png" alt="Sauki" className="w-full h-full object-contain" />
        </div>
      </header>

      <div className="flex-1 flex flex-col px-6 pb-20 overflow-y-auto no-scrollbar justify-between">
          
          <div className="space-y-3 pt-2">
            {/* System Broadcast - Compact */}
            {systemMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-3 py-2.5 rounded-xl border flex items-center gap-3 shadow-sm text-xs ${
                      systemMessage.type === 'alert' ? 'bg-red-50 border-red-100 text-red-800' :
                      systemMessage.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                      'bg-blue-50 border-blue-100 text-blue-800'
                  }`}
                >
                    <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center shrink-0">
                      <Bell className="w-3 h-3" />
                    </div>
                    <span className="font-semibold truncate leading-tight">{systemMessage.content}</span>
                </motion.div>
            )}

            {/* Action Grid - Adjusted heights to fit single screen */}
            <div className="grid grid-cols-2 gap-3">
              {/* Store Card - Full Width */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('store')}
                className="col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white rounded-[2rem] p-6 shadow-xl shadow-slate-200 cursor-pointer relative overflow-hidden group border border-white/5 min-h-[180px] flex flex-col justify-end"
              >
                <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-all duration-500 transform group-hover:scale-110 group-hover:-rotate-12">
                  <Smartphone size={140} />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-xl border border-white/10 shadow-inner">
                      <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-1 tracking-tight">Buy Devices</h3>
                  <p className="text-slate-400 text-xs font-medium">Premium Gadgets & Data SIMs</p>
                </div>
              </motion.div>

              {/* Data Card */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('data')}
                className="col-span-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-[2rem] p-5 shadow-lg shadow-blue-100 cursor-pointer relative overflow-hidden group min-h-[150px] flex flex-col justify-end"
              >
                 <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-all transform group-hover:scale-110">
                  <Wifi size={100} />
                </div>
                <div className="relative z-10">
                   <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                      <Wifi className="w-5 h-5 text-white" />
                   </div>
                  <h3 className="text-lg font-black leading-tight tracking-tight">Instant<br/>Data</h3>
                </div>
              </motion.div>

              {/* Support Card */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSupportOpen(true)}
                className="col-span-1 bg-white text-slate-900 rounded-[2rem] p-5 shadow-lg shadow-slate-100 border border-slate-100 cursor-pointer relative overflow-hidden group min-h-[150px] flex flex-col justify-end"
              >
                 <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-all transform group-hover:scale-110">
                  <Headphones size={100} />
                </div>
                <div className="relative z-10">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                      <Headphones className="w-5 h-5 text-slate-700" />
                   </div>
                  <h3 className="text-lg font-black leading-tight tracking-tight">Contact &<br/>Legal</h3>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Trust Badges - Very compact */}
          <div className="pt-6">
            <div className="flex flex-col items-center gap-4">
                 <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black text-center opacity-80">
                    Subsidiary of Sauki Data Links • SMEDAN Certified
                 </div>
                
                <div className="flex items-center justify-center gap-8">
                    <img src="/smedan.png" alt="SMEDAN" className="h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="w-px h-8 bg-slate-100"></div>
                    <img src="/coat.png" alt="Nigeria" className="h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="w-px h-8 bg-slate-100"></div>
                    <img src="/logo.png" alt="Sauki" className="h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
            </div>
          </div>
      </div>

      <BottomSheet isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} title="Support & Legal">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button 
                onClick={() => setActiveTab('contact')}
                className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === 'contact' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                  Contact Us
              </button>
              <button 
                onClick={() => setActiveTab('legal')}
                className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === 'legal' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                  Legal Documents
              </button>
          </div>

          {activeTab === 'contact' ? (
              <div className="space-y-4">
                  <div className="grid gap-3">
                      {/* Contact 1 */}
                      <div className="flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                                  <MessageCircle className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Customer Care 1</p>
                                  <p className="font-black text-slate-900 text-base">08061934056</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <a href="tel:+2348061934056" className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 transition-all"><Phone className="w-4 h-4" /></a>
                             <a href="https://wa.me/2348061934056" className="w-10 h-10 flex items-center justify-center bg-green-500 border-green-600 border rounded-full text-white hover:bg-green-600 shadow-md shadow-green-100 transition-all"><MessageCircle className="w-4 h-4" /></a>
                          </div>
                      </div>

                      {/* Contact 2 */}
                      <div className="flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                                  <MessageCircle className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Customer Care 2</p>
                                  <p className="font-black text-slate-900 text-base">07044647081</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <a href="tel:+2347044647081" className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 transition-all"><Phone className="w-4 h-4" /></a>
                             <a href="https://wa.me/2347044647081" className="w-10 h-10 flex items-center justify-center bg-green-500 border-green-600 border rounded-full text-white hover:bg-green-600 shadow-md shadow-green-100 transition-all"><MessageCircle className="w-4 h-4" /></a>
                          </div>
                      </div>

                      <a href="mailto:saukidatalinks@gmail.com" className="flex items-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100 justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Email Support</p>
                                <p className="font-black text-slate-900 text-sm">saukidatalinks@gmail.com</p>
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