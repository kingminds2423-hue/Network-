import React, { useState } from 'react';
import { Partner, CompanyInfo, PartnerInvestmentEntry } from '../types.ts';
import { api } from '../services/api.ts';
import { formatBnCurrency, formatBnNumber, formatBnDate } from '../utils/bengali.ts';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  PieChart, 
  ShieldCheck, 
  Phone, 
  Calendar, 
  Building2, 
  Check, 
  X, 
  AlertCircle, 
  FileText, 
  Clock, 
  TrendingUp, 
  User,
  Zap,
  Sparkles
} from 'lucide-react';

interface PartnersInvestmentViewProps {
  company: CompanyInfo;
  onRefresh: () => Promise<void>;
  isAdmin: boolean;
}

export const PartnersInvestmentView: React.FC<PartnersInvestmentViewProps> = ({ company, onRefresh, isAdmin }) => {
  const partners = company.partners || [];

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  
  const [selectedPartnerForInvestment, setSelectedPartnerForInvestment] = useState<Partner | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Helper to compute a partner's total investment across all time
  const getPartnerTotalInv = (p: Partner): number => {
    if (p.investmentHistory && p.investmentHistory.length > 0) {
      return p.investmentHistory.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
    }
    return Number(p.investment) || 0;
  };

  // Grand total investment across all partners
  const totalInvestment = partners.reduce((sum, p) => sum + getPartnerTotalInv(p), 0);

  // Auto-calculate share percentage for all partners strictly from their investment
  const autoSyncAllShares = (partnersList: Partner[]): Partner[] => {
    const grandTotal = partnersList.reduce((sum, p) => {
      const pTot = (p.investmentHistory && p.investmentHistory.length > 0)
        ? p.investmentHistory.reduce((s, h) => s + (Number(h.amount) || 0), 0)
        : (Number(p.investment) || 0);
      return sum + pTot;
    }, 0);

    return partnersList.map(p => {
      const pTot = (p.investmentHistory && p.investmentHistory.length > 0)
        ? p.investmentHistory.reduce((s, h) => s + (Number(h.amount) || 0), 0)
        : (Number(p.investment) || 0);
      const autoShare = grandTotal > 0 ? Number(((pTot / grandTotal) * 100).toFixed(2)) : 0;
      return {
        ...p,
        investment: pTot,
        sharePercentage: autoShare
      };
    });
  };

  // Partner basic info form
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    phone: '',
    initialInvestment: '',
    role: 'অংশীদার'
  });

  // Timed investment entry form
  const [investmentForm, setInvestmentForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    amount: '',
    note: 'মূলধন বৃদ্ধি / নতুন বিনিয়োগ'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // One-click Auto Sync All Shares based on Investment
  const handleAutoSyncShares = async () => {
    setLoading(true);
    try {
      const updated = autoSyncAllShares(partners);
      await api.updateCompany({ ...company, partners: updated });
      await onRefresh();
      setSuccessMsg('সকল অংশীদারের শেয়ার রেশিও তাদের বিনিয়োগ অনুপাতে সফলভাবে ১০০% অটো সিঙ্ক হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'অটো সিঙ্ক করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  // Partner Modal Handlers
  const handleOpenAddPartner = () => {
    setEditingPartner(null);
    setPartnerForm({ name: '', phone: '', initialInvestment: '', role: 'অংশীদার' });
    setErrorMsg('');
    setIsPartnerModalOpen(true);
  };

  const handleOpenEditPartner = (p: Partner) => {
    setEditingPartner(p);
    const pTotal = getPartnerTotalInv(p);
    setPartnerForm({
      name: p.name,
      phone: p.phone || '',
      initialInvestment: String(pTotal || ''),
      role: p.role || 'অংশীদার'
    });
    setErrorMsg('');
    setIsPartnerModalOpen(true);
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!partnerForm.name.trim()) {
      setErrorMsg('অংশীদারের নাম আবশ্যক!');
      return;
    }

    setLoading(true);
    try {
      let updatedPartners = [...partners];
      const initInvNum = Number(partnerForm.initialInvestment) || 0;

      if (editingPartner) {
        updatedPartners = updatedPartners.map(p => {
          if (p.id === editingPartner.id) {
            // Check if investment changed in edit
            let history = p.investmentHistory || [];
            if (initInvNum > 0 && history.length === 0) {
              history = [{
                id: 'inv-' + Date.now(),
                date: new Date().toISOString().substring(0, 10),
                amount: initInvNum,
                note: 'প্রাথমিক বিনিয়োগ'
              }];
            }
            return {
              ...p,
              name: partnerForm.name,
              phone: partnerForm.phone,
              role: partnerForm.role,
              investment: initInvNum > 0 ? initInvNum : p.investment,
              investmentHistory: history
            };
          }
          return p;
        });
      } else {
        const newPartner: Partner = {
          id: 'p-' + Date.now(),
          name: partnerForm.name,
          phone: partnerForm.phone,
          investment: initInvNum,
          sharePercentage: 0,
          role: partnerForm.role,
          investmentHistory: initInvNum > 0 ? [
            {
              id: 'inv-' + Date.now(),
              date: new Date().toISOString().substring(0, 10),
              amount: initInvNum,
              note: 'প্রাথমিক মূলধন বিনিয়োগ'
            }
          ] : []
        };
        updatedPartners.push(newPartner);
      }

      // Automatically compute investment-based share ratios for all partners!
      updatedPartners = autoSyncAllShares(updatedPartners);

      await api.updateCompany({ ...company, partners: updatedPartners });
      await onRefresh();
      setSuccessMsg(editingPartner ? 'অংশীদারের তথ্য সফলভাবে আপডেট হয়েছে!' : 'নতুন অংশীদার যুক্ত হয়েছে এবং শেয়ার রেশিও অটো ক্যালকুলেট হয়েছে!');
      setIsPartnerModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'সেভ করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  // Open Timed Investment Modal for a Partner
  const handleOpenAddInvestment = (partner: Partner) => {
    setSelectedPartnerForInvestment(partner);
    setInvestmentForm({
      date: new Date().toISOString().substring(0, 10),
      amount: '',
      note: 'মূলধন বৃদ্ধি / নতুন বিনিয়োগ'
    });
    setErrorMsg('');
    setIsInvestmentModalOpen(true);
  };

  // Submit Date-wise Investment Entry
  const handleInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerForInvestment) return;
    setErrorMsg('');

    const amountNum = Number(investmentForm.amount) || 0;
    if (amountNum <= 0) {
      setErrorMsg('সঠিক টাকার পরিমাণ প্রদান করুন!');
      return;
    }

    setLoading(true);
    try {
      const newEntry: PartnerInvestmentEntry = {
        id: 'inv-' + Date.now(),
        date: investmentForm.date,
        amount: amountNum,
        note: investmentForm.note || 'মূলধন বিনিয়োগ'
      };

      let updatedPartners = partners.map(p => {
        if (p.id === selectedPartnerForInvestment.id) {
          const history = p.investmentHistory || [];
          const newHistory = [newEntry, ...history];
          const newTotal = newHistory.reduce((sum, item) => sum + Number(item.amount), 0);
          return {
            ...p,
            investment: newTotal,
            investmentHistory: newHistory
          };
        }
        return p;
      });

      // Automatically recalculate share ratios for all partners based on investment
      updatedPartners = autoSyncAllShares(updatedPartners);

      await api.updateCompany({ ...company, partners: updatedPartners });
      await onRefresh();
      setSuccessMsg(`'${selectedPartnerForInvestment.name}' এর জন্য ${formatBnCurrency(amountNum)} নতুন বিনিয়োগ যুক্ত হয়েছে এবং সকল অংশীদারের শেয়ার রেশিও অটো আপডেট হয়েছে!`);
      setIsInvestmentModalOpen(false);
      setSelectedPartnerForInvestment(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'বিনিয়োগ এন্ট্রি যুক্ত করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  // Delete Investment Entry
  const handleDeleteInvestmentEntry = async (partnerId: string, entryId: string) => {
    if (!window.confirm('আপনি কি এই বিনিয়োগ এন্ট্রিটি মুছে ফেলতে চান?')) return;
    try {
      let updatedPartners = partners.map(p => {
        if (p.id === partnerId) {
          const history = (p.investmentHistory || []).filter(e => e.id !== entryId);
          const newTotal = history.reduce((sum, item) => sum + Number(item.amount), 0);
          return {
            ...p,
            investment: newTotal,
            investmentHistory: history
          };
        }
        return p;
      });

      // Auto-recalculate shares
      updatedPartners = autoSyncAllShares(updatedPartners);

      await api.updateCompany({ ...company, partners: updatedPartners });
      await onRefresh();
      setSuccessMsg('বিনিয়োগ এন্ট্রি মুছে ফেলা হয়েছে এবং শেয়ার রেশিও অটো আপডেট হয়েছে।');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলা যায়নি');
    }
  };

  // Delete Partner
  const handleDeletePartner = async (partnerId: string, name: string) => {
    if (!window.confirm(`আপনি কি '${name}' অংশীদারকে তালিকা থেকে বাদ দিতে চান?`)) return;
    try {
      let updatedPartners = partners.filter(p => p.id !== partnerId);
      updatedPartners = autoSyncAllShares(updatedPartners);
      await api.updateCompany({ ...company, partners: updatedPartners });
      await onRefresh();
      setSuccessMsg(`'${name}' অংশীদার মুছে ফেলা হয়েছে এবং শেয়ার রেশিও অটো সমন্বয় হয়েছে।`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলা সম্ভব হয়নি');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xs border border-white/20 shrink-0">
            <PieChart className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">অংশীদার ও মূলধন বিনিয়োগ ড্যাশবোর্ড</h1>
              <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Auto Share Ratio
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1">
              মূলধন বিনিয়োগের (Investment) ভিত্তিতে প্রত্যেকের শেয়ার রেশিও স্বয়ংক্রিয়ভাবে হিসাব ও প্রদর্শিত হয়।
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoSyncShares}
              disabled={loading || partners.length === 0}
              className="bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-emerald-600/50 shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="বিনিয়োগ অনুপাতে সবার শেয়ার রেশিও অটো রি-ক্যালকুলেট করুন"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>অটো রেশিও সিঙ্ক</span>
            </button>

            <button
              onClick={handleOpenAddPartner}
              className="bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>নতুন অংশীদার যোগ</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">মোট অংশীদার সংখ্যা</span>
            <h3 className="text-xl font-extrabold text-slate-900">{formatBnNumber(partners.length)} জন</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">সর্বমোট যৌথ মূলধন (Total Capital)</span>
            <h3 className="text-xl font-extrabold text-teal-950">{formatBnCurrency(totalInvestment)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">শেয়ার রেশিও বণ্টন মডেল</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md text-sm">
                ১০০% অটো রেশিও
              </span>
              <span className="text-[11px] text-slate-500">বিনিয়োগ অনুপাতে</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partners Separate Dashboards List */}
      {partners.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-base">কোনো অংশীদারের তথ্য নেই</h4>
          <p className="text-xs text-slate-400 mt-1">প্রথমে নতুন অংশীদার যুক্ত করুন।</p>
        </div>
      ) : (
        <div className="space-y-6">
          {partners.map((partner) => {
            const history = partner.investmentHistory || [];
            const partnerTotalInv = getPartnerTotalInv(partner);
            
            // Auto calculate ratio strictly based on investment
            const autoShareRatio = totalInvestment > 0 
              ? ((partnerTotalInv / totalInvestment) * 100).toFixed(1) 
              : '0.0';

            return (
              <div 
                key={partner.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Partner Header Bar */}
                <div className="bg-slate-50 p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                      {partner.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-lg">{partner.name}</h3>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {partner.role || 'অংশীদার'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        {partner.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            {partner.phone}
                          </span>
                        )}
                        <span>•</span>
                        {/* Auto Show Share Ratio Badge */}
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 border border-emerald-300 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-lg text-xs">
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>শেয়ার রেশিও: {formatBnNumber(autoShareRatio)}%</span>
                          <span className="text-[9px] bg-emerald-700 text-white px-1 rounded uppercase font-bold">Auto</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">মোট মূলধন বিনিয়োগ</span>
                      <strong className="text-base sm:text-lg font-extrabold text-emerald-800">{formatBnCurrency(partnerTotalInv)}</strong>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenAddInvestment(partner)}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>বিনিয়োগ যোগ</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditPartner(partner)}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition cursor-pointer"
                          title="অংশীদার সম্পাদনা"
                        >
                          <Edit3 className="w-4 h-4 text-emerald-700" />
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner.id, partner.name)}
                          className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-xl border border-slate-300 transition cursor-pointer"
                          title="অংশীদার মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar showing share ratio out of total investment */}
                <div className="px-5 pt-3 pb-1 bg-white border-b border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                    <span className="text-slate-600 flex items-center gap-1">
                      <span>বিনিয়োগ মালিকানা রেশিও:</span>
                      <strong className="text-emerald-800 font-extrabold">{formatBnNumber(autoShareRatio)}%</strong>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {formatBnCurrency(partnerTotalInv)} / {formatBnCurrency(totalInvestment)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, Number(autoShareRatio)))}%` }}
                    />
                  </div>
                </div>

                {/* Partner Investment History Timeline Table */}
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>তারিখভিত্তিক বিনিয়োগ ইতিহাস ও রেকর্ড (Investment History Timeline)</span>
                  </h4>

                  {history.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                      এই অংশীদারের জন্য কোনো তারিখভিত্তিক আলাদা বিনিয়োগ এন্ট্রি নেই। (প্রাথমিক বিনিয়োগ: {formatBnCurrency(partner.investment || 0)})
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider">
                            <th className="p-3 rounded-l-lg">তারিখ</th>
                            <th className="p-3">বিবরণ / নোট</th>
                            <th className="p-3 text-right">বিনিয়োগের পরিমাণ</th>
                            {isAdmin && <th className="p-3 text-center rounded-r-lg">অ্যাকশন</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {history.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/80">
                              <td className="p-3 text-slate-800 font-semibold flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                {formatBnDate(inv.date)}
                              </td>
                              <td className="p-3 text-slate-600">{inv.note || 'মূলধন বিনিয়োগ'}</td>
                              <td className="p-3 text-right font-bold text-emerald-800">{formatBnCurrency(inv.amount)}</td>
                              {isAdmin && (
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteInvestmentEntry(partner.id, inv.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                    title="এন্ট্রি মুছুন"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add/Edit Partner Basic Info */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingPartner ? 'অংশীদারের তথ্য সম্পাদন করুন' : 'নতুন অংশীদার যুক্ত করুন'}
                </h3>
                <p className="text-xs text-emerald-200">বিনিয়োগ অনুযায়ী শেয়ার রেশিও অটো নির্ধারিত হবে</p>
              </div>
              <button onClick={() => setIsPartnerModalOpen(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePartnerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অংশীদারের পুরো নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ জাহিদুল ইসলাম"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={partnerForm.phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পদবী বা ব্যবসায়িক ভূমিকা</label>
                <input
                  type="text"
                  placeholder="যেমন: প্রধান পরিচালক / ব্যবস্থাপনা অংশীদার"
                  value={partnerForm.role}
                  onChange={(e) => setPartnerForm({ ...partnerForm, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingPartner ? 'মোট বিনিয়োগকৃত মূলধন (টাকা ৳)' : 'প্রাথমিক বিনিয়োগকৃত মূলধন (টাকা ৳)'}
                </label>
                <input
                  type="number"
                  placeholder="যেমন: 100000"
                  value={partnerForm.initialInvestment}
                  onChange={(e) => setPartnerForm({ ...partnerForm, initialInvestment: e.target.value })}
                  className="w-full px-3 py-2.5 border border-emerald-400 rounded-xl text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                />
                
                {/* Live Preview of Auto Share Ratio */}
                {(() => {
                  const inputVal = Number(partnerForm.initialInvestment) || 0;
                  const estimatedGrand = editingPartner 
                    ? Math.max(1, (totalInvestment - getPartnerTotalInv(editingPartner) + inputVal))
                    : (totalInvestment + inputVal);
                  const previewRatio = estimatedGrand > 0 ? ((inputVal / estimatedGrand) * 100).toFixed(1) : '0.0';

                  return (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">বিনিয়োগ অনুযায়ী অটো শেয়ার রেশিও:</span>
                      <strong className="text-emerald-800 font-black text-sm">{formatBnNumber(previewRatio)}%</strong>
                    </div>
                  );
                })()}
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Date-wise Investment for a Partner */}
      {isInvestmentModalOpen && selectedPartnerForInvestment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">তারিখ অনুযায়ী নতুন বিনিয়োগ যোগ করুন</h3>
                <p className="text-xs text-emerald-200">অংশীদার: {selectedPartnerForInvestment.name}</p>
              </div>
              <button onClick={() => setIsInvestmentModalOpen(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvestmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">তারিখ (Date) *</label>
                <input
                  type="date"
                  required
                  value={investmentForm.date}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">বিনিয়োগকৃত টাকার পরিমাণ (টাকা ৳) *</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: 50000"
                  value={investmentForm.amount}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-emerald-500 rounded-xl text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                />

                {/* Dynamic Preview of New Auto Share Ratio */}
                {(() => {
                  const addAmt = Number(investmentForm.amount) || 0;
                  const currentPInv = getPartnerTotalInv(selectedPartnerForInvestment);
                  const newPInv = currentPInv + addAmt;
                  const newGrand = totalInvestment + addAmt;
                  const newRatio = newGrand > 0 ? ((newPInv / newGrand) * 100).toFixed(1) : '0.0';

                  return (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">নতুন মোট বিনিয়োগের পর শেয়ার রেশিও:</span>
                      <strong className="text-emerald-800 font-black text-sm">{formatBnNumber(newRatio)}%</strong>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মন্তব্য বা নোট (Investment Note)</label>
                <input
                  type="text"
                  placeholder="যেমন: ২য় কিস্তি মূলধন জমা"
                  value={investmentForm.note}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, note: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvestmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'জমা হচ্ছে...' : 'বিনিয়োগ নিশ্চিত করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
