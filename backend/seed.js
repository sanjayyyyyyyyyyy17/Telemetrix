// =============================================
// backend/seed.js
// =============================================

const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/car_data")
  .then(() => console.log("✅ MongoDB connected for seeding"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

const dashboardSchema = new mongoose.Schema({
  car: String,
  date: Date,
  speed: Number,
  rpm: Number,
  lapTime: String,
  temperature: Number,
  fuelLevel: Number,
  timestamp: { type: Date, default: Date.now },
});

const DashboardData = mongoose.model("DashboardData", dashboardSchema);

// helper to generate random telemetry
function randomTelemetry(car, date) {
  return {
    car,
    date: new Date(date),
    speed: Math.floor(Math.random() * 120) + 60,
    rpm: Math.floor(Math.random() * 4000) + 2000,
    lapTime: `${Math.floor(Math.random() * 2) + 1}:${Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, "0")}`,
    temperature: Math.floor(Math.random() * 30) + 60,
    fuelLevel: Math.floor(Math.random() * 40) + 60,
  };
}

async function seed() {
  const car = "THOR";
  const baseDate = new Date("2025-02-10");

  const records = [];
  for (let i = 0; i < 10; i++) {
    const recordDate = new Date(baseDate);
    recordDate.setHours(i * 2);
    records.push(randomTelemetry(car, recordDate));
  }

  await DashboardData.insertMany(records);
  console.log(`✅ Seeded ${records.length} records for ${car}`);
  mongoose.disconnect();
}

seed();
