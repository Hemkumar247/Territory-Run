import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from './FirebaseProvider';
import { Save, Loader2 } from 'lucide-react';

export function ProfileSettings() {
  const { authUser, userProfile } = useFirebase();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [territoryColor, setTerritoryColor] = useState(userProfile?.territoryColor || '#3b82f6');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    if (!authUser) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateDoc(doc(db, 'users', authUser.uid), {
        displayName: displayName.trim() || 'Runner',
        territoryColor: territoryColor
      });
      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const colors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
  ];

  return (
    <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10 space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Profile Settings</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Public Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your runner name"
          maxLength={20}
          className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This name will be shown to other users on the map.
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Territory Color
        </label>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setTerritoryColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${territoryColor === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-[#050505] ring-teal-500' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
        {saveMessage && (
          <p className={`text-sm text-center mt-2 ${saveMessage.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
}
