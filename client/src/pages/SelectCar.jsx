import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function SelectCar() {
  const nav = useNavigate();
  const [car, setCar] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    console.log("🚗 Attempting car selection:", car);
    
    const { ok, status, data } = await api.selectCar(car, pin);
    setLoading(false);

    console.log("Response:", { ok, status, data });

    if (ok) {
      localStorage.setItem("selectedCar", car);
      setMsg("Access granted! Redirecting...");
      setTimeout(() => nav("/dashboard"), 500);
    } else {
      // Better error handling
      if (status === 401) {
        setMsg("Please login first");
        setTimeout(() => nav("/login"), 2000);
      } else if (status === 403) {
        setMsg("Invalid PIN - Please try again");
      } else if (status === 400) {
        setMsg("Invalid car selected");
      } else {
        setMsg(data?.message || "Error selecting car");
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      <div className="p-10 rounded-xl bg-gray-800 shadow-2xl w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Select Your Car</h1>
        <form onSubmit={submit} className="space-y-5">
          <select
            className="w-full p-3 bg-gray-700 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={car}
            onChange={(e) => setCar(e.target.value)}
            required
          >
            <option value="">Choose Car</option>
            <option value="THOR">THOR</option>
            <option value="HAYA">HAYA</option>
            <option value="ODIN">ODIN</option>
          </select>

          <input
            placeholder="Enter PIN"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            required
            maxLength={4}
          />

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded text-white font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Enter Pit Lane"}
          </button>

          {msg && (
            <p className={`text-center text-sm ${msg.includes("granted") ? "text-green-400" : "text-red-400"}`}>
              {msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}