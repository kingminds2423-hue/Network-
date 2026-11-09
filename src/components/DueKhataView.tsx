import React, { useState } from 'react';
import { CustomerDue } from '../types.ts';
import { formatBnNumber, formatBnCurrency, formatBnDate } from '../utils/bengali.ts';
import { api } from '../services/api.ts';
import { 
  BookOpen, 
  UserPlus, 
  Phone, 
  Search, 
  PlusCircle, 
  MinusCircle, 
  Trash2, 
  Calendar, 
  CreditCard,
  FileText
} from 'lucide-react';

interface DueKhataViewProps {
  customerDues: CustomerDue[];
  isAdmin: boolean;
  onRefresh: () => Promise<void>;
}

export const DueKhataView: React.FC<DueKhataViewProps> = ({ customerDues, isAdmin, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    initialDue: '',
    notes: ''
  });

  const [activeDuePayment, setActiveDuePayment] = useState<CustomerDue | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'payment' | 'due'>('payment');
  const [payNote, setPayNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = customerDues.filter(
    (d) =>
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      (d.address && d.address.toLowerCase().includes(search.toLowerCase()))
  );

  const totalOutstandingDue = customerDues.reduce((sum, d) => sum + (Number(d.remainingDue) || 0), 0);
  const totalPaid = customerDues.reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert('কাস্টমারের নাম ও মোবাইল নম্বর লিখুন');
      return;
    }
    setSubmitting(true);
    try {
      await api.addCustomerDue(
        newCustomer.name,
        newCustomer.phone,
        newCustomer.address,
        Number(newCustomer.initialDue) || 0,
        newCustomer.notes
      );
      setNewCustomer({ name: '', phone: '', address: '', initialDue: '', notes: '' });
      setShowAddCustomer(false);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'বাকি হিসাব যুক্ত করা যায়নি');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPaymentOrDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDuePayment || !payAmount || Number(payAmount) <= 0) {
      alert('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }
    setSubmitting(true);
    try {
      await api.addDuePayment(activeDuePayment.id, Number(payAmount), payType, payNote);
      setActiveDuePayment(null);
      setPayAmount('');
      setPayNote('');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'বাকি আপডেট করা যায়নি');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDue = async (id: string, name: string) => {
    if (!confirm(`আপনি কি সত্যিই '${name}' এর বাকি হিসাব মুছে ফেলতে চান?`)) return;
    try {
      await api.deleteCustomerDue(id);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলা যায়নি');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Due Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs">
          <span className="text-xs text-red-600 font-bold block mb-1">মোট বাকি পাওনা (Total Due)</span>
          <h3 className="text-2xl font-extrabold text-red-700">{formatBnCurrency(totalOutstandingDue)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">কাস্টমারদের কাছে প্রতিষ্ঠানের মোট পাওনা বাকি</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-xs text-emerald-600 font-bold block mb-1">মোট আদায়কৃত টাকা (Collected)</span>
          <h3 className="text-2xl font-extrabold text-emerald-700">{formatBnCurrency(totalPaid)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">এখন পর্যন্ত কাস্টমারদের জমা দেওয়া টাকা</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-bold block mb-1">মোট বাকি খাতা কাস্টমার</span>
          <h3 className="text-2xl font-extrabold text-slate-900">{formatBnNumber(customerDues.length)} জন</h3>
          <p className="text-[11px] text-slate-500 mt-1">যাদের বাকি হিসাব সংরক্ষিত রয়েছে</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="কাস্টমারের নাম বা ফোন দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <button
          onClick={() => setShowAddCustomer(true)}
          className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন বাকি কাস্টমার যুক্ত করুন</span>
        </button>
      </div>

      {/* Due Customers List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>কাস্টমারদের বাকি ও পরিশোধ তালিকা</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            কোনো কাস্টমারের বাকি পাওয়া যায়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{item.customerName}</h4>
                    {item.remainingDue === 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        পরিশোধিত
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.phone}</span>
                    </span>
                    {item.address && <span>ঠিকানা: {item.address}</span>}
                    {item.notes && <span className="text-slate-400">({item.notes})</span>}
                  </p>
                </div>

                {/* Amount Figures */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">বর্তমান বাকি</span>
                    <span className="text-base font-extrabold text-red-600">{formatBnCurrency(item.remainingDue)}</span>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block font-medium">আদায় হয়েছে</span>
                    <span className="text-sm font-bold text-emerald-700">{formatBnCurrency(item.paidAmount)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveDuePayment(item);
                        setPayType('payment');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1"
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>টাকা জমা নিন</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveDuePayment(item);
                        setPayType('due');
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>আরও বাকি দিন</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteDue(item.id, item.customerName)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: New Customer Due */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4 pb-2 border-b">
              নতুন কাস্টমার বাকি খাতা শুরু করুন
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">কাস্টমারের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হাজী আব্দুল করিম"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  placeholder="01XXXXXXXXX"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">প্রারম্ভিক বাকি টাকা (৳)</label>
                <input
                  type="number"
                  placeholder="যেমন: 5000"
                  value={newCustomer.initialDue}
                  onChange={(e) => setNewCustomer({ ...newCustomer, initialDue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="দোকান বা বাড়ির ঠিকানা"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs"
                >
                  সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment or New Due Entry */}
      {activeDuePayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              {payType === 'payment' ? 'টাকা জমা নিন' : 'নতুন বাকি যুক্ত করুন'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">কাস্টমার: {activeDuePayment.customerName}</p>

            <form onSubmit={handleAddPaymentOrDue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">টাকার পরিমাণ (টাকা ৳) *</label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="টাকার অংক"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মন্তব্য বা চালানের নোট</label>
                <input
                  type="text"
                  placeholder="যেমন: ক্যাশ জমা / পণ্য বিক্রয় চালান"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDuePayment(null)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`text-white font-bold px-5 py-2 rounded-lg text-xs ${
                    payType === 'payment' ? 'bg-emerald-700' : 'bg-amber-700'
                  }`}
                >
                  কনফার্ম করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
