import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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

// helper to convert "m:ss.xx" to seconds
function toSeconds(str) {
  if (!str) return null
  if (typeof str === "number") return str
  const parts = str.split(":")
  if (parts.length === 2) {
    const m = parseFloat(parts[0])
    const s = parseFloat(parts[1])
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s
  }
  return null
}

export default function LapTimeDetail() {
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
      // convert lap time to numeric seconds for the chart
      const normalized = data.map(r => ({
        ...r,
        lapTime:
          toSeconds(r.lapTime) ??
          toSeconds(r.lap_time) ??
          toSeconds(r.laptime) ??
          toSeconds(r.lap)
      }))
      setRows(normalized)
      setMsg("")
    }
    load()
  }, [date, nav])

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass max-w-5xl w-full p-8 rounded-2xl">
        <h1 className="font-['Orbitron'] text-3xl text-indigo-400 mb-6">Lap Time Trends</h1>
        {msg && <p className="text-center text-gray-400 mb-4">{msg}</p>}
        {!msg && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <YAxis
                label={{ value: "Seconds", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                formatter={(v) => `${Math.floor(v / 60)}:${Math.round(v % 60).toString().padStart(2,"0")}`}
              />
              <Line
                type="monotone"
                dataKey="lapTime"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => nav("/dashboard")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
