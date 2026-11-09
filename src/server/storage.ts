import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  getDoc
} from 'firebase/firestore';

export interface DatabaseSchema {
  company: {
    name: string;
    subTitle: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    logoUrl: string;
    currencySymbol: string;
    partners?: Array<{
      id: string;
      name: string;
      phone: string;
      investment: number;
      sharePercentage: number;
      role?: string;
    }>;
  };
  adminAuth: {
    pin: string;
    phone: string;
  };
  staffs: Array<{
    id: string;
    name: string;
    fatherName: string;
    motherName: string;
    phone: string;
    email: string;
    nid: string;
    address: string;
    designation: string;
    salary: number;
    joinedAt: string;
    photoUrl: string;
    pin: string;
    role: 'admin' | 'manager' | 'cashier' | 'viewer' | 'staff';
    education?: string;
    emergencyContact?: string;
    bloodGroup?: string;
    status: 'active' | 'inactive';
  }>;
  transactions: Array<{
    id: string;
    type: 'income' | 'expense';
    date: string;
    title: string;
    category: string;
    amount: number;
    paymentMethod: string;
    addedBy: string;
    addedById: string;
    note?: string;
    createdAt: string;
  }>;
  customerDues: Array<{
    id: string;
    customerName: string;
    phone: string;
    address?: string;
    totalDue: number;
    paidAmount: number;
    remainingDue: number;
    lastUpdated: string;
    notes?: string;
    history: Array<{
      date: string;
      amount: number;
      type: 'due' | 'payment';
      note?: string;
    }>;
  }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const CONFIG_FILE = path.resolve(process.cwd(), 'firebase-applet-config.json');

const INITIAL_DB: DatabaseSchema = {
  company: {
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
  },
  adminAuth: {
    pin: '1234',
    phone: '01700000000'
  },
  staffs: [
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
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
      pin: '1122',
      role: 'manager',
      education: 'বি.বি.এস (অনার্স), মার্কেটিং',
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
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
      pin: '2233',
      role: 'cashier',
      education: 'এইচএসসি (বাণিজ্য বিভাগ)',
      emergencyContact: '01877665544 (বাবা)',
      bloodGroup: 'O+',
      status: 'active'
    }
  ],
  transactions: [
    {
      id: 'tx-1',
      type: 'income',
      date: new Date().toISOString().substring(0, 10),
      title: 'নগদ কাউন্টার বিক্রয়',
      category: 'পণ্য বিক্রয়',
      amount: 14500,
      paymentMethod: 'cash',
      addedBy: 'মোঃ তানভীর আহমেদ',
      addedById: 'staff-1',
      note: 'সকাল ১০টা থেকে দুপুর ২টা পর্যন্ত ক্যাশ কাউন্টার বিক্রয়',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-2',
      type: 'income',
      date: new Date().toISOString().substring(0, 10),
      title: 'বিকাশ পেমেন্ট গ্রহণ (চালান #১০২)',
      category: 'পণ্য বিক্রয়',
      amount: 4200,
      paymentMethod: 'bkash',
      addedBy: 'মোঃ শাকিল হোসেন',
      addedById: 'staff-2',
      note: 'কাস্টমার বিকাশ মার্চেন্ট নম্বরে পে করেছে',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-3',
      type: 'expense',
      date: new Date().toISOString().substring(0, 10),
      title: 'দোকান আপ্যায়ন ও চা-নাস্তা খরচ',
      category: 'আপ্যায়ন ও নাস্তা খরচ',
      amount: 450,
      paymentMethod: 'cash',
      addedBy: 'মোঃ তানভীর আহমেদ',
      addedById: 'staff-1',
      note: 'মেহমান ও স্টাফদের বিকেলের নাস্তা',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-4',
      type: 'expense',
      date: new Date().toISOString().substring(0, 10),
      title: 'কুরিয়ার ও পার্সেল বুকিং চার্জ',
      category: 'যাতায়াত ও ডেলিভারি খরচ',
      amount: 850,
      paymentMethod: 'cash',
      addedBy: 'মোঃ শাকিল হোসেন',
      addedById: 'staff-2',
      note: 'সুন্দরবন কুরিয়ারে মালামাল বুকিং',
      createdAt: new Date().toISOString()
    }
  ],
  customerDues: [
    {
      id: 'due-1',
      customerName: 'মেসার্স ভাই ভাই স্টোর (আলমগীর ভাই)',
      phone: '01711998877',
      address: 'চকবাজার, ঢাকা',
      totalDue: 15000,
      paidAmount: 5000,
      remainingDue: 10000,
      lastUpdated: new Date().toISOString().substring(0, 10),
      notes: 'আগামী সপ্তাহে বাকি টাকা পরিশোধ করবেন',
      history: [
        {
          date: new Date().toISOString().substring(0, 10),
          amount: 15000,
          type: 'due',
          note: 'পণ্য বাকি ক্রয় চালান #৪৫'
        },
        {
          date: new Date().toISOString().substring(0, 10),
          amount: 5000,
          type: 'payment',
          note: 'নগদ জমা দেওয়া হয়েছে'
        }
      ]
    }
  ]
};

// In-Memory Database Cache for 0ms response time
let memoryDb: DatabaseSchema = { ...INITIAL_DB };

// Initialize Firestore
let firestoreDb: any = null;
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    const dbId = config.firestoreDatabaseId || 'ai-studio-remixremix-f0a5dbbe-26e6-4a68-aac0-bf4ba9c181af';
    firestoreDb = getFirestore(app, dbId);
    console.log('Firebase Cloud Firestore initialized:', dbId);
  }
} catch (err) {
  console.warn('Could not connect to Firestore, running in local-first mode:', err);
}

// Initial Sync from Firestore on server boot
export async function syncFromFirestore(): Promise<void> {
  if (!firestoreDb) return;
  try {
    console.log('Syncing database from Google Cloud Firestore...');
    const companySnap = await getDoc(doc(firestoreDb, 'settings', 'company'));
    const adminSnap = await getDoc(doc(firestoreDb, 'settings', 'adminAuth'));
    const staffsSnap = await getDocs(collection(firestoreDb, 'staffs'));
    const txSnap = await getDocs(collection(firestoreDb, 'transactions'));
    const duesSnap = await getDocs(collection(firestoreDb, 'customerDues'));

    if (companySnap.exists()) {
      memoryDb.company = { ...memoryDb.company, ...companySnap.data() };
    }
    if (adminSnap.exists()) {
      memoryDb.adminAuth = { ...memoryDb.adminAuth, ...adminSnap.data() };
    }
    if (!staffsSnap.empty) {
      memoryDb.staffs = staffsSnap.docs.map((d: any) => d.data());
    }
    if (!txSnap.empty) {
      memoryDb.transactions = txSnap.docs.map((d: any) => d.data());
      // Sort newest first
      memoryDb.transactions.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    }
    if (!duesSnap.empty) {
      memoryDb.customerDues = duesSnap.docs.map((d: any) => d.data());
    }

    // Save to local disk cache as backup
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
    console.log(`Firestore sync complete! Loaded ${memoryDb.transactions.length} transactions, ${memoryDb.staffs.length} staffs, ${memoryDb.customerDues.length} dues.`);
  } catch (err) {
    console.error('Error syncing from Firestore:', err);
  }
}

// Helper to recursively clean objects for Cloud Firestore (Firestore rejects undefined and NaN)
function cleanForFirestore(obj: any): any {
  if (obj === undefined || obj === null) return null;
  if (typeof obj === 'number') {
    return isNaN(obj) ? 0 : obj;
  }
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  }
  return cleaned;
}

// Kick off initial sync asynchronously
syncFromFirestore().catch(() => {});

// Cloud Firestore async persistence helper
export function persistToFirestore(collName: string, docId: string, data: any): void {
  if (!firestoreDb) return;
  const safeData = cleanForFirestore(data);
  setDoc(doc(firestoreDb, collName, docId), safeData).catch((err) => {
    console.warn(`Failed to persist ${collName}/${docId} to Firestore:`, err.message);
  });
}

export function deleteFromFirestore(collName: string, docId: string): void {
  if (!firestoreDb) return;
  deleteDoc(doc(firestoreDb, collName, docId)).catch((err) => {
    console.warn(`Failed to delete ${collName}/${docId} from Firestore:`, err.message);
  });
}

export function getDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memoryDb = {
        company: { ...memoryDb.company, ...(parsed.company || {}) },
        adminAuth: { ...memoryDb.adminAuth, ...(parsed.adminAuth || {}) },
        staffs: parsed.staffs || memoryDb.staffs,
        transactions: parsed.transactions || memoryDb.transactions,
        customerDues: parsed.customerDues || memoryDb.customerDues
      };
    }
    return memoryDb;
  } catch (err) {
    console.error('Error reading database file:', err);
    return memoryDb;
  }
}

export function saveDatabase(data: DatabaseSchema): boolean {
  try {
    memoryDb = data;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // Async persist to Cloud Firestore
    if (firestoreDb) {
      persistToFirestore('settings', 'company', data.company);
      persistToFirestore('settings', 'adminAuth', data.adminAuth);
      data.staffs.forEach((s) => persistToFirestore('staffs', s.id, s));
      data.transactions.forEach((t) => persistToFirestore('transactions', t.id, t));
      data.customerDues.forEach((d) => persistToFirestore('customerDues', d.id, d));
    }

    return true;
  } catch (err) {
    console.error('Error saving database file:', err);
    return false;
  }
}
