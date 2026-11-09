import React, { useState, useEffect } from 'react';
import { CompanyInfo } from '../types.ts';
import { 
  Building2, 
  Wallet, 
  Users, 
  UserPlus, 
  BookOpen, 
  Settings, 
  Lock, 
  LogOut, 
  Printer, 
  Download,
  User, 
  ShieldCheck,
  Briefcase,
  Database,
  PieChart,
  Smartphone,
  Flame,
  Maximize2,
  Minimize2,
  QrCode
} from 'lucide-react';

interface NavbarProps {
  company: CompanyInfo;
  currentUser: { name: string; role: 'admin' | 'manager' | 'cashier' | 'viewer' | 'staff'; phone?: string };
  isAdmin: boolean;
  isManager: boolean;
  isCashier: boolean;
  activeTab: 'dashboard' | 'staff' | 'add-staff' | 'dues' | 'partners';
  onChangeTab: (tab: 'dashboard' | 'staff' | 'add-staff' | 'dues' | 'partners') => void;
  onOpenCompanySetup: () => void;
  onOpenChangeAdminPin: () => void;
  onOpenPrintReport: () => void;
  onOpenBackupModal: () => void;
  onOpenInstallApp?: () => void;
  onOpenStaffInvite?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  company,
  currentUser,
  isAdmin,
  isManager,
  isCashier,
  activeTab,
  onChangeTab,
  onOpenCompanySetup,
  onOpenChangeAdminPin,
  onOpenPrintReport,
  onOpenBackupModal,
  onOpenInstallApp,
  onOpenStaffInvite,
  onLogout
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'পরিচালক / এডমিন';
      case 'manager': return 'ম্যানেজার';
      case 'cashier': return 'ক্যাশিয়ার';
      case 'viewer': return 'ভিউয়ার (Read-Only)';
      default: return 'স্টাফ';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-lg sticky top-0 z-30 no-print border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Top Brand Bar */}
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Company Name with Director Tag */}
          <div className="flex items-center space-x-3 min-w-0">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl object-contain bg-white p-1 border-2 border-emerald-400 shadow-md shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-13 sm:h-13 bg-emerald-700 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md border border-emerald-500 shrink-0">
                {company.name ? company.name.charAt(0) : 'হ'}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-xl truncate tracking-tight text-white">
                  {company.name || 'হিসাব খাতা'}
                </span>
                {company.ownerName && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/50">
                    <Briefcase className="w-3 h-3 text-emerald-400" />
                    <span>পরিচালক: <strong>{company.ownerName}</strong></span>
                  </span>
                )}
                <span className="hidden xl:inline-flex items-center gap-1.5 text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                  <span>Firebase Connected</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200 truncate">
                {company.subTitle || 'দৈনিক আয়-ব্যয় ও কেন্দ্রীয় স্টাফ মনিটরিং সিস্টেম'}
              </p>
            </div>
          </div>

          {/* User Status Badge & Direct Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">

            {/* Instant Fullscreen / Hide Browser Bar Button */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shadow-xs transition border border-emerald-600/50 cursor-pointer"
              title={isFullscreen ? 'ফুল স্ক্রিন বন্ধ করুন' : 'ক্রোম ব্রাউজারের ওপরের টপবার লুকান (অ্যাপ মোড)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">টপবার দেখান</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">ফুল স্ক্রিন (টপবার লুকান)</span>
                  <span className="sm:hidden">ফুল স্ক্রিন</span>
                </>
              )}
            </button>
            
            {/* Install / Download App on Mobile/PC Button (Hidden when running as installed WebAPK) */}
            {onOpenInstallApp && !isStandalone && (
              <button
                onClick={onOpenInstallApp}
                className="flex items-center gap-1.5 bg-emerald-700/90 hover:bg-emerald-600 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shadow-xs transition border border-emerald-500/40 cursor-pointer"
                title="ফোনে অ্যাপ্লিকেশন ডাউনলোড / ইনস্টল করুন"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">অ্যাপ ইনস্টল</span>
                <span className="sm:hidden">ইনস্টল</span>
              </button>
            )}

            {/* Staff Mobile Link & QR Code button (Manager & Admin) */}
            {isManager && onOpenStaffInvite && (
              <button
                onClick={onOpenStaffInvite}
                className="flex items-center gap-1.5 bg-teal-800/90 hover:bg-teal-700 text-teal-100 font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shadow-xs transition border border-teal-600/50 cursor-pointer"
                title="স্টাফদের জন্য মোবাইল লিংক ও QR কোড"
              >
                <QrCode className="w-3.5 h-3.5 text-teal-300" />
                <span className="hidden sm:inline">স্টাফ QR কোড</span>
                <span className="sm:hidden">QR</span>
              </button>
            )}

            {/* Quick PDF Report button (Manager & Admin) */}
            {isManager && (
              <button
                onClick={onOpenPrintReport}
                className="hidden md:flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition"
                title="মাসিক হিসাব PDF ডাউনলোড"
              >
                <Download className="w-3.5 h-3.5" />
                <span>মাসিক PDF</span>
              </button>
            )}

            {/* Admin / Director Controls */}
            {isAdmin && (
              <>
                <button
                  onClick={onOpenBackupModal}
                  className="hidden sm:flex items-center gap-1 bg-emerald-800/80 hover:bg-emerald-700 text-white font-medium px-2.5 py-1.5 rounded-xl text-xs border border-emerald-700 transition"
                  title="ডাটা ব্যাকআপ, রিস্টোর ও গুগল ড্রাইভ"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-300" />
                  <span>ব্যাকআপ ও ড্রাইভ</span>
                </button>

                <button
                  onClick={onOpenCompanySetup}
                  className="hidden sm:flex items-center gap-1 bg-emerald-800/80 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-xl text-xs border border-emerald-700 transition"
                  title="কোম্পানি লোগো ও নাম পরিবর্তন"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>কোম্পানি সেটআপ</span>
                </button>

                <button
                  onClick={onOpenChangeAdminPin}
                  className="hidden lg:flex items-center gap-1 bg-emerald-800/80 hover:bg-emerald-700 text-white font-medium px-2.5 py-1.5 rounded-xl text-xs border border-emerald-700 transition"
                  title="এডমিন পিন পরিবর্তন"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>এডমিন পিন</span>
                </button>
              </>
            )}

            {/* Profile Pill */}
            <div className="flex items-center gap-2 bg-emerald-950/60 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-800/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-white block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-emerald-300 font-medium">
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-900/40 hover:bg-red-800/80 text-red-200 hover:text-white text-xs font-bold transition flex items-center gap-1 border border-red-800/50"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>

          </div>

        </div>

        {/* Bottom Navigation Links Bar */}
        <div className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar border-t border-emerald-800/40 text-xs sm:text-sm">
          
          {/* Dashboard Tab */}
          <button
            onClick={() => onChangeTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>দৈনিক হিসাব ড্যাশবোর্ড</span>
          </button>

          {/* Staff List Tab (Manager & Admin) */}
          {isManager && (
            <button
              onClick={() => onChangeTab('staff')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>স্টাফ তালিকা ও সিভি</span>
            </button>
          )}

          {/* Add Staff Tab (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => onChangeTab('add-staff')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'add-staff'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
              <span>নতুন স্টাফ নিয়োগ</span>
            </button>
          )}

          {/* Dues Ledger Tab (Cashier, Manager & Admin) */}
          {isCashier && (
            <button
              onClick={() => onChangeTab('dues')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'dues'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>বাকি খাতা (লেজার)</span>
            </button>
          )}

          {/* Partners & Investment Tab (Manager & Admin) */}
          {isManager && (
            <button
              onClick={() => onChangeTab('partners')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'partners'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>অংশীদার ও মূলধন (Partners)</span>
            </button>
          )}

          {/* Mobile PDF Report button */}
          {isManager && (
            <button
              onClick={onOpenPrintReport}
              className="md:hidden px-3 py-1.5 rounded-lg font-bold text-amber-300 hover:bg-emerald-800/60 transition whitespace-nowrap flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>A4 মাসিক PDF</span>
            </button>
          )}

          {/* Mobile App Install button (hidden when already installed in standalone mode) */}
          {onOpenInstallApp && !isStandalone && (
            <button
              onClick={onOpenInstallApp}
              className="px-3 py-1.5 rounded-lg font-bold text-emerald-200 hover:bg-emerald-800/60 transition whitespace-nowrap flex items-center gap-1 cursor-pointer"
              title="ফোনে অ্যাপ্লিকেশন ডাউনলোড বা হোম স্ক্রিনে যুক্ত করুন"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
              <span>অ্যাপ ইনস্টল</span>
            </button>
          )}

          {/* Mobile Company setup button */}
          {isAdmin && (
            <button
              onClick={onOpenCompanySetup}
              className="sm:hidden px-3 py-1.5 rounded-lg font-bold text-emerald-200 hover:bg-emerald-800/60 transition whitespace-nowrap flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>কোম্পানি সেটআপ</span>
            </button>
          )}

        </div>

      </div>
    </nav>
  );
};
