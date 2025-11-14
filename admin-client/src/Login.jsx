import { useState } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Login failed");
        return;
      }

      if (data.role !== "admin") {
        setMsg("❌ You are not an admin");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setMsg("Server unreachable");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-slate-800 p-6 rounded-lg max-w-sm w-full shadow-xl"
      >
        <h1 className="text-2xl font-bold text-center mb-4 text-green-400">
          Admin Login
        </h1>

        <input
          type="text"
          placeholder="Admin Username"
          className="w-full p-3 bg-slate-700 rounded mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 bg-slate-700 rounded mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-green-600 hover:bg-green-700 p-3 rounded text-black font-bold">
          Login
        </button>

        {msg && <p className="text-red-400 mt-4 text-center">{msg}</p>}
      </form>
    </div>
  );
}
