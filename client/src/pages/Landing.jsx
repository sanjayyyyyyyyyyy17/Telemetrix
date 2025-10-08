import React from "react"
import { Link } from "react-router-dom"

export default function Landing() {
  return (
    <div className="bg-[#0f0f0f] text-white font-montserrat">
      {/* Minimal Navbar */}
      <nav className="fixed top-0 w-full bg-black/70 backdrop-blur-sm z-50 px-8 py-4 flex items-center">
        <span className="text-xl font-bold tracking-wider">TELEMETRIX</span>
      </nav>

      {/* Hero Section */}
      <section className="hero-bg h-screen flex flex-col justify-center items-center text-center px-6 bg-gradient-to-br from-black to-[#1a1a1a]">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">TELEMETRIX</h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">
          Telemetry and race analytics. Precision, speed, and insights
          built for champions.
        </p>
        <Link
          to="/login"
          className="bg-[#00BFFF] text-black px-8 py-3 rounded font-semibold hover:brightness-110 transition"
        >
          Get Started
        </Link>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 max-w-6xl mx-auto grid md:grid-cols-4 gap-10"
      >
        {/* About */}
        <div className="panel p-8 hover:scale-105 hover:shadow-xl transition transform duration-300">
          <div className="flex items-center mb-4">
            <span className="text-[#00BFFF] text-3xl mr-3">ℹ️</span>
            <h2 className="text-2xl font-bold">About</h2>
          </div>
          <p className="text-gray-400">
            TELEMETRIX is a modern racing telemetry platform. It lets teams and
            drivers log in, select cars, and analyze data through interactive
            dashboards — turning raw numbers into performance insights.
          </p>
        </div>

        {/* Analyze Trends */}
        <div className="panel p-8 hover:scale-105 hover:shadow-xl transition transform duration-300">
          <div className="flex items-center mb-4">
            <span className="text-[#00BFFF] text-3xl mr-3">📈</span>
            <h2 className="text-2xl font-bold">Analyze Trends</h2>
          </div>
          <p className="text-gray-400">
            Interactive charts and graphs let you review performance history and
            optimize strategies.
          </p>
        </div>

        {/* Race Overlays */}
        <div className="panel p-8 hover:scale-105 hover:shadow-xl transition transform duration-300">
          <div className="flex items-center mb-4">
            <span className="text-[#00BFFF] text-3xl mr-3">🏎️</span>
            <h2 className="text-2xl font-bold">Race Overlays</h2>
          </div>
          <p className="text-gray-400">
            Compare laps, visualize race lines, and identify opportunities for
            improvement with overlays.
          </p>
        </div>

        {/* THE CARS */}
        <div className="panel p-8 hover:scale-105 hover:shadow-xl transition transform duration-300">
          <div className="flex items-center mb-4">
            <span className="text-[#00BFFF] text-3xl mr-3">🚗</span>
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
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section
        id="cta"
        className="py-24 text-center bg-gradient-to-r from-[#111] to-[#222]"
      >
        <h2 className="text-4xl font-bold mb-6">Own the Race</h2>
        <p className="text-gray-400 mb-8">
          Get started today with TELEMETRIX and transform your racing
          experience.
        </p>
        <Link
          to="/login"
          className="bg-[#00BFFF] text-black px-8 py-3 rounded font-semibold hover:brightness-110 transition"
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm bg-black">
        © {new Date().getFullYear()} TELEMETRIX. All rights reserved.
      </footer>
    </div>
  )
}
