import React, { useState } from "react";
import { Wallet, Target, X, Check, Trash2, ArrowRightLeft, Sparkles, ChevronRight, Eye, EyeOff } from "lucide-react";
import { getWalletGradient, getWalletThemeIds, getWalletTheme } from "../hooks/useWalletTheme";

export default function PortfolioTab({
  wallets = [],
  goals = [],
  transactions = [],
  onAddWallet,
  onDeleteWallet,
  onAddGoal,
  onDeleteGoal,
  isBalanceShow,
  setIsBalanceShow,
  onNavigateToWallet
}) {
  // Modal visibility states
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form states - Wallet
  const [walletName, setWalletName] = useState("");
  const [walletBalance, setWalletBalance] = useState("");
  const [walletThemeId, setWalletThemeId] = useState("ocean");
  const [walletCurrency, setWalletCurrency] = useState("IDR");

  // Form states - Goal
  const [goalName, setGoalName] = useState("");
  const [goalEmoji, setGoalEmoji] = useState("🎯");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalThemeId, setGoalThemeId] = useState("ocean");
  const [goalCurrent, setGoalCurrent] = useState("");

  const formatIDR = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleWalletSubmit = (e) => {
    e.preventDefault();
    if (!walletName.trim()) return;
    onAddWallet({
      name: walletName.trim(),
      balance: Number(walletBalance) || 0,
      currency: walletCurrency,
      themeId: walletThemeId
    });
    // Reset Form
    setWalletName("");
    setWalletBalance("");
    setWalletThemeId("ocean");
    setShowAddWallet(false);
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (!goalName.trim() || !goalTarget) return;
    onAddGoal({
      name: goalName.trim(),
      icon: goalEmoji,
      target: Number(goalTarget),
      current: Number(goalCurrent) || 0,
      themeId: goalThemeId
    });
    // Reset Form
    setGoalName("");
    setGoalEmoji("🎯");
    setGoalTarget("");
    setGoalCurrent("");
    setGoalThemeId("ocean");
    setShowAddGoal(false);
  };

  const emojiOptions = ["🎯", "💻", "🏖️", "🛡️", "📷", "💍", "👕", "🚗", "🏡", "✈️", "🎓", "🎮", "🍿", "🍔", "💪"];

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
              Portfolio & Assets
            </h1>
            <p className="text-sm text-white/70 font-medium mt-1">
              Manage your accounts, check asset valuation, and track specific financial goals.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative -mt-20">
        {/* ─── ASSET VALUATION SUMMARY CARD ─── */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">💰</div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Asset Valuation</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-1 leading-none">
                {isBalanceShow
                  ? formatIDR(
                      wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0) +
                      goals.reduce((sum, g) => sum + (Number(g.current) || 0), 0)
                    )
                  : "Rp ••••••••"}
              </h2>
              <div className="flex gap-3 mt-2 text-xs text-slate-400 font-semibold">
                <span>{wallets.length} active wallets</span>
                <span>•</span>
                <span>{goals.length} saving goals</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsBalanceShow(!isBalanceShow)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white transition-all font-bold text-xs cursor-pointer self-start sm:self-center"
          >
            {isBalanceShow ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" /> Hide Balance
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" /> Show Balance
              </>
            )}
          </button>
        </div>

        {/* ─── WALLETS SECTION ─── */}
        <div className="space-y-4 mb-10">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#00bf71]" /> My Wallets
            </h3>
            <button
              onClick={() => setShowAddWallet(true)}
              className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer shadow-sm hover:shadow"
            >
              + Add Wallet
            </button>
          </div>

          {wallets.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 bg-white">
              No wallets found. Create a new wallet to start tracking.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {wallets.map((wallet) => {
                const theme = getWalletTheme(wallet.themeId || "ocean");
                const isDark =
                  theme.gradientColors[0].startsWith("#0") ||
                  theme.gradientColors[0].startsWith("#1") ||
                  theme.gradientColors[0].startsWith("#2") ||
                  theme.gradientColors[0].startsWith("#3");
                const blobColor = isDark ? "rgba(255,255,255,0.07)" : `${theme.shadowColor}22`;
                const blobColorStrong = isDark ? "rgba(255,255,255,0.11)" : `${theme.shadowColor}38`;

                return (
                  <div
                    key={wallet._id || wallet.id}
                    onClick={() => onNavigateToWallet(wallet._id || wallet.id)}
                    style={{
                      background: getWalletGradient(wallet.themeId || "ocean"),
                    }}
                    className="rounded-3xl p-5 text-white relative overflow-hidden flex flex-col justify-between h-40 cursor-pointer hover:scale-[1.02] transition-transform duration-200 shadow-md border border-slate-100/10"
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
                    <div className="flex justify-between items-start relative z-10">
                      <div
                        style={{
                          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : `${theme.textColor}18`,
                        }}
                        className="p-2.5 rounded-2xl flex items-center justify-center shrink-0"
                      >
                        <Wallet
                          className="w-5 h-5"
                          style={isDark ? { color: "#ffffff" } : { color: theme.textColor }}
                        />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                        {wallet.currency || "IDR"} Account
                      </span>
                    </div>

                    <div className="relative z-10 text-left">
                      <h4 className="font-extrabold text-sm opacity-90 truncate max-w-[180px]">{wallet.name}</h4>
                      <span className="text-2xl font-black block leading-none mt-1">
                        {isBalanceShow ? formatIDR(wallet.balance) : "Rp ••••••••"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── GOALS SECTION ─── */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#00bf71]" /> Saving Goals
            </h3>
            <button
              onClick={() => setShowAddGoal(true)}
              className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer shadow-sm hover:shadow"
            >
              + Add Goal
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 bg-white">
              No saving goals found. Create a new goal to start planning.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const percentage = Math.min(Math.round((goal.current / goal.target) * 100), 100);
                const theme = getWalletTheme(goal.themeId || "ocean");
                const isCompleted = percentage >= 100;

                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal)}
                    className="bg-white rounded-3xl p-5 border border-slate-100/50 shadow-md hover:scale-[1.01] transition-transform duration-200 cursor-pointer text-left flex flex-col justify-between h-38 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: theme.bgColor || "#f3f4f6" }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                      >
                        {goal.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 truncate max-w-[150px]">{goal.name}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {isCompleted ? "🎉 Goal Completed" : `${percentage}% achieved`}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-baseline text-xs text-slate-500 font-semibold">
                        <span>
                          {isBalanceShow ? formatIDR(goal.current) : "Rp •••"} / {formatIDR(goal.target)}
                        </span>
                        <span className="font-extrabold text-slate-800">{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%`, backgroundColor: theme.accentColor }}
                          className="h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ────────────────── ADD WALLET MODAL ────────────────── */}
      {showAddWallet && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-100/50">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#00bf71]" /> Add New Wallet
              </h3>
              <button
                onClick={() => setShowAddWallet(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWalletSubmit} className="p-6 space-y-5 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wallet Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cash, Bank Mandiri, Gopay..."
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-855 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Initial Balance (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={walletBalance}
                  onChange={(e) => setWalletBalance(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-800 font-bold transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Color Theme</label>
                <div className="grid grid-cols-6 gap-2.5">
                  {getWalletThemeIds().map((tid) => {
                    const themeObj = getWalletTheme(tid);
                    const isSelected = walletThemeId === tid;
                    return (
                      <button
                        type="button"
                        key={tid}
                        onClick={() => setWalletThemeId(tid)}
                        style={{ backgroundColor: themeObj.accentColor }}
                        className="h-9 rounded-xl flex items-center justify-center text-white relative shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddWallet(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  Create Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── ADD GOAL MODAL ────────────────── */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-100/50">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00bf71]" /> Add Saving Goal
              </h3>
              <button
                onClick={() => setShowAddGoal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className="p-6 space-y-5 text-left">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Goal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Macbook, Bali Trip..."
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Icon</label>
                  <select
                    value={goalEmoji}
                    onChange={(e) => setGoalEmoji(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-center text-slate-800 font-bold cursor-pointer transition-all"
                  >
                    {emojiOptions.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saved Amount (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-800 font-bold transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Amount (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="1000000"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-800 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Color Theme</label>
                <div className="grid grid-cols-6 gap-2.5">
                  {getWalletThemeIds().map((tid) => {
                    const themeObj = getWalletTheme(tid);
                    const isSelected = goalThemeId === tid;
                    return (
                      <button
                        type="button"
                        key={tid}
                        onClick={() => setGoalThemeId(tid)}
                        style={{ backgroundColor: themeObj.accentColor }}
                        className="h-9 rounded-xl flex items-center justify-center text-white relative shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── WALLET DETAILS MODAL ────────────────── */}
      {selectedWallet && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up border border-slate-100/50">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: getWalletTheme(selectedWallet.themeId || "ocean").accentColor }}
                  className="w-4 h-4 rounded-md"
                />
                <h3 className="font-extrabold text-base text-slate-800">Wallet Profile: {selectedWallet.name}</h3>
              </div>
              <button
                onClick={() => setSelectedWallet(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-100 p-4 bg-slate-50/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Available Balance</span>
                  <span className="text-xl font-extrabold text-slate-855 block mt-1">
                    {formatIDR(selectedWallet.balance)}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block mt-1">
                    {selectedWallet.currency || "IDR"} account
                  </span>
                </div>
                <div className="border border-slate-100 p-4 bg-slate-50/40 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">Manage Account</span>
                    <button
                      onClick={() => {
                        onDeleteWallet(selectedWallet._id || selectedWallet.id);
                        setSelectedWallet(null);
                      }}
                      className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Wallet Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions linked */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">Account Transaction Log</h4>
                {transactions.filter(t => t.wallet_id === (selectedWallet._id || selectedWallet.id)).length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                    <p className="text-slate-400 text-xs font-semibold">No transactions recorded under this account.</p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white scrollbar-thin">
                    {transactions
                      .filter(t => t.wallet_id === (selectedWallet._id || selectedWallet.id))
                      .map(tx => {
                        const isExpense = tx.type === "expense";
                        return (
                          <div key={tx._id || tx.id} className="flex justify-between items-center py-3 px-4 hover:bg-slate-50/30">
                            <div>
                              <h5 className="font-bold text-xs text-slate-800">{tx.name}</h5>
                              <span className="text-[9px] text-slate-400 mt-0.5 block">{tx.date}</span>
                            </div>
                            <span className={`text-xs font-bold ${isExpense ? "text-rose-500" : "text-[#00BC7D]"}`}>
                              {isExpense ? "-" : "+"} {formatIDR(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedWallet(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-colors"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── GOAL DETAILS MODAL ────────────────── */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-100/50">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedGoal.icon}</span>
                <h3 className="font-extrabold text-base text-slate-800">Saving Goal Details: {selectedGoal.name}</h3>
              </div>
              <button
                onClick={() => setSelectedGoal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-left">
              <div className="border border-slate-100 p-4 bg-slate-50/40 rounded-2xl space-y-4">
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Saved Balance</span>
                    <span className="text-base font-extrabold text-slate-800 block mt-0.5">
                      {formatIDR(selectedGoal.current)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Goal Target</span>
                    <span className="text-xs font-bold text-slate-500 block mt-0.5">
                      / {formatIDR(selectedGoal.target)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(Math.round((selectedGoal.current / selectedGoal.target) * 100), 100)}%`,
                        backgroundColor: getWalletTheme(selectedGoal.themeId || "ocean").accentColor
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                    <span>Progress</span>
                    <span>{Math.min(Math.round((selectedGoal.current / selectedGoal.target) * 100), 100)}% Complete</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100 justify-end">
                <button
                  onClick={() => {
                    onDeleteGoal(selectedGoal.id);
                    setSelectedGoal(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-bold rounded-full text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Goal
                </button>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-bold px-5 py-2 rounded-full transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  Close Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
