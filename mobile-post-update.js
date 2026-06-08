(function () {
  if (!window.InfonitsMobileAuth || !window.InfonitsMobileAuth.requireAuth()) return;
  const cfg = window.INFONITS_SUPABASE || {};
  const postClient = document.getElementById("postClient");
  const postProject = document.getElementById("postProject");
  const postDate = document.getElementById("postDate");
  const postCount = document.getElementById("postCount");
  const postPlatform = document.getElementById("postPlatform");
  const postLink = document.getElementById("postLink");
  const postRemarks = document.getElementById("postRemarks");
  const submitButton = document.getElementById("submitButton");
  const formStatus = document.getElementById("formStatus");
  const successOverlay = document.getElementById("successOverlay");
  const calGrid = document.getElementById("calGrid");
  const calWeekdays = document.getElementById("calWeekdays");
  const calTitle = document.getElementById("calTitle");
  const calPrev = document.getElementById("calPrev");
  const calNext = document.getElementById("calNext");

  let projectRows = [];
  let calendarMonth = new Date();
  let dayDotsByDate = new Map();
  let clientColors = {};
  let clientColorsByLower = new Map();

  function ready() {
    return Boolean(cfg.url && cfg.anonKey);
  }

  function api(path) {
    return `${cfg.url}/rest/v1/${path}`;
  }

  function headers(extra) {
    return {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  function setText(message, bad) {
    formStatus.textContent = message || "";
    formStatus.style.color = bad ? "#b91c1c" : "#0f172a";
  }

  function today() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatMonthTitle(date) {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function normalizeDate(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
  }

  function addDot(date, color) {
    if (!date || !color) return;
    const list = dayDotsByDate.get(date) || [];
    list.push(color);
    dayDotsByDate.set(date, list);
  }

  function clientCalendarColor(clientName = "") {
    const rawName = String(clientName || "").trim();
    const saved = clientColors[rawName] || clientColorsByLower.get(rawName.toLowerCase()) || "";
    if (/^#[0-9a-f]{6}$/i.test(saved || "")) return saved;
    const colors = ["#2563eb", "#7c3aed", "#0f766e", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#4f46e5", "#be123c", "#9333ea"];
    const seed = [...String(clientName || "Client")].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[seed % colors.length];
  }

  async function loadClientColors() {
    const res = await fetch(api("app_data?collection=eq.clientColors&app_id=eq.main&select=payload&limit=1"), { headers: headers() });
    if (!res.ok) return;
    const rows = await res.json();
    const payload = rows[0]?.payload;
    clientColors = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    clientColorsByLower = new Map(
      Object.entries(clientColors).map(([name, color]) => [String(name || "").trim().toLowerCase(), color]),
    );
  }

  function ensureDateValue() {
    const value = today();
    postDate.setAttribute("max", value);
    postDate.value = value;
    if (!postDate.value) {
      postDate.type = "text";
      postDate.placeholder = "YYYY-MM-DD";
      postDate.value = value;
    }
  }

  function createId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `mp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeProjectRow(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    const clientName = payload.clientName || row.client_name || "Client";
    const projectName = payload.name || payload.projectName || row.project_name || "Project";
    return {
      id: payload.id || row.app_id || "",
      clientName,
      projectName,
      assignedTeamRole: payload.assignedTeamRole || "",
      month: payload.month || row.month || "",
      note: payload.note || row.note || "",
    };
  }

  async function loadProjects() {
    const res = await fetch(api("projects?select=app_id,client_name,project_name,month,note,payload&order=updated_at.desc"), { headers: headers() });
    if (!res.ok) throw new Error("Failed to load projects");
    const rows = await res.json();
    projectRows = rows.map(normalizeProjectRow).filter((p) => p.id);
    populateClientOptions();
  }

  async function loadPosts() {
    const res = await fetch(api("social_media_posts?select=posted_date,post_count,client_name,payload"), { headers: headers() });
    if (!res.ok) throw new Error("Failed to load posts");
    const rows = await res.json();
    dayDotsByDate = new Map();
    rows.forEach((row) => {
      const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
      const date = normalizeDate(payload.postedDate || payload.uploadDate || row.posted_date);
      if (!date) return;
      const count = Math.max(1, Number(payload.count || row.post_count || 1));
      const payloadProjectId = String(payload.projectId || "");
      const mappedClientName = payloadProjectId ? (projectRows.find((p) => p.id === payloadProjectId)?.clientName || "") : "";
      const clientName = String(payload.clientName || row.client_name || mappedClientName || "Client");
      const color = clientCalendarColor(clientName);
      for (let i = 0; i < count; i += 1) {
        addDot(date, color);
      }
    });
  }

  async function loadRenewals() {
    const res = await fetch(api("renewals?select=payload,status"), { headers: headers() });
    if (!res.ok) return;
    const rows = await res.json();
    const todayValue = today();
    rows.forEach((row) => {
      const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
      const date = normalizeDate(payload.expiryDate || payload.date || payload.renewalDate);
      if (!date) return;
      if (date < todayValue) return;
      const status = String(payload.status || row.status || "").toLowerCase();
      if (status === "renewed") return;
      addDot(date, "#7c3aed");
    });
  }

  function renderCalendar() {
    if (!calGrid || !calTitle) return;
    calTitle.textContent = formatMonthTitle(calendarMonth);
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = first.getDay();
    const daysInMonth = last.getDate();
    const selectedDate = normalizeDate(postDate.value || "");
    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (calWeekdays && !calWeekdays.dataset.ready) {
      calWeekdays.innerHTML = weekdayLabels.map((label) => `<div class="calendar-weekday">${label}</div>`).join("");
      calWeekdays.dataset.ready = "1";
    }

    const cells = [];
    const totalCells = 42;
    for (let cell = 0; cell < totalCells; cell += 1) {
      const day = cell - startWeekday + 1;
      if (day < 1 || day > daysInMonth) {
        cells.push(`<div class="calendar-day empty"></div>`);
        continue;
      }
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dots = dayDotsByDate.get(dateKey) || [];
      const count = dots.length;
      const classes = ["calendar-day"];
      if (selectedDate === dateKey) classes.push("active");
      cells.push(
        `<button type="button" class="${classes.join(" ")}" data-cal-date="${dateKey}">
          <span class="calendar-day-top">
            <span class="calendar-day-num">${day}</span>
            ${count ? `<span class="calendar-count">${count}</span>` : ""}
          </span>
          <span class="calendar-dots">
            ${dots.slice(0, 6).map((color) => `<i class="calendar-dot" style="background:${color}"></i>`).join("")}
          </span>
        </button>`,
      );
    }
    calGrid.innerHTML = cells.join("");
  }

  function trackedProject(project) {
    const text = `${project.projectName || ""} ${project.note || ""}`.toLowerCase();
    const isSocial = text.includes("social media") || /\bsm\b/.test(text);
    const isDeveloper = String(project.assignedTeamRole || "").toLowerCase() === "developer";
    return isSocial && !isDeveloper;
  }

  function populateClientOptions() {
    const names = [...new Set(projectRows.filter(trackedProject).map((p) => p.clientName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    postClient.innerHTML = ["<option value=''>Select client</option>"]
      .concat(names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`))
      .join("");
    postProject.innerHTML = "<option value=''>Select project</option>";
  }

  function populateProjectOptions() {
    const client = postClient.value;
    const items = projectRows
      .filter((p) => trackedProject(p) && (!client || p.clientName === client))
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
    postProject.innerHTML = ["<option value=''>Select project</option>"]
      .concat(items.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.projectName)}</option>`))
      .join("");
  }

  async function savePost() {
    const projectId = String(postProject.value || "");
    const project = projectRows.find((p) => p.id === projectId);
    const clientName = String(postClient.value || project?.clientName || "").trim();
    const projectName = String(project?.projectName || "").trim();
    const date = String(postDate.value || "").trim();
    const count = Math.max(1, Number(postCount.value || 1));
    const platform = String(postPlatform.value || "Facebook");
    const link = String(postLink.value || "").trim();
    const remarks = String(postRemarks.value || "").trim();

    if (!clientName || !projectId || !date) {
      setText("Client, project, and date are required", true);
      return;
    }

    submitButton.disabled = true;
    setText("Saving...");
    try {
      const payloadId = createId();
      const body = {
        app_id: payloadId,
        client_name: clientName,
        project_name: projectName || "Project",
        posted_date: date,
        post_count: count,
        platforms: [platform],
        platform_links: link ? { [platform]: link } : {},
        note: remarks,
        payload: {
          id: payloadId,
          clientName,
          projectId,
          projectName: projectName || "Project",
          platform,
          platforms: [platform],
          link,
          remarks,
          count,
          uploadDate: date,
          postedDate: date,
          status: "Uploaded",
          updatedAt: new Date().toISOString(),
          createdFrom: "mobile-post-update",
          createdByName: "Mobile",
        },
        updated_at: new Date().toISOString(),
      };
      const res = await fetch(api("social_media_posts"), {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const savedDate = date;
      setText("");
      if (successOverlay) {
        successOverlay.classList.add("show");
        successOverlay.setAttribute("aria-hidden", "false");
      }
      postLink.value = "";
      postRemarks.value = "";
      postCount.value = "1";
      ensureDateValue();
      const dotColor = clientCalendarColor(clientName);
      for (let i = 0; i < count; i += 1) addDot(savedDate, dotColor);
      renderCalendar();
      window.setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch {
      setText("Save failed", true);
    } finally {
      submitButton.disabled = false;
    }
  }

  async function init() {
    if (!ready()) {
      setText("Supabase config missing", true);
      return;
    }
    ensureDateValue();
    try {
      await Promise.all([loadProjects(), loadClientColors()]);
      await Promise.all([loadPosts(), loadRenewals()]);
      renderCalendar();
    } catch {
      setText("Failed to load projects", true);
    }
  }

  postClient.addEventListener("change", populateProjectOptions);
  calPrev?.addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  calNext?.addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  calGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cal-date]");
    if (!button) return;
    const value = button.dataset.calDate || "";
    if (!value) return;
    postDate.value = value;
    calendarMonth = new Date(`${value}T00:00:00`);
    renderCalendar();
  });
  postLink.addEventListener("input", () => {
    if (!postDate.value) ensureDateValue();
  });
  postDate.addEventListener("change", renderCalendar);
  submitButton.addEventListener("click", savePost);
  init();
})();
