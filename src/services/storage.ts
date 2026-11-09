import { CompanyInfo, Staff, Transaction, CustomerDue } from '../types';

const STORAGE_KEYS = {
  COMPANY: 'hk_company_info_v2',
  ADMIN_PIN: 'hk_admin_pin_v2',
  STAFFS: 'hk_staff_list_v2',
  TRANSACTIONS: 'hk_transactions_v2',
  DUES: 'hk_customer_dues_v2',
};

const initialCompany: CompanyInfo = {
  name: 'DIP BHOLA NETWORK',
  subTitle: 'দৈনিক আয়-ব্যয় ও কেন্দ্রীয় স্টাফ মনিটরিং সিস্টেম',
  ownerName: 'জাহিদুল ইসলাম',
  phone: '01712-345678',
  email: 'zahidulislam53330@gmail.com',
  address: 'ভোলা, বাংলাদেশ',
  logoUrl: '/dip-bhola-logo.svg',
  currencySymbol: '৳',
  partners: [
    {
      id: 'p-1',
      name: 'জাহিদুল ইসলাম',
      phone: '01712-345678',
      investment: 150000,
      sharePercentage: 60,
      role: 'প্রধান পরিচালক ও অংশীদার'
    },
    {
      id: 'p-2',
      name: 'মোঃ তানভীর আহমেদ',
      phone: '01811223344',
      investment: 100000,
      sharePercentage: 40,
      role: 'ব্যবস্থাপনা অংশীদার'
    }
  ]
};

const initialAdminPin = '1234';

const today = new Date().toISOString().substring(0, 10);
const currentYearMonth = today.substring(0, 7);

const initialStaffs: Staff[] = [
  {
    id: 'staff-1',
    name: 'মোঃ তানভীর আহমেদ',
    fatherName: 'মোঃ আব্দুল জলিল',
    motherName: 'মোসাঃ তহমিনা খাতুন',
    phone: '01811223344',
    email: 'tanvir@gmail.com',
    nid: '19952691234567890',
    address: 'গ্রাম: চরপাড়া, ডাকঘর: ফুলপুর, ময়মনসিংহ',
    designation: 'ম্যানেজার',
    salary: 22000,
    joinedAt: '2025-01-15',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    pin: '1122',
    role: 'manager',
    education: 'বি.বি.এস (অনার্স), মার্কেটিং',
    experience: '৫ বছরের খুচরা ও পাইকারি হিসাবরক্ষণের অভিজ্ঞতা',
    emergencyContact: '01799887766 (বড় ভাই)',
    bloodGroup: 'B+',
    status: 'active'
  },
  {
    id: 'staff-2',
    name: 'মোঃ শাকিল হোসেন',
    fatherName: 'মোঃ রফিকুল ইসলাম',
    motherName: 'মোসাঃ রেনুয়ারা বেগম',
    phone: '01922334455',
    email: 'shakil@gmail.com',
    nid: '19985012345678912',
    address: 'রোড-০৪, সেক্টর-০৯, উত্তরা, ঢাকা',
    designation: 'ক্যাশিয়ার',
    salary: 18000,
    joinedAt: '2025-03-01',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    pin: '2233',
    role: 'cashier',
    education: 'এইচএসসি (বাণিজ্য বিভাগ)',
    experience: '২ বছরের ক্যাশ ও সেলস কাউন্টার অভিজ্ঞতা',
    emergencyContact: '01877665544 (বাবা)',
    bloodGroup: 'O+',
    status: 'active'
  }
];

const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    date: today,
    title: 'দৈনিক কাউন্টার ক্যাশ বিক্রয়',
    category: 'পণ্য বিক্রয়',
    amount: 38500,
    paymentMethod: 'cash',
    addedBy: 'তানভীর আহমেদ',
    addedById: 'staff-2',
    note: 'সকাল ও বিকালের মোট ক্যাশ বিক্রয়',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-2',
    type: 'income',
    date: today,
    title: 'বিকাশ অনলাইন পেমেন্ট প্রাপ্তি',
    category: 'পণ্য বিক্রয়',
    amount: 14200,
    paymentMethod: 'bkash',
    addedBy: 'মো: রফিকুল ইসলাম',
    addedById: 'staff-1',
    note: 'অর্ডার নং #৪৫২ ও #৪৫৩ এর পেমেন্ট',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-3',
    type: 'expense',
    date: today,
    title: 'নতুন মালামাল পরিবহন ও রিকশা ভাড়া',
    category: 'যাতায়াত ও ডেলিভারি খরচ',
    amount: 1850,
    paymentMethod: 'cash',
    addedBy: 'মো: রফিকুল ইসলাম',
    addedById: 'staff-1',
    note: 'সদরঘাট থেকে মালামাল আনার খরচ',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-4',
    type: 'expense',
    date: today,
    title: 'স্টাফ দুপুরের খাবার ও বিকেলের চা-নাস্তা',
    category: 'আপ্যায়ন ও নাস্তা খরচ',
    amount: 720,
    paymentMethod: 'cash',
    addedBy: 'তানভীর আহমেদ',
    addedById: 'staff-2',
    note: 'কর্মচারী ও কাস্টমার আপ্যায়ন',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-5',
    type: 'income',
    date: `${currentYearMonth}-01`,
    title: 'মাসিক মূলধন বিনিয়োগ / প্রারম্ভিক ক্যাশ',
    category: 'ক্যাশ ডিপোজিট / বিনিয়োগ',
    amount: 50000,
    paymentMethod: 'bank',
    addedBy: 'প্রধান এডমিন',
    note: 'চলতি মাসের প্রাথমিক ফান্ডিং',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-6',
    type: 'expense',
    date: `${currentYearMonth}-02`,
    title: 'দোকান ভাড়া পরিশোধ (চলতি মাস)',
    category: 'দোকান / অফিস ভাড়া',
    amount: 25000,
    paymentMethod: 'bank',
    addedBy: 'প্রধান এডমিন',
    note: 'বাড়িওয়ালা মোহাম্মদ করিমকে ব্যাংক চেক প্রদান',
    createdAt: new Date().toISOString()
  }
];

const initialDues: CustomerDue[] = [
  {
    id: 'due-1',
    customerName: 'মেসার্স ভাই ভাই স্টোর (কামাল ভাই)',
    phone: '01712334455',
    address: 'চকবাজার, ঢাকা',
    totalDue: 15000,
    paidAmount: 8000,
    remainingDue: 7000,
    lastUpdated: today,
    notes: 'চালান নং ৭৮৬ - পরবর্তী সপ্তাহে পরিশোধ করবে',
    history: [
      { date: `${currentYearMonth}-01`, amount: 15000, type: 'due', note: 'নতুন বাকিতে পণ্য ক্রয়' },
      { date: today, amount: 8000, type: 'payment', note: 'নগদ জমা দেওয়া হয়েছে' }
    ]
  },
  {
    id: 'due-2',
    customerName: 'আল-মদিনা লাইব্রেরি ও স্টেশনারি',
    phone: '01899112233',
    address: 'নীলক্ষেত, ঢাকা',
    totalDue: 9500,
    paidAmount: 3000,
    remainingDue: 6500,
    lastUpdated: today,
    notes: 'বকেয়া বিল',
    history: [
      { date: `${currentYearMonth}-03`, amount: 9500, type: 'due', note: 'বাকি ক্রয় চালান' },
      { date: today, amount: 3000, type: 'payment', note: 'বিকাশ মাধ্যমে পরিশোধ' }
    ]
  }
];

// Helper to safely read from localStorage
function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

// Helper to safely write to localStorage
function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to write to localStorage for key: ${key}`, err);
  }
}

export const StorageService = {
  getCompanyInfo(): CompanyInfo {
    return readStorage<CompanyInfo>(STORAGE_KEYS.COMPANY, initialCompany);
  },
  saveCompanyInfo(info: CompanyInfo): void {
    writeStorage(STORAGE_KEYS.COMPANY, info);
  },

  getAdminPin(): string {
    return readStorage<string>(STORAGE_KEYS.ADMIN_PIN, initialAdminPin);
  },
  saveAdminPin(pin: string): void {
    writeStorage(STORAGE_KEYS.ADMIN_PIN, pin);
  },

  getStaffs(): Staff[] {
    return readStorage<Staff[]>(STORAGE_KEYS.STAFFS, initialStaffs);
  },
  saveStaffs(staffs: Staff[]): void {
    writeStorage(STORAGE_KEYS.STAFFS, staffs);
  },

  getTransactions(): Transaction[] {
    return readStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
  },
  saveTransactions(transactions: Transaction[]): void {
    writeStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  getDues(): CustomerDue[] {
    return readStorage<CustomerDue[]>(STORAGE_KEYS.DUES, initialDues);
  },
  saveDues(dues: CustomerDue[]): void {
    writeStorage(STORAGE_KEYS.DUES, dues);
  },

  exportFullBackup(): string {
    const backup = {
      company: this.getCompanyInfo(),
      staffs: this.getStaffs(),
      transactions: this.getTransactions(),
      dues: this.getDues(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.company) this.saveCompanyInfo(data.company);
      if (data.staffs && Array.isArray(data.staffs)) this.saveStaffs(data.staffs);
      if (data.transactions && Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
      if (data.dues && Array.isArray(data.dues)) this.saveDues(data.dues);
      return true;
    } catch (e) {
      console.error('Backup restore error:', e);
      return false;
    }
  },

  resetToDefault(): void {
    writeStorage(STORAGE_KEYS.COMPANY, initialCompany);
    writeStorage(STORAGE_KEYS.ADMIN_PIN, initialAdminPin);
    writeStorage(STORAGE_KEYS.STAFFS, initialStaffs);
    writeStorage(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
    writeStorage(STORAGE_KEYS.DUES, initialDues);
  }
};
