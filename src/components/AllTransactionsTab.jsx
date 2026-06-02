import React, { useState, useMemo } from "react";
import { Search, Filter, X, Trash2, Calendar, TrendingUp, TrendingDown, ArrowRightLeft, FileSpreadsheet, FileText } from "lucide-react";
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
  const [exportModal, setExportModal] = useState({ isOpen: false, type: "" });
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

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

  const exportToExcel = () => {
    if (filtered.length === 0) return;
    setExportStartDate("");
    setExportEndDate("");
    setExportModal({ isOpen: true, type: "excel" });
  };

  const exportToPDF = () => {
    if (filtered.length === 0) return;
    setExportStartDate("");
    setExportEndDate("");
    setExportModal({ isOpen: true, type: "pdf" });
  };

  const handleConfirmExport = (type) => {
    const dataToExport = filtered.filter(tx => {
      if (!tx.date) return true;
      const txDateStr = getLocalDateString(tx.date);
      if (exportStartDate && txDateStr < exportStartDate) return false;
      if (exportEndDate && txDateStr > exportEndDate) return false;
      return true;
    });

    if (dataToExport.length === 0) {
      alert("Tidak ada transaksi dalam rentang tanggal tersebut.");
      return;
    }

    if (type === "excel") {
      runExcelExport(dataToExport);
    } else {
      const exportNetFlow = dataToExport.reduce((s, t) => {
        if (t.type?.toLowerCase() === "transfer") return s;
        const amt = Number(t.amount) || 0;
        return s + (t.type?.toLowerCase() === "income" ? amt : -amt);
      }, 0);
      runPDFExport(dataToExport, exportNetFlow);
    }

    setExportModal({ isOpen: false, type: "" });
  };

  const runExcelExport = async (dataToExport) => {
    try {
      const XLSX = await import("xlsx-js-style");
      
      const rows = dataToExport.map((tx, idx) => {
        const matchedCat = categories.find(c => c._id === tx.category_id || c.id === tx.category_id);
        const matchedWallet = wallets.find(w => w._id === tx.wallet_id || w.id === tx.wallet_id);
        
        let typeLabel = "Pemasukan";
        if (tx.type === "expense") typeLabel = "Pengeluaran";
        else if (tx.type === "transfer") typeLabel = "Transfer";

        return {
          "No": idx + 1,
          "Tanggal": getLocalDateString(tx.date),
          "Nama Transaksi": tx.name || "",
          "Kategori": matchedCat?.name || "Kategori",
          "Dompet": matchedWallet?.name || "Dompet",
          "Tipe": typeLabel,
          "Jumlah (IDR)": Number(tx.amount) || 0,
          "Keterangan": tx.description || "-"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Define styled header (Green background with White bold text)
      const headerStyle = {
        font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
        fill: { patternType: "solid", fgColor: { rgb: "00BF71" } }, // Sakuin Green: #00bf71
        alignment: { horizontal: "center", vertical: "center" }
      };

      const cellStyle = {
        font: { name: "Segoe UI", sz: 10 },
        alignment: { vertical: "center" }
      };
      
      const numStyle = {
        font: { name: "Segoe UI", sz: 10 },
        alignment: { horizontal: "right", vertical: "center" },
        numFmt: "#,##0" // formatted as number with thousand separator
      };

      // Apply styles to all cells
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;

          if (R === 0) {
            worksheet[cellAddress].s = headerStyle;
          } else {
            if (C === 6) { // "Jumlah (IDR)" column
              worksheet[cellAddress].s = numStyle;
            } else {
              worksheet[cellAddress].s = cellStyle;
            }
          }
        }
      }

      // Column widths
      const colWidths = [
        { wch: 6 },   // No
        { wch: 14 },  // Tanggal
        { wch: 28 },  // Nama Transaksi
        { wch: 18 },  // Kategori
        { wch: 18 },  // Dompet
        { wch: 14 },  // Tipe
        { wch: 16 },  // Jumlah (IDR)
        { wch: 32 }   // Keterangan
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
      XLSX.writeFile(workbook, `Sakuin_Transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Gagal memuat modul Excel:", error);
      alert("Gagal memuat modul ekspor Excel. Silakan coba lagi.");
    }
  };

  const runPDFExport = async (dataToExport, exportNetFlow) => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add branding headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 191, 113); // Sakuin Green
      doc.text("SAKUIN", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Laporan Riwayat Transaksi Keuangan", 14, 25);
      
      const todayStr = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      doc.text(`Tanggal Ekspor: ${todayStr}`, 14, 30);

      // Summary block background
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, 35, 182, 18, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("RINGKASAN LAPORAN", 18, 41);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Jumlah Transaksi: ${dataToExport.length}`, 18, 47);
      
      const totalText = `Arus Bersih: ${exportNetFlow >= 0 ? "+" : ""}${formatRupiah(exportNetFlow)}`;
      doc.setFont("helvetica", "bold");
      if (exportNetFlow >= 0) {
        doc.setTextColor(0, 191, 113); // Sakuin Green
      } else {
        doc.setTextColor(244, 63, 94); // rose-500
      }
      doc.text(totalText, 120, 47);

      // Table headers
      const headers = [["No", "Tanggal", "Nama Transaksi", "Kategori", "Dompet", "Tipe", "Jumlah"]];
      const tableData = dataToExport.map((tx, idx) => {
        const matchedCat = categories.find(c => c._id === tx.category_id || c.id === tx.category_id);
        const matchedWallet = wallets.find(w => w._id === tx.wallet_id || w.id === tx.wallet_id);
        
        let typeLabel = "Pemasukan";
        if (tx.type === "expense") typeLabel = "Pengeluaran";
        else if (tx.type === "transfer") typeLabel = "Transfer";

        const sign = tx.type === "expense" ? "-" : tx.type === "income" ? "+" : "";

        return [
          idx + 1,
          getLocalDateString(tx.date),
          tx.name || "",
          matchedCat?.name || "Kategori",
          matchedWallet?.name || "Dompet",
          typeLabel,
          `${sign}${formatRupiah(tx.amount).replace("Rp", "").trim()}`
        ];
      });

      autoTable(doc, {
        startY: 58,
        head: headers,
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [0, 191, 113],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 22 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 22 },
          6: { cellWidth: 28, halign: "right" },
        },
        styles: {
          font: "helvetica",
        },
        margin: { top: 58, left: 14, right: 14 },
        didDrawPage: (data) => {
          const str = "Halaman " + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      doc.save(`Sakuin_Transaksi_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Gagal memuat modul PDF:", error);
      alert("Gagal memuat modul ekspor PDF. Silakan coba lagi.");
    }
  };

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
        <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-extrabold">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-slate-400 uppercase tracking-widest">{filtered.length} Transaksi Ditemukan</span>
            <div className="hidden sm:block h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase tracking-widest mr-1">Arus Bersih:</span>
              <span className={totalFiltered >= 0 ? "text-[#00bf71]" : "text-rose-500"}>
                {totalFiltered >= 0 ? "+" : "-"}
                {formatRupiah(Math.abs(totalFiltered))}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-[#00bf71] hover:bg-[#00bf71] hover:text-white transition-all rounded-xl border border-emerald-100 hover:border-[#00bf71] cursor-pointer text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-50 disabled:hover:text-[#00bf71] disabled:hover:border-emerald-100"
              title="Ekspor ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all rounded-xl border border-rose-100 hover:border-rose-500 cursor-pointer text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-50 disabled:hover:text-rose-600 disabled:hover:border-rose-100"
              title="Ekspor ke PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
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
                            <span style={{ color: amountColor }} className="text-sm font-bold">
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

      {/* ─── EXPORT DATE RANGE MODAL ─── */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 text-left animate-scale-up">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-800">
                Ekspor ke {exportModal.type === "excel" ? "Excel (.xlsx)" : "PDF (.pdf)"}
              </h3>
              <button
                onClick={() => setExportModal({ isOpen: false, type: "" })}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Pilih rentang tanggal untuk data transaksi yang ingin Anda ekspor. Saringan kategori dan pencarian aktif tetap akan diterapkan.
            </p>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setExportStartDate("");
                  setExportEndDate("");
                }}
                className={`py-2 px-3 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer ${
                  !exportStartDate && !exportEndDate
                    ? "border-[#00bf71] bg-emerald-50/50 text-[#00bf71]"
                    : "border-slate-100"
                }`}
              >
                Semua Tanggal
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), 1);
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  setExportStartDate(getLocalDateString(start));
                  setExportEndDate(getLocalDateString(end));
                }}
                className={`py-2 px-3 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer ${
                  exportStartDate === getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
                    ? "border-[#00bf71] bg-emerald-50/50 text-[#00bf71]"
                    : "border-slate-100"
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  const end = new Date(now.getFullYear(), now.getMonth(), 0);
                  setExportStartDate(getLocalDateString(start));
                  setExportEndDate(getLocalDateString(end));
                }}
                className={`py-2 px-3 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer ${
                  exportStartDate === getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1))
                    ? "border-[#00bf71] bg-emerald-50/50 text-[#00bf71]"
                    : "border-slate-100"
                }`}
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(end.getDate() - 30);
                  setExportStartDate(getLocalDateString(start));
                  setExportEndDate(getLocalDateString(end));
                }}
                className={`py-2 px-3 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer ${
                  exportStartDate === getLocalDateString(new Date(new Date().setDate(new Date().getDate() - 30)))
                    ? "border-[#00bf71] bg-emerald-50/50 text-[#00bf71]"
                    : "border-slate-100"
                }`}
              >
                30 Hari Terakhir
              </button>
            </div>

            {/* Custom Inputs */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Dari Tanggal</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs flex items-center">
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="mt-5 text-slate-300 font-bold">─</div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Sampai Tanggal</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs flex items-center">
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setExportModal({ isOpen: false, type: "" })}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmExport(exportModal.type)}
                className="flex-1 py-3 bg-[#00bf71] hover:bg-[#009b5c] text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer text-center"
              >
                Ekspor Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
