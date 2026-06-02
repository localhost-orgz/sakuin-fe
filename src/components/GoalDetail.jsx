import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, MoreHorizontal, Search, TrendingUp, TrendingDown, Target, Trash2, X, Calendar, Edit2, Check } from "lucide-react";
import { getWalletGradient, getWalletTheme, getWalletThemeIds } from "../hooks/useWalletTheme";
import { apiRequest } from "../utils/api";

export default function GoalDetail({
  goalId,
  wallets = [],
  transactions = [],
  categories = [],
  onDeleteGoal,
  onBack,
  isBalanceShow,
  onRefreshData,
  goals = []
}) {
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [sheetView, setSheetView] = useState("options"); // "options" | "edit"
  const [localTransactions, setLocalTransactions] = useState([]);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Form States
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editThemeId, setEditThemeId] = useState("ocean");
  const [editIcon, setEditIcon] = useState("🎯");
  const [isSaving, setIsSaving] = useState(false);

  const emojiOptions = [
    "🎯", "💻", "🏖️", "🛡️", "📷", "💍", "👕", "🚗", "🏠", "🐄", "📚", "🎨", "💰", "🎁", "🚀", "🚴"
  ];

  // Fetch goal details and transactions from API
  const fetchGoalDetail = useCallback(async (retries = 2) => {
    if (!goalId || goalId === "undefined" || goalId === "null") {
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`/goals/${goalId}`);
      let goalData = null;
      if (response) {
        if (response.data) {
          goalData = response.data;
        } else if (response.id || response._id) {
          goalData = response;
        }
      }

      if (goalData) {
        // Try fetching goal-history as the primary source
        let rawTxs = [];
        try {
          const historyResponse = await apiRequest(`/goal-history/${goalId}`);
          if (historyResponse) {
            if (Array.isArray(historyResponse)) {
              rawTxs = historyResponse;
            } else if (Array.isArray(historyResponse.data)) {
              rawTxs = historyResponse.data;
            } else if (historyResponse.status === "success" && Array.isArray(historyResponse.data)) {
              rawTxs = historyResponse.data;
            } else if (historyResponse.data && Array.isArray(historyResponse.data.transactions)) {
              rawTxs = historyResponse.data.transactions;
            } else if (Array.isArray(historyResponse.transactions)) {
              rawTxs = historyResponse.transactions;
            }
          }
        } catch (err) {
          console.warn("Failed to fetch goal transactions history, falling back:", err);
        }

        // If history call was empty, check goalData's history and transactions
        if (rawTxs.length === 0) {
          if (Array.isArray(goalData.history) && goalData.history.length > 0) {
            rawTxs = goalData.history;
          } else if (Array.isArray(goalData.transactions) && goalData.transactions.length > 0) {
            rawTxs = goalData.transactions;
          }
        }

        // Fallback to local goals state prop if both are empty/missing
        if (rawTxs.length === 0 && Array.isArray(goals)) {
          const matchedGoal = goals.find(g => g.id === goalId || g._id === goalId);
          if (matchedGoal && Array.isArray(matchedGoal.transactions)) {
            rawTxs = matchedGoal.transactions;
          }
        }

        const mappedTxs = rawTxs
          .filter(item => item && typeof item === "object")
          .map(item => {
            const type = item.type === "withdraw" ? "expense" : "income";
            const name = item.name || (item.type === "withdraw" ? "Penarikan Dana" : "Tabungan Masuk");
            return {
              ...item,
              id: item.id || item._id,
              _id: item._id || item.id,
              name,
              type,
              amount: Number(item.amount) || 0,
              date: item.date,
              category_id: item.category_id || "cat_5"
            };
          });

        // Calculate dynamic current amount from history
        const calculatedCurrent = mappedTxs.reduce((sum, item) => {
          const amt = Number(item.amount) || 0;
          return item.type === "expense" ? sum - amt : sum + amt;
        }, 0);

        setGoal({
          ...goalData,
          current: calculatedCurrent
        });
        setLocalTransactions(mappedTxs);
      } else {
        throw new Error("Goal data not found in response");
      }
    } catch (error) {
      console.error(`Failed to fetch goal detail (${retries} retries left):`, error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchGoalDetail(retries - 1);
      }
      setGoal(null);
      setLocalTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [goalId, goals]);

  useEffect(() => {
    fetchGoalDetail();
  }, [fetchGoalDetail]);

  // Load goal details into edit form states
  useEffect(() => {
    if (goal) {
      setEditName(goal.name || "");
      setEditTarget(goal.target ? String(goal.target) : "");
      setEditThemeId(goal.themeId || goal.color || "ocean");
      setEditIcon(goal.icon || "🎯");
    }
  }, [goal]);

  // Loading state
  if (loading && !goal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-[#f5f6fa] min-h-screen">
        <div className="w-10 h-10 border-4 border-[#00bf71] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold">Memuat detail target...</p>
      </div>
    );
  }

  // If goal is not found
  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-[#f5f6fa] min-h-screen">
        <p className="text-sm font-semibold mb-4">Target tidak ditemukan atau telah dihapus.</p>
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-full transition-all cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Portfolio
          </button>
          <button
            onClick={() => fetchGoalDetail()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00bf71] hover:bg-[#00a862] text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-md"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Calculate progress
  const percentage = Math.min((goal.current / goal.target) * 100, 100);
  const remaining = Math.max(0, goal.target - goal.current);
  const isCompleted = percentage >= 100;

  const themeId = goal.themeId || goal.color || "ocean";
  const theme = getWalletTheme(themeId);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const txList = Array.isArray(localTransactions) ? localTransactions : [];
    if (!search.trim()) return txList;
    const q = search.toLowerCase();
    return txList.filter(
      tx => tx && tx.name && (tx.name.toLowerCase().includes(q) || (tx.description && tx.description.toLowerCase().includes(q)))
    );
  }, [localTransactions, search]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const map = {};
    const txList = Array.isArray(filteredTransactions) ? filteredTransactions : [];
    txList.forEach(tx => {
      if (!tx || !tx.date) return;
      const dateKey = tx.date.split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(tx);
    });

    const formatDate = (dateStr) => {
      try {
        return new Date(dateStr).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      } catch {
        return dateStr;
      }
    };

    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({
        title: formatDate(date),
        data
      }));
  }, [filteredTransactions]);

  const formatIDR = (value) => {
    const val = (value === undefined || value === null || isNaN(value)) ? 0 : Number(value);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleEditGoalSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editTarget.trim()) return;

    setIsSaving(true);
    try {
      const response = await apiRequest(`/goals/${goal._id || goal.id}`, {
        method: "PUT",
        body: {
          name: editName.trim(),
          target: Number(editTarget),
          themeId: editThemeId,
          icon: editIcon,
          current: goal.current
        }
      });
      if (response && response.status === "success") {
        setShowSettings(false);
        if (onRefreshData) await onRefreshData();
        await fetchGoalDetail();
      } else {
        alert("Gagal memperbarui target.");
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      alert("Terjadi kesalahan saat menghubungi server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoalConfirm = () => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus target "${goal.name}"?`
    );
    if (confirmDelete) {
      onDeleteGoal(goal._id || goal.id);
      setShowSettings(false);
      onBack();
    }
  };

  // Dark/Light text checks for header text contrast
  const isDarkHeader =
    theme.gradientColors[0].startsWith("#0") ||
    theme.gradientColors[0].startsWith("#1") ||
    theme.gradientColors[0].startsWith("#2") ||
    theme.gradientColors[0].startsWith("#3");

  const blobColor = isDarkHeader ? "rgba(255,255,255,0.06)" : `${theme.shadowColor}22`;
  const blobColorStrong = isDarkHeader ? "rgba(255,255,255,0.1)" : `${theme.shadowColor}33`;

  return (
    <div className="animate-fade-in text-left bg-[#f5f6fa] min-h-screen pb-20 relative">
      {/* ─── DYNAMIC GOAL HEADER ─── */}
      <div 
        style={{ background: getWalletGradient(themeId) }}
        className="text-white pt-6 pb-24 px-6 md:px-12 relative overflow-hidden transition-all duration-300"
      >
        {/* Mobile decorative blobs */}
        <div style={{ backgroundColor: blobColorStrong }} className="absolute w-64 h-64 rounded-full -top-20 -left-16 pointer-events-none" />
        <div style={{ backgroundColor: blobColor }} className="absolute w-80 h-80 rounded-full -bottom-40 -right-16 pointer-events-none" />
        <div style={{ backgroundColor: blobColorStrong }} className="absolute w-40 h-40 rounded-full top-4 right-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Top Bar Actions */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-extrabold tracking-tight">Detail Target</h1>
            <button
              onClick={() => {
                setSheetView("options");
                setShowSettings(true);
              }}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Goal Name & Icon */}
          <div className="flex flex-col items-center text-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-inner text-3xl">
              {goal.icon || "🎯"}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{goal.name}</h2>
              {goal.description && (
                <p className="text-xs text-white/70 max-w-xs mt-1 font-medium leading-relaxed">{goal.description}</p>
              )}
            </div>

            {/* Goal Progress Display */}
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xs font-semibold opacity-75">Terkumpul: </span>
              <span className="text-2xl md:text-3xl font-bold tracking-tight">
                {isBalanceShow ? formatIDR(goal.current) : "Rp ••••••••"}
              </span>
              <span className="text-xs font-semibold opacity-75 ml-1">
                dari {formatIDR(goal.target)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md h-2 bg-white/25 rounded-full overflow-hidden mt-3 shadow-inner">
              <div
                style={{ width: `${percentage}%` }}
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              />
            </div>

            {/* Percentage & Remaining details */}
            <div className="flex items-center justify-between w-full max-w-md mt-2 text-xs font-semibold opacity-90">
              <span>{isCompleted ? "Completed" : `${percentage.toFixed(0)}% Selesai`}</span>
              {!isCompleted && <span>Kekurangan: {formatIDR(remaining)}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative -mt-10">
        {/* ─── SEARCH TRANSACTION INPUT ─── */}
        <div className="bg-white rounded-2xl border-2 border-slate-200/70 p-3 flex items-center gap-3.5 mb-6 shadow-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Transaksi Target..."
            className="w-full text-sm font-medium text-slate-700 bg-transparent focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-655 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ─── TRANSACTIONS LIST ─── */}
        <div className="space-y-6">
          {groupedTransactions.length === 0 ? (
            search ? (
              <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                  <Search className="w-8 h-8 opacity-60" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="font-bold text-sm text-slate-800">Transaksi Tidak Ditemukan</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Tidak ada transaksi yang cocok dengan kata kunci "{search}". Coba gunakan pencarian kata kunci yang lain.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                  <Calendar className="w-8 h-8 opacity-60" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="font-bold text-sm text-slate-800">Belum Ada Transaksi</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Target tabungan ini belum mencatat adanya riwayat transaksi setoran tabungan. Mulai tambahkan transaksi untuk memantau progress Anda!
                  </p>
                </div>
              </div>
            )
          ) : (
            groupedTransactions.map((group) => (
              <div key={group.title} className="space-y-3">
                {/* Date Header */}
                <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                  {group.title}
                </h3>
                
                {/* Daily Cards Container */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 overflow-hidden divide-y divide-slate-100">
                  {group.data.map((tx) => {
                    const matchedCat = categories.find(c => c._id === tx.category_id || c.id === tx.category_id);
                    const isExpense = tx.type === "expense";
                    const isTransfer = tx.type === "transfer";

                    let iconBgColor = "#f0fdf8"; // income default
                    let iconColor = "#00bf71";
                    if (isExpense) {
                      iconBgColor = "#fef2f2";
                      iconColor = "#f43f5e";
                    } else if (isTransfer) {
                      iconBgColor = "#fef9c3";
                      iconColor = "#eab308";
                    }

                    return (
                      <div 
                        key={tx._id || tx.id}
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            style={{ backgroundColor: iconBgColor }}
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
                          >
                            {matchedCat?.emoticon || (isExpense ? "💸" : isTransfer ? "🔄" : "💰")}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800 line-clamp-1 max-w-[150px] md:max-w-md">
                              {tx.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 uppercase tracking-wider">
                              {isExpense ? "Pengeluaran" : isTransfer ? "Transfer / Pindahan" : "Tabungan / Pemasukan"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span 
                            style={{ color: iconColor }}
                            className="text-sm font-bold"
                          >
                            {isExpense ? "-" : isTransfer ? "" : "+"}
                            {formatIDR(tx.amount).replace("Rp", "").trim()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            {matchedCat?.name || "General"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── OPTIONS & EDIT DIALOG (MODAL OVERLAY) ─── */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-100">
            
            {sheetView === "options" ? (
              /* Options Sheet View */
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">Pengaturan Target</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Kelola informasi atau hapus target Anda</p>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Edit Option */}
                  <button
                    onClick={() => setSheetView("edit")}
                    className="w-full flex items-center gap-4 p-3.5 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all cursor-pointer text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Edit Info Target</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ubah nama, nominal target, dan tema warna</p>
                    </div>
                  </button>

                  {/* Delete Option */}
                  <button
                    onClick={handleDeleteGoalConfirm}
                    className="w-full flex items-center gap-4 p-3.5 hover:bg-rose-50 border border-rose-100/50 rounded-2xl transition-all cursor-pointer text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-rose-600">Hapus Target</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Hapus target ini secara permanen</p>
                    </div>
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              /* Edit Goal Form View */
              <form onSubmit={handleEditGoalSubmit} className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">Edit Info Target</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Sesuaikan informasi target tabungan</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSheetView("options")}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nama Target
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Laptop Baru"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-800 font-bold transition-all"
                    />
                  </div>

                  {/* Target Amount Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nominal Target (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 15000000"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-800 font-bold transition-all"
                    />
                  </div>

                  {/* Emoji Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pilih Emoji
                    </label>
                    <select
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-805 font-bold transition-all appearance-none cursor-pointer"
                    >
                      {emojiOptions.map((emoji) => (
                        <option key={emoji} value={emoji}>
                          {emoji}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Theme Color Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pilih Tema Warna
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {getWalletThemeIds().map((tid) => {
                        const tObj = getWalletTheme(tid);
                        const selected = editThemeId === tid;
                        return (
                          <button
                            type="button"
                            key={tid}
                            onClick={() => setEditThemeId(tid)}
                            style={{ backgroundColor: tObj.accentColor }}
                            className="h-9 rounded-xl flex items-center justify-center text-white relative shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                          >
                            {selected && <Check className="w-4 h-4 stroke-[3px]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSheetView("options")}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !editName.trim() || !editTarget.trim()}
                    style={{ backgroundColor: (editName.trim() && editTarget.trim()) ? theme.accentColor : "#cbd5e1" }}
                    className="flex-[2] py-2.5 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan ✓"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
