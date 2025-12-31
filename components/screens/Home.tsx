
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, Phone, Mail, Headphones, MessageCircle, Shield, Bell, Menu } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { LegalDocs } from './LegalDocs';
import { SideMenu } from '../SideMenu'; // Will be created

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
    <div className="flex flex-col h-full bg-white relative">
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      {/* Header - Compact */}
      <header className="flex justify-between items-center px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
             <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-slate-800 hover:bg-slate-50 rounded-full">
                 <Menu className="w-6 h-6" />
             </button>
             <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">SAUKI MART</h1>
                <p className="text-slate-400 text-[10px] font-medium tracking-wide">PREMIUM SERVICES</p>
             </div>
        </div>
        <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center p-1.5">
            <img src="/logo.png" alt="Sauki" className="w-full h-full object-contain" />
        </div>
      </header>

      <div className="flex-1 flex flex-col px-6 pb-24 overflow-y-auto no-scrollbar">
          
          {/* System Broadcast - Compact */}
          {systemMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 px-3 py-2 rounded-lg border flex items-center gap-2 shadow-sm text-xs ${
                    systemMessage.type === 'alert' ? 'bg-red-50 border-red-100 text-red-800' :
                    systemMessage.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                    'bg-blue-50 border-blue-100 text-blue-800'
                }`}
              >
                  <Bell className="w-3 h-3 shrink-0" />
                  <span className="font-medium truncate">{systemMessage.content}</span>
              </motion.div>
          )}

          {/* Action Grid - Adjusted heights to fit single screen */}
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            {/* Store Card - Full Width, taller */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('store')}
              className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-lg shadow-slate-200 cursor-pointer relative overflow-hidden group flex flex-col justify-end border border-white/10 min-h-[160px]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Smartphone size={100} />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 backdrop-blur-md border border-white/10">
                    <Smartphone className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-0.5">Buy Devices</h3>
                <p className="text-slate-400 text-xs">Gadgets & SIMs</p>
              </div>
            </motion.div>

            {/* Data Card - Half Width */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('data')}
              className="col-span-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-3xl p-5 shadow-lg shadow-blue-100 cursor-pointer relative overflow-hidden group flex flex-col justify-end min-h-[140px]"
            >
               <div className="absolute -top-4 -right-4 p-4 opacity-10">
                <Wifi size={80} />
              </div>
              <div className="relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-md border border-white/10">
                    <Wifi className="w-4 h-4 text-white" />
                 </div>
                <h3 className="text-base font-bold leading-tight">Instant<br/>Data</h3>
              </div>
            </motion.div>

            {/* Support Card - Half Width */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSupportOpen(true)}
              className="col-span-1 bg-white text-slate-900 rounded-3xl p-5 shadow-lg shadow-slate-100 border border-slate-100 cursor-pointer relative overflow-hidden group flex flex-col justify-end min-h-[140px]"
            >
               <div className="absolute -top-4 -right-4 p-4 opacity-5">
                <Headphones size={80} />
              </div>
              <div className="relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                    <Headphones className="w-4 h-4 text-slate-700" />
                 </div>
                <h3 className="text-base font-bold leading-tight">Contact &<br/>Legal</h3>
              </div>
            </motion.div>
          </div>

          {/* Trust Badges - Very compact */}
          <div className="pt-4 mt-auto">
            <div className="flex flex-col items-center gap-3">
                 <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold text-center">
                    Subsidiary of Sauki Data Links • SMEDAN Certified
                 </div>
                
                <div className="flex items-center justify-center gap-6 opacity-70">
                    <img src="/smedan.png" alt="SMEDAN" className="h-8 w-auto object-contain grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="w-px h-6 bg-slate-200"></div>
                    <img src="/coat.png" alt="Nigeria" className="h-8 w-auto object-contain grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
            </div>
          </div>
      </div>

      <BottomSheet isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} title="Support & Legal">
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
              <button 
                onClick={() => setActiveTab('contact')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'contact' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                  Contact Us
              </button>
              <button 
                onClick={() => setActiveTab('legal')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'legal' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                  Legal Documents
              </button>
          </div>

          {activeTab === 'contact' ? (
              <div className="space-y-4">
                  <div className="grid gap-2">
                      {/* Contact 1 */}
                      <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 justify-between">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <MessageCircle className="w-4 h-4" />
                              </div>
                              <div>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Customer Care 1</p>
                                  <p className="font-bold text-slate-900 text-sm">08061934056</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <a href="tel:+2348061934056" className="p-2 bg-white border rounded-full text-slate-700 hover:bg-slate-100"><Phone className="w-4 h-4" /></a>
                             <a href="https://wa.me/2348061934056" className="p-2 bg-green-500 border-green-600 border rounded-full text-white hover:bg-green-600"><MessageCircle className="w-4 h-4" /></a>
                          </div>
                      </div>

                      {/* Contact 2 */}
                      <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 justify-between">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <MessageCircle className="w-4 h-4" />
                              </div>
                              <div>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Customer Care 2</p>
                                  <p className="font-bold text-slate-900 text-sm">07044647081</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <a href="tel:+2347044647081" className="p-2 bg-white border rounded-full text-slate-700 hover:bg-slate-100"><Phone className="w-4 h-4" /></a>
                             <a href="https://wa.me/2347044647081" className="p-2 bg-green-500 border-green-600 border rounded-full text-white hover:bg-green-600"><MessageCircle className="w-4 h-4" /></a>
                          </div>
                      </div>

                      <a href="mailto:saukidatalinks@gmail.com" className="flex items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Email Support</p>
                                <p className="font-bold text-slate-900 text-sm">saukidatalinks@gmail.com</p>
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
