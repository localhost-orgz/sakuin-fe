import React, { useState, useMemo } from "react";
import { TrendingDown, Calendar, PieChart, BarChart2, Filter } from "lucide-react";
import { getWalletTheme } from "../hooks/useWalletTheme";

export default function AnalyticsTab({ transactions = [], categories = [] }) {
  const [selectedMonth, setSelectedMonth] = useState("all");

  const formatIDR = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Filter transactions based on selection
  const filteredExpenses = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    if (selectedMonth === "all") return expenses;
    return expenses.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Aggregate monthly expense figures (May vs April)
  const monthlyBreakdown = useMemo(() => {
    let maySum = 0;
    let aprilSum = 0;
    let otherSum = 0;

    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        const amt = Number(tx.amount) || 0;
        if (tx.date.startsWith("2026-05")) maySum += amt;
        else if (tx.date.startsWith("2026-04")) aprilSum += amt;
        else otherSum += amt;
      }
    });

    const maxAmt = Math.max(maySum, aprilSum, otherSum, 1);

    return [
      { month: "April 2026", key: "2026-04", total: aprilSum, heightPct: Math.round((aprilSum / maxAmt) * 100) },
      { month: "May 2026", key: "2026-05", total: maySum, heightPct: Math.round((maySum / maxAmt) * 100) },
    ];
  }, [transactions]);

  // Aggregate category distributions
  const categoryChartData = useMemo(() => {
    const sums = {};
    filteredExpenses.forEach((tx) => {
      const catId = typeof tx.category_id === "object" && tx.category_id
        ? tx.category_id._id || tx.category_id.id
        : tx.category_id;
      if (catId) {
        sums[catId] = (sums[catId] || 0) + (Number(tx.amount) || 0);
      }
    });

    const totalExpense = Object.values(sums).reduce((a, b) => a + b, 0) || 1;

    const items = categories
      .map((cat) => {
        const catId = cat._id || cat.id;
        const total = sums[catId] || 0;
        const pct = Math.round((total / totalExpense) * 100);
        return {
          id: catId,
          name: cat.name,
          emoticon: cat.emoticon || "🏷️",
          themeId: cat.themeId || "ocean",
          total,
          percentage: pct,
        };
      })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);

    return { items, totalExpense };
  }, [filteredExpenses, categories]);

  // Generate SVG Pie/Donut Chart parameters
  const donutSegments = useMemo(() => {
    let accumulatedAngle = 0;
    return categoryChartData.items.map((item) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      const theme = getWalletTheme(item.themeId);
      const color = theme?.accentColor || "#787671";

      return {
        ...item,
        startAngle,
        angle,
        color
      };
    });
  }, [categoryChartData]);

  const expenseTotal = categoryChartData.totalExpense;

  return (
    <div className="animate-fade-in text-left bg-[#f5f6fa] min-h-screen pb-16">
      {/* ─── GREEN PINNED HEADER ─── */}
      <div className="bg-[#00bf71] text-white pt-10 pb-28 px-6 md:px-12 relative overflow-hidden">
        {/* Subtle decorative blobs */}
        <div className="absolute w-64 h-64 bg-white/5 rounded-full -top-32 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -bottom-48 -right-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Expense Analytics
            </h1>
            <p className="text-sm text-white/70 font-medium mt-1">
              Visual analysis of your cashflows and spending trends.
            </p>
          </div>

          {/* Filter Month Button group */}
          <div className="flex bg-white/20 backdrop-blur-sm border border-white/20 p-1 rounded-full self-start sm:self-center">
            {["all", "2026-05", "2026-04"].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                  selectedMonth === m
                    ? "bg-white text-[#00bf71] shadow-sm font-black"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {m === "all" ? "All Time" : m === "2026-05" ? "May '26" : "Apr '26"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative -mt-20">
        {/* Donut and Bar Chart Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Bar Comparison */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100/50 space-y-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-[#00bf71]" /> Monthly Trend
              </h3>
              <p className="text-[10px] text-slate-500 leading-tight">Total expense comparison between months.</p>
            </div>

            {/* Bar chart area */}
            <div className="h-44 flex items-end justify-around gap-6 border-b border-slate-100 pb-2 pt-6">
              {monthlyBreakdown.map((bar) => (
                <div key={bar.key} className="flex flex-col items-center gap-2 w-1/3 group">
                  <span className="text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {formatIDR(bar.total).replace("Rp", "").trim()}
                  </span>
                  <div className="w-12 bg-slate-50 border border-slate-100 rounded-t-xl h-28 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${bar.heightPct}%` }}
                      className="w-full bg-[#00bf71] hover:bg-[#00a862] transition-all duration-300 rounded-t-xl"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 text-center">{bar.month}</span>
                </div>
              ))}
            </div>

            {/* Total cards list style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f5f6fa] rounded-2xl p-3 text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">May Total</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">
                  {formatIDR(monthlyBreakdown.find((b) => b.key === "2026-05")?.total || 0).replace("Rp", "").trim()}
                </span>
              </div>
              <div className="bg-[#f5f6fa] rounded-2xl p-3 text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">April Total</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">
                  {formatIDR(monthlyBreakdown.find((b) => b.key === "2026-04")?.total || 0).replace("Rp", "").trim()}
                </span>
              </div>
            </div>
          </div>

          {/* Categories Distribution Donut */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100/50 space-y-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-[#00bf71]" /> Category Share
              </h3>
              <p className="text-[10px] text-slate-500 leading-tight">Expense distribution across categories.</p>
            </div>

            {categoryChartData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center flex-1">
                <PieChart className="w-8 h-8 text-slate-300 stroke-1" />
                <p className="text-slate-400 text-xs font-semibold mt-2">No expenses found for this month filter.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 py-2 flex-1">
                {/* Circular SVG Donut Chart */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f6f5f4" strokeWidth="6" />
                    {donutSegments.map((seg, i) => {
                      const radius = 15.915;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = `${
                        circumference - (donutSegments.slice(0, i).reduce((sum, s) => sum + s.percentage, 0) / 100) * circumference
                      }`;

                      return (
                        <circle
                          key={seg.id}
                          cx="21"
                          cy="21"
                          r={radius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="6"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-[7px] cursor-pointer"
                        />
                      );
                    })}
                  </svg>
                  {/* Center text total */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total</span>
                    <span className="text-xs font-extrabold text-slate-800 leading-none mt-0.5">
                      {expenseTotal >= 1000000 ? `${(expenseTotal / 1000000).toFixed(1)}M` : formatIDR(expenseTotal).replace("Rp", "").trim()}
                    </span>
                  </div>
                </div>

                {/* Legends list */}
                <div className="flex-1 space-y-2 w-full text-left">
                  {donutSegments.slice(0, 4).map((seg) => (
                    <div key={seg.id} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div style={{ backgroundColor: seg.color }} className="w-2 h-2 rounded-full flex-shrink-0" />
                        <span className="font-bold text-slate-700 truncate">{seg.emoticon} {seg.name}</span>
                      </div>
                      <span className="font-extrabold text-slate-800 shrink-0 ml-1">{seg.percentage}%</span>
                    </div>
                  ))}
                  {donutSegments.length > 4 && (
                    <p className="text-[9px] text-slate-400 font-bold text-center mt-1">
                      +{donutSegments.length - 4} more categories
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database List Details */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100/50 overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              Category Distribution
            </span>
          </div>

          {categoryChartData.items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-400 text-xs font-semibold">No records found for current workspace view.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categoryChartData.items.map((cat) => {
                const theme = getWalletTheme(cat.themeId);
                return (
                  <div key={cat.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: theme.bgColor || "#F0F9FF" }}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0"
                      >
                        {cat.emoticon}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-850">{cat.name}</h4>
                        <span
                          style={{
                            backgroundColor: theme?.iconBgColor || "#f1f1ef",
                            color: theme?.textColor || "#37352f"
                          }}
                          className="px-2 py-0.5 rounded font-bold text-[9px] uppercase border border-slate-200/10 inline-block mt-1"
                        >
                          {theme?.label || "General"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-slate-800 block">
                        {formatIDR(cat.total).replace("Rp", "").trim()}
                      </span>
                      <span className="text-[10px] text-[#00bf71] font-bold mt-0.5 inline-block">
                        {cat.percentage}% of workspace total
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


