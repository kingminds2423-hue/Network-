import React from 'react';
import { Staff, CompanyInfo } from '../types.ts';
import { formatBnNumber, formatBnCurrency, formatBnDate } from '../utils/bengali.ts';
import { X, Printer, Phone, Mail, MapPin, Calendar, Award, User, ShieldCheck } from 'lucide-react';

interface StaffCvModalProps {
  staff: Staff;
  company: CompanyInfo;
  onClose: () => void;
}

export const StaffCvModal: React.FC<StaffCvModalProps> = ({ staff, company, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Modal Controls - Hidden during Print */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-300" />
            <span className="font-bold text-base sm:text-lg">স্টাফ পূর্ণাঙ্গ জীবনবৃত্তান্ত (CV)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-4 h-4" />
              <span>সিভি প্রিন্ট / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-emerald-200 hover:text-white p-1.5 rounded-full hover:bg-emerald-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CV Document Content (Styled for Standard A4 Official Bio-Data) */}
        <div className="p-6 sm:p-10 space-y-6 text-slate-800 bg-white">
          
          {/* Header & Photo */}
          <div className="flex flex-col-reverse sm:flex-row items-center sm:items-start justify-between border-b-2 border-emerald-700 pb-6 gap-6">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-xs uppercase tracking-widest text-emerald-700 font-bold">
                {company.name} | নিয়োগকৃত কর্মকর্তা/স্টাফ
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{staff.name}</h1>
              <p className="text-base font-semibold text-emerald-800 bg-emerald-50 inline-block px-3 py-0.5 rounded-md border border-emerald-200">
                পদবী: {staff.designation}
              </p>
              <div className="pt-2 text-xs sm:text-sm text-slate-600 space-y-1">
                <p className="flex items-center justify-center sm:justify-start gap-2">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>মোবাইল (লগইন আইডি): <strong className="text-slate-900">{staff.phone}</strong></span>
                </p>
                {staff.email && (
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="w-4 h-4 text-emerald-700" />
                    <span>ইমেইল: {staff.email}</span>
                  </p>
                )}
                <p className="flex items-center justify-center sm:justify-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>বর্তমান ঠিকানা: {staff.address}</span>
                </p>
              </div>
            </div>

            {/* Passport Photo */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-32 h-36 border-4 border-slate-200 rounded-lg overflow-hidden shadow-md bg-slate-100 flex items-center justify-center">
                {staff.photoUrl ? (
                  <img
                    src={staff.photoUrl}
                    alt={staff.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-400" />
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">পাসপোর্ট সাইজ ছবি</span>
            </div>
          </div>

          {/* Section 1: ব্যক্তিগত তথ্যাবলী (Personal Information) */}
          <div>
            <h2 className="text-sm font-bold bg-slate-100 text-slate-900 px-3 py-1.5 rounded border-l-4 border-emerald-600 mb-3">
              ১. ব্যক্তিগত তথ্যাবলী (Personal Information)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">পিতার নাম:</span>
                <span className="font-semibold text-slate-900">{staff.fatherName || 'উল্লেখ নেই'}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">মাতার নাম:</span>
                <span className="font-semibold text-slate-900">{staff.motherName || 'উল্লেখ নেই'}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">জাতীয় পরিচয়পত্র (NID):</span>
                <span className="font-semibold text-slate-900">{formatBnNumber(staff.nid) || 'জমা দেওয়া হয়নি'}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">রক্তের গ্রুপ:</span>
                <span className="font-semibold text-slate-900">{staff.bloodGroup || 'অজানা'}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-1 sm:col-span-2">
                <span className="w-40 text-slate-500 font-medium">স্থায়ী ঠিকানা:</span>
                <span className="font-semibold text-slate-900">{staff.address}</span>
              </div>
            </div>
          </div>

          {/* Section 2: প্রাতিষ্ঠানিক ও চাকরির তথ্য (Official Employment Details) */}
          <div>
            <h2 className="text-sm font-bold bg-slate-100 text-slate-900 px-3 py-1.5 rounded border-l-4 border-emerald-600 mb-3">
              ২. চাকুরির বিবরণ ও বেতন (Employment Details)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">নিযুক্ত পদবী:</span>
                <span className="font-bold text-emerald-800">{staff.designation}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">মাসিক নির্ধারিত বেতন:</span>
                <span className="font-bold text-slate-900">{formatBnCurrency(staff.salary)}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">যোগদানের তারিখ:</span>
                <span className="font-semibold text-slate-900">{formatBnDate(staff.joinedAt)}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">চাকরির বর্তমান অবস্থা:</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>সক্রিয় কর্মকর্তা (Active)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: শিক্ষাগত যোগ্যতা ও জরুরি যোগাযোগ */}
          <div>
            <h2 className="text-sm font-bold bg-slate-100 text-slate-900 px-3 py-1.5 rounded border-l-4 border-emerald-600 mb-3">
              ৩. অন্যান্য বিবরণ ও জরুরি যোগাযোগ (Other Information)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">শিক্ষাগত যোগ্যতা:</span>
                <span className="font-semibold text-slate-900">{staff.education || 'সাধারণ'}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-1">
                <span className="w-40 text-slate-500 font-medium">জরুরি যোগাযোগ:</span>
                <span className="font-semibold text-slate-900">{staff.emergencyContact || 'উল্লেখ নেই'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: সিস্টেম লগইন এক্সেস (System Access Info - Admin view) */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>সফটওয়্যার লগইন তথ্য ও অনুমতি:</span>
            </p>
            <p>• স্টাফের লগইন মোবাইল: <strong>{staff.phone}</strong></p>
            <p>• স্টাফ পিন কোড: <strong>{staff.pin}</strong> (এই পিন দিয়ে স্টাফ সফটওয়্যারে ঢুকে আয়-ব্যয় এন্ট্রি দিতে পারবে)</p>
            <p>• স্টাফ যেসব এন্ট্রি দিবে তাতে স্বয়ংক্রিয়ভাবে তার নাম ({staff.name}) সিলমোহর হিসেবে যুক্ত হবে।</p>
          </div>

          {/* Official Signatures for Printed Copy */}
          <div className="pt-14 pb-4 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
            <div>
              <div className="border-t border-slate-400 w-44 mx-auto pt-1 font-semibold">
                কর্মকর্তা / স্টাফের স্বাক্ষর
              </div>
              <span className="text-[10px] text-slate-400">তারিখ: ____________</span>
            </div>
            <div>
              <div className="border-t border-slate-400 w-44 mx-auto pt-1 font-semibold text-emerald-900">
                মালিক / প্রধান কর্তৃপক্ষের স্বাক্ষর ও সীল
              </div>
              <span className="text-[10px] text-slate-400">তারিখ: ____________</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
