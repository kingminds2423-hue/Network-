import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  X, 
  Share2, 
  PlusSquare, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      await install();
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with App Branding */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-emerald-400 shrink-0 flex items-center justify-center">
              <img
                src="/apple-touch-icon.png"
                alt="DIP BHOLA NETWORK"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/30 text-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                  অফিসিয়াল মোবাইল অ্যাপ
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-0.5">DIP BHOLA NETWORK</h3>
              <p className="text-xs text-emerald-200 font-medium">হিসাব খাতা ও স্টাফ ব্যবস্থাপনা সফটওয়্যার</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">

          {/* Already installed status badge */}
          {isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">অ্যাপটি ইতোমধ্যেই ফোনে ইনস্টল করা আছে!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  আপনি আপনার ফোনের হোম স্ক্রিন থেকে সরাসরি হিসাব খাতা ওপেন করতে পারেন।
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Direct One-Click Install Button if supported by browser */}
              {isInstallable && (
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-center space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>এক ক্লিকে সরাসরি ইনস্টল করুন</span>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-5 h-5" />
                    <span>{installing ? 'ইনস্টল হচ্ছে...' : 'ফোনে অ্যাপ ইনস্টল করুন'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500">
                    কোনো Play Store বা অতিরিক্ত স্পেস লাগবে না, সরাসরি হোম স্ক্রিনে যুক্ত হবে।
                  </p>
                </div>
              )}

              {/* Instructions for Android Users */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>অ্যান্ড্রয়েড ফোনে যেভাবে ডাউনলোড / ইনস্টল করবেন:</span>
                </div>
                <div className="text-xs text-slate-700 space-y-2 pl-6 list-decimal">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">১</span>
                    <span>আপনার ফোনের <strong>Chrome</strong> ব্রাউজারে এই লিঙ্কটি ওপেন করুন।</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">২</span>
                    <span>উপরে ডানপাশে থাকা <strong>৩-ডট (⋮) মেনুতে</strong> ট্যাপ করুন।</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">৩</span>
                    <span>তালিকা থেকে <strong>"Install app"</strong> বা <strong>"Add to Home screen"</strong> (হোম স্ক্রিনে যোগ করুন) চাপুন।</span>
                  </div>
                </div>
              </div>

              {/* Instructions for iPhone / iOS Safari Users */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Share2 className="w-4 h-4 text-emerald-700" />
                  <span>আইফোন (iPhone / iPad Safari) এর জন্য:</span>
                </div>
                <div className="text-xs text-slate-700 space-y-2 pl-6">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">১</span>
                    <span>Safari ব্রাউজারের নিচে থাকা <strong>Share (শেয়ার) আইকনটিতে</strong> ট্যাপ করুন।</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">২</span>
                    <span>মেনু কিছুটা নিচে নামিয়ে <strong>"Add to Home Screen"</strong> (হোম স্ক্রিনে যোগ করুন) চাপুন।</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Share / Copy App Link Section */}
          <div className="border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 bg-white">
            <div className="truncate text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">মোবাইলে পাঠানোর লিঙ্ক:</span>
              <span className="text-slate-800 font-mono font-medium truncate block">{window.location.origin}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>লিঙ্ক কপি</span>
                </>
              )}
            </button>
          </div>

          {/* App Advantages */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Zap className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-800 block">সরাসরি চালু</span>
              <span className="text-[10px] text-slate-500">কোনো ব্রাউজার বার নেই</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Smartphone className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-800 block">হোম স্ক্রিন</span>
              <span className="text-[10px] text-slate-500">অ্যাপ আইকন হিসেবে থাকবে</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-800 block">ডাটা নিরাপদ</span>
              <span className="text-[10px] text-slate-500">রিমোট ক্লাউড সিঙ্ক</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 text-center text-xs text-slate-500">
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
