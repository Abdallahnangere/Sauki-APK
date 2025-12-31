
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Moon, Info, ShieldCheck, LogOut } from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
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
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 mb-4">
                  <img src="/logo.png" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-black tracking-tight">SAUKI MART</h2>
              <p className="text-white/60 text-xs">v1.0.0 • Premium Services</p>
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-6 space-y-2 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">App Settings</h3>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 mb-2">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-slate-600" />
                            <span className="text-sm font-medium text-slate-900">Notifications</span>
                        </div>
                        {/* Mock Toggle */}
                        <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 opacity-50 pointer-events-none">
                        <div className="flex items-center gap-3">
                            <Moon className="w-5 h-5 text-slate-600" />
                            <span className="text-sm font-medium text-slate-900">Dark Mode</span>
                        </div>
                         <div className="w-10 h-6 bg-slate-300 rounded-full relative">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">About</h3>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left">
                        <Info className="w-5 h-5 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">About Sauki Mart</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left">
                        <ShieldCheck className="w-5 h-5 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">Privacy Policy</span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 text-xs justify-center">
                    <span>Powered by Sauki Data Links</span>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
