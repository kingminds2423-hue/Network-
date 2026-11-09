import React, { useRef, useState } from 'react';
import { Transaction, CompanyInfo } from '../types.ts';
import { 
  formatBnNumber, 
  formatBnCurrency, 
  formatBnDate, 
  formatBnMonthYear,
  getPaymentMethodLabel 
} from '../utils/bengali.ts';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  FileText,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  uploadMonthlyReportPdfToGoogleDrive, 
  uploadMonthlyReportJsonToGoogleDrive,
  signInWithGoogleDrive,
  getGoogleAccessToken
} from '../services/googleDrive.ts';
import { CloudUpload } from 'lucide-react';

interface PrintReportModalProps {
  transactions: Transaction[];
  company: CompanyInfo;
  selectedMonth: string;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  transactions,
  company,
  selectedMonth,
  onClose
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState<string | null>(null);

  const filtered = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));

  // Income & Expense totals
  const totalIncome = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Breakdown by payment methods for offline business analysis
  const cashIncome = filtered
    .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const digitalIncome = filtered
    .filter(t => t.type === 'income' && (t.paymentMethod === 'bkash' || t.paymentMethod === 'nagad'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const bankIncome = filtered
    .filter(t => t.type === 'income' && t.paymentMethod === 'bank')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const cashExpense = filtered
    .filter(t => t.type === 'expense' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const digitalExpense = filtered
    .filter(t => t.type === 'expense' && (t.paymentMethod === 'bkash' || t.paymentMethod === 'nagad'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const bankExpense = filtered
    .filter(t => t.type === 'expense' && t.paymentMethod === 'bank')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Direct High-Resolution Multi-Page A4 PDF Generation
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setDownloadingPdf(true);
    setDownloadSuccess(false);

    try {
      const element = reportRef.current;
      
      // Capture at scale 2 for crisp vector-like text on high DPI
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794 // Exact standard 210mm width at 96 DPI
      });

      const imgWidth = 210; // A4 standard width in mm
      const pageHeight = 297; // A4 standard height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add First Page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add subsequent pages if transaction list overflows single A4 page
      while (heightLeft > 5) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const safeName = (company.name || 'DIP_BHOLA_NETWORK').replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
      pdf.save(`${safeName}_মাসিক_হিসাব_রিপোর্ট_${selectedMonth}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('PDF download generation error:', err);
      // Fallback: trigger native browser print dialog
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Upload Monthly Report directly to Google Drive
  const handleSaveToGoogleDrive = async () => {
    if (!reportRef.current) return;
    setUploadingDrive(true);
    setDriveSuccess(null);

    try {
      let token = await getGoogleAccessToken();
      if (!token) {
        const signRes = await signInWithGoogleDrive();
        if (!signRes) {
          throw new Error('গুগল ড্রাইভ কানেক্ট করা সম্ভব হয়নি');
        }
        token = signRes.accessToken;
      }

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const safeName = (company.name || 'DIP_BHOLA_NETWORK').replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
      const fileName = `${safeName}_মাসিক_রিপোর্ট_${selectedMonth}.pdf`;
      const pdfBlob = pdf.output('blob');

      // Upload PDF to Google Drive
      await uploadMonthlyReportPdfToGoogleDrive(fileName, pdfBlob, formatBnMonthYear(selectedMonth));

      // Also Upload structured JSON Report
      const monthlySummary = {
        month: selectedMonth,
        monthLabel: formatBnMonthYear(selectedMonth),
        company: company.name,
        generatedAt: new Date().toISOString(),
        totalIncome,
        totalExpense,
        netBalance,
        transactionsCount: filtered.length,
        transactions: filtered
      };
      await uploadMonthlyReportJsonToGoogleDrive(selectedMonth, monthlySummary);

      setDriveSuccess('গুগল ড্রাইভে মাসিক রিপোর্ট (PDF ও JSON) সফলভাবে ব্যাকআপ হয়েছে!');
      setTimeout(() => setDriveSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'গুগল ড্রাইভে ব্যাকআপ করা সম্ভব হয়নি');
    } finally {
      setUploadingDrive(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Send summary via email
  const handleSendEmail = () => {
    const subject = `${company.name || 'DIP BHOLA NETWORK'} - মাসিক হিসাব বিবরণী (${formatBnMonthYear(selectedMonth)})`;
    const summaryLines = [
      `প্রতিষ্ঠান: ${company.name || 'DIP BHOLA NETWORK'}`,
      `মালিক / পরিচালক: ${company.ownerName || 'N/A'}`,
      `হিসাবের মাস: ${formatBnMonthYear(selectedMonth)}`,
      `----------------------------------------`,
      `মোট জমা / আয়: ৳ ${totalIncome.toLocaleString('en-IN')}`,
      `মোট খরচ / ব্যয়: ৳ ${totalExpense.toLocaleString('en-IN')}`,
      `নিট ক্যাশ ব্যালেন্স: ৳ ${netBalance.toLocaleString('en-IN')}`,
      `মোট লেনদেন সংখ্যা: ${filtered.length} টি`,
      `----------------------------------------`,
      `নগদ ক্যাশ জমা: ৳${cashIncome.toLocaleString('en-IN')} | নগদ খরচ: ৳${cashExpense.toLocaleString('en-IN')}`,
      `বিকাশ/নগদ জমা: ৳${digitalIncome.toLocaleString('en-IN')} | খরচ: ৳${digitalExpense.toLocaleString('en-IN')}`,
      `ব্যাংক জমা: ৳${bankIncome.toLocaleString('en-IN')} | খরচ: ৳${bankExpense.toLocaleString('en-IN')}`,
      `----------------------------------------`,
      `DIP BHOLA NETWORK হিসাব খাতা সফটওয়্যারের মাধ্যমে প্রস্তুতকৃত অফিসিয়াল রিপোর্ট।`
    ];

    const bodyText = summaryLines.join('\n');
    window.location.href = `mailto:${company.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-start py-6 px-2 sm:px-4 print:p-0 print:bg-white print:fixed print:inset-0">
      
      {/* Top Floating Control Bar - Excluded from Print */}
      <div className="w-full max-w-[210mm] mb-4 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 no-print">
        
        {/* Left: Report Info & A4 Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-white">মাসিক রিপোর্ট (A4 সাইজ)</h2>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FileText className="w-3 h-3" /> A4 Portrait (210×297mm)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              মাস: <strong className="text-slate-200">{formatBnMonthYear(selectedMonth)}</strong> • মোট <strong className="text-emerald-400">{formatBnNumber(filtered.length)}</strong> টি লেনদেন
            </p>
          </div>
        </div>

        {/* Right: Direct Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Direct PDF Download Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-60"
            title="সরাসরি A4 সাইজ PDF ফাইল ডাউনলোড করুন"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>PDF তৈরি হচ্ছে...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>PDF ডাউনলোড হয়েছে!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-100" />
                <span>সরাসরি PDF ডাউনলোড</span>
              </>
            )}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer border border-slate-700 shadow-xs"
            title="A4 পেপারে প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>প্রিন্ট</span>
          </button>

          {/* Google Drive Monthly Report Backup Button */}
          <button
            onClick={handleSaveToGoogleDrive}
            disabled={uploadingDrive}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-60"
            title="গুগল ড্রাইভে মাসিক রিপোর্ট সেভ করুন"
          >
            {uploadingDrive ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>ড্রাইভে সেভ হচ্ছে...</span>
              </>
            ) : driveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>ড্রাইভে সেভ হয়েছে!</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 text-blue-200" />
                <span>ড্রাইভে সেভ</span>
              </>
            )}
          </button>

          {/* Send via Email Button */}
          <button
            onClick={handleSendEmail}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700"
            title="ইমেইলে সারসংক্ষেপ পাঠান"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">ইমেইল</span>
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition ml-1"
            title="উইন্ডো বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drive Success Alert Banner */}
        {driveSuccess && (
          <div className="w-full mt-2 p-3 bg-emerald-900/90 border border-emerald-500 text-emerald-100 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{driveSuccess}</span>
          </div>
        )}
      </div>

      {/* A4 Sheet Container - Exactly 210mm x 297mm min-height */}
      <div
        ref={reportRef}
        id="a4-report-content"
        className="a4-page bg-white text-slate-900 shadow-2xl border border-slate-300 print:border-none print:shadow-none font-sans"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '14mm 14mm 16mm 14mm',
          boxSizing: 'border-box'
        }}
      >
        
        {/* Company Letterhead Header */}
        <div className="border-b-2 border-emerald-800 pb-5 text-center relative">
          
          <div className="flex items-center justify-between gap-4 mb-2">
            {/* Left: Organization Logo */}
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-contain p-0.5 rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl">
                  {company.name ? company.name.substring(0, 2) : 'DB'}
                </div>
              )}
            </div>

            {/* Center: Business Name & Title */}
            <div className="flex-1 text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {company.name || 'DIP BHOLA NETWORK'}
              </h1>
              {company.subTitle && (
                <p className="text-xs sm:text-sm text-emerald-800 font-semibold mt-0.5">
                  {company.subTitle}
                </p>
              )}
              <div className="mt-1 text-[11px] text-slate-600 flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5">
                {company.ownerName && (
                  <span>পরিচালক: <strong className="text-slate-800">{company.ownerName}</strong></span>
                )}
                {company.phone && (
                  <span>মোবাইল: <strong className="text-slate-800">{company.phone}</strong></span>
                )}
                {company.email && (
                  <span>ইমেইল: <strong className="text-slate-800">{company.email}</strong></span>
                )}
                {company.address && (
                  <span>ঠিকানা: <strong className="text-slate-800">{company.address}</strong></span>
                )}
              </div>
            </div>

            {/* Right: Certified Official Stamp Badge */}
            <div className="w-16 h-16 shrink-0 flex flex-col items-center justify-center text-emerald-800 border-2 border-dashed border-emerald-300 rounded-xl p-1 bg-emerald-50/50 text-[9px] font-bold text-center leading-tight">
              <ShieldCheck className="w-5 h-5 text-emerald-700 mb-0.5" />
              <span>অফিসিয়াল রিপোর্ট</span>
            </div>
          </div>

          {/* Statement Subject Banner */}
          <div className="mt-3 inline-flex items-center gap-2 bg-emerald-800 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-xs">
            <span>মাসিক পূর্ণাঙ্গ আয়-ব্যয় হিসাব বিবরণী</span>
            <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
            <span>হিসাবের মাস: {formatBnMonthYear(selectedMonth)}</span>
          </div>

          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>রিপোর্ট তৈরির সময়: {new Date().toLocaleDateString('bn-BD')} {new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>মুদ্রা: বাংলাদেশি টাকা (৳ BDT)</span>
            <span>পৃষ্ঠা: A4 সাইজ স্টেটমেন্ট</span>
          </div>
        </div>

        {/* Executive Summary Cards (3 Columns) */}
        <div className="my-5 grid grid-cols-3 gap-3 text-center">
          
          {/* Card 1: Total Cash In / Income */}
          <div className="border border-emerald-300 bg-emerald-50/70 p-3 rounded-xl shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-0.5">
              মোট আয় / জমা (Cash In)
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 block">
              {formatBnCurrency(totalIncome)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              নগদ: ৳{cashIncome.toLocaleString('en-IN')} • ডিজিটাল: ৳{digitalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Card 2: Total Cash Out / Expense */}
          <div className="border border-rose-300 bg-rose-50/70 p-3 rounded-xl shadow-2xs">
            <span className="text-[10px] font-bold text-rose-800 uppercase block mb-0.5">
              মোট ব্যয় / খরচ (Cash Out)
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-700 block">
              {formatBnCurrency(totalExpense)}
            </span>
            <span className="text-[10px] text-rose-600 font-medium">
              নগদ: ৳{cashExpense.toLocaleString('en-IN')} • ডিজিটাল: ৳{digitalExpense.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Card 3: Net Balance / Cash in Hand */}
          <div className={`border p-3 rounded-xl shadow-2xs ${
            netBalance >= 0 ? 'border-teal-300 bg-teal-50/70' : 'border-amber-300 bg-amber-50/70'
          }`}>
            <span className="text-[10px] font-bold text-slate-800 uppercase block mb-0.5">
              {netBalance >= 0 ? 'নিট ক্যাশ উদ্বৃত্ত (Cash Balance)' : 'নিট ঘাটতি / লোকসান'}
            </span>
            <span className={`text-lg sm:text-xl font-black block ${netBalance >= 0 ? 'text-teal-700' : 'text-amber-700'}`}>
              {formatBnCurrency(Math.abs(netBalance))}
            </span>
            <span className="text-[10px] text-slate-600 font-medium">
              মোট {formatBnNumber(filtered.length)} টি এন্ট্রির ব্যালেন্স
            </span>
          </div>
        </div>

        {/* Itemized Transactions Table */}
        <div className="space-y-2">
          
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold px-1">
            <span className="uppercase tracking-wider">
              লেনদেনের ক্রমিক হিসাব খাতা ({formatBnNumber(filtered.length)} টি রেকর্ড):
            </span>
            <span className="text-slate-500 text-[11px] font-normal">
              চলতি মাস: {formatBnMonthYear(selectedMonth)}
            </span>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
                <tr>
                  <th className="py-2 px-2.5 text-center w-9 border-r border-slate-200">ক্রম</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 w-20">তারিখ</th>
                  <th className="py-2 px-2.5 border-r border-slate-200">বিবরণ / লেনদেন খাত</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 w-28">ক্যাটাগরি</th>
                  <th className="py-2 px-2 text-center border-r border-slate-200 w-16">মাধ্যম</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 w-24">এন্ট্রিদাতা</th>
                  <th className="py-2 px-2.5 text-right border-r border-slate-200 text-emerald-900 w-24">জমা (৳)</th>
                  <th className="py-2 px-2.5 text-right text-rose-900 w-24">খরচ (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                      এই মাসে কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx, idx) => (
                    <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="py-1.5 px-2.5 text-center text-slate-500 font-medium border-r border-slate-200">
                        {formatBnNumber(idx + 1)}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-700 font-medium whitespace-nowrap border-r border-slate-200">
                        {formatBnDate(tx.date)}
                      </td>
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900 border-r border-slate-200">
                        {tx.title}
                        {tx.note && (
                          <span className="block text-[10px] text-slate-500 font-normal leading-tight">
                            মন্তব্য: {tx.note}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-600 whitespace-nowrap border-r border-slate-200">
                        {tx.category}
                      </td>
                      <td className="py-1.5 px-2 text-center text-slate-600 whitespace-nowrap border-r border-slate-200">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 font-medium">
                          {getPaymentMethodLabel(tx.paymentMethod)}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-800 font-medium whitespace-nowrap border-r border-slate-200 truncate max-w-24">
                        {tx.addedBy}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-emerald-800 whitespace-nowrap border-r border-slate-200">
                        {tx.type === 'income' ? formatBnNumber(tx.amount.toLocaleString('en-IN')) : '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-rose-700 whitespace-nowrap">
                        {tx.type === 'expense' ? formatBnNumber(tx.amount.toLocaleString('en-IN')) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                <tr>
                  <td colSpan={6} className="py-2 px-3 text-right border-r border-slate-300">
                    মাসিক সর্বমোট হিসাব (Total Sum):
                  </td>
                  <td className="py-2 px-2.5 text-right text-emerald-800 font-extrabold border-r border-slate-300 whitespace-nowrap">
                    {formatBnCurrency(totalIncome)}
                  </td>
                  <td className="py-2 px-2.5 text-right text-rose-800 font-extrabold whitespace-nowrap">
                    {formatBnCurrency(totalExpense)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/70 border-t border-emerald-200">
                  <td colSpan={6} className="py-2 px-3 text-right font-extrabold text-emerald-950 border-r border-emerald-200">
                    মাসিক প্রকৃত ক্যাশ ইন হ্যান্ড / স্থিতি (Net Surplus):
                  </td>
                  <td colSpan={2} className={`py-2 px-3 text-right text-sm font-black whitespace-nowrap ${
                    netBalance >= 0 ? 'text-teal-900' : 'text-amber-800'
                  }`}>
                    {formatBnCurrency(netBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Official Signatures & Seal Section */}
        <div className="pt-12 pb-4 mt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto pt-1 font-semibold text-slate-800">
              হিসাব প্রস্তুতকারীর স্বাক্ষর
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">ম্যানেজার / ক্যাশিয়ার</span>
            <span className="text-[10px] text-slate-400">তারিখ: ____________</span>
          </div>

          <div>
            <div className="border-t border-slate-400 w-48 mx-auto pt-1 font-bold text-emerald-950">
              মালিক / পরিচালকের স্বাক্ষর ও সীল
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{company.ownerName || 'ব্যবসা পরিচালক'}</span>
            <span className="text-[10px] text-slate-400">তারিখ: ____________</span>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span>{company.name || 'DIP BHOLA NETWORK'} ডিজিটাল হিসাব খাতা সিস্টেম</span>
          <span>A4 Portrait • অফিসিয়াল অডিট কপি</span>
          <span>www.dipbholanetwork.com</span>
        </div>

      </div>
    </div>
  );
};
