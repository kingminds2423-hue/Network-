import React, { useState } from 'react';
import { 
  Smartphone, 
  X, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { CompanyInfo } from '../types.ts';

interface StaffInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyInfo;
}

export function getLiveAppUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://ais-pre-mnwc6q2mcpbydzdum2n77c-383821225111.asia-northeast1.run.app';
  }
  const host = window.location.hostname;
  if (host.includes('ais-dev-') || host.includes('aistudio.google.com') || host.includes('localhost')) {
    return 'https://ais-pre-mnwc6q2mcpbydzdum2n77c-383821225111.asia-northeast1.run.app';
  }
  return window.location.origin;
}

export const StaffInviteModal: React.FC<StaffInviteModalProps> = ({ isOpen, onClose, company }) => {
  const [copied, setCopied] = useState(false);
  const liveUrl = getLiveAppUrl();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(liveUrl)}`;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `স্বাগতম! ${company.name || 'DIP BHOLA NETWORK'} এর অফিসিয়াল হিসাব খাতা সফটওয়্যারে যুক্ত হতে এই লিংকে প্রবেশ করুন:\n${liveUrl}\n\nআপনার মোবাইল নম্বর ও ৪ ডিজিট গোপন পিন দিয়ে সিস্টেমে লগইন করুন।`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${company.name || 'DIP BHOLA NETWORK'} - হিসাব খাতা`,
          text: `স্টাফদের জন্য সরাসরি হিসাব খাতা সফটওয়্যার লিংক:`,
          url: liveUrl
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `dip_bhola_staff_qr_code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrCodeUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200 my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">স্টাফদের জন্য মোবাইল লিংক ও QR কোড</h3>
              <p className="text-xs sm:text-sm text-emerald-200 font-medium">যেকোনো স্মার্টফোনে সরাসরি প্রবেশ ও স্টাফ রেজিস্ট্রেশন</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Warning / Explanation Alert Box (Yellow / Amber) */}
          <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 space-y-2.5 text-xs text-amber-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 text-sm">
                  স্টাফের ফোনে কেন "Page not found" এসেছিল?
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  আপনি আপনার ব্রাউজারের ওপরের aistudio.google.com এড্রেস বারের লিংকটি কপি করেছিলেন। সেই লিংকটি শুধুমাত্র আপনার ব্যক্তিগত গুগল একাউন্টে চলে। বাইরের অন্য কারও মোবাইলে দিলে গুগল সেটি ব্লক করে <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono text-[11px] font-bold">Page not found</code> দেখায়।
                </p>
              </div>
            </div>

            <div className="bg-white/80 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>সঠিক নিয়ম: নিচে দেওয়া সবুজ লাইভ লিংকটি কপি করে পাঠান অথবা QR কোড স্ক্যান করান।</span>
            </div>
          </div>

          {/* Direct Mobile App Live Link Box */}
          <div className="bg-emerald-50/70 border-2 border-emerald-400 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-950 font-extrabold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>সরাসরি মোবাইল অ্যাপ লিংক</span>
              </div>
              <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                সবার জন্য উন্মুক্ত
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-300 p-2 shadow-2xs">
              <input
                type="text"
                readOnly
                value={liveUrl}
                className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none px-2 truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span className="text-base">💬</span>
                <span>WhatsApp এ লিংক পাঠান</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>মেসেজ / ফেসবুক / অন্য মাধ্যমে</span>
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-300 shadow-xs flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="Staff Join QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-500 mt-1">মোবাইল দিয়ে স্ক্যান করুন</span>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-slate-900 text-sm">
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>ক্যামেরা দিয়ে স্ক্যান করে প্রবেশ</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                স্টাফের মোবাইলের ক্যামেরা চালু করে এই কিউআর কোডের ওপর ধরলে সাথে সাথে লিংকে ঢোকার অপশন আসবে। টাইপ করার ঝামেলা থাকবে না।
              </p>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs border border-emerald-300 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>QR কোড ছবি হিসেবে ডাউনলোড করুন</span>
              </button>
            </div>
          </div>

          {/* Installation Instructions Box (Light Blue) */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2.5 text-xs text-sky-950">
            <div className="flex items-center gap-2 font-bold text-sky-900 text-sm">
              <Smartphone className="w-4 h-4 text-sky-700" />
              <span>মোবাইলের স্ক্রিনে অ্যাপের মতো সেভ করার সহজ নিয়ম:</span>
            </div>
            <ol className="space-y-1.5 pl-5 list-decimal text-slate-700">
              <li>স্টাফের মোবাইলে গুগল ক্রোম (Google Chrome) ব্রাউজারে লিংকটি খুলুন।</li>
              <li>ব্রাউজারের ওপরের ডানপাশের ৩টি ফোঁটা (Three Dots ⋮) চাপুন।</li>
              <li>মেনু থেকে <strong>"Add to Home screen"</strong> বা <strong>"Install app"</strong> চাপুন।</li>
              <li>সাথে সাথে মোবাইলের স্ক্রিনে <strong>{company.name || 'DIP BHOLA NETWORK'}</strong> এর আইকন চলে আসবে। আর কখনো লিংক খুঁজতে হবে না!</li>
            </ol>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
