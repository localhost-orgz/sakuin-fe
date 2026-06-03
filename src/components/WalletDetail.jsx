import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, MoreHorizontal, Plus, ArrowRightLeft, Search, TrendingUp, TrendingDown, Wallet, Edit2, Trash2, X, Check } from "lucide-react";
import { getWalletGradient, getWalletTheme, getWalletThemeIds } from "../hooks/useWalletTheme";
import { apiRequest } from "../utils/api";

export default function WalletDetail({
  walletId,
  wallets = [],
  transactions = [],
  categories = [],
  onDeleteWallet,
  onBack,
  onTriggerManual,
  isBalanceShow,
  setIsBalanceShow,
  onRefreshData
}) {
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [sheetView, setSheetView] = useState("options"); // "options" | "edit"
  
  // Edit Form States
  const [editName, setEditName] = useState("");
  const [editThemeId, setEditThemeId] = useState("ocean");
  const [isSaving, setIsSaving] = useState(false);

  // Find initial wallet from props
  const initialWallet = useMemo(() => {
    return wallets.find(w => w._id === walletId || w.id === walletId);
  }, [wallets, walletId]);

  // Local state to store fetched wallet details
  const [wallet, setWallet] = useState(initialWallet);
  const [localTransactions, setLocalTransactions] = useState([]);
  const [loading, setLoading] = useState(!initialWallet);

  // Sync with prop update
  useEffect(() => {
    if (initialWallet) {
      setWallet(initialWallet);
    }
  }, [initialWallet]);

  // Fetch wallet details from API
  const fetchWalletDetail = useCallback(async () => {
    try {
      const response = await apiRequest(`/wallets/${walletId}`);
      if (response && response.status === "success" && response.data) {
        setWallet(response.data);
        if (response.data.transactions) {
          setLocalTransactions(response.data.transactions);
        }
      }
    } catch (error) {
      console.error("Failed to fetch wallet detail:", error);
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    fetchWalletDetail();
  }, [fetchWalletDetail]);

  // Load wallet details into edit form states
  useEffect(() => {
    if (wallet) {
      setEditName(wallet.name || "");
      setEditThemeId(wallet.themeId || wallet.color || "ocean");
    }
  }, [wallet]);

  // Loading state
  if (loading && !wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-[#f5f6fa] min-h-screen">
        <div className="w-10 h-10 border-4 border-[#00bf71] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold">Memuat detail dompet...</p>
      </div>
    );
  }

  // If wallet is deleted or not found
  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-[#f5f6fa] min-h-screen">
        <p className="text-sm font-semibold mb-4">Dompet tidak ditemukan atau telah dihapus.</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00bf71] hover:bg-[#00a862] text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-md"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Portfolio
        </button>
      </div>
    );
  }

  // Get active theme colors
  const themeId = wallet.themeId || wallet.color || "forest";
  const { theme } = { theme: getWalletTheme(themeId) };

  // Select transactions to display
  const activeTransactions = useMemo(() => {
    if (localTransactions.length > 0) {
      return localTransactions;
    }
    return transactions.filter(t => t.wallet_id === wallet._id || t.wallet_id === wallet.id);
  }, [localTransactions, transactions, wallet]);

  // Calculate calculations
  const totalIn = useMemo(() => {
    return activeTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [activeTransactions]);

  const totalOut = useMemo(() => {
    return activeTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [activeTransactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return activeTransactions;
    const q = search.toLowerCase();
    return activeTransactions.filter(
      tx => tx.name.toLowerCase().includes(q) || (tx.description && tx.description.toLowerCase().includes(q))
    );
  }, [activeTransactions, search]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const map = {};
    filteredTransactions.forEach(tx => {
      if (!tx.date) return;
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
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleEditWalletSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSaving(true);
    try {
      const currencyIdStr = (wallet.currency_id && typeof wallet.currency_id === "object")
        ? (wallet.currency_id._id || wallet.currency_id.id)
        : (wallet.currency_id || "6a02f8a7de59afc0c23a95c9");

      const response = await apiRequest(`/wallets/${wallet._id || wallet.id}`, {
        method: "PUT",
        body: {
          name: editName.trim(),
          color: editThemeId,
          themeId: editThemeId,
          balance: wallet.balance || 0,
          currency_id: currencyIdStr
        }
      });
      if (response && response.status === "success") {
        setShowSettings(false);
        if (onRefreshData) await onRefreshData();
        await fetchWalletDetail();
      } else {
        alert("Gagal memperbarui dompet.");
      }
    } catch (error) {
      console.error("Error updating wallet:", error);
      alert("Terjadi kesalahan saat menghubungi server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWalletConfirm = () => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus dompet "${wallet.name}"? Semua riwayat transaksi di dompet ini juga akan terhapus secara permanen.`
    );
    if (confirmDelete) {
      onDeleteWallet(wallet._id || wallet.id);
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
      {/* ─── DYNAMIC WALLET HEADER ─── */}
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
            <h1 className="text-lg font-extrabold tracking-tight">Detail Dompet</h1>
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

          {/* Wallet Name & Value */}
          <div className="flex flex-col items-center text-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{wallet.name}</h2>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                {wallet.currency || "IDR"} Account
              </span>
            </div>

            {/* Wallet Balance Display */}
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-lg font-bold">Rp</span>
              <span className="text-3xl md:text-4xl font-bold tracking-tight">
                {isBalanceShow ? formatIDR(wallet.balance).replace("Rp", "").trim() : "••••••••"}
              </span>
            </div>

            {/* Income & Expense Monthly Summaries */}
            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-bold text-white">
                <TrendingUp className="w-3.5 h-3.5 text-[#00bf71]" />
                <span>{formatIDR(totalIn)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-bold text-white">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span>{formatIDR(totalOut)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative -mt-10">
        {/* ─── QUICK ACTIONS FLOATING ROW ─── */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100/50 flex justify-around items-center mb-6">
          <button
            onClick={() => onTriggerManual(wallet._id || wallet.id, "manual")}
            className="flex-1 flex flex-col items-center gap-2 hover:scale-[1.03] transition-transform cursor-pointer"
          >
            <div style={{ backgroundColor: theme.bgColor }} className="w-12 h-12 rounded-full flex items-center justify-center">
              <Plus style={{ color: theme.accentColor }} className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 text-center leading-tight">
              Tambah Uang
            </span>
          </button>

          <div className="w-[1px] h-10 bg-slate-100" />

          <button
            onClick={() => onTriggerManual(wallet._id || wallet.id, "transfer")}
            className="flex-1 flex flex-col items-center gap-2 hover:scale-[1.03] transition-transform cursor-pointer"
          >
            <div style={{ backgroundColor: theme.bgColor }} className="w-12 h-12 rounded-full flex items-center justify-center">
              <ArrowRightLeft style={{ color: theme.accentColor }} className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 text-center leading-tight">
              Pindahkan Uang
            </span>
          </button>
        </div>

        {/* ─── SEARCH TRANSACTION INPUT ─── */}
        <div className="bg-white rounded-2xl border-2 border-slate-200/70 p-3 flex items-center gap-3.5 mb-6">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Transaksi..."
            className="w-full text-sm font-medium text-slate-700 bg-transparent focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ─── TRANSACTIONS LIST ─── */}
        <div className="space-y-6">
          {groupedTransactions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100/50 shadow-md">
              <p className="text-slate-400 text-sm font-semibold">
                {search ? "Transaksi tidak ditemukan 🔍" : "Belum ada transaksi di dompet ini."}
              </p>
            </div>
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
                              {isExpense ? "Pengeluaran" : isTransfer ? "Transfer / Pindahan" : "Pemasukan"}
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
                    <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">Pengaturan Dompet</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Kelola informasi atau hapus dompet Anda</p>
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
                      <h4 className="font-bold text-xs text-slate-800">Edit Info Dompet</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ubah nama dan tema warna dompet ini</p>
                    </div>
                  </button>

                  {/* Delete Option */}
                  <button
                    onClick={handleDeleteWalletConfirm}
                    className="w-full flex items-center gap-4 p-3.5 hover:bg-rose-50 border border-rose-100/50 rounded-2xl transition-all cursor-pointer text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-rose-600">Hapus Dompet</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Hapus dompet ini secara permanen</p>
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
              /* Edit Wallet Form View */
              <form onSubmit={handleEditWalletSubmit} className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">Edit Info Dompet</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Sesuaikan tampilan dompet Anda</p>
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
                      Nama Dompet
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Dompet"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00bf71] focus:border-[#00bf71] text-slate-800 font-bold transition-all"
                    />
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
                    disabled={isSaving || !editName.trim()}
                    style={{ backgroundColor: editName.trim() ? theme.accentColor : "#cbd5e1" }}
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
