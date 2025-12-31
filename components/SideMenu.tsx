import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Moon, Sun, Info, ShieldCheck, CheckCircle } from 'lucide-react';
import { toast } from '../lib/toast';
import { cn } from '../lib/utils';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal?: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onOpenLegal }) => {
  const [notifications, setNotifications] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Sync dark mode with document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [isDarkMode]);

  const toggleNotifications = () => {
    setNotifications(!notifications);
    toast.info(notifications ? "Notifications silenced" : "Notifications enabled");
  };

  const handleLegalClick = () => {
    if (onOpenLegal) {
        onOpenLegal();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-md"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-slate-900 z-[70] shadow-2xl flex flex-col rounded-r-[3rem] overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 bg-slate-900 text-white relative">
              <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2.5 mb-6 shadow-xl shadow-black/20">
                  <img src="/logo.png" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-black tracking-tight uppercase">SAUKI MART</h2>
              <div className="flex items-center gap-2 mt-1">
                 <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">v2.5.0 Premium Edition</p>
                 <span className="w-1 h-1 rounded-full bg-white/20"></span>
                 <p className="text-green-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    Certified <CheckCircle className="w-2.5 h-2.5" />
                 </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar">
                <div>
                    <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-5">Personalization</h3>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={toggleNotifications}
                            className="w-full flex items-center justify-between p-4 rounded-[1.75rem] bg-slate-50 dark:bg-slate-800 transition-all active:scale-95 border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-inner", notifications ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400")}>
                                    <Bell className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Broadcasts</span>
                            </div>
                            <div className={cn("w-12 h-6 rounded-full relative transition-colors", notifications ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600")}>
                                <motion.div 
                                    animate={{ x: notifications ? 24 : 4 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                                />
                            </div>
                        </button>

                        <button 
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="w-full flex items-center justify-between p-4 rounded-[1.75rem] bg-slate-50 dark:bg-slate-800 transition-all active:scale-95 border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-inner", isDarkMode ? "bg-indigo-600 text-white" : "bg-orange-400 text-white")}>
                                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{isDarkMode ? 'Night Mode' : 'Day Mode'}</span>
                            </div>
                            <div className={cn("w-12 h-6 rounded-full relative transition-colors", isDarkMode ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600")}>
                                <motion.div 
                                    animate={{ x: isDarkMode ? 24 : 4 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                                />
                            </div>
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-5">Enterprise</h3>
                    <div className="space-y-2">
                        <button onClick={handleLegalClick} className="w-full flex items-center gap-4 p-4 rounded-[1.75rem] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors shadow-sm">
                                <Info className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight block">Corporate Profile</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Our Vision & Mission</span>
                            </div>
                        </button>
                        <button onClick={handleLegalClick} className="w-full flex items-center gap-4 p-4 rounded-[1.75rem] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors shadow-sm">
                                <ShieldCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight block">Privacy & Security</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">NDPA Compliance</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Sauki Data Links</p>
                    <div className="flex gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
                        <img src="/smedan.png" className="h-7 w-auto grayscale" />
                        <img src="/coat.png" className="h-7 w-auto grayscale" />
                    </div>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};