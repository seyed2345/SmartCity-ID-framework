# 🌆 SmartCity ID — Secure Identity Framework

A futuristic role-based access control (RBAC) system for a smart city,
built entirely in HTML, CSS, and JavaScript (with Python logic simulated in JS).

---

## 📁 Project Structure

```
smart-city-id/
├── index.html          ← Main application (all 4 pages)
├── css/
│   └── style.css       ← Futuristic dark UI styles + animations
├── js/
│   ├── backend.js      ← Python-equivalent backend logic (hashing, auth, sensors)
│   └── app.js          ← App controller, routing, UI interactions
└── README.md
```

---

## 🚀 How to Run

Just open `index.html` in any modern browser. No server required.

---

## 🔑 Demo Credentials

| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | Admin@2025  |
| Citizen | john_doe  | Citizen#01  |

Or register a new citizen account from the registration page.

---

## 🔐 Features

### Authentication
- Password hashing (deterministic hash simulation)
- Login with correct/incorrect feedback + shake animation
- Registration with validation (min length, password match)
- Password visibility toggle (👁/🙈)

### Citizen Dashboard
- View personal info (name, username, role, email, district)
- Read-only city status (AI Brain, Power, Security, Traffic)
- Emergency banner (triggered by admin)
- Auto-refreshing clock and status

### Admin Control Room
- 5 tabbed sections: Overview, Controls, Sensors, Logs, Users
- Emergency Override toggle (city-wide alert)
- AI Brain toggle (ONLINE ↔ STANDBY)
- Security Level selector (ALPHA → OMEGA)
- Live sensor data with animated bars (Air, Noise, Water, Grid, Cameras)
- Auto-refreshing activity logs
- User management table

### Python Logic (Simulated in JS)
- **Traffic Level**: Time-based (Low/Medium/High by hour)
- **Time Condition**: MORNING/AFTERNOON/EVENING/NIGHT_SHIFT
- **Emergency Flag**: Toggle with real-time propagation
- **Random Sensor Data**: Refreshes every 6 seconds

### Security Rules
- Role-based routing: citizens → citizen dashboard, admins → control room
- Admin controls are server-side enforced (role checked before each action)
- Citizens see read-only notice and cannot access any admin functions

---

## 🎨 UI Design Highlights
- Orbitron + Share Tech Mono + Rajdhani fonts
- Animated grid background + radial glow aura
- Glowing AI Brain orb with breathing animation
- Scan-line animation on auth card
- Toast notifications for all actions
- Page transition animations
- Animated sensor progress bars
- Emergency pulse animations
- Fully responsive (mobile-friendly)

---

## 📡 Tech Stack
- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript
- **Backend Logic**: JavaScript (simulating Python algorithms)
- **Fonts**: Google Fonts (Orbitron, Share Tech Mono, Rajdhani)
- **No dependencies**, no build tools needed
