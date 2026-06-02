import React, { useState, useEffect } from "react";
import { apiRequest, registerAuthFailureHandler } from "./utils/api";
import WelcomeOnboarding from "./components/WelcomeOnboarding";
import SignIn from "./components/SignIn";
import DashboardLayout from "./components/DashboardLayout";
import HomeTab from "./components/HomeTab";
import AnalyticsTab from "./components/AnalyticsTab";
import PortfolioTab from "./components/PortfolioTab";
import ProfileTab from "./components/ProfileTab";
import AllTransactionsTab from "./components/AllTransactionsTab";
import WalletDetail from "./components/WalletDetail";
import GoalDetail from "./components/GoalDetail";
import SakuVoice from "./components/SakuVoice";
import SakuSnap from "./components/SakuSnap";
import TransactionForms from "./components/TransactionForms";

const getTabFromPath = (path) => {
  const cleanPath = path.toLowerCase().replace(/^\/+/, "");
  if (cleanPath.startsWith("wallet/")) return "wallet-detail";
  if (cleanPath.startsWith("goal/")) return "goal-detail";
  if (cleanPath === "analytics") return "analytics";
  if (cleanPath === "portfolio") return "portfolio";
  if (cleanPath === "profile") return "profile";
  if (cleanPath === "transactions") return "transactions";
  return "home";
};

const getWalletIdFromPath = (path) => {
  const cleanPath = path.replace(/^\/+/, "");
  if (cleanPath.startsWith("wallet/")) {
    return cleanPath.split("/")[1];
  }
  return null;
};

const getGoalIdFromPath = (path) => {
  const cleanPath = path.replace(/^\/+/, "");
  if (cleanPath.startsWith("goal/")) {
    return cleanPath.split("/")[1];
  }
  return null;
};

export default function App() {
  // Auth navigation states: 'onboarding' | 'signin' | 'authenticated' | 'loading'
  const [authState, setAuthState] = useState("loading");
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(window.location.pathname));
  const [activeWalletId, setActiveWalletId] = useState(() => getWalletIdFromPath(window.location.pathname));
  const [activeGoalId, setActiveGoalId] = useState(() => getGoalIdFromPath(window.location.pathname));
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
  const [manualFormInitialWalletId, setManualFormInitialWalletId] = useState(null);
  const [manualFormInitialType, setManualFormInitialType] = useState(null);

  // Routing sync
  useEffect(() => {
    const currentTab = getTabFromPath(window.location.pathname);
    // If the path is "/" or empty, replace it with "/home" to keep it clean and synced
    if (window.location.pathname === "/" || window.location.pathname === "") {
      window.history.replaceState(null, "", "/home");
    }

    const handlePopState = () => {
      const path = window.location.pathname;
      setActiveTab(getTabFromPath(path));
      setActiveWalletId(getWalletIdFromPath(path));
      setActiveGoalId(getGoalIdFromPath(path));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setActiveWalletId(null);
    setActiveGoalId(null);
    if (window.location.pathname !== "/" + tabId) {
      window.history.pushState(null, "", "/" + tabId);
    }
  };

  const handleNavigateToWallet = (walletId) => {
    setActiveTab("wallet-detail");
    setActiveWalletId(walletId);
    if (window.location.pathname !== "/wallet/" + walletId) {
      window.history.pushState(null, "", "/wallet/" + walletId);
    }
  };

  const handleNavigateToGoal = (goalId) => {
    setActiveTab("goal-detail");
    setActiveGoalId(goalId);
    if (window.location.pathname !== "/goal/" + goalId) {
      window.history.pushState(null, "", "/goal/" + goalId);
    }
  };

  const handleTriggerManual = (walletId = null, formType = "manual") => {
    setManualFormInitialWalletId(walletId);
    setManualFormInitialType(formType);
    setShowManual(true);
  };

  const handleAuthFail = () => {
    console.warn("Auth token rejected by API. Redirecting to login.");
    localStorage.removeItem("user_token");
    setAuthState("signin");
    setUser(null);
    setWallets([]);
    setTransactions([]);
    setCategories([]);
    setGoals([]);
  };

  // Register the global auth failure handler
  useEffect(() => {
    registerAuthFailureHandler(handleAuthFail);
  }, []);

  // Auth state verification on mount
  useEffect(() => {
    async function verifyAuth() {
      // 1. Intercept Token from redirection URL query parameters
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("token");
      
      let token = tokenFromUrl;
      if (tokenFromUrl) {
        localStorage.setItem("user_token", tokenFromUrl);
        // Scrub query parameter from the browser URL to keep it clean
        params.delete("token");
        const newSearch = params.toString();
        const cleanUrl = window.location.origin + window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState(null, "", cleanUrl);
      } else {
        token = localStorage.getItem("user_token");
      }

      // 2. Check if onboarding seen
      const onboardingSeen = localStorage.getItem("sakuin_onboarding_seen") === "true";
      if (!onboardingSeen) {
        setAuthState("onboarding");
        return;
      }

      // 3. Check if token exists, otherwise show signin
      if (!token) {
        setAuthState("signin");
        return;
      }

      // 4. Token exists, verify token & load dashboard data
      try {
        const success = await fetchUserData();
        if (success) {
          setAuthState("authenticated");
        } else {
          setAuthState("signin");
        }
      } catch (err) {
        console.error("Authentication setup error:", err);
        setAuthState("signin");
      }
    }

    verifyAuth();
  }, []);

  // Fetch all user dashboard data
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [userRes, walletsRes, txRes, catRes, goalsRes, goalHistoryRes] = await Promise.all([
        apiRequest("/auth/profile"),
        apiRequest("/wallets"),
        apiRequest("/transaction"),
        apiRequest("/categories"),
        apiRequest("/goals"),
        apiRequest("/goal-history").catch(err => {
          console.warn("Failed to fetch goal history:", err);
          return { data: [] };
        })
      ]);

      if (userRes?.data) setUser(userRes.data);
      if (walletsRes?.data) setWallets(walletsRes.data);
      if (txRes?.data) {
        // Sort transactions by date descending
        const sorted = [...txRes.data].sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(sorted);
      }
      if (catRes?.data) setCategories(catRes.data);

      if (goalsRes?.data) {
        let histories = [];
        if (goalHistoryRes) {
          if (Array.isArray(goalHistoryRes)) {
            histories = goalHistoryRes;
          } else if (Array.isArray(goalHistoryRes.data)) {
            histories = goalHistoryRes.data;
          } else if (goalHistoryRes.status === "success" && Array.isArray(goalHistoryRes.data)) {
            histories = goalHistoryRes.data;
          } else if (goalHistoryRes.data && Array.isArray(goalHistoryRes.data.transactions)) {
            histories = goalHistoryRes.data.transactions;
          } else if (Array.isArray(goalHistoryRes.transactions)) {
            histories = goalHistoryRes.transactions;
          }
        }

        const cleanHistories = Array.isArray(histories) ? histories.filter(Boolean) : [];

        const processedGoals = goalsRes.data.map(goal => {
          const goalHistories = cleanHistories.filter(item => {
            const itemGoalId = (item && item.goal_id && typeof item.goal_id === 'object')
              ? (item.goal_id._id || item.goal_id.id)
              : (item && item.goal_id);
            return itemGoalId === goal.id || itemGoalId === goal._id;
          });

          const calculatedCurrent = goalHistories.reduce((sum, item) => {
            const amt = item ? (Number(item.amount) || 0) : 0;
            return item && item.type === "withdraw" ? sum - amt : sum + amt;
          }, 0);

          return {
            ...goal,
            current: calculatedCurrent,
            transactions: goalHistories.map(item => ({
              _id: item._id || item.id,
              id: item.id || item._id,
              name: item.type === "withdraw" ? "Penarikan Dana" : "Tabungan Masuk",
              amount: item.amount,
              type: item.type === "withdraw" ? "expense" : "income",
              date: item.date,
              category_id: "cat_5"
            }))
          };
        });

        setGoals(processedGoals);
      }
      return true;
    } catch (err) {
      console.error("Error loading user dashboard details:", err);
      return false;
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
      await fetchUserData();
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await apiRequest(`/goals/${goalId}`, {
        method: "DELETE"
      });
      await fetchUserData();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleUpdateGoal = async (goalId, goalData) => {
    try {
      const res = await apiRequest(`/goals/${goalId}`, {
        method: "PUT",
        body: goalData
      });
      await fetchUserData();
    } catch (err) {
      console.error("Failed to update goal:", err);
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
      await apiRequest("/transaction", {
        method: "POST",
        body: txData
      });
      await fetchUserData();
    } catch (err) {
      console.error("Failed to submit transaction:", err);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    try {
      await apiRequest(`/transaction/${txId}`, {
        method: "DELETE"
      });
      setTransactions(prev => prev.filter(t => t._id !== txId && t.id !== txId));
      fetchUserData();
    } catch (err) {
      console.error("Failed to delete transaction:", err);
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
        <img
          src="/logo.png"
          alt="Sakuin Logo"
          className="w-12 h-12 object-contain shadow-md rounded-xl animate-bounce"
        />
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
      onTriggerManual={() => handleTriggerManual(null, "manual")}
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
          onNavigateToTab={handleTabChange}
          onNavigateToWallet={handleNavigateToWallet}
          onNavigateToGoal={handleNavigateToGoal}
          onAddTransactionClick={() => handleTriggerManual(null, "manual")}
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
          onUpdateGoal={handleUpdateGoal}
          isBalanceShow={isBalanceShow}
          setIsBalanceShow={setIsBalanceShow}
          onNavigateToWallet={handleNavigateToWallet}
          onNavigateToGoal={handleNavigateToGoal}
        />
      )}

      {activeTab === "transactions" && (
        <AllTransactionsTab
          transactions={transactions}
          wallets={wallets}
          categories={categories}
          onDeleteTransaction={handleDeleteTransaction}
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

      {activeTab === "wallet-detail" && (
        <WalletDetail
          walletId={activeWalletId}
          wallets={wallets}
          transactions={transactions}
          categories={categories}
          onDeleteWallet={handleDeleteWallet}
          onBack={() => handleTabChange("portfolio")}
          onTriggerManual={handleTriggerManual}
          isBalanceShow={isBalanceShow}
          setIsBalanceShow={setIsBalanceShow}
          onRefreshData={fetchUserData}
        />
      )}

      {activeTab === "goal-detail" && (
        <GoalDetail
          goalId={activeGoalId}
          wallets={wallets}
          transactions={transactions}
          categories={categories}
          onDeleteGoal={handleDeleteGoal}
          onBack={() => handleTabChange("portfolio")}
          isBalanceShow={isBalanceShow}
          onRefreshData={fetchUserData}
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
          onRefreshData={fetchUserData}
          onClose={() => setShowSnap(false)}
        />
      )}

      {showManual && (
        <TransactionForms
          wallets={wallets}
          categories={categories}
          goals={goals}
          onSubmitTransaction={handleSubmitTransaction}
          onRefreshData={fetchUserData}
          onClose={() => {
            setShowManual(false);
            setManualFormInitialWalletId(null);
            setManualFormInitialType(null);
          }}
          initialWalletId={manualFormInitialWalletId}
          initialFormType={manualFormInitialType}
        />
      )}
    </DashboardLayout>
  );
}
