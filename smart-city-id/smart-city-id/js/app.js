// ============================================================
//  SMART CITY APP CONTROLLER
// ============================================================

const APP = (() => {
  let currentUser = null;
  let sensorInterval = null;
  let clockInterval = null;
  let statusInterval = null;

  // ── Page Router ────────────────────────────────────────────
  function showPage(pageId) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add("active");
      page.classList.remove("page-enter");
      void page.offsetWidth;
      page.classList.add("page-enter");
    }
  }

  // ── Auth Handlers ──────────────────────────────────────────
  function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    showFieldFeedback("login-username", true);
    showFieldFeedback("login-password", true);

    if (!username || !password) {
      showAlert("login-alert", "Please fill in all fields.", "error");
      return;
    }

    const result = BACKEND.login(username, password);
    if (result.success) {
      currentUser = result.user;
      showAlert("login-alert", `Welcome back, ${currentUser.fullName}! Redirecting...`, "success");
      playBeep("success");
      setTimeout(() => {
        if (currentUser.role === "admin") {
          initAdminDashboard();
          showPage("admin-page");
        } else {
          initCitizenDashboard();
          showPage("citizen-page");
        }
        document.getElementById("login-username").value = "";
        document.getElementById("login-password").value = "";
      }, 1000);
    } else {
      showAlert("login-alert", result.message, "error");
      playBeep("error");
      shakeElement("login-form");
    }
  }

  function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirmPw = document.getElementById("reg-confirm").value;
    const fullName = document.getElementById("reg-fullname").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const district = document.getElementById("reg-district").value;
    const pincode = document.getElementById("reg-pincode").value.trim();

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
      showAlert("reg-alert", "Pincode must be exactly 6 digits.", "error");
      shakeElement("register-form");
      return;
    }
    if (password !== confirmPw) {
      showAlert("reg-alert", "Passwords do not match.", "error");
      shakeElement("register-form");
      return;
    }

    const result = BACKEND.register(username, password, fullName, email, district, pincode);
    if (result.success) {
      showAlert("reg-alert", result.message, "success");
      playBeep("success");
      setTimeout(() => showPage("login-page"), 1500);
    } else {
      showAlert("reg-alert", result.message, "error");
      shakeElement("register-form");
    }
  }

  function handleLogout() {
    BACKEND.addLog("LOGOUT", `User logged out: ${currentUser.username}`, "INFO");
    currentUser = null;
    clearIntervals();
    showPage("login-page");
    playBeep("neutral");
  }

  // ── Citizen Dashboard ──────────────────────────────────────
  function initCitizenDashboard() {
    const status = BACKEND.getSystemStatus();
    const u = currentUser;

    document.getElementById("c-welcome").textContent = `Welcome, ${u.fullName}`;
    document.getElementById("c-username").textContent = u.username;
    document.getElementById("c-role").textContent = u.role.toUpperCase();
    document.getElementById("c-fullname").textContent = u.fullName;
    document.getElementById("c-email").textContent = u.email;
    document.getElementById("c-district").textContent = u.district;
    document.getElementById("c-joined").textContent = u.joined;

    updateCitizenStatus(status);
    startCitizenUpdates();
  }

  function updateCitizenStatus(status) {
    const trafficEl = document.getElementById("c-traffic");
    if (trafficEl) {
      trafficEl.textContent = status.trafficLevel;
      trafficEl.className = "stat-value traffic-" + status.trafficLevel.toLowerCase();
    }
    setIfExists("c-time-cond", status.timeCondition.replace("_", " "));
    setIfExists("c-ai-status", status.aiBrainStatus);
    setIfExists("c-power", status.systemPower + "%");
    setIfExists("c-security", status.securityLevel);
    setIfExists("c-timestamp", status.timestamp);

    const emergBanner = document.getElementById("c-emergency-banner");
    if (emergBanner) {
      emergBanner.style.display = status.emergencyActive ? "flex" : "none";
    }
  }

  function startCitizenUpdates() {
    sensorInterval = setInterval(() => {
      const status = BACKEND.getSystemStatus();
      updateCitizenStatus(status);
    }, 5000);
    startClock("c-clock");
  }

  // ── Admin Dashboard ────────────────────────────────────────
  function initAdminDashboard() {
    updateAdminStatus();
    renderLogs();
    renderUsers();
    updateSensorDisplay();
    startAdminUpdates();

    document.getElementById("a-admin-name").textContent = currentUser.fullName;
  }

  function updateAdminStatus() {
    const status = BACKEND.getSystemStatus();
    setIfExists("a-traffic", status.trafficLevel);
    const tEl = document.getElementById("a-traffic");
    if (tEl) tEl.className = "stat-value traffic-" + status.trafficLevel.toLowerCase();

    setIfExists("a-time-cond", status.timeCondition.replace("_", " "));
    setIfExists("a-ai-status", status.aiBrainStatus);
    setIfExists("a-power", status.systemPower + "%");
    setIfExists("a-security", status.securityLevel);
    setIfExists("a-timestamp", status.timestamp);
    setIfExists("a-emergency-state",
      status.emergencyActive ? "⚠ ACTIVE" : "✔ STANDBY");

    const emBadge = document.getElementById("a-emergency-state");
    if (emBadge) {
      emBadge.className = "stat-value " + (status.emergencyActive ? "emergency-on" : "emergency-off");
    }
    setIfExists("a-user-count", BACKEND.getUsers().length);
  }

  function updateSensorDisplay() {
    const s = BACKEND.getSystemStatus().sensorData;
    setIfExists("s-air", s.airQuality + " AQI");
    setIfExists("s-noise", s.noiseLevel + " dB");
    setIfExists("s-water", s.waterPressure + " bar");
    setIfExists("s-grid", s.gridLoad + "%");
    setIfExists("s-cameras", s.cameras + "% online");
    updateSensorBars(s);
  }

  function updateSensorBars(s) {
    animateBar("bar-air", s.airQuality);
    animateBar("bar-noise", Math.min(100, (s.noiseLevel / 100) * 100));
    animateBar("bar-water", Math.min(100, (s.waterPressure / 5) * 100));
    animateBar("bar-grid", s.gridLoad);
    animateBar("bar-cameras", s.cameras);
  }

  function animateBar(id, pct) {
    const el = document.getElementById(id);
    if (el) {
      el.style.width = pct + "%";
      el.className = "sensor-bar-fill " + (pct > 85 ? "bar-high" : pct > 60 ? "bar-med" : "bar-low");
    }
  }

  function renderLogs() {
    const logs = BACKEND.getLogs();
    const container = document.getElementById("log-container");
    if (!container) return;
    container.innerHTML = logs.map((l) => `
      <div class="log-entry log-${l.level.toLowerCase()}">
        <span class="log-time">${l.date} ${l.timestamp}</span>
        <span class="log-type">[${l.type}]</span>
        <span class="log-level badge-${l.level.toLowerCase()}">${l.level}</span>
        <span class="log-msg">${l.message}</span>
      </div>
    `).join("");
  }

  function renderUsers() {
    const users = BACKEND.getUsers();
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;
    tbody.innerHTML = users.map((u) => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.fullName}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>${u.district}</td>
        <td>${u.pincode || "—"}</td>
        <td>${u.joined}</td>
      </tr>
    `).join("");
  }

  function startAdminUpdates() {
    statusInterval = setInterval(() => {
      updateAdminStatus();
      renderLogs();
    }, 4000);
    sensorInterval = setInterval(() => {
      BACKEND.refreshSensors();
      updateSensorDisplay();
    }, 6000);
    startClock("a-clock");
  }

  // ── Admin Controls ─────────────────────────────────────────
  window.triggerEmergency = function () {
    const result = BACKEND.triggerEmergency(currentUser);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) {
      updateAdminStatus();
      renderLogs();
      const btn = document.getElementById("btn-emergency");
      if (btn) {
        btn.textContent = result.emergencyActive ? "⚠ DEACTIVATE EMERGENCY" : "🚨 TRIGGER EMERGENCY";
        btn.classList.toggle("emergency-active", result.emergencyActive);
      }
    }
  };

  window.changeSecurityLevel = function (level) {
    const result = BACKEND.changeSecurityLevel(currentUser, level);
    showToast(result.success ? `Security → ${level}` : result.message,
      result.success ? "success" : "error");
    if (result.success) { updateAdminStatus(); renderLogs(); }
  };

  window.toggleAIBrain = function () {
    const result = BACKEND.toggleAIBrain(currentUser);
    showToast(result.success ? `AI Brain: ${result.aiBrainStatus}` : result.message,
      result.success ? "info" : "error");
    if (result.success) { updateAdminStatus(); renderLogs(); }
  };

  window.refreshSensorData = function () {
    BACKEND.refreshSensors();
    updateSensorDisplay();
    showToast("Sensor data refreshed", "info");
  };

  // ── UI Utilities ───────────────────────────────────────────
  function showAlert(id, msg, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = "alert alert-" + type;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
  }

  function showToast(msg, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("toast-show"), 10);
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  function showFieldFeedback(id, valid) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("input-valid", valid);
  }

  function shakeElement(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 600);
  }

  function setIfExists(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function startClock(id) {
    clockInterval = setInterval(() => {
      setIfExists(id, new Date().toLocaleTimeString());
    }, 1000);
  }

  function clearIntervals() {
    clearInterval(sensorInterval);
    clearInterval(clockInterval);
    clearInterval(statusInterval);
  }

  function playBeep(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === "success" ? 880 : type === "error" ? 220 : 440;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }

  // ── Tab switching ──────────────────────────────────────────
  window.switchTab = function (tabId, btn) {
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add("active");
    if (btn) btn.classList.add("active");
  };

  // ── Init ───────────────────────────────────────────────────
  function init() {
    document.getElementById("login-form")?.addEventListener("submit", handleLogin);
    document.getElementById("register-form")?.addEventListener("submit", handleRegister);
    document.getElementById("btn-logout-citizen")?.addEventListener("click", handleLogout);
    document.getElementById("btn-logout-admin")?.addEventListener("click", handleLogout);

    // Password toggle
    document.querySelectorAll(".toggle-pw").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.previousElementSibling;
        if (input) {
          input.type = input.type === "password" ? "text" : "password";
          btn.textContent = input.type === "password" ? "👁" : "🙈";
        }
      });
    });

    showPage("login-page");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", APP.init);
