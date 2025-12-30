import React from 'react';
import { Home, ShoppingBag, Wifi, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface BottomTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({ activeTab, onChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'store', icon: ShoppingBag, label: 'Store' },
    { id: 'data', icon: Wifi, label: 'Data' },
    { id: 'track', icon: Activity, label: 'Track' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 pb-safe z-30">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 w-12 h-1 bg-slate-900 rounded-full"
                />
              )}
              <tab.icon
                className={cn(
                  "w-6 h-6 transition-colors duration-200",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};