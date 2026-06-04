import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Calendar, FileText, DollarSign, Wallet, Tag, X, ChevronRight, Plus, Target } from "lucide-react";
import { getWalletTheme } from "../hooks/useWalletTheme";
import { CURRENCY_LIST } from "../utils/currencyList";
import { apiRequest } from "../utils/api";

export default function TransactionForms({
  wallets = [],
  categories = [],
  goals = [],
  onSubmitTransaction,
  onRefreshData,
  onClose,
  initialWalletId = null,
  initialFormType = null
}) {
  const [formType, setFormType] = useState(initialFormType || "manual"); // "manual" or "transfer"
  const [txType, setTxType] = useState("expense"); // "expense" or "income" (for manual)
  const [errorModal, setErrorModal] = useState(null);

  // Manual Form States
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("IDR");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");

  // Transfer Form States
  const [sourceWalletId, setSourceWalletId] = useState("");
  const [destWalletId, setDestWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferCurrency, setTransferCurrency] = useState("IDR");

  // Goal Form States
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalWalletId, setGoalWalletId] = useState("");
  const [goalDate, setGoalDate] = useState(new Date().toISOString().split("T")[0]);
  const [goalDescription, setGoalDescription] = useState("");

  const handleAmountChange = (val) => {
    const cleanNumber = val.replace(/[^0-9]/g, "");
    const formatted = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setAmount(formatted);
  };

  const handleTransferAmountChange = (val) => {
    const cleanNumber = val.replace(/[^0-9]/g, "");
    const formatted = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setTransferAmount(formatted);
  };

  const handleGoalAmountChange = (val) => {
    const cleanNumber = val.replace(/[^0-9]/g, "");
    const formatted = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setGoalAmount(formatted);
  };

  // Set default wallet and category on mount if available
  React.useEffect(() => {
    if (wallets.length > 0) {
      const activeWallet = initialWalletId || wallets[0]._id || wallets[0].id;
      setWalletId(activeWallet);
      setSourceWalletId(activeWallet);
      setGoalWalletId(activeWallet);
      
      const otherWallet = wallets.find(w => w._id !== activeWallet && w.id !== activeWallet) || wallets[0];
      setDestWalletId(otherWallet._id || otherWallet.id);
    }
    if (categories.length > 0) {
      setCategoryId(categories[0]._id || categories[0].id);
    }
    if (goals.length > 0) {
      setSelectedGoalId(goals[0]._id || goals[0].id);
    }
  }, [wallets, categories, goals, initialWalletId]);

  React.useEffect(() => {
    if (initialFormType) {
      setFormType(initialFormType);
    }
  }, [initialFormType]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || !walletId || !categoryId) return;

    const cleanAmountString = amount.replace(/\./g, "");
    const txAmount = parseFloat(cleanAmountString);

    if (txType === "expense") {
      const selectedWallet = wallets.find(w => (w._id === walletId || w.id === walletId));
      if (selectedWallet && selectedWallet.balance < txAmount) {
        setErrorModal({
          title: "Saldo Tidak Cukup",
          message: `Saldo ${selectedWallet.name} Anda (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedWallet.balance)}) tidak mencukupi untuk melakukan transaksi sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(txAmount)}.`
        });
        return;
      }
    }

    onSubmitTransaction({
      name: name.trim(),
      amount: cleanAmountString,
      type: txType,
      date,
      currency,
      description: description.trim(),
      category_id: categoryId,
      wallet_id: walletId,
      input_method: "manual"
    });

    // Reset Form
    setName("");
    setAmount("");
    setDescription("");
    onClose();
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!transferAmount || !sourceWalletId || !destWalletId) return;
    if (sourceWalletId === destWalletId) {
      alert("Source wallet and destination wallet cannot be the same!");
      return;
    }

    const cleanAmountString = transferAmount.replace(/\./g, "");
    const txAmount = parseFloat(cleanAmountString);

    const sourceWallet = wallets.find(w => (w._id === sourceWalletId || w.id === sourceWalletId));
    if (sourceWallet && sourceWallet.balance < txAmount) {
      setErrorModal({
        title: "Saldo Tidak Cukup",
        message: `Saldo ${sourceWallet.name} Anda (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(sourceWallet.balance)}) tidak mencukupi untuk melakukan transfer sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(txAmount)}.`
      });
      return;
    }

    const destWallet = wallets.find(w => (w._id === destWalletId || w.id === destWalletId));
    const sourceWalletName = sourceWallet?.name || "Wallet A";
    const destWalletName = destWallet?.name || "Wallet B";

    // Find transfer category dynamically
    let transferCategory = categories.find((c) => {
      const cName = (c.name || "").toLowerCase();
      return cName.includes("transfer") || cName.includes("pindahan") || cName.includes("kirim");
    });

    if (!transferCategory) {
      transferCategory = categories.find((c) => {
        const cName = (c.name || "").toLowerCase();
        return cName.includes("lain") || cName.includes("other");
      });
    }

    const catId = transferCategory
      ? (transferCategory._id || transferCategory.id)
      : (categories[0]?._id || categories[0]?.id);

    onSubmitTransaction({
      category_id: catId,
      wallet_id: sourceWalletId,
      target_wallet_id: destWalletId,
      amount: cleanAmountString,
      type: "transfer",
      name: `Transfer ke ${destWalletName}`,
      description: transferDescription.trim() || `Transfer dari ${sourceWalletName} ke ${destWalletName}`,
      date: transferDate,
      input_method: "manual",
      currency: transferCurrency
    });

    // Reset Form
    setTransferAmount("");
    setTransferDescription("");
    onClose();
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!goalAmount || !goalWalletId || !selectedGoalId) return;

    const cleanAmountString = goalAmount.replace(/\./g, "");
    const txAmount = parseFloat(cleanAmountString);

    const selectedWallet = wallets.find(w => (w._id === goalWalletId || w.id === goalWalletId));
    if (selectedWallet && selectedWallet.balance < txAmount) {
      setErrorModal({
        title: "Saldo Tidak Cukup",
        message: `Saldo ${selectedWallet.name} Anda (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedWallet.balance)}) tidak mencukupi untuk melakukan setoran sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(txAmount)}.`
      });
      return;
    }

    try {
      await apiRequest("/goal-history", {
        method: "POST",
        body: {
          goal_id: selectedGoalId,
          wallet_id: goalWalletId,
          amount: cleanAmountString,
          type: "saving",
          date: goalDate,
          description: goalDescription.trim() || `Setoran Tabungan Target`
        }
      });

      if (onRefreshData) {
        await onRefreshData();
      }

      // Reset Form
      setGoalAmount("");
      setGoalDescription("");
      onClose();
    } catch (err) {
      console.error("Failed to add money to goal:", err);
      alert(err.message || "Gagal menambahkan uang ke target.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up text-left border border-slate-100">
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-white">
          <div>
            <h3 className="font-extrabold text-base text-slate-800">New Transaction Entry</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Document manual transaction or transfer</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Theme Styled Tab Selector */}
        <div className="flex bg-slate-50 p-1.5 rounded-full mx-6 mb-4 gap-1 border border-slate-100">
          <button
            type="button"
            onClick={() => setFormType("manual")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
              formType === "manual"
                ? "bg-[#00bf71] text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setFormType("transfer")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
              formType === "transfer"
                ? "bg-[#00bf71] text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Funds
          </button>
          <button
            type="button"
            onClick={() => setFormType("goal")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
              formType === "goal"
                ? "bg-[#00bf71] text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Target className="w-3.5 h-3.5" /> Save to Goal
          </button>
        </div>

        {/* Form Contents */}
        {formType === "manual" && (
          <form onSubmit={handleManualSubmit} className="px-6 pb-6 space-y-4">
            {/* Income/Expense Toggle */}
            <div className="flex bg-slate-50 p-1 rounded-full w-full border border-slate-100">
              <button
                type="button"
                onClick={() => setTxType("expense")}
                className={`flex-1 py-2.5 rounded-full font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  txType === "expense"
                    ? "bg-rose-500 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> Expense
              </button>
              <button
                type="button"
                onClick={() => setTxType("income")}
                className={`flex-1 py-2.5 rounded-full font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  txType === "income"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" /> Income
              </button>
            </div>

            {/* Transaction Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Transaction Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Starbucks, Groceries, Salary..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold transition-all"
              />
            </div>

            {/* Currency, Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Amount</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-extrabold text-slate-400">
                    {CURRENCY_LIST.find(c => c.code === currency)?.symbol || "Rp"}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-extrabold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                />
              </div>
            </div>

            {/* Wallet & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Source Account</label>
                <select
                  required
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                >
                  {wallets.map((w) => (
                    <option key={w._id || w.id} value={w._id || w.id}>
                      {w.name} ({w.balance >= 1000000 ? `${(w.balance / 1000000).toFixed(1)}M` : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Category Tag</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                >
                  {categories.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.emoticon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Additional Notes (Optional)</label>
              <textarea
                placeholder="Insert brief details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 min-h-[60px] resize-none transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border-2 border-slate-200 hover:bg-slate-50 rounded-full text-xs font-extrabold text-slate-500 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-extrabold px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-md"
              >
                Save Transaction
              </button>
            </div>
          </form>
        )}

        {formType === "transfer" && (
          <form onSubmit={handleTransferSubmit} className="px-6 pb-6 space-y-4">
            {/* Source & Destination Wallet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">From Account</label>
                <select
                  required
                  value={sourceWalletId}
                  onChange={(e) => setSourceWalletId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                >
                  {wallets.map((w) => (
                    <option key={w._id || w.id} value={w._id || w.id}>
                      {w.name} ({w.balance >= 1000000 ? `${(w.balance / 1000000).toFixed(1)}M` : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">To Account</label>
                <select
                  required
                  value={destWalletId}
                  onChange={(e) => setDestWalletId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                >
                  {wallets.map((w) => (
                    <option key={w._id || w.id} value={w._id || w.id}>
                      {w.name} ({w.balance >= 1000000 ? `${(w.balance / 1000000).toFixed(1)}M` : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(w.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency, Transfer Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Currency</label>
                <select
                  value={transferCurrency}
                  onChange={(e) => setTransferCurrency(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Transfer Amount</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-extrabold text-slate-400">
                    {CURRENCY_LIST.find(c => c.code === transferCurrency)?.symbol || "Rp"}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => handleTransferAmountChange(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-extrabold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Transfer Date</label>
                <input
                  type="date"
                  required
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Transfer Notes (Optional)</label>
              <textarea
                placeholder="e.g. Paying back lunch..."
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 min-h-[60px] resize-none transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border-2 border-slate-200 hover:bg-slate-50 rounded-full text-xs font-extrabold text-slate-500 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-extrabold px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-md"
              >
                Execute Transfer
              </button>
            </div>
          </form>
        )}

        {formType === "goal" && (
          goals.length === 0 ? (
            <div className="px-6 pb-6 text-center py-10 text-slate-500">
              <p className="text-sm font-semibold mb-2">Anda belum memiliki target tabungan.</p>
              <p className="text-xs text-slate-400">Silakan buat target tabungan baru di tab Portfolio terlebih dahulu.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2 bg-[#00bf71] text-white font-bold text-xs rounded-full cursor-pointer hover:bg-[#00a862] transition-colors"
              >
                Tutup
              </button>
            </div>
          ) : (
            <form onSubmit={handleGoalSubmit} className="px-6 pb-6 space-y-4">
              {/* Target Goal & Source Wallet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Target Saving Goal</label>
                  <select
                    required
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                  >
                    {goals.map((g) => (
                      <option key={g._id || g.id} value={g._id || g.id}>
                        {g.icon || "🎯"} {g.name} ({new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(g.current)} / {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(g.target)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Source Account</label>
                  <select
                    required
                    value={goalWalletId}
                    onChange={(e) => setGoalWalletId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                  >
                    {wallets.map((w) => (
                      <option key={w._id || w.id} value={w._id || w.id}>
                        {w.name} ({w.balance >= 1000000 ? `${(w.balance / 1000000).toFixed(1)}M` : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Currency, Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Currency</label>
                  <select
                    disabled
                    value="IDR"
                    className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none text-slate-400 font-semibold cursor-not-allowed transition-all"
                  >
                    <option value="IDR">🇮🇩 IDR</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Setoran Amount</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-extrabold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={goalAmount}
                      onChange={(e) => handleGoalAmountChange(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-extrabold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Setoran Date</label>
                  <input
                    type="date"
                    required
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold cursor-pointer transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Setoran Notes (Optional)</label>
                <textarea
                  placeholder="e.g. Tabungan bulanan laptop..."
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 min-h-[60px] resize-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border-2 border-slate-200 hover:bg-slate-50 rounded-full text-xs font-extrabold text-slate-500 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-extrabold px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-md"
                >
                  Save Goal Setoran
                </button>
              </div>
            </form>
          )
        )}
      </div>

      {errorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up text-center border border-slate-100 p-6">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-rose-500 text-2xl font-bold">⚠️</span>
            </div>
            <h3 className="font-extrabold text-lg text-slate-800 mb-2">{errorModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal(null)}
              className="w-full bg-[#00bf71] hover:bg-[#00a862] text-white font-extrabold py-3 rounded-full transition-all cursor-pointer shadow-md text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
