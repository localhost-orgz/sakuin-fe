import React from "react";
import authImage1 from "../assets/auth-image1.png";
import authImage2 from "../assets/auth-image2.png";

export default function SignIn({ onLogin }) {
  const handleGoogleLogin = () => {
    const redirectUri = encodeURIComponent(window.location.origin + "/home");
    const authUrl = `https://sakuin-be.vercel.app/auth/google?redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-[#c4f5e6] to-[#ffffff] flex flex-col items-center justify-between p-6 font-sans select-none overflow-hidden relative">
      {/* Top spacer */}
      <div className="h-10" />

      {/* Main Content Area */}
      <div className="max-w-md w-full flex flex-col items-center gap-12 relative z-10 py-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <img
            src="/logo.png"
            alt="Sakuin Logo"
            className="w-12 h-12 object-contain shadow-lg shadow-emerald-500/10 rounded-2xl animate-bounce"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sakuin</h2>
            <p className="text-[9px] text-[#00bf71] font-bold uppercase tracking-widest text-center mt-0.5">Finance Tracker</p>
          </div>
        </div>

        {/* Conversational Bubble Chat Flow */}
        <div className="w-full space-y-8 my-4">
          {/* Row 1 — avatar + first bubble */}
          <div className="flex flex-row items-center justify-start pl-4 animate-slide-right [animation-delay:100ms]">
            <img
              src={authImage1}
              alt="Avatar bubble 1"
              className="w-16 h-16 rounded-full border-4 border-white shadow-md hover:scale-105 transition-transform"
            />
            <div className="bg-white border-2 border-slate-100 py-3 px-6 -ml-3 rounded-3xl rounded-tl-none shadow-md">
              <span className="text-sm font-bold text-slate-700">Hi, Welcome Back! 👋</span>
            </div>
          </div>

          {/* Row 2 — second bubble + avatar */}
          <div className="flex flex-row items-center justify-end pr-4 animate-slide-left [animation-delay:300ms]">
            <div className="bg-white border-2 border-slate-100 py-3 px-6 -mr-3 rounded-3xl rounded-tr-none shadow-md">
              <span className="text-sm font-bold text-slate-700">Hello again, Sakuin! 🚀</span>
            </div>
            <img
              src={authImage2}
              alt="Avatar bubble 2"
              className="w-16 h-16 rounded-full border-4 border-white shadow-md hover:scale-105 transition-transform"
            />
          </div>
        </div>

        {/* Login CTA Card */}
        <div className="w-full bg-white/75 backdrop-blur-md border-2 border-white rounded-3xl p-6 shadow-xl space-y-5 animate-slide-up [animation-delay:500ms] text-center">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Ready to dive in?</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Access your workspace below</p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Google Login button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-2xl border-2 border-slate-100 shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-xs cursor-pointer"
            >
              <img
                src="https://image.similarpng.com/file/similarpng/very-thumbnail/2020/06/Logo-google-icon-PNG.png"
                alt="Google Logo"
                className="w-5 h-5 object-contain"
              />
              Continue with Google
            </button>
          </div>

          {/* Secure Note */}
          <p className="text-[9px] text-slate-400 leading-normal font-medium">
            By signing in, you access your personal SQLite database node mapped to your Sakuin workspace account.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest relative z-10">
        Sakuin Workspace • © 2026
      </div>
    </div>
  );
}
