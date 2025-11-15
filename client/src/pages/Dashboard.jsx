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
    if (diff === 0) return "#64748b";
    if (lowerIsBetter) {
      return diff < 0 ? "#10b981" : "#ef4444";
    }
    return diff > 0 ? "#10b981" : "#ef4444";
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
      className="p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl mt-8 border-2 border-blue-300 shadow-2xl"
      style={{
        boxShadow: "0 0 40px rgba(59, 130, 246, 0.3), 0 20px 60px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          📊 Comparison Analysis
        </div>
        <div className="text-sm font-semibold text-slate-600 mono bg-white/80 px-4 py-2 rounded-lg border border-blue-200">
          {compareData.car} • {date1} ↔ {date2}
        </div>
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-4 gap-6 mb-6 pb-4 border-b-2 border-blue-200">
        <div className="text-sm font-bold text-slate-700 uppercase tracking-wider">Metric</div>
        <div className="text-sm font-bold text-center text-blue-600 uppercase tracking-wider">
          {date1}
        </div>
        <div className="text-sm font-bold text-center text-cyan-600 uppercase tracking-wider">
          Δ Change
        </div>
        <div className="text-sm font-bold text-center text-purple-600 uppercase tracking-wider">
          {date2}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-3">
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
              className="grid grid-cols-4 gap-6 items-center bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200 hover:bg-white/80 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
              style={{
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Metric Label */}
              <div className="text-sm font-semibold text-slate-700">{metric.label}</div>

              {/* Date 1 Value */}
              <div className="text-center">
                <div className="mono text-xl font-bold text-blue-600">
                  {metric.val1}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">{metric.unit}</div>
              </div>

              {/* Delta */}
              <div className="text-center">
                <div
                  className="mono text-xl font-extrabold"
                  style={{ color: deltaColor }}
                >
                  {delta}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {metric.lowerIsBetter ? "↓ better" : "↑ better"}
                </div>
              </div>

              {/* Date 2 Value */}
              <div className="text-center">
                <div className="mono text-xl font-bold text-purple-600">
                  {metric.val2}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">{metric.unit}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-8 pt-6 border-t-2 border-blue-200">
        <div className="text-xs font-semibold text-slate-600 text-center uppercase tracking-wider bg-blue-50/50 py-2 rounded-lg">
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
  const [showCompare, setShowCompare] = useState(false);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [role, setRole] = useState(null);

  const carTheme =
    localStorage.getItem("selectedCar") ||
    localStorage.getItem("carTheme") ||
    "THOR";

  const theme =
    carTheme === "HAYA"
      ? { accent: "#FF2800", bg: "from-red-500 to-orange-400" }
      : { accent: "#3b82f6", bg: "from-blue-500 to-cyan-400" };

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
    <>
      <style>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animated-gradient-bg {
          background: linear-gradient(
            135deg,
            #E4E0F2 0%,
            #D9DFF1 25%,
            #CED9EB 50%,
            #E8EAF3 75%,
            #E4E0F2 100%
          );
          background-size: 600% 600%;
          animation: gradientShift 17s ease infinite;
        }

        .animated-gradient-bg-haya {
          background: linear-gradient(135deg, #0A8A63 0%, #006B4A 50%, #003E2B 100%);
          background-size: 600% 600%;
          animation: gradientShift 17s ease infinite;
        }

        .animated-gradient-bg-thor {
          background: linear-gradient(135deg, #FF6C00 0%, #003C78 100%);
          background-size: 600% 600%;
          animation: gradientShift 17s ease infinite;
        }

        @keyframes cardShimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes softPulse {
          0%, 100% {
            box-shadow: 
              0 8px 32px rgba(228, 224, 242, 0.4),
              0 2px 8px rgba(206, 217, 235, 0.3),
              inset 0 1px 2px rgba(255, 255, 255, 0.8);
          }
          50% {
            box-shadow: 
              0 12px 40px rgba(217, 223, 241, 0.5),
              0 4px 12px rgba(206, 217, 235, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.9);
          }
        }

        .premium-card {
          background: linear-gradient(
            135deg,
            rgba(240, 240, 245, 0.75) 0%,
            rgba(235, 235, 242, 0.7) 25%,
            rgba(230, 232, 240, 0.75) 50%,
            rgba(225, 228, 235, 0.7) 75%,
            rgba(240, 240, 245, 0.75) 100%
          );
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.06),
            0 1px 4px rgba(0, 0, 0, 0.04),
            inset 0 1px 1px rgba(255, 255, 255, 0.4);
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: cardShimmer 10s ease-in-out infinite;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .premium-card:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.06),
            inset 0 1px 2px rgba(255, 255, 255, 0.5);
          border-color: rgba(255, 255, 255, 0.35);
          background: linear-gradient(
            135deg,
            rgba(245, 245, 250, 0.8) 0%,
            rgba(240, 242, 248, 0.78) 50%,
            rgba(245, 245, 250, 0.8) 100%
          );
        }

        .premium-card:hover::before {
          opacity: 0.6;
        }

        .premium-card:active {
          transform: translateY(-1px) scale(1.0);
        }

        .card-metallic-accent {
          background: linear-gradient(
            135deg,
            rgba(200, 205, 215, 0.2) 0%,
            rgba(210, 215, 225, 0.15) 50%,
            rgba(220, 225, 235, 0.2) 100%
          );
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          border-bottom: 1px solid rgba(150, 160, 175, 0.15);
        }

        .premium-card-haya {
          background: linear-gradient(
            135deg,
            rgba(10, 138, 99, 0.15) 0%,
            rgba(0, 107, 74, 0.12) 25%,
            rgba(0, 62, 43, 0.15) 50%,
            rgba(0, 107, 74, 0.12) 75%,
            rgba(10, 138, 99, 0.15) 100%
          );
        }

        .premium-card-haya:hover {
          background: linear-gradient(
            135deg,
            rgba(10, 138, 99, 0.22) 0%,
            rgba(0, 107, 74, 0.18) 50%,
            rgba(10, 138, 99, 0.22) 100%
          );
        }

        .premium-card-thor {
          background: linear-gradient(
            135deg,
            rgba(255, 108, 0, 0.15) 0%,
            rgba(0, 60, 120, 0.12) 50%,
            rgba(255, 108, 0, 0.15) 100%
          );
        }

        .premium-card-thor:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 108, 0, 0.22) 0%,
            rgba(0, 60, 120, 0.18) 50%,
            rgba(255, 108, 0, 0.22) 100%
          );
        }
      `}</style>
      
      <div className={`min-h-screen p-8 space-y-8 ${carTheme === "HAYA" ? "animated-gradient-bg-haya" : carTheme === "THOR" ? "animated-gradient-bg-thor" : "animated-gradient-bg"}`}>
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl p-6 rounded-2xl border-2 border-blue-200 shadow-2xl" style={{
          boxShadow: "0 0 50px rgba(59, 130, 246, 0.2), 0 20px 40px rgba(0, 0, 0, 0.1)"
        }}>
          <div>
            <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              {welcome}
            </div>
            <div className="text-sm font-semibold text-slate-600 mt-2 uppercase tracking-wider">
              {carTheme} {role ? `• ${role.toUpperCase()}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="mono text-2xl font-bold text-blue-600 bg-white px-6 py-3 rounded-xl border-2 border-blue-200 shadow-lg">
              {clock.toLocaleTimeString()}
            </div>
            <input
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              type="date"
              className="p-3 rounded-xl bg-white text-slate-700 font-semibold border-2 border-blue-200 shadow-lg hover:border-blue-400 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300"
            />

            {showCompare && (
              <input
                value={date2}
                onChange={(e) => setDate2(e.target.value)}
                type="date"
                className="p-3 rounded-xl bg-white text-slate-700 font-semibold border-2 border-purple-200 shadow-lg hover:border-purple-400 transition-all focus:outline-none focus:ring-4 focus:ring-purple-300"
                placeholder="Compare Date"
              />
            )}

            <button
              onClick={fetchDay}
              disabled={loading}
              className="px-6 py-3 rounded-xl text-white font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${theme.accent}, ${carTheme === "HAYA" ? "#ff6b00" : "#06b6d4"})`,
                boxShadow: `0 0 30px ${theme.accent}40`
              }}
            >
              {loading && !compareData ? "Loading..." : "Fetch"}
            </button>

            {showCompare && (
              <button
                onClick={compareDates}
                disabled={loading || !date2}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                style={{
                  boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)"
                }}
              >
                Compare
              </button>
            )}

            <button
              onClick={exportPDF}
              disabled={loading || rows.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              style={{
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)"
              }}
            >
              Export Report
            </button>

            {showCompare && (
              <button
                onClick={exportComparisonPDF}
                disabled={loading || !date2 || !compareData}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                style={{
                  boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)"
                }}
              >
                Export Compare
              </button>
            )}

            <button
              onClick={async () => {
                await api.logout();
                window.location.href = "/";
              }}
              className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold uppercase tracking-wider rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowCompare(!showCompare)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 uppercase tracking-wider"
            style={{
              boxShadow: "0 0 25px rgba(99, 102, 241, 0.3)"
            }}
          >
            {showCompare ? "Hide" : "Show"} Comparison 📊
          </button>
          <button
            onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 uppercase tracking-wider"
            style={{
              boxShadow: "0 0 25px rgba(6, 182, 212, 0.3)"
            }}
          >
            {showAdvancedFeatures ? "Hide" : "Show"} Advanced Analytics 🚀
          </button>
        </div>

        {/* DRIVER VIEW */}
        {(isDriver || isAdmin) && (
          <>
            {/* Driver primary metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("avgSpeed"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Average Speed</div>
                </div>
                <AnimatedValue
                  value={baseTotals.avgSpeed}
                  color={theme.accent}
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">MPH</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("lapTime"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Avg Lap Time</div>
                </div>
                <AnimatedValue
                  value={formatLap(baseTotals.avgLapTime)}
                  color={theme.accent}
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">m:ss</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("maxSpeed"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Max Speed (avg)</div>
                </div>
                <AnimatedValue
                  value={driverAgg.maxSpeed || 0}
                  color="#10b981"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">MPH</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("deltaToBestLap"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Δ to Best Lap</div>
                </div>
                <AnimatedValue
                  value={driverAgg.deltaToBestLap || 0}
                  color="#06b6d4"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">sec</div>
              </div>
            </div>

            {/* Driver control inputs & style */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-6">
              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("avgThrottle"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Avg Throttle</div>
                </div>
                <AnimatedValue
                  value={driverAgg.avgThrottle || 0}
                  color="#10b981"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">%</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("avgBrakePressure"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Avg Brake</div>
                </div>
                <AnimatedValue
                  value={driverAgg.avgBrakePressure || 0}
                  color="#ef4444"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">%</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("hardBrakeEvents"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Hard Brakes</div>
                </div>
                <AnimatedValue
                  value={driverAgg.hardBrakeEvents || 0}
                  color="#f97316"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">events</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("steeringWork"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Steering Work</div>
                </div>
                <AnimatedValue
                  value={driverAgg.steeringWork || 0}
                  color="#a855f7"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">rel</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("gearShifts"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Gear Shifts</div>
                </div>
                <AnimatedValue
                  value={driverAgg.gearShifts || 0}
                  color="#eab308"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">per lap</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("coastTime"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Coast Time</div>
                </div>
                <AnimatedValue
                  value={driverAgg.coastTime || 0}
                  color="#0ea5e9"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">sec</div>
              </div>
            </div>
          </>
        )}

        {/* ENGINEER VIEW */}
        {(isEngineer || isAdmin) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("avgSpeed"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Avg Speed</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.avgSpeed}
                  color={theme.accent}
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">MPH</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("avgRpm"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Avg RPM</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.avgRpm}
                  color={theme.accent}
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">RPM</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("avgTemp"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Avg Temp</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.avgTemp}
                  color={theme.accent}
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">°F</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("avgFuel"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Avg Fuel Level</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.avgFuel}
                  color={theme.accent}
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-6">
              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("coolantTemp"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Coolant Temp</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.coolantTemp || 0}
                  color="#06b6d4"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">°C</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("oilTemp"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Oil Temp</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.oilTemp || 0}
                  color="#f97316"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">°C</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("batteryVoltageMin"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Min Battery V</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.batteryVoltageMin || 0}
                  color="#eab308"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">V</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("fuelUsedLap"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Fuel Used / Lap</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.fuelUsedLap || 0}
                  color="#10b981"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">L</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("maxLatG"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Max Lateral G</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.maxLatG || 0}
                  color="#a855f7"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">g</div>
              </div>

              <div className={`premium-card ${carTheme === "HAYA" ? "premium-card-haya" : carTheme === "THOR" ? "premium-card-thor" : ""} rounded-3xl p-6 cursor-pointer`} onClick={() => nav(toMetricLink("maxLongG"))}>
                <div className="card-metallic-accent rounded-lg px-3 py-1 inline-block mb-3">
                  <div className="metric-title text-slate-700 font-bold uppercase tracking-wider text-xs">Max Longitudinal G</div>
                </div>
                <AnimatedValue
                  value={engineerAgg.maxLongG || 0}
                  color="#e11d48"
                />
                <div className="text-xs mt-3 font-semibold text-slate-600 opacity-80">g</div>
              </div>
            </div>
          </>
        )}

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

        <div className="bg-white/80 backdrop-blur-xl p-6 mt-8 rounded-2xl border-2 border-blue-200 shadow-2xl" style={{
          boxShadow: "0 0 40px rgba(59, 130, 246, 0.2), 0 20px 40px rgba(0, 0, 0, 0.08)"
        }}>
          <div className="text-sm font-semibold text-slate-700 mb-4 flex justify-between items-center">
            <span>{msg}</span>
            {rows.length > 0 && (
              <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider shadow-lg">
                {rows.length} records
              </span>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="text-slate-600 text-center py-12">
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <span className="font-semibold text-lg">Loading…</span>
                </div>
              ) : (
                <div>
                  <div className="text-2xl mb-3 font-bold text-slate-700">📊 No data to display</div>
                  <div className="text-sm text-slate-500 font-medium">
                    Select a date and click "Fetch" to load telemetry data
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border-2 border-blue-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-b-2 border-blue-400">
                    <th className="p-4 font-bold uppercase tracking-wider">Time</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Speed</th>
                    <th className="p-4 font-bold uppercase tracking-wider">RPM</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Lap Time</th>

                    {(isDriver || isAdmin) && (
                      <>
                        <th className="p-4 font-bold uppercase tracking-wider">Throttle (%)</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Brake (%)</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Gear Shifts</th>
                      </>
                    )}

                    {(isEngineer || isAdmin) && (
                      <>
                        <th className="p-4 font-bold uppercase tracking-wider">Coolant Temp</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Oil Temp</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Fuel Level</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Battery V (min)</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Lat G</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Long G</th>
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
                      className="border-t border-blue-100 hover:bg-blue-50/50 transition-colors"
                      style={{
                        backgroundColor: idx % 2 === 0 ? "rgba(255, 255, 255, 0.5)" : "rgba(241, 245, 249, 0.5)"
                      }}
                    >
                      <td className="p-4 mono text-slate-600 font-medium">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-4 mono font-bold text-blue-600">
                        {r.speed ?? 0}
                      </td>
                      <td className="p-4 mono font-bold text-cyan-600">{r.rpm ?? 0}</td>
                      <td className="p-4 mono font-semibold text-slate-700">{r.lapTime || "N/A"}</td>

                      {(isDriver || isAdmin) && (
                        <>
                          <td className="p-4 mono font-semibold text-slate-700">
                            {r.avgThrottle ?? "-"}
                          </td>
                          <td className="p-4 mono font-semibold text-slate-700">
                            {r.avgBrakePressure ?? "-"}
                          </td>
                          <td className="p-4 mono font-semibold text-slate-700">
                            {r.gearShifts ?? "-"}
                          </td>
                        </>
                      )}

                      {(isEngineer || isAdmin) && (
                        <>
                          <td className="p-4 mono font-semibold text-slate-700">
                            {r.coolantTemp ?? r.temperature ?? "-"}
                          </td>
                          <td className="p-4 mono font-semibold text-slate-700">
                            {r.oilTemp ?? "-"}
                          </td>
                          <td className="p-4 mono font-semibold text-slate-700">
                            {r.fuelLevel ?? "-"}
                          </td>
                          <td className="p-4 mono font-semibold text-slate-700">
                            {r.batteryVoltageMin ?? "-"}
                          </td>
                          <td className="p-4 mono font-semibold text-slate-700">
                            {r.maxLatG ?? "-"}
                          </td>
                          <td className="p-4 mono font-semibold text-slate-700">
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
    </>
  );
}