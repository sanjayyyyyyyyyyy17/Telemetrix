import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { api } from "../api"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

export default function MetricDetail() {
  const { metric } = useParams()
  const nav = useNavigate()
  const loc = useLocation()
  const date = new URLSearchParams(loc.search).get("date")

  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState("Loading…")

  useEffect(() => {
    async function load() {
      if (!date) {
        setMsg("No date provided.")
        return
      }
      const { ok, status, data } = await api.day(date)
      if (status === 401) {
        nav("/")
        return
      }
      if (!ok || !Array.isArray(data)) {
        setMsg("Error loading data.")
        return
      }

      // ✅ CORRECTED: Adjust timestamps to be sequential for the chart
      const adjustedData = (Array.isArray(data) ? data : []).map((entry, index) => {
          const entryDate = new Date(entry.timestamp);
          entryDate.setMinutes(entryDate.getMinutes() + index); // Add index as minutes
          return {
              ...entry,
              timestamp: entryDate.toISOString()
          };
      });

      const normalized = adjustedData.map((r) =>
        metric === "lapTime"
          ? { ...r, lapTime: r.lapTime ?? r.lap_time ?? r.laptime ?? r.lap }
          : r
      )
      setRows(normalized)
      setMsg("")
    }
    load()
  }, [date, metric, nav])

  const colors = {
    speed: "#3b82f6",
    rpm: "#ef4444",
    lapTime: "#a855f7",
    temperature: "#f97316",
    fuelLevel: "#22c55e",
  }

  const labels = {
    speed: "Speed (MPH)",
    rpm: "RPM",
    lapTime: "Lap Time",
    temperature: "Temperature (°F)",
    fuelLevel: "Fuel (%)",
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass max-w-5xl w-full p-8 rounded-2xl">
        <h1 className="font-['Orbitron'] text-3xl text-indigo-400 mb-6">
          {labels[metric] || metric} Trends
        </h1>

        {msg && <p className="text-center text-gray-400 mb-4">{msg}</p>}

        {!msg && rows.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) =>
                  new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              />
              <YAxis />
              <Tooltip labelFormatter={(t) => new Date(t).toLocaleTimeString()} />
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
              // Go back with date preserved if it exists
              const params = new URLSearchParams(window.location.search);
              const dateParam = params.get('date');
              if (dateParam) {
                nav(`/dashboard?date=${encodeURIComponent(dateParam)}`)
              } else {
                nav("/dashboard")
              }
            }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}