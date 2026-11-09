export const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function formatBnNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  const str = String(num);
  return str.replace(/[0-9]/g, (digit) => bnDigits[Number(digit)] || digit);
}

export function formatBnCurrency(amount: number | string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  const formatted = numeric.toLocaleString('en-IN');
  return `৳ ${formatBnNumber(formatted)}`;
}

export const bnMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function formatBnDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = formatBnNumber(parts[0]);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const monthName = bnMonths[monthIndex] || parts[1];
      const day = formatBnNumber(parts[2]);
      return `${day} ${monthName}, ${year}`;
    }
  } catch {
    // fallback
  }
  return formatBnNumber(dateStr);
}

export function formatBnMonthYear(yearMonth: string): string {
  if (!yearMonth) return '';
  const parts = yearMonth.split('-');
  if (parts.length === 2) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    const monthName = bnMonths[monthIndex] || parts[1];
    const year = formatBnNumber(parts[0]);
    return `${monthName} ${year}`;
  }
  return yearMonth;
}

export const INCOME_CATEGORIES = [
  'পণ্য বিক্রয়',
  'সার্ভিস ফি / মজুরি',
  'পূর্বের বকেয়া আদায়',
  'ক্যাশ ডিপোজিট / বিনিয়োগ',
  'ব্যাংক মুনাফা / কমিশন',
  'অন্যান্য আয়'
];

export const EXPENSE_CATEGORIES = [
  'পাইকারি পণ্য / কাঁচামাল ক্রয়',
  'দোকান / অফিস ভাড়া',
  'স্টাফ বেতন ও ভাতা',
  'বিদ্যুৎ ও ইন্টারনেট বিল',
  'যাতায়াত ও ডেলিভারি খরচ',
  'আপ্যায়ন ও নাস্তা খরচ',
  'মার্কেটিং ও বিজ্ঞাপন',
  'মেরামত ও রক্ষণাবেক্ষণ',
  'অন্যান্য ব্যয়'
];

export const PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: 'cash', label: 'নগদ (Cash)' },
  { id: 'bkash', label: 'বিকাশ (bKash)' },
  { id: 'nagad', label: 'নগদ (Nagad)' },
  { id: 'bank', label: 'ব্যাংক ট্রান্সফার' },
  { id: 'rocket', label: 'রকেট (Rocket)' },
  { id: 'other', label: 'অন্যান্য' }
];

export function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find(p => p.id === method);
  return found ? found.label : method;
}
