import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import DataCard from "../components/DataCard";
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
    const { ok, status, data } = await api.day(date1);
    setLoading(false);
    if (status === 401) {
      nav("/");
      return;
    }
    if (!ok || !Array.isArray(data) || data.length === 0) {
      setMsg("No data available for this date");
      setRows([]);
      return;
    }

    const normalized = data.map((r, index) => ({
      ...r,
      lapTime: r.lapTime ?? r.lap_time ?? r.laptime ?? r.lap,
      timestamp: r.timestamp ?? new Date().toISOString(),
    }));
    setRows(normalized);
    setMsg(`${normalized.length} entries loaded`);
  }

  // ✅ FIXED: Compare dates function
  async function compareDates() {
    if (!date1 || !date2) {
      setMsg("Select both dates to compare");
      return;
    }
    
    setLoading(true);
    setMsg("Comparing dates...");
    
    try {
      console.log("Comparing:", { car: carTheme, date1, date2 });
      const res = await fetch(
        `http://localhost:3000/api/analytics/${carTheme}/${date1}/${date2}`,
        { credentials: "include" }
      );
      
      console.log("Compare response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Compare error:", errorData);
        setMsg(`Comparison failed: ${errorData.message || res.statusText}`);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log("Compare data received:", data);
      
      // ✅ FIX: Validate that we actually got data
      if (!data.avgSpeed || !data.avgRPM) {
        console.warn("Received empty comparison data:", data);
        setMsg("⚠️ No data found for selected dates");
        setCompareData(null);
        setLoading(false);
        return;
      }
      
      setCompareData(data);
      setMsg("Comparison complete ✅");
    } catch (err) {
      console.error("Comparison error:", err);
      setMsg("Comparison error: " + err.message);
      setCompareData(null);
    } finally {
      setLoading(false);
    }
  }

  // ✅ FIXED: Export PDF function with proper download handling
  async function exportPDF() {
    if (!date1) {
      setMsg("Select a date first");
      return;
    }

    setLoading(true);
    setMsg("Generating report...");
    
    try {
      console.log("Exporting report for:", { car: carTheme, date: date1 });
      const res = await fetch(
        `http://localhost:3000/api/reports/${carTheme}/${date1}`,
        { 
          method: "GET", 
          credentials: "include" 
        }
      );
      
      console.log("Report response status:", res.status);
      console.log("Response headers:", {
        contentType: res.headers.get('content-type'),
        contentDisposition: res.headers.get('content-disposition')
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Report error:", errorData);
        setMsg(`Report export failed: ${errorData.message || res.statusText}`);
        setLoading(false);
        return;
      }
      
      // ✅ FIX: Proper blob handling for text files
      const blob = await res.blob();
      console.log("Blob created:", { size: blob.size, type: blob.type });
      
      // ✅ FIX: Use Content-Disposition filename from backend
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `${carTheme}_${date1}_report.txt`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // ✅ FIX: Create download link properly
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      // ✅ FIX: Cleanup after download
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log("✅ Report downloaded:", filename);
      setMsg("✅ Report exported successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      setMsg("⚠️ Failed to export report: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ FIXED: Export comparison PDF function
  async function exportComparisonPDF() {
    if (!date1 || !date2) {
      setMsg("Select two dates for export");
      return;
    }
    
    setLoading(true);
    setMsg("Generating comparison report...");
    
    try {
      console.log("Exporting comparison report:", { car: carTheme, date1, date2 });
      const res = await fetch(
        `http://localhost:3000/api/reports-compare/${carTheme}/${date1}/${date2}`,
        { 
          method: "GET", 
          credentials: "include" 
        }
      );
      
      console.log("Comparison report response status:", res.status);
      console.log("Response headers:", {
        contentType: res.headers.get('content-type'),
        contentDisposition: res.headers.get('content-disposition')
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Comparison report error:", errorData);
        setMsg(`Comparison export failed: ${errorData.message || res.statusText}`);
        setLoading(false);
        return;
      }
      
      // ✅ FIX: Proper blob handling
      const blob = await res.blob();
      console.log("Comparison blob created:", { size: blob.size, type: blob.type });
      
      // ✅ FIX: Extract filename from headers
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `${carTheme}_${date1}_vs_${date2}_comparison.txt`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // ✅ FIX: Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      // ✅ FIX: Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log("✅ Comparison report downloaded:", filename);
      setMsg("✅ Comparison report exported successfully");
    } catch (err) {
      console.error("Comparison export error:", err);
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
    if (!seconds) return 0;
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

        <div className="flex items-center gap-3">
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

      <div className="panel p-4">
        <div className="text-sm text-gray-300 mb-3">{msg}</div>
        {rows.length === 0 ? (
          <div className="text-gray-400">
            {loading ? "Loading…" : "No data for selected date."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-indigo-300">
                  <th className="p-2">Time</th>
                  <th className="p-2">Speed</th>
                  <th className="p-2">RPM</th>
                  <th className="p-2">Lap</th>
                  <th className="p-2">Temp</th>
                  <th className="p-2">Fuel</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <motion.tr
                    key={r._id || r.timestamp || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-white/10 hover:bg-[#071827]"
                  >
                    <td className="p-2 mono">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-2 mono">{r.speed}</td>
                    <td className="p-2 mono">{r.rpm}</td>
                    <td className="p-2 mono">{r.lapTime}</td>
                    <td className="p-2 mono">{r.temperature}</td>
                    <td className="p-2 mono">{r.fuelLevel}</td>
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