// ============================================================
//  SMART CITY BACKEND SIMULATION (Python logic → JavaScript)
// ============================================================

const BACKEND = (() => {

  // ── Simulated Database ──────────────────────────────────────
  const DB = {
    users: [
      {
        id: 1,
        username: "admin",
        password: hashPassword("Admin@2025"),
        role: "admin",
        fullName: "System Administrator",
        email: "admin@smartcity.gov",
        district: "Central HQ",
        pincode: "560001",
        joined: "2024-01-01",
      },
      {
        id: 2,
        username: "john_doe",
        password: hashPassword("Citizen#01"),
        role: "citizen",
        fullName: "John Doe",
        email: "john.doe@smartcity.gov",
        district: "District 4",
        pincode: "682001",
        joined: "2025-03-15",
      },
    ],
    logs: [],
    emergencyActive: false,
    systemPower: 94,
    securityLevel: "ALPHA",
    aiBrainStatus: "ONLINE",
    sensorData: generateSensors(),
  };

  // ── SHA-256 Hashing (browser crypto) ──────────────────────
  function hashPassword(plain) {
    // For demo: simple deterministic hash using charCode sums
    let hash = 0;
    for (let i = 0; i < plain.length; i++) {
      const chr = plain.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return "HC$" + Math.abs(hash).toString(16).padStart(12, "0").toUpperCase();
  }

  function generateSensors() {
    return {
      airQuality: Math.floor(Math.random() * 40 + 60),      // 60-100
      noiseLevel: Math.floor(Math.random() * 50 + 30),      // 30-80 dB
      waterPressure: (Math.random() * 2 + 3).toFixed(2),    // 3-5 bar
      gridLoad: Math.floor(Math.random() * 40 + 50),        // 50-90%
      cameras: Math.floor(Math.random() * 10 + 90),         // 90-100% online
    };
  }

  // ── Python-equivalent Traffic Logic ───────────────────────
  function getTrafficLevel() {
    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return "HIGH";
    if ((hour >= 10 && hour <= 16) || (hour >= 20 && hour <= 22)) return "MEDIUM";
    return "LOW";
  }

  function getTimeCondition() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "MORNING_SHIFT";
    if (hour >= 12 && hour < 18) return "AFTERNOON_SHIFT";
    if (hour >= 18 && hour < 24) return "EVENING_SHIFT";
    return "NIGHT_SHIFT";
  }

  // ── Auth Logic ─────────────────────────────────────────────
  function register(username, password, fullName, email, district, pincode) {
    if (!username || !password || !fullName)
      return { success: false, message: "All fields are required." };
    if (username.length < 3)
      return { success: false, message: "Username must be at least 3 characters." };
    if (password.length < 6)
      return { success: false, message: "Password must be at least 6 characters." };
    if (DB.users.find((u) => u.username === username))
      return { success: false, message: "Username already exists." };

    const newUser = {
      id: DB.users.length + 1,
      username,
      password: hashPassword(password),
      role: "citizen",
      fullName,
      email: email || `${username}@smartcity.gov`,
      district: district || "District 1",
      pincode: pincode || "000000",
      joined: new Date().toISOString().split("T")[0],
    };
    DB.users.push(newUser);
    addLog("REGISTER", `New citizen registered: ${username}`, "INFO");
    return { success: true, message: "Registration successful! You can now log in." };
  }

  function login(username, password) {
    const user = DB.users.find((u) => u.username === username);
    if (!user) {
      addLog("LOGIN_FAIL", `Failed login attempt for: ${username}`, "WARNING");
      return { success: false, message: "User not found." };
    }
    if (user.password !== hashPassword(password)) {
      addLog("LOGIN_FAIL", `Wrong password for: ${username}`, "WARNING");
      return { success: false, message: "Incorrect password." };
    }
    addLog("LOGIN", `User logged in: ${username} [${user.role.toUpperCase()}]`, "INFO");
    // Return safe copy (no password)
    const { password: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  // ── System Actions (Admin only) ────────────────────────────
  function triggerEmergency(adminUser) {
    if (adminUser.role !== "admin")
      return { success: false, message: "ACCESS DENIED: Admin only." };
    DB.emergencyActive = !DB.emergencyActive;
    const state = DB.emergencyActive ? "ACTIVATED" : "DEACTIVATED";
    addLog("EMERGENCY", `Emergency Override ${state} by ${adminUser.username}`, "CRITICAL");
    return { success: true, emergencyActive: DB.emergencyActive, message: `Emergency ${state}` };
  }

  function changeSecurityLevel(adminUser, level) {
    if (adminUser.role !== "admin")
      return { success: false, message: "ACCESS DENIED." };
    const levels = ["ALPHA", "BETA", "GAMMA", "DELTA", "OMEGA"];
    if (!levels.includes(level)) return { success: false, message: "Invalid level." };
    DB.securityLevel = level;
    addLog("SECURITY", `Security level changed to ${level} by ${adminUser.username}`, "WARNING");
    return { success: true, securityLevel: level };
  }

  function toggleAIBrain(adminUser) {
    if (adminUser.role !== "admin")
      return { success: false, message: "ACCESS DENIED." };
    DB.aiBrainStatus = DB.aiBrainStatus === "ONLINE" ? "STANDBY" : "ONLINE";
    addLog("AI_BRAIN", `AI Brain set to ${DB.aiBrainStatus} by ${adminUser.username}`, "INFO");
    return { success: true, aiBrainStatus: DB.aiBrainStatus };
  }

  function refreshSensors() {
    DB.sensorData = generateSensors();
    return DB.sensorData;
  }

  // ── Logs ───────────────────────────────────────────────────
  function addLog(type, message, level = "INFO") {
    const now = new Date();
    DB.logs.unshift({
      id: DB.logs.length + 1,
      timestamp: now.toLocaleTimeString(),
      date: now.toLocaleDateString(),
      type,
      message,
      level,
    });
    if (DB.logs.length > 50) DB.logs.pop();
  }

  function getLogs() { return [...DB.logs]; }

  // ── Status Getters ─────────────────────────────────────────
  function getSystemStatus() {
    return {
      trafficLevel: getTrafficLevel(),
      timeCondition: getTimeCondition(),
      emergencyActive: DB.emergencyActive,
      systemPower: DB.systemPower,
      securityLevel: DB.securityLevel,
      aiBrainStatus: DB.aiBrainStatus,
      sensorData: DB.sensorData,
      timestamp: new Date().toLocaleString(),
    };
  }

  function getUsers() { return DB.users.map(({ password: _, ...u }) => u); }

  // Init logs
  addLog("SYSTEM", "Smart City OS v3.7 initialized", "INFO");
  addLog("SYSTEM", "All subsystems nominal", "INFO");

  return {
    register, login, triggerEmergency, changeSecurityLevel,
    toggleAIBrain, getSystemStatus, getLogs, getUsers,
    refreshSensors, addLog,
  };
})();
