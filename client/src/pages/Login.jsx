import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [signup, setSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("driver"); // NEW: requested department

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const endpoint = signup ? "/signup" : "/login";

    try {
      const payload = signup
        ? { username, password, role } // include role on signup
        : { username, password };

      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        return setMsg(data?.message || "Request failed");
      }

      if (signup) {
        setMsg("✅ Account created! Awaiting admin approval.");
        setSignup(false);
        setUsername("");
        setPassword("");
        setRole("driver");
      } else {
        setMsg("✅ Login successful!");
        setTimeout(() => nav("/select-car"), 700);
      }
    } catch {
      setMsg("⚠️ Server not reachable");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6">
      <div className="panel p-10 rounded-xl bg-black/50 shadow-lg max-w-md w-full">
        <h1 className="text-center text-3xl font-bold text-[#00BFFF] mb-3">
          {signup ? "SIGN UP" : "RACE CONTROL"}
        </h1>
        <p className="text-center text-gray-400 mb-6">
          {signup
            ? "Register to access telemetry (admin approval required)"
            : "Sign in to access telemetry"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-3 rounded bg-black/30 border border-gray-700 focus:ring-2 focus:ring-[#00BFFF]"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 rounded bg-black/30 border border-gray-700 focus:ring-2 focus:ring-[#00BFFF]"
            required
          />

          {signup && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 rounded bg-black/30 border border-gray-700 focus:ring-2 focus:ring-[#00BFFF]"
            >
              <option value="driver">Driver</option>
              <option value="engineer">Engineer</option>
            </select>
          )}

          <button className="w-full py-3 bg-[#00BFFF] hover:bg-[#00AEEF] text-black font-semibold rounded transition">
            {loading ? "Please wait..." : signup ? "Sign Up" : "Login"}
          </button>
        </form>

        {msg && (
          <p className="text-center text-sm text-gray-300 mt-4">{msg}</p>
        )}

        <div className="mt-5 text-center text-sm text-gray-400">
          {signup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            className="text-[#00BFFF] hover:underline"
            onClick={() => setSignup(!signup)}
          >
            {signup ? "Login" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
