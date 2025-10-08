import React from "react"

export default function Gauge({ value=0, max=100, unit="", ringClass="" }) {
  const pct = Math.max(0, Math.min(1, value/max));
  const circumference = 2 * Math.PI * 44; // r=44
  const offset = circumference * (1 - pct);
  return (
    <div className="w-full flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="mb-3">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#00BFFF" stopOpacity="1"/>
            <stop offset="100%" stopColor="#66e0ff" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="44" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none"/>
        <circle cx="60" cy="60" r="44" stroke="url(#g1)" strokeWidth="10" fill="none"
          strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset}
          transform="rotate(-90 60 60)" style={{ transition:"stroke-dashoffset 900ms ease" }} />
      </svg>

      <div className="text-center">
        <div className="metric-value mono">{Math.round(value)}</div>
        {unit && <div className="metric-title text-sm mt-1">{unit}</div>}
      </div>
    </div>
  )
}
