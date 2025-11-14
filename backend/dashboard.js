// ✅ FIXED BACKEND - Full corrected dashboard.js with string date matching

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

// ✅ Correct telemetry collection name
const TELEMETRY_COLLECTION = "dashboarddatas";

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

// ✅ Session setup
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

// 🎯 CAR ACCESS PIN SYSTEM
const carPins = {
  THOR: "6107",
  HAYA: "1718",
  ODIN: "2023",
};

// ✅ UTILITY: Get telemetry collection
async function getTelemetryCollection() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  return db.collection(TELEMETRY_COLLECTION);
}

// ✅ UTILITY: Average calculator
function calculateAverage(arr, key) {
  if (!arr.length) return 0;
  const values = arr
    .map((r) => Number(r[key]) || 0)
    .filter((v) => v > 0);
  return values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;
}

// ✅ UTILITY: Gamification scoring
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

  // RPM scoring (0-20 points, lower is better)
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

// ✅ AUTO-CREATE DEFAULT ADMIN
async function ensureAdminExists() {
  const admin = await User.findOne({ username: "admin" });
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await User.create({
      username: "admin",
      password: hashed,
      role: "admin",
      approved: true,
    });
    console.log("🚨 DEFAULT ADMIN CREATED → username: admin | password: admin123");
  }
}
ensureAdminExists();

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// ✅ Default route
app.get("/", (req, res) => {
  res.send("🚗 Car Dashboard Backend is running.");
});

// ✅ Signup with requested role (driver / engineer)
app.post("/signup", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    if (!["driver", "engineer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selection." });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashed,
      role: "pending",
      pendingRole: role,
      approved: false,
    });

    await newUser.save();

    res.json({
      message: "Signup successful! Await admin approval before you can log in.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Login route
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

    // Allow admin even if not using approval
    if (!user.approved && user.role !== "admin") {
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

// ✅ Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("car_sid");
    res.json({ message: "Logged out successfully" });
  });
});
// ============================================
// CAR SELECTION & SESSION ROUTES
// ============================================

// ✅ Select Car + PIN (stores selectedCar in session)
app.post("/api/selectCar", requireAuth, (req, res) => {
  const { car, pin } = req.body;

  console.log("=== CAR SELECTION DEBUG ===");
  console.log("🚗 Car selection attempt:", { car, pin });
  console.log("Session user:", req.session.user);
  console.log("Available cars:", Object.keys(carPins));
  console.log("========================");

  if (!carPins[car]) {
    console.log("❌ Invalid car:", car);
    return res.status(400).json({ message: "Invalid car selected" });
  }

  if (String(carPins[car]) !== String(pin)) {
    console.log("❌ Incorrect PIN for:", car);
    return res.status(403).json({ message: "Invalid PIN" });
  }

  req.session.selectedCar = car;
  console.log(`✅ Car access granted for ${car}`);
  res.json({ message: `Access granted for ${car}` });
});

// ✅ Debug session route
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

// ✅ Get all users (admin only)
app.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ✅ Approve user (pendingRole → role)
app.post("/admin/approve/:username", requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.pendingRole) {
      return res
        .status(400)
        .json({ message: "User has no pending role to approve" });
    }

    user.role = user.pendingRole; // driver or engineer
    user.pendingRole = null;
    user.approved = true;

    await user.save();

    res.json({ message: `${username} approved as ${user.role}.` });
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ message: "Error approving user" });
  }
});
// ============================================
// DASHBOARD & TELEMETRY ROUTES
// ============================================

// ✅ Main dashboard data (+ gamification meta) - FIXED: String date matching
app.get("/api/dashboard/:date", requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const selectedCar = req.session.selectedCar;

    console.log("📊 Fetching dashboard data:", { date, car: selectedCar });
    console.log("📦 Using collection:", TELEMETRY_COLLECTION);

    if (!selectedCar) {
      return res
        .status(400)
        .json({ message: "No car selected. Please select a car first." });
    }

    const collection = await getTelemetryCollection();

    const records = await collection
      .find({
        car: selectedCar,
        date: { $eq: date }
      })
      .toArray();

    console.log(`✅ Found ${records.length} records for ${selectedCar} on ${date}`);

    if (!records.length) {
      return res.json({
        data: [],
        meta: { count: 0, date, car: selectedCar },
      });
    }

    const avgSpeed = calculateAverage(records, "speed");
    const avgRpm = calculateAverage(records, "rpm");
    const avgTemp = calculateAverage(records, "temperature");
    const avgFuel = calculateAverage(records, "fuelLevel");

    const gamification = calculatePerformancePoints({
      avgSpeed,
      avgRpm,
      avgTemp,
      avgFuel,
    });

    res.json({
      data: records,
      meta: {
        count: records.length,
        date,
        car: selectedCar,
        gamification,
      },
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

// ============================================
// REPORTS
// ============================================

// ✅ Text report for one date - FIXED: String date matching
app.get("/api/reports/:car/:date", requireAuth, async (req, res) => {
  try {
    const { car, date } = req.params;
    console.log("📄 Generating report for:", { car, date });

    const collection = await getTelemetryCollection();

    const data = await collection
      .find({
        car,
        date: { $eq: date }
      })
      .toArray();

    console.log(`📊 Found ${data.length} entries for report`);

    if (!data.length) {
      return res.status(404).json({ message: "No data for this date" });
    }

    const reportText = `Car Telemetry Report - ${car}
Date: ${new Date(date).toDateString()}
Total Entries: ${data.length}

${data
  .map(
    (entry, i) => `
Entry ${i + 1}
Time: ${entry.timestamp || "N/A"}
Speed: ${entry.speed || "N/A"}
RPM: ${entry.rpm || "N/A"}
Temperature: ${entry.temperature || "N/A"}
Fuel Level: ${entry.fuelLevel || "N/A"}
Lap Time: ${entry.lapTime || entry.lap_time || entry.lap || "N/A"}
---`
  )
  .join("\n")}

Generated: ${new Date().toLocaleString()}`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${car}_${date}_report.txt"`
    );
    res.send(reportText);
  } catch (err) {
    console.error("Report generation error:", err);
    res
      .status(500)
      .json({ message: "Error generating report: " + err.message });
  }
});

// ✅ Analytics/Comparison endpoint (what frontend actually calls)
app.get(
  "/api/analytics/:car/:date1/:date2",
  requireAuth,
  async (req, res) => {
    try {
      const { car, date1, date2 } = req.params;
      console.log("📊 Generating analytics/comparison for:", { car, date1, date2 });

      const collection = await getTelemetryCollection();

      // Debug: Check what dates exist in the database
      const allDates = await collection.distinct("date", { car });
      console.log("📅 Available dates in DB for", car, ":", allDates);

      const data1 = await collection
        .find({ car, date: { $eq: date1 } })
        .toArray();
      const data2 = await collection
        .find({ car, date: { $eq: date2 } })
        .toArray();

      console.log(
        `📊 Found ${data1.length} entries for date1 (${date1}), ${data2.length} for date2 (${date2})`
      );

      if (!data1.length && !data2.length) {
        return res.status(404).json({ 
          message: "No data found for either date",
          availableDates: allDates,
          requestedDates: { date1, date2 }
        });
      }

      if (!data1.length) {
        return res.status(404).json({ 
          message: `No data found for date1: ${date1}`,
          availableDates: allDates
        });
      }

      if (!data2.length) {
        return res.status(404).json({ 
          message: `No data found for date2: ${date2}`,
          availableDates: allDates
        });
      }

      const summary = {
        date1,
        date2,
        car,
        date1Data: {
          avgSpeed: calculateAverage(data1, "speed"),
          avgRpm: calculateAverage(data1, "rpm"),
          avgTemp: calculateAverage(data1, "temperature"),
          avgFuel: calculateAverage(data1, "fuelLevel"),
        },
        date2Data: {
          avgSpeed: calculateAverage(data2, "speed"),
          avgRpm: calculateAverage(data2, "rpm"),
          avgTemp: calculateAverage(data2, "temperature"),
          avgFuel: calculateAverage(data2, "fuelLevel"),
        },
      };

      res.json(summary);
    } catch (err) {
      console.error("Error generating analytics/comparison:", err);
      res.status(500).json({
        message: "Error generating comparison: " + err.message,
      });
    }
  }
);

// ✅ Comparison report for two dates - FIXED: String date matching (legacy route)
app.get(
  "/api/reports-compare/:car/:date1/:date2",
  requireAuth,
  async (req, res) => {
    try {
      const { car, date1, date2 } = req.params;
      console.log("📊 Generating comparison report for:", { car, date1, date2 });

      const collection = await getTelemetryCollection();

      // Debug: Check what dates exist in the database
      const allDates = await collection.distinct("date", { car });
      console.log("📅 Available dates in DB for", car, ":", allDates);

      const data1 = await collection
        .find({ car, date: { $eq: date1 } })
        .toArray();
      const data2 = await collection
        .find({ car, date: { $eq: date2 } })
        .toArray();

      console.log(
        `📊 Found ${data1.length} entries for date1 (${date1}), ${data2.length} for date2 (${date2})`
      );

      if (!data1.length && !data2.length) {
        return res.status(404).json({ 
          message: "No data found for either date",
          availableDates: allDates,
          requestedDates: { date1, date2 }
        });
      }

      if (!data1.length) {
        return res.status(404).json({ 
          message: `No data found for date1: ${date1}`,
          availableDates: allDates
        });
      }

      if (!data2.length) {
        return res.status(404).json({ 
          message: `No data found for date2: ${date2}`,
          availableDates: allDates
        });
      }

      const summary = {
        date1,
        date2,
        car,
        date1Data: {
          avgSpeed: calculateAverage(data1, "speed"),
          avgRpm: calculateAverage(data1, "rpm"),
          avgTemp: calculateAverage(data1, "temperature"),
          avgFuel: calculateAverage(data1, "fuelLevel"),
        },
        date2Data: {
          avgSpeed: calculateAverage(data2, "speed"),
          avgRpm: calculateAverage(data2, "rpm"),
          avgTemp: calculateAverage(data2, "temperature"),
          avgFuel: calculateAverage(data2, "fuelLevel"),
        },
      };

      res.json(summary);
    } catch (err) {
      console.error("Error generating comparison report:", err);
      res.status(500).json({
        message: "Error generating comparison report: " + err.message,
      });
    }
  }
);
// ============================================
// INSIGHTS & GAMIFICATION
// ============================================

// ✅ AI-style insights based on averages - Already correct with string date matching
app.get("/api/insights/:date", requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const car = req.session.selectedCar;

    if (!car) {
      return res.status(400).json({ message: "No car selected" });
    }

    console.log("🧠 Generating insights for:", { car, date });

    const collection = await getTelemetryCollection();

    const telemetry = await collection
      .find({
        car,
        date: date
      })
      .toArray();

    if (!telemetry.length) {
      return res.status(404).json({ message: "No data found for insights" });
    }

    const avgSpeed = calculateAverage(telemetry, "speed");
    const avgRpm = calculateAverage(telemetry, "rpm");
    const avgTemp = calculateAverage(telemetry, "temperature");
    const avgFuel = calculateAverage(telemetry, "fuelLevel");

    const insights = [];

    // Some rule-based insights:
    if (avgTemp > 200)
      insights.push("⚠️ Temperature spikes detected — check your cooling system.");
    if (avgTemp > 220)
      insights.push("🔥 CRITICAL: Engine running dangerously hot!");

    if (avgSpeed < 100)
      insights.push("🌐 Lower average speed — possible cautious driving pattern.");
    if (avgSpeed > 180)
      insights.push(
        "⚡ High-speed performance detected — excellent track conditions!"
      );

    if (avgFuel < 30)
      insights.push("⛽ Fuel efficiency dropping — optimize acceleration habits.");
    if (avgFuel < 15)
      insights.push("⚠️ LOW FUEL WARNING — consider pit stop strategy.");

    if (avgRpm > 8500)
      insights.push(
        "⚙️ High engine stress observed — smooth gear transitions recommended."
      );
    if (avgRpm > 9000)
      insights.push("🔴 RPM redlining frequently — risk of engine damage!");

    if (avgTemp < 180 && avgRpm < 8000)
      insights.push("✅ Excellent thermal management and smooth driving!");
    if (avgFuel > 60)
      insights.push("💚 Great fuel efficiency — optimal acceleration control.");

    if (!insights.length)
      insights.push("✅ Performance optimal — no irregularities detected.");

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
    res
      .status(500)
      .json({ message: "Error generating insights: " + err.message });
  }
});

// ✅ Gamification endpoint - Already correct with string date matching
app.get("/api/gamification/:date", requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const car = req.session.selectedCar;

    if (!car) {
      return res.status(400).json({ message: "No car selected" });
    }

    console.log("🏆 Calculating gamification for:", { car, date });

    const collection = await getTelemetryCollection();

    const telemetry = await collection
      .find({
        car,
        date: date
      })
      .toArray();

    if (!telemetry.length) {
      return res
        .status(404)
        .json({ message: "No data found for gamification" });
    }

    const avgSpeed = calculateAverage(telemetry, "speed");
    const avgRpm = calculateAverage(telemetry, "rpm");
    const avgTemp = calculateAverage(telemetry, "temperature");
    const avgFuel = calculateAverage(telemetry, "fuelLevel");

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
      gamification,
      stats: { avgSpeed, avgRpm, avgTemp, avgFuel },
    });
  } catch (err) {
    console.error("Gamification error:", err);
    res.status(500).json({
      message: "Error calculating gamification: " + err.message,
    });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Using collection: ${TELEMETRY_COLLECTION}`);
});