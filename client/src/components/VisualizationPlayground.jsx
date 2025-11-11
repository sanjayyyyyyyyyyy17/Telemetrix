// Create this file: client/src/components/VisualizationPlayground.jsx

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

export default function VisualizationPlayground({ data }) {
  const [metric, setMetric] = useState("speed");
  const [chartType, setChartType] = useState("line");

  if (!data || data.length === 0) {
    return (
      <div className="panel p-4 bg-gradient-to-tr from-gray-900 to-gray-800 rounded-xl mt-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-3 text-white">📊 Visualization Playground</h2>
        <p className="text-gray-400 text-sm">No data available to visualize. Fetch data first.</p>
      </div>
    );
  }

  // Prepare data for chart (format timestamps)
  const chartData = data.map((entry, idx) => ({
    ...entry,
    index: idx + 1,
    time: entry.timestamp 
      ? new Date(entry.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : `Entry ${idx + 1}`,
  }));

  const getMetricColor = (metric) => {
    switch (metric) {
      case "speed":
        return "#00BFFF"; // Blue
      case "rpm":
        return "#FF6B6B"; // Red
      case "temperature":
        return "#FFA500"; // Orange
      case "fuelLevel":
        return "#32CD32"; // Green
      default:
        return "#00BFFF";
    }
  };

  const getMetricLabel = (metric) => {
    switch (metric) {
      case "speed":
        return "Speed (MPH)";
      case "rpm":
        return "RPM";
      case "temperature":
        return "Temperature (°F)";
      case "fuelLevel":
        return "Fuel Level (%)";
      default:
        return metric;
    }
  };

  // Calculate stats
  const values = chartData.map(d => Number(d[metric]) || 0).filter(v => v > 0);
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const avg = values.length 
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel p-6 bg-gradient-to-tr from-gray-900 to-gray-800 rounded-xl mt-6 border border-cyan-500/30 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          📊 Visualization Playground
          <span className="text-xs font-normal text-gray-400">({data.length} data points)</span>
        </h2>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-gray-300 text-sm font-semibold">Metric:</label>
          <select
            className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="speed">Speed</option>
            <option value="rpm">RPM</option>
            <option value="temperature">Temperature</option>
            <option value="fuelLevel">Fuel Level</option>
          </select>
        </div>

        <div className="bg-gray-800 px-4 py-2 rounded border border-gray-700 grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-400">Min:</span>
            <span className="text-cyan-400 font-mono ml-2">{min}</span>
          </div>
          <div>
            <span className="text-gray-400">Avg:</span>
            <span className="text-cyan-400 font-mono ml-2">{avg}</span>
          </div>
          <div>
            <span className="text-gray-400">Max:</span>
            <span className="text-cyan-400 font-mono ml-2">{max}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            tick={{ fill: "#9CA3AF", fontSize: 11 }} 
            stroke="#4B5563"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fill: "#9CA3AF", fontSize: 12 }} 
            stroke="#4B5563"
            label={{ 
              value: getMetricLabel(metric), 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: '#9CA3AF', fontSize: 12 }
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey={metric} 
            stroke={getMetricColor(metric)}
            strokeWidth={3} 
            dot={{ fill: getMetricColor(metric), r: 3 }}
            activeDot={{ r: 6 }}
            name={getMetricLabel(metric)}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 bg-gray-800/50 p-3 rounded border border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          💡 Hover over data points for detailed values. Switch metrics to analyze different performance aspects.
        </p>
      </div>
    </motion.div>
  );
}