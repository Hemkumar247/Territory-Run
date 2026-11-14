import React, { useState } from 'react';
import { AlertTriangle, Trash2, Download, X, CheckCircle2 } from 'lucide-react';
import { deleteAccount, exportUserData } from '../services/accountService';
import { useFirebase } from './FirebaseProvider';

interface DeleteAccountProps {
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteAccount({ onClose, onDeleted }: DeleteAccountProps) {
  const { authUser } = useFirebase();
  const hasPassword = !!authUser?.providerData.some((p) => p.providerId === 'password');
  const [step, setStep] = useState<'confirm' | 'password' | 'deleting' | 'success' | 'export'>('confirm');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    const data = await exportUserData();
    if (data) {
      setExportData(data);
      setStep('export');
    } else {
      setError('Failed to export data');
    }
    setLoading(false);
  };

  const handleConfirmDelete = () => {
    setStep('password');
    setError(null);
  };

  const handleDelete = async () => {
    if (hasPassword && !password) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    setError(null);
    
    const result = await deleteAccount(hasPassword ? password : undefined);
    if (result.success) {
      setStep('success');
      setTimeout(() => {
        onDeleted();
        onClose();
        window.location.reload();
      }, 2000);
    } else {
      setError(result.error || 'Failed to delete account');
      setLoading(false);
    }
  };

  const downloadExport = () => {
    if (!exportData) return;
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `territory-run-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'export') {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md glass-panel bg-white/95 dark:bg-[#0D1117]/95 p-8 rounded-3xl border border-black/10 dark:border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Data Exported</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Your data is ready to download</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={downloadExport}
              disabled={loading}
              className="w-full bg-emerald-500 text-white px-6 py-4 rounded-2xl font-bold uppercase tracking-wider hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Preparing...' : 'Download JSON File'}
            </button>
            <button
              onClick={() => { setStep('confirm'); setExportData(null); }}
              className="w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md glass-panel bg-white/95 dark:bg-[#0D1117]/95 p-8 rounded-3xl border border-black/10 dark:border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Account Deleted</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Your account and all data have been permanently removed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel bg-white/95 dark:bg-[#0D1117]/95 p-8 rounded-3xl border border-black/10 dark:border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 'confirm' && (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Delete Account</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                This will permanently delete your account and all data:
              </p>
            </div>

            <ul className="space-y-3 mb-6 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> Profile & settings</li>
              <li className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> All run history & trails</li>
              <li className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> Territories & achievements</li>
              <li className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> Streaks & leaderboard position</li>
              <li className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> Friends & social data</li>
            </ul>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This action cannot be undone
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 glass-panel bg-white/90 dark:bg-black/40 px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-black/60 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium text-slate-900 dark:text-white">Export My Data First</span>
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="w-full bg-red-500 text-white px-6 py-4 rounded-2xl font-bold uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                Delete My Account
              </button>
            </div>
          </>
        )}

        {step === 'password' && (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Confirm Deletion</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {hasPassword ? 'Enter your password to confirm' : 'You will be asked to confirm with Google'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {hasPassword && <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDelete()}
                  placeholder="Password"
                  className="w-full px-4 py-4 pr-12 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 text-slate-900 dark:text-white placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  autoFocus
                />
              </div>}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('confirm'); setError(null); }}
                  className="flex-1 glass-panel bg-white/90 dark:bg-black/40 px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-black/60 transition-colors font-medium text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || (hasPassword && !password)}
                  className="flex-1 bg-red-500 text-white px-6 py-4 rounded-2xl font-bold uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  {loading ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}