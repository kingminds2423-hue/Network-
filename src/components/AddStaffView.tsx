import React, { useState } from 'react';
import { Staff } from '../types.ts';
import { api } from '../services/api.ts';
import { 
  UserPlus, 
  Upload, 
  Phone, 
  Lock, 
  User, 
  MapPin, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';

interface AddStaffViewProps {
  onSuccess: (newStaff: Staff) => void;
  onCancel: () => void;
}

export const AddStaffView: React.FC<AddStaffViewProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    phone: '',
    email: '',
    nid: '',
    address: '',
    designation: 'সেলস এক্সিকিউটিভ',
    salary: '',
    joinedAt: new Date().toISOString().substring(0, 10),
    photoUrl: '',
    pin: '',
    role: 'cashier' as const,
    education: '',
    emergencyContact: '',
    bloodGroup: ''
  });

  const [previewPhoto, setPreviewPhoto] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg('ছবির সাইজ ৩ মেগাবাইটের কম হতে হবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewPhoto(base64);
        setFormData(prev => ({ ...prev, photoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!formData.name.trim()) {
      setErrorMsg('স্টাফের নাম অবশ্যই লিখতে হবে!');
      return;
    }
    if (!formData.fatherName.trim()) {
      setErrorMsg('পিতার নাম উল্লেখ করুন!');
      return;
    }
    if (!formData.motherName.trim()) {
      setErrorMsg('মাতার নাম উল্লেখ করুন!');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)');
      return;
    }
    if (!formData.pin.trim() || formData.pin.length < 4) {
      setErrorMsg('কমপক্ষে ৪ ডিজিটের একটি গোপন পিন (PIN) নির্ধারণ করুন!');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('স্টাফের বর্তমান ও স্থায়ী ঠিকানা দিন!');
      return;
    }

    setLoading(true);
    try {
      const res = await api.addStaff({
        ...formData,
        salary: Number(formData.salary) || 0,
        photoUrl: previewPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name)}`
      });

      if (res.success && res.staff) {
        setSuccessMsg(`স্টাফ '${res.staff.name}' সফলভাবে নিয়োগ সম্পন্ন হয়েছে! এখন সে লগইন করতে পারবে।`);
        setTimeout(() => {
          onSuccess(res.staff);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'স্টাফ নিয়োগে সমস্যা দেখা দিয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-xs border border-white/20">
            <UserPlus className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">নতুন স্টাফ নিয়োগ ও প্রোফাইল তৈরি</h1>
            <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
              সকল তথ্য পূরণ করে ৪ ডিজিট পিন দিয়ে স্টাফ নিয়োগ দিন। এরপর সে নিজের মোবাইল ও পিন দিয়ে সিস্টেমে লগইন করে এন্ট্রি দিতে পারবে।
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        
        {/* Photo & Quick Login Credentials Group */}
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Photo Picker */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-28 h-32 border-2 border-dashed border-emerald-400 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center relative group">
              {previewPhoto ? (
                <img src={previewPhoto} alt="প্রিভিউ" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-3 text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-emerald-400" />
                  <span className="text-[11px] block">ছবি নির্বাচন করুন</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-xs font-semibold">
                <Upload className="w-5 h-5 mb-1" />
                <span>ছবি বদলান</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <label className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>মোবাইল বা পিসি থেকে ছবি দিন</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Login Mobile & PIN Setup */}
          <div className="md:col-span-2 space-y-4">
            <div className="border-l-4 border-emerald-600 pl-3">
              <h3 className="text-sm font-bold text-slate-900">লগইন ক্রেডেনশিয়াল (যা দিয়ে স্টাফ লগইন করবে)</h3>
              <p className="text-xs text-slate-500">এই মোবাইল নম্বর ও পিন দিয়ে স্টাফ তার নিজের ডিভাইস বা দোকান থেকে সফটওয়্যারে ঢুকবে।</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  স্টাফের মোবাইল নম্বর (লগইন আইডি) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  লগইন ৪ ডিজিট পিন কোড (Security PIN) *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="যেমন: 1234"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white tracking-widest"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: ব্যাক্তিগত ও পারিবারিক তথ্যাবলী */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700" />
            <span>১. ব্যাক্তিগত ও পারিবারিক তথ্যাবলী (Personal Information)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">স্টাফের পুরো নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: মোঃ তানভীর আহমেদ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বাবার নাম (Father's Name) *</label>
              <input
                type="text"
                required
                placeholder="পিতার নাম লিখুন"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">মার নাম (Mother's Name) *</label>
              <input
                type="text"
                required
                placeholder="মাতার নাম লিখুন"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">জাতীয় পরিচয়পত্র (NID)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="১০ বা ১৭ ডিজিট এনআইডি"
                  value={formData.nid}
                  onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">রক্তের গ্রুপ (Blood Group)</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">নির্বাচন করুন</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ইমেইল (যদি থাকে)</label>
              <input
                type="email"
                placeholder="staff@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">বর্তমান ও স্থায়ী ঠিকানা *</label>
              <div className="relative">
                <textarea
                  rows={2}
                  required
                  placeholder="গ্রাম/বাড়ি, ডাকঘর, থানা/উপজেলা, জেলা"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: প্রাতিষ্ঠানিক পদবী, বেতন ও যোগ্যতা */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>২. প্রাতিষ্ঠানিক পদবী, বেতন ও অন্যান্য তথ্য (Employment Details)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">সিস্টেম রোল (System Role) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-emerald-800 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="manager">ম্যানেজার (Manager)</option>
                <option value="cashier">ক্যাশিয়ার (Cashier)</option>
                <option value="viewer">ভিউয়ার (Viewer - Read Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">নিযুক্ত পদবী *</label>
              <input
                type="text"
                required
                placeholder="যেমন: সেলস ম্যানেজার, ক্যাশিয়ার"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">মাসিক নির্ধারিত বেতন (টাকা ৳)</label>
              <input
                type="number"
                placeholder="যেমন: 20000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">যোগদানের তারিখ</label>
              <input
                type="date"
                value={formData.joinedAt}
                onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">জরুরি যোগাযোগ নম্বর</label>
              <input
                type="text"
                placeholder="যেমন: 017XXXXXXX (ভাই)"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">শিক্ষাগত যোগ্যতা</label>
              <input
                type="text"
                placeholder="যেমন: এসএসসি / এইচএসসি / ডিগ্রি / অনার্স"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'নিয়োগ প্রক্রিয়া সম্পন্ন হচ্ছে...' : 'স্টাফ নিয়োগ কনফার্ম করুন'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
