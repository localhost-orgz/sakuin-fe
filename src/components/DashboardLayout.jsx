import React from "react";
import { Home, BarChart3, Briefcase, User, Mic, Camera, Plus, LogOut, ChevronRight } from "lucide-react";

export default function DashboardLayout({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onTriggerVoice,
  onTriggerSnap,
  onTriggerManual,
  children
}) {
  const tabs = [
    { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "portfolio", label: "Portfolio", icon: <Briefcase className="w-5 h-5" /> },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-24 md:pb-0">
      {/* ────────────────── DESKTOP SIDEBAR ────────────────── */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-100 p-6 sticky top-0 h-screen z-20">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-[#00bf71] flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">Sakuin</span>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100/50 space-y-3">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Quick Track</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onTriggerVoice}
                title="Voice Track"
                className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl hover:bg-emerald-50 border border-slate-100 text-emerald-600 hover:text-[#00bf71] transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={onTriggerSnap}
                title="Photo Track"
                className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl hover:bg-emerald-50 border border-slate-100 text-emerald-600 hover:text-[#00bf71] transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={onTriggerManual}
                title="Manual Input"
                className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl hover:bg-emerald-50 border border-slate-100 text-emerald-600 hover:text-[#00bf71] transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-emerald-50 text-[#00bf71] shadow-sm shadow-emerald-100/30"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile bottom bar */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left leading-tight">
              <p className="text-sm font-bold text-slate-800 line-clamp-1">{user?.name || "User"}</p>
              <p className="text-xs text-slate-400">Personal Plan</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ────────────────── MOBILE HEADER ────────────────── */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3.5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00bf71] flex items-center justify-center text-white font-bold text-md">
            S
          </div>
          <span className="text-md font-extrabold text-slate-800 tracking-tight">Sakuin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerManual}
            className="w-8 h-8 rounded-full bg-[#00bf71] flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onTriggerVoice}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={onTriggerSnap}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ────────────────── MAIN CONTENT CANVAS ────────────────── */}
      <main className="flex-1 w-full overflow-y-auto">
        {children}
      </main>

      {/* ────────────────── MOBILE BOTTOM NAV ────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around py-2 z-30 shadow-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                isActive ? "text-[#00bf71] font-bold scale-105" : "text-slate-400"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] tracking-wide font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
