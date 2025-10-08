import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"

export default function Login() {
  const nav = useNavigate()
  const [u, setU] = useState("")
  const [p, setP] = useState("")
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setMsg("")
    setLoading(true)
    const { ok, data } = await api.login(u, p)
    setLoading(false)
    if (ok) nav("/select-car")
    else setMsg(data?.message || "Authentication failed")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#1A1A1A] to-gray-900 p-6">
      <div className="panel max-w-md w-full p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00BFFF] opacity-20 rounded-full blur-3xl animate-pulse"></div>

        <h1 className="h1 text-3xl text-center mb-2">RACE CONTROL</h1>
        <p className="text-center text-gray-400 mb-6">Sign in to access telemetry</p>

        <form onSubmit={submit} className="space-y-5">
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            placeholder="Username"
            className="w-full p-3 rounded bg-black/30 border border-white/10 focus:border-[#00BFFF] focus:ring-2 focus:ring-[#00BFFF]/40 transition-all"
          />
          <input
            value={p}
            onChange={(e) => setP(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded bg-black/30 border border-white/10 focus:border-[#00BFFF] focus:ring-2 focus:ring-[#00BFFF]/40 transition-all"
          />
          <button className="w-full py-3 bg-[#00BFFF] hover:bg-[#00a6e0] text-black font-semibold rounded transition">
            {loading ? "Authenticating…" : "Enter Pit Lane"}
          </button>
          {msg && <div className="text-red-400 text-sm text-center">{msg}</div>}
        </form>
      </div>
    </div>
  )
}
