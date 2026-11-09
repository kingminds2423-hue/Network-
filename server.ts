import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getDatabase, saveDatabase, deleteFromFirestore } from './src/server/storage.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body Parser Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 1. GET Full State
app.get('/api/state', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    res.json({
      company: db.company,
      adminPin: db.adminAuth.pin,
      adminPhone: db.adminAuth.phone,
      staffs: db.staffs,
      transactions: db.transactions,
      customerDues: db.customerDues
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to convert Bengali digits (০-৯) and normalize phone numbers
function normalizePhone(p: string | undefined | null): string {
  if (!p) return '';
  const bnMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const converted = String(p).replace(/[০-৯]/g, (d) => bnMap[d] || d);
  const digits = converted.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10); // Standardizes 017XXXXXXXX, +88017XXXXXXXX to 17XXXXXXXX
  }
  return digits;
}

function normalizePin(p: string | undefined | null): string {
  if (!p) return '';
  const bnMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return String(p).replace(/[০-৯]/g, (d) => bnMap[d] || d).trim();
}

function parseBanglaOrEnglishNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const bnMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const cleaned = String(val)
    .replace(/[০-৯]/g, (d) => bnMap[d] || d)
    .replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// 2. Auth Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { phone, pin } = req.body;
    const db = getDatabase();

    const inputPhone = String(phone || '').trim();
    const inputPin = String(pin || '').trim();
    const normInputPhone = normalizePhone(inputPhone);
    const normInputPin = normalizePin(inputPin);

    // 1. Admin check (accepts 'admin', admin phone, company phone, or 01700000000)
    const normAdminPhone = normalizePhone(db.adminAuth.phone);
    const normCompanyPhone = normalizePhone(db.company.phone);
    const isAdmin =
      inputPhone.toLowerCase() === 'admin' ||
      (normInputPhone && (
        normInputPhone === normAdminPhone ||
        normInputPhone === normCompanyPhone ||
        normInputPhone === '1700000000'
      )) ||
      inputPhone === db.adminAuth.phone ||
      inputPhone === db.company.phone;

    if (isAdmin && (normInputPin === normalizePin(db.adminAuth.pin) || inputPin === String(db.adminAuth.pin))) {
      return res.json({
        success: true,
        role: 'admin',
        user: {
          name: db.company.ownerName ? `${db.company.ownerName} (পরিচালক)` : 'জাহিদুল ইসলাম (পরিচালক)',
          role: 'admin',
          phone: db.adminAuth.phone || db.company.phone
        }
      });
    }

    // 2. Staff check (normalizes phone and pin)
    const staff = db.staffs.find((s) => {
      if (s.status === 'inactive') return false;

      const sNormPhone = normalizePhone(s.phone);
      const sNormPin = normalizePin(s.pin);

      const phoneMatches =
        (normInputPhone && sNormPhone && normInputPhone === sNormPhone) ||
        s.phone.trim() === inputPhone ||
        (s.email && s.email.toLowerCase().trim() === inputPhone.toLowerCase());

      const pinMatches =
        normInputPin === sNormPin ||
        String(s.pin).trim() === inputPin;

      return phoneMatches && pinMatches;
    });

    if (staff) {
      return res.json({
        success: true,
        role: staff.role || 'staff',
        user: staff
      });
    }

    return res.status(401).json({
      success: false,
      message: 'মোবাইল নম্বর বা ৪ ডিজিট পিন সঠিক নয়! অনুগ্রহ করে সঠিক মোবাইল ও পিন দিন।'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Admin PIN Change
app.post('/api/auth/change-admin-pin', (req: Request, res: Response) => {
  try {
    const { oldPin, newPin } = req.body;
    const db = getDatabase();

    if (String(db.adminAuth.pin) !== String(oldPin)) {
      return res.status(400).json({ success: false, message: 'বর্তমান এডমিন পিন সঠিক নয়!' });
    }

    if (!newPin || String(newPin).length < 4) {
      return res.status(400).json({ success: false, message: 'নতুন পিন কমপক্ষে ৪ ডিজিটের হতে হবে!' });
    }

    db.adminAuth.pin = String(newPin);
    saveDatabase(db);
    return res.json({ success: true, message: 'এডমিন পিন সফলভাবে পরিবর্তন করা হয়েছে!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Update Company Settings
app.post('/api/settings/company', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.company = { ...db.company, ...req.body };
    saveDatabase(db);
    return res.json({ success: true, company: db.company });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4.1 Partners API
app.get('/api/partners', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    return res.json({ success: true, partners: db.company.partners || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/partners', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.company.partners = Array.isArray(req.body.partners) ? req.body.partners : db.company.partners;
    saveDatabase(db);
    return res.json({ success: true, partners: db.company.partners });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Add New Staff
app.post('/api/staffs', (req: Request, res: Response) => {
  try {
    const body = req.body;
    const db = getDatabase();

    if (!body.name || !body.phone || !body.pin) {
      return res.status(400).json({ success: false, message: 'নাম, মোবাইল নম্বর ও পিন আবশ্যক!' });
    }

    const existing = db.staffs.find((s) => s.phone === body.phone);
    if (existing) {
      return res.status(400).json({ success: false, message: 'এই মোবাইল নম্বরে ইতিমধ্যে একজন স্টাফ নিবন্ধিত আছে!' });
    }

    const newStaff = {
      id: 'staff-' + Date.now(),
      name: body.name,
      fatherName: body.fatherName || '',
      motherName: body.motherName || '',
      phone: body.phone,
      email: body.email || '',
      nid: body.nid || '',
      address: body.address || '',
      designation: body.designation || 'স্টাফ',
      salary: Number(body.salary) || 0,
      joinedAt: body.joinedAt || new Date().toISOString().substring(0, 10),
      photoUrl:
        body.photoUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.name)}`,
      pin: String(body.pin),
      role: body.role || 'cashier',
      education: body.education || '',
      emergencyContact: body.emergencyContact || '',
      bloodGroup: body.bloodGroup || '',
      status: 'active' as const
    };

    db.staffs.unshift(newStaff);
    saveDatabase(db);
    return res.json({ success: true, staff: newStaff });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Update Staff
app.put('/api/staffs/:id', (req: Request, res: Response) => {
  try {
    const staffId = req.params.id;
    const db = getDatabase();
    const idx = db.staffs.findIndex((s) => s.id === staffId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'স্টাফ পাওয়া যায়নি' });
    }

    db.staffs[idx] = { ...db.staffs[idx], ...req.body };
    saveDatabase(db);
    return res.json({ success: true, staff: db.staffs[idx] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Delete Staff
app.delete('/api/staffs/:id', (req: Request, res: Response) => {
  try {
    const staffId = req.params.id;
    const db = getDatabase();
    db.staffs = db.staffs.filter((s) => s.id !== staffId);
    saveDatabase(db);
    deleteFromFirestore('staffs', staffId);
    return res.json({ success: true, message: 'স্টাফ মুছে ফেলা হয়েছে' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Add Transaction
app.post('/api/transactions', (req: Request, res: Response) => {
  try {
    const body = req.body;
    const db = getDatabase();

    const cleanAmount = parseBanglaOrEnglishNumber(body.amount);
    if (!body.title || cleanAmount <= 0) {
      return res.status(400).json({ success: false, message: 'বিবরণ এবং সঠিক টাকার পরিমাণ প্রদান করুন!' });
    }

    const newTx = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: body.type === 'expense' ? ('expense' as const) : ('income' as const),
      date: body.date || new Date().toISOString().substring(0, 10),
      title: String(body.title).trim(),
      category: body.category || (body.type === 'expense' ? 'অন্যান্য ব্যয়' : 'পণ্য বিক্রয়'),
      amount: cleanAmount,
      paymentMethod: body.paymentMethod || 'cash',
      addedBy: String(body.addedBy || 'এডমিন').trim(),
      addedById: String(body.addedById || '').trim(),
      note: String(body.note || '').trim(),
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(newTx);
    saveDatabase(db);
    return res.json({ success: true, transaction: newTx });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Delete Transaction
app.delete('/api/transactions/:id', (req: Request, res: Response) => {
  try {
    const txId = req.params.id;
    const db = getDatabase();
    db.transactions = db.transactions.filter((t) => t.id !== txId);
    saveDatabase(db);
    deleteFromFirestore('transactions', txId);
    return res.json({ success: true, message: 'লেনদেন মুছে ফেলা হয়েছে' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Add / Update Customer Due
app.post('/api/dues', (req: Request, res: Response) => {
  try {
    const body = req.body;
    const db = getDatabase();

    if (body.action === 'new_customer') {
      const newDue = {
        id: 'due-' + Date.now(),
        customerName: body.customerName,
        phone: body.phone,
        address: body.address || '',
        totalDue: Number(body.initialDue) || 0,
        paidAmount: 0,
        remainingDue: Number(body.initialDue) || 0,
        lastUpdated: new Date().toISOString().substring(0, 10),
        notes: body.notes || '',
        history: [
          {
            date: new Date().toISOString().substring(0, 10),
            amount: Number(body.initialDue) || 0,
            type: 'due' as const,
            note: 'প্রারম্ভিক বাকি খাতা শুরু'
          }
        ]
      };
      db.customerDues.unshift(newDue);
      saveDatabase(db);
      return res.json({ success: true, due: newDue });
    }

    if (body.action === 'add_entry') {
      const { dueId, amount, type, note } = body;
      const due = db.customerDues.find((d) => d.id === dueId);
      if (!due) return res.status(404).json({ success: false, message: 'কাস্টমার পাওয়া যায়নি' });

      const numAmount = Number(amount) || 0;
      if (type === 'due') {
        due.totalDue += numAmount;
        due.remainingDue += numAmount;
      } else {
        due.paidAmount += numAmount;
        due.remainingDue = Math.max(0, due.remainingDue - numAmount);
      }
      due.lastUpdated = new Date().toISOString().substring(0, 10);
      due.history.unshift({
        date: new Date().toISOString().substring(0, 10),
        amount: numAmount,
        type: type === 'due' ? 'due' : 'payment',
        note: note || ''
      });

      saveDatabase(db);
      return res.json({ success: true, due });
    }

    return res.status(400).json({ success: false, message: 'অকার্যকর অনুরোধ' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Delete Due Record
app.delete('/api/dues/:id', (req: Request, res: Response) => {
  try {
    const dueId = req.params.id;
    const db = getDatabase();
    db.customerDues = db.customerDues.filter((d) => d.id !== dueId);
    saveDatabase(db);
    deleteFromFirestore('customerDues', dueId);
    return res.json({ success: true, message: 'বাকি রেকর্ড মুছে ফেলা হয়েছে' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 12. Backup Export
app.get('/api/backup/export', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      company: db.company,
      adminAuth: db.adminAuth,
      staffs: db.staffs,
      transactions: db.transactions,
      customerDues: db.customerDues
    };
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="hisab_khata_backup_${new Date().toISOString().substring(0, 10)}.json"`
    );
    return res.json(exportData);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 13. Backup Import
app.post('/api/backup/import', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ success: false, message: 'অকার্যকর ব্যাকআপ ফাইল!' });
    }

    const currentDb = getDatabase();
    const restoredDb = {
      company: body.company ? { ...currentDb.company, ...body.company } : currentDb.company,
      adminAuth: body.adminAuth ? { ...currentDb.adminAuth, ...body.adminAuth } : currentDb.adminAuth,
      staffs: Array.isArray(body.staffs) ? body.staffs : currentDb.staffs,
      transactions: Array.isArray(body.transactions) ? body.transactions : currentDb.transactions,
      customerDues: Array.isArray(body.customerDues) ? body.customerDues : currentDb.customerDues
    };

    const saved = saveDatabase(restoredDb);
    if (!saved) {
      return res.status(500).json({ success: false, message: 'ডাটাবেজে ব্যাকআপ সংরক্ষণ করা সম্ভব হয়নি!' });
    }

    return res.json({
      success: true,
      message: 'ডাটাবেজ সফলভাবে রিস্টোর হয়েছে!',
      stats: {
        staffsCount: restoredDb.staffs.length,
        transactionsCount: restoredDb.transactions.length,
        duesCount: restoredDb.customerDues.length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 14. Lightweight Keep-Alive Ping
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Setup Vite or Static File Serving
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distPath, 'index.html'));
  const useStaticDist = isProduction || hasBuiltDist;

  if (useStaticDist) {
    console.log('Serving optimized pre-built static bundle from /dist (lightning-fast)');
    app.use(express.static(distPath, {
      maxAge: '1h',
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        } else if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${useStaticDist ? 'static dist mode' : 'vite middleware mode'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
