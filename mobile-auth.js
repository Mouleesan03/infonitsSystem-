(function () {
  const AUTH_SESSION_KEY = "infonits.loggedInUserId";
  const AUTH_SESSION_META_KEY = "infonits.mobileSessionMeta";
  const KEEP_SIGNED_IN_KEY = "infonits.mobileKeepSignedIn";
  const IDLE_LOGOUT_MS = 10 * 60 * 1000;
  const PASSWORD_MIN_LENGTH = 8;

  function cfg() {
    return window.INFONITS_SUPABASE || {};
  }

  function ready() {
    const c = cfg();
    return Boolean(c.url && c.anonKey);
  }

  function api(path) {
    return `${cfg().url}/rest/v1/${path}`;
  }

  function headers(extra) {
    return {
      apikey: cfg().anonKey,
      Authorization: `Bearer ${cfg().anonKey}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function readStoredSession() {
    const sessionId = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY) || "";
    const rawMeta = sessionStorage.getItem(AUTH_SESSION_META_KEY) || localStorage.getItem(AUTH_SESSION_META_KEY) || "";
    let meta = {};
    try {
      meta = rawMeta ? JSON.parse(rawMeta) : {};
    } catch (_error) {
      meta = {};
    }
    return { sessionId, meta };
  }

  function writeStoredSession(userId, keepSignedIn) {
    const meta = JSON.stringify({ userId, lastActiveAt: nowIso() });
    sessionStorage.setItem(AUTH_SESSION_KEY, userId);
    sessionStorage.setItem(AUTH_SESSION_META_KEY, meta);
    if (keepSignedIn) {
      localStorage.setItem(AUTH_SESSION_KEY, userId);
      localStorage.setItem(AUTH_SESSION_META_KEY, meta);
      localStorage.setItem(KEEP_SIGNED_IN_KEY, "yes");
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_SESSION_META_KEY);
      localStorage.removeItem(KEEP_SIGNED_IN_KEY);
    }
  }

  function touchSession() {
    const current = readStoredSession();
    if (!current.sessionId) return;
    const keepSignedIn = localStorage.getItem(KEEP_SIGNED_IN_KEY) === "yes";
    writeStoredSession(current.sessionId, keepSignedIn);
  }

  function clearSession() {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_META_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_META_KEY);
    localStorage.removeItem(KEEP_SIGNED_IN_KEY);
  }

  function legacyEncodePassword(password) {
    return btoa(unescape(encodeURIComponent(String(password || ""))));
  }

  function isLegacyPasswordHash(value) {
    return value && !String(value).startsWith("sha256:");
  }

  function isDefaultPassword(username, password) {
    const defaults = {
      admin: "admin123",
      manager: "manager123",
      designer: "designer123",
      developer: "developer123",
    };
    return defaults[String(username || "").trim().toLowerCase()] === String(password || "");
  }

  function sha256Hex(value) {
    const bytes = unescape(encodeURIComponent(value))
      .split("")
      .map((char) => char.charCodeAt(0));
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    for (let shift = 56; shift >= 0; shift -= 8) {
      bytes.push((bitLength / 2 ** shift) & 255);
    }
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let offset = 0; offset < bytes.length; offset += 64) {
      const w = new Array(64);
      for (let i = 0; i < 16; i += 1) {
        const j = offset + i * 4;
        w[i] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i += 1) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;
      let f = h5;
      let g = h6;
      let h = h7;
      for (let i = 0; i < 64; i += 1) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + k[i] + w[i]) >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }
      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
      h5 = (h5 + f) >>> 0;
      h6 = (h6 + g) >>> 0;
      h7 = (h7 + h) >>> 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((p) => p.toString(16).padStart(8, "0")).join("");
  }

  async function hashPassword(password = "") {
    const value = `infonits-local-auth:${password}`;
    if (window.crypto?.subtle && window.TextEncoder) {
      const bytes = new TextEncoder().encode(value);
      const digest = await window.crypto.subtle.digest("SHA-256", bytes);
      const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      return `sha256:${hash}`;
    }
    return `sha256:${sha256Hex(value)}`;
  }

  function passwordMatches(user, password, hashedPassword) {
    const savedHash = user.passwordHash || "";
    if (savedHash === hashedPassword) return true;
    if (isLegacyPasswordHash(savedHash)) return savedHash === legacyEncodePassword(password);
    return false;
  }

  function normalizeUserRow(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    return {
      id: payload.id || row.app_id || row.id || "",
      name: payload.name || row.name || "User",
      username: payload.username || row.username || "",
      email: payload.email || row.email || "",
      role: payload.role || row.role || "project-manager",
      status: payload.status || row.status || "Active",
      passwordHash: payload.passwordHash || row.password_hash || "",
      mustChangePassword: Boolean(payload.mustChangePassword),
      updatedAt: payload.updatedAt || row.updated_at || "",
    };
  }

  async function loadUsers() {
    const res = await fetch(api("app_users?select=app_id,id,name,username,email,role,status,password_hash,payload,updated_at"), { headers: headers() });
    if (!res.ok) throw new Error("Unable to load users");
    return (await res.json()).map(normalizeUserRow);
  }

  async function updateUserPassword(user, nextPasswordHash) {
    const nextPayload = {
      ...(user.rawPayload || {}),
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      passwordHash: nextPasswordHash,
      mustChangePassword: false,
      lastLoginAt: nowIso(),
      updatedAt: nowIso(),
    };
    await fetch(api(`app_users?app_id=eq.${encodeURIComponent(user.id)}`), {
      method: "PATCH",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        password_hash: nextPasswordHash,
        payload: nextPayload,
        updated_at: nowIso(),
      }),
    });
  }

  function redirectToLogin() {
    const next = encodeURIComponent(window.location.pathname.split("/").pop() + window.location.search);
    window.location.href = `./mobile-login.html?next=${next}`;
  }

  function isExpired(meta) {
    const last = Date.parse(meta?.lastActiveAt || "");
    if (!last) return true;
    return Date.now() - last > IDLE_LOGOUT_MS;
  }

  function installActivityTracker() {
    ["click", "keydown", "touchstart", "visibilitychange"].forEach((evt) => {
      window.addEventListener(evt, () => {
        if (document.visibilityState && document.visibilityState === "hidden") return;
        touchSession();
      }, { passive: true });
    });
  }

  async function login(username, password, keepSignedIn) {
    if (!ready()) return { ok: false, message: "Supabase config is missing." };
    const userNameValue = String(username || "").trim().toLowerCase();
    const passwordValue = String(password || "");
    if (!userNameValue || !passwordValue) return { ok: false, message: "Enter username and password." };
    const users = await loadUsers();
    const hashedPassword = await hashPassword(passwordValue);
    const user = users.find((item) => {
      return String(item.username || "").trim().toLowerCase() === userNameValue
        && item.status !== "Disabled"
        && passwordMatches(item, passwordValue, hashedPassword);
    });
    if (!user) return { ok: false, message: "Invalid username or password." };

    const needsReset = Boolean(user.mustChangePassword) || isLegacyPasswordHash(user.passwordHash || "") || isDefaultPassword(userNameValue, passwordValue);
    if (needsReset) {
      const nextPassword = window.prompt("Password reset required. Enter a new password (min 8 characters).", "");
      if (!nextPassword || String(nextPassword).length < PASSWORD_MIN_LENGTH) {
        return { ok: false, message: "Password reset required to login." };
      }
      const nextHash = await hashPassword(nextPassword);
      await updateUserPassword(user, nextHash);
    }

    writeStoredSession(user.id, Boolean(keepSignedIn));
    return { ok: true, user };
  }

  function requireAuth() {
    const session = readStoredSession();
    if (!session.sessionId || isExpired(session.meta)) {
      clearSession();
      redirectToLogin();
      return false;
    }
    touchSession();
    installActivityTracker();
    return true;
  }

  function logout() {
    clearSession();
    redirectToLogin();
  }

  window.InfonitsMobileAuth = {
    login,
    logout,
    requireAuth,
  };
})();
