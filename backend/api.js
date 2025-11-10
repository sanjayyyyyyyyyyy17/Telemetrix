import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import DashboardData from "./models/DashboardData.js";

const router = express.Router();

/* ========== GET DASHBOARD DATA ========== */
router.get("/dashboard/:date", async (req, res) => {
  try {
    const dateParam = new Date(req.params.date);
    const nextDay = new Date(dateParam.getTime() + 86400000);
    const data = await DashboardData.find({
      date: { $gte: dateParam, $lt: nextDay },
    }).lean();

    if (!data.length)
      return res.status(200).json({ message: "No telemetry found" });

    res.json(data);
  } catch (err) {
    console.error("Dashboard API error:", err);
    res.status(500).json({ message: "Error fetching telemetry data" });
  }
});

/* ========== HISTORICAL DATA ========== */
router.get("/historical/:car", async (req, res) => {
  try {
    const { car } = req.params;
    const stats = await DashboardData.aggregate([
      { $match: { car } },
      {
        $group: {
          _id: "$car",
          avgSpeed: { $avg: "$speed" },
          avgRpm: { $avg: "$rpm" },
          avgTemp: { $avg: "$temperature" },
          avgFuel: { $avg: "$fuelLevel" },
          sessions: { $sum: 1 },
        },
      },
    ]);
    res.json(stats[0] || { message: "No data found" });
  } catch (err) {
    console.error("Historical data error:", err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

/* ========== GENERATE PDF REPORT ========== */
router.get("/report/:car/:date", async (req, res) => {
  try {
    const { car, date } = req.params;
    const dateObj = new Date(date);
    const nextDay = new Date(dateObj.getTime() + 86400000);
    const data = await DashboardData.find({
      car,
      date: { $gte: dateObj, $lt: nextDay },
    }).lean();

    if (!data.length)
      return res.status(404).json({ message: "No data for this date" });

    const reportsDir = path.resolve("./backend/reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const filePath = path.join(reportsDir, `${car}_${date}.pdf`);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(22).text(`Car Telemetry Report - ${car}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Date: ${new Date(date).toDateString()}`);
    doc.moveDown();

    data.forEach((entry, i) => {
      doc.text(`Entry ${i + 1}`);
      doc.text(`Speed: ${entry.speed}`);
      doc.text(`RPM: ${entry.rpm}`);
      doc.text(`Temperature: ${entry.temperature}`);
      doc.text(`Fuel Level: ${entry.fuelLevel}`);
      doc.text(`Lap Time: ${entry.lapTime}`);
      doc.moveDown();
    });

    doc.end();
    res.json({ message: "Report generated", file: filePath });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ message: "Error generating report" });
  }
});

export default router;
