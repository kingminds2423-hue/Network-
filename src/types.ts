export interface PartnerInvestmentEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  addedBy?: string;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  investment: number;
  sharePercentage: number;
  role?: string; // যেমন: ব্যবস্থাপনা পরিচালক / অংশীদার
  investmentHistory?: PartnerInvestmentEntry[];
}

export interface CompanyInfo {
  name: string;
  subTitle: string;
  ownerName: string; // প্রধান মালিকের নাম বা ব্যবসা পরিচালকের নাম
  phone: string;
  email: string;
  address: string;
  logoUrl: string; // কোম্পানির লোগো (base64 বা ইমেজ লিংক)
  currencySymbol: string;
  partners?: Partner[]; // অংশীদারগণ ও মূলধন তালিকা
}

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank' | 'rocket' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  title: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  addedBy: string;
  addedById?: string;
  note?: string;
  createdAt: string;
}

export type StaffRole = 'admin' | 'manager' | 'cashier' | 'viewer' | 'staff';

export interface Staff {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  nid?: string;
  address: string;
  designation: string;
  salary: number;
  joinedAt: string;
  photoUrl: string;
  pin: string;
  role: StaffRole;
  education?: string;
  experience?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  status: 'active' | 'inactive';
}

export interface DueEntry {
  date: string;
  amount: number;
  type: 'due' | 'payment';
  note?: string;
}

export interface CustomerDue {
  id: string;
  customerName: string;
  phone: string;
  address?: string;
  totalDue: number;
  paidAmount: number;
  remainingDue: number;
  lastUpdated: string;
  notes?: string;
  history: DueEntry[];
}
