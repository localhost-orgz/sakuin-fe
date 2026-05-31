import React, { useState, useEffect, useRef } from "react";
import { Camera, Upload, X, Check, RefreshCw, Sparkles, Loader2, DollarSign, Wallet, Users, UserPlus } from "lucide-react";
import { getWalletTheme } from "../hooks/useWalletTheme";
import { apiRequest } from "../utils/api";

const MOCK_STRUK_DATA = {
  merchant: "McDonald's - Sudirman",
  date: new Date().toISOString().split("T")[0],
  items: [
    { id: 1, name: "Double Cheeseburger", price: 45000 },
    { id: 2, name: "French Fries Large", price: 22000 },
    { id: 3, name: "Coca Cola Medium", price: 15000 },
    { id: 4, name: "Apple Pie", price: 12000 }
  ],
  tax: 9400,
  total: 103400
};

export default function SakuSnap({
  wallets = [],
  categories = [],
  onSubmitTransaction,
  onRefreshData,
  onClose
}) {
  const [step, setStep] = useState("capture"); // "capture" | "scanning" | "result"
  const [photoUrl, setPhotoUrl] = useState(null);
  const [stream, setStream] = useState(null);
  const [ocrData, setOcrData] = useState(MOCK_STRUK_DATA);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [savedTransaction, setSavedTransaction] = useState(null);

  // Split bill states
  const [friends, setFriends] = useState(["Saya", "Budi", "Siti"]);
  const [newFriendName, setNewFriendName] = useState("");
  const [itemAssignments, setItemAssignments] = useState({
    1: ["Saya"], // Double Cheeseburger
    2: ["Budi", "Siti"], // French Fries
    3: ["Saya", "Budi"], // Coca Cola
    4: ["Siti"] // Apple Pie
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Setup camera stream
  useEffect(() => {
    if (step === "capture" && !photoUrl) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step, photoUrl]);

  useEffect(() => {
    if (wallets.length > 0) setSelectedWalletId(wallets[0]._id || wallets[0].id);
    if (categories.length > 0) {
      // Find food category
      const foodCat = categories.find(c => c.name.toLowerCase().includes("makan") || c.name.toLowerCase().includes("minum"));
      setSelectedCategoryId(foodCat ? (foodCat._id || foodCat.id) : (categories[0]._id || categories[0].id));
    }
  }, [wallets, categories]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Webcam access rejected or unavailable, falling back to file upload.", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL("image/jpeg");
      setPhotoUrl(dataUrl);
      stopCamera();
      triggerScan(dataUrl);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
        stopCamera();
        triggerScan(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const triggerScan = async (imgUrl) => {
    setStep("scanning");
    try {
      const file = dataURLtoFile(imgUrl, "receipt.jpg");
      const formData = new FormData();
      formData.append("receipt", file);

      const res = await apiRequest("/ai/sakusnap", {
        method: "POST",
        body: formData,
        isFormData: true,
      });

      if (res.status === "success" && res.data) {
        const mappedData = {
          merchant: res.data.description || "Struk Pembelian",
          date: res.data.date || new Date().toISOString().split("T")[0],
          items: res.data.items ? res.data.items.map((it, idx) => ({
            id: idx + 1,
            name: it.name,
            price: Number(it.price) || 0
          })) : [],
          tax: 0,
          total: res.data.amount || 0
        };
        
        let initialCategoryId = res.data.category_id;
        if (initialCategoryId) {
          setSelectedCategoryId(initialCategoryId);
        } else if (categories.length > 0) {
          const foodCat = categories.find(c => c.name.toLowerCase().includes("makan") || c.name.toLowerCase().includes("minum"));
          initialCategoryId = foodCat ? (foodCat._id || foodCat.id) : (categories[0]._id || categories[0].id);
          setSelectedCategoryId(initialCategoryId);
        } else {
          initialCategoryId = "69a99efab5420796db171e00";
        }

        let initialWalletId = "";
        if (wallets.length > 0) {
          initialWalletId = wallets[0]._id || wallets[0].id;
          setSelectedWalletId(initialWalletId);
        }

        // Post transaction automatically to /transaction
        try {
          const postRes = await apiRequest("/transaction", {
            method: "POST",
            body: {
              category_id: initialCategoryId,
              wallet_id: initialWalletId,
              amount: String(res.data.amount || 0),
              type: "expense",
              name: res.data.description ? res.data.description.substring(0, 30) : "Scan SakuSnap",
              description: res.data.description || "Pembelian dari SakuSnap",
              date: res.data.date || new Date().toISOString().split("T")[0],
              input_method: "snap"
            }
          });
          if (postRes?.status === "success" && postRes.data) {
            setSavedTransaction(postRes.data);
            if (onRefreshData) {
              await onRefreshData();
            }
          }
        } catch (tErr) {
          console.warn("Failed to post transaction automatically after OCR", tErr);
        }
        
        setOcrData(mappedData);
        setStep("result");
      } else {
        throw new Error(res.message || "Failed to scan receipt");
      }
    } catch (err) {
      console.error("SakuSnap OCR failed:", err);
      alert(err.message || "Gagal scan struk. Silakan coba lagi.");
      setStep("capture");
      setPhotoUrl(null);
    }
  };

  const handleRecapture = () => {
    setPhotoUrl(null);
    setStep("capture");
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    if (friends.includes(newFriendName.trim())) {
      alert("Nama teman sudah ada!");
      return;
    }
    setFriends([...friends, newFriendName.trim()]);
    setNewFriendName("");
  };

  const toggleItemAssignment = (itemId, friendName) => {
    setItemAssignments(prev => {
      const currentAssigned = prev[itemId] || [];
      let updatedAssigned;
      if (currentAssigned.includes(friendName)) {
        // Don't allow empty assignments
        if (currentAssigned.length === 1) return prev;
        updatedAssigned = currentAssigned.filter(f => f !== friendName);
      } else {
        updatedAssigned = [...currentAssigned, friendName];
      }
      return { ...prev, [itemId]: updatedAssigned };
    });
  };

  // Calculate split costs
  const calculateSplitResults = () => {
    const results = {};
    friends.forEach(f => {
      results[f] = 0;
    });

    let totalSubtotal = 0;
    ocrData.items.forEach(item => {
      const assigned = itemAssignments[item.id] || [];
      const costPerPerson = item.price / assigned.length;
      assigned.forEach(f => {
        if (results[f] !== undefined) {
          results[f] += costPerPerson;
        }
      });
      totalSubtotal += item.price;
    });

    // Distribute tax proportionally
    if (ocrData.tax > 0 && totalSubtotal > 0) {
      friends.forEach(f => {
        const proportion = results[f] / totalSubtotal;
        results[f] += ocrData.tax * proportion;
      });
    }

    return results;
  };

  const handleSaveTransaction = async () => {
    if (!selectedWalletId || !selectedCategoryId) return;

    const txId = savedTransaction ? (savedTransaction._id || savedTransaction.id) : null;
    const body = {
      name: ocrData.merchant,
      amount: String(ocrData.total),
      type: "expense",
      date: ocrData.date,
      currency: "IDR",
      category_id: selectedCategoryId,
      wallet_id: selectedWalletId,
      description: `SakuSnap Scan dari ${ocrData.merchant}. Items: ${ocrData.items.map(i => `${i.name} (${i.price})`).join(", ")}`,
      input_method: "snap"
    };

    try {
      if (txId) {
        await apiRequest(`/transaction/${txId}`, {
          method: "PUT",
          body
        });
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        onSubmitTransaction(body);
      }
    } catch (err) {
      console.error("Failed to save transaction updates:", err);
    }

    onClose();
  };

  const formatIDR = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const splitResults = calculateSplitResults();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-slide-up text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-500" /> SakuSnap Receipt Scan
            </h3>
            <p className="text-xs text-slate-400">Pindai struk belanja fisik Anda untuk pencatatan instan</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content steps */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: CAPTURE AREA */}
          {step === "capture" && (
            <div className="space-y-6">
              {/* Live camera screen / File drop boundary */}
              <div className="bg-slate-950 rounded-2xl aspect-[4/3] relative overflow-hidden flex flex-col items-center justify-center border border-slate-800 shadow-inner">
                {stream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover transform scale-x-100"
                    />
                    <button
                      onClick={handleCapture}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white hover:bg-slate-100 border-4 border-emerald-500 shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <Camera className="w-7 h-7 text-slate-800" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center gap-4 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">Kamera tidak aktif</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">Hubungkan kamera atau pilih file foto struk belanja Anda</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                    >
                      <Upload className="w-4 h-4" /> Pilih Foto Struk
                    </button>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Upload fallback option */}
              {stream && (
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <span className="text-slate-500 font-semibold">Memiliki foto struk belanja di galeri?</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-slate-200 hover:bg-white text-slate-600 font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Buka File Manager
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* STEP 2: SCANNING ANIMATION */}
          {step === "scanning" && (
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] w-full max-w-sm border border-slate-200 shadow-md">
                {photoUrl && <img src={photoUrl} alt="Struk scan" className="w-full h-full object-cover blur-[1px]" />}
                {/* Pulse scanline animation */}
                <div className="absolute inset-x-0 h-1 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-[bounce_2s_infinite]" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-black">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SakuOCR Membaca Data...</span>
                </div>
                <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                  Teknologi AI kami sedang menganalisis merchant, daftar barang, nominal pajak, dan total pengeluaran struk.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT & SPLIT BILL */}
          {step === "result" && (
            <div className="space-y-6">
              {/* Receipt Preview Details */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-slate-200/60">
                  <div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">
                      Hasil Pindaian
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-base mt-1.5 leading-none">{ocrData.merchant}</h4>
                    <span className="text-[10px] text-slate-400 block mt-1">{ocrData.date}</span>
                  </div>
                  <button
                    onClick={handleRecapture}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Pindai Ulang
                  </button>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  {ocrData.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <span className="text-slate-600 font-medium">{item.name}</span>
                      <span className="text-slate-800 font-bold">{formatIDR(item.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/40">
                    <span>Pajak (10%)</span>
                    <span>{formatIDR(ocrData.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-2 border-t border-slate-200">
                    <span>Total Keseluruhan</span>
                    <span className="text-emerald-600">{formatIDR(ocrData.total)}</span>
                  </div>
                </div>
              </div>

              {/* WALLET & CATEGORY ASSIGNMENT FOR TRANSACTION CREATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Simpan ke Dompet</label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w._id || w.id} value={w._id || w.id}>
                        {w.name} ({formatIDR(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kategori Belanja</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.emoticon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ────────────────── SPLIT BILL TOOL ────────────────── */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-emerald-500" /> Fitur Split Bill (Bagi Tagihan)
                </h4>
                
                {/* Friends List Input */}
                <form onSubmit={handleAddFriend} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan nama teman..."
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-600 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </form>

                {/* Friend Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {friends.map(f => (
                    <span
                      key={f}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        f === "Saya" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 border border-slate-200/40"
                      }`}
                    >
                      {f}
                      {f !== "Saya" && (
                        <button
                          onClick={() => setFriends(friends.filter(name => name !== f))}
                          className="ml-1.5 hover:text-rose-600 text-slate-400 font-black cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {/* Split assignments details grid */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bagikan Barang ke Pembayar</span>
                  
                  <div className="space-y-3">
                    {ocrData.items.map(item => (
                      <div key={item.id} className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="font-bold text-slate-500">{formatIDR(item.price)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {friends.map(friend => {
                            const isAssigned = (itemAssignments[item.id] || []).includes(friend);
                            return (
                              <button
                                key={friend}
                                onClick={() => toggleItemAssignment(item.id, friend)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                  isAssigned
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-200/50"
                                }`}
                              >
                                {friend}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Split Summary calculations */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rincian Pembayaran Per Orang</span>
                    {friends.map(friend => (
                      <div key={friend} className="flex justify-between text-xs py-1 font-semibold text-slate-700">
                        <span>{friend}</span>
                        <span className="font-extrabold text-slate-800">{formatIDR(splitResults[friend])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3 FOOTER ACTIONS */}
        {step === "result" && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0">
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center"
            >
              Batal
            </button>
            <button
              onClick={handleSaveTransaction}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all active:scale-98 cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" /> Simpan Total Transaksi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
