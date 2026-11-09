import React, { useState } from 'react';
import { Transaction, Staff, CompanyInfo } from '../types.ts';
import { 
  formatBnNumber, 
  formatBnCurrency, 
  formatBnDate, 
  INCOME_CATEGORIES, 
  EXPENSE_CATEGORIES, 
  PAYMENT_METHODS, 
  getPaymentMethodLabel 
} from '../utils/bengali.ts';
import { api } from '../services/api.ts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PlusCircle, 
  MinusCircle, 
  Search, 
  Filter, 
  Trash2, 
  Calendar, 
  Download, 
  FileSpreadsheet,
  FileText,
  Printer, 
  CheckCircle, 
  AlertCircle,
  UserCheck,
  Building2,
  Clock,
  X,
  Zap,
  QrCode,
  Smartphone
} from 'lucide-react';
import { CashFlowChart } from './CashFlowChart.tsx';
import { DailyGoalTracker } from './DailyGoalTracker.tsx';

interface DashboardViewProps {
  transactions: Transaction[];
  staffs: Staff[];
  company: CompanyInfo;
  currentUser: { name: string; role: 'admin' | 'manager' | 'cashier' | 'viewer' | 'staff'; id?: string; phone?: string };
  isAdmin: boolean;
  selectedMonth: string;
  onChangeMonth: (m: string) => void;
  onRefresh: () => Promise<void>;
  onOpenPrintReport: () => void;
  onOpenStaffInvite?: () => void;
}

function highlightMatch(text: string, query: string) {
  if (!query || !query.trim() || !text) return text;
  const q = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(q);
  if (index === -1) return text;
  return (
    <span>
      {text.substring(0, index)}
      <mark className="bg-amber-200 text-amber-950 font-bold px-1 rounded">{text.substring(index, index + q.length)}</mark>
      {text.substring(index + q.length)}
    </span>
  );
}

function toCleanNumericInput(val: string): string {
  const bnMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return (val || '').replace(/[০-৯]/g, (d) => bnMap[d] || d).replace(/[^0-9.]/g, '');
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  staffs,
  company,
  currentUser,
  isAdmin,
  selectedMonth,
  onChangeMonth,
  onRefresh,
  onOpenPrintReport,
  onOpenStaffInvite
}) => {
  const isManager = isAdmin || currentUser?.role === 'manager';

  // Income Form State
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    title: '',
    category: 'পণ্য বিক্রয়',
    amount: '',
    paymentMethod: 'cash',
    note: ''
  });

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    title: '',
    category: 'পাইকারি পণ্য / কাঁচামাল ক্রয়',
    amount: '',
    paymentMethod: 'cash',
    note: ''
  });

  // Filter States
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [submittingIncome, setSubmittingIncome] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Expense Floating Action Button States
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    title: '',
    amount: '',
    category: 'আপ্যায়ন ও নাস্তা খরচ',
    date: new Date().toISOString().substring(0, 10),
    paymentMethod: 'cash',
    note: ''
  });
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(toCleanNumericInput(quickForm.amount));
    if (!quickForm.title.trim() || isNaN(cleanAmt) || cleanAmt <= 0) {
      alert('সঠিক বিবরণ ও টাকার অংক দিন!');
      return;
    }

    setQuickSubmitting(true);
    try {
      await api.addTransaction({
        type: 'expense',
        date: quickForm.date,
        title: quickForm.title.trim(),
        category: quickForm.category,
        amount: cleanAmt,
        paymentMethod: quickForm.paymentMethod,
        addedBy: currentUser.name || 'স্টাফ',
        addedById: currentUser.id || 'staff',
        note: quickForm.note.trim() || 'দ্রুত খরচ এন্ট্রি'
      });
      setQuickForm({
        title: '',
        amount: '',
        category: 'আপ্যায়ন ও নাস্তা খরচ',
        date: new Date().toISOString().substring(0, 10),
        paymentMethod: 'cash',
        note: ''
      });
      setIsQuickExpenseOpen(false);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'খরচ এন্ট্রি করতে সমস্যা হয়েছে');
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Filter Transactions by month, staff, type, category, and search query (title & category)
  const filtered = transactions.filter((t) => {
    const matchMonth = t.date && t.date.startsWith(selectedMonth);
    const matchStaff = staffFilter === 'all' || t.addedBy === staffFilter;
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
    
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.addedBy.toLowerCase().includes(q) ||
      (t.note && t.note.toLowerCase().includes(q)) ||
      String(t.amount).includes(q);

    return matchMonth && matchStaff && matchType && matchCat && matchSearch;
  });

  // Calculations for KPI Cards
  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Today's Income and Expense for Daily Goal Tracker
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayTransactions = transactions.filter((t) => t.date === todayStr);

  const todayIncome = todayTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const todayExpense = todayTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Handle Income Submit
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(toCleanNumericInput(incomeForm.amount));
    if (!incomeForm.title.trim() || isNaN(cleanAmt) || cleanAmt <= 0) {
      setStatusMsg({ type: 'error', text: 'আয়ের বিবরণ ও সঠিক টাকার অংক প্রদান করুন!' });
      return;
    }

    setSubmittingIncome(true);
    setStatusMsg(null);
    try {
      await api.addTransaction({
        type: 'income',
        date: incomeForm.date,
        title: incomeForm.title.trim(),
        category: incomeForm.category,
        amount: cleanAmt,
        paymentMethod: incomeForm.paymentMethod,
        addedBy: currentUser.name || 'স্টাফ',
        addedById: currentUser.id || 'admin',
        note: incomeForm.note.trim()
      });
      setIncomeForm({
        date: new Date().toISOString().substring(0, 10),
        title: '',
        category: 'পণ্য বিক্রয়',
        amount: '',
        paymentMethod: 'cash',
        note: ''
      });
      setStatusMsg({ type: 'success', text: 'আয় সফলভাবে রেকর্ড হয়েছে!' });
      await onRefresh();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'আয় রেকর্ড করতে সমস্যা হয়েছে' });
    } finally {
      setSubmittingIncome(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Handle Expense Submit
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(toCleanNumericInput(expenseForm.amount));
    if (!expenseForm.title.trim() || isNaN(cleanAmt) || cleanAmt <= 0) {
      setStatusMsg({ type: 'error', text: 'ব্যয়ের বিবরণ ও সঠিক টাকার অংক প্রদান করুন!' });
      return;
    }

    setSubmittingExpense(true);
    setStatusMsg(null);
    try {
      await api.addTransaction({
        type: 'expense',
        date: expenseForm.date,
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: cleanAmt,
        paymentMethod: expenseForm.paymentMethod,
        addedBy: currentUser.name || 'স্টাফ',
        addedById: currentUser.id || 'admin',
        note: expenseForm.note.trim()
      });
      setExpenseForm({
        date: new Date().toISOString().substring(0, 10),
        title: '',
        category: 'পাইকারি পণ্য / কাঁচামাল ক্রয়',
        amount: '',
        paymentMethod: 'cash',
        note: ''
      });
      setStatusMsg({ type: 'success', text: 'ব্যয় সফলভাবে রেকর্ড হয়েছে!' });
      await onRefresh();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'ব্যয় রেকর্ড করতে সমস্যা হয়েছে' });
    } finally {
      setSubmittingExpense(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Handle Delete
  const handleDeleteTransaction = async (id: string, title: string) => {
    if (!isAdmin) return;
    if (!confirm(`আপনি কি '${title}' লেনদেনটি মুছে ফেলতে নিশ্চিত?`)) return;

    try {
      await api.deleteTransaction(id);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলা যায়নি');
    }
  };

  // Export Filtered / Current Month Transactions to CSV for offline analysis (Managers & Admin)
  const handleExportCsv = () => {
    if (!isManager) {
      alert('শুধুমাত্র ম্যানেজার বা পরিচালক লেনদেন CSV ফাইল এক্সপোর্ট করতে পারবেন।');
      return;
    }

    if (filtered.length === 0) {
      alert('এক্সপোর্ট করার জন্য নির্বাচিত মাসে কোনো লেনদেন পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।');
      return;
    }

    // Comprehensive bilingual headers for professional offline analysis
    const headers = [
      'ক্রমিক (SL)',
      'তারিখ (Date)',
      'ধরন (Type)',
      'বিবরণ (Title)',
      'ক্যাটাগরি (Category)',
      'টাকার পরিমাণ (Amount BDT)',
      'পেমেন্ট মাধ্যম (Payment Method)',
      'এন্ট্রিদাতা (Added By)',
      'মন্তব্য / নোট (Note)',
      'লেনদেন আইডি (ID)'
    ];

    const rows = filtered.map((t, index) => [
      index + 1,
      t.date || '',
      t.type === 'income' ? 'আয় (Income)' : 'ব্যয় (Expense)',
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount || 0,
      `"${getPaymentMethodLabel(t.paymentMethod)}"`,
      `"${(t.addedBy || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${t.id || ''}"`
    ]);

    // Financial KPI Summary for offline inspection
    const totalInc = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExp = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const net = totalInc - totalExp;

    const summaryRows = [
      [],
      ['---', '---', '---', '---', '---', '---', '---', '---', '---', '---'],
      ['হিসাবের সারসংক্ষেপ (Financial Summary)', '', '', '', '', '', '', '', '', ''],
      ['মোট লেনদেন সংখ্যা (Total Records):', filtered.length, '', '', '', '', '', '', '', ''],
      ['মোট আয় / জমা (Total Income):', `৳ ${totalInc}`, '', '', '', '', '', '', '', ''],
      ['মোট ব্যয় / খরচ (Total Expense):', `৳ ${totalExp}`, '', '', '', '', '', '', '', ''],
      ['নিট ব্যালেন্স / ক্যাশ ইন হ্যান্ড (Net Balance):', `৳ ${net}`, '', '', '', '', '', '', '', ''],
      ['প্রতিষ্ঠান:', `"${company.name || 'DIP BHOLA NETWORK'}"`, 'হিসাবের মাস:', selectedMonth, 'ডাউনলোড তারিখ:', new Date().toISOString().substring(0, 10), '', '', '', '']
    ];

    // Prepend UTF-8 BOM (\uFEFF) so Excel, Google Sheets, and LibreOffice render Bengali characters cleanly
    const allLines = [
      headers.join(','),
      ...rows.map(e => e.join(',')),
      ...summaryRows.map(e => e.join(','))
    ];

    const csvContent = '\uFEFF' + allLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateTag = new Date().toISOString().substring(0, 10);
    link.download = `dip_bhola_transactions_${selectedMonth}_${dateTag}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatusMsg({
      type: 'success',
      text: `${formatBnNumber(filtered.length)} টি লেনদেনের CSV ফাইল সফলভাবে ডাউনলোড হয়েছে!`
    });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  return (
    <div className="space-y-6">

      {/* Staff Invite & QR Code Banner for Managers & Admin */}
      {isManager && onOpenStaffInvite && (
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/90 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-xs">
              <QrCode className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm sm:text-base text-white">স্টাফদের অনলাইনে যুক্ত করতে লিংক ও কিউ-আর কোড</h4>
                <span className="text-[10px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">সবার জন্য উন্মুক্ত</span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                স্টাফের ফোনে সরাসরি সফটওয়্যার ওপেন ও সহজে যুক্ত হওয়ার জন্য লাইভ লিংক কপি করুন বা QR স্ক্যান করান।
              </p>
            </div>
          </div>
          <button
            onClick={onOpenStaffInvite}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>লিংক ও QR কোড দেখুন</span>
          </button>
        </div>
      )}
      
      {/* Remote View & Month Selector Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Month Filter & Quick Jump */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <span className="text-xs sm:text-sm font-bold text-slate-700">হিসাবের মাস নির্বাচন:</span>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
          <button
            onClick={() => onChangeMonth(new Date().toISOString().substring(0, 7))}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
          >
            চলতি মাস
          </button>
        </div>

        {/* Right: Staff Filter, Monthly Sheet Print & CSV Export (for Manager & Admin) or Staff Badge */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {isManager ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 hidden sm:inline">স্টাফ ফিল্টার:</span>
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="all">সকল স্টাফ ও এডমিনের এন্ট্রি</option>
                  <option value="প্রধান এডমিন (মালিক)">প্রধান এডমিন (মালিক)</option>
                  {staffs.map(s => (
                    <option key={s.id} value={s.name}>স্টাফ: {s.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={onOpenPrintReport}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="A4 সাইজ মাসিক হিসাব বিবরণী দেখুন এবং সরাসরি PDF ডাউনলোড বা প্রিন্ট করুন"
              >
                <FileText className="w-4 h-4 text-emerald-200" />
                <span>A4 রিপোর্ট ও PDF</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-2xs hover:shadow-xs cursor-pointer"
                title="চলতি মাসের লেনদেন অফলাইন বিশ্লেষণের জন্য CSV ফাইল হিসেবে ডাউনলোড করুন"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>CSV এক্সপোর্ট ({formatBnNumber(filtered.length)})</span>
              </button>
            </>
          ) : (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>স্টাফ মোড: শুধুমাত্র দৈনিক খরচ ও জমা হিসাব সক্রিয়</span>
            </div>
          )}
        </div>

      </div>



      {/* Company Partnership & Investment Summary */}
      {company.partners && company.partners.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>কোম্পানি অংশীদার ও মূলধন বিবরণী (Partnership & Investment)</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-100/80 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                মোট যৌথ মূলধন: {formatBnCurrency(company.partners.reduce((sum, p) => sum + (Number(p.investment) || 0), 0))}
              </span>
              <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">
                অটো রেশিও সক্রিয়
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {company.partners.map(p => {
              const totalInv = company.partners?.reduce((sum, item) => sum + (Number(item.investment) || 0), 0) || 0;
              const autoRatio = totalInv > 0 ? ((Number(p.investment) / totalInv) * 100).toFixed(1) : '0.0';

              return (
                <div key={p.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <span>অটো রেশিও: {formatBnNumber(autoRatio)}%</span>
                      <span className="text-[9px] bg-emerald-700 text-white px-1 rounded font-bold">Auto</span>
                    </span>
                  </div>
                  {p.role && <p className="text-xs text-slate-500">{p.role}</p>}
                  
                  {/* Progress bar showing percentage of company capital */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, Number(autoRatio)))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs pt-1 border-t border-slate-200/60 font-medium">
                    <span className="text-slate-400">বিনিয়োগ:</span>
                    <strong className="text-slate-900">{formatBnCurrency(p.investment)}</strong>
                  </div>
                  {p.phone && (
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>ফোন:</span>
                      <span>{p.phone}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Stat Cards: জমা ও খরচ ওভারভিউ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Deposit / Income */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">মোট জমা (Cash In)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-emerald-700">{formatBnCurrency(totalIncome)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">চলতি মাসে মোট প্রাপ্ত জমা / আয়</p>
          </div>
        </div>

        {/* Card 2: Total Expense */}
        <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wide">মোট খরচ (Cash Out)</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-red-600">{formatBnCurrency(totalExpense)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">চলতি মাসে যাবতীয় মোট খরচ</p>
          </div>
        </div>

        {/* Card 3: Net Cash In Hand */}
        <div className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden ${
          netBalance >= 0 ? 'bg-white border-teal-200' : 'bg-white border-amber-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {netBalance >= 0 ? 'নগদ জমা উদ্বৃত্ত (হাতে জমা)' : 'চলতি ঘাটতি (Deficit)'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              netBalance >= 0 ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-2xl font-extrabold ${netBalance >= 0 ? 'text-teal-700' : 'text-amber-700'}`}>
              {formatBnCurrency(Math.abs(netBalance))}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {netBalance >= 0 ? 'জমা থেকে খরচ বাদ দিয়ে নগদ অবশিষ্ট' : 'জমার চেয়ে মোট খরচ বেশি হয়েছে'}
            </p>
          </div>
        </div>

        {/* Card 4: Total Entries & Realtime Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">মোট এন্ট্রি ও স্থিতি</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900">{formatBnNumber(filtered.length)} টি</h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>লাইভ কেন্দ্রীয় সিঙ্ক চালু</span>
            </p>
          </div>
        </div>

      </div>

      {/* Recharts Cash Flow Analytics Chart (Director Only) */}
      {isAdmin && (
        <CashFlowChart transactions={transactions} selectedMonth={selectedMonth} />
      )}

      {/* Global Status Banner */}
      {statusMsg && (
        <div className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Quick Entry Section: Two Fast Entry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income Card (Cash In) */}
        <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-xs p-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">আয় যুক্ত করুন (Cash In)</h3>
                <span className="text-[11px] text-emerald-700 font-medium">বিক্রয় বা যেকোনো জমার দ্রুত এন্ট্রি</span>
              </div>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              এন্ট্রি দাতা: {currentUser.name}
            </span>
          </div>

          <form onSubmit={handleAddIncome} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">তারিখ</label>
                <input
                  type="date"
                  required
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">আয়ের খাত / ক্যাটাগরি</label>
                <select
                  value={incomeForm.category}
                  onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {INCOME_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">আয়ের বিবরণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: নগদ কাউন্টার বিক্রয়"
                  value={incomeForm.title}
                  onChange={(e) => setIncomeForm({ ...incomeForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="যেমন: 5000"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: toCleanNumericInput(e.target.value) })}
                  className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-sm font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={incomeForm.paymentMethod}
                  onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মন্তব্য (নোট)</label>
                <input
                  type="text"
                  placeholder="চালান নং বা অতিরিক্ত তথ্য"
                  value={incomeForm.note}
                  onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingIncome}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submittingIncome ? 'যুক্ত হচ্ছে...' : 'আয় জমা করুন'}</span>
            </button>
          </form>
        </div>

        {/* Expense Card (Cash Out) */}
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-xs p-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-red-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                <MinusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ব্যয় যুক্ত করুন (Cash Out)</h3>
                <span className="text-[11px] text-red-700 font-medium">যেকোনো প্রকার খরচ বা পেমেন্টের এন্ট্রি</span>
              </div>
            </div>
            <span className="text-[11px] bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded font-bold">
              এন্ট্রি দাতা: {currentUser.name}
            </span>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">তারিখ</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ব্যয়ের খাত / ক্যাটাগরি</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ব্যয়ের বিবরণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বিদ্যুৎ বিল বা নাস্তা খরচ"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="যেমন: 1200"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: toCleanNumericInput(e.target.value) })}
                  className="w-full px-3 py-2 border border-red-400 rounded-lg text-sm font-bold text-red-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মন্তব্য (নোট)</label>
                <input
                  type="text"
                  placeholder="ভাউচার নং বা কার কাছে দেওয়া হলো"
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingExpense}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <MinusCircle className="w-4 h-4" />
              <span>{submittingExpense ? 'যুক্ত হচ্ছে...' : 'ব্যয় সাবমিট করুন'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filters & Dedicated Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>দৈনিক লেনদেন রেজিস্টার (লাইভ খাতা)</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  {formatBnNumber(filtered.length)} টি এন্ট্রি
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                নিচের সার্চ বার দিয়ে যেকোনো শিরোনাম, ক্যাটাগরি বা স্টাফের নাম মুহূর্তেই খুঁজে বের করুন
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isManager && (
                <button
                  onClick={handleExportCsv}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 transition shadow-2xs hover:shadow-xs cursor-pointer"
                  title="চলতি মাসের লেনদেন অফলাইন বিশ্লেষণের জন্য CSV ফাইল হিসেবে ডাউনলোড করুন"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>CSV এক্সপোর্ট ({formatBnNumber(filtered.length)} টি)</span>
                </button>
              )}

              {/* Clear All Filters Button if any filter active */}
              {(searchQuery || categoryFilter !== 'all' || typeFilter !== 'all' || staffFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setTypeFilter('all');
                    setStaffFilter('all');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 flex items-center gap-1 transition w-fit"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>সব ফিল্টার ক্লিয়ার করুন</span>
                </button>
              )}
            </div>
          </div>

          {/* Dedicated Search & Filter Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            
            {/* 1. Main Real-time Search Input (Title or Category) */}
            <div className="md:col-span-6 space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>রিয়েল-টাইম ফিল্টার (শিরোনাম বা ক্যাটাগরি):</span>
                {searchQuery && (
                  <span className="text-[10px] text-emerald-700 font-semibold">লাইভ ফিল্টার সক্রিয়</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="শিরোনাম (যেমন: বিক্রয়, ভাড়া) বা ক্যাটাগরি লিখে ফিল্টার করুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-2xs text-slate-900 placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    title="ক্লিয়ার করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Category Dropdown Filter */}
            <div className="md:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs text-slate-800"
              >
                <option value="all">সকল ক্যাটাগরি</option>
                <optgroup label="আয়ের খাত (Income)">
                  {INCOME_CATEGORIES.map(c => (
                    <option key={`in-${c}`} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="ব্যয়ের খাত (Expense)">
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={`ex-${c}`} value={c}>{c}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* 3. Transaction Type Selector Tabs */}
            <div className="md:col-span-3">
              <div className="flex rounded-xl border border-slate-300 overflow-hidden text-xs font-bold shadow-2xs bg-white">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`flex-1 py-2.5 text-center transition ${
                    typeFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  সকল
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('income')}
                  className={`flex-1 py-2.5 text-center transition ${
                    typeFilter === 'income'
                      ? 'bg-emerald-700 text-white'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  আয়
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('expense')}
                  className={`flex-1 py-2.5 text-center transition ${
                    typeFilter === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'text-red-800 hover:bg-red-50'
                  }`}
                >
                  ব্যয়
                </button>
              </div>
            </div>

          </div>

          {/* Active Search Highlights */}
          {searchQuery && (
            <div className="text-xs text-slate-600 flex items-center gap-2 pt-1">
              <span className="font-semibold text-emerald-800">সার্চ করা হয়েছে:</span>
              <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                "{searchQuery}"
              </span>
              <span className="text-slate-400">•</span>
              <span>পাওয়া গেছে: <strong>{formatBnNumber(filtered.length)}</strong> টি লেনদেন</span>
            </div>
          )}
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">ধরন</th>
                <th className="py-3 px-4">বিবরণ / খাত</th>
                <th className="py-3 px-4">ক্যাটাগরি</th>
                <th className="py-3 px-4">মাধ্যম</th>
                <th className="py-3 px-4">এন্ট্রি দাতা</th>
                <th className="py-3 px-4 text-right">টাকা (৳)</th>
                {isAdmin && <th className="py-3 px-4 text-center w-12">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-500">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all' ? (
                      <div>
                        <p className="font-bold text-slate-700 text-sm">
                          "{searchQuery || categoryFilter}" দিয়ে কোনো লেনদেন খুঁজে পাওয়া যায়নি!
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          অন্য কোনো শিরোনাম বা ক্যাটাগরি দিয়ে সার্চ করে দেখুন অথবা ফিল্টার রিসেট করুন।
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('all');
                            setTypeFilter('all');
                          }}
                          className="mt-3 px-4 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition"
                        >
                          সার্চ ফিল্টার রিসেট করুন
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-slate-700 text-sm">কোনো লেনদেন রেকর্ড পাওয়া যায়নি</p>
                        <p className="text-xs text-slate-400 mt-1">উপরের কার্ড ব্যবহার করে নতুন আয় বা ব্যয় যুক্ত করুন।</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {formatBnDate(tx.date)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.type === 'income' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <TrendingUp className="w-3 h-3" />
                          <span>আয়</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <TrendingDown className="w-3 h-3" />
                          <span>ব্যয়</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{tx.title}</span>
                      {tx.note && <span className="text-[11px] text-slate-500 block">{tx.note}</span>}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {tx.category}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                        {getPaymentMethodLabel(tx.paymentMethod)}
                      </span>
                    </td>

                    {/* Added By Stamp - Crucial for owner remote monitoring! */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {tx.addedBy.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800">{tx.addedBy}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`text-sm font-extrabold ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-red-600'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatBnCurrency(tx.amount)}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id, tx.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Floating Action Button for Quick Expense */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        <button
          onClick={() => setIsQuickExpenseOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 font-bold text-sm transition transform hover:scale-105 active:scale-95 border-2 border-white"
          title="দ্রুত খরচ এন্ট্রি করুন"
        >
          <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-bounce" />
          <span>দ্রুত খরচ (Quick Expense)</span>
        </button>
      </div>

      {/* Quick Expense Minimal Modal */}
      {isQuickExpenseOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-red-200 overflow-hidden">
            
            <div className="bg-red-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-red-200" />
                <h3 className="font-bold text-base">দ্রুত খরচ এন্ট্রি (Quick Expense)</h3>
              </div>
              <button onClick={() => setIsQuickExpenseOpen(false)} className="text-red-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">খরচের বিবরণ / শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: চা ও নাস্তা বিল, যাতায়াত ভাড়া"
                  value={quickForm.title}
                  onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="যেমন: 350"
                  value={quickForm.amount}
                  onChange={(e) => setQuickForm({ ...quickForm, amount: toCleanNumericInput(e.target.value) })}
                  className="w-full px-3 py-2.5 border-2 border-red-400 rounded-xl text-base font-extrabold text-red-700 focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Category Quick Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ক্যাটাগরি ট্যাগ (Category Tags)</label>
                <div className="flex flex-wrap gap-1.5">
                  {EXPENSE_CATEGORIES.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setQuickForm({ ...quickForm, category: cat })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        quickForm.category === cat
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={quickForm.date}
                    onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মাধ্যম</label>
                  <select
                    value={quickForm.paymentMethod}
                    onChange={(e) => setQuickForm({ ...quickForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickExpenseOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={quickSubmitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{quickSubmitting ? 'রেকর্ড হচ্ছে...' : 'খরচ জমা করুন'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
