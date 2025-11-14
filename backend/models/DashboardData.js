import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
  car: { type: String, required: true },
  date: { type: Date, required: true },

  // Existing metrics
  speed: Number,
  avgSpeed: Number,
  rpm: Number,
  avgRpm: Number,
  lapTime: String,
  temperature: Number,
  fuelLevel: Number,
  timestamp: { type: Date, default: Date.now },

  // 🔹 Driver-focused metrics (per lap summary)
  avgThrottle: Number,
  avgBrakePressure: Number,
  hardBrakeEvents: Number,
  steeringWork: Number,
  gearShifts: Number,
  coastTime: Number,

  // 🔹 Engineer-focused metrics
  coolantTemp: Number,
  oilTemp: Number,
  batteryVoltageMin: Number,
  fuelUsedLap: Number,
  maxLatG: Number,
  maxLongG: Number,

  // 🔹 Shared metrics (both driver + engineer)
  maxSpeed: Number,
  maxRpm: Number,
  sector1Time: Number,
  sector2Time: Number,
  sector3Time: Number,
  deltaToBestLap: Number,
});

export default mongoose.model("DashboardData", dashboardSchema);
