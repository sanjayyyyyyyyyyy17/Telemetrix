// Create this file: client/src/components/GamificationWidget.jsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function GamificationWidget({ date, car }) {
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/gamification/${date}`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setGamification(data);
        } else {
          setGamification(null);
        }
      } catch (err) {
        console.error("Gamification fetch error:", err);
        setGamification(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [date]);

  if (loading) {
    return (
      <div className="panel mt-6 p-4 bg-gradient-to-r from-yellow-900 to-yellow-600 rounded-xl">
        <h3 className="text-lg font-semibold mb-2 text-white">🏆 Performance Ranking</h3>
        <p className="text-gray-200 text-sm">Calculating...</p>
      </div>
    );
  }

  if (!gamification) {
    return null;
  }

  const getRankGradient = (rank) => {
    switch (rank) {
      case "Platinum":
        return "from-blue-600 to-blue-400";
      case "Gold":
        return "from-yellow-600 to-yellow-400";
      case "Silver":
        return "from-gray-500 to-gray-300";
      default:
        return "from-orange-700 to-orange-500";
    }
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case "Platinum":
        return "💎";
      case "Gold":
        return "🥇";
      case "Silver":
        return "🥈";
      default:
        return "🥉";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`panel mt-6 p-6 bg-gradient-to-r ${getRankGradient(gamification.rank)} rounded-xl shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          🏆 Performance Ranking
          <span className="text-sm font-normal opacity-80">({car})</span>
        </h3>
        <div className="text-4xl">{getRankEmoji(gamification.rank)}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 p-4 rounded-lg backdrop-blur-sm">
          <p className="text-gray-100 text-sm mb-1">Performance Score</p>
          <p className="text-4xl font-bold text-white">{gamification.points}</p>
          <p className="text-xs text-gray-200 mt-1">out of 100</p>
        </div>

        <div className="bg-black/20 p-4 rounded-lg backdrop-blur-sm">
          <p className="text-gray-100 text-sm mb-1">Rank Tier</p>
          <p className="text-3xl font-bold text-white">{gamification.rank}</p>
          {gamification.rank === "Platinum" && (
            <p className="text-xs text-gray-200 mt-1">Elite Driver! 🎯</p>
          )}
          {gamification.rank === "Gold" && (
            <p className="text-xs text-gray-200 mt-1">Excellent! ⭐</p>
          )}
          {gamification.rank === "Silver" && (
            <p className="text-xs text-gray-200 mt-1">Good Job! 👍</p>
          )}
          {gamification.rank === "Bronze" && (
            <p className="text-xs text-gray-200 mt-1">Keep improving! 💪</p>
          )}
        </div>
      </div>

      {gamification.breakdown && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-white mb-2">Score Breakdown:</p>
          {Object.entries(gamification.breakdown).map(([key, value]) => (
            <div key={key} className="bg-black/20 p-2 rounded flex justify-between items-center">
              <span className="text-sm text-gray-100 capitalize">{key}:</span>
              <div className="text-right">
                <span className="text-white font-mono font-semibold">{value.points} pts</span>
                <span className="text-xs text-gray-300 ml-2">({value.reason})</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 bg-black/20 p-3 rounded backdrop-blur-sm">
        <p className="text-xs text-gray-200 text-center">
          💡 Tip: Maintain optimal temperature and fuel efficiency for higher scores!
        </p>
      </div>
    </motion.div>
  );
}