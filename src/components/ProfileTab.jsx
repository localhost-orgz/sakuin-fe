import React, { useState, useEffect } from "react";
import { User, Mail, Link, Plus, Trash2, ShieldAlert, LogOut, Check, ArrowRight, GitFork, Code, Sparkles, X } from "lucide-react";
import { getWalletThemeIds, getWalletTheme } from "../hooks/useWalletTheme";

export default function ProfileTab({
  user,
  onUpdateProfile,
  categories = [],
  onAddCategory,
  onDeleteCategory,
  onLogout
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "Sakuin User");
  const [email, setEmail] = useState(user?.email || "user@sakuin.com");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  useEffect(() => {
    if (user) {
      setName(user.name || "Sakuin User");
      setEmail(user.email || "user@sakuin.com");
      setAvatar(user.avatar || user.avatar_url || "");
    }
  }, [user]);

  // Category Form State
  const [showAddCat, setShowAddCat] = useState(false);
  const [catName, setCatName] = useState("");
  const [catEmoticon, setCatEmoticon] = useState("🏷️");
  const [catThemeId, setCatThemeId] = useState("indigo");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar melebihi batas 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile({ name, email, avatar, avatar_url: avatar });
    setIsEditing(false);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onAddCategory({
      name: catName.trim(),
      emoticon: catEmoticon,
      themeId: catThemeId
    });
    setCatName("");
    setCatEmoticon("🏷️");
    setCatThemeId("indigo");
    setShowAddCat(false);
  };

  const emojiOptions = [
    "🍔", "🚗", "🛍️", "🎬", "📈", "📄", "💰", "☕", "🍿", "✈️", "🏠", "🎁", "💊", "🎮", "🐾", "📚", "💡", "💇", "🛠️", "🛒", "🏷️"
  ];

  return (
    <div className="animate-fade-in text-left bg-[#f5f6fa] min-h-screen pb-16">
      {/* ─── GREEN PINNED GREETING HEADER ─── */}
      <div className="bg-[#00bf71] text-white pt-10 pb-28 px-6 md:px-12 relative overflow-hidden">
        {/* Subtle decorative top blobs */}
        <div className="absolute w-64 h-64 bg-white/5 rounded-full -top-32 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -bottom-48 -right-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Settings & Profile</h1>
            <p className="text-sm text-white/85 mt-1 font-medium">
              Manage your personal profile, categories, and review workspace info
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-md">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative -mt-20 space-y-6">
        {/* ─── PROFILE SETTINGS CARD ─── */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100/50 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 text-[#00bf71]" /> User Account Profile
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="border-2 border-[#00bf71] hover:bg-[#00bf71] hover:text-white text-[#00bf71] font-extrabold px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  setName(user?.name || "Sakuin User");
                  setEmail(user?.email || "user@sakuin.com");
                  setAvatar(user?.avatar || user?.avatar_url || "");
                  setIsEditing(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-extrabold px-3 py-1.5 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <img
                src={user?.avatar || user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt="Avatar preview"
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                }}
              />
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <h4 className="text-xl font-extrabold text-slate-800">{user?.name || "Sakuin User"}</h4>
                  <p className="text-xs text-slate-400 font-bold flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-[#00bf71]" /> {user?.email || "user@sakuin.com"}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#00bf71] text-[10px] font-extrabold border border-emerald-100">
                  <Sparkles className="w-3 h-3" /> Premium Plan
                </div>
              </div>
              <button
                onClick={onLogout}
                className="bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-600 font-extrabold px-5 py-2.5 rounded-full text-xs flex items-center justify-center gap-2 transition-all cursor-pointer self-center shadow-sm"
              >
                <LogOut className="w-4 h-4" /> Log Out Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar upload/preview row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-2 text-slate-700">
                <div className="relative group w-24 h-24 shrink-0">
                  <img
                    src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                    alt="Profile Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md transition-all group-hover:brightness-90"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                    }}
                  />
                  {/* Invisible file input triggered by hover layer */}
                  <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[9px] font-bold uppercase tracking-wider text-center px-2">
                    Ubah Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="text-left space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-700">Foto Profil</h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-bold">
                    Pilih file gambar JPEG atau PNG dari perangkat Anda. Ukuran maks 2MB.
                  </p>
                  {/* Upload button wrapper */}
                  <label className="mt-2.5 inline-flex items-center justify-center px-4 py-2 border-2 border-slate-200 hover:border-[#00bf71] bg-white rounded-full text-[10px] font-extrabold text-slate-500 hover:text-[#00bf71] cursor-pointer transition-all active:scale-[0.98]">
                    Pilih File Gambar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block text-left pl-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block text-left pl-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 border-2 border-slate-200 hover:bg-slate-50 rounded-full text-xs font-extrabold text-slate-500 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-extrabold px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ─── DYNAMIC CATEGORIES MANAGEMENT CARD ─── */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100/50 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Code className="w-4 h-4 text-[#00bf71]" /> Transaction Categories
            </h3>
            {!showAddCat ? (
              <button
                onClick={() => setShowAddCat(true)}
                className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-extrabold px-4 py-2 rounded-full transition-all cursor-pointer shadow-md"
              >
                + Add Category
              </button>
            ) : (
              <button
                onClick={() => setShowAddCat(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold px-3 py-1.5 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Add Category Form Panel */}
          {showAddCat && (
            <form onSubmit={handleCategorySubmit} className="bg-slate-50 border-2 border-slate-100 p-5 rounded-3xl space-y-5 animate-slide-down">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block text-left pl-1">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Health, Books, Salary..."
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-slate-700 font-semibold transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block text-left pl-1">Emoji</label>
                  <select
                    value={catEmoticon}
                    onChange={(e) => setCatEmoticon(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-3 py-3 text-xs focus:outline-none focus:border-[#00bf71] text-center text-slate-700 font-semibold cursor-pointer transition-all appearance-none"
                  >
                    {emojiOptions.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block text-left pl-1">Color Theme</label>
                <div className="grid grid-cols-6 gap-2.5">
                  {getWalletThemeIds().map((tid) => {
                    const themeObj = getWalletTheme(tid);
                    const isSelected = catThemeId === tid;
                    return (
                      <button
                        type="button"
                        key={tid}
                        onClick={() => setCatThemeId(tid)}
                        style={{ backgroundColor: themeObj.accentColor }}
                        className="h-10 rounded-2xl flex items-center justify-center text-white relative shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-5 py-2.5 border-2 border-slate-200 hover:bg-white rounded-full text-xs font-extrabold text-slate-500 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00bf71] hover:bg-[#00a862] text-white text-xs font-extrabold px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-md"
                >
                  Add Category
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const theme = getWalletTheme(cat.themeId || cat.color || cat.theme_id || "ocean");
              return (
                <div
                  key={cat._id || cat.id}
                  className="border-2 border-slate-50 rounded-2xl bg-white p-4 flex items-center justify-between hover:border-slate-100 transition-all duration-200 relative overflow-hidden group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: theme.iconBgColor }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                    >
                      {cat.emoticon || "🏷️"}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-700 leading-snug">{cat.name}</h5>
                      <span
                        style={{ color: theme.textColor }}
                        className="text-[9px] font-extrabold uppercase tracking-widest block mt-0.5"
                      >
                        {theme.label} theme
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteCategory(cat._id || cat.id)}
                    title="Delete Category"
                    className="p-2 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── ABOUT / DEV CREDITS CARD ─── */}
        <div className="bg-gradient-to-tr from-emerald-50/50 to-white rounded-3xl p-6 shadow-lg border border-slate-100/50 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#00bf71] flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              S
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-800">About Sakuin Workspace</h4>
              <p className="text-[9px] text-[#00bf71] font-extrabold uppercase tracking-widest">Version 2.0 • Web Remake</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Sakuin Web is a clean, modern financial application inspired by the **Sakuin mobile app (built in React Native)**. 
            It is designed to give you a gorgeous, intuitive dashboard workspace interface to document, track, and review your finances.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/80 border-2 border-slate-50 rounded-2xl p-4">
              <span className="text-[9px] text-[#00bf71] font-extrabold uppercase tracking-widest block pl-0.5">Technology Stack</span>
              <p className="text-xs text-slate-700 font-extrabold mt-1">
                React 19 + Vite 8 • Tailwind CSS v4 • Lucide Icons
              </p>
            </div>
            <div className="bg-white/80 border-2 border-slate-50 rounded-2xl p-4">
              <span className="text-[9px] text-[#00bf71] font-extrabold uppercase tracking-widest block pl-0.5">Data & Storage Sync</span>
              <p className="text-xs text-slate-700 font-extrabold mt-1">
                API Backend Vercel Endpoint + LocalStorage fallback
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-slate-400 font-extrabold block uppercase tracking-widest text-[9px]">Developed by</span>
              <span className="font-extrabold text-slate-700">PJBL Kelompok Semester 4</span>
            </div>
            
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white border-2 border-slate-100 text-slate-600 font-extrabold py-2 px-4 rounded-full text-xs hover:border-[#00bf71] hover:text-[#00bf71] transition-all cursor-pointer shadow-sm"
            >
              <GitFork className="w-4 h-4" /> View Repository
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
