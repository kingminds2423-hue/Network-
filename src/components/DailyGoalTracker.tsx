import React, { useState, useEffect } from 'react';
import { 
  formatBnNumber, 
  formatBnCurrency, 
  formatBnDate 
} from '../utils/bengali.ts';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

interface DailyGoalTrackerProps {
  todayIncome: number;
  todayExpense: number;
  isAdmin: boolean;
}

export const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({
  todayIncome,
  todayExpense,
  isAdmin
}) => {
  // Goal Type: 'income' (Target sales/income) or 'expense' (Budget limit)
  const [goalType, setGoalType] = useState<'income' | 'expense'>(() => {
    return (localStorage.getItem('hk_goal_type') as 'income' | 'expense') || 'income';
  });

  // Target values stored in localStorage
  const [incomeTarget, setIncomeTarget] = useState<number>(() => {
    const saved = localStorage.getItem('hk_daily_income_target');
    return saved ? Number(saved) : 25000;
  });

  const [expenseLimit, setExpenseLimit] = useState<number>(() => {
    const saved = localStorage.getItem('hk_daily_expense_limit');
    return saved ? Number(saved) : 6000;
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('hk_goal_type', goalType);
  }, [goalType]);

  const handleStartEdit = () => {
    setTempValue(String(goalType === 'income' ? incomeTarget : expenseLimit));
    setIsEditing(true);
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(tempValue);
    if (!isNaN(val) && val > 0) {
      if (goalType === 'income') {
        setIncomeTarget(val);
        localStorage.setItem('hk_daily_income_target', String(val));
      } else {
        setExpenseLimit(val);
        localStorage.setItem('hk_daily_expense_limit', String(val));
      }
      setIsEditing(false);
    }
  };

  const todayStr = new Date().toISOString().substring(0, 10);

  // Income calculations
  const incomePercent = incomeTarget > 0 ? Math.round((todayIncome / incomeTarget) * 100) : 0;
  const incomeRemaining = Math.max(0, incomeTarget - todayIncome);
  const isIncomeGoalMet = todayIncome >= incomeTarget;

  // Expense calculations
  const expensePercent = expenseLimit > 0 ? Math.round((todayExpense / expenseLimit) * 100) : 0;
  const expenseRemaining = Math.max(0, expenseLimit - todayExpense);
  const isExpenseExceeded = todayExpense > expenseLimit;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 relative overflow-hidden transition-all">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        
        {/* Title & Goal Type Switcher */}
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            goalType === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                দৈনিক লক্ষ্যমাত্রা ও অগ্রগতি ট্র্যাকার
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">({formatBnDate(todayStr)})</span>
            </div>
            <p className="text-xs text-slate-500">
              {goalType === 'income'
                ? 'আজকের আয়ের টার্গেট নির্ধারণ ও রিয়েল-টাইম অগ্রগতি'
                : 'আজকের ব্যয়ের সর্বোচ্চ বাজেট সীমা ট্র্যাকিং'}
            </p>
          </div>
        </div>

        {/* Goal Type Switcher Buttons & Edit Trigger */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setGoalType('income');
                setIsEditing(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                goalType === 'income'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>আয়ের টার্গেট</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGoalType('expense');
                setIsEditing(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                goalType === 'expense'
                  ? 'bg-white text-rose-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>ব্যয়ের সীমা</span>
            </button>
          </div>

          {/* Edit Target Button */}
          {isAdmin && !isEditing && (
            <button
              onClick={handleStartEdit}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-200"
              title="টার্গেট পরিবর্তন করুন"
            >
              <Edit2 className="w-3 h-3" />
              <span className="hidden sm:inline">টার্গেট বদলান</span>
            </button>
          )}
        </div>

      </div>

      {/* Edit Form Modal/Inline */}
      {isEditing ? (
        <form onSubmit={handleSaveTarget} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-700">
            {goalType === 'income' ? 'আজকের আয়ের নতুন টার্গেট (৳):' : 'আজকের ব্যয়ের সর্বোচ্চ বাজেট সীমা (৳):'}
          </span>
          <div className="relative">
            <input
              type="number"
              autoFocus
              required
              min={100}
              step={100}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-40 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>সেভ করুন</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-white"
          >
            বাতিল
          </button>
        </form>
      ) : null}

      {/* Goal Content & Progress Bar */}
      {goalType === 'income' ? (
        <div className="space-y-3 pt-1">
          {/* Metrics Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">আজকের নির্ধারিত টার্গেট:</span>
              <span className="text-lg font-extrabold text-slate-900">{formatBnCurrency(incomeTarget)}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block text-[11px]">আজকের মোট আয় হয়েছে:</span>
              <span className="text-lg font-extrabold text-emerald-700">{formatBnCurrency(todayIncome)}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block text-[11px]">
                {isIncomeGoalMet ? 'অতিরিক্ত অর্জিত আয়:' : 'টার্গেট পূরণ হতে বাকি:'}
              </span>
              <span className={`text-lg font-extrabold ${isIncomeGoalMet ? 'text-teal-700' : 'text-amber-700'}`}>
                {isIncomeGoalMet
                  ? `+${formatBnCurrency(todayIncome - incomeTarget)}`
                  : formatBnCurrency(incomeRemaining)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-500 font-medium block text-[11px]">অর্জিত অগ্রগতি:</span>
              <span className={`text-xl font-black ${isIncomeGoalMet ? 'text-emerald-700' : 'text-slate-800'}`}>
                {formatBnNumber(incomePercent)}%
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                isIncomeGoalMet
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500'
              }`}
              style={{ width: `${Math.min(100, incomePercent)}%` }}
            />
          </div>

          {/* Achievement Message */}
          {isIncomeGoalMet ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold animate-fadeIn">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                🎉 চমৎকার! আজকের আয়ের লক্ষ্যমাত্রা ১০০% অর্জিত হয়েছে! (টার্গেটের চেয়ে {formatBnCurrency(todayIncome - incomeTarget)} বেশি আয় হয়েছে)
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>আজকের লক্ষ্যমাত্রা পূরণে আরও <strong>{formatBnCurrency(incomeRemaining)}</strong> আয় প্রয়োজন।</span>
              <span>টার্গেট: {formatBnNumber(incomePercent)}% সম্পন্ন</span>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {/* Expense Limit Metrics Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">দৈনিক ব্যয়ের সর্বোচ্চ বাজেট সীমা:</span>
              <span className="text-lg font-extrabold text-slate-900">{formatBnCurrency(expenseLimit)}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block text-[11px]">আজকের মোট ব্যয় হয়েছে:</span>
              <span className={`text-lg font-extrabold ${isExpenseExceeded ? 'text-rose-700' : 'text-slate-800'}`}>
                {formatBnCurrency(todayExpense)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block text-[11px]">
                {isExpenseExceeded ? 'বাজেট অতিরিক্ত খরচ:' : 'বাকি অনুমোদিত বাজেট:'}
              </span>
              <span className={`text-lg font-extrabold ${isExpenseExceeded ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isExpenseExceeded
                  ? `+${formatBnCurrency(todayExpense - expenseLimit)}`
                  : formatBnCurrency(expenseRemaining)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-500 font-medium block text-[11px]">বাজেট ব্যবহার:</span>
              <span className={`text-xl font-black ${isExpenseExceeded ? 'text-rose-700' : 'text-slate-800'}`}>
                {formatBnNumber(expensePercent)}%
              </span>
            </div>
          </div>

          {/* Progress Bar Container for Expense */}
          <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                isExpenseExceeded
                  ? 'bg-rose-600'
                  : expensePercent > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, expensePercent)}%` }}
            />
          </div>

          {/* Warning / Success Message */}
          {isExpenseExceeded ? (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-800 p-2.5 rounded-xl border border-rose-200 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                সতর্কবার্তা: আজকের নির্ধারিত ব্যয়ের বাজেট সীমা অতিক্রম করেছে! (অতিরিক্ত ব্যয়: {formatBnCurrency(todayExpense - expenseLimit)})
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>আজকের ব্যয়ের সীমা নিরাপদ সীমার মধ্যে রয়েছে। বাকি আছে <strong>{formatBnCurrency(expenseRemaining)}</strong>।</span>
              <span>বাজেট ব্যবহৃত: {formatBnNumber(expensePercent)}%</span>
            </p>
          )}
        </div>
      )}

    </div>
  );
};
