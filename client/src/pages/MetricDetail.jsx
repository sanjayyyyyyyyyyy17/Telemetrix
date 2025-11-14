import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function MetricDetail() {
  const { metric } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const date = new URLSearchParams(loc.search).get("date");

  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("Loading…");
  const [role, setRole] = useState(null);

  // Role from session
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/debug/session", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        const r = data?.user?.role || null;
        setRole(r);
      } catch {
        setRole(null);
      }
    })();
  }, []);

  // Define role-allowed metrics
  const driverMetrics = new Set([
    "avgSpeed",
    "lapTime",
    "maxSpeed",
    "deltaToBestLap",
    "avgThrottle",
    "avgBrakePressure",
    "hardBrakeEvents",
    "steeringWork",
    "gearShifts",
    "coastTime",
    "sector1Time",
    "sector2Time",
    "sector3Time",
  ]);

  const engineerMetrics = new Set([
    "avgSpeed",
    "avgRpm",
    "avgTemp",
    "avgFuel",
    "coolantTemp",
    "oilTemp",
    "batteryVoltageMin",
    "fuelUsedLap",
    "maxLatG",
    "maxLongG",
  ]);

  const adminMetrics = new Set([
    ...driverMetrics,
    ...engineerMetrics,
    "speed",
    "rpm",
    "temperature",
    "fuelLevel",
  ]);

  const colors = {
    speed: "#3b82f6",
    rpm: "#ef4444",
    lapTime: "#a855f7",
    temperature: "#f97316",
    fuelLevel: "#22c55e",

    avgSpeed: "#3b82f6",
    avgRpm: "#ef4444",
    avgTemp: "#f97316",
    avgFuel: "#22c55e",

    avgThrottle: "#22c55e",
    avgBrakePressure: "#ef4444",
    hardBrakeEvents: "#f97316",
    steeringWork: "#a855f7",
    gearShifts: "#eab308",
    coastTime: "#0ea5e9",

    maxSpeed: "#22c55e",
    deltaToBestLap: "#38bdf8",
    sector1Time: "#facc15",
    sector2Time: "#f97316",
    sector3Time: "#6366f1",

    coolantTemp: "#38bdf8",
    oilTemp: "#f97316",
    batteryVoltageMin: "#facc15",
    fuelUsedLap: "#22c55e",
    maxLatG: "#a855f7",
    maxLongG: "#e11d48",
  };

  const labels = {
    speed: "Speed (MPH)",
    rpm: "RPM",
    temperature: "Temperature (°F)",
    fuelLevel: "Fuel (%)",
    lapTime: "Lap Time (sec)",

    avgSpeed: "Average Speed (MPH)",
    avgRpm: "Average RPM",
    avgTemp: "Average Temperature (°F)",
    avgFuel: "Average Fuel Level (%)",

    avgThrottle: "Average Throttle (%)",
    avgBrakePressure: "Average Brake Pressure (%)",
    hardBrakeEvents: "Hard Brake Events",
    steeringWork: "Steering Work (relative)",
    gearShifts: "Gear Shifts per Lap",
    coastTime: "Coast Time (sec)",

    maxSpeed: "Max Speed (MPH)",
    deltaToBestLap: "Delta to Best Lap (sec)",
    sector1Time: "Sector 1 Time (sec)",
    sector2Time: "Sector 2 Time (sec)",
    sector3Time: "Sector 3 Time (sec)",

    coolantTemp: "Coolant Temperature (°C)",
    oilTemp: "Oil Temperature (°C)",
    batteryVoltageMin: "Minimum Battery Voltage (V)",
    fuelUsedLap: "Fuel Used Per Lap (L)",
    maxLatG: "Max Lateral G",
    maxLongG: "Max Longitudinal G",
  };

  useEffect(() => {
    async function load() {
      if (!date) {
        setMsg("No date provided.");
        return;
      }

      const { ok, status, data } = await api.day(date);
      if (status === 401) {
        nav("/");
        return;
      }
      if (!ok || !Array.isArray(data)) {
        setMsg("Error loading data.");
        return;
      }

      const adjustedData = (Array.isArray(data) ? data : []).map(
        (entry, index) => {
          const entryDate = new Date(entry.timestamp || Date.now());
          entryDate.setMinutes(entryDate.getMinutes() + index);
          return {
            ...entry,
            timestamp: entryDate.toISOString(),
          };
        }
      );

      const normalized = adjustedData.map((r) =>
        metric === "lapTime"
          ? {
              ...r,
              lapTime: r.lapTime ?? r.lap_time ?? r.laptime ?? r.lap,
            }
          : r
      );

      setRows(normalized);
      setMsg("");
    }
    load();
  }, [date, metric, nav]);

  // Check if metric is allowed for this role
  const metricAllowed = (() => {
    if (!role) return true; // while loading role, don't block
    if (role === "driver") return driverMetrics.has(metric);
    if (role === "engineer") return engineerMetrics.has(metric);
    if (role === "admin") return adminMetrics.has(metric);
    return false;
  })();

  useEffect(() => {
    if (role && !metricAllowed) {
      setMsg("You are not allowed to view this metric for your role.");
      // Optionally redirect after short delay
      const id = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const dateParam = params.get("date");
        if (dateParam) {
          nav(`/dashboard?date=${encodeURIComponent(dateParam)}`);
        } else {
          nav("/dashboard");
        }
      }, 2000);
      return () => clearTimeout(id);
    }
  }, [role, metricAllowed, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass max-w-5xl w-full p-8 rounded-2xl">
        <h1 className="font-['Orbitron'] text-3xl text-indigo-400 mb-6">
          {labels[metric] || metric} Trends
        </h1>

        {msg && <p className="text-center text-gray-400 mb-4">{msg}</p>}

        {!msg && rows.length > 0 && metricAllowed && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) =>
                  new Date(t).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(t) =>
                  new Date(t).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={colors[metric] || "#6366f1"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              const dateParam = params.get("date");
              if (dateParam) {
                nav(`/dashboard?${params.toString()}`);
              } else {
                nav("/dashboard");
              }
            }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
