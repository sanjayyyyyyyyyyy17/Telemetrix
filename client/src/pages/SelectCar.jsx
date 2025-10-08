import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"

export default function SelectCar() {
  const nav = useNavigate()
  const [car, setCar] = useState("")
  const [pin, setPin] = useState("")
  const [msg, setMsg] = useState("")

  async function submit(e) {
    e.preventDefault()
    if (!car) {
      setMsg("Pick a car")
      return
    }
    const { ok } = await api.selectCar(car, pin)
    if (ok) {
      localStorage.setItem("carTheme", car) // save selected car
      nav("/dashboard")
    } else setMsg("Invalid PIN")
  }

  const cars = [
    {
      id: "HAYA",
      name: "HAYA",
      theme: "bg-gradient-to-br from-red-800 to-[#FF2800]",
      logo: "/ferrari.png", // place Ferrari logo image in public folder
    },
    {
      id: "THOR",
      name: "THOR",
      theme: "bg-gradient-to-br from-[#1C1C1C] to-gray-600",
      logo: "/mercedes.png", // place Mercedes logo image in public folder
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f0f0f]">
      <div className="panel max-w-3xl w-full p-10">
        <h1 className="h1 text-2xl mb-6 text-center">Choose Your Car</h1>

        {/* Car Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {cars.map((c) => (
            <div
              key={c.id}
              onClick={() => setCar(c.id)}
              className={`${c.theme} relative cursor-pointer p-10 rounded-xl text-white flex flex-col items-center justify-center transition-all transform hover:scale-105 hover:shadow-2xl ${
                car === c.id ? "ring-4 ring-[#00BFFF]" : ""
              }`}
            >
              <img
                src={c.logo}
                alt={c.name}
                className="w-20 h-20 object-contain mb-4 drop-shadow-lg"
              />
              <div className="text-xl font-bold tracking-wide">{c.name}</div>
            </div>
          ))}
        </div>

        {/* PIN Form */}
        {car && (
          <form onSubmit={submit} className="space-y-4">
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              type="password"
              className="w-full p-3 rounded bg-black/30 border border-white/10 focus:border-[#00BFFF] focus:ring-2 focus:ring-[#00BFFF]/40 transition-all font-mono"
            />
            <div className="flex justify-between">
              <button
                type="submit"
                className="px-5 py-2 bg-[#00BFFF] rounded text-black font-semibold hover:brightness-110 transition"
              >
                Access Dashboard
              </button>
              <button
                type="button"
                onClick={() => setCar("")}
                className="px-5 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
            {msg && <div className="text-red-400 text-sm">{msg}</div>}
          </form>
        )}
      </div>
    </div>
  )
}
