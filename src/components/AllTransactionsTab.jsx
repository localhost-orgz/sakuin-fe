import React, { useState, useMemo } from "react";
import { Search, Filter, X, Trash2, Calendar, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { getWalletTheme } from "../hooks/useWalletTheme";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

/** Parse YYYY-MM-DD as local calendar date (avoids UTC off-by-one). */
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatSectionDate = (dateStr) => {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Hari Ini";
  if (date.getTime() === yesterday.getTime()) return "Kemarin";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getLocalDateString = (dateString) => {
  try {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateString.substring(0, 10);
  }
};

const groupByDate = (txs) => {
  const map = {};
  txs.forEach((tx) => {
    const dateKey = getLocalDateString(tx.date);
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(tx);
  });
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({
      key: date,
      title: formatSectionDate(date),
      data,
      totalAmount: data.reduce((s, t) => {
        if (t.type === "transfer") return s;
        const amt = Number(t.amount) || 0;
        return s + (t.type === "income" ? amt : -amt);
      }, 0),
    }));
};

export default function AllTransactionsTab({
  transactions = [],
  wallets = [],
  categories = [],
  onDeleteTransaction
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterBar, setShowFilterBar] = useState(true);

  // Category filter items
  const filterChips = useMemo(() => {
    const list = [{ id: "all", label: "Semua Kategori" }];
    categories.forEach((cat) => {
      list.push({
        id: cat._id || cat.id,
        label: cat.name,
      });
    });
    return list;
  }, [categories]);

  // Search & category filter logic
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const wallet = wallets.find((w) => (w._id === tx.wallet_id || w.id === tx.wallet_id));
      const walletName = wallet ? wallet.name : "Dompet";

      const matchesSearch =
        search.trim() === "" ||
        (tx.name && tx.name.toLowerCase().includes(search.toLowerCase())) ||
        (tx.description && tx.description.toLowerCase().includes(search.toLowerCase())) ||
        walletName.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        tx.category_id === activeFilter ||
        (tx.category_id && (tx.category_id._id === activeFilter || tx.category_id.id === activeFilter));

      return matchesSearch && matchesFilter;
    });
  }, [transactions, wallets, search, activeFilter]);

  // Group filtered transactions by date
  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  // Calculate Net Flow
  const totalFiltered = useMemo(() => {
    return filtered.reduce((s, t) => {
      if (t.type?.toLowerCase() === "transfer") return s;
      const amt = Number(t.amount) || 0;
      return s + (t.type?.toLowerCase() === "income" ? amt : -amt);
    }, 0);
  }, [filtered]);

  const handleDelete = (txId, txName) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${txName}"? Tindakan ini tidak dapat dibatalkan.`);
    if (confirmDelete && onDeleteTransaction) {
      onDeleteTransaction(txId);
    }
  };

  return (
    <div className="animate-fade-in text-left bg-[#f5f6fa] min-h-screen pb-16">
      {/* ─── GREEN PINNED HEADER ─── */}
      <div className="bg-[#00bf71] text-white pt-10 pb-28 px-6 md:px-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute w-64 h-64 bg-white/5 rounded-full -top-32 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -bottom-48 -right-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Riwayat Transaksi</h1>
            <p className="text-sm text-white/85 mt-1 font-medium">
              Cari, saring, dan tinjau riwayat keuangan Anda secara detail
            </p>
          </div>

          {/* Search bar & filter controls */}
          <div className="flex items-center gap-3 w-full md:max-w-md">
            <div className="flex-1 bg-white/15 backdrop-blur-md rounded-2xl px-4 py-2.5 flex items-center gap-2.5 border border-white/20 shadow-inner">
              <Search className="w-4 h-4 text-white/70 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Transaksi / Dompet..."
                className="w-full text-xs font-semibold text-white bg-transparent placeholder-white/50 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-white/60 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilterBar(v => !v)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                showFilterBar
                  ? "bg-white/30 border-white/45 text-white"
                  : "bg-white/15 border-white/20 text-white/80 hover:bg-white/20"
              }`}
              title="Toggle Saringan Kategori"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative -mt-20 space-y-6">
        {/* ─── COLLAPSIBLE CATEGORY CHIPS BAR ─── */}
        {showFilterBar && (
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100/50 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 block text-left">
              Saring Berdasarkan Kategori
            </span>
            <div className="flex items-center gap-2 overflow-x-auto py-1.5 custom-scrollbar">
              {filterChips.map((chip) => {
                const isSelected = activeFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setActiveFilter(chip.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-[#00bf71] border-[#00bf71] text-white shadow-sm shadow-emerald-500/25"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── SUMMARY CARD ─── */}
        <div className="bg-white rounded-2xl px-6 py-4 shadow-md border border-slate-100/50 flex justify-between items-center text-xs font-extrabold">
          <span className="text-slate-400 uppercase tracking-widest">{filtered.length} Transaksi Ditemukan</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 uppercase tracking-widest mr-1">Arus Bersih:</span>
            <span className={totalFiltered >= 0 ? "text-[#00bf71]" : "text-rose-500"}>
              {totalFiltered >= 0 ? "+" : "-"}
              {formatRupiah(Math.abs(totalFiltered))}
            </span>
          </div>
        </div>

        {/* ─── GROUPED TRANSACTIONS LIST ─── */}
        <div className="space-y-6">
          {sections.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100/50 shadow-md">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-slate-400 text-sm font-semibold">Tidak ada transaksi ditemukan.</p>
              <p className="text-slate-300 text-[10px] uppercase font-bold tracking-widest mt-1">Coba saringan atau kata kunci lain</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.key} className="space-y-3">
                {/* Section Date Header */}
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {section.title}
                  </h3>
                  <span className={`text-[10px] font-extrabold ${section.totalAmount >= 0 ? "text-[#00bf71]" : "text-rose-500"}`}>
                    {section.totalAmount >= 0 ? "+" : "-"}
                    {formatRupiah(Math.abs(section.totalAmount))}
                  </span>
                </div>

                {/* Section Transaction Cards */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 overflow-hidden divide-y divide-slate-100">
                  {section.data.map((tx) => {
                    const matchedCat = categories.find(c => c._id === tx.category_id || c.id === tx.category_id);
                    const matchedWallet = wallets.find(w => w._id === tx.wallet_id || w.id === tx.wallet_id);
                    
                    const isExpense = tx.type === "expense";
                    const isTransfer = tx.type === "transfer";

                    const themeId = matchedCat?.themeId || matchedCat?.color || matchedCat?.theme_id || "ocean";
                    const theme = getWalletTheme(themeId);

                    let amountColor = "#00bf71";
                    let amountSign = "+";
                    if (isExpense) {
                      amountColor = "#f43f5e";
                      amountSign = "-";
                    } else if (isTransfer) {
                      amountColor = "#eab308";
                      amountSign = "";
                    }

                    return (
                      <div
                        key={tx._id || tx.id}
                        className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
                      >
                        {/* Left Info Column */}
                        <div className="flex items-center gap-3">
                          <div
                            style={{ backgroundColor: theme.iconBgColor }}
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm"
                          >
                            {matchedCat?.emoticon || (isExpense ? "💸" : isTransfer ? "🔄" : "💰")}
                          </div>
                          <div className="text-left">
                            <h4 className="font-extrabold text-sm text-slate-800 line-clamp-1 max-w-[150px] md:max-w-md">
                              {tx.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wider">
                              {matchedCat?.name || "Kategori"} • {matchedWallet?.name || "Dompet"}
                            </span>
                          </div>
                        </div>

                        {/* Right Info Column + Action */}
                        <div className="flex items-center gap-4">
                          <div className="text-right shrink-0 leading-tight">
                            <span style={{ color: amountColor }} className="text-sm font-black">
                              {amountSign}
                              {formatRupiah(tx.amount).replace("Rp", "").trim()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">
                              {isExpense ? "Pengeluaran" : isTransfer ? "Transfer" : "Pemasukan"}
                            </span>
                          </div>

                          {/* Delete Transaction Action */}
                          <button
                            onClick={() => handleDelete(tx._id || tx.id, tx.name)}
                            title="Hapus Transaksi"
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-600 transition-colors cursor-pointer md:opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
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
    </div>
  );
}
