const BASE_URL = "https://sakuin-be.vercel.app";

// Helper for formatting/generating random IDs
const uuid = () => Math.random().toString(36).substr(2, 9);

// Default mock datasets for fallback
const DEFAULT_CATEGORIES = [
  { _id: "cat_1", id: "cat_1", name: "Makanan & Minuman", emoticon: "🍔", themeId: "ember" },
  { _id: "cat_2", id: "cat_2", name: "Transportasi", emoticon: "🚗", themeId: "indigo" },
  { _id: "cat_3", id: "cat_3", name: "Belanja", emoticon: "🛍️", themeId: "violet" },
  { _id: "cat_4", id: "cat_4", name: "Hiburan", emoticon: "🎬", themeId: "rose" },
  { _id: "cat_5", id: "cat_5", name: "Investasi", emoticon: "📈", themeId: "forest" },
  { _id: "cat_6", id: "cat_6", name: "Tagihan", emoticon: "📄", themeId: "ocean" },
];

const DEFAULT_WALLETS = [
  { _id: "w_1", id: "w_1", name: "Dompet Utama", balance: 2500000, themeId: "forest", currency: "IDR" },
  { _id: "w_2", id: "w_2", name: "Bank Jago", balance: 7800000, themeId: "ocean", currency: "IDR" },
  { _id: "w_3", id: "w_3", name: "E-Wallet Gopay", balance: 450000, themeId: "ember", currency: "IDR" }
];

const DEFAULT_GOALS = [
  { id: "g_1", name: "Macbook Pro", icon: "💻", current: 8500000, target: 25000000, themeId: "indigo" },
  { id: "g_2", name: "Bali Trip", icon: "🏖️", current: 3200000, target: 5000000, themeId: "ember" },
  { id: "g_3", name: "Emergency Fund", icon: "🛡️", current: 12000000, target: 12000000, themeId: "forest" }
];

const DEFAULT_TRANSACTIONS = [
  { _id: "tx_1", id: "tx_1", name: "Salary Payment", amount: 5000000, type: "income", description: "Monthly corporate salary payout", date: "2026-05-01", category_id: "cat_5", wallet_id: "w_2" },
  { _id: "tx_2", id: "tx_2", name: "Rent & Housing", amount: 3500000, type: "expense", description: "Apartment rental cost", date: "2026-05-03", category_id: "cat_6", wallet_id: "w_2" },
  { _id: "tx_3", id: "tx_3", name: "Freelance Project", amount: 4000000, type: "income", description: "Web app development milestone", date: "2026-05-10", category_id: "cat_5", wallet_id: "w_1" },
  { _id: "tx_4", id: "tx_4", name: "Groceries & Supplies", amount: 1500000, type: "expense", description: "Monthly supermarket groceries", date: "2026-05-15", category_id: "cat_1", wallet_id: "w_1" },
  { _id: "tx_5", id: "tx_5", name: "Weekend Dinner", amount: 1000000, type: "expense", description: "Fine dining restaurant bill", date: "2026-05-22", category_id: "cat_1", wallet_id: "w_3" }
];

// Initialize localStorage databases if not present
const getLocalData = (key, defaults) => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaults;
  }
};

const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

let globalAuthFailureHandler = null;

export function registerAuthFailureHandler(handler) {
  globalAuthFailureHandler = handler;
}

export async function apiRequest(endpoint, {
  method = "GET",
  query = {},
  body = null,
  headers: customHeaders = {},
  isFormData = false,
  onAuthFailure = null
} = {}) {

  const queryString = Object.keys(query).length ? "?" + new URLSearchParams(query).toString() : "";
  const url = `${BASE_URL}${endpoint}${queryString}`;
  const token = localStorage.getItem("user_token");

  if (token === "mock_token_sakuin_web_2026" || endpoint.startsWith("/goals")) {
    return handleOfflineFallback(endpoint, method, body);
  }

  const headers = isFormData
    ? { ...customHeaders }
    : { "Content-Type": "application/json", ...customHeaders };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, options);
  } catch (fetchErr) {
    console.warn(`API ${method} ${endpoint} network failed. Using offline localStorage fallback.`, fetchErr);
    return handleOfflineFallback(endpoint, method, body);
  }

  let data;
  try {
    data = await res.json();
  } catch (jsonErr) {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("user_token");
      if (onAuthFailure) onAuthFailure();
      if (globalAuthFailureHandler) globalAuthFailureHandler();
    }
    throw new Error(data.message || "Request failed");
  }

  return data;
}

// Local Storage Offline Fallback Handler
function handleOfflineFallback(endpoint, method, body) {
  const categories = getLocalData("sakuin_categories", DEFAULT_CATEGORIES);
  const wallets = getLocalData("sakuin_wallets", DEFAULT_WALLETS);
  const transactions = getLocalData("sakuin_transactions", DEFAULT_TRANSACTIONS);
  const goals = getLocalData("sakuin_goals", DEFAULT_GOALS);

  // 1. Wallets Endpoint
  if (endpoint.startsWith("/wallets")) {
    const idParam = endpoint.replace("/wallets", "").replace("/", "");

    if (method === "GET") {
      if (idParam) {
        const wallet = wallets.find(w => w._id === idParam || w.id === idParam);
        return { status: "success", data: wallet };
      }
      return { status: "success", data: wallets };
    }

    if (method === "POST" && body) {
      const newWallet = {
        _id: uuid(),
        id: uuid(),
        name: body.name,
        balance: Number(body.balance) || 0,
        themeId: body.themeId || "ocean",
        currency: body.currency || "IDR",
        description: body.description || ""
      };
      wallets.push(newWallet);
      setLocalData("sakuin_wallets", wallets);
      return { status: "success", data: newWallet };
    }

    if (method === "DELETE" && idParam) {
      const updated = wallets.filter(w => w._id !== idParam && w.id !== idParam);
      setLocalData("sakuin_wallets", updated);
      return { status: "success", message: "Wallet deleted successfully" };
    }

    if (method === "PUT" && idParam && body) {
      const updated = wallets.map(w => {
        if (w._id === idParam || w.id === idParam) {
          return { ...w, ...body };
        }
        return w;
      });
      setLocalData("sakuin_wallets", updated);
      return { status: "success", data: updated.find(w => w.id === idParam || w._id === idParam) };
    }
  }

  // 2. Categories Endpoint
  if (endpoint.startsWith("/categories")) {
    const idParam = endpoint.replace("/categories", "").replace("/", "");

    if (method === "GET") {
      return { status: "success", data: categories };
    }

    if (method === "POST" && body) {
      const newCat = {
        _id: uuid(),
        id: uuid(),
        name: body.name,
        emoticon: body.emoticon || "🏷️",
        themeId: body.themeId || "indigo"
      };
      categories.push(newCat);
      setLocalData("sakuin_categories", categories);
      return { status: "success", data: newCat };
    }

    if (method === "DELETE" && idParam) {
      const updated = categories.filter(c => c._id !== idParam && c.id !== idParam);
      setLocalData("sakuin_categories", updated);
      return { status: "success", message: "Category deleted" };
    }
  }

  // 3. Transactions Endpoint
  if (endpoint.startsWith("/transaction")) {
    const idParam = endpoint.replace("/transaction", "").replace("/", "");

    if (method === "GET") {
      if (idParam) {
        const tx = transactions.find(t => t._id === idParam || t.id === idParam);
        return { status: "success", data: tx };
      }
      return { status: "success", data: transactions };
    }

    if (method === "POST" && body) {
      const newTx = {
        _id: uuid(),
        id: uuid(),
        name: body.name,
        amount: Number(body.amount) || 0,
        type: body.type || "expense",
        description: body.description || "",
        date: body.date || new Date().toISOString().split("T")[0],
        category_id: body.category_id,
        wallet_id: body.wallet_id,
        target_wallet_id: body.target_wallet_id || null,
        input_method: body.input_method || "manual"
      };
      transactions.unshift(newTx);
      setLocalData("sakuin_transactions", transactions);

      // Adjust wallet balance
      const updatedWallets = wallets.map(w => {
        const walletId = w._id || w.id;
        const bal = Number(w.balance);
        const amt = Number(body.amount);

        if (body.type === "transfer") {
          if (walletId === body.wallet_id) {
            return { ...w, balance: bal - amt };
          }
          if (walletId === body.target_wallet_id) {
            return { ...w, balance: bal + amt };
          }
        } else {
          if (walletId === body.wallet_id) {
            return {
              ...w,
              balance: body.type === "income" ? bal + amt : bal - amt
            };
          }
        }
        return w;
      });
      setLocalData("sakuin_wallets", updatedWallets);

      return { status: "success", data: newTx };
    }

    if (method === "DELETE" && idParam) {
      const tx = transactions.find(t => t._id === idParam || t.id === idParam);
      if (tx) {
        // Reverse balance adjustment
        const updatedWallets = wallets.map(w => {
          const walletId = w._id || w.id;
          const bal = Number(w.balance);
          const amt = Number(tx.amount);

          if (tx.type === "transfer") {
            if (walletId === tx.wallet_id) {
              return { ...w, balance: bal + amt };
            }
            if (walletId === tx.target_wallet_id) {
              return { ...w, balance: bal - amt };
            }
          } else {
            if (walletId === tx.wallet_id) {
              return {
                ...w,
                balance: tx.type === "income" ? bal - amt : bal + amt
              };
            }
          }
          return w;
        });
        setLocalData("sakuin_wallets", updatedWallets);
      }
      const updated = transactions.filter(t => t._id !== idParam && t.id !== idParam);
      setLocalData("sakuin_transactions", updated);
      return { status: "success", message: "Transaction deleted" };
    }

    if (method === "PUT" && idParam && body) {
      const updated = transactions.map(t => {
        if (t._id === idParam || t.id === idParam) {
          return { ...t, ...body };
        }
        return t;
      });
      setLocalData("sakuin_transactions", updated);
      return { status: "success", data: updated.find(t => t.id === idParam || t._id === idParam) };
    }
  }

  // 4. Auth Endpoint Fallbacks
  if (endpoint.startsWith("/auth/profile")) {
    return {
      status: "success",
      data: {
        id: "usr_mock",
        name: "Sakuin User",
        email: "user@sakuin.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
      }
    };
  }

  // 5. Custom Goals handler (not supported in BE but persisted locally for sakuin-web)
  if (endpoint.startsWith("/goals")) {
    const idParam = endpoint.replace("/goals", "").replace("/", "");

    if (method === "GET") {
      return { status: "success", data: goals };
    }

    if (method === "POST" && body) {
      const newGoal = {
        id: uuid(),
        name: body.name,
        icon: body.icon || "🎯",
        current: Number(body.current) || 0,
        target: Number(body.target) || 100000,
        themeId: body.themeId || "ocean"
      };
      goals.push(newGoal);
      setLocalData("sakuin_goals", goals);
      return { status: "success", data: newGoal };
    }

    if (method === "DELETE" && idParam) {
      const updated = goals.filter(g => g.id !== idParam);
      setLocalData("sakuin_goals", updated);
      return { status: "success", message: "Goal deleted" };
    }

    if (method === "PUT" && idParam && body) {
      const updated = goals.map(g => {
        if (g.id === idParam) {
          return { ...g, ...body };
        }
        return g;
      });
      setLocalData("sakuin_goals", updated);
      return { status: "success", data: updated.find(g => g.id === idParam) };
    }
  }

  // Fallback default response
  return { status: "success", data: [] };
}
