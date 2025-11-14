import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Animation variants for staggering children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function Landing() {
  const accentColor = "#00BFFF"; // Deep Sky Blue

  return (
    <motion.div
      className="bg-[#0f0f0f] text-white font-montserrat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-black/50 backdrop-blur-lg z-50 px-8 py-4 flex items-center border-b border-white/10">
        <span className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          TELEMETRIX
        </span>
      </nav>

      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden
                         bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col items-center"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-[#00BFFF]"
            variants={itemVariants}
          >
            TELEMETRIX
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8"
            variants={itemVariants}
          >
            Telemetry and race analytics. Precision, speed, and insights
            built for champions.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link
              to="/login"
              className="bg-gradient-to-r from-[#00BFFF] to-[#0077B6] text-black px-8 py-3 rounded font-semibold 
                         shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40
                         hover:brightness-110 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 max-w-7xl mx-auto"
      >
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          {/* Feature Card: About */}
          <motion.div
            className="p-8 rounded-xl bg-black/30 border border-white/10 
                       hover:border-[#00BFFF]/50 hover:bg-black/40 
                       transition-all duration-300 transform hover:-translate-y-1"
            variants={itemVariants}
          >
            <div className="flex items-center mb-4">
              <span className="text-[#00BFFF] text-3xl mr-4">ℹ️</span>
              <h2 className="text-2xl font-bold">About</h2>
            </div>
            <p className="text-gray-400">
              TELEMETRIX is a modern racing telemetry platform. It lets teams and
              drivers log in, select cars, and analyze data through interactive
              dashboards — turning raw numbers into performance insights.
            </p>
          </motion.div>

          {/* Feature Card: Analyze Trends */}
          <motion.div
            className="p-8 rounded-xl bg-black/30 border border-white/10 
                       hover:border-[#00BFFF]/50 hover:bg-black/40 
                       transition-all duration-300 transform hover:-translate-y-1"
            variants={itemVariants}
          >
            <div className="flex items-center mb-4">
              <span className="text-[#00BFFF] text-3xl mr-4">📈</span>
              <h2 className="text-2xl font-bold">Analyze Trends</h2>
            </div>
            <p className="text-gray-400">
              Interactive charts and graphs let you review performance history and
              optimize strategies.
            </p>
          </motion.div>

          {/* Feature Card: Race Overlays */}
          <motion.div
            className="p-8 rounded-xl bg-black/30 border border-white/10 
                       hover:border-[#00BFFF]/50 hover:bg-black/40 
                       transition-all duration-300 transform hover:-translate-y-1"
            variants={itemVariants}
          >
            <div className="flex items-center mb-4">
              <span className="text-[#00BFFF] text-3xl mr-4">🏎️</span>
              <h2 className="text-2xl font-bold">Race Overlays</h2>
            </div>
            <p className="text-gray-400">
              Compare laps, visualize race lines, and identify opportunities for
              improvement with overlays.
            </p>
          </motion.div>

          {/* Feature Card: THE CARS */}
          <motion.div
            className="p-8 rounded-xl bg-black/30 border border-white/10 
                       hover:border-[#00BFFF]/50 hover:bg-black/40 
                       transition-all duration-300 transform hover:-translate-y-1"
            variants={itemVariants}
          >
            <div className="flex items-center mb-4">
              <span className="text-[#00BFFF] text-3xl mr-4">🚗</span>
              <h2 className="text-2xl font-bold">THE CARS</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Learn about the engineering and design of the cars that power racing
              excellence.
            </p>
            <Link
              to="/cars"
              className="text-[#00BFFF] font-semibold hover:underline"
            >
              Explore →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Call-to-Action Section */}
      <section
        id="cta"
        className="py-24 text-center bg-gradient-to-r from-gray-950 via-black to-gray-950 border-y border-white/10"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={containerVariants}
          className="flex flex-col items-center"
        >
          <motion.h2 className="text-4xl font-bold mb-6" variants={itemVariants}>
            Own the Race
          </motion.h2>
          <motion.p className="text-gray-400 mb-8" variants={itemVariants}>
            Get started today with TELEMETRIX and transform your racing
            experience.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link
              to="/login"
              className="bg-gradient-to-r from-[#00BFFF] to-[#0077B6] text-black px-8 py-3 rounded font-semibold 
                         shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40
                         hover:brightness-110 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm bg-black border-t border-white/10">
        © {new Date().getFullYear()} TELEMETRIX. All rights reserved.
      </footer>
    </motion.div>
  );
}