import React, { useState, useEffect } from "react";
import { apiRequest } from "./utils/api";
import WelcomeOnboarding from "./components/WelcomeOnboarding";
import SignIn from "./components/SignIn";
import DashboardLayout from "./components/DashboardLayout";
import HomeTab from "./components/HomeTab";
import AnalyticsTab from "./components/AnalyticsTab";
import PortfolioTab from "./components/PortfolioTab";
import ProfileTab from "./components/ProfileTab";
import SakuVoice from "./components/SakuVoice";
import SakuSnap from "./components/SakuSnap";
import TransactionForms from "./components/TransactionForms";

const getTabFromPath = (path) => {
  const cleanPath = path.toLowerCase().replace(/^\/+/, "");
  if (cleanPath === "analytics") return "analytics";
  if (cleanPath === "portfolio") return "portfolio";
  if (cleanPath === "profile") return "profile";
  return "home";
};

export default function App() {
  // Auth navigation states: 'onboarding' | 'signin' | 'authenticated'
  const [authState, setAuthState] = useState("authenticated");
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(window.location.pathname));
  const [isBalanceShow, setIsBalanceShow] = useState(true);

  // Core Data States
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal overlays
  const [showVoice, setShowVoice] = useState(false);
  const [showSnap, setShowSnap] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Routing sync
  useEffect(() => {
    const currentTab = getTabFromPath(window.location.pathname);
    // If the path is "/" or empty, replace it with "/home" to keep it clean and synced
    if (window.location.pathname === "/" || window.location.pathname === "") {
      window.history.replaceState(null, "", "/home");
    }

    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (window.location.pathname !== "/" + tabId) {
      window.history.pushState(null, "", "/" + tabId);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch all user dashboard data
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const handleAuthFail = () => {
        console.warn("Auth token rejected by API, falling back to local simulation data.");
      };

      const [userRes, walletsRes, txRes, catRes, goalsRes] = await Promise.all([
        apiRequest("/auth/profile", { onAuthFailure: handleAuthFail }),
        apiRequest("/wallets", { onAuthFailure: handleAuthFail }),
        apiRequest("/transaction", { onAuthFailure: handleAuthFail }),
        apiRequest("/categories", { onAuthFailure: handleAuthFail }),
        apiRequest("/goals", { onAuthFailure: handleAuthFail })
      ]);

      if (userRes?.data) setUser(userRes.data);
      if (walletsRes?.data) setWallets(walletsRes.data);
      if (txRes?.data) {
        // Sort transactions by date descending
        const sorted = [...txRes.data].sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(sorted);
      }
      if (catRes?.data) setCategories(catRes.data);
      if (goalsRes?.data) setGoals(goalsRes.data);
    } catch (err) {
      console.error("Error loading user dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = () => {
    localStorage.setItem("sakuin_onboarding_seen", "true");
    setAuthState("signin");
  };

  const handleLogin = () => {
    setAuthState("authenticated");
    fetchUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    setAuthState("signin");
    setUser(null);
    setWallets([]);
    setTransactions([]);
    setCategories([]);
    setGoals([]);
  };

  const handleUpdateProfile = async (profileData) => {
    // Optimistic profile update
    setUser(prev => ({ ...prev, ...profileData }));
    
    // Attempt saving to BE (will fallback to localStorage under sakuin-be simulator/offline handlers)
    try {
      await apiRequest("/auth/profile", {
        method: "PUT",
        body: profileData
      });
    } catch (err) {
      console.warn("Failed to sync profile changes with remote API.", err);
    }
  };

  // ─── WALLET ACTIONS ───
  const handleAddWallet = async (walletData) => {
    try {
      const res = await apiRequest("/wallets", {
        method: "POST",
        body: walletData
      });
      if (res?.data) {
        setWallets(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error("Failed to add wallet:", err);
    }
  };

  const handleDeleteWallet = async (walletId) => {
    try {
      await apiRequest(`/wallets/${walletId}`, {
        method: "DELETE"
      });
      setWallets(prev => prev.filter(w => w._id !== walletId && w.id !== walletId));
      // Re-fetch transactions because deleted wallet transaction history was updated
      fetchUserData();
    } catch (err) {
      console.error("Failed to delete wallet:", err);
    }
  };

  // ─── GOAL ACTIONS ───
  const handleAddGoal = async (goalData) => {
    try {
      const res = await apiRequest("/goals", {
        method: "POST",
        body: goalData
      });
      if (res?.data) {
        setGoals(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await apiRequest(`/goals/${goalId}`, {
        method: "DELETE"
      });
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  // ─── CATEGORY ACTIONS ───
  const handleAddCategory = async (catData) => {
    try {
      const res = await apiRequest("/categories", {
        method: "POST",
        body: catData
      });
      if (res?.data) {
        setCategories(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      await apiRequest(`/categories/${catId}`, {
        method: "DELETE"
      });
      setCategories(prev => prev.filter(c => c._id !== catId && c.id !== catId));
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  // ─── TRANSACTION SUBMISSION ───
  const handleSubmitTransaction = async (txData) => {
    try {
      const res = await apiRequest("/transaction", {
        method: "POST",
        body: txData
      });
      if (res?.data) {
        // Prepend new transaction
        setTransactions(prev => [res.data, ...prev]);

        // Adjust local wallet balance immediately for seamless UX
        setWallets(prevWallets =>
          prevWallets.map(w => {
            if (w._id === txData.wallet_id || w.id === txData.wallet_id) {
              const currentBal = Number(w.balance);
              const amt = Number(txData.amount);
              return {
                ...w,
                balance: txData.type === "income" ? currentBal + amt : currentBal - amt
              };
            }
            return w;
          })
        );
      }
    } catch (err) {
      console.error("Failed to submit transaction:", err);
    }
  };

  // ─── DUMMY DATA SEEDER ───
  const handleSeedData = async () => {
    if (wallets.length === 0 || categories.length === 0) {
      alert("Silakan buat dompet dan kategori terlebih dahulu sebelum melakukan seeding!");
      return;
    }

    const defaultWalletId = wallets[0]._id || wallets[0].id;
    
    // Find food & investment category id if available
    const foodCat = categories.find(c => c.name.toLowerCase().includes("makan") || c.name.toLowerCase().includes("minum")) || categories[0];
    const shopCat = categories.find(c => c.name.toLowerCase().includes("belanja")) || categories[0];
    const entCat = categories.find(c => c.name.toLowerCase().includes("hibur") || c.name.toLowerCase().includes("nonton")) || categories[0];
    const billCat = categories.find(c => c.name.toLowerCase().includes("tagih")) || categories[0];
    const invCat = categories.find(c => c.name.toLowerCase().includes("invest") || c.name.toLowerCase().includes("gaji")) || categories[0];

    const seedItems = [
      // Mei Transactions (Total expense: 9.05 jt, Income: 10 jt)
      { name: "Gaji Utama Mei", amount: 10000000, type: "income", date: "2026-05-01", category_id: invCat._id || invCat.id, wallet_id: defaultWalletId, description: "Gaji bulanan korporat", input_method: "manual" },
      { name: "Beli Laptop Asus", amount: 7500000, type: "expense", date: "2026-05-04", category_id: shopCat._id || shopCat.id, wallet_id: defaultWalletId, description: "Upgrade laptop kerja", input_method: "manual" },
      { name: "Belanja Bulanan Supermarket", amount: 1200000, type: "expense", date: "2026-05-10", category_id: foodCat._id || foodCat.id, wallet_id: defaultWalletId, description: "Stok bahan makanan bulanan", input_method: "manual" },
      { name: "Nonton Bioskop & Snack", amount: 350000, type: "expense", date: "2026-05-15", category_id: entCat._id || entCat.id, wallet_id: defaultWalletId, description: "Cinema XXI weekend", input_method: "manual" },
      
      // April Transactions (Total expense: 4.3 jt, Income: 8 jt)
      { name: "Gaji Freelance April", amount: 8000000, type: "income", date: "2026-04-05", category_id: invCat._id || invCat.id, wallet_id: defaultWalletId, description: "Proyek sampingan web app", input_method: "manual" },
      { name: "Sewa Kost April", amount: 2000000, type: "expense", date: "2026-04-08", category_id: billCat._id || billCat.id, wallet_id: defaultWalletId, description: "Pembayaran kost bulanan", input_method: "manual" },
      { name: "Makan Bersama Keluarga", amount: 1500000, type: "expense", date: "2026-04-18", category_id: foodCat._id || foodCat.id, wallet_id: defaultWalletId, description: "Ulang tahun ibu", input_method: "manual" },
      { name: "Beli Baju Kemeja", amount: 800000, type: "expense", date: "2026-04-22", category_id: shopCat._id || shopCat.id, wallet_id: defaultWalletId, description: "Pakaian kerja baru", input_method: "manual" }
    ];

    setLoading(true);
    try {
      // Loop seed inputs
      for (const item of seedItems) {
        await apiRequest("/transaction", {
          method: "POST",
          body: item
        });
      }
      // Re-fetch dashboard states to update everything
      await fetchUserData();
      alert("⚡ Dummy transaksi Mei dan April berhasil dimasukkan untuk visualisasi grafik!");
    } catch (err) {
      console.error("Gagal melakukan seeder data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading Splash Screen
  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md animate-bounce">
          S
        </div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase animate-pulse">
          Memuat Sakuin Platform...
        </p>
      </div>
    );
  }

  // 1. Onboarding Screen
  if (authState === "onboarding") {
    return <WelcomeOnboarding onFinish={handleFinishOnboarding} />;
  }

  // 2. Login Screen
  if (authState === "signin") {
    return <SignIn onLogin={handleLogin} />;
  }

  // 3. Authenticated Dashboard Content
  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      user={user}
      onLogout={handleLogout}
      onTriggerVoice={() => setShowVoice(true)}
      onTriggerSnap={() => setShowSnap(true)}
      onTriggerManual={() => setShowManual(true)}
    >
      {/* Dynamic Tab Mounting */}
      {activeTab === "home" && (
        <HomeTab
          user={user}
          wallets={wallets}
          transactions={transactions}
          categories={categories}
          goals={goals}
          loading={loading}
          isBalanceShow={isBalanceShow}
          setIsBalanceShow={setIsBalanceShow}
          onSeedData={handleSeedData}
          onNavigateToTab={handleTabChange}
          onAddTransactionClick={() => setShowManual(true)}
        />
      )}

      {activeTab === "analytics" && (
        <AnalyticsTab
          transactions={transactions}
          categories={categories}
          wallets={wallets}
        />
      )}

      {activeTab === "portfolio" && (
        <PortfolioTab
          wallets={wallets}
          goals={goals}
          transactions={transactions}
          onAddWallet={handleAddWallet}
          onDeleteWallet={handleDeleteWallet}
          onAddGoal={handleAddGoal}
          onDeleteGoal={handleDeleteGoal}
          isBalanceShow={isBalanceShow}
          setIsBalanceShow={setIsBalanceShow}
        />
      )}

      {activeTab === "profile" && (
        <ProfileTab
          user={user}
          onUpdateProfile={handleUpdateProfile}
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onLogout={handleLogout}
        />
      )}

      {/* OVERLAY MODALS */}
      {showVoice && (
        <SakuVoice
          wallets={wallets}
          categories={categories}
          onSubmitTransaction={handleSubmitTransaction}
          onClose={() => setShowVoice(false)}
        />
      )}

      {showSnap && (
        <SakuSnap
          wallets={wallets}
          categories={categories}
          onSubmitTransaction={handleSubmitTransaction}
          onClose={() => setShowSnap(false)}
        />
      )}

      {showManual && (
        <TransactionForms
          wallets={wallets}
          categories={categories}
          onSubmitTransaction={handleSubmitTransaction}
          onClose={() => setShowManual(false)}
        />
      )}
    </DashboardLayout>
  );
}
