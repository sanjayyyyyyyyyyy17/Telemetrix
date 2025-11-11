// ✅ FIXED BACKEND - Correct collection name
// Replace your entire backend/dashboard.js with this file

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname } from "path";
import User from "./models/User.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// __dirname fix for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ FIXED: Correct collection name with 's'
const TELEMETRY_COLLECTION = 'dashboarddatas'; // ⚠️ Changed from 'dashboarddata' to 'dashboarddatas'

// ✅ Logging setup
const logStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});
app.use(morgan("combined", { stream: logStream }));

// ✅ Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

// ✅ Session setup - MUST be before routes
app.use(
  session({
    name: "car_sid",
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "car_data",
    }),
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { dbName: "car_data" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ Middleware Helpers
function requireAuth(req, res, next) {
  console.log("🔒 Auth check - Session user:", req.session.user);
  if (!req.session.user)
    return res.status(401).json({ message: "Unauthorized" });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.status(403).json({ message: "Access denied" });
  next();
}

// 🎯 CAR ACCESS PIN SYSTEM (hardcoded, secure)
const carPins = {
  THOR: "6107",
  HAYA: "1718",
  ODIN: "2023",
};

// ✅ UTILITY: Get the telemetry collection
async function getTelemetryCollection() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  return db.collection(TELEMETRY_COLLECTION);
}

// ✅ UTILITY: Parse date safely with timezone handling
function parseDate(dateString) {
  // Parse as local date, not UTC
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ✅ UTILITY: Average calculation helper
function calculateAverage(arr, key) {
  if (!arr.length) return 0;
  const values = arr
    .map(r => Number(r[key]) || 0)
    .filter(v => v > 0);
  return values.length 
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;
}

// ✅ UTILITY: Gamification calculation function
function calculatePerformancePoints(data) {
  let points = 0;
  let breakdown = {};

  // Speed scoring (0-30 points)
  if (data.avgSpeed > 180) {
    points += 30;
    breakdown.speed = { points: 30, reason: "Excellent speed" };
  } else if (data.avgSpeed > 150) {
    points += 25;
    breakdown.speed = { points: 25, reason: "Great speed" };
  } else if (data.avgSpeed > 120) {
    points += 15;
    breakdown.speed = { points: 15, reason: "Good speed" };
  } else {
    points += 5;
    breakdown.speed = { points: 5, reason: "Low speed" };
  }

  // RPM scoring (0-20 points) - lower is better
  if (data.avgRpm < 7500) {
    points += 20;
    breakdown.rpm = { points: 20, reason: "Excellent engine management" };
  } else if (data.avgRpm < 8500) {
    points += 15;
    breakdown.rpm = { points: 15, reason: "Good engine control" };
  } else {
    points += 5;
    breakdown.rpm = { points: 5, reason: "High engine stress" };
  }

  // Fuel scoring (0-25 points)
  if (data.avgFuel > 60) {
    points += 25;
    breakdown.fuel = { points: 25, reason: "Excellent fuel efficiency" };
  } else if (data.avgFuel > 50) {
    points += 20;
    breakdown.fuel = { points: 20, reason: "Good fuel management" };
  } else if (data.avgFuel > 30) {
    points += 10;
    breakdown.fuel = { points: 10, reason: "Moderate fuel usage" };
  } else {
    points += 5;
    breakdown.fuel = { points: 5, reason: "Low fuel efficiency" };
  }

  // Temperature scoring (0-25 points)
  if (data.avgTemp < 180) {
    points += 25;
    breakdown.temp = { points: 25, reason: "Perfect cooling" };
  } else if (data.avgTemp < 200) {
    points += 20;
    breakdown.temp = { points: 20, reason: "Good thermal control" };
  } else if (data.avgTemp < 220) {
    points += 10;
    breakdown.temp = { points: 10, reason: "Running warm" };
  } else {
    points += 5;
    breakdown.temp = { points: 5, reason: "Overheating risk" };
  }

  // Determine rank
  let rank = "Bronze";
  let rankColor = "#CD7F32";
  
  if (points >= 85) {
    rank = "Platinum";
    rankColor = "#E5E4E2";
  } else if (points >= 70) {
    rank = "Gold";
    rankColor = "#FFD700";
  } else if (points >= 50) {
    rank = "Silver";
    rankColor = "#C0C0C0";
  }

  return { points, rank, rankColor, breakdown };
}

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// ✅ Default route
app.get("/", (req, res) => {
  res.send("🚗 Car Dashboard Backend is running...");
});

// ✅ Signup route (approval required)
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ message: "Username and password required" });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashed,
      role: "user",
      approved: false,
    });
    await newUser.save();

    res.json({
      message:
        "Signup successful! Await admin approval before you can log in.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Login route (with debug info)
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("🔐 Login attempt:", username);

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      console.log("❌ No user found for username:", username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log("🔑 Password comparison result:", match);

    if (!match) {
      console.log("❌ Password mismatch for user:", username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.approved) {
      console.log("⏳ User not approved yet:", username);
      return res.status(403).json({ message: "User not approved by admin" });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    console.log(`✅ ${user.username} logged in as ${user.role}`);
    res.json({
      message: "Login successful",
      role: user.role,
    });
  } catch (err) {
    console.error("💥 Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Logout route
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("car_sid");
    res.json({ message: "Logged out successfully" });
  });
});

// ============================================
// CAR SELECTION & SESSION ROUTES
// ============================================

// ✅ Route: Select Car + PIN Validation
app.post("/api/selectCar", requireAuth, (req, res) => {
  const { car, pin } = req.body;
  
  console.log("=== CAR SELECTION DEBUG ===");
  console.log("🚗 Car selection attempt:", { car, pin });
  console.log("Session exists:", !!req.session);
  console.log("User in session:", req.session.user);
  console.log("Available cars:", Object.keys(carPins));
  console.log("========================");

  // Ensure car exists in our pin list
  if (!carPins[car]) {
    console.log("❌ Invalid car:", car);
    return res.status(400).json({ message: "Invalid car selected" });
  }

  // Match the pin (string compare)
  if (String(carPins[car]) !== String(pin)) {
    console.log("❌ Incorrect PIN for:", car);
    console.log("Expected:", carPins[car], "Got:", pin);
    return res.status(403).json({ message: "Invalid PIN" });
  }

  // ✅ Success: store selected car in session
  req.session.selectedCar = car;
  console.log(`✅ Car access granted for ${car}`);
  res.json({ message: `Access granted for ${car}` });
});

// ✅ Debug route (view session data)
app.get("/debug/session", (req, res) => {
  res.json({
    session: req.session,
    sessionID: req.sessionID,
    user: req.session.user,
    selectedCar: req.session.selectedCar,
  });
});

// ============================================
// ADMIN ROUTES
// ============================================

// ✅ Admin: Get all users
app.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ✅ Admin: Approve user
app.post("/admin/approve/:username", requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const updated = await User.findOneAndUpdate(
      { username },
      { approved: true },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: `${username} approved successfully.` });
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ message: "Error approving user" });
  }
});

// ============================================
// DASHBOARD & TELEMETRY ROUTES
// ============================================

// ✅ Dashboard data fetch route (with gamification)
app.get("/api/dashboard/:date", requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const selectedCar = req.session.selectedCar;
    
    console.log("📊 Fetching dashboard data:", { date, car: selectedCar });
    console.log("📦 Using collection:", TELEMETRY_COLLECTION);

    if (!selectedCar) {
      return res.status(400).json({ message: "No car selected. Please select a car first." });
    }

    const collection = await getTelemetryCollection();
    
    // Log all data in collection for debugging
    const allData = await collection.find({}).limit(5).toArray();
    console.log("🔍 Sample data from collection:", JSON.stringify(allData, null, 2));
    
    const dateStart = parseDate(date);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    console.log("📅 Date range:", { start: dateStart, end: dateEnd });

    // Filter by selected car AND date
    const records = await collection.find({
      car: selectedCar,
      date: {
        $gte: dateStart,
        $lt: dateEnd,
      },
    }).toArray();

    console.log(`✅ Found ${records.length} records for ${selectedCar} on ${date}`);

    // Calculate gamification for the fetched data
    if (records.length > 0) {
      const avgSpeed = calculateAverage(records, 'speed');
      const avgRpm = calculateAverage(records, 'rpm');
      const avgTemp = calculateAverage(records, 'temperature');
      const avgFuel = calculateAverage(records, 'fuelLevel');

      const gamification = calculatePerformancePoints({
        avgSpeed,
        avgRpm,
        avgTemp,
        avgFuel,
      });

      // Include gamification in response metadata
      res.json({
        data: records,
        meta: {
          count: records.length,
          date: date,
          car: selectedCar,
          gamification: gamification
        }
      });
    } else {
      res.json({ data: [], meta: { count: 0, date, car: selectedCar } });
    }
    
  } catch (err) {
    console.error("💥 Dashboard fetch error:", err);
    res.status(500).json({ message: "Error fetching dashboard data: " + err.message });
  }
});

// ✅ Analytics endpoint for comparison
app.get("/api/analytics/:car/:date1/:date2", requireAuth, async (req, res) => {
  try {
    const { car, date1, date2 } = req.params;
    console.log("📈 Analytics request:", { car, date1, date2 });

    const collection = await getTelemetryCollection();

    const date1Start = parseDate(date1);
    const date1End = new Date(date1Start);
    date1End.setDate(date1End.getDate() + 1);
    
    const date2Start = parseDate(date2);
    const date2End = new Date(date2Start);
    date2End.setDate(date2End.getDate() + 1);

    console.log("🔎 Querying date ranges:", { date1Start, date1End, date2Start, date2End });
    
    const data1 = await collection.find({
      car: car,
      date: { $gte: date1Start, $lt: date1End }
    }).toArray();

    const data2 = await collection.find({
      car: car,
      date: { $gte: date2Start, $lt: date2End }
    }).toArray();

    console.log(`📊 Found ${data1.length} records for date1, ${data2.length} for date2`);

    if (!data1.length || !data2.length) {
      return res.status(404).json({ 
        message: "Insufficient data for comparison",
        date1Count: data1.length,
        date2Count: data2.length
      });
    }

    // Return structured data, not formatted strings
    const result = {
      date1: date1,
      date2: date2,
      date1Data: {
        avgSpeed: calculateAverage(data1, 'speed'),
        avgRPM: calculateAverage(data1, 'rpm'),
        avgTemp: calculateAverage(data1, 'temperature'),
        avgFuel: calculateAverage(data1, 'fuelLevel'),
      },
      date2Data: {
        avgSpeed: calculateAverage(data2, 'speed'),
        avgRPM: calculateAverage(data2, 'rpm'),
        avgTemp: calculateAverage(data2, 'temperature'),
        avgFuel: calculateAverage(data2, 'fuelLevel'),
      },
      // For backward compatibility with frontend expecting these keys
      avgSpeed: `${calculateAverage(data1, 'speed')} vs ${calculateAverage(data2, 'speed')}`,
      avgRPM: `${calculateAverage(data1, 'rpm')} vs ${calculateAverage(data2, 'rpm')}`,
      avgTemp: `${calculateAverage(data1, 'temperature')} vs ${calculateAverage(data2, 'temperature')}`,
      avgFuel: `${calculateAverage(data1, 'fuelLevel')} vs ${calculateAverage(data2, 'fuelLevel')}`,
    };

    console.log("✅ Returning comparison:", result);
    res.json(result);
    
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Error fetching analytics: " + err.message });
  }
});

// ============================================
// REPORT GENERATION ROUTES
// ============================================

// ✅ Reports endpoint - Generates text files
app.get("/api/reports/:car/:date", requireAuth, async (req, res) => {
  try {
    const { car, date } = req.params;
    console.log("📄 Generating report for:", { car, date });

    const collection = await getTelemetryCollection();
    
    const dateStart = parseDate(date);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const data = await collection.find({
      car: car,
      date: { $gte: dateStart, $lt: dateEnd }
    }).toArray();

    console.log(`📊 Found ${data.length} entries for report`);

    if (!data.length) {
      return res.status(404).json({ message: "No data for this date" });
    }

    const reportText = `Car Telemetry Report - ${car}
Date: ${new Date(date).toDateString()}
Total Entries: ${data.length}

${data.map((entry, i) => `
Entry ${i + 1}
Time: ${entry.timestamp || 'N/A'}
Speed: ${entry.speed || 'N/A'} MPH
RPM: ${entry.rpm || 'N/A'}
Temperature: ${entry.temperature || 'N/A'}°F
Fuel Level: ${entry.fuelLevel || 'N/A'}%
Lap Time: ${entry.lapTime || entry.lap_time || entry.lap || 'N/A'}
---`).join('\n')}

Generated: ${new Date().toLocaleString()}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${car}_${date}_report.txt"`);
    res.send(reportText);
    
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ message: "Error generating report: " + err.message });
  }
});

// ✅ Comparison report endpoint
app.get("/api/reports-compare/:car/:date1/:date2", requireAuth, async (req, res) => {
  try {
    const { car, date1, date2 } = req.params;
    console.log("📊 Generating comparison report for:", { car, date1, date2 });

    const collection = await getTelemetryCollection();

    const date1Start = parseDate(date1);
    const date1End = new Date(date1Start);
    date1End.setDate(date1End.getDate() + 1);
    
    const date2Start = parseDate(date2);
    const date2End = new Date(date2Start);
    date2End.setDate(date2End.getDate() + 1);

    const data1 = await collection.find({
      car: car,
      date: { $gte: date1Start, $lt: date1End }
    }).toArray();

    const data2 = await collection.find({
      car: car,
      date: { $gte: date2Start, $lt: date2End }
    }).toArray();

    console.log(`📊 Found ${data1.length} entries for date1, ${data2.length} for date2`);

    if (!data1.length || !data2.length) {
      return res.status(404).json({ message: "Insufficient data for comparison" });
    }

    const reportText = `Car Telemetry Comparison Report - ${car}
Date 1: ${new Date(date1).toDateString()} (${data1.length} entries)
Date 2: ${new Date(date2).toDateString()} (${data2.length} entries)

COMPARISON RESULTS:

Average Speed:
  ${date1}: ${calculateAverage(data1, 'speed')} MPH
  ${date2}: ${calculateAverage(data2, 'speed')} MPH
  Difference: ${calculateAverage(data2, 'speed') - calculateAverage(data1, 'speed')} MPH

Average RPM:
  ${date1}: ${calculateAverage(data1, 'rpm')} RPM
  ${date2}: ${calculateAverage(data2, 'rpm')} RPM
  Difference: ${calculateAverage(data2, 'rpm') - calculateAverage(data1, 'rpm')} RPM

Average Temperature:
  ${date1}: ${calculateAverage(data1, 'temperature')}°F
  ${date2}: ${calculateAverage(data2, 'temperature')}°F
  Difference: ${calculateAverage(data2, 'temperature') - calculateAverage(data1, 'temperature')}°F

Average Fuel Level:
  ${date1}: ${calculateAverage(data1, 'fuelLevel')}%
  ${date2}: ${calculateAverage(data2, 'fuelLevel')}%
  Difference: ${calculateAverage(data2, 'fuelLevel') - calculateAverage(data1, 'fuelLevel')}%

Generated: ${new Date().toLocaleString()}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${car}_${date1}_vs_${date2}_comparison.txt"`);
    res.send(reportText);
    
  } catch (err) {
    console.error("Comparison report error:", err);
    res.status(500).json({ message: "Error generating comparison report: " + err.message });
  }
});

// ============================================
// NEW FEATURES: AI INSIGHTS & GAMIFICATION
// ============================================

// ✅ AI Performance Insights endpoint
app.get("/api/insights/:date", requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const car = req.session.selectedCar;

    if (!car) {
      return res.status(400).json({ message: "No car selected" });
    }

    console.log("🧠 Generating insights for:", { car, date });

    const collection = await getTelemetryCollection();
    
    const dateStart = parseDate(date);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const telemetry = await collection.find({
      car: car,
      date: { $gte: dateStart, $lt: dateEnd }
    }).toArray();

    if (!telemetry.length) {
      return res.status(404).json({ message: "No data found for insights" });
    }

    // Calculate averages
    const avgSpeed = calculateAverage(telemetry, 'speed');
    const avgRpm = calculateAverage(telemetry, 'rpm');
    const avgTemp = calculateAverage(telemetry, 'temperature');
    const avgFuel = calculateAverage(telemetry, 'fuelLevel');

    // Generate AI-style insights
    const insights = [];
    
    if (avgTemp > 200)
      insights.push("⚠️ Temperature spikes detected – check your cooling system.");
    if (avgTemp > 220)
      insights.push("🔥 CRITICAL: Engine running dangerously hot!");
    if (avgSpeed < 100)
      insights.push("🐌 Lower average speed – possible cautious driving pattern.");
    if (avgSpeed > 180)
      insights.push("⚡ High-speed performance detected – excellent track conditions!");
    if (avgFuel < 30)
      insights.push("⛽ Fuel efficiency dropping – optimize acceleration habits.");
    if (avgFuel < 15)
      insights.push("⚠️ LOW FUEL WARNING – consider pit stop strategy.");
    if (avgRpm > 8500)
      insights.push("⚙️ High engine stress observed – smooth gear transitions recommended.");
    if (avgRpm > 9000)
      insights.push("🔴 RPM redlining frequently – risk of engine damage!");
    
    // Positive insights
    if (avgTemp < 180 && avgRpm < 8000)
      insights.push("✅ Excellent thermal management and smooth driving!");
    if (avgFuel > 60)
      insights.push("💚 Great fuel efficiency – optimal acceleration control.");
    
    if (!insights.length)
      insights.push("✅ Performance optimal – no irregularities detected.");

    console.log("✅ Generated", insights.length, "insights");

    res.json({
      car,
      date,
      avgSpeed,
      avgRpm,
      avgTemp,
      avgFuel,
      insights,
    });
  } catch (err) {
    console.error("Insights error:", err);
    res.status(500).json({ message: "Error generating insights: " + err.message });
  }
});

// ✅ Gamification endpoint
app.get("/api/gamification/:date", requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const car = req.session.selectedCar;

    if (!car) {
      return res.status(400).json({ message: "No car selected" });
    }

    console.log("🏆 Calculating gamification for:", { car, date });

    const collection = await getTelemetryCollection();
    
    const dateStart = parseDate(date);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const telemetry = await collection.find({
      car: car,
      date: { $gte: dateStart, $lt: dateEnd }
    }).toArray();

    if (!telemetry.length) {
      return res.status(404).json({ message: "No data found for gamification" });
    }

    const avgSpeed = calculateAverage(telemetry, 'speed');
    const avgRpm = calculateAverage(telemetry, 'rpm');
    const avgTemp = calculateAverage(telemetry, 'temperature');
    const avgFuel = calculateAverage(telemetry, 'fuelLevel');

    const gamification = calculatePerformancePoints({
      avgSpeed,
      avgRpm,
      avgTemp,
      avgFuel,
    });

    console.log("✅ Gamification result:", gamification);

    res.json({
      car,
      date,
      ...gamification,
      stats: { avgSpeed, avgRpm, avgTemp, avgFuel }
    });
  } catch (err) {
    console.error("Gamification error:", err);
    res.status(500).json({ message: "Error calculating gamification: " + err.message });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Using collection: ${TELEMETRY_COLLECTION}`);
});