import React, { useState, useMemo } from 'react';
import { Transaction } from '../types.ts';
import { 
  formatBnNumber, 
  formatBnCurrency, 
  formatBnMonthYear,
  formatBnDate 
} from '../utils/bengali.ts';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Line, 
  ComposedChart
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  PieChart
} from 'lucide-react';

interface CashFlowChartProps {
  transactions: Transaction[];
  selectedMonth: string;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ transactions, selectedMonth }) => {
  // Default to 'monthly' to immediately showcase the 6-month comparison requested
  const [chartMode, setChartMode] = useState<'monthly' | 'daily'>('monthly');

  // 1. Process Monthly Data for Last 6 Months with Performance Growth Metrics
  const { monthlyData, sixMonthStats } = useMemo(() => {
    const months: string[] = [];
    const baseDate = new Date();
    
    // Generate chronological array for the last 6 months (5 months ago up to current month)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${yyyy}-${mm}`);
    }

    let prevMonthIncome = 0;
    let total6mIncome = 0;
    let total6mExpense = 0;

    const data = months.map((mKey) => {
      const mTx = transactions.filter((t) => t.date && t.date.startsWith(mKey));
      const income = mTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const expense = mTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const net = income - expense;

      // Calculate percentage growth compared to previous month
      let growthRate: number | null = null;
      if (prevMonthIncome > 0 && income > 0) {
        growthRate = Math.round(((income - prevMonthIncome) / prevMonthIncome) * 100);
      }
      prevMonthIncome = income;

      total6mIncome += income;
      total6mExpense += expense;

      return {
        key: mKey,
        label: formatBnMonthYear(mKey),
        income,
        expense,
        net,
        growthRate
      };
    });

    const sixMonthNet = total6mIncome - total6mExpense;
    
    // Overall Growth (compare current month with 1st of the 6 months)
    const firstMonthIncome = data[0]?.income || 0;
    const latestMonthIncome = data[data.length - 1]?.income || 0;
    let overallGrowth = 0;
    if (firstMonthIncome > 0 && latestMonthIncome > 0) {
      overallGrowth = Math.round(((latestMonthIncome - firstMonthIncome) / firstMonthIncome) * 100);
    }

    return {
      monthlyData: data,
      sixMonthStats: {
        totalIncome: total6mIncome,
        totalExpense: total6mExpense,
        net: sixMonthNet,
        overallGrowth
      }
    };
  }, [transactions]);

  // 2. Process Daily Data for Selected Month
  const dailyData = useMemo(() => {
    const monthTransactions = transactions.filter(
      (t) => t.date && t.date.startsWith(selectedMonth)
    );

    const dayMap = new Map<string, { income: number; expense: number }>();

    monthTransactions.forEach((t) => {
      const day = t.date;
      const current = dayMap.get(day) || { income: 0, expense: 0 };
      if (t.type === 'income') {
        current.income += Number(t.amount) || 0;
      } else {
        current.expense += Number(t.amount) || 0;
      }
      dayMap.set(day, current);
    });

    const sortedDays = Array.from(dayMap.keys()).sort();

    return sortedDays.map((fullDate) => {
      const dayNum = fullDate.split('-')[2] || fullDate;
      const val = dayMap.get(fullDate)!;
      const net = val.income - val.expense;
      return {
        key: fullDate,
        label: `${formatBnNumber(dayNum)} তারিখ`,
        fullDate,
        income: val.income,
        expense: val.expense,
        net,
        growthRate: null
      };
    });
  }, [transactions, selectedMonth]);

  const activeData = chartMode === 'monthly' ? monthlyData : dailyData;

  // Custom Bengali Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-52 z-50">
          <div className="border-b border-slate-700 pb-1.5 flex items-center justify-between">
            <span className="font-bold text-slate-200 text-sm">{data.label || label}</span>
            {data.growthRate !== null && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                data.growthRate >= 0 ? 'bg-emerald-900/80 text-emerald-300' : 'bg-rose-900/80 text-rose-300'
              }`}>
                {data.growthRate >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{data.growthRate >= 0 ? `+${formatBnNumber(data.growthRate)}%` : `${formatBnNumber(data.growthRate)}%`}</span>
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-emerald-400 font-semibold">
            <span>আয় (Cash In):</span>
            <span>{formatBnCurrency(data.income)}</span>
          </div>
          <div className="flex items-center justify-between text-rose-400 font-semibold">
            <span>ব্যয় (Cash Out):</span>
            <span>{formatBnCurrency(data.expense)}</span>
          </div>
          <div className={`flex items-center justify-between font-bold pt-1.5 border-t border-slate-800 ${
            data.net >= 0 ? 'text-teal-300' : 'text-amber-400'
          }`}>
            <span>{data.net >= 0 ? 'নিট উদ্বৃত্ত / মুনাফা:' : 'ঘাটতি / লোকসান:'}</span>
            <span>{formatBnCurrency(Math.abs(data.net))}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      
      {/* Chart Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>বিগত ৬ মাসের আয়-ব্যয় তুলনা ও ক্যাশ ফ্লো ট্রেন্ড</span>
                {chartMode === 'monthly' && sixMonthStats.overallGrowth !== 0 && (
                  <span className={`hidden md:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    sixMonthStats.overallGrowth > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {sixMonthStats.overallGrowth > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>
                      {sixMonthStats.overallGrowth > 0 ? `+${formatBnNumber(sixMonthStats.overallGrowth)}% প্রবৃদ্ধি` : `${formatBnNumber(sixMonthStats.overallGrowth)}% হ্রাস`}
                    </span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {chartMode === 'monthly'
                  ? 'গত ৬ মাসের ব্যবসার আয় বনাম ব্যয়ের তুলনামূলক পারফরম্যান্স ও প্রবৃদ্ধি পর্যবেক্ষণ'
                  : `${formatBnMonthYear(selectedMonth)} মাসের দিনভিত্তিক আয় বনাম ব্যয়ের তুলনামূলক চার্ট`}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
          <button
            type="button"
            onClick={() => setChartMode('monthly')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              chartMode === 'monthly'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>বিগত ৬ মাসের ট্রেন্ড</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode('daily')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              chartMode === 'daily'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>চলতি মাস ({formatBnMonthYear(selectedMonth)})</span>
          </button>
        </div>
      </div>

      {/* 6-Month Summary Statistics Mini-Row (Shown when in monthly mode) */}
      {chartMode === 'monthly' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between sm:justify-start sm:gap-3 px-2">
            <span className="text-slate-500 font-medium">৬ মাসের মোট আয়:</span>
            <span className="font-extrabold text-emerald-700 text-sm">
              {formatBnCurrency(sixMonthStats.totalIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:gap-3 px-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-1 sm:pt-0">
            <span className="text-slate-500 font-medium">৬ মাসের মোট ব্যয়:</span>
            <span className="font-extrabold text-rose-600 text-sm">
              {formatBnCurrency(sixMonthStats.totalExpense)}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:gap-3 px-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-1 sm:pt-0">
            <span className="text-slate-500 font-medium">৬ মাসের নিট উদ্বৃত্ত:</span>
            <span className={`font-extrabold text-sm ${sixMonthStats.net >= 0 ? 'text-teal-700' : 'text-amber-700'}`}>
              {formatBnCurrency(sixMonthStats.net)}
            </span>
          </div>
        </div>
      )}

      {/* Recharts Bar Chart Area */}
      <div className="h-72 w-full pt-1">
        {activeData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
            <BarChart3 className="w-10 h-10 text-slate-300" />
            <p className="text-xs font-medium">কোনো লেনদেনের তথ্য পাওয়া যায়নি।</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={activeData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `৳${val > 999 ? formatBnNumber(Math.round(val / 1000)) + 'k' : formatBnNumber(val)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
                formatter={(value) => {
                  if (value === 'income') return 'আয় (Income)';
                  if (value === 'expense') return 'ব্যয় (Expense)';
                  if (value === 'net') return 'নিট উদ্বৃত্ত (Net Balance)';
                  return value;
                }}
              />
              {/* Income Bar (Green) */}
              <Bar
                dataKey="income"
                name="income"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
              {/* Expense Bar (Rose Red) */}
              <Bar
                dataKey="expense"
                name="expense"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
              {/* Net Cash Flow Line (Teal) */}
              <Line
                type="monotone"
                dataKey="net"
                name="net"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Indicator Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
          <div className="w-3 h-3 rounded bg-emerald-500 shrink-0"></div>
          <div>
            <span className="text-[11px] text-emerald-900 font-bold block">সবুজ বার: আয় (Income)</span>
            <span className="text-slate-600 text-[10px]">মাসিক মোট প্রাপ্তি ও বিক্রয়ের হিসাব</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
          <div className="w-3 h-3 rounded bg-rose-500 shrink-0"></div>
          <div>
            <span className="text-[11px] text-rose-900 font-bold block">লাল বার: ব্যয় (Expense)</span>
            <span className="text-slate-600 text-[10px]">মাসিক যাবতীয় খরচ ও পাওনা পরিশোধ</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
          <div className="w-3 h-1 bg-teal-600 rounded-full shrink-0"></div>
          <div>
            <span className="text-[11px] text-teal-900 font-bold block">টিয়াল লাইন: ক্যাশ ফ্লো ট্রেন্ড</span>
            <span className="text-slate-600 text-[10px]">আয় থেকে ব্যয় বাদ দিয়ে প্রকৃত নিট লাভ</span>
          </div>
        </div>
      </div>

    </div>
  );
};
