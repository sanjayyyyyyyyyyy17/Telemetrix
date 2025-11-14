// Role-aware Dashboard.jsx
// Driver: only driver metrics view
// Engineer: only engineer metrics view
// Admin: sees everything

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
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
      if (!raw && raw !== 0) return 0;

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

// ✅ COMPARE DATA BLOCK COMPONENT
function CompareDataBlock({ compareData, date1, date2, role }) {
  if (!compareData) return null;

  const isDriver = role === "driver";
  const isEngineer = role === "engineer";
  const isAdmin = role === "admin";

  // Helper to calculate delta with proper formatting
  const calcDelta = (val1, val2) => {
    const diff = (val2 || 0) - (val1 || 0);
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff}`;
  };

  // Helper to get delta color
  const getDeltaColor = (val1, val2, lowerIsBetter = false) => {
    const diff = (val2 || 0) - (val1 || 0);
    if (diff === 0) return "#9ca3af";
    if (lowerIsBetter) {
      return diff < 0 ? "#22c55e" : "#ef4444";
    }
    return diff > 0 ? "#22c55e" : "#ef4444";
  };

  // Base metrics (visible to all roles)
  const baseMetrics = [
    {
      label: "Avg Speed",
      val1: compareData.date1Data?.avgSpeed || 0,
      val2: compareData.date2Data?.avgSpeed || 0,
      unit: "MPH",
      lowerIsBetter: false,
    },
    {
      label: "Avg RPM",
      val1: compareData.date1Data?.avgRpm || 0,
      val2: compareData.date2Data?.avgRpm || 0,
      unit: "RPM",
      lowerIsBetter: true,
    },
    {
      label: "Avg Temp",
      val1: compareData.date1Data?.avgTemp || 0,
      val2: compareData.date2Data?.avgTemp || 0,
      unit: "°F",
      lowerIsBetter: true,
    },
    {
      label: "Avg Fuel",
      val1: compareData.date1Data?.avgFuel || 0,
      val2: compareData.date2Data?.avgFuel || 0,
      unit: "%",
      lowerIsBetter: false,
    },
  ];

  // Driver-specific metrics
  const driverMetrics = [
    {
      label: "Avg Throttle",
      val1: compareData.date1Data?.avgThrottle || 0,
      val2: compareData.date2Data?.avgThrottle || 0,
      unit: "%",
      lowerIsBetter: false,
    },
    {
      label: "Avg Brake",
      val1: compareData.date1Data?.avgBrakePressure || 0,
      val2: compareData.date2Data?.avgBrakePressure || 0,
      unit: "%",
      lowerIsBetter: true,
    },
    {
      label: "Hard Brakes",
      val1: compareData.date1Data?.hardBrakeEvents || 0,
      val2: compareData.date2Data?.hardBrakeEvents || 0,
      unit: "events",
      lowerIsBetter: true,
    },
    {
      label: "Steering Work",
      val1: compareData.date1Data?.steeringWork || 0,
      val2: compareData.date2Data?.steeringWork || 0,
      unit: "rel",
      lowerIsBetter: true,
    },
    {
      label: "Gear Shifts",
      val1: compareData.date1Data?.gearShifts || 0,
      val2: compareData.date2Data?.gearShifts || 0,
      unit: "per lap",
      lowerIsBetter: true,
    },
    {
      label: "Coast Time",
      val1: compareData.date1Data?.coastTime || 0,
      val2: compareData.date2Data?.coastTime || 0,
      unit: "sec",
      lowerIsBetter: false,
    },
    {
      label: "Max Speed",
      val1: compareData.date1Data?.maxSpeed || 0,
      val2: compareData.date2Data?.maxSpeed || 0,
      unit: "MPH",
      lowerIsBetter: false,
    },
    {
      label: "Δ Best Lap",
      val1: compareData.date1Data?.deltaToBestLap || 0,
      val2: compareData.date2Data?.deltaToBestLap || 0,
      unit: "sec",
      lowerIsBetter: true,
    },
  ];

  // Engineer-specific metrics
  const engineerMetrics = [
    {
      label: "Coolant Temp",
      val1: compareData.date1Data?.coolantTemp || 0,
      val2: compareData.date2Data?.coolantTemp || 0,
      unit: "°C",
      lowerIsBetter: true,
    },
    {
      label: "Oil Temp",
      val1: compareData.date1Data?.oilTemp || 0,
      val2: compareData.date2Data?.oilTemp || 0,
      unit: "°C",
      lowerIsBetter: true,
    },
    {
      label: "Min Battery V",
      val1: compareData.date1Data?.batteryVoltageMin || 0,
      val2: compareData.date2Data?.batteryVoltageMin || 0,
      unit: "V",
      lowerIsBetter: false,
    },
    {
      label: "Fuel Used/Lap",
      val1: compareData.date1Data?.fuelUsedLap || 0,
      val2: compareData.date2Data?.fuelUsedLap || 0,
      unit: "L",
      lowerIsBetter: true,
    },
    {
      label: "Max Lateral G",
      val1: compareData.date1Data?.maxLatG || 0,
      val2: compareData.date2Data?.maxLatG || 0,
      unit: "g",
      lowerIsBetter: false,
    },
    {
      label: "Max Long G",
      val1: compareData.date1Data?.maxLongG || 0,
      val2: compareData.date2Data?.maxLongG || 0,
      unit: "g",
      lowerIsBetter: false,
    },
  ];

  // Determine which metrics to show based on role
  let metricsToShow = [...baseMetrics];
  if (isDriver || isAdmin) {
    metricsToShow = [...metricsToShow, ...driverMetrics];
  }
  if (isEngineer || isAdmin) {
    metricsToShow = [...metricsToShow, ...engineerMetrics];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel p-6 bg-black/30 rounded-lg mt-6 border border-indigo-500/30"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="text-xl font-semibold text-indigo-300">
          📊 Comparison Analysis
        </div>
        <div className="text-sm text-gray-400 mono">
          {compareData.car} • {date1} ↔ {date2}
        </div>
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-4 gap-4 mb-4 pb-3 border-b border-indigo-500/20">
        <div className="text-sm font-semibold text-indigo-200">Metric</div>
        <div className="text-sm font-semibold text-center text-cyan-300">
          {date1}
        </div>
        <div className="text-sm font-semibold text-center text-yellow-300">
          Δ Change
        </div>
        <div className="text-sm font-semibold text-center text-purple-300">
          {date2}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-2">
        {metricsToShow.map((metric, idx) => {
          const delta = calcDelta(metric.val1, metric.val2);
          const deltaColor = getDeltaColor(
            metric.val1,
            metric.val2,
            metric.lowerIsBetter
          );

          return (
            <motion.div
              key={`${metric.label}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="grid grid-cols-4 gap-4 items-center bg-black/20 p-3 rounded hover:bg-black/30 transition-colors"
            >
              {/* Metric Label */}
              <div className="text-sm text-gray-300">{metric.label}</div>

              {/* Date 1 Value */}
              <div className="text-center">
                <div className="mono text-lg font-semibold text-cyan-300">
                  {metric.val1}
                </div>
                <div className="text-xs text-gray-500">{metric.unit}</div>
              </div>

              {/* Delta */}
              <div className="text-center">
                <div
                  className="mono text-lg font-bold"
                  style={{ color: deltaColor }}
                >
                  {delta}
                </div>
                <div className="text-xs text-gray-500">
                  {metric.lowerIsBetter ? "↓ better" : "↑ better"}
                </div>
              </div>

              {/* Date 2 Value */}
              <div className="text-center">
                <div className="mono text-lg font-semibold text-purple-300">
                  {metric.val2}
                </div>
                <div className="text-xs text-gray-500">{metric.unit}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-indigo-500/20">
        <div className="text-xs text-gray-400 text-center">
          {isDriver && "Driver Metrics View"}
          {isEngineer && "Engineer Metrics View"}
          {isAdmin && "Admin View - All Metrics"}
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const loc = useLocation();

  const [welcome, setWelcome] = useState("Telemetry");
  const [date1, setDate1] = useState(
    new URLSearchParams(loc.search).get("date") || todayISO()
  );
  const [date2, setDate2] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("Select date and fetch telemetry");
  const [clock, setClock] = useState(new Date());
  const [compareData, setCompareData] = useState(null);
  const [showCompare, setShowCompare] = useState(false); // <-- ADDED
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [role, setRole] = useState(null); // "driver" | "engineer" | "admin" | null

  const carTheme =
    localStorage.getItem("selectedCar") ||
    localStorage.getItem("carTheme") ||
    "THOR";

  const theme =
    carTheme === "HAYA"
      ? { accent: "#FF2800", bg: "from-red-900 to-red-700" }
      : { accent: "#C0C0C0", bg: "from-[#1C1C1C] to-gray-600" };

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Welcome message
  useEffect(() => {
    (async () => {
      const { ok, data } = await api.welcome();
      if (ok && data?.message) setWelcome(data.message);
    })();
  }, []);

  // Fetch role from /debug/session
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/debug/session", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        const r = data?.user?.role || null;
        setRole(r);
        console.log("🔐 Session role:", r);
      } catch (err) {
        console.error("Role fetch error:", err);
        setRole(null);
      }
    })();
  }, []);

// ... (safeAvg, baseTotals, driverAgg, engineerAgg - no changes here) ...

  // Summary for base things
  const baseTotals = useMemo(
    () => ({
      avgSpeed: safeAvg(rows, "speed"),
      avgRpm: safeAvg(rows, "rpm"),
      avgLapTime: safeAvg(rows, "lapTime"),
      avgTemp: safeAvg(rows, "temperature"),
      avgFuel: safeAvg(rows, "fuelLevel"),
    }),
    [rows]
  );

  // Driver-only + driver-relevant aggregates
  const driverAgg = useMemo(
    () => ({
      avgThrottle: safeAvg(rows, "avgThrottle"),
      avgBrakePressure: safeAvg(rows, "avgBrakePressure"),
      hardBrakeEvents: safeAvg(rows, "hardBrakeEvents"),
      steeringWork: safeAvg(rows, "steeringWork"),
      gearShifts: safeAvg(rows, "gearShifts"),
      coastTime: safeAvg(rows, "coastTime"),
      maxSpeed: safeAvg(rows, "maxSpeed"),
      maxRpm: safeAvg(rows, "maxRpm"),
      sector1Time: safeAvg(rows, "sector1Time"),
      sector2Time: safeAvg(rows, "sector2Time"),
      sector3Time: safeAvg(rows, "sector3Time"),
      deltaToBestLap: safeAvg(rows, "deltaToBestLap"),
    }),
    [rows]
  );

  // Engineer-only + engineer-relevant aggregates
  const engineerAgg = useMemo(
    () => ({
      avgSpeed: baseTotals.avgSpeed,
      avgRpm: baseTotals.avgRpm,
      avgTemp: baseTotals.avgTemp,
      avgFuel: baseTotals.avgFuel,
      coolantTemp: safeAvg(rows, "coolantTemp"),
      oilTemp: safeAvg(rows, "oilTemp"),
      batteryVoltageMin: safeAvg(rows, "batteryVoltageMin"),
      fuelUsedLap: safeAvg(rows, "fuelUsedLap"),
      maxLatG: safeAvg(rows, "maxLatG"),
      maxLongG: safeAvg(rows, "maxLongG"),
    }),
    [rows, baseTotals]
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

    console.log("📦 API Response:", {
      ok,
      status,
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: data?.length,
      meta,
    });

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

    const normalized = data.map((r, index) => {
      const lapTime =
        r.lapTime ?? r.lap_time ?? r.laptime ?? r.lap ?? "0:00";

      const ts = r.timestamp
        ? new Date(r.timestamp).toISOString()
        : new Date(Date.now() + index * 1000).toISOString();

      return {
        ...r,
        _id: r._id || `row-${index}`,
        lapTime,
        timestamp: ts,
        car: r.car || carTheme,
      };
    });

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

      if (!data.date1Data && !data.date2Data) {
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
        setMsg(
          `Report export failed: ${errorData.message || res.statusText}`
        );
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `${carTheme}_${date1}_report.txt`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
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
        setMsg(
          `Comparison export failed: ${
            errorData.message || res.statusText
          }`
        );
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `${carTheme}_${date1}_vs_${date2}_comparison.txt`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
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
    const s = Math.round(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  function AnimatedValue({ value, color }) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={String(value)}
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

  const isDriver = role === "driver";
  const isEngineer = role === "engineer";
  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h1 text-2xl">{welcome}</div>
          <div className="metric-title text-sm opacity-70">
            {carTheme} {role ? `• ${role.toUpperCase()}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="mono text-lg">{clock.toLocaleTimeString()}</div>
          <input
            value={date1}
            onChange={(e) => setDate1(e.target.value)}
            type="date"
            className="p-2 rounded bg-black/20 text-white"
          />

          {/* ---- MODIFIED ---- */}
          {showCompare && (
            <input
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              type="date"
              className="p-2 rounded bg-black/20 text-white"
              placeholder="Compare Date"
            />
          )}

          <button
            onClick={fetchDay}
            disabled={loading}
            className="px-4 py-2 rounded text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: theme.accent }}
          >
            {loading && !compareData ? "Loading..." : "Fetch"}
          </button>

          {/* ---- MODIFIED ---- */}
          {showCompare && (
            <button
              onClick={compareDates}
              disabled={loading || !date2}
              className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
            >
              Compare
            </button>
          )}

          <button
            onClick={exportPDF}
            disabled={loading || rows.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
          >
            Export Report
          </button>

          {/* ---- MODIFIED ---- */}
          {showCompare && (
            <button
              onClick={exportComparisonPDF}
              disabled={loading || !date2 || !compareData}
              className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700"
            >
              Export Compare
            </button>
          )}

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

      {/* ---- MODIFIED ---- */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => setShowCompare(!showCompare)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
        >
          {showCompare ? "Hide" : "Show"} Comparison 📊
        </button>
        <button
          onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm"
        >
          {showAdvancedFeatures ? "Hide" : "Show"} Advanced Analytics 🚀
        </button>
      </div>

      {/* DRIVER VIEW */}
      {(isDriver || isAdmin) && (
        <>
          {/* Driver primary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
            <DataCard as={Link} to={toMetricLink("avgSpeed")}>
              <div className="metric-title">Average Speed</div>
              <AnimatedValue
                value={baseTotals.avgSpeed}
                color={theme.accent}
              />
              <div className="text-xs mt-2">MPH</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("lapTime")}>
              <div className="metric-title">Avg Lap Time</div>
              <AnimatedValue
                value={formatLap(baseTotals.avgLapTime)}
                color={theme.accent}
              />
              <div className="text-xs mt-2">m:ss</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("maxSpeed")}>
              <div className="metric-title">Max Speed (avg)</div>
              <AnimatedValue
                value={driverAgg.maxSpeed || 0}
                color="#22c55e"
              />
              <div className="text-xs mt-2">MPH</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("deltaToBestLap")}>
              <div className="metric-title">Δ to Best Lap</div>
              <AnimatedValue
                value={driverAgg.deltaToBestLap || 0}
                color="#38bdf8"
              />
              <div className="text-xs mt-2">sec</div>
            </DataCard>
          </div>

          {/* Driver control inputs & style */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-4">
            <DataCard as={Link} to={toMetricLink("avgThrottle")}>
              <div className="metric-title">Avg Throttle</div>
              <AnimatedValue
                value={driverAgg.avgThrottle || 0}
                color="#22c55e"
              />
              <div className="text-xs mt-2">%</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("avgBrakePressure")}>
              <div className="metric-title">Avg Brake</div>
              <AnimatedValue
                value={driverAgg.avgBrakePressure || 0}
                color="#ef4444"
              />
              <div className="text-xs mt-2">%</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("hardBrakeEvents")}>
              <div className="metric-title">Hard Brakes</div>
              <AnimatedValue
                value={driverAgg.hardBrakeEvents || 0}
                color="#f97316"
              />
              <div className="text-xs mt-2">events</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("steeringWork")}>
              <div className="metric-title">Steering Work</div>
              <AnimatedValue
                value={driverAgg.steeringWork || 0}
                color="#a855f7"
              />
              <div className="text-xs mt-2">rel</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("gearShifts")}>
              <div className="metric-title">Gear Shifts</div>
              <AnimatedValue
                value={driverAgg.gearShifts || 0}
                color="#eab308"
              />
              <div className="text-xs mt-2">per lap</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("coastTime")}>
              <div className="metric-title">Coast Time</div>
              <AnimatedValue
                value={driverAgg.coastTime || 0}
                color="#0ea5e9"
              />
              <div className="text-xs mt-2">sec</div>
            </DataCard>
          </div>
        </>
      )}

      {/* ENGINEER VIEW */}
      {(isEngineer || isAdmin) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <DataCard as={Link} to={toMetricLink("avgSpeed")}>
              <div className="metric-title">Avg Speed</div>
              <AnimatedValue
                value={engineerAgg.avgSpeed}
                color={theme.accent}
              />
              <div className="text-xs mt-2">MPH</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("avgRpm")}>
              <div className="metric-title">Avg RPM</div>
              <AnimatedValue
                value={engineerAgg.avgRpm}
                color={theme.accent}
              />
              <div className="text-xs mt-2">RPM</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("avgTemp")}>
              <div className="metric-title">Avg Temp</div>
              <AnimatedValue
                value={engineerAgg.avgTemp}
                color={theme.accent}
              />
              <div className="text-xs mt-2">°F</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("avgFuel")}>
              <div className="metric-title">Avg Fuel Level</div>
              <AnimatedValue
                value={engineerAgg.avgFuel}
                color={theme.accent}
              />
              <div className="text-xs mt-2">%</div>
            </DataCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-4">
            <DataCard as={Link} to={toMetricLink("coolantTemp")}>
              <div className="metric-title">Coolant Temp</div>
              <AnimatedValue
                value={engineerAgg.coolantTemp || 0}
                color="#38bdf8"
              />
              <div className="text-xs mt-2">°C</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("oilTemp")}>
              <div className="metric-title">Oil Temp</div>
              <AnimatedValue
                value={engineerAgg.oilTemp || 0}
                color="#f97316"
              />
              <div className="text-xs mt-2">°C</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("batteryVoltageMin")}>
              <div className="metric-title">Min Battery V</div>
              <AnimatedValue
                value={engineerAgg.batteryVoltageMin || 0}
                color="#facc15"
              />
              <div className="text-xs mt-2">V</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("fuelUsedLap")}>
              <div className="metric-title">Fuel Used / Lap</div>
              <AnimatedValue
                value={engineerAgg.fuelUsedLap || 0}
                color="#22c55e"
              />
              <div className="text-xs mt-2">L</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("maxLatG")}>
              <div className="metric-title">Max Lateral G</div>
              <AnimatedValue
                value={engineerAgg.maxLatG || 0}
                color="#a855f7"
              />
              <div className="text-xs mt-2">g</div>
            </DataCard>

            <DataCard as={Link} to={toMetricLink("maxLongG")}>
              <div className="metric-title">Max Longitudinal G</div>
              <AnimatedValue
                value={engineerAgg.maxLongG || 0}
                color="#e11d48"
              />
              <div className="text-xs mt-2">g</div>
            </DataCard>
          </div>
        </>
      )}

      {/* ✅ NEW COMPARE DATA BLOCK - REPLACES OLD ONE */}
      {/* ---- MODIFIED ---- */}
      {showCompare && compareData && (
        <CompareDataBlock 
          compareData={compareData} 
          date1={date1} 
          date2={date2} 
          role={role} 
        />
      )}

      {showAdvancedFeatures && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <AIInsights date={date1} car={carTheme} />
            <GamificationWidget date={date1} car={carTheme} />
          </div>
          <VisualizationPlayground data={rows} />
        </motion.div>
      )}

      <div className="panel p-4 mt-6">
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
                  <th className="p-2">Speed</th>
                  <th className="p-2">RPM</th>
                  <th className="p-2">Lap Time</th>

                  {/* Driver table columns */}
                  {(isDriver || isAdmin) && (
                    <>
                      <th className="p-2">Throttle (%)</th>
                      <th className="p-2">Brake (%)</th>
                      <th className="p-2">Gear Shifts</th>
                    </>
                  )}

                  {/* Engineer table columns */}
                  {(isEngineer || isAdmin) && (
                    <>
                      <th className="p-2">Coolant Temp</th>
                      <th className="p-2">Oil Temp</th>
                      <th className="p-2">Fuel Level</th>
                      <th className="p-2">Battery V (min)</th>
                      <th className="p-2">Lat G</th>
                      <th className="p-2">Long G</th>
                    </>
                  )}
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
                    <td className="p-2 mono font-semibold">
                      {r.speed ?? 0}
                    </td>
                    <td className="p-2 mono font-semibold">{r.rpm ?? 0}</td>
                    <td className="p-2 mono">{r.lapTime || "N/A"}</td>

                    {(isDriver || isAdmin) && (
                      <>
                        <td className="p-2 mono">
                          {r.avgThrottle ?? "-"}
                        </td>
                        <td className="p-2 mono">
                          {r.avgBrakePressure ?? "-"}
                        </td>
                        <td className="p-2 mono">
                          {r.gearShifts ?? "-"}
                        </td>
                      </>
                    )}

                    {(isEngineer || isAdmin) && (
                      <>
                        <td className="p-2 mono">
                          {r.coolantTemp ?? r.temperature ?? "-"}
                        </td>
                        <td className="p-2 mono">
                          {r.oilTemp ?? "-"}
                        </td>
                        <td className="p-2 mono">
                          {r.fuelLevel ?? "-"}
                        </td>
                        <td className="p-2 mono">
                          {r.batteryVoltageMin ?? "-"}
                        </td>
                        <td className="p-2 mono">
                          {r.maxLatG ?? "-"}
                        </td>
                        <td className="p-2 mono">
                          {r.maxLongG ?? "-"}
                        </td>
                      </>
                    )}
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