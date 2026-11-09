import { CompanyInfo, Staff, Transaction, CustomerDue } from '../types.ts';
import { StorageService } from './storage.ts';

export interface AppStateResponse {
  company: CompanyInfo;
  adminPin: string;
  adminPhone: string;
  staffs: Staff[];
  transactions: Transaction[];
  customerDues: CustomerDue[];
}

export const api = {
  async getState(): Promise<AppStateResponse> {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.company) StorageService.saveCompanyInfo(data.company);
        if (data.adminPin) StorageService.saveAdminPin(data.adminPin);
        if (Array.isArray(data.staffs)) StorageService.saveStaffs(data.staffs);
        if (Array.isArray(data.transactions)) StorageService.saveTransactions(data.transactions);
        if (Array.isArray(data.customerDues)) StorageService.saveDues(data.customerDues);
        return data;
      }
    } catch (e) {
      console.warn('API /api/state unreachable, using local storage fallback:', e);
    }

    // Local storage fallback
    return {
      company: StorageService.getCompanyInfo(),
      adminPin: StorageService.getAdminPin(),
      adminPhone: '01700000000',
      staffs: StorageService.getStaffs(),
      transactions: StorageService.getTransactions(),
      customerDues: StorageService.getDues()
    };
  },

  async login(phone: string, pin: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });
      if (res.ok) {
        return await res.json();
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(data.message || 'মোবাইল নম্বর বা ৪ ডিজিট পিন সঠিক নয়!');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('পিন')) {
        throw err;
      }
    }

    // Fallback authentication
    const normalizePhone = (p: string | undefined | null) => {
      if (!p) return '';
      const bnMap: Record<string, string> = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
      };
      const converted = String(p).replace(/[০-৯]/g, (d) => bnMap[d] || d);
      const digits = converted.replace(/\D/g, '');
      return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    const normalizePin = (p: string | undefined | null) => {
      if (!p) return '';
      const bnMap: Record<string, string> = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
      };
      return String(p).replace(/[০-৯]/g, (d) => bnMap[d] || d).trim();
    };

    const adminPin = StorageService.getAdminPin();
    const company = StorageService.getCompanyInfo();
    const normPhone = normalizePhone(phone);
    const normPin = normalizePin(pin);

    const isAdmin =
      phone.toLowerCase().trim() === 'admin' ||
      (normPhone && (normPhone === normalizePhone(company.phone) || normPhone === '1700000000')) ||
      phone === company.phone;

    if (isAdmin && (normPin === normalizePin(adminPin) || String(pin).trim() === String(adminPin).trim())) {
      return {
        success: true,
        role: 'admin',
        user: {
          name: company.ownerName ? `${company.ownerName} (পরিচালক)` : 'জাহিদুল ইসলাম (পরিচালক)',
          role: 'admin',
          phone: company.phone || '01700000000'
        }
      };
    }

    const staffs = StorageService.getStaffs();
    const staff = staffs.find((s) => {
      if (s.status === 'inactive') return false;
      const sNorm = normalizePhone(s.phone);
      const sPin = normalizePin(s.pin);
      const matchPhone = (normPhone && sNorm && normPhone === sNorm) || s.phone === phone || s.email === phone;
      const matchPin = normPin === sPin || String(s.pin).trim() === String(pin).trim();
      return matchPhone && matchPin;
    });

    if (staff) {
      return {
        success: true,
        role: staff.role || 'staff',
        user: staff
      };
    }

    throw new Error('মোবাইল নম্বর বা ৪ ডিজিট পিন সঠিক নয়!');
  },

  async changeAdminPin(oldPin: string, newPin: string) {
    try {
      const res = await fetch('/api/auth/change-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPin, newPin })
      });
      if (res.ok) {
        StorageService.saveAdminPin(newPin);
        return await res.json();
      }
      const data = await res.json().catch(() => ({}));
      if (data.message) throw new Error(data.message);
    } catch (err: any) {
      if (err.message && (err.message.includes('বর্তমান') || err.message.includes('ডিজিট'))) {
        throw err;
      }
    }

    // Fallback
    const currentPin = StorageService.getAdminPin();
    if (String(currentPin) !== String(oldPin)) {
      throw new Error('বর্তমান এডমিন পিন সঠিক নয়!');
    }
    if (!newPin || String(newPin).length < 4) {
      throw new Error('নতুন পিন কমপক্ষে ৪ ডিজিটের হতে হবে!');
    }
    StorageService.saveAdminPin(String(newPin));
    return { success: true, message: 'এডমিন পিন সফলভাবে পরিবর্তন করা হয়েছে!' };
  },

  async updateCompany(companyData: Partial<CompanyInfo>) {
    try {
      const res = await fetch('/api/settings/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });
      if (res.ok) {
        const data = await res.json();
        StorageService.saveCompanyInfo(data.company);
        return data;
      }
    } catch {
      // ignore network errors and fallback
    }

    const current = StorageService.getCompanyInfo();
    const updated = { ...current, ...companyData };
    StorageService.saveCompanyInfo(updated);
    return { success: true, company: updated };
  },

  async addStaff(staffData: Partial<Staff>) {
    try {
      const res = await fetch('/api/staffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      if (res.ok) {
        const data = await res.json();
        const currentStaffs = StorageService.getStaffs();
        StorageService.saveStaffs([data.staff, ...currentStaffs]);
        return data;
      }
      const data = await res.json().catch(() => ({}));
      if (data.message) throw new Error(data.message);
    } catch (err: any) {
      if (err.message && (err.message.includes('নিবন্ধিত') || err.message.includes('আবশ্যক'))) {
        throw err;
      }
    }

    // Fallback
    const currentStaffs = StorageService.getStaffs();
    if (currentStaffs.some((s) => s.phone === staffData.phone)) {
      throw new Error('এই মোবাইল নম্বরে ইতিমধ্যে একজন স্টাফ নিবন্ধিত আছে!');
    }
    const newStaff: Staff = {
      id: 'staff-' + Date.now(),
      name: staffData.name || '',
      fatherName: staffData.fatherName || '',
      motherName: staffData.motherName || '',
      phone: staffData.phone || '',
      email: staffData.email || '',
      nid: staffData.nid || '',
      address: staffData.address || '',
      designation: staffData.designation || 'স্টাফ',
      salary: Number(staffData.salary) || 0,
      joinedAt: staffData.joinedAt || new Date().toISOString().substring(0, 10),
      photoUrl:
        staffData.photoUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staffData.name || 'staff')}`,
      pin: String(staffData.pin || '1234'),
      role: staffData.role || 'cashier',
      education: staffData.education || '',
      emergencyContact: staffData.emergencyContact || '',
      bloodGroup: staffData.bloodGroup || '',
      status: 'active'
    };
    StorageService.saveStaffs([newStaff, ...currentStaffs]);
    return { success: true, staff: newStaff };
  },

  async updateStaff(id: string, staffData: Partial<Staff>) {
    try {
      const res = await fetch(`/api/staffs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      if (res.ok) {
        const data = await res.json();
        const staffs = StorageService.getStaffs().map((s) => (s.id === id ? { ...s, ...staffData } : s));
        StorageService.saveStaffs(staffs);
        return data;
      }
    } catch {
      // fallback
    }

    const staffs = StorageService.getStaffs().map((s) => (s.id === id ? { ...s, ...staffData } : s));
    StorageService.saveStaffs(staffs);
    return { success: true, staff: staffs.find((s) => s.id === id) };
  },

  async deleteStaff(id: string) {
    try {
      const res = await fetch(`/api/staffs/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const staffs = StorageService.getStaffs().filter((s) => s.id !== id);
        StorageService.saveStaffs(staffs);
        return await res.json();
      }
    } catch {
      // fallback
    }

    const staffs = StorageService.getStaffs().filter((s) => s.id !== id);
    StorageService.saveStaffs(staffs);
    return { success: true, message: 'স্টাফ মুছে ফেলা হয়েছে' };
  },

  async addTransaction(txData: {
    type: 'income' | 'expense';
    date: string;
    title: string;
    category: string;
    amount: number;
    paymentMethod: string;
    addedBy: string;
    addedById?: string;
    note?: string;
  }) {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      if (res.ok) {
        const data = await res.json();
        const txs = StorageService.getTransactions();
        StorageService.saveTransactions([data.transaction, ...txs]);
        return data;
      }
      const data = await res.json().catch(() => ({}));
      if (data.message) throw new Error(data.message);
    } catch (err: any) {
      if (err.message && err.message.includes('বিবরণ')) throw err;
    }

    // Fallback
    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: txData.type,
      date: txData.date || new Date().toISOString().substring(0, 10),
      title: txData.title,
      category: txData.category,
      amount: Number(txData.amount),
      paymentMethod: txData.paymentMethod as any,
      addedBy: txData.addedBy,
      addedById: txData.addedById,
      note: txData.note,
      createdAt: new Date().toISOString()
    };
    const txs = StorageService.getTransactions();
    StorageService.saveTransactions([newTx, ...txs]);
    return { success: true, transaction: newTx };
  },

  async deleteTransaction(id: string) {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const txs = StorageService.getTransactions().filter((t) => t.id !== id);
        StorageService.saveTransactions(txs);
        return await res.json();
      }
    } catch {
      // fallback
    }

    const txs = StorageService.getTransactions().filter((t) => t.id !== id);
    StorageService.saveTransactions(txs);
    return { success: true, message: 'লেনদেন মুছে ফেলা হয়েছে' };
  },

  async addCustomerDue(
    customerName: string,
    phone: string,
    address: string,
    initialDue: number,
    notes: string
  ) {
    try {
      const res = await fetch('/api/dues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'new_customer',
          customerName,
          phone,
          address,
          initialDue,
          notes
        })
      });
      if (res.ok) {
        const data = await res.json();
        const dues = StorageService.getDues();
        StorageService.saveDues([data.due, ...dues]);
        return data;
      }
    } catch {
      // fallback
    }

    const newDue: CustomerDue = {
      id: 'due-' + Date.now(),
      customerName,
      phone,
      address,
      totalDue: Number(initialDue) || 0,
      paidAmount: 0,
      remainingDue: Number(initialDue) || 0,
      lastUpdated: new Date().toISOString().substring(0, 10),
      notes,
      history: [
        {
          date: new Date().toISOString().substring(0, 10),
          amount: Number(initialDue) || 0,
          type: 'due',
          note: 'প্রারম্ভিক বাকি খাতা শুরু'
        }
      ]
    };
    const dues = StorageService.getDues();
    StorageService.saveDues([newDue, ...dues]);
    return { success: true, due: newDue };
  },

  async addDuePayment(dueId: string, amount: number, type: 'due' | 'payment', note: string) {
    try {
      const res = await fetch('/api/dues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_entry',
          dueId,
          amount,
          type,
          note
        })
      });
      if (res.ok) {
        const data = await res.json();
        const dues = StorageService.getDues().map((d) => (d.id === dueId ? data.due : d));
        StorageService.saveDues(dues);
        return data;
      }
    } catch {
      // fallback
    }

    const dues = StorageService.getDues();
    const target = dues.find((d) => d.id === dueId);
    if (!target) throw new Error('কাস্টমার পাওয়া যায়নি');

    const numAmount = Number(amount) || 0;
    if (type === 'due') {
      target.totalDue += numAmount;
      target.remainingDue += numAmount;
    } else {
      target.paidAmount += numAmount;
      target.remainingDue = Math.max(0, target.remainingDue - numAmount);
    }
    target.lastUpdated = new Date().toISOString().substring(0, 10);
    target.history.unshift({
      date: new Date().toISOString().substring(0, 10),
      amount: numAmount,
      type: type === 'due' ? 'due' : 'payment',
      note: note || ''
    });
    StorageService.saveDues(dues);
    return { success: true, due: target };
  },

  async deleteCustomerDue(id: string) {
    try {
      const res = await fetch(`/api/dues/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const dues = StorageService.getDues().filter((d) => d.id !== id);
        StorageService.saveDues(dues);
        return await res.json();
      }
    } catch {
      // fallback
    }

    const dues = StorageService.getDues().filter((d) => d.id !== id);
    StorageService.saveDues(dues);
    return { success: true, message: 'বাকি রেকর্ড মুছে ফেলা হয়েছে' };
  },

  async exportDatabase() {
    try {
      const res = await fetch('/api/backup/export');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return JSON.parse(StorageService.exportFullBackup());
  },

  async importDatabase(backupData: any) {
    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      });
      if (res.ok) {
        StorageService.restoreBackup(JSON.stringify(backupData));
        return await res.json();
      }
    } catch {
      // fallback
    }

    StorageService.restoreBackup(JSON.stringify(backupData));
    return { success: true, message: 'ডাটাবেজ সফলভাবে রিস্টোর হয়েছে!' };
  },

  async getPartners() {
    try {
      const res = await fetch('/api/partners');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const company = StorageService.getCompanyInfo();
    return { success: true, partners: company.partners || [] };
  },

  async savePartners(partners: any[]) {
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partners })
      });
      if (res.ok) {
        const data = await res.json();
        const company = StorageService.getCompanyInfo();
        StorageService.saveCompanyInfo({ ...company, partners });
        return data;
      }
    } catch {
      // fallback
    }

    const company = StorageService.getCompanyInfo();
    const updated = { ...company, partners };
    StorageService.saveCompanyInfo(updated);
    return { success: true, partners };
  }
};
