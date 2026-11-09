import React, { useState } from 'react';
import { CompanyInfo, Partner } from '../types.ts';
import { formatBnCurrency, formatBnNumber } from '../utils/bengali.ts';
import { 
  Building2, 
  Upload, 
  X, 
  Check, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Users, 
  Plus, 
  Trash2, 
  DollarSign,
  Zap,
  Image as ImageIcon 
} from 'lucide-react';

interface CompanyModalProps {
  company: CompanyInfo;
  onSave: (updated: CompanyInfo) => Promise<void>;
  onClose: () => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({ company, onSave, onClose }) => {
  const [formData, setFormData] = useState<CompanyInfo>({
    name: company.name || '',
    subTitle: company.subTitle || '',
    ownerName: company.ownerName || '',
    phone: company.phone || '',
    email: company.email || '',
    address: company.address || '',
    logoUrl: company.logoUrl || '',
    currencySymbol: company.currencySymbol || '৳',
    partners: company.partners || []
  });

  const [previewLogo, setPreviewLogo] = useState<string>(company.logoUrl || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Logo Upload from local device (base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('লোগো ফাইলের সাইজ ২ মেগাবাইটের কম হতে হবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewLogo(base64);
        setFormData(prev => ({ ...prev, logoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewLogo('');
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  // Partner Handlers
  const handleAddPartner = () => {
    const newPartner: Partner = {
      id: 'p-' + Date.now(),
      name: '',
      phone: '',
      investment: 0,
      sharePercentage: 0,
      role: 'অংশীদার'
    };
    setFormData(prev => ({
      ...prev,
      partners: [...(prev.partners || []), newPartner]
    }));
  };

  const handleUpdatePartner = (id: string, field: keyof Partner, value: any) => {
    setFormData(prev => {
      const updated = (prev.partners || []).map(p => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      });

      // Automatically recalculate share ratios for all partners based on investment
      const grand = updated.reduce((sum, p) => sum + (Number(p.investment) || 0), 0);
      const synced = updated.map(p => ({
        ...p,
        sharePercentage: grand > 0 ? Number((((Number(p.investment) || 0) / grand) * 100).toFixed(2)) : 0
      }));

      return { ...prev, partners: synced };
    });
  };

  const handleRemovePartner = (id: string) => {
    setFormData(prev => {
      const filtered = (prev.partners || []).filter(p => p.id !== id);
      const grand = filtered.reduce((sum, p) => sum + (Number(p.investment) || 0), 0);
      const synced = filtered.map(p => ({
        ...p,
        sharePercentage: grand > 0 ? Number((((Number(p.investment) || 0) / grand) * 100).toFixed(2)) : 0
      }));
      return { ...prev, partners: synced };
    });
  };

  const handleAutoSyncAllRatios = () => {
    const list = formData.partners || [];
    const grand = list.reduce((sum, p) => sum + (Number(p.investment) || 0), 0);
    if (grand <= 0) return;
    const synced = list.map(p => ({
      ...p,
      sharePercentage: Number((((Number(p.investment) || 0) / grand) * 100).toFixed(2))
    }));
    setFormData(prev => ({ ...prev, partners: synced }));
  };

  const totalInvestment = (formData.partners || []).reduce((sum, p) => sum + (Number(p.investment) || 0), 0);
  const totalShare = (formData.partners || []).reduce((sum, p) => sum + (Number(p.sharePercentage) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('কোম্পানি বা প্রতিষ্ঠানের নাম লিখুন');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'কোম্পানি তথ্য সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="font-bold text-base sm:text-lg">কোম্পানি, অংশীদার ও মূলধন সেটআপ</h2>
              <p className="text-xs text-emerald-200">প্রতিষ্ঠানের নাম, লোগো, অংশীদারদের নাম এবং বিনিয়োগের হিসাব সম্পাদনা করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-full hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Logo Picker Section */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-emerald-400 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {previewLogo ? (
                <img src={previewLogo} alt="লোগো" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <ImageIcon className="w-7 h-7 mx-auto mb-1 text-emerald-500" />
                  <span className="text-[10px] block font-medium">লোগো নেই</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="text-xs font-bold text-slate-800 block">কোম্পানির অফিশিয়াল লোগো</span>
              <p className="text-[11px] text-slate-500">আপনার ডিভাইস থেকে পিএনজি (PNG) বা জেপিজি (JPG) লোগো আপলোড করুন।</p>
              
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>লোগো আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {previewLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                  >
                    লোগো মুছুন
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Company Name & Owner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কোম্পানি / প্রতিষ্ঠানের নাম *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="যেমন: হিসাব খাতা এন্টারপ্রাইজ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                প্রধান পরিচালক / মালিকের নাম *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ জাহিদুল ইসলাম"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Subtitle / Slogan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ব্যবসার স্লোগান বা উপ-শিরোনাম
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="যেমন: সততা ও আস্থার বিশ্বস্ত প্রতিষ্ঠান"
                value={formData.subTitle}
                onChange={(e) => setFormData({ ...formData, subTitle: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অফিস / প্রতিষ্ঠানের মোবাইল নম্বর
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অফিসিয়াল ইমেইল
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="info@business.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              প্রতিষ্ঠানের পূর্ণ ঠিকানা
            </label>
            <div className="relative">
              <textarea
                rows={2}
                placeholder="দোকান/অফিস নং, রোড, বাজার/এলাকা, থানা, জেলা"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* PARTNERSHIP & INVESTMENT SECTION */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>অংশীদারগণ ও মূলধন বিনিয়োগ ব্যবস্থাপনা (Partnership & Investment)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">ব্যবসার অংশীদারদের নাম, মোবাইল, বিনিয়োগকৃত টাকা এবং শেয়ারের হার নির্ধারণ করুন।</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoSyncAllRatios}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                  title="বিনিয়োগ অনুপাতে সবার শেয়ার অটো হিসেব করুন"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>অটো রেশিও সিঙ্ক</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddPartner}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন অংশীদার যোগ</span>
                </button>
              </div>
            </div>

            {/* Total Summary Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-500 block">মোট যৌথ মূলধন (Total Investment)</span>
                <strong className="text-emerald-900 text-base">{formatBnCurrency(totalInvestment)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">মোট শেয়ার পার্সেন্টেজ</span>
                <strong className={`text-base ${totalShare === 100 ? 'text-emerald-800' : 'text-amber-700'}`}>
                  {formatBnNumber(totalShare)}% {totalShare !== 100 && '(শতভাগ হওয়া বাঞ্ছনীয়)'}
                </strong>
              </div>
            </div>

            {/* Partners List */}
            {(!formData.partners || formData.partners.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                কোনো অংশীদারের তথ্য যুক্ত করা হয়নি। উপরে "নতুন অংশীদার যোগ করুন" এ ক্লিক করুন।
              </p>
            ) : (
              <div className="space-y-3">
                {formData.partners.map((partner, idx) => (
                  <div key={partner.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 relative group">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">অংশীদারের নাম *</label>
                        <input
                          type="text"
                          required
                          placeholder="নাম লিখুন"
                          value={partner.name}
                          onChange={(e) => handleUpdatePartner(partner.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                        <input
                          type="text"
                          placeholder="017XXXXXXXX"
                          value={partner.phone}
                          onChange={(e) => handleUpdatePartner(partner.id, 'phone', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">পদবী বা ভূমিকা</label>
                        <input
                          type="text"
                          placeholder="যেমন: ব্যবস্থাপনা অংশীদার"
                          value={partner.role || ''}
                          onChange={(e) => handleUpdatePartner(partner.id, 'role', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60 items-end">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">বিনিয়োগকৃত মূলধন (টাকা ৳)</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="যেমন: 100000"
                            value={partner.investment || ''}
                            onChange={(e) => handleUpdatePartner(partner.id, 'investment', Number(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900"
                          />
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-700">শেয়ার রেশিও (%)</label>
                            <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                              ⚡ অটো রেশিও (Auto)
                            </span>
                          </div>
                          <div className="w-full px-3 py-2 bg-emerald-50/80 border border-emerald-300 rounded-lg text-xs font-black text-emerald-900 flex items-center justify-between">
                            <span>{formatBnNumber(partner.sharePercentage ?? 0)}%</span>
                            <span className="text-[10px] text-emerald-700 font-semibold">(বিনিয়োগ অনুযায়ী)</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePartner(partner.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer shrink-0"
                          title="অংশীদার মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {errorMsg}
            </p>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
