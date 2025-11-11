// Create this file: client/src/components/AIInsights.jsx

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIInsights({ date, car }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!date) return;
    
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/insights/${date}`, {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights || []);
          setStats({
            avgSpeed: data.avgSpeed,
            avgRpm: data.avgRpm,
            avgTemp: data.avgTemp,
            avgFuel: data.avgFuel,
          });
        } else {
          setInsights([]);
          setStats(null);
        }
      } catch (err) {
        console.error("Insights fetch error:", err);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [date]);

  if (loading) {
    return (
      <div className="panel p-4 mt-6 bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-white mb-2">
          🧠 AI Performance Insights
        </h2>
        <p className="text-gray-300">Analyzing performance data...</p>
      </div>
    );
  }

  if (!insights.length) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel p-4 mt-6 bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-xl shadow-md border border-indigo-500/30"
    >
      <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        🧠 AI Performance Insights
        <span className="text-xs font-normal text-indigo-300">({car})</span>
      </h2>
      
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
          <div className="bg-black/20 p-2 rounded">
            <div className="text-indigo-300">Speed</div>
            <div className="text-white font-mono">{stats.avgSpeed} MPH</div>
          </div>
          <div className="bg-black/20 p-2 rounded">
            <div className="text-indigo-300">RPM</div>
            <div className="text-white font-mono">{stats.avgRpm}</div>
          </div>
          <div className="bg-black/20 p-2 rounded">
            <div className="text-indigo-300">Temp</div>
            <div className="text-white font-mono">{stats.avgTemp}°F</div>
          </div>
          <div className="bg-black/20 p-2 rounded">
            <div className="text-indigo-300">Fuel</div>
            <div className="text-white font-mono">{stats.avgFuel}%</div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <AnimatePresence>
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-black/20 p-3 rounded text-gray-100 text-sm border-l-2 border-indigo-400"
            >
              {insight}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}