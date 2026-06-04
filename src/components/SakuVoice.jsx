import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, Edit3, Check, Trash2, X, Play, Loader2 } from "lucide-react";
import { getWalletTheme } from "../hooks/useWalletTheme";
import { apiRequest } from "../utils/api";

export default function SakuVoice({
  wallets = [],
  categories = [],
  onSubmitTransaction,
  onClose
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorModal, setErrorModal] = useState(null);

  // Parsed states
  const [parsedName, setParsedName] = useState("");
  const [parsedAmount, setParsedAmount] = useState("");
  const [parsedType, setParsedType] = useState("expense");
  const [parsedWalletId, setParsedWalletId] = useState("");
  const [parsedCategoryId, setParsedCategoryId] = useState("");
  const [parsedDate, setParsedDate] = useState(new Date().toISOString().split("T")[0]);

  // Audio Recording References
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);

  // Speech Recognition Reference (as fallback)
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser compatibility for SpeechRecognition fallback
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (!window.MediaRecorder) {
        setIsSupported(false);
        setErrorMsg("Browser Anda tidak mendukung perekaman suara.");
      }
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "id-ID";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
        setErrorMsg("");
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        parseIndonesianSpeech(text);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMsg("Izin mikrofon ditolak.");
        } else {
          setErrorMsg(`Terjadi kesalahan perekaman: ${event.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    // Set default wallet & category
    if (wallets.length > 0) {
      setParsedWalletId(wallets[0]._id || wallets[0].id);
    }
    if (categories.length > 0) {
      setParsedCategoryId(categories[0]._id || categories[0].id);
    }

    return () => {
      // Clean up audio tracks on unmount
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [wallets, categories]);

  // Local Fallback Parser if API fails or SpeechRecognition is triggered
  const parseIndonesianSpeech = (text) => {
    const textLower = text.toLowerCase();
    
    let type = "expense";
    const incomeKeywords = ["masuk", "gaji", "terima", "dapat", "pemasukan", "transfer masuk", "income", "untung"];
    if (incomeKeywords.some(keyword => textLower.includes(keyword))) {
      type = "income";
    }
    setParsedType(type);

    let amount = 0;
    let matches = textLower.match(/(\d+)\s*(ribu|juta|ratus|puluh)?/gi);
    if (matches) {
      const rawText = matches[0];
      const numericVal = parseFloat(rawText.match(/\d+/)[0]);
      if (rawText.includes("ribu")) {
        amount = numericVal * 1000;
      } else if (rawText.includes("juta")) {
        amount = numericVal * 1000000;
      } else if (rawText.includes("ratus")) {
        amount = numericVal * 100;
      } else {
        amount = numericVal;
      }
    } else {
      const numMatch = textLower.match(/\b\d+\b/);
      if (numMatch) {
        amount = Number(numMatch[0]);
      }
    }
    setParsedAmount(amount > 0 ? amount.toString() : "");

    let matchedWallet = wallets[0];
    wallets.forEach(w => {
      const wName = w.name.toLowerCase();
      if (textLower.includes(wName) || wName.split(" ").some(part => part.length > 3 && textLower.includes(part))) {
        matchedWallet = w;
      }
    });
    if (matchedWallet) {
      setParsedWalletId(matchedWallet._id || matchedWallet.id);
    }

    let matchedCat = categories[0];
    categories.forEach(c => {
      const cName = c.name.toLowerCase();
      const parts = cName.replace(/[&|]/g, "").split(/\s+/);
      if (textLower.includes(cName) || parts.some(part => part.length > 3 && textLower.includes(part))) {
        matchedCat = c;
      }
    });
    if (textLower.includes("makan") || textLower.includes("minum") || textLower.includes("kopi") || textLower.includes("sarapan")) {
      const found = categories.find(c => c.name.toLowerCase().includes("makan") || c.name.toLowerCase().includes("minum"));
      if (found) matchedCat = found;
    } else if (textLower.includes("bensin") || textLower.includes("gojek") || textLower.includes("grab") || textLower.includes("ojek") || textLower.includes("mobil") || textLower.includes("motor")) {
      const found = categories.find(c => c.name.toLowerCase().includes("transport"));
      if (found) matchedCat = found;
    } else if (textLower.includes("gaji") || textLower.includes("freelance") || textLower.includes("bonus")) {
      const found = categories.find(c => c.name.toLowerCase().includes("investasi") || c.name.toLowerCase().includes("gaji") || c.name.toLowerCase().includes("pemasukan"));
      if (found) matchedCat = found;
    }

    if (matchedCat) {
      setParsedCategoryId(matchedCat._id || matchedCat.id);
    }

    let title = text;
    title = title.replace(/\d+/g, "")
                 .replace(/ribu/gi, "")
                 .replace(/juta/gi, "")
                 .replace(/rupiah/gi, "")
                 .replace(/rp/gi, "");
    
    wallets.forEach(w => {
      title = title.replace(new RegExp(w.name, "gi"), "");
    });

    title = title.replace(/^(beli|bayar|gaji|dapat|masuk|buat|catat|transaksi|ada)\s+/i, "");
    title = title.trim();

    if (title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    } else {
      title = "Transaksi Suara";
    }
    setParsedName(title);
  };

  const uploadAndParseAudio = async (audioBlob) => {
    setIsTranscribing(true);
    setErrorMsg("");
    try {
      const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      const formData = new FormData();
      formData.append("voice", file);

      console.log("Mengirim file audio ke /ai/sakuvoice...");
      const res = await apiRequest("/ai/sakuvoice", {
        method: "POST",
        body: formData,
        isFormData: true,
      });

      if (res.status === "success" && res.data) {
        const parsed = res.data;
        setTranscript(parsed.description || "Suara berhasil diterjemahkan");
        setParsedName(parsed.name || "Transaksi Suara");
        setParsedAmount(parsed.amount ? String(parsed.amount) : "");
        setParsedType(parsed.type || "expense");
        
        if (parsed.wallet_id) {
          setParsedWalletId(parsed.wallet_id);
        }
        if (parsed.category_id) {
          setParsedCategoryId(parsed.category_id);
        }
        if (parsed.date) {
          setParsedDate(parsed.date);
        }
        setIsDone(true);
      } else {
        throw new Error(res.message || "Failed to parse audio");
      }
    } catch (err) {
      console.warn("Gagal memproses audio via API. Menggunakan transkripsi fallback manual.", err);
      setErrorMsg("Gagal memproses suara di server. Silakan coba lagi atau gunakan simulasi teks.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const startVoiceCapture = async () => {
    setTranscript("");
    setErrorMsg("");
    setIsDone(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAndParseAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("MediaRecorder failed, falling back to Web Speech API", err);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (recErr) {
          console.error("Speech recognition failed:", recErr);
          setErrorMsg("Gagal mengakses mikrofon.");
        }
      } else {
        setErrorMsg("Perekaman suara tidak didukung.");
      }
    }
  };

  const stopVoiceCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Keyboard Simulation Fallback for testing voice inputs
  const handleSimulationSubmit = (simText) => {
    setTranscript(simText);
    parseIndonesianSpeech(simText);
    setIsDone(true);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!parsedName || !parsedAmount || !parsedWalletId || !parsedCategoryId) return;

    const txAmount = parseFloat(parsedAmount);
    if (parsedType === "expense") {
      const selectedWallet = wallets.find(w => (w._id === parsedWalletId || w.id === parsedWalletId));
      if (selectedWallet && selectedWallet.balance < txAmount) {
        setErrorModal({
          title: "Saldo Tidak Cukup",
          message: `Saldo ${selectedWallet.name} Anda (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedWallet.balance)}) tidak mencukupi untuk melakukan transaksi sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(txAmount)}.`
        });
        return;
      }
    }

    onSubmitTransaction({
      name: parsedName.trim(),
      amount: String(parsedAmount),
      type: parsedType,
      date: parsedDate,
      currency: "IDR",
      category_id: parsedCategoryId,
      wallet_id: parsedWalletId,
      description: transcript ? `Transcribed: "${transcript}"` : "Input via Voice Track",
      input_method: "sakuvoice"
    });

    onClose();
  };

  const [isDone, setIsDone] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up text-left">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">SakuVoice Tracker</h3>
              <p className="text-xs text-slate-400">Catat keuangan otomatis dengan suara Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Waveform & Rec trigger area */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col items-center justify-center gap-4 relative overflow-hidden">
            {/* Wave animation */}
            {isTranscribing ? (
              <div className="flex items-center justify-center h-16 w-full">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : isRecording ? (
              <div className="flex items-end justify-center gap-1.5 h-16 w-full">
                <div className="w-1.5 bg-emerald-500 rounded-full animate-[bounce_0.6s_infinite_100ms] h-8" />
                <div className="w-1.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-12" />
                <div className="w-1.5 bg-emerald-500 rounded-full animate-[bounce_0.6s_infinite_300ms] h-16" />
                <div className="w-1.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_400ms] h-10" />
                <div className="w-1.5 bg-emerald-500 rounded-full animate-[bounce_0.6s_infinite_500ms] h-14" />
                <div className="w-1.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_600ms] h-6" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-16 w-full opacity-30 gap-1.5">
                <div className="w-1.5 bg-slate-400 rounded-full h-3" />
                <div className="w-1.5 bg-slate-400 rounded-full h-3" />
                <div className="w-1.5 bg-slate-400 rounded-full h-3" />
                <div className="w-1.5 bg-slate-400 rounded-full h-3" />
                <div className="w-1.5 bg-slate-400 rounded-full h-3" />
              </div>
            )}

            <button
              type="button"
              disabled={isTranscribing}
              onClick={isRecording ? stopVoiceCapture : startVoiceCapture}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer z-10 ${
                isTranscribing ? "bg-slate-700 cursor-not-allowed" : isRecording ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
              }`}
            >
              {isTranscribing ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : isRecording ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
            </button>

            <span className="text-xs font-bold tracking-wide uppercase text-slate-400">
              {isTranscribing ? "SakuVoice sedang memproses rekaman..." : isRecording ? "Sedang mendengarkan... Berbicaralah sekarang" : "Klik tombol mic untuk mulai bicara"}
            </span>

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2 max-w-sm mt-2 text-center">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Fallback Simulation triggers */}
          {!isSupported && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Contoh Suara (Simulasi)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={() => handleSimulationSubmit("Beli nasi goreng 25 ribu di Dompet Utama")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>"Beli nasi goreng 25 ribu..."</span>
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                </button>
                <button
                  onClick={() => handleSimulationSubmit("Gaji masuk 5 juta ke Bank Jago")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>"Gaji masuk 5 juta..."</span>
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                </button>
                <button
                  onClick={() => handleSimulationSubmit("Bayar tagihan listrik seratus lima puluh ribu dari E-Wallet Gopay")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-left transition-all cursor-pointer flex items-center justify-between col-span-1 sm:col-span-2"
                >
                  <span>"Bayar tagihan listrik 150 ribu..."</span>
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              </div>
            </div>
          )}

          {/* Transcript display */}
          {transcript && (
            <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hasil Transkripsi
              </span>
              <p className="text-slate-800 font-bold text-sm italic">"{transcript}"</p>
            </div>
          )}

          {/* Parsed & Editor Form */}
          {transcript && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 pt-2 border-t border-slate-100 animate-slide-down">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-500" /> Review Hasil Ekstraksi
              </h4>

              {/* Title / Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Judul Transaksi</label>
                <input
                  type="text"
                  required
                  value={parsedName}
                  onChange={(e) => setParsedName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold"
                />
              </div>

              {/* Amount & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nominal Uang (Rp)</label>
                  <input
                    type="number"
                    required
                    value={parsedAmount}
                    onChange={(e) => setParsedAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tipe Transaksi</label>
                  <select
                    value={parsedType}
                    onChange={(e) => setParsedType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="expense">📉 Pengeluaran</option>
                    <option value="income">📈 Pemasukan</option>
                  </select>
                </div>
              </div>

              {/* Wallet & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Metode Dompet</label>
                  <select
                    value={parsedWalletId}
                    onChange={(e) => setParsedWalletId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w._id || w.id} value={w._id || w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kategori</label>
                  <select
                    value={parsedCategoryId}
                    onChange={(e) => setParsedCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-semibold cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.emoticon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all active:scale-98 mt-2 cursor-pointer text-center text-sm"
              >
                Konfirmasi & Simpan Transaksi
              </button>
            </form>
          )}
        </div>
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
