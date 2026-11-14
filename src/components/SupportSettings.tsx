import React, { useState } from 'react';
import { HelpCircle, Star, ShieldCheck, FileText, Smartphone, Trash2, ExternalLink } from 'lucide-react';
import { DeleteAccount } from './DeleteAccount';

export function SupportSettings() {
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  return (
    <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10 space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About & Support</h3>
      
      <div className="space-y-1">
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Help Center</span>
          </div>
          <ExternalLink className="h-4 w-4 text-slate-400" />
        </button>
        
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Rate Application</span>
          </div>
          <ExternalLink className="h-4 w-4 text-slate-400" />
        </button>

        <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Terms of Service</span>
          </div>
          <ExternalLink className="h-4 w-4 text-slate-400" />
        </a>

        <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Privacy Policy</span>
          </div>
          <ExternalLink className="h-4 w-4 text-slate-400" />
        </a>

        <button 
          onClick={() => setShowDeleteAccount(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-red-500/20"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-600 dark:text-red-400">Delete Account</span>
          </div>
        </button>
        
        <div className="flex items-center justify-between p-3 mt-4 opacity-50">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">App Version</span>
          </div>
          <span className="text-sm font-mono text-slate-500">v1.0.0</span>
        </div>
      </div>

      {showDeleteAccount && (
        <DeleteAccount 
          onClose={() => setShowDeleteAccount(false)}
          onDeleted={() => setShowDeleteAccount(false)}
        />
      )}
    </div>
  );
}