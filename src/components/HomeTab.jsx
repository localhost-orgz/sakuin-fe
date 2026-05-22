import React, { useMemo } from "react";
import { Eye, EyeOff, Wallet, TrendingUp, TrendingDown, Target } from "lucide-react";
import { getWalletGradient, getWalletTheme } from "../hooks/useWalletTheme";

export default function HomeTab({
  user,
  wallets = [],
  transactions = [],
  categories = [],
  goals = [],
  loading,
  isBalanceShow,
  setIsBalanceShow,
  onSeedData,
  onNavigateToTab,
  onAddTransactionClick
}) {
  const formatIDR = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  }, [wallets]);

  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const monthlyExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const {
    incomePercent,
    expensePercent,
    isIncomeUp,
    isExpenseUp
  } = useMemo(() => {
    let curIncome = 0;
    let curExpense = 0;
    let lastIncome = 0;
    let lastExpense = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      const amount = Number(tx.amount) || 0;

      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        if (tx.type === "income") {
          curIncome += amount;
        } else if (tx.type === "expense") {
          curExpense += amount;
        }
      } else if (txDate.getFullYear() === lastYear && txDate.getMonth() === lastMonth) {
        if (tx.type === "income") {
          lastIncome += amount;
        } else if (tx.type === "expense") {
          lastExpense += amount;
        }
      }
    });

    let incPct = 0;
    if (lastIncome > 0) {
      incPct = Math.round(((curIncome - lastIncome) / lastIncome) * 100);
    } else if (curIncome > 0) {
      incPct = 100;
    }

    let expPct = 0;
    if (lastExpense > 0) {
      expPct = Math.round(((curExpense - lastExpense) / lastExpense) * 100);
    } else if (curExpense > 0) {
      expPct = 100;
    }

    return {
      incomePercent: Math.abs(incPct),
      expensePercent: Math.abs(expPct),
      isIncomeUp: incPct >= 0,
      isExpenseUp: expPct >= 0,
    };
  }, [transactions]);

  const topCategoriesData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const sums = {};

    expenses.forEach((tx) => {
      const catId = typeof tx.category_id === "object" && tx.category_id
        ? tx.category_id._id || tx.category_id.id
        : tx.category_id;
      if (catId) {
        sums[catId] = (sums[catId] || 0) + (Number(tx.amount) || 0);
      }
    });

    const totalExpenseAmount = Object.values(sums).reduce((a, b) => a + b, 0) || 1;

    const mapped = categories.map((cat) => {
      const catId = cat._id || cat.id;
      const amount = sums[catId] || 0;
      const pct = Math.round((amount / totalExpenseAmount) * 100);
      return {
        id: catId,
        name: cat.name,
        emoticon: cat.emoticon || "🏷️",
        themeId: cat.themeId || "ocean",
        amount,
        percentage: pct
      };
    });

    return mapped.filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-[#f5f6fa]">
        <div className="w-10 h-10 rounded-full border-4 border-[#00bf71] border-t-transparent animate-spin" />
        <p className="text-slate-500 text-xs font-semibold">Loading Sakuin Workspace...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-left bg-[#f5f6fa] min-h-screen pb-16">
      {/* ─── GREEN PINNED GREETING HEADER ─── */}
      <div className="bg-[#00bf71] text-white pt-10 pb-28 px-6 md:px-12 relative overflow-hidden">
        {/* Subtle decorative top blobs */}
        <div className="absolute w-64 h-64 bg-white/5 rounded-full -top-32 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -bottom-48 -right-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden flex items-center justify-center shadow-md">
              {user?.avatar_url || user?.avatarUrl ? (
                <img
                  src={user.avatar_url || user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-2xl font-black text-white">
                  {user?.name ? user.name[0].toUpperCase() : "S"}
                </div>
              )}
            </div>
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Hi, {user?.name ? user.name.split(" ")[0] : "Friend"}
              </h1>
              <p className="text-sm text-white/70 font-medium">welcome back</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBalanceShow(!isBalanceShow)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/40 hover:bg-white/10 transition-all font-semibold text-xs cursor-pointer text-white shadow-sm"
            >
              {isBalanceShow ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide Balance
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Show Balance
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative -mt-20">
        {/* Floating Income & Expense Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Income Card */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100/50 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">
              Income
            </span>
            <div className="mt-2 flex flex-col justify-between h-full">
              <div className="flex items-baseline text-2xl font-black text-slate-800 text-left">
                <span className="text-sm font-semibold text-slate-400 mr-0.5">Rp</span>
                {isBalanceShow ? formatIDR(monthlyIncome).replace("Rp", "").trim() : "••••••••"}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#00BC7D] text-left">
                <TrendingUp className="w-4 h-4" />
                <span>
                  {isIncomeUp ? "+" : "-"}
                  {incomePercent}% from last month
                </span>
              </div>
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100/50 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">
              Expense
            </span>
            <div className="mt-2 flex flex-col justify-between h-full">
              <div className="flex items-baseline text-2xl font-black text-slate-800 text-left">
                <span className="text-sm font-semibold text-slate-400 mr-0.5">Rp</span>
                {isBalanceShow ? formatIDR(monthlyExpense).replace("Rp", "").trim() : "••••••••"}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-rose-500 text-left">
                <TrendingDown className="w-4 h-4" />
                <span>
                  {isExpenseUp ? "+" : "-"}
                  {expensePercent}% from last month
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── WALLETS SECTION ─── */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest text-left">
              Account Database
            </h2>
            <button
              onClick={() => onNavigateToTab("portfolio")}
              className="text-xs text-[#00bf71] font-bold hover:underline cursor-pointer"
            >
              + Create New Wallet
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin">
            {wallets.length === 0 ? (
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 bg-white">
                No active wallets found.
              </div>
            ) : (
              wallets.map((wallet) => {
                const theme = getWalletTheme(wallet.themeId || wallet.color || "ocean");
                const isDark =
                  theme.gradientColors[0].startsWith("#0") ||
                  theme.gradientColors[0].startsWith("#1") ||
                  theme.gradientColors[0].startsWith("#2") ||
                  theme.gradientColors[0].startsWith("#3");

                // Blob colors
                const blobColor = isDark ? "rgba(255,255,255,0.07)" : `${theme.shadowColor}22`;
                const blobColorStrong = isDark ? "rgba(255,255,255,0.11)" : `${theme.shadowColor}38`;

                // Calculate total expense for this wallet in current month
                const walletTx = transactions.filter(
                  (tx) => (tx.wallet_id === wallet._id || tx.wallet_id === wallet.id)
                );
                const walletExpense = walletTx
                  .filter((tx) => tx.type === "expense")
                  .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

                return (
                  <div
                    key={wallet._id || wallet.id}
                    onClick={() => onNavigateToTab("portfolio")}
                    style={{
                      background: getWalletGradient(wallet.themeId || wallet.color || "ocean"),
                    }}
                    className="min-w-[285px] w-[285px] h-[175px] shrink-0 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-200 shadow-md"
                  >
                    {/* Large blob — bottom right */}
                    <div
                      style={{ backgroundColor: blobColorStrong }}
                      className="absolute w-32 h-32 rounded-full -bottom-10 -right-8 pointer-events-none"
                    />
                    {/* Medium blob — overlapping large */}
                    <div
                      style={{ backgroundColor: blobColor }}
                      className="absolute w-20 h-20 rounded-full bottom-2 right-14 pointer-events-none"
                    />
                    {/* Small blob — top right floating */}
                    <div
                      style={{ backgroundColor: blobColorStrong }}
                      className="absolute w-10 h-10 rounded-full top-4 right-6 pointer-events-none"
                    />
                    {/* Tiny blob — mid right */}
                    <div
                      style={{ backgroundColor: blobColor }}
                      className="absolute w-5 h-5 rounded-full top-16 right-12 pointer-events-none"
                    />

                    {/* Content */}
                    <div className="flex items-center gap-2.5 relative z-10">
                      <div
                        style={{
                          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : `${theme.textColor}18`,
                        }}
                        className="p-2.5 rounded-2xl flex items-center justify-center shrink-0"
                      >
                        <Wallet
                          className={`w-5 h-5`}
                          style={isDark ? { color: "#ffffff" } : { color: theme.textColor }}
                        />
                      </div>
                      <div className="text-left">
                        <h3
                          className="font-bold text-sm leading-tight max-w-[150px] truncate"
                          style={{ color: isDark ? "#ffffff" : theme.textColor }}
                        >
                          {wallet.name}
                        </h3>
                        <span
                          className="text-[9px] uppercase font-bold tracking-wider block mt-0.5"
                          style={{ color: isDark ? "rgba(255,255,255,0.5)" : `${theme.textColor}88` }}
                        >
                          Wallet
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 text-left mt-auto">
                      <span
                        className="text-[9px] uppercase tracking-wider block font-bold"
                        style={{ color: isDark ? "rgba(255,255,255,0.5)" : `${theme.textColor}88` }}
                      >
                        Balance
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: isDark ? "#ffffff" : theme.textColor }}
                        >
                          Rp
                        </span>
                        <span
                          className="text-xl font-extrabold tracking-tight"
                          style={{ color: isDark ? "#ffffff" : theme.textColor }}
                        >
                          {isBalanceShow ? formatIDR(wallet.balance).replace("Rp", "").trim() : "••••••••"}
                        </span>
                      </div>
                      <span
                        className="text-[9px] block mt-1 font-bold"
                        style={{ color: isDark ? "rgba(255,255,255,0.5)" : `${theme.textColor}88` }}
                      >
                        This month: Rp{formatIDR(walletExpense).replace("Rp", "").trim()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── BOTTOM COLUMNS (GOALS & CATEGORIES) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Top Spend Categories */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100/50 space-y-4 text-left flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
                  Top Spending Categories
                </h3>
                <button
                  onClick={() => onNavigateToTab("analytics")}
                  className="text-xs text-[#00bf71] font-bold hover:underline cursor-pointer"
                >
                  View Details
                </button>
              </div>

              {topCategoriesData.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No expenses recorded yet.
                </div>
              ) : (
                <div className="flex overflow-x-auto gap-4 py-3 scrollbar-thin">
                  {topCategoriesData.map((cat) => {
                    const theme = getWalletTheme(cat.themeId || "ocean");
                    return (
                      <div
                        key={cat.id}
                        className="flex flex-col items-center gap-2 min-w-[70px] text-center group shrink-0"
                      >
                        <div
                          style={{ backgroundColor: theme.iconBgColor || "#f3f4f6" }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-[1.05]"
                        >
                          {cat.emoticon}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[64px]">
                          {cat.name}
                        </span>
                        <div className="bg-emerald-50 rounded-full px-2 py-0.5">
                          <span className="text-[9px] font-bold text-[#00BC7D] whitespace-nowrap">
                            Rp{cat.amount >= 1000000 ? `${(cat.amount / 1000000).toFixed(1)}M` : cat.amount >= 1000 ? `${(cat.amount / 1000).toFixed(0)}k` : cat.amount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Test Seeder Strip */}
            <div className="bg-emerald-50/40 border border-[#c4f5e6]/70 rounded-2xl p-3 flex items-center justify-between gap-3 mt-4">
              <div className="text-left">
                <span className="text-[9px] font-bold text-[#00bf71] uppercase tracking-wider block">
                  Visual Seeder
                </span>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Seed 8 transactions to explore dashboard charts.
                </p>
              </div>
              <button
                onClick={onSeedData}
                className="bg-white border border-[#00bf71]/20 hover:bg-[#00bf71]/5 text-[#00bf71] text-[10px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap shadow-sm"
              >
                Seed Data
              </button>
            </div>
          </div>

          {/* Active Goals Progress */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100/50 space-y-4 text-left flex flex-col">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#00bf71]" /> Active Saving Goals
              </h3>
              <button
                onClick={() => onNavigateToTab("portfolio")}
                className="text-xs text-[#00bf71] font-bold hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs flex-1 flex items-center justify-center">
                No active goals configured.
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-4 py-2 scrollbar-thin flex-1 items-center">
                {goals.map((goal) => {
                  const percentage = Math.min((goal.current / goal.target) * 100, 100);
                  const isCompleted = percentage >= 100;
                  const theme = getWalletTheme(goal.themeId || "ocean");

                  const formatAmount = (amount) => {
                    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}Jt`;
                    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
                    return amount.toString();
                  };

                  return (
                    <div
                      key={goal.id}
                      className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm min-w-[200px] flex flex-col gap-3 shrink-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: theme.bgColor }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        >
                          {goal.icon}
                        </div>
                        <div className="text-left truncate">
                          <h4 className="font-bold text-xs text-slate-800 truncate max-w-[120px]">
                            {goal.name}
                          </h4>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {isCompleted ? "✅ Completed" : `${percentage.toFixed(0)}% done`}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-2">
                        <div className="text-left">
                          <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">
                            Saved
                          </span>
                          <span
                            style={{ color: theme.accentColor }}
                            className="text-xs font-bold"
                          >
                            Rp{formatAmount(goal.current)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">
                            Target
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            Rp{formatAmount(goal.target)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: isCompleted ? "#00BC7D" : theme.accentColor,
                          }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── RECENT TRANSACTIONS LIST ─── */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100/50 overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Recent Transactions
            </span>
            <button
              onClick={() => onNavigateToTab("portfolio")}
              className="text-xs text-[#00bf71] font-bold hover:underline cursor-pointer"
            >
              See All
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-xs font-semibold">
                No transaction entries found.
              </p>
              <button
                onClick={onAddTransactionClick}
                className="mt-2 text-xs text-[#00bf71] hover:underline font-bold"
              >
                Add new transaction
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((tx) => {
                const matchedCat = categories.find(
                  (c) => c._id === tx.category_id || c.id === tx.category_id
                );
                const matchedWallet = wallets.find(
                  (w) => w._id === tx.wallet_id || w.id === tx.wallet_id
                );
                const isExpense = tx.type === "expense";
                const isTransfer = tx.type === "transfer";

                const themeId =
                  matchedCat?.themeId ||
                  matchedCat?.theme_id ||
                  matchedCat?.color ||
                  "ocean";
                const theme = getWalletTheme(themeId);

                const formatDateLabel = (dateString) => {
                  try {
                    const d = new Date(dateString);
                    return d.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                  } catch {
                    return dateString;
                  }
                };

                return (
                  <div
                    key={tx._id || tx.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/55 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Circle Category Icon */}
                      <div
                        style={{ backgroundColor: theme.bgColor || "#F0F9FF" }}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0"
                      >
                        {matchedCat?.emoticon || "💸"}
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-slate-800 max-w-[180px] md:max-w-[300px] truncate">
                          {tx.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDateLabel(tx.date)}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                            {matchedWallet?.name || "Wallet"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-black block ${
                          isExpense
                            ? "text-rose-500"
                            : isTransfer
                            ? "text-amber-500"
                            : "text-[#00BC7D]"
                        }`}
                      >
                        {isExpense ? "-" : isTransfer ? "" : "+"}
                        {formatIDR(tx.amount).replace("Rp", "").trim()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">
                        {matchedCat?.name || "General"}
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

