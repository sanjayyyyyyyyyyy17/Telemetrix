import React from "react"
import { motion } from "framer-motion"

export default function Cars() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0f0f0f] to-black text-white overflow-hidden font-montserrat">
      {/* subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1a1a1a_1px,transparent_0)]
                       [background-size:40px_40px] opacity-20" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-extrabold tracking-wide mb-12 
                     bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 
                     bg-clip-text text-transparent"
        >
          THE CARS
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-16 text-left max-w-3xl mx-auto leading-relaxed text-lg"
        >
          {/* === Ferrari themed Haya === */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#7a0c0c] via-[#b11212] to-[#ff2800] shadow-lg">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-wide">Team Haya Racing</h2>
            <p className="mb-2 text-red-100">
              <span className="font-semibold text-white">Focus:</span> Combustion Formula cars built for speed and precision.
            </p>
            <p className="mb-4 text-red-100">
              <span className="font-semibold text-white">Competitions:</span> National events such as Supra SAEIndia.
            </p>
            <div className="space-y-1 text-red-50">
              <p className="font-semibold text-white">What They Do:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Design and engineer Formula-style race cars from scratch.</li>
                <li>Fabricate and assemble every component in-house.</li>
                <li>Test, refine, and race to achieve peak performance.</li>
              </ul>
            </div>
          </div>

          {/* === Mercedes themed Thor === */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] shadow-lg">
            <h2 className="text-3xl font-bold text-[#c0c0c0] mb-3 tracking-wide">Team Haya Off-Roading — Thor PESU</h2>
            <p className="mb-2 text-gray-200">
              <span className="font-semibold text-teal-300">Focus:</span> Baja off-road vehicles built for rugged endurance.
              Solar-electric vehicles designed for sustainable racing.
            </p>
            <p className="mb-4 text-gray-200">
              <span className="font-semibold text-teal-300">Competitions:</span> Baja SAE and ESVC solar championships.
            </p>
            <div className="space-y-1 text-gray-100">
              <p className="font-semibold text-teal-300">What They Do:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Build machines that conquer extreme terrain and harsh conditions.</li>
                <li>Innovate with clean-energy systems and advanced materials.</li>
                <li>Balance power, durability, and efficiency in every build.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}