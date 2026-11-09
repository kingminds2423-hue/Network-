import React, { useState, useEffect, useCallback } from 'react';
import { CompanyInfo, Staff, Transaction, CustomerDue } from './types.ts';
import { api, AppStateResponse } from './services/api.ts';
import { StorageService } from './services/storage.ts';
import { Navbar } from './components/Navbar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { StaffListView } from './components/StaffListView.tsx';
import { AddStaffView } from './components/AddStaffView.tsx';
import { StaffCvModal } from './components/StaffCvModal.tsx';
import { DueKhataView } from './components/DueKhataView.tsx';
import { CompanyModal } from './components/CompanyModal.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { PrintReportModal } from './components/PrintReportModal.tsx';
import { BackupModal } from './components/BackupModal.tsx';
import { PartnersInvestmentView } from './components/PartnersInvestmentView.tsx';
import { PWAInstallModal } from './components/PWAInstallModal.tsx';
import { StaffInviteModal } from './components/StaffInviteModal.tsx';
import { checkAndTriggerAutoBackup } from './services/googleDrive.ts';

export default function App() {
  // User Authentication State with session persistence
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: 'admin' | 'manager' | 'cashier' | 'viewer' | 'staff';
    id?: string;
    phone?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('hk_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAdmin = currentUser?.role === 'admin';
  const isManager = isAdmin || currentUser?.role === 'manager';
  const isCashier = isManager || currentUser?.role === 'cashier';

  // Business Data States - Immediate synchronous initialization (0ms instant page load!)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => StorageService.getCompanyInfo());
  const [adminPin, setAdminPin] = useState<string>(() => StorageService.getAdminPin());
  const [adminPhone, setAdminPhone] = useState<string>('01700000000');
  const [staffs, setStaffs] = useState<Staff[]>(() => StorageService.getStaffs());
  const [transactions, setTransactions] = useState<Transaction[]>(() => StorageService.getTransactions());
  const [customerDues, setCustomerDues] = useState<CustomerDue[]>(() => StorageService.getDues());

  // Navigation & Modal States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'add-staff' | 'dues' | 'partners'>('dashboard');
  const [selectedStaffCv, setSelectedStaffCv] = useState<Staff | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState<boolean>(false);
  const [isChangingAdminPin, setIsChangingAdminPin] = useState<boolean>(false);
  const [isOpenPrintReport, setIsOpenPrintReport] = useState<boolean>(false);
  const [isOpenBackupModal, setIsOpenBackupModal] = useState<boolean>(false);
  const [isOpenPWAInstallModal, setIsOpenPWAInstallModal] = useState<boolean>(false);
  const [isOpenStaffInviteModal, setIsOpenStaffInviteModal] = useState<boolean>(false);

  // Month Filter (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  // Background Cloud & Server Sync
  const refreshState = useCallback(async () => {
    try {
      const data: AppStateResponse = await api.getState();
      if (data) {
        if (data.company) setCompanyInfo(data.company);
        if (data.adminPin) setAdminPin(data.adminPin);
        if (data.adminPhone) setAdminPhone(data.adminPhone);
        if (Array.isArray(data.staffs)) setStaffs(data.staffs);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.customerDues)) setCustomerDues(data.customerDues);
      }
    } catch (err) {
      console.warn('Background sync paused:', err);
    }
  }, []);

  // Background live polling so owner and staff see entries in real time
  useEffect(() => {
    refreshState();

    const interval = setInterval(() => {
      refreshState();
    }, 3500);

    return () => {
      clearInterval(interval);
    };
  }, [refreshState]);

  // Background Auto Backup Trigger for Google Drive
  useEffect(() => {
    if (isAdmin && transactions.length > 0) {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyTx = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
      checkAndTriggerAutoBackup(() => api.exportDatabase(), currentMonth, monthlyTx).catch(() => {});
    }
  }, [isAdmin, transactions.length]);

  // Handle Login
  const handleLoginSuccess = (user: { name: string; role: 'admin' | 'staff'; id?: string; phone?: string }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('hk_session_user', JSON.stringify(user));
    } catch {}
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('hk_session_user');
    } catch {}
    setActiveTab('dashboard');
  };

  // Handle Staff PIN update (Admin)
  const handleUpdateStaffPin = async (staffId: string, newPin: string) => {
    try {
      await api.updateStaff(staffId, { pin: newPin });
      await refreshState();
    } catch (err: any) {
      alert(err.message || 'পিন আপডেট করা যায়নি');
    }
  };

  // Handle Staff Delete (Admin)
  const handleDeleteStaff = async (staffId: string) => {
    try {
      await api.deleteStaff(staffId);
      await refreshState();
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলা যায়নি');
    }
  };

  // Handle Save Company Info
  const handleSaveCompany = async (updated: CompanyInfo) => {
    await api.updateCompany(updated);
    setCompanyInfo(updated);
  };

  // Handle Save Admin PIN
  const handleSaveAdminPin = async (oldPin: string, newPin: string) => {
    const res = await api.changeAdminPin(oldPin, newPin);
    if (res.success) {
      setAdminPin(newPin);
    }
    return res;
  };

  // If Not Logged In, Show Login View
  if (!currentUser) {
    return (
      <>
        <LoginView
          company={companyInfo}
          adminPhone={adminPhone}
          adminPin={adminPin}
          staffs={staffs}
          onOpenInstallApp={() => setIsOpenPWAInstallModal(true)}
          onLoginSuccess={handleLoginSuccess}
        />
        <PWAInstallModal
          isOpen={isOpenPWAInstallModal}
          onClose={() => setIsOpenPWAInstallModal(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        company={companyInfo}
        currentUser={currentUser}
        isAdmin={isAdmin}
        isManager={isManager}
        isCashier={isCashier}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenCompanySetup={() => isAdmin && setIsEditingCompany(true)}
        onOpenChangeAdminPin={() => isAdmin && setIsChangingAdminPin(true)}
        onOpenPrintReport={() => isManager && setIsOpenPrintReport(true)}
        onOpenBackupModal={() => isAdmin && setIsOpenBackupModal(true)}
        onOpenInstallApp={() => setIsOpenPWAInstallModal(true)}
        onOpenStaffInvite={() => setIsOpenStaffInviteModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Daily Accounts & Remote Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            staffs={staffs}
            company={companyInfo}
            currentUser={currentUser}
            isAdmin={isAdmin}
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
            onRefresh={refreshState}
            onOpenPrintReport={() => isManager && setIsOpenPrintReport(true)}
            onOpenStaffInvite={() => setIsOpenStaffInviteModal(true)}
          />
        )}

        {/* Tab 2: Staffs & CV Viewer (Manager & Admin) */}
        {isManager && activeTab === 'staff' && (
          <StaffListView
            staffs={staffs}
            company={companyInfo}
            isAdmin={isAdmin}
            onOpenCv={(staff) => setSelectedStaffCv(staff)}
            onAddNewStaff={() => setActiveTab('add-staff')}
            onOpenStaffInvite={() => setIsOpenStaffInviteModal(true)}
            onUpdateStaffPin={handleUpdateStaffPin}
            onDeleteStaff={handleDeleteStaff}
          />
        )}

        {/* Tab 3: Recruit New Staff (Admin Only) */}
        {isAdmin && activeTab === 'add-staff' && (
          <AddStaffView
            onSuccess={() => {
              refreshState();
              setActiveTab('staff');
            }}
            onCancel={() => setActiveTab('staff')}
          />
        )}

        {/* Tab 4: Customer Dues & Payment Ledger (Cashier, Manager, Admin) */}
        {isCashier && activeTab === 'dues' && (
          <DueKhataView
            customerDues={customerDues}
            isAdmin={isAdmin}
            onRefresh={refreshState}
          />
        )}

        {/* Tab 5: Partners & Investment Dashboard (Manager & Admin) */}
        {isManager && activeTab === 'partners' && (
          <PartnersInvestmentView
            company={companyInfo}
            onRefresh={refreshState}
            isAdmin={isAdmin}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 no-print">
        <p>
          © 2026 {companyInfo.name || 'DIP BHOLA NETWORK'} | {companyInfo.ownerName ? `ব্যবসা পরিচালক: ${companyInfo.ownerName} | ` : ''} 
          স্বত্বাধিকার সংরক্ষিত।
        </p>
      </footer>

      {/* MODAL 1: Full Staff CV & Bio-data Print (Director Only) */}
      {isAdmin && selectedStaffCv && (
        <StaffCvModal
          staff={selectedStaffCv}
          company={companyInfo}
          onClose={() => setSelectedStaffCv(null)}
        />
      )}

      {/* MODAL 2: Company Setup & Logo Upload (Director Only) */}
      {isAdmin && isEditingCompany && (
        <CompanyModal
          company={companyInfo}
          onSave={handleSaveCompany}
          onClose={() => setIsEditingCompany(false)}
        />
      )}

      {/* MODAL 3: Admin PIN Change (Director Only) */}
      {isAdmin && isChangingAdminPin && (
        <AdminPinModal
          onSavePin={handleSaveAdminPin}
          onClose={() => setIsChangingAdminPin(false)}
        />
      )}

      {/* MODAL 4: Monthly Statement Print & Direct PDF Download (Manager & Director) */}
      {(isAdmin || isManager) && isOpenPrintReport && (
        <PrintReportModal
          transactions={transactions}
          company={companyInfo}
          selectedMonth={selectedMonth}
          onClose={() => setIsOpenPrintReport(false)}
        />
      )}

      {/* MODAL 5: Database Backup & Restore (Director Only) */}
      {isAdmin && isOpenBackupModal && (
        <BackupModal
          onRefresh={refreshState}
          onClose={() => setIsOpenBackupModal(false)}
        />
      )}

      {/* MODAL 6: Mobile PWA Install / Download */}
      <PWAInstallModal
        isOpen={isOpenPWAInstallModal}
        onClose={() => setIsOpenPWAInstallModal(false)}
      />

      {/* MODAL 7: Staff Invite QR & Live Link */}
      <StaffInviteModal
        isOpen={isOpenStaffInviteModal}
        onClose={() => setIsOpenStaffInviteModal(false)}
        company={companyInfo}
      />

    </div>
  );
}
