// ✅ CORRECT FRONTEND Dashboard.jsx
// This goes in: client/src/pages/Dashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import DataCard from "../components/DataCard";
import AIInsights from "../components/AIInsights";
import GamificationWidget from "../components/GamificationWidget";
import VisualizationPlayground from "../components/VisualizationPlayground";
import { motion, AnimatePresence } from "framer-motion";

function todayISO() {
  const t = new Date();
  const off = t.getTimezoneOffset();
  const local = new Date(t.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

function safeAvg(arr, key) {
  const vals = arr
    .map((r) => {
      const raw = r[key];
      if (!raw) return 0;
      if (key === "lapTime" && typeof raw === "string") {
        const parts = raw.split(":");
        if (parts.length === 2) {
          const m = parseFloat(parts[0]);
          const s = parseFloat(parts[1]);
          if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
        }
        return 0;
      }
      return Number(raw) || 0;
    })
    .filter((v) => v > 0);
  return vals.length
    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    : 0;
}

export default function Dashboard() {
  const nav = useNavigate();
  const [welcome, setWelcome] = useState("Telemetry");
  const [date1, setDate1] = useState(todayISO());
  const [date2, setDate2] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("Select date and fetch telemetry");
  const [clock, setClock] = useState(new Date());
  const [compareData, setCompareData] = useState(null);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

  const carTheme = localStorage.getItem("selectedCar") || localStorage.getItem("carTheme") || "THOR";
  const theme =
    carTheme === "HAYA"
      ? { accent: "#FF2800", bg: "from-red-900 to-red-700" }
      : { accent: "#C0C0C0", bg: "from-[#1C1C1C] to-gray-600" };

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      const { ok, data } = await api.welcome();
      if (ok && data?.message) setWelcome(data.message);
    })();
  }, []);

  const totals = useMemo(
    () => ({
      avgSpeed: safeAvg(rows, "speed"),
      avgRpm: safeAvg(rows, "rpm"),
      avgLapTime: safeAvg(rows, "lapTime"),
      avgTemp: safeAvg(rows, "temperature"),
      avgFuel: safeAvg(rows, "fuelLevel"),
    }),
    [rows]
  );

  async function fetchDay() {
    if (!date1) {
      setMsg("Pick a date");
      return;
    }
    
    setLoading(true);
    setMsg("Fetching…");
    setRows([]);
    
    console.log("🔍 Fetching data for:", { date: date1, car: carTheme });
    
    const { ok, status, data, meta } = await api.day(date1);
    
    console.log("📦 API Response:", { ok, status, dataType: typeof data, isArray: Array.isArray(data), length: data?.length });
    
    setLoading(false);
    
    if (status === 401) {
      setMsg("❌ Session expired - redirecting to login");
      setTimeout(() => nav("/"), 1000);
      return;
    }
    
    if (status === 400) {
      setMsg("⚠️ Please select a car first");
      setRows([]);
      return;
    }
    
    if (!ok) {
      const errorMsg = data?.message || "Failed to fetch data";
      setMsg(`❌ ${errorMsg}`);
      setRows([]);
      return;
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      setMsg(`ℹ️ No data available for ${date1}`);
      setRows([]);
      return;
    }

    const normalized = data.map((r, index) => ({
      _id: r._id || `temp-${index}`,
      speed: r.speed || 0,
      rpm: r.rpm || 0,
      temperature: r.temperature || 0,
      fuelLevel: r.fuelLevel || 0,
      lapTime: r.lapTime ?? r.lap_time ?? r.laptime ?? r.lap ?? "0:00",
      timestamp: r.timestamp || new Date().toISOString(),
      date: r.date,
      car: r.car || carTheme,
    }));
    
    console.log("✅ Normalized data sample:", normalized[0]);
    console.log("📊 Total records:", normalized.length);
    
    setRows(normalized);
    setMsg(`✅ ${normalized.length} entries loaded for ${carTheme}`);
  }

  async function compareDates() {
    if (!date1 || !date2) {
      setMsg("Select both dates to compare");
      return;
    }
    
    setLoading(true);
    setMsg("Comparing dates...");
    
    try {
      const res = await fetch(
        `http://localhost:3000/api/analytics/${carTheme}/${date1}/${date2}`,
        { credentials: "include" }
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setMsg(`Comparison failed: ${errorData.message || res.statusText}`);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      if (!data.avgSpeed && !data.date1Data) {
        setMsg("⚠️ No data found for selected dates");
        setCompareData(null);
        setLoading(false);
        return;
      }
      
      setCompareData(data);
      setMsg("✅ Comparison complete");
    } catch (err) {
      console.error("Comparison error:", err);
      setMsg("❌ Comparison error: " + err.message);
      setCompareData(null);
    } finally {
      setLoading(false);
    }
  }

  async function exportPDF() {
    if (!date1) {
      setMsg("Select a date first");
      return;
    }

    setLoading(true);
    setMsg("Generating report...");
    
    try {
      const res = await fetch(
        `http://localhost:3000/api/reports/${carTheme}/${date1}`,
        { method: "GET", credentials: "include" }
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setMsg(`Report export failed: ${errorData.message || res.statusText}`);
        setLoading(false);
        return;
      }
      
      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `${carTheme}_${date1}_report.txt`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setMsg("✅ Report exported successfully");
    } catch (err) {
      setMsg("⚠️ Failed to export report: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function exportComparisonPDF() {
    if (!date1 || !date2) {
      setMsg("Select two dates for export");
      return;
    }
    
    setLoading(true);
    setMsg("Generating comparison report...");
    
    try {
      const res = await fetch(
        `http://localhost:3000/api/reports-compare/${carTheme}/${date1}/${date2}`,
        { method: "GET", credentials: "include" }
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setMsg(`Comparison export failed: ${errorData.message || res.statusText}`);
        setLoading(false);
        return;
      }
      
      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `${carTheme}_${date1}_vs_${date2}_comparison.txt`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setMsg("✅ Comparison report exported successfully");
    } catch (err) {
      setMsg("⚠️ Export comparison failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function toMetricLink(metric) {
    const params = new URLSearchParams({ date: date1 });
    return `/dashboard/${metric}?${params.toString()}`;
  }

  function formatLap(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function AnimatedValue({ value, color }) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="metric-value mono"
          style={{ color }}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h1 text-2xl">{welcome}</div>
          <div className="metric-title text-sm opacity-70">{carTheme}</div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="mono text-lg">{clock.toLocaleTimeString()}</div>
          <input
            value={date1}
            onChange={(e) => setDate1(e.target.value)}
            type="date"
            className="p-2 rounded bg-black/20 text-white"
          />
          <input
            value={date2}
            onChange={(e) => setDate2(e.target.value)}
            type="date"
            className="p-2 rounded bg-black/20 text-white"
            placeholder="Compare Date"
          />
          <button
            onClick={fetchDay}
            disabled={loading}
            className="px-4 py-2 rounded text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: theme.accent }}
          >
            {loading && !compareData ? "Loading..." : "Fetch"}
          </button>
          <button
            onClick={compareDates}
            disabled={loading || !date2}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
          >
            Compare
          </button>
          <button
            onClick={exportPDF}
            disabled={loading || rows.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
          >
            Export PDF
          </button>
          <button
            onClick={exportComparisonPDF}
            disabled={loading || !date2 || !compareData}
            className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700"
          >
            Export Compare
          </button>
          <button
            onClick={async () => {
              await api.logout();
              window.location.href = "/";
            }}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm"
        >
          {showAdvancedFeatures ? "Hide" : "Show"} Advanced Analytics 🚀
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <DataCard as={Link} to={toMetricLink("speed")}>
          <div className="metric-title">Average Speed</div>
          <AnimatedValue value={totals.avgSpeed} color={theme.accent} />
          <div className="text-xs mt-2">MPH</div>
        </DataCard>

        <DataCard as={Link} to={toMetricLink("rpm")}>
          <div className="metric-title">Average RPM</div>
          <AnimatedValue value={totals.avgRpm} color={theme.accent} />
          <div className="text-xs mt-2">RPM</div>
        </DataCard>

        <DataCard as={Link} to={toMetricLink("lapTime")}>
          <div className="metric-title">Lap Time (avg)</div>
          <AnimatedValue
            value={formatLap(totals.avgLapTime)}
            color={theme.accent}
          />
          <div className="text-xs mt-2">m:ss</div>
        </DataCard>

        <DataCard as={Link} to={toMetricLink("temperature")}>
          <div className="metric-title">Temperature</div>
          <AnimatedValue value={totals.avgTemp} color={theme.accent} />
          <div className="text-xs mt-2">°F</div>
        </DataCard>

        <DataCard as={Link} to={toMetricLink("fuelLevel")}>
          <div className="metric-title">Fuel Level</div>
          <AnimatedValue value={totals.avgFuel} color={theme.accent} />
          <div className="text-xs mt-2">%</div>
        </DataCard>
      </div>

      {compareData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel p-6 bg-black/30 rounded-lg mt-4 border border-indigo-500/30"
        >
          <div className="text-lg font-semibold mb-4 text-indigo-300">
            📊 Comparison Results ({date1} ↔ {date2})
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-black/20 p-3 rounded">
              <div className="text-gray-400 text-xs mb-1">Avg Speed</div>
              <div className="text-white font-mono">{compareData.avgSpeed}</div>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <div className="text-gray-400 text-xs mb-1">Avg RPM</div>
              <div className="text-white font-mono">{compareData.avgRPM}</div>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <div className="text-gray-400 text-xs mb-1">Temperature</div>
              <div className="text-white font-mono">{compareData.avgTemp}</div>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <div className="text-gray-400 text-xs mb-1">Fuel Level</div>
              <div className="text-white font-mono">{compareData.avgFuel}</div>
            </div>
          </div>
        </motion.div>
      )}

      {showAdvancedFeatures && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights date={date1} car={carTheme} />
            <GamificationWidget date={date1} car={carTheme} />
          </div>
          <VisualizationPlayground data={rows} />
        </motion.div>
      )}

      <div className="panel p-4">
        <div className="text-sm text-gray-300 mb-3 flex justify-between items-center">
          <span>{msg}</span>
          {rows.length > 0 && (
            <span className="text-xs bg-indigo-600 px-2 py-1 rounded">
              {rows.length} records
            </span>
          )}
        </div>
        
        {rows.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Loading…</span>
              </div>
            ) : (
              <div>
                <div className="text-lg mb-2">📊 No data to display</div>
                <div className="text-sm opacity-70">
                  Select a date and click "Fetch" to load telemetry data
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-indigo-300 border-b border-indigo-500/30">
                  <th className="p-2">Time</th>
                  <th className="p-2">Speed (MPH)</th>
                  <th className="p-2">RPM</th>
                  <th className="p-2">Lap Time</th>
                  <th className="p-2">Temp (°F)</th>
                  <th className="p-2">Fuel (%)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <motion.tr
                    key={r._id || `row-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="border-t border-white/10 hover:bg-[#071827] transition-colors"
                  >
                    <td className="p-2 mono text-gray-300">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-2 mono font-semibold">{r.speed || 0}</td>
                    <td className="p-2 mono font-semibold">{r.rpm || 0}</td>
                    <td className="p-2 mono">{r.lapTime || "N/A"}</td>
                    <td className="p-2 mono font-semibold">{r.temperature || 0}</td>
                    <td className="p-2 mono font-semibold">{r.fuelLevel || 0}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}