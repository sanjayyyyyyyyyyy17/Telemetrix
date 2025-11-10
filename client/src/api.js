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
      console.log("Sending car selection request:", { car, pin });
      const res = await fetch(`${BASE_URL}/api/selectCar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ car, pin }),
      });
      const data = await res.json().catch(() => ({}));
      console.log("Car selection response:", { ok: res.ok, status: res.status, data });
      return { ok: res.ok, status: res.status, data };
    } catch (error) {
      console.error("Car selection error:", error);
      return { ok: false, status: 500, data: { message: "Network error" } };
    }
  },

  // FETCH DASHBOARD DATA
  day: async (date) => {
    try {
      console.log("Fetching data for date:", date);
      const res = await fetch(`${BASE_URL}/api/dashboard/${date}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      console.log("Dashboard data response:", { ok: res.ok, status: res.status, dataLength: Array.isArray(data) ? data.length : 0 });
      return { ok: res.ok, status: res.status, data };
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      return { ok: false, status: 500, data: { message: "Network error" } };
    }
  },
};