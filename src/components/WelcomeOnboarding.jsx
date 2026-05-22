import React, { useState } from "react";
import img1 from "../assets/onboarding-image1.png";
import img2 from "../assets/onboarding-image2.png";
import img3 from "../assets/onboarding-image3.png";
import img4 from "../assets/onboarding-image4.png";

const SLIDES = [
  {
    id: "1",
    title: "Catat Manual dalam Sekejap",
    description:
      "Kontrol penuh atas setiap pengeluaranmu. Masukkan detail transaksi dengan navigasi yang simpel dan intuitif.",
    image: img1,
  },
  {
    id: "2",
    title: "Foto Struk & Split Bill",
    description:
      "Gak perlu hitung manual lagi! Foto struk belanjaanmu, biarkan AI mencatatnya, dan bagi tagihan dengan teman secara otomatis.",
    image: img2,
  },
  {
    id: "3",
    title: "Tinggal Ngomong Saja",
    description:
      'Sedang di jalan? Gunakan perintah suara untuk mencatat transaksi. "Makan siang 50 ribu", semudah bicara dengan teman.',
    image: img3,
  },
  {
    id: "4",
    title: "Import Bukti Transfer Instan",
    description:
      "Langsung bagikan bukti transfer dari m-banking ke Sakuin. Transaksi otomatis tercatat tanpa perlu input ulang satu per satu.",
    image: img4,
  },
];

export default function WelcomeOnboarding({ onFinish }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d4f5e6] via-[#edfaf3] to-[#ffffff] flex flex-col justify-between p-6 font-sans select-none overflow-hidden relative">
      {/* Top Navigation Row */}
      <div className="flex justify-between items-center max-w-lg mx-auto w-full py-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#00bf71] flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            S
          </div>
          <span className="text-xs font-extrabold text-slate-700 tracking-tight">Sakuin Onboarding</span>
        </div>

        {!isLast ? (
          <button
            onClick={handleSkip}
            className="text-sm font-extrabold text-[#00bf71] hover:text-[#00a862] px-4 py-2 rounded-full hover:bg-[#00bf71]/10 transition-all cursor-pointer"
          >
            Skip
          </button>
        ) : (
          <div className="h-9" />
        )}
      </div>

      {/* Slide Visual and Content Container */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full text-center py-6 relative z-10">
        <div className="flex flex-col items-center gap-8 animate-fade-in w-full">
          {/* Onboarding Asset Illustration */}
          <div className="h-64 flex items-center justify-center relative w-full">
            {/* Subtle decor glowing blob behind image */}
            <div className="absolute w-44 h-44 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />
            <img
              src={SLIDES[activeIndex].image}
              alt={SLIDES[activeIndex].title}
              className="max-h-60 max-w-[85%] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
            />
          </div>

          {/* Slide Texts */}
          <div className="space-y-3 px-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {SLIDES[activeIndex].title}
            </h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
              {SLIDES[activeIndex].description}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls Container */}
      <div className="max-w-md mx-auto w-full flex flex-col items-center gap-6 pb-8 relative z-10">
        {/* Pagination Dot Indicators */}
        <div className="flex gap-2 items-center">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex ? "w-6 bg-[#00bf71]" : "w-2 bg-[#c7f0dc]"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-4 bg-[#00bf71] hover:bg-[#00a862] text-white font-extrabold rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {!isLast ? "Next" : "Get started 🚀"}
        </button>
      </div>
    </div>
  );
}
