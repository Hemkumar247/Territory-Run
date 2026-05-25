import React from 'react';
import { HelpCircle, Star, ShieldCheck, FileText, Smartphone } from 'lucide-react';

export function SupportSettings() {
  return (
    <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10 space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About & Support</h3>
      
      <div className="space-y-1">
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Help Center</span>
          </div>
        </button>
        
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Rate Application</span>
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Terms of Service</span>
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Privacy Policy</span>
          </div>
        </button>
        
        <div className="flex items-center justify-between p-3 mt-4 opacity-50">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">App Version</span>
          </div>
          <span className="text-sm font-mono text-slate-500">v1.2.4 (Build 402)</span>
        </div>
      </div>
    </div>
  );
}
