import React, { useState } from 'react';
import { Staff, CompanyInfo } from '../types.ts';
import { formatBnNumber, formatBnCurrency, formatBnDate } from '../utils/bengali.ts';
import { 
  Users, 
  UserCheck, 
  Phone, 
  FileText, 
  Lock, 
  Trash2, 
  Search, 
  Plus, 
  Key, 
  ShieldCheck, 
  UserX,
  CreditCard,
  QrCode
} from 'lucide-react';

interface StaffListViewProps {
  staffs: Staff[];
  company: CompanyInfo;
  isAdmin: boolean;
  onOpenCv: (staff: Staff) => void;
  onAddNewStaff: () => void;
  onOpenStaffInvite?: () => void;
  onUpdateStaffPin: (staffId: string, newPin: string) => Promise<void>;
  onDeleteStaff: (staffId: string) => Promise<void>;
}

export const StaffListView: React.FC<StaffListViewProps> = ({
  staffs,
  company,
  isAdmin,
  onOpenCv,
  onAddNewStaff,
  onOpenStaffInvite,
  onUpdateStaffPin,
  onDeleteStaff
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPinStaffId, setEditingPinStaffId] = useState<string | null>(null);
  const [newPinVal, setNewPinVal] = useState('');

  const filteredStaffs = staffs.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSalaryBudget = staffs.reduce((sum, s) => sum + (Number(s.salary) || 0), 0);

  const handleSavePin = async (staffId: string) => {
    if (!newPinVal || newPinVal.length < 4) {
      alert('নতুন পিন অবশ্যই কমপক্ষে ৪ ডিজিটের হতে হবে');
      return;
    }
    await onUpdateStaffPin(staffId, newPinVal);
    setEditingPinStaffId(null);
    setNewPinVal('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">নিবন্ধিত মোট স্টাফ</span>
            <h3 className="text-xl font-extrabold text-slate-900">{formatBnNumber(staffs.length)} জন</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">সক্রিয় কর্মকর্তা</span>
            <h3 className="text-xl font-extrabold text-teal-900">
              {formatBnNumber(staffs.filter(s => s.status === 'active').length)} জন
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">মাসিক মোট বেতন বাজেট</span>
            <h3 className="text-xl font-extrabold text-indigo-950">{formatBnCurrency(totalSalaryBudget)}</h3>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="স্টাফের নাম, ফোন বা পদবী দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {onOpenStaffInvite && (
            <button
              onClick={onOpenStaffInvite}
              className="w-full sm:w-auto bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-teal-700" />
              <span>স্টাফ লিংক ও QR কোড</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onAddNewStaff}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্টাফ নিয়োগ দিন</span>
            </button>
          )}
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaffs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-base">কোনো স্টাফ পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-400 mt-1">প্রয়োজনে নতুন স্টাফ নিয়োগ দিয়ে সফটওয়্যারে যুক্ত করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaffs.map((staff) => (
            <div
              key={staff.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-emerald-500 overflow-hidden shrink-0 bg-slate-100 shadow-sm">
                    <img
                      src={staff.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`}
                      alt={staff.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {staff.designation}
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {staff.role === 'manager' ? 'ম্যানেজার' : staff.role === 'cashier' ? 'ক্যাশিয়ার' : staff.role === 'viewer' ? 'ভিউয়ার' : 'স্টাফ'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base truncate">{staff.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{staff.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Info List */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">পিতার নাম:</span>
                    <span className="font-medium text-slate-800">{staff.fatherName || 'দেওয়া নেই'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">মাতার নাম:</span>
                    <span className="font-medium text-slate-800">{staff.motherName || 'দেওয়া নেই'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">মাসিক বেতন:</span>
                    <span className="font-bold text-slate-900">{formatBnCurrency(staff.salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">যোগদান:</span>
                    <span className="text-slate-700">{formatBnDate(staff.joinedAt)}</span>
                  </div>

                  {isAdmin && (
                    <div className="flex justify-between items-center bg-amber-50/80 px-2 py-1 rounded border border-amber-200/80 mt-2">
                      <span className="text-amber-900 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>লগইন পিন:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900 tracking-wider">
                        {staff.pin}
                      </span>
                    </div>
                  )}
                </div>

                {/* Edit PIN Inline form if activated */}
                {editingPinStaffId === staff.id && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">নতুন ৪ ডিজিট পিন দিন:</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="নতুন পিন"
                        value={newPinVal}
                        onChange={(e) => setNewPinVal(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded bg-white"
                      />
                      <button
                        onClick={() => handleSavePin(staff.id)}
                        className="bg-emerald-700 text-white text-xs px-2.5 py-1 rounded font-bold"
                      >
                        সেভ
                      </button>
                      <button
                        onClick={() => setEditingPinStaffId(null)}
                        className="text-xs text-slate-500 px-2"
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenCv(staff)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition border border-emerald-200"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>সিভি দেখুন ও প্রিন্ট</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      title="পিন পরিবর্তন করুন"
                      onClick={() => {
                        setEditingPinStaffId(staff.id);
                        setNewPinVal(staff.pin);
                      }}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      title="স্টাফ মুছে ফেলুন"
                      onClick={() => {
                        if (confirm(`আপনি কি সত্যিই '${staff.name}' স্টাফকে মুছে ফেলতে চান?`)) {
                          onDeleteStaff(staff.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
