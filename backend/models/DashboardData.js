import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
  car: { type: String, required: true },
  date: { type: Date, required: true },
  speed: Number,
  avgSpeed: Number,
  rpm: Number,
  avgRpm: Number,
  lapTime: String,
  temperature: Number,
  fuelLevel: Number,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("DashboardData", dashboardSchema);
