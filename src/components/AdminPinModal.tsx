import React, { useState } from 'react';
import { Lock, X, Check, ShieldAlert } from 'lucide-react';

interface AdminPinModalProps {
  onSavePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ onSavePin, onClose }) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (newPin.length < 4) {
      setMsg({ type: 'error', text: 'নতুন পিন কমপক্ষে ৪ ডিজিটের হতে হবে!' });
      return;
    }

    if (newPin !== confirmPin) {
      setMsg({ type: 'error', text: 'নতুন পিন ও কনফার্ম পিন মিলছে না!' });
      return;
    }

    setLoading(true);
    try {
      const res = await onSavePin(oldPin, newPin);
      if (res.success) {
        setMsg({ type: 'success', text: 'এডমিন পিন সফলভাবে পরিবর্তন করা হয়েছে!' });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMsg({ type: 'error', text: res.message || 'পিন পরিবর্তন করা যায়নি' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'পিন পরিবর্তন করতে সমস্যা হয়েছে' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-300" />
            <h3 className="font-bold text-sm sm:text-base">এডমিন সিকিউরিটি পিন পরিবর্তন</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-full hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              বর্তমান এডমিন পিন (Old PIN) *
            </label>
            <input
              type="password"
              required
              placeholder="বর্তমান পিন কোড"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              নতুন পিন কোড (New PIN) *
            </label>
            <input
              type="password"
              maxLength={8}
              required
              placeholder="নতুন ৪ ডিজিটের পিন"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              নতুন পিন পুনরায় লিখুন (Confirm PIN) *
            </label>
            <input
              type="password"
              maxLength={8}
              required
              placeholder="কনফার্ম পিন কোড"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 tracking-wider"
            />
          </div>

          {msg && (
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold ${
                msg.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow transition disabled:opacity-60 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'পরিবর্তন হচ্ছে...' : 'সেভ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
