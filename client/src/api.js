// Updated api.js with improved error handling and data processing

const BASE_URL = "http://localhost:3000";

export const api = {
  // WELCOME/CHECK AUTH
  welcome: async () => {
    try {
      const res = await fetch(`${BASE_URL}/debug/session`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      return { 
        ok: res.ok, 
        data: { 
          message: data.user?.username ? `Welcome, ${data.user.username}` : "Telemetry Dashboard" 
        } 
      };
    } catch (error) {
      console.error("Welcome error:", error);
      return { ok: false, data: { message: "Telemetry Dashboard" } };
    }
  },

  // LOGIN
  login: async (username, password) => {
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      console.log("Login response:", { ok: res.ok, status: res.status, data });
      return { ok: res.ok, status: res.status, data };
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, status: 500, data: { message: "Network error" } };
    }
  },

  // SIGNUP
  signup: async (username, password) => {
    try {
      const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (error) {
      console.error("Signup error:", error);
      return { ok: false, status: 500, data: { message: "Network error" } };
    }
  },

  // LOGOUT
  logout: async () => {
    try {
      const res = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch (error) {
      console.error("Logout error:", error);
      return { ok: false, data: { message: "Network error" } };
    }
  },

  // SELECT CAR
  selectCar: async (car, pin) => {
    try {
      console.log("🚗 Sending car selection:", { car, pin });
      const res = await fetch(`${BASE_URL}/api/selectCar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ car, pin }),
      });
      const data = await res.json().catch(() => ({}));
      console.log("✅ Car selection response:", { ok: res.ok, status: res.status, data });
      return { ok: res.ok, status: res.status, data };
    } catch (error) {
      console.error("❌ Car selection error:", error);
      return { ok: false, status: 500, data: { message: "Network error" } };
    }
  },

  // FETCH DASHBOARD DATA (FIXED)
  day: async (date) => {
    try {
      console.log("📅 Fetching dashboard data for date:", date);
      const res = await fetch(`${BASE_URL}/api/dashboard/${date}`, {
        credentials: "include",
      });
      
      // Get raw response text first for debugging
      const text = await res.text();
      console.log("📦 Raw response:", text.substring(0, 200));
      
      // Parse JSON
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.error("❌ JSON parse error:", e);
        return { ok: false, status: 500, data: [] };
      }
      
      console.log("🔍 Parsed response structure:", {
        hasData: !!parsed.data,
        hasMeta: !!parsed.meta,
        isArray: Array.isArray(parsed),
        isDataArray: Array.isArray(parsed.data),
        keys: Object.keys(parsed)
      });
      
      // Handle new response format with meta wrapper
      if (parsed.data && Array.isArray(parsed.data)) {
        console.log("✅ Found data array:", parsed.data.length, "records");
        return { 
          ok: res.ok, 
          status: res.status, 
          data: parsed.data, 
          meta: parsed.meta 
        };
      }
      
      // Handle direct array response (backward compatibility)
      if (Array.isArray(parsed)) {
        console.log("✅ Found direct array:", parsed.length, "records");
        return { 
          ok: res.ok, 
          status: res.status, 
          data: parsed 
        };
      }
      
      // Handle error response
      if (parsed.message) {
        console.log("⚠️ Server returned message:", parsed.message);
        return { 
          ok: res.ok, 
          status: res.status, 
          data: parsed 
        };
      }
      
      // Unknown format
      console.warn("⚠️ Unexpected response format:", parsed);
      return { 
        ok: res.ok, 
        status: res.status, 
        data: [] 
      };
      
    } catch (error) {
      console.error("❌ Dashboard fetch error:", error);
      return { ok: false, status: 500, data: [] };
    }
  },

  // GET AI INSIGHTS
  getInsights: async (date) => {
    try {
      console.log("🧠 Fetching insights for:", date);
      const res = await fetch(`${BASE_URL}/api/insights/${date}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      console.log("✅ Insights response:", { ok: res.ok, insightsCount: data.insights?.length });
      return { ok: res.ok, data };
    } catch (error) {
      console.error("❌ Insights error:", error);
      return { ok: false, data: { insights: [] } };
    }
  },

  // GET GAMIFICATION DATA
  getGamification: async (date) => {
    try {
      console.log("🏆 Fetching gamification for:", date);
      const res = await fetch(`${BASE_URL}/api/gamification/${date}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      console.log("✅ Gamification response:", { ok: res.ok, points: data.points, rank: data.rank });
      return { ok: res.ok, data };
    } catch (error) {
      console.error("❌ Gamification error:", error);
      return { ok: false, data: null };
    }
  },
};