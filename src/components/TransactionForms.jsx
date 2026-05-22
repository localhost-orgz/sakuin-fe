import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Calendar, FileText, DollarSign, Wallet, Tag, X, ChevronRight, Plus } from "lucide-react";
import { getWalletTheme } from "../hooks/useWalletTheme";

export default function TransactionForms({
  wallets = [],
  categories = [],
  onSubmitTransaction,
  onClose,
  initialWalletId = null,
  initialFormType = null
}) {
  const [formType, setFormType] = useState(initialFormType || "manual"); // "manual" or "transfer"
  const [txType, setTxType] = useState("expense"); // "expense" or "income" (for manual)

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

  // Set default wallet and category on mount if available
  React.useEffect(() => {
    if (wallets.length > 0) {
      const activeWallet = initialWalletId || wallets[0]._id || wallets[0].id;
      setWalletId(activeWallet);
      setSourceWalletId(activeWallet);
      
      const otherWallet = wallets.find(w => w._id !== activeWallet && w.id !== activeWallet) || wallets[0];
      setDestWalletId(otherWallet._id || otherWallet.id);
    }
    if (categories.length > 0) {
      setCategoryId(categories[0]._id || categories[0].id);
    }
  }, [wallets, categories, initialWalletId]);

  React.useEffect(() => {
    if (initialFormType) {
      setFormType(initialFormType);
    }
  }, [initialFormType]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || !walletId || !categoryId) return;

    onSubmitTransaction({
      name: name.trim(),
      amount: Number(amount),
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

    const sourceWalletName = wallets.find(w => (w._id === sourceWalletId || w.id === sourceWalletId))?.name || "Wallet A";
    const destWalletName = wallets.find(w => (w._id === destWalletId || w.id === destWalletId))?.name || "Wallet B";

    // 1. Post expense for source wallet
    onSubmitTransaction({
      name: `Transfer to ${destWalletName}`,
      amount: Number(transferAmount),
      type: "expense",
      date: transferDate,
      currency: "IDR",
      description: transferDescription.trim() || `Transfer from ${sourceWalletName} to ${destWalletName}`,
      category_id: "cat_2", // General / transfer category
      wallet_id: sourceWalletId,
      input_method: "manual"
    });

    // 2. Post income for destination wallet
    onSubmitTransaction({
      name: `Transfer from ${sourceWalletName}`,
      amount: Number(transferAmount),
      type: "income",
      date: transferDate,
      currency: "IDR",
      description: transferDescription.trim() || `Transfer from ${sourceWalletName} to ${destWalletName}`,
      category_id: "cat_5", // General / transfer category
      wallet_id: destWalletId,
      input_method: "manual"
    });

    // Reset Form
    setTransferAmount("");
    setTransferDescription("");
    onClose();
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
            onClick={() => setFormType("manual")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              formType === "manual"
                ? "bg-[#00bf71] text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Manual Entry
          </button>
          <button
            onClick={() => setFormType("transfer")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              formType === "transfer"
                ? "bg-[#00bf71] text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Funds
          </button>
        </div>

        {/* Form Contents */}
        {formType === "manual" ? (
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

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Amount (Rp)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-extrabold text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-extrabold transition-all"
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
        ) : (
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

            {/* Transfer Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Transfer Amount (Rp)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-extrabold text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-extrabold transition-all"
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
      </div>
    </div>
  );
}
