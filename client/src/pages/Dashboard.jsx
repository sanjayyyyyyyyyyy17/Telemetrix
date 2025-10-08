import { useEffect, useMemo, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { api } from "../api"
import DataCard from "../components/DataCard"
import { motion, AnimatePresence } from "framer-motion"

function todayISO() {
  const t = new Date()
  const off = t.getTimezoneOffset()
  const local = new Date(t.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

// convert lapTime string "m:ss.xx" → total seconds before averaging
function safeAvg(arr, key) {
  const vals = arr
    .map((r) => {
      const raw = r[key]
      if (!raw) return 0
      if (key === "lapTime" && typeof raw === "string") {
        const parts = raw.split(":")
        if (parts.length === 2) {
          const m = parseFloat(parts[0])
          const s = parseFloat(parts[1])
          if (!isNaN(m) && !isNaN(s)) return m * 60 + s
        }
        return 0
      }
      return Number(raw) || 0
    })
    .filter((v) => v > 0)
  return vals.length
    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    : 0
}

export default function Dashboard() {
  const nav = useNavigate()
  const [welcome, setWelcome] = useState("Telemetry")
  const [date, setDate] = useState(todayISO())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("Select date and fetch telemetry")
  const [clock, setClock] = useState(new Date())

  const carTheme = localStorage.getItem("carTheme") || "THOR"
  const theme =
    carTheme === "HAYA"
      ? { accent: "#FF2800", bg: "from-red-900 to-red-700", label: "" }
      : { accent: "#C0C0C0", bg: "from-[#1C1C1C] to-gray-600", label: "" }

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    ;(async () => {
      const { ok, data } = await api.welcome()
      if (ok && data?.message) setWelcome(data.message)
    })()
  }, [])

  const totals = useMemo(() => ({
    avgSpeed: safeAvg(rows, "speed"),
    avgRpm: safeAvg(rows, "rpm"),
    avgLapTime: safeAvg(rows, "lapTime"),
    avgTemp: safeAvg(rows, "temperature"),
    avgFuel: safeAvg(rows, "fuelLevel"),
  }), [rows])

  async function fetchDay() {
    if (!date) {
      setMsg("Pick a date")
      return
    }
    setLoading(true)
    setMsg("Fetching…")
    const { ok, status, data } = await api.day(date)
    setLoading(false)
    if (status === 401) {
      nav("/")
      return
    }
    if (!ok) {
      setMsg(data?.message || "Error fetching")
      setRows([]) // Clear rows on error
      return
    }
    
    // ✅ CORRECTED: Adjust timestamps to be sequential
    const adjustedData = (Array.isArray(data) ? data : []).map((entry, index) => {
        const entryDate = new Date(entry.timestamp);
        entryDate.setMinutes(entryDate.getMinutes() + index); // Add index as minutes
        return {
            ...entry,
            timestamp: entryDate.toISOString()
        };
    });

    const normalized = adjustedData.map(r => ({
      ...r,
      lapTime: r.lapTime ?? r.lap_time ?? r.laptime ?? r.lap
    }))
    setRows(normalized)
    setMsg(`${normalized.length} entries loaded`)
  }

  function toMetricLink(metric) {
    const params = new URLSearchParams({ date })
    return `/dashboard/${metric}?${params.toString()}`
  }

  function formatLap(seconds) {
    if (!seconds) return 0
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  // small helper to animate each metric card value
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
    )
  }

  return (
    <div className="min-h-screen p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h1 text-2xl">{welcome}</div>
          <div className="metric-title text-sm">{theme.label}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="mono text-lg">{clock.toLocaleTimeString()}</div>
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            className="p-2 rounded bg-black/20"
          />
          <button
            onClick={fetchDay}
            className="px-4 py-2 rounded text-black font-semibold"
            style={{ background: theme.accent }}
          >
            Fetch
          </button>
          <button
            onClick={async () => {
              await api.logout()
              window.location.href = "/"
            }}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Animated metric cards */}
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
          <AnimatedValue value={formatLap(totals.avgLapTime)} color={theme.accent} />
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

      {/* Animated table */}
      <div className="panel p-4">
        <div className="text-sm table-head mb-3">Telemetry Log</div>
        <div className="text-gray-400 mb-3">{msg}</div>
        {rows.length === 0 ? (
          <div className="text-gray-400">{loading ? "Loading…" : "No data for selected date."}</div>
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
              <AnimatePresence component="tbody" initial={false}>
                {rows.map((r) => (
                  <motion.tr
                    key={r.timestamp}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-white/4 hover:bg-[#071827]"
                  >
                    <td className="p-2 mono">{new Date(r.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2 mono">{r.speed}</td>
                    <td className="p-2 mono">{r.rpm}</td>
                    <td className="p-2 mono">{r.lapTime}</td>
                    <td className="p-2 mono">{r.temperature}</td>
                    <td className="p-2 mono">{r.fuelLevel}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}