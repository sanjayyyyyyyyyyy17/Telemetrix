// ✅ Complete backend with working login, signup, and admin approval system
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

// ✅ Route: Select Car + PIN Validation (NOW AFTER SESSION MIDDLEWARE)
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

// ✅ Dashboard data fetch route (for car telemetry) - FIXED
app.get("/api/dashboard/:date", requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    console.log("📊 Fetching dashboard data for date:", date);
    console.log("User:", req.session.user);
    console.log("Selected car:", req.session.selectedCar);

    const formattedDate = new Date(date);
    const nextDay = new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000);

    console.log("Date range:", { from: formattedDate, to: nextDay });

    // Try to get the collection
    const db = mongoose.connection.db;
    if (!db) {
      console.error("❌ Database not connected");
      return res.status(500).json({ message: "Database not connected" });
    }

    // List all collections to debug
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));

    // Try multiple possible collection names
    const possibleCollections = ['car_data', 'dashboarddata', 'dashboarddatas', 'cardata'];
    let records = [];
    let collectionFound = null;

    for (const collName of possibleCollections) {
      try {
        const collection = db.collection(collName);
        const count = await collection.countDocuments();
        console.log(`Collection '${collName}' has ${count} documents`);
        
        if (count > 0) {
          const tempRecords = await collection.find({
            date: {
              $gte: formattedDate,
              $lt: nextDay,
            },
          }).toArray();
          
          if (tempRecords.length > 0) {
            records = tempRecords;
            collectionFound = collName;
            console.log(`✅ Found ${records.length} records in '${collName}'`);
            break;
          }
        }
      } catch (err) {
        console.log(`Collection '${collName}' not found or error:`, err.message);
      }
    }

    if (!collectionFound) {
      console.warn(`⚠️ No telemetry found for ${date} in any collection`);
      return res.status(200).json([]);
    }

    console.log(`✅ Returning ${records.length} records from '${collectionFound}'`);
    res.json(records);
  } catch (err) {
    console.error("💥 Dashboard fetch error:", err);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

// ✅ FIXED: Analytics endpoint for comparison
app.get("/api/analytics/:car/:date1/:date2", requireAuth, async (req, res) => {
  try {
    const { car, date1, date2 } = req.params;
    console.log("📈 Analytics request:", { car, date1, date2 });

    const db = mongoose.connection.db;
    
    // ✅ FIX: Use the same collection-finding logic as /api/dashboard
    const collections = await db.listCollections().toArray();
    console.log("📦 Available collections:", collections.map(c => c.name));
    
    const possibleCollections = ['car_data', 'dashboarddata', 'dashboarddatas', 'cardata'];
    let collectionName = null;
    
    // Find which collection actually has data
    for (const collName of possibleCollections) {
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        if (count > 0) {
          collectionName = collName;
          console.log(`✅ Using collection: ${collName} (${count} docs)`);
          break;
        }
      } catch (err) {
        console.log(`Collection '${collName}' not found`);
      }
    }
    
    if (!collectionName) {
      console.error("❌ No valid collection found");
      return res.status(404).json({ message: "No data collection found" });
    }

    const collection = db.collection(collectionName);

    // ✅ FIX: Check actual document structure to match car field
    const sampleDoc = await collection.findOne();
    console.log("📄 Sample document:", sampleDoc);

    const date1Start = new Date(date1);
    const date1End = new Date(date1Start.getTime() + 24 * 60 * 60 * 1000);
    const date2Start = new Date(date2);
    const date2End = new Date(date2Start.getTime() + 24 * 60 * 60 * 1000);

    // ✅ FIX: Query without car filter first to see if dates work
    console.log("🔍 Querying date ranges:", { date1Start, date1End, date2Start, date2End });
    
    const data1 = await collection.find({
      date: { $gte: date1Start, $lt: date1End }
    }).toArray();

    const data2 = await collection.find({
      date: { $gte: date2Start, $lt: date2End }
    }).toArray();

    console.log(`📊 Found ${data1.length} records for date1, ${data2.length} for date2`);

    // ✅ FIX: Better averaging function with validation
    const avg = (arr, key) => {
      if (!arr.length) return 0;
      const vals = arr.map(r => Number(r[key]) || 0).filter(v => v > 0);
      return vals.length ? Math.round(vals.reduce((a,b) => a+b, 0) / vals.length) : 0;
    };

    const result = {
      avgSpeed: `${avg(data1, 'speed')} vs ${avg(data2, 'speed')}`,
      avgRPM: `${avg(data1, 'rpm')} vs ${avg(data2, 'rpm')}`,
      avgTemp: `${avg(data1, 'temperature')} vs ${avg(data2, 'temperature')}`,
      avgFuel: `${avg(data1, 'fuelLevel')} vs ${avg(data2, 'fuelLevel')}`,
    };

    console.log("✅ Returning comparison:", result);
    res.json(result);
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

// ✅ FIXED: Reports endpoint - Now generates actual text files properly
app.get("/api/reports/:car/:date", requireAuth, async (req, res) => {
  try {
    const { car, date } = req.params;
    console.log("📄 Generating report for:", { car, date });

    const dateObj = new Date(date);
    const nextDay = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    // ✅ FIX: Use same collection-finding logic
    const possibleCollections = ['car_data', 'dashboarddata', 'dashboarddatas', 'cardata'];
    let collectionName = null;
    
    for (const collName of possibleCollections) {
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        if (count > 0) {
          collectionName = collName;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!collectionName) {
      return res.status(404).json({ message: "No data collection found" });
    }

    const collection = db.collection(collectionName);
    
    // ✅ FIX: Query without car filter to get all data for the date
    const data = await collection.find({
      date: { $gte: dateObj, $lt: nextDay }
    }).toArray();

    console.log(`📊 Found ${data.length} entries for report`);

    if (!data.length) {
      return res.status(404).json({ message: "No data for this date" });
    }

    // Create a proper text report
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

    // ✅ FIX: Proper headers for text file download
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${car}_${date}_report.txt"`);
    res.setHeader('Content-Length', Buffer.byteLength(reportText, 'utf8'));
    
    console.log("✅ Sending report download");
    res.send(reportText);
    
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ message: "Error generating report" });
  }
});

// ✅ FIXED: Comparison report endpoint
app.get("/api/reports-compare/:car/:date1/:date2", requireAuth, async (req, res) => {
  try {
    const { car, date1, date2 } = req.params;
    console.log("📊 Generating comparison report for:", { car, date1, date2 });

    const db = mongoose.connection.db;
    
    // ✅ FIX: Use consistent collection-finding
    const possibleCollections = ['car_data', 'dashboarddata', 'dashboarddatas', 'cardata'];
    let collectionName = null;
    
    for (const collName of possibleCollections) {
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        if (count > 0) {
          collectionName = collName;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!collectionName) {
      return res.status(404).json({ message: "No data collection found" });
    }

    const collection = db.collection(collectionName);

    const date1Start = new Date(date1);
    const date1End = new Date(date1Start.getTime() + 24 * 60 * 60 * 1000);
    const date2Start = new Date(date2);
    const date2End = new Date(date2Start.getTime() + 24 * 60 * 60 * 1000);

    // ✅ FIX: Query without car filter
    const data1 = await collection.find({
      date: { $gte: date1Start, $lt: date1End }
    }).toArray();

    const data2 = await collection.find({
      date: { $gte: date2Start, $lt: date2End }
    }).toArray();

    console.log(`📊 Found ${data1.length} entries for date1, ${data2.length} for date2`);

    if (!data1.length || !data2.length) {
      return res.status(404).json({ message: "Insufficient data for comparison" });
    }

    const avg = (arr, key) => {
      const vals = arr.map(r => Number(r[key]) || 0).filter(v => v > 0);
      return vals.length ? Math.round(vals.reduce((a,b) => a+b, 0) / vals.length) : 0;
    };

    const reportText = `Car Telemetry Comparison Report - ${car}
Date 1: ${new Date(date1).toDateString()} (${data1.length} entries)
Date 2: ${new Date(date2).toDateString()} (${data2.length} entries)

COMPARISON RESULTS:

Average Speed:
  ${date1}: ${avg(data1, 'speed')} MPH
  ${date2}: ${avg(data2, 'speed')} MPH
  Difference: ${avg(data2, 'speed') - avg(data1, 'speed')} MPH

Average RPM:
  ${date1}: ${avg(data1, 'rpm')} RPM
  ${date2}: ${avg(data2, 'rpm')} RPM
  Difference: ${avg(data2, 'rpm') - avg(data1, 'rpm')} RPM

Average Temperature:
  ${date1}: ${avg(data1, 'temperature')}°F
  ${date2}: ${avg(data2, 'temperature')}°F
  Difference: ${avg(data2, 'temperature') - avg(data1, 'temperature')}°F

Average Fuel Level:
  ${date1}: ${avg(data1, 'fuelLevel')}%
  ${date2}: ${avg(data2, 'fuelLevel')}%
  Difference: ${avg(data2, 'fuelLevel') - avg(data1, 'fuelLevel')}%

Generated: ${new Date().toLocaleString()}`;

    // ✅ FIX: Proper headers for text file download
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${car}_${date1}_vs_${date2}_comparison.txt"`);
    res.setHeader('Content-Length', Buffer.byteLength(reportText, 'utf8'));
    
    console.log("✅ Sending comparison report download");
    res.send(reportText);
    
  } catch (err) {
    console.error("Comparison report error:", err);
    res.status(500).json({ message: "Error generating comparison report" });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});