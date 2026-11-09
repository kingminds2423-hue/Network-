import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive এক্সেস টোকেন পাওয়া যায়নি');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    console.error('Google Drive sign in error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogleDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface AutoBackupSettings {
  enabled: boolean;
  autoMonthlyReport: boolean;
  frequency: 'daily' | 'monthly' | 'on_change';
  lastBackupTime?: string;
  lastBackupFileName?: string;
  lastMonthlyReportMonth?: string;
  lastStatus?: 'success' | 'failed';
  lastError?: string;
}

const AUTO_BACKUP_STORAGE_KEY = 'dip_bhola_auto_backup_config';

export const getAutoBackupSettings = (): AutoBackupSettings => {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    enabled: true,
    autoMonthlyReport: true,
    frequency: 'monthly'
  };
};

export const saveAutoBackupSettings = (settings: AutoBackupSettings): void => {
  try {
    localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

// Helper: Get or create dedicated app folder in Google Drive
export const getOrCreateDriveFolder = async (folderName: string, token: string): Promise<string | null> => {
  try {
    const q = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    if (createRes.ok) {
      const folder = await createRes.json();
      return folder.id;
    }
  } catch (err) {
    console.warn('Could not manage Drive folder, uploading to root:', err);
  }
  return null;
};

// Upload JSON database backup to Google Drive
export const uploadBackupToGoogleDrive = async (fileName: string, backupData: any): Promise<any> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  const folderId = await getOrCreateDriveFolder('DIP BHOLA NETWORK Backups', token);

  const metadata: any = {
    name: fileName,
    mimeType: 'application/json',
    description: 'DIP BHOLA NETWORK সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON)'
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const fileContent = JSON.stringify(backupData, null, 2);
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`গুগল ড্রাইভে আপলোড ব্যর্থ হয়েছে: ${errText}`);
  }

  const result = await res.json();
  
  // Update auto-backup status
  const currentSettings = getAutoBackupSettings();
  saveAutoBackupSettings({
    ...currentSettings,
    lastBackupTime: new Date().toISOString(),
    lastBackupFileName: fileName,
    lastStatus: 'success'
  });

  return result;
};

// Upload Monthly Report PDF to Google Drive
export const uploadMonthlyReportPdfToGoogleDrive = async (
  fileName: string,
  pdfBlob: Blob,
  monthLabel: string
): Promise<any> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  const folderId = await getOrCreateDriveFolder('DIP BHOLA NETWORK Reports', token);

  const metadata: any = {
    name: fileName,
    mimeType: 'application/pdf',
    description: `DIP BHOLA NETWORK মাসিক হিসাব রিপোর্ট (${monthLabel}) PDF`
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', pdfBlob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`গুগল ড্রাইভে রিপোর্ট আপলোড ব্যর্থ হয়েছে: ${errText}`);
  }

  return res.json();
};

// Upload Monthly Report JSON Summary to Google Drive
export const uploadMonthlyReportJsonToGoogleDrive = async (
  monthStr: string,
  reportSummary: any
): Promise<any> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  const folderId = await getOrCreateDriveFolder('DIP BHOLA NETWORK Reports', token);
  const fileName = `monthly_report_${monthStr}.json`;

  const metadata: any = {
    name: fileName,
    mimeType: 'application/json',
    description: `DIP BHOLA NETWORK মাসিক হিসাব সারাংশ (${monthStr})`
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const fileContent = JSON.stringify(reportSummary, null, 2);
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`গুগল ড্রাইভে রিপোর্ট সেভ করা যায়নি: ${errText}`);
  }

  const currentSettings = getAutoBackupSettings();
  saveAutoBackupSettings({
    ...currentSettings,
    lastMonthlyReportMonth: monthStr,
    lastBackupTime: new Date().toISOString()
  });

  return res.json();
};

// List backup and report files from Google Drive
export const listDriveBackups = async (): Promise<any[]> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  // Query for both full backups and monthly reports
  const query = encodeURIComponent("(name contains 'hisab_khata' or name contains 'monthly_report' or name contains 'DIP_BHOLA') and trashed = false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=30&fields=files(id,name,mimeType,size,createdTime,webViewLink)`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('গুগল ড্রাইভ ফাইল তালিকা লোড করতে ব্যর্থ হয়েছে');
  }

  const data = await res.json();
  return data.files || [];
};

// Download backup file content from Google Drive
export const downloadDriveBackupFile = async (fileId: string): Promise<any> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('গুগল ড্রাইভ ফাইল ডাউনলোড করতে ব্যর্থ হয়েছে');
  }

  return res.json();
};

// Delete a backup file from Google Drive (Mandatory user confirmation handled in UI)
export const deleteDriveBackupFile = async (fileId: string): Promise<boolean> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.ok;
};

// Execute Auto Backup If Due (Runs seamlessly in background)
export const checkAndTriggerAutoBackup = async (
  exportDbFn: () => Promise<any>,
  currentMonthStr: string,
  monthlyTransactions: any[]
): Promise<{ ran: boolean; message?: string }> => {
  const token = await getGoogleAccessToken();
  if (!token) return { ran: false, message: 'Google Drive not authenticated' };

  const settings = getAutoBackupSettings();
  if (!settings.enabled) return { ran: false, message: 'Auto backup disabled' };

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const lastDate = settings.lastBackupTime ? settings.lastBackupTime.substring(0, 10) : '';

  let shouldRunFullBackup = false;
  if (settings.frequency === 'daily' && lastDate !== todayStr) {
    shouldRunFullBackup = true;
  } else if (!settings.lastBackupTime) {
    shouldRunFullBackup = true;
  }

  let ranAny = false;

  // 1. Check Full Database Backup
  if (shouldRunFullBackup) {
    try {
      const fullData = await exportDbFn();
      const fileName = `hisab_khata_auto_backup_${todayStr}.json`;
      await uploadBackupToGoogleDrive(fileName, fullData);
      ranAny = true;
    } catch (err) {
      console.error('Auto backup full DB failed:', err);
    }
  }

  // 2. Check Auto Monthly Report
  if (settings.autoMonthlyReport && settings.lastMonthlyReportMonth !== currentMonthStr && monthlyTransactions.length > 0) {
    try {
      const income = monthlyTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
      const expense = monthlyTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      const monthlySummary = {
        month: currentMonthStr,
        generatedAt: now.toISOString(),
        totalIncome: income,
        totalExpense: expense,
        netBalance: income - expense,
        transactionsCount: monthlyTransactions.length,
        transactions: monthlyTransactions
      };

      await uploadMonthlyReportJsonToGoogleDrive(currentMonthStr, monthlySummary);
      ranAny = true;
    } catch (err) {
      console.error('Auto monthly report backup failed:', err);
    }
  }

  return { ran: ranAny, message: ranAny ? 'স্বয়ংক্রিয় ব্যাকআপ সফল হয়েছে' : 'আপ টু ডেট রয়েছে' };
};
