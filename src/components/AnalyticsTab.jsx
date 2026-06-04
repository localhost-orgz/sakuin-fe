import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, BarChart2, PieChart, Lightbulb } from "lucide-react";
import { getWalletTheme } from "../hooks/useWalletTheme";

const GREEN = "#00bf71";
const VIOLET = "#8b5cf6";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_MAP = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  0: "Sun",
};

const MONTHS_OF_YEAR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const getWeekKey = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const formatWeekLabel = (monday) => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startMonth = MONTH_NAMES[monday.getMonth()];
  const startDay = monday.getDate();

  const endMonth = MONTH_NAMES[sunday.getMonth()];
  const endDay = sunday.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  } else {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  }
};

const parseDateSafe = (dateStr) => {
  if (dateStr instanceof Date) return dateStr;
  if (!dateStr) return new Date();

  const parts = String(dateStr).split("T")[0].split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date(dateStr);
};

const getLocalDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const rp = (n) =>
  n === 0 ? "Rp 0" : "Rp " + new Intl.NumberFormat("id-ID").format(n);

const rpShort = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
};

const dimColor = (color, opacity = 0.22) => {
  if (!color) return `rgba(0, 191, 113, ${opacity})`;
  if (color.startsWith("rgba")) {
    const lastCommaIdx = color.lastIndexOf(",");
    if (lastCommaIdx !== -1) {
      return color.substring(0, lastCommaIdx + 1) + ` ${opacity})`;
    }
  }
  if (color.startsWith("#")) {
    const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, "0");
    return color + hexOpacity;
  }
  return color;
};

const createZeroBreakdown = (cats) => {
  const res = {};
  cats.forEach((c) => {
    res[c.id] = 0;
  });
  return res;
};

const sumBreakdowns = (bds, cats) => {
  const result = createZeroBreakdown(cats);
  bds.forEach((bd) => {
    cats.forEach((c) => {
      result[c.id] += bd[c.id] || 0;
    });
  });
  return result;
};

function CategoryRow({ cat, amount, totalAmount, selected, onPress }) {
  const pct = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
  const theme = getWalletTheme(cat.themeId);
  const dimmedBg = dimColor(cat.color, 0.12);

  return (
    <button
      onClick={onPress}
      className="w-full text-left flex items-center gap-3 rounded-2xl p-3 border-2 transition-all duration-200 cursor-pointer hover:scale-[1.005] active:scale-[0.99] group"
      style={{
        borderColor: selected ? cat.color : "transparent",
        backgroundColor: selected ? dimmedBg : "#f9fafb",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: theme.iconBgColor }}
      >
        <span>{cat.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-800 truncate">
            {cat.label}
          </span>
          <span className="text-xs font-bold" style={{ color: cat.color }}>
            {rp(amount)}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              backgroundColor: cat.color,
            }}
          />
        </div>
      </div>

      <div
        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0"
        style={{
          backgroundColor: theme.iconBgColor,
          color: cat.color,
        }}
      >
        {pct.toFixed(0)}%
      </div>
    </button>
  );
}

export default function AnalyticsTab({ transactions = [], categories = [] }) {
  // ── View mode ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("weekly");
  const [weekIdx, setWeekIdx] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());

  // ── Selection state ────────────────────────────────────────────────────────
  const [selectedBar, setSelectedBar] = useState(null); // day or month label
  const [selectedCat, setSelectedCat] = useState(null);

  const resolveCategory = (catIdOrObj) => {
    if (!catIdOrObj) return null;
    if (typeof catIdOrObj === "object") return catIdOrObj;
    return categories.find((c) => (c._id || c.id) === catIdOrObj) || null;
  };

  const dynamicCats = useMemo(() => {
    const list = categories.map((cat) => {
      const id = cat._id || cat.id;
      const themeId = cat.themeId || cat.theme_id || cat.color || "ocean";
      const theme = getWalletTheme(themeId);
      return {
        id,
        label: cat.name || cat.label || "Unnamed",
        icon: cat.emoticon || cat.icon || "🏷️",
        color: theme.accentColor || GREEN,
        themeId,
      };
    });

    const categoryIds = new Set(categories.map((c) => c._id || c.id));
    const hasOtherSpending = transactions.some((tx) => {
      if (tx.type !== "expense") return false;
      const catObj = resolveCategory(tx.category_id);
      if (!catObj) return true;
      const catId = catObj._id || catObj.id;
      return !categoryIds.has(catId);
    });

    if (hasOtherSpending && !list.some((c) => c.id === "other")) {
      list.push({
        id: "other",
        label: "Other",
        icon: "📦",
        color: VIOLET,
        themeId: "violet",
      });
    }
    return list;
  }, [categories, transactions]);

  // Generate weeks dynamically from transactions
  const dynamicWeeks = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");

    if (expenses.length === 0) {
      const weeks = [];
      const now = new Date();
      let monday = getWeekKey(now);
      monday.setDate(monday.getDate() - 21);
      for (let i = 0; i < 4; i++) {
        const label = formatWeekLabel(monday);
        const days = DAYS_OF_WEEK.map((d) => ({
          day: d,
          total: 0,
          breakdown: createZeroBreakdown(dynamicCats),
        }));
        weeks.push({ label, days });
        monday = new Date(monday);
        monday.setDate(monday.getDate() + 7);
      }
      return weeks;
    }

    let minDate = new Date();
    let maxDate = new Date();
    expenses.forEach((tx, idx) => {
      const d = parseDateSafe(tx.date);
      if (idx === 0) {
        minDate = d;
        maxDate = d;
      } else {
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      }
    });

    const startMon = getWeekKey(minDate);
    const endMon = getWeekKey(maxDate);

    const weeksMap = {};
    let currentMon = new Date(startMon);

    while (currentMon <= endMon) {
      const keyStr = getLocalDateString(currentMon);
      const label = formatWeekLabel(currentMon);
      const days = DAYS_OF_WEEK.map((d) => ({
        day: d,
        total: 0,
        breakdown: createZeroBreakdown(dynamicCats),
      }));
      weeksMap[keyStr] = { label, days };

      currentMon.setDate(currentMon.getDate() + 7);
    }

    expenses.forEach((tx) => {
      const txDate = parseDateSafe(tx.date);
      const mon = getWeekKey(txDate);
      const keyStr = getLocalDateString(mon);
      const week = weeksMap[keyStr];
      if (week) {
        const dayIdx = txDate.getDay();
        const dayKey = DAY_MAP[dayIdx];
        const dayObj = week.days.find((d) => d.day === dayKey);
        if (dayObj) {
          const amt = Number(tx.amount) || 0;
          dayObj.total += amt;

          const catObj = resolveCategory(tx.category_id);
          const catId = catObj ? catObj._id || catObj.id : "other";

          if (dayObj.breakdown[catId] !== undefined) {
            dayObj.breakdown[catId] += amt;
          } else {
            if (dayObj.breakdown["other"] !== undefined) {
              dayObj.breakdown["other"] += amt;
            }
          }
        }
      }
    });

    return Object.entries(weeksMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => val);
  }, [transactions, dynamicCats]);

  // Group annual data dynamically from transactions
  const annualData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const years = new Set();
    expenses.forEach((tx) => {
      const date = parseDateSafe(tx.date);
      const yearVal = date.getFullYear();
      if (!isNaN(yearVal)) {
        years.add(yearVal);
      }
    });

    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }

    const yearRange = Array.from(years).sort((a, b) => a - b);

    const dataMap = {};
    yearRange.forEach((yr) => {
      dataMap[yr] = MONTHS_OF_YEAR.map((m) => ({
        month: m,
        total: 0,
        breakdown: createZeroBreakdown(dynamicCats),
      }));
    });

    expenses.forEach((tx) => {
      const date = parseDateSafe(tx.date);
      const yr = date.getFullYear();
      const monthIdx = date.getMonth();
      const monthKey = MONTHS_OF_YEAR[monthIdx];
      const yearMonths = dataMap[yr];
      if (yearMonths) {
        const monthObj = yearMonths.find((m) => m.month === monthKey);
        if (monthObj) {
          const amt = Number(tx.amount) || 0;
          monthObj.total += amt;

          const catObj = resolveCategory(tx.category_id);
          const catId = catObj ? catObj._id || catObj.id : "other";

          if (monthObj.breakdown[catId] !== undefined) {
            monthObj.breakdown[catId] += amt;
          } else {
            if (monthObj.breakdown["other"] !== undefined) {
              monthObj.breakdown["other"] += amt;
            }
          }
        }
      }
    });

    return {
      years: yearRange,
      data: dataMap,
    };
  }, [transactions, dynamicCats]);

  // Sync index hooks to use latest datasets by default
  useEffect(() => {
    if (dynamicWeeks.length > 0) {
      setWeekIdx(dynamicWeeks.length - 1);
    }
  }, [dynamicWeeks.length]);

  useEffect(() => {
    if (annualData.years.length > 0) {
      setYear(annualData.years[annualData.years.length - 1]);
    }
  }, [annualData.years]);

  const handleMode = (m) => {
    setMode(m);
    setSelectedCat(null);
    setSelectedBar(null);
  };

  const handleWeekNav = (dir) => {
    const next = weekIdx + dir;
    if (next < 0 || next >= dynamicWeeks.length) return;
    setWeekIdx(next);
    setSelectedCat(null);
    setSelectedBar(null);
  };

  const handleYearNav = (dir) => {
    const currentIdx = annualData.years.indexOf(year);
    const nextIdx = currentIdx + dir;
    if (nextIdx < 0 || nextIdx >= annualData.years.length) return;
    setYear(annualData.years[nextIdx]);
    setSelectedCat(null);
    setSelectedBar(null);
  };

  const handleBarPress = (label) => {
    setSelectedBar((prev) => (prev === label ? null : label));
    setSelectedCat(null);
  };

  const handleCatPress = (id) => {
    setSelectedCat((prev) => (prev === id ? null : id));
    setSelectedBar(null);
  };

  // ── Derived active datasets ───────────────────────────────────────────────
  const weekRows = dynamicWeeks[weekIdx]?.days || [];
  const annualRows = annualData.data[year] || [];

  const getBreakdown = () => {
    if (mode === "weekly") {
      if (selectedBar) {
        const row = weekRows.find((r) => r.day === selectedBar);
        return row ? row.breakdown : createZeroBreakdown(dynamicCats);
      }
      return sumBreakdowns(weekRows.map((r) => r.breakdown), dynamicCats);
    } else {
      if (selectedBar) {
        const row = annualRows.find((r) => r.month === selectedBar);
        return row ? row.breakdown : createZeroBreakdown(dynamicCats);
      }
      return sumBreakdowns(annualRows.map((r) => r.breakdown), dynamicCats);
    }
  };

  const breakdown = getBreakdown();

  const totalExpense = selectedCat
    ? (breakdown[selectedCat] || 0)
    : Object.values(breakdown).reduce((s, v) => s + v, 0);

  const selectedCatObj = dynamicCats.find((c) => c.id === selectedCat);
  const activeColor = selectedCatObj ? selectedCatObj.color : GREEN;
  const dimmedColor = dimColor(activeColor, 0.22);

  const barData = useMemo(() => {
    if (mode === "weekly") {
      return weekRows.map((r) => {
        const val = selectedCat ? r.breakdown[selectedCat] || 0 : r.total || 0;
        const isSel = selectedBar === r.day;
        return {
          value: Math.round(val / 1000), // in thousands
          rawValue: val,
          label: r.day,
          isSel,
          topLabel: rpShort(val),
          frontColor: selectedBar
            ? isSel
              ? activeColor
              : dimmedColor
            : activeColor,
          onPress: () => handleBarPress(r.day),
        };
      });
    } else {
      return annualRows.map((r) => {
        const val = selectedCat ? r.breakdown[selectedCat] || 0 : r.total || 0;
        const isSel = selectedBar === r.month;
        return {
          value: Math.round(val / 1000),
          rawValue: val,
          label: r.month.slice(0, 3),
          isSel,
          topLabel: rpShort(val),
          frontColor: selectedBar
            ? isSel
              ? activeColor
              : dimmedColor
            : activeColor,
          onPress: () => handleBarPress(r.month),
        };
      });
    }
  }, [mode, weekRows, annualRows, selectedCat, selectedBar, activeColor, dimmedColor]);

  const maxBarVal = Math.max(...barData.map((d) => d.value), 1);
  const maxValRounded = Math.ceil(maxBarVal / 100) * 100 + 50;
  const step = maxValRounded / 4;
  const yAxisLabels = [
    maxValRounded,
    Math.round(maxValRounded - step),
    Math.round(maxValRounded - step * 2),
    Math.round(maxValRounded - step * 3),
    0
  ];

  const pieData = useMemo(() => {
    return dynamicCats
      .map((c) => ({
        value: breakdown[c.id] || 0,
        color: breakdown[c.id] === 0 ? "#e5e7eb" : c.color,
        isFocused: selectedCat === c.id,
        catId: c.id,
        label: c.label,
        icon: c.icon,
      }))
      .filter((d) => d.value > 0);
  }, [dynamicCats, breakdown, selectedCat]);

  const activePieData = useMemo(() => {
    if (pieData.length === 0) {
      return [{ value: 1, color: "#e5e7eb", isFocused: false, catId: null }];
    }
    return pieData;
  }, [pieData]);

  const totalPieVal = activePieData.reduce((s, v) => s + v.value, 0) || 1;

  const donutSegments = useMemo(() => {
    let accumulatedPct = 0;
    return activePieData.map((seg) => {
      const percentage = (seg.value / totalPieVal) * 100;
      const startPct = accumulatedPct;
      accumulatedPct += percentage;
      return {
        ...seg,
        percentage,
        startPct,
      };
    });
  }, [activePieData, totalPieVal]);

  const navLabel =
    mode === "weekly" ? dynamicWeeks[weekIdx]?.label || "" : String(year);

  const canPrev =
    mode === "weekly" ? weekIdx > 0 : annualData.years.indexOf(year) > 0;
  const canNext =
    mode === "weekly"
      ? weekIdx < dynamicWeeks.length - 1
      : annualData.years.indexOf(year) < annualData.years.length - 1;

  const filterLabel = selectedBar
    ? `${selectedBar} only`
    : selectedCat
      ? `${dynamicCats.find((c) => c.id === selectedCat)?.label} only`
      : null;

  const smartInsightText = useMemo(() => {
    if (selectedCat) {
      return `You spent ${rp(breakdown[selectedCat] || 0)} on ${dynamicCats.find((c) => c.id === selectedCat)?.label}${
        selectedBar ? ` on ${selectedBar}` : ` this ${mode === "weekly" ? "week" : "year"}`
      }.`;
    }
    if (selectedBar) {
      return `Total expense on ${selectedBar}: ${rp(Object.values(breakdown).reduce((s, v) => s + v, 0))}.`;
    }
    return mode === "weekly"
      ? `Your expenses are grouped by week. Tap a category or a daily bar to get smart stats.`
      : `Your expenses are grouped by month. Tap a category or a monthly bar to get smart stats.`;
  }, [selectedCat, selectedBar, breakdown, dynamicCats, mode]);

  return (
    <div className="animate-fade-in text-left bg-[#f5f6fa] min-h-screen pb-24">
      {/* ─── GREEN PINNED HEADER ─── */}
      <div className="bg-[#00bf71] text-white pt-10 pb-28 px-6 md:px-12 relative overflow-hidden">
        {/* Subtle decorative blobs */}
        <div className="absolute w-64 h-64 bg-white/5 rounded-full -top-32 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -bottom-48 -right-20 pointer-events-none" />

        <div className="max-w-xl mx-auto flex flex-col items-start gap-2 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Analytics
          </h1>
          <p className="text-xs text-white/70 font-medium mt-1">
            Expense overview
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 relative -mt-20 space-y-4">
        {/* ── Expense Card ── */}
        <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-100/50 space-y-4">
          {/* Mode Toggle pills */}
          <div className="flex gap-2">
            <button
              onClick={() => handleMode("weekly")}
              className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                mode === "weekly"
                  ? "bg-[#00bf71] text-white shadow-sm"
                  : "bg-[#f3f4f6] text-slate-500 hover:bg-slate-200"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => handleMode("annual")}
              className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                mode === "annual"
                  ? "bg-[#00bf71] text-white shadow-sm"
                  : "bg-[#f3f4f6] text-slate-500 hover:bg-slate-200"
              }`}
            >
              Annual
            </button>
          </div>

          {/* Navigation Row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => (mode === "weekly" ? handleWeekNav(-1) : handleYearNav(-1))}
              disabled={!canPrev}
              className={`p-2 rounded-xl transition-all ${
                canPrev ? "bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer" : "text-slate-300 pointer-events-none"
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-slate-800 select-none">
                {navLabel}
              </span>
              {filterLabel && (
                <button
                  onClick={() => {
                    setSelectedBar(null);
                    setSelectedCat(null);
                  }}
                  className="flex items-center gap-1 mt-1 bg-[#00bf71]/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#00bf71] hover:bg-[#00bf71]/20 cursor-pointer transition-colors"
                >
                  <span>{filterLabel}</span>
                  <span className="font-extrabold text-[9px]">✕</span>
                </button>
              )}
            </div>

            <button
              onClick={() => (mode === "weekly" ? handleWeekNav(1) : handleYearNav(1))}
              disabled={!canNext}
              className={`p-2 rounded-xl transition-all ${
                canNext ? "bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer" : "text-slate-300 pointer-events-none"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Total Expense chip */}
          <div className="inline-block bg-[#f0fdf8] border border-[#bbf7d0] rounded-xl px-3 py-1.5 text-left">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Expense
            </span>
            <span className="text-lg font-bold text-[#00bf71] block">
              {rp(totalExpense)}
            </span>
          </div>

          {/* Interactive Bar Chart */}
          <div className="flex items-stretch h-40 gap-3 mt-4">
            {/* Y-axis Labels */}
            <div className="flex flex-col justify-between text-[9px] text-slate-400 select-none pb-5 pr-1 text-right w-8">
              {yAxisLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}k</span>
              ))}
            </div>

            {/* Grid + Bars area */}
            <div className="flex-1 relative flex items-end justify-between h-full pb-5">
              {/* Horizontal grid lines */}
              <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full border-t border-slate-100" />
                ))}
              </div>

              {/* Bars */}
              {barData.map((bar, index) => {
                const pct = Math.min((bar.value / maxValRounded) * 100, 100);
                return (
                  <div
                    key={index}
                    onClick={bar.onPress}
                    className="relative flex-1 flex flex-col items-center group cursor-pointer h-full justify-end z-10"
                    style={{ minWidth: 0 }}
                  >
                    {/* Tooltip above active bar */}
                    {bar.isSel && (
                      <div
                        className="absolute z-20 px-1.5 py-0.5 text-[9px] font-bold text-white rounded shadow-md pointer-events-none transition-all duration-205"
                        style={{
                          backgroundColor: bar.frontColor,
                          bottom: `${pct}%`,
                          transform: `translateY(-6px)`,
                        }}
                      >
                        <span className="whitespace-nowrap">{bar.topLabel}</span>
                        <div
                          className="absolute w-1 h-1 rotate-45 left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2"
                          style={{ backgroundColor: bar.frontColor }}
                        />
                      </div>
                    )}

                    {/* Bar */}
                    <div className="w-full max-w-[22px] bg-slate-50 hover:bg-slate-100/50 rounded-t flex items-end h-full transition-colors duration-200">
                      <div
                        style={{
                          height: `${pct}%`,
                          backgroundColor: bar.frontColor,
                        }}
                        className="w-full rounded-t transition-all duration-500 ease-out"
                      />
                    </div>

                    {/* X-axis Label */}
                    <div
                      className={`absolute bottom-0 text-[9px] font-extrabold transition-colors duration-200 select-none ${
                        bar.isSel ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    >
                      {bar.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tap Hint */}
          <div className="text-[10px] text-slate-400 text-center select-none pt-1">
            Tap a bar to filter by {mode === "weekly" ? "day" : "month"}
          </div>
        </div>

        {/* ── Breakdown Card ── */}
        <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-100/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">
              Breakdown
            </h2>
            {(selectedBar || selectedCat) && (
              <button
                onClick={() => {
                  setSelectedBar(null);
                  setSelectedCat(null);
                }}
                className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-200 cursor-pointer transition-colors"
              >
                Clear ✕
              </button>
            )}
          </div>

          {/* Donut Chart */}
          <div className="flex justify-center py-2">
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f6f5f4" strokeWidth="5" />
                {donutSegments.map((seg, i) => {
                  const radius = 15.915;
                  const circumference = 2 * Math.PI * radius;
                  const segmentLength = (seg.percentage / 100) * circumference;
                  const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
                  const strokeDashoffset = `${-(seg.startPct / 100) * circumference}`;

                  return (
                    <circle
                      key={seg.catId || `empty-${i}`}
                      cx="21"
                      cy="21"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={seg.isFocused ? 7 : 5}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      onClick={() => seg.catId && handleCatPress(seg.catId)}
                      className={`transition-all duration-300 cursor-pointer ${
                        seg.catId ? "hover:stroke-[6.5px]" : ""
                      }`}
                      style={{
                        transformOrigin: "center",
                      }}
                    />
                  );
                })}
              </svg>
              {/* Center text total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 select-none pointer-events-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate max-w-[120px]">
                  {selectedCatObj ? selectedCatObj.label : "Total"}
                </span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5 whitespace-nowrap">
                  {rpShort(totalExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Pie legend */}
          <div className="flex flex-wrap gap-2 justify-center pb-2">
            {dynamicCats.map((c) => {
              const count = breakdown[c.id] || 0;
              const isDimmed = selectedCat && selectedCat !== c.id;
              if (count === 0 && !selectedCat) return null;
              return (
                <button
                  key={c.id}
                  onClick={() => handleCatPress(c.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none text-[10px] font-bold ${
                    selectedCat === c.id
                      ? "border-current bg-current/10"
                      : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                  style={{
                    borderColor: selectedCat === c.id ? c.color : undefined,
                    color: selectedCat === c.id ? c.color : "#6b7280",
                    opacity: isDimmed ? 0.45 : 1,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category progress rows */}
          <div className="space-y-2">
            {dynamicCats.map((cat) => {
              const amount = breakdown[cat.id] || 0;
              const totalAmount = Object.values(breakdown).reduce((s, v) => s + v, 0);
              // Hide empty category rows if no filters are selected, to keep clean look
              if (amount === 0 && selectedCat !== cat.id) return null;
              return (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  amount={amount}
                  totalAmount={totalAmount}
                  selected={selectedCat === cat.id}
                  onPress={() => handleCatPress(cat.id)}
                />
              );
            })}
            {Object.values(breakdown).reduce((s, v) => s + v, 0) === 0 && (
              <div className="py-6 text-center text-xs text-slate-400 font-bold select-none">
                No expense records for this selection.
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 text-center select-none pt-1">
            Tap a category to filter
          </div>
        </div>

        {/* ── Smart Insights Card ── */}
        <div className="bg-[#f0fdf8] border-2 border-[#bbf7d0] rounded-3xl p-4 flex gap-3 text-left">
          <div className="text-2xl select-none leading-none">💡</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-extrabold text-slate-800">
              Smart Insight
            </h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">
              {smartInsightText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
