import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SelectCar from "./pages/SelectCar";
import Dashboard from "./pages/Dashboard";
import Cars from "./pages/Cars";
import SpeedDetail from "./pages/SpeedDetail";
import RpmDetail from "./pages/RpmDetail";
import LapTimeDetail from "./pages/LapTimeDetail";
import TemperatureDetail from "./pages/TemperatureDetail";
import FuelDetail from "./pages/FuelDetail";
import MetricDetail from "./pages/MetricDetail";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Landing />
            </motion.div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/select-car" element={<SelectCar />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/dashboard/speed" element={<SpeedDetail />} />
        <Route path="/dashboard/rpm" element={<RpmDetail />} />
        <Route path="/dashboard/lapTime" element={<LapTimeDetail />} />
        <Route path="/dashboard/temperature" element={<TemperatureDetail />} />
        <Route path="/dashboard/fuelLevel" element={<FuelDetail />} />
        <Route path="/dashboard/:metric" element={<MetricDetail />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
