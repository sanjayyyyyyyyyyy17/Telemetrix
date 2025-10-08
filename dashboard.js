// index.js
// A full-stack web application with a login, interactive car selection page, and
// confidential dashboard data filtered by car. This version includes new
// detailed pages for each metric.
//
// ENHANCEMENTS: The UI/UX has been completely overhauled to create a premium,
// world-class feel. This includes a cohesive design language, advanced CSS
// animations, refined micro-interactions, and a professional-grade d3.js chart.
//
// To run this, you need to have Node.js and MongoDB installed.
// First, create a new folder and open a terminal inside it.
// Run 'npm init -y' to create a package.json file.
// Then, install the required packages with the following command:
// npm install express mongoose cors body-parser express-session

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');   // âœ… keep this one
const bodyParser = require('body-parser');
const session = require('express-session');


const app = express();
const PORT = 3000;

// --- Middleware Setup ---

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


// Session Middleware
app.use(session({
    secret: 'a_very_secret_key_that_is_long_and_random',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // In production, set to true with HTTPS
}));

// --- Hardcoded Credentials ---
const USERNAME = 'letsrace';
const PASSWORD = 'pesjago';
const PINS = {
    'THOR': '6107',
    'HAYA': '1718'
};

// --- MongoDB and Mongoose Setup ---
const mongoURI = 'mongodb://localhost:27017/car_data';

mongoose.connect(mongoURI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit();
    });

// Define a Mongoose Schema with additional data fields.
const dashboardSchema = new mongoose.Schema({
    car: String, // Field to store car name
    date: Date,
    speed: Number,
    avgSpeed: Number,
    rpm: Number,
    avgRpm: Number,
    lapTime: String,
    temperature: Number,
    fuelLevel: Number,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const DashboardData = mongoose.model('DashboardData', dashboardSchema);

// --- Authentication Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/');
}

// --- Frontend HTML & JavaScript ---

// LUXURY UI: Login Page with animated background and refined glassmorphism
const loginHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restricted Access | Race Analytics</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Orbitron:wght@400;700;900&display=swap');
        :root {
            --background-start: #0a0f1f;
            --background-end: #030408;
            --primary-glow: #6366f1;
            --text-primary: #e0e0e0;
            --text-secondary: #9e9e9e;
            --border-color: rgba(255, 255, 255, 0.1);
        }
        body {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, var(--background-start), var(--background-end));
            background-size: 200% 200%;
            animation: gradient-pan 15s ease infinite;
            overflow: hidden;
        }
        @keyframes gradient-pan {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .login-container {
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            background-color: rgba(17, 25, 40, 0.5);
            border: 1px solid var(--border-color);
            box-shadow: 0 0 80px rgba(0, 0, 0, 0.6);
            animation: fadeInUp 0.8s ease-out;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .login-title {
            font-family: 'Orbitron', sans-serif;
            font-weight: 900;
            color: var(--text-primary);
            text-shadow: 0 0 15px var(--primary-glow);
        }
        input {
            background-color: rgba(0, 0, 0, 0.2) !important;
            border: 1px solid var(--border-color) !important;
            color: var(--text-primary);
            transition: all 0.3s ease;
        }
        input:focus {
            border-color: var(--primary-glow) !important;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5), 0 0 15px rgba(99, 102, 241, 0.3) inset;
            background-color: rgba(0, 0, 0, 0.3) !important;
        }
        button {
            background: linear-gradient(90deg, #3b82f6, var(--primary-glow));
            transition: all 0.3s ease-in-out;
            letter-spacing: 1px;
            font-weight: 500;
            position: relative;
            overflow: hidden;
        }
        button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
        }
        button:before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 300%;
            height: 300%;
            background: rgba(255, 255, 255, 0.1);
            transform: translate(-50%, -50%) rotate(45deg);
            transition: all .5s ease;
            opacity: 0;
        }
        button:hover:before {
            width: 0;
            height: 0;
            opacity: 1;
        }
    </style>
</head>
<body class="text-white flex flex-col items-center justify-center min-h-screen p-4">
    <div class="login-container max-w-md w-full rounded-2xl p-8">
        <div class="flex justify-center mb-6">
            <svg class="w-24 h-24 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
        </div>
        <h1 class="login-title text-3xl font-bold text-center mb-2">PIT LANE ACCESS</h1>
        <p class="text-center text-gray-400 mb-6">Enter credentials to proceed</p>
        <form id="login-form" class="space-y-6">
            <div>
                <label for="username" class="block text-sm font-medium text-gray-400">Username</label>
                <input type="text" id="username" name="username" class="mt-1 block w-full rounded-md shadow-sm p-3" required>
            </div>
            <div>
                <label for="password" class="block text-sm font-medium text-gray-400">Password</label>
                <input type="password" id="password" name="password" class="mt-1 block w-full rounded-md shadow-sm p-3" required>
            </div>
            <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm text-white">
                AUTHENTICATE
            </button>
            <p id="message" class="text-center text-red-400 text-sm mt-4 h-4"></p>
        </form>
    </div>
    <script>
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageElement = document.getElementById('message');
            messageElement.textContent = '';

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    window.location.href = '/select-car';
                } else {
                    const data = await response.json();
                    messageElement.textContent = data.message;
                }
            } catch (error) {
                messageElement.textContent = 'Connection error. Please try again.';
            }
        });
    </script>
</body>
</html>
`;

// LUXURY UI: Car Selection with premium card design and hover effects
const selectCarHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Select Vehicle | Race Analytics</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@300;400;500&display=swap');
        :root {
            --background-start: #0a0f1f;
            --background-end: #030408;
            --primary-glow: #6366f1;
            --text-primary: #e0e0e0;
            --border-color: rgba(255, 255, 255, 0.1);
        }
        body {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, var(--background-start), var(--background-end));
            background-size: 200% 200%;
            animation: gradient-pan 15s ease infinite;
        }
        @keyframes gradient-pan {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .container {
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            background-color: rgba(17, 25, 40, 0.5);
            border: 1px solid var(--border-color);
            box-shadow: 0 0 80px rgba(0, 0, 0, 0.6);
            animation: fadeInUp 0.8s ease-out;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .card:before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
            transform: scale(0);
            transition: transform 0.5s ease;
        }
        .card:hover:before {
            transform: scale(1);
        }
        .card:hover {
            transform: translateY(-10px) scale(1.02);
            border-color: var(--primary-glow);
            box-shadow: 0 0 35px rgba(99, 102, 241, 0.4);
        }
        .card.selected {
            transform: translateY(-10px) scale(1.02);
            border-color: var(--primary-glow);
            background: rgba(99, 102, 241, 0.1);
            box-shadow: 0 0 35px rgba(99, 102, 241, 0.8);
        }
        .card-icon {
            filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
            transition: transform 0.3s ease;
        }
        .card:hover .card-icon {
            transform: scale(1.1);
        }
        .page-title {
            font-family: 'Orbitron', sans-serif;
            font-weight: 900;
        }
        input {
            background-color: rgba(0, 0, 0, 0.2) !important;
            border: 1px solid var(--border-color) !important;
            color: var(--text-primary);
            transition: all 0.3s ease;
        }
        input:focus {
            border-color: var(--primary-glow) !important;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
        }
        button {
            background: linear-gradient(90deg, #3b82f6, var(--primary-glow));
            transition: all 0.3s ease-in-out;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
        }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen p-8">
    <div class="container max-w-3xl w-full rounded-3xl p-10">
        <h1 class="page-title text-4xl font-bold text-center text-indigo-400 mb-8 tracking-wide">VEHICLE SELECTION</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div id="thor-card" class="card rounded-2xl p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 mx-auto text-indigo-400 mb-4 card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M15.5 8.5L12 12m0 0l-3.5 3.5M12 12l3.5 3.5M12 12L8.5 8.5"/>
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M16 8l-8 8m0-8l8 8"/>
                </svg>
                <h2 class="text-3xl font-bold font-['Orbitron']">THOR</h2>
            </div>
            <div id="haya-card" class="card rounded-2xl p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 mx-auto text-yellow-400 mb-4 card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z"/>
                    <path d="M14.5 9.5L12 12l-2.5 2.5"/>
                    <path d="M12 12l2.5-2.5"/>
                    <path d="M9.5 14.5L12 12"/>
                    <path d="M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
                </svg>
                <h2 class="text-3xl font-bold font-['Orbitron']">HAYA</h2>
            </div>
        </div>
        <form id="pin-form" class="space-y-6 mt-8 transition-opacity duration-500 opacity-0 h-0 overflow-hidden">
            <input type="hidden" id="car-selection" name="car">
            <div>
                <label for="pin-input" class="block text-sm font-medium text-center text-gray-400 mb-2">CONFIDENTIAL PIN</label>
                <input type="password" id="pin-input" name="pin" class="text-center tracking-[8px] mt-1 block w-full rounded-md shadow-sm p-3" required>
            </div>
            <button id="proceed-btn" type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-lg font-medium text-white">
                Access Dashboard
            </button>
            <p id="message" class="text-center text-red-400 text-sm mt-4 h-4"></p>
        </form>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const thorCard = document.getElementById('thor-card');
            const hayaCard = document.getElementById('haya-card');
            const carSelectionInput = document.getElementById('car-selection');
            const pinForm = document.getElementById('pin-form');
            const pinInput = document.getElementById('pin-input');
            const messageElement = document.getElementById('message');
            let selectedCar = null;

            const handleCarSelection = (car, card) => {
                thorCard.classList.remove('selected');
                hayaCard.classList.remove('selected');
                card.classList.add('selected');

                selectedCar = car;
                carSelectionInput.value = car;
                pinForm.classList.remove('opacity-0', 'h-0', 'overflow-hidden');
                messageElement.textContent = '';
                pinInput.focus();
            };

            thorCard.addEventListener('click', () => handleCarSelection('THOR', thorCard));
            hayaCard.addEventListener('click', () => handleCarSelection('HAYA', hayaCard));

            pinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const pin = pinInput.value;
                if (!selectedCar) {
                    messageElement.textContent = 'Please select a car first.';
                    return;
                }
                try {
                    const response = await fetch('/select-car', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ car: selectedCar, pin })
                    });
                    if (response.ok) {
                        window.location.href = '/dashboard';
                    } else {
                        const data = await response.json();
                        messageElement.textContent = data.message;
                    }
                } catch (error) {
                    messageElement.textContent = 'An error occurred. Please try again.';
                }
            });
        });
    </script>
</body>
</html>
`;

// LUXURY UI: Dashboard with holographic gauges, animated counters, and sleek table
const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Telemetry | Race Analytics</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@300;400;500&display=swap');
        :root {
            --background-start: #0a0f1f;
            --background-end: #030408;
            --primary-glow: #6366f1;
            --text-primary: #e0e0e0;
            --border-color: rgba(255, 255, 255, 0.1);
        }
        body {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, var(--background-start), var(--background-end));
        }
        .dashboard-container {
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            background-color: rgba(17, 25, 40, 0.6);
            border: 1px solid var(--border-color);
            box-shadow: 0 0 80px rgba(0, 0, 0, 0.6);
        }
        .welcome-title {
            font-family: 'Orbitron', sans-serif;
            font-weight: 900;
            animation: pulse-glow-subtle 4s infinite ease-in-out;
        }
        @keyframes pulse-glow-subtle {
            0%, 100% { text-shadow: 0 0 15px var(--primary-glow); }
            50% { text-shadow: 0 0 25px var(--primary-glow); }
        }
        .data-card {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-color);
            transition: all 0.3s ease-in-out;
            cursor: pointer;
        }
        .data-card:hover {
            transform: translateY(-8px) scale(1.03);
            box-shadow: 0 8px 25px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.5);
            border-color: var(--primary-glow);
            background: rgba(99,102,241, 0.1);
        }
        .gauge-ring {
            stroke-dasharray: 440;
            stroke-dashoffset: 440;
            transition: stroke-dashoffset 1.2s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .gauge-bg { stroke: rgba(255, 255, 255, 0.1); }
        .gauge-fill-speed { stroke: #3b82f6; filter: drop-shadow(0 0 5px #3b82f6); }
        .gauge-fill-rpm { stroke: #ef5350; filter: drop-shadow(0 0 5px #ef5350); }
        .gauge-fill-fuel { stroke: #66bb6a; filter: drop-shadow(0 0 5px #66bb6a); }
        .data-value {
            font-family: 'Orbitron', sans-serif;
            text-shadow: 0 0 8px rgba(255,255,255,0.4);
            font-weight: 700;
        }
        table { border-collapse: separate; border-spacing: 0 8px; }
        tbody tr {
            background: rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease-in-out;
        }
        tbody tr:hover {
            background: rgba(99, 102, 241, 0.1);
            transform: scale(1.01);
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        thead th {
            font-family: 'Orbitron', sans-serif;
            background: rgba(0, 0, 0, 0.3);
        }
        .clock-container { font-family: 'Orbitron', sans-serif; text-shadow: 0 0 10px var(--primary-glow); }
        #fetch-data-btn { background: linear-gradient(90deg, #3b82f6, var(--primary-glow)); }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen text-white p-8">
    <div class="dashboard-container max-w-7xl w-full p-10 mb-8 rounded-3xl">
        <div class="flex justify-between items-center mb-10">
            <h1 id="welcome-message" class="welcome-title text-5xl font-bold text-indigo-400 tracking-wider"></h1>
            <div id="live-clock" class="clock-container text-4xl font-bold text-right text-indigo-400"></div>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-center mb-12 space-y-4 md:space-y-0 md:space-x-6">
            <input type="date" id="race-date" class="bg-gray-800 border border-gray-700 text-white rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-lg">
            <button id="fetch-data-btn" class="hover:shadow-lg hover:shadow-indigo-500/50 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105">
                Fetch Telemetry
            </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
            <a href="#" id="avg-speed-link" class="flex flex-col items-center data-card p-4 rounded-2xl">
                <div class="relative w-40 h-40">
                    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" stroke-width="8" class="gauge-bg fill-transparent"></circle><circle cx="75" cy="75" r="70" stroke-width="8" class="gauge-ring gauge-fill-speed fill-transparent transform -rotate-90 origin-center"></circle></svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span id="avg-speed-value" class="data-value text-4xl text-indigo-300">0</span><span class="text-xs text-gray-400 mt-1">MPH (AVG)</span>
                    </div>
                </div>
                <h3 class="text-xl font-semibold mt-4">Average Speed</h3>
            </a>
            <a href="#" id="avg-rpm-link" class="flex flex-col items-center data-card p-4 rounded-2xl">
                <div class="relative w-40 h-40">
                    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" stroke-width="8" class="gauge-bg fill-transparent"></circle><circle cx="75" cy="75" r="70" stroke-width="8" class="gauge-ring gauge-fill-rpm fill-transparent transform -rotate-90 origin-center"></circle></svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span id="avg-rpm-value" class="data-value text-4xl text-red-300">0</span><span class="text-xs text-gray-400 mt-1">RPM (AVG)</span>
                    </div>
                </div>
                <h3 class="text-xl font-semibold mt-4">Average RPM</h3>
            </a>
            <div class="flex flex-col items-center data-card p-4 rounded-2xl">
                <div class="relative w-40 h-40 flex flex-col items-center justify-center"><span id="lap-time-value" class="data-value text-3xl text-yellow-300">0:00</span><span class="text-xs text-gray-400 mt-1">Last Lap</span></div>
                <h3 class="text-xl font-semibold mt-4">Lap Time</h3>
            </div>
            <a href="#" id="temperature-link" class="flex flex-col items-center data-card p-4 rounded-2xl">
                <div class="relative w-40 h-40 flex flex-col items-center justify-center"><span id="temperature-value" class="data-value text-4xl text-cyan-300">0</span><span class="text-xs text-gray-400 mt-1">Â°F</span></div>
                <h3 class="text-xl font-semibold mt-4">Temperature</h3>
            </a>
            <div class="flex flex-col items-center data-card p-4 rounded-2xl">
                <div class="relative w-40 h-40">
                    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" stroke-width="8" class="gauge-bg fill-transparent"></circle><circle cx="75" cy="75" r="70" stroke-width="8" class="gauge-ring gauge-fill-fuel fill-transparent transform -rotate-90 origin-center"></circle></svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span id="fuel-level-value" class="data-value text-4xl text-green-300">0</span><span class="text-xs text-gray-400 mt-1">%</span>
                    </div>
                </div>
                <h3 class="text-xl font-semibold mt-4">Fuel</h3>
            </div>
        </div>
        <div id="status-message" class="text-center text-sm text-gray-500 mt-10">Please select a date to view telemetry data.</div>
        <div class="flex justify-end mt-8">
            <button id="logout-btn" class="bg-red-800/50 hover:bg-red-600 border border-red-600/50 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-lg">Log Out</button>
        </div>
        <div id="data-table-container" class="mt-12 w-full opacity-0 transition-opacity duration-500">
            <h2 class="text-3xl font-bold text-center text-indigo-400 mb-6 font-['Orbitron']">Telemetry Log</h2>
            <div class="bg-black/20 rounded-lg shadow-xl p-6">
                <table class="w-full text-left text-gray-400">
                    <thead>
                        <tr>
                            <th class="py-3 px-6 rounded-l-lg">Time</th><th class="py-3 px-6">Speed</th><th class="py-3 px-6">RPM</th><th class="py-3 px-6">Lap Time</th><th class="py-3 px-6 rounded-r-lg">Temp (Â°F)</th>
                        </tr>
                    </thead>
                    <tbody id="race-log-body" class="text-gray-300 text-sm font-light"></tbody>
                </table>
            </div>
        </div>
    </div>
    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const ui = {
            avgSpeedVal: document.getElementById('avg-speed-value'),
            avgRpmVal: document.getElementById('avg-rpm-value'),
            lapTimeVal: document.getElementById('lap-time-value'),
            tempVal: document.getElementById('temperature-value'),
            fuelVal: document.getElementById('fuel-level-value'),
            welcomeMsg: document.getElementById('welcome-message'),
            statusMsg: document.getElementById('status-message'),
            dateInput: document.getElementById('race-date'),
            fetchBtn: document.getElementById('fetch-data-btn'),
            raceLogBody: document.getElementById('race-log-body'),
            tableContainer: document.getElementById('data-table-container'),
            avgSpeedLink: document.getElementById('avg-speed-link'),
            avgRpmLink: document.getElementById('avg-rpm-link'),
            tempLink: document.getElementById('temperature-link'),
            logoutBtn: document.getElementById('logout-btn'),
            avgSpeedRing: document.querySelector('.gauge-fill-speed'),
            avgRpmRing: document.querySelector('.gauge-fill-rpm'),
            fuelRing: document.querySelector('.gauge-fill-fuel'),
        };

        const animateCounter = (el, start, end, duration) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                el.innerText = Math.floor(progress * (end - start) + start);
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        };

        const setRingOffset = (ring, value, maxValue) => {
            const offset = 440 - (value / maxValue) * 440;
            ring.style.strokeDashoffset = offset;
        };

        const updateClock = () => {
            const clock = document.getElementById('live-clock');
            const now = new Date();
            clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        };
        updateClock();
        setInterval(updateClock, 1000);

        const resetUI = () => {
            animateCounter(ui.avgSpeedVal, parseInt(ui.avgSpeedVal.textContent), 0, 500);
            animateCounter(ui.avgRpmVal, parseInt(ui.avgRpmVal.textContent), 0, 500);
            animateCounter(ui.tempVal, parseInt(ui.tempVal.textContent), 0, 500);
            animateCounter(ui.fuelVal, parseInt(ui.fuelVal.textContent), 0, 500);
            ui.lapTimeVal.textContent = '0:00';
            setRingOffset(ui.avgSpeedRing, 0, 200);
            setRingOffset(ui.avgRpmRing, 0, 8000);
            setRingOffset(ui.fuelRing, 0, 100);
            ui.raceLogBody.innerHTML = '';
            ui.tableContainer.classList.add('opacity-0');
        };

        const fetchAndDisplayData = async () => {
            const selectedDate = ui.dateInput.value;
            if (!selectedDate) {
                ui.statusMsg.textContent = 'Please select a date.';
                return;
            }
            resetUI();
            ui.statusMsg.textContent = 'Fetching data...';

            try {
                const response = await fetch(\`/api/dashboard/\${selectedDate}\`);
                if (response.status === 401) { window.location.href = '/'; return; }
                if (response.status === 404) {
                    ui.statusMsg.textContent = 'No data found for this date. Please add data in MongoDB.';
                    return;
                }
                if (!response.ok) throw new Error('Failed to fetch data');
                
                const data = await response.json();
                ui.tableContainer.classList.remove('opacity-0');
                
                let totalSpeed = 0, totalRpm = 0;
                data.forEach(entry => {
                    totalSpeed += entry.speed;
                    totalRpm += entry.rpm;
                    const row = document.createElement('tr');
                    row.innerHTML = \`
                        <td class="py-3 px-6 rounded-l-lg">\${new Date(entry.timestamp).toLocaleTimeString()}</td>
                        <td class="py-3 px-6">\${entry.speed || '0'} MPH</td>
                        <td class="py-3 px-6">\${entry.rpm || '0'} RPM</td>
                        <td class="py-3 px-6">\${entry.lapTime || '0:00'}</td>
                        <td class="py-3 px-6 rounded-r-lg">\${entry.temperature || '0'} Â°F</td>
                    \`;
                    ui.raceLogBody.appendChild(row);
                });

                const count = data.length;
                const lastEntry = data[count - 1] || {};
                const avgSpeed = count > 0 ? (totalSpeed / count) : 0;
                const avgRpm = count > 0 ? (totalRpm / count) : 0;

                animateCounter(ui.avgSpeedVal, 0, Math.round(avgSpeed), 1000);
                animateCounter(ui.avgRpmVal, 0, Math.round(avgRpm), 1000);
                animateCounter(ui.tempVal, 0, lastEntry.temperature || 0, 1000);
                animateCounter(ui.fuelVal, 0, lastEntry.fuelLevel || 0, 1000);
                ui.lapTimeVal.textContent = lastEntry.lapTime || '0:00';

                setRingOffset(ui.avgSpeedRing, avgSpeed, 200);
                setRingOffset(ui.avgRpmRing, avgRpm, 8000);
                setRingOffset(ui.fuelRing, lastEntry.fuelLevel || 0, 100);

                ui.statusMsg.textContent = \`Displaying \${count} telemetry entries for \${new Date(data[0].date).toLocaleDateString()}.\`;
                
                const formattedDate = new Date(data[0].date).toISOString().split('T')[0];
                ui.avgSpeedLink.href = \`/dashboard/speed?date=\${formattedDate}\`;
                ui.avgRpmLink.href = \`/dashboard/rpm?date=\${formattedDate}\`;
                ui.tempLink.href = \`/dashboard/temperature?date=\${formattedDate}\`;
            } catch (error) {
                console.error('Error:', error);
                ui.statusMsg.textContent = 'Error fetching data. Check server connection.';
            }
        };

        const fetchWelcomeMessage = async () => {
            try {
                const response = await fetch('/api/welcome');
                const data = await response.json();
                ui.welcomeMsg.textContent = data.message;
            } catch (error) {
                ui.welcomeMsg.textContent = 'Race Car Dashboard';
            }
        };

        const handleLogout = async () => {
            await fetch('/logout', { method: 'POST' });
            window.location.href = '/';
        };

        ui.fetchBtn.addEventListener('click', fetchAndDisplayData);
        ui.logoutBtn.addEventListener('click', handleLogout);
        fetchWelcomeMessage();

        const today = new Date();
        ui.dateInput.value = today.toISOString().split('T')[0];
    });
    </script>
</body>
</html>
`;

// LUXURY UI: Detailed Metric Page with professional-grade d3.js chart
const metricDetailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metric Detail | Race Analytics</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@300;400;500&display=swap');
        :root {
            --background-start: #0a0f1f;
            --background-end: #030408;
            --primary-glow: #6366f1;
            --text-primary: #e0e0e0;
            --border-color: rgba(255, 255, 255, 0.1);
        }
        body {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, var(--background-start), var(--background-end));
        }
        .container {
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            background-color: rgba(17, 25, 40, 0.6);
            border: 1px solid var(--border-color);
            box-shadow: 0 0 80px rgba(0, 0, 0, 0.6);
        }
        .page-title { font-family: 'Orbitron', sans-serif; font-weight: 900; }
        .chart-container {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-color);
            min-height: 450px;
        }
        .chart-tooltip {
            background-color: rgba(0, 0, 0, 0.85);
            border: 1px solid var(--border-color);
            color: white;
            pointer-events: none;
            position: absolute;
            transform: translate(-50%, -120%);
            transition: opacity 0.2s;
        }
        .axis path, .axis line { stroke: rgba(255, 255, 255, 0.3); }
        .axis text { fill: rgba(255, 255, 255, 0.6); }
        .line-chart-path { stroke-width: 2.5px; }
        .grid line { stroke: rgba(255, 255, 255, 0.1); stroke-dasharray: 2,2; }
        thead th { font-family: 'Orbitron', sans-serif; background: rgba(0, 0, 0, 0.3); }
        tbody tr { background: rgba(0, 0, 0, 0.2); }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen text-white p-8">
    <div class="container max-w-7xl w-full p-10 mb-8 rounded-3xl">
        <h1 id="metric-title" class="page-title text-4xl font-bold text-center text-indigo-400 mb-8 tracking-wide"></h1>
        <div class="flex justify-start items-center mb-8">
            <a href="/dashboard" class="inline-block text-indigo-400 hover:text-indigo-200 transition-colors duration-200">&larr; Back to Dashboard</a>
        </div>
        <div id="status-message" class="text-center text-sm text-gray-500 mb-8">Fetching data...</div>
        <div id="chart-container" class="chart-container rounded-lg shadow-lg p-6">
            <svg id="metric-chart" class="w-full h-full"></svg>
        </div>
        <div class="bg-black/20 rounded-lg shadow-xl p-6 mt-8">
            <table class="w-full text-left text-gray-400">
                <thead><tr><th class="py-3 px-6 rounded-l-lg">Time</th><th id="metric-header" class="py-3 px-6 rounded-r-lg"></th></tr></thead>
                <tbody id="metric-data-body" class="text-gray-300 text-sm font-light"></tbody>
            </table>
        </div>
    </div>
    <div id="chart-tooltip" class="chart-tooltip hidden rounded-md p-3 text-sm"></div>

    <script>
    document.addEventListener('DOMContentLoaded', async () => {
        const ui = {
            title: document.getElementById('metric-title'),
            header: document.getElementById('metric-header'),
            body: document.getElementById('metric-data-body'),
            status: document.getElementById('status-message'),
            svg: d3.select("#metric-chart"),
            tooltip: d3.select("#chart-tooltip"),
        };
        const urlParams = new URLSearchParams(window.location.search);
        const date = urlParams.get('date');
        const metric = window.location.pathname.split('/').pop();

        if (!metric || !date) {
            ui.status.textContent = 'Invalid URL parameters.';
            return;
        }

        const capitalizedMetric = metric.charAt(0).toUpperCase() + metric.slice(1);
        ui.title.textContent = \`\${capitalizedMetric} Telemetry\`;
        ui.header.textContent = capitalizedMetric;
        const unitMap = { 'speed': 'MPH', 'rpm': 'RPM', 'temperature': 'Â°F' };

        try {
            const response = await fetch(\`/api/dashboard/\${metric}/\${date}\`);
            if (response.status === 401) { ui.status.textContent = 'Unauthorized.'; return; }
            if (response.status === 404) { ui.status.textContent = \`No \${metric} data found for this date.\`; return; }
            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            ui.body.innerHTML = '';
            data.forEach(entry => {
                ui.body.innerHTML += \`<tr><td class="py-3 px-6 rounded-l-lg">\${new Date(entry.timestamp).toLocaleTimeString()}</td><td class="py-3 px-6 rounded-r-lg">\${entry.value || '0'} \${unitMap[metric] || ''}</td></tr>\`;
            });
            ui.status.textContent = \`Displaying \${data.length} entries for \${new Date(date).toLocaleDateString()}.\`;

            // D3.js Charting
            const chartData = data.map(d => ({ timestamp: new Date(d.timestamp), value: d.value }));
            const margin = { top: 20, right: 40, bottom: 50, left: 60 };
            const width = ui.svg.node().clientWidth - margin.left - margin.right;
            const height = ui.svg.node().clientHeight - margin.top - margin.bottom;

            const x = d3.scaleTime().domain(d3.extent(chartData, d => d.timestamp)).range([0, width]);
            const y = d3.scaleLinear().domain([0, d3.max(chartData, d => d.value) * 1.1]).range([height, 0]);

            ui.svg.selectAll("*").remove();
            const g = ui.svg.append("g").attr("transform", \`translate(\${margin.left},\${margin.top})\`);
            
            // Gradient for Area Chart
            const gradient = ui.svg.append("defs").append("linearGradient")
                .attr("id", "area-gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
            gradient.append("stop").attr("offset", "0%").attr("stop-color", "var(--primary-glow)").attr("stop-opacity", 0.4);
            gradient.append("stop").attr("offset", "100%").attr("stop-color", "var(--primary-glow)").attr("stop-opacity", 0);

            // Grid lines
            g.append("g").attr("class", "grid").call(d3.axisLeft(y).tickSize(-width).tickFormat(""));
            g.append("g").attr("class", "grid").attr("transform", \`translate(0,\${height})\`).call(d3.axisBottom(x).tickSize(-height).tickFormat(""));

            g.append("g").attr("transform", \`translate(0,\${height})\`).call(d3.axisBottom(x)).attr("class", "axis");
            g.append("g").call(d3.axisLeft(y)).attr("class", "axis");

            const area = d3.area().x(d => x(d.timestamp)).y0(height).y1(d => y(d.value));
            const line = d3.line().x(d => x(d.timestamp)).y(d => y(d.value));

            g.append("path").datum(chartData).attr("fill", "url(#area-gradient)").attr("d", area);
            const path = g.append("path").datum(chartData)
                .attr("class", "line-chart-path").attr("fill", "none").attr("stroke", "var(--primary-glow)").attr("d", line);

            // Path animation
            const totalLength = path.node().getTotalLength();
            path.attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition().duration(2000).ease(d3.easeSin).attr("stroke-dashoffset", 0);

            // Interactive Crosshair and Tooltip
            const focus = g.append("g").style("display", "none");
            focus.append("line").attr("class", "x-hover-line hover-line").attr("y1", 0).attr("y2", height).attr("stroke", "white").attr("stroke-width", 1).attr("stroke-dasharray", "3,3");
            focus.append("circle").attr("r", 6).attr("fill", "var(--primary-glow)").attr("stroke", "white");

            ui.svg.append("rect").attr("transform", \`translate(\${margin.left},\${margin.top})\`)
                .attr("width", width).attr("height", height).style("fill", "none").style("pointer-events", "all")
                .on("mouseover", () => { focus.style("display", null); ui.tooltip.style("display", "block"); })
                .on("mouseout", () => { focus.style("display", "none"); ui.tooltip.style("display", "none"); })
                .on("mousemove", mousemove);
            
            const bisectDate = d3.bisector(d => d.timestamp).left;
            function mousemove(event) {
                const x0 = x.invert(d3.pointer(event, this)[0]);
                const i = bisectDate(chartData, x0, 1);
                const d0 = chartData[i - 1], d1 = chartData[i];
                const d = (d1 && (x0 - d0.timestamp > d1.timestamp - x0)) ? d1 : d0;
                
                focus.attr("transform", \`translate(\${x(d.timestamp)},0)\`);
                focus.select("circle").attr("transform", \`translate(0,\${y(d.value)})\`);
                
                ui.tooltip.html(\`\${d.value.toFixed(1)} \${unitMap[metric]} at \${d.timestamp.toLocaleTimeString()}\`)
                    .style("left", (x(d.timestamp) + margin.left) + "px")
                    .style("top", (y(d.value) + margin.top) + "px");
            }

        } catch (error) {
            console.error('Error:', error);
            ui.status.textContent = 'Error fetching data. Check server connection.';
        }
    });
    </script>
</body>
</html>
`;
app.use(bodyParser.json());


// --- Backend API Routes ---

app.get('/', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/select-car');
    }
    res.send(loginHtml);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === USERNAME && password === PASSWORD) {
        req.session.authenticated = true;
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Incorrect username or password.' });
    }
});

app.get('/select-car', isAuthenticated, (req, res) => {
    req.session.car = null;
    res.send(selectCarHtml);
});

app.post('/select-car', isAuthenticated, (req, res) => {
    const { car, pin } = req.body;
    if (PINS[car] && PINS[car] === pin) {
        req.session.car = car;
        res.status(200).json({ message: 'Car selected successfully' });
    } else {
        res.status(401).json({ message: 'Incorrect pin. Please try again.' });
    }
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    if (!req.session.car) {
        return res.redirect('/select-car');
    }
    res.send(dashboardHtml);
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.send('Logged out successfully.');
    });
});

app.get('/dashboard/:metric', isAuthenticated, (req, res) => {
    res.send(metricDetailHtml);
});

app.get('/api/welcome', isAuthenticated, (req, res) => {
    const car = req.session.car;
    let message = 'Race Car Dashboard';
    if (car === 'THOR') {
        message = 'THOR SYSTEMS ONLINE';
    } else if (car === 'HAYA') {
        message = 'HAYA TELEMETRY ACTIVE';
    }
    res.json({ message });
});

app.get('/api/dashboard/:date', isAuthenticated, async (req, res) => {
    try {
        const car = req.session.car;
        if (!car) {
             return res.status(401).json({ message: 'No car selected.' });
        }
        const dateString = req.params.date;
        const startOfDay = new Date(dateString);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(dateString);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        const dashboardData = await DashboardData.find({
            car: car,
            date: { // ✅ CORRECTED: Query the 'date' field
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({ timestamp: 1 });
        
        if (!dashboardData || dashboardData.length === 0) {
            return res.status(404).json({ message: 'No dashboard data found for this date.' });
        }
        res.json(dashboardData);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});

app.get('/api/dashboard/:metric/:date', isAuthenticated, async (req, res) => {
    try {
        const { metric, date } = req.params;
        const car = req.session.car;
        
        if (!car) {
            return res.status(401).json({ message: 'No car selected.' });
        }

        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        const validMetrics = ['speed', 'rpm', 'temperature', 'fuelLevel'];
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({ message: 'Invalid metric requested.' });
        }

        const dashboardData = await DashboardData.find({
            car: car,
            date: { // ✅ CORRECTED: Query the 'date' field
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({ timestamp: 1 }).select(`${metric} timestamp -_id`);
        
        if (!dashboardData || dashboardData.length === 0) {
            return res.status(404).json({ message: 'No data found for this metric and date.' });
        }
        
        const formattedData = dashboardData.map(doc => ({
            value: doc[metric],
            timestamp: doc.timestamp
        }));

        res.json(formattedData);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});
// Serve React build in production
app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Navigate to http://localhost:3000 to log in.');
});