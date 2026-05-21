(function () {
  const cfg = window.INFONITS_SUPABASE || {};
  const clientSelect = document.getElementById("projectClient");
  const existingSelect = document.getElementById("projectExisting");
  const nameInput = document.getElementById("projectName");
  const monthInput = document.getElementById("projectMonth");
  const statusSelect = document.getElementById("projectStatus");
  const valueLkrInput = document.getElementById("projectValueLkr");
  const valueUsdInput = document.getElementById("projectValueUsd");
  const noteInput = document.getElementById("projectNote");
  const saveButton = document.getElementById("saveProjectButton");
  const statusText = document.getElementById("projectStatusText");
  const detailsContent = document.getElementById("projectDetailsContent");
  const summaryTotalValue = document.getElementById("summaryTotalValue");
  const summaryProfit = document.getElementById("summaryProfit");
  const paymentClient = document.getElementById("paymentClient");
  const paymentProject = document.getElementById("paymentProject");
  const paymentDate = document.getElementById("paymentDate");
  const paymentAmount = document.getElementById("paymentAmount");
  const paymentMethod = document.getElementById("paymentMethod");
  const paymentReference = document.getElementById("paymentReference");
  const paymentNote = document.getElementById("paymentNote");
  const savePaymentButton = document.getElementById("savePaymentButton");
  const paymentStatusText = document.getElementById("paymentStatusText");

  let clients = [];
  let projects = [];
  let projectTargets = {};

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
    statusText.textContent = message || "";
    statusText.style.color = bad ? "#b91c1c" : "#0f172a";
  }

  function setPaymentText(message, bad) {
    if (!paymentStatusText) return;
    paymentStatusText.textContent = message || "";
    paymentStatusText.style.color = bad ? "#b91c1c" : "#0f172a";
  }

  function thisMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function createId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `mpr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeClient(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    return {
      id: payload.id || row.app_id || "",
      name: payload.name || row.name || "Client",
    };
  }

  function normalizeProject(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    const rowCurrency = String(row.currency || "").toUpperCase();
    const rowProjectValue = Number(row.project_value || 0) || 0;
    const normalizedValueLkr = Number(
      payload.valueLkr !== undefined ? payload.valueLkr : rowCurrency === "USD" ? 0 : rowProjectValue,
    ) || 0;
    const normalizedValueUsd = Number(
      payload.valueUsd !== undefined ? payload.valueUsd : rowCurrency === "USD" ? rowProjectValue : 0,
    ) || 0;
    return {
      id: payload.id || row.app_id || "",
      clientName: payload.clientName || row.client_name || "Client",
      name: payload.name || row.project_name || "Project",
      month: payload.month || row.month || thisMonth(),
      paymentStatus: payload.paymentStatus || row.status || "Waiting",
      valueLkr: normalizedValueLkr,
      valueUsd: normalizedValueUsd,
      advance: Number(payload.advance ?? row.advance_received ?? 0) || 0,
      payForWork: Number(payload.payForWork ?? row.pay_for_work ?? 0) || 0,
      paidForWork: Number(payload.paidForWork ?? row.paid_for_work ?? 0) || 0,
      note: payload.note || row.note || "",
      repeat: payload.repeat || "no",
      assignedTeamRole: payload.assignedTeamRole || "",
      worker: payload.worker || "",
      updatedAt: payload.updatedAt || row.updated_at || "",
    };
  }

  async function loadClients() {
    const res = await fetch(api("clients?select=app_id,name,payload&order=name.asc"), { headers: headers() });
    if (!res.ok) throw new Error("Failed to load clients");
    clients = (await res.json()).map(normalizeClient).filter((c) => c.name);
  }

  async function loadProjects() {
    const res = await fetch(api("projects?select=app_id,client_name,project_name,month,status,currency,project_value,advance_received,pay_for_work,paid_for_work,note,payload,updated_at&order=updated_at.desc"), { headers: headers() });
    if (!res.ok) throw new Error("Failed to load projects");
    projects = (await res.json()).map(normalizeProject).filter((p) => p.id);
  }

  async function loadProjectTargets() {
    const res = await fetch(api("app_data?collection=eq.projectTargets&app_id=eq.main&select=payload&limit=1"), { headers: headers() });
    if (!res.ok) {
      projectTargets = {};
      return;
    }
    const rows = await res.json();
    projectTargets = rows[0]?.payload && typeof rows[0].payload === "object" ? rows[0].payload : {};
  }

  function renderClients() {
    const names = [...new Set(clients.map((c) => c.name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    clientSelect.innerHTML = ["<option value=''>Select client</option>"]
      .concat(names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`))
      .join("");
    if (paymentClient) {
      paymentClient.innerHTML = ["<option value=''>Select client</option>"]
        .concat(names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`))
        .join("");
    }
  }

  function renderProjects() {
    const client = clientSelect.value;
    const list = projects
      .filter((p) => !client || p.clientName === client)
      .sort((a, b) => a.name.localeCompare(b.name));
    existingSelect.innerHTML = ["<option value=''>New project</option>"]
      .concat(list.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.month)})</option>`))
      .join("");
    if (paymentProject) {
      paymentProject.innerHTML = ["<option value=''>No project</option>"]
        .concat(list.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.month)})</option>`))
        .join("");
    }
  }

  function money(value, prefix) {
    return `${prefix} ${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  function isActiveProject(project) {
    return !["Paid", "Completed"].includes(project?.paymentStatus || "Waiting");
  }

  function projectRecurringKey(project = {}) {
    return `${project.clientName || ""}|${project.name || ""}`.trim().toLowerCase();
  }

  function carriedProjectFrom(source, month, reason) {
    const resetMoney = reason === "monthly";
    return {
      ...source,
      month,
      carriedFromMonth: source.month,
      carryReason: reason,
      paymentStatus: "Waiting",
      advance: resetMoney ? 0 : Number(source.advance || 0),
      paidForWork: resetMoney ? 0 : Number(source.paidForWork || 0),
    };
  }

  function projectsForMonth(month) {
    const exactProjects = projects.filter((project) => project.month === month);
    const exactKeys = new Set(exactProjects.map(projectRecurringKey));
    const latestPreviousProjects = projects
      .filter((project) => project.month < month && !exactKeys.has(projectRecurringKey(project)))
      .reduce((latest, project) => {
        const key = projectRecurringKey(project);
        const existing = latest.get(key);
        if (!existing || project.month > existing.month) latest.set(key, project);
        return latest;
      }, new Map());
    const carryProjects = [...latestPreviousProjects.values()].filter((project) => {
      return (project.repeat || "no") === "monthly" || isActiveProject(project);
    });
    return [
      ...exactProjects,
      ...carryProjects.map((project) => {
        const reason = (project.repeat || "no") === "monthly" ? "monthly" : "unpaid";
        return carriedProjectFrom(project, month, reason);
      }),
    ];
  }

  function projectUsdRateForMonth(month) {
    return Number(projectTargets?.[month]?.usdRate || 0);
  }

  function projectValueLkr(project) {
    const localValue = Number(project?.valueLkr || 0);
    if (localValue) return localValue;
    const usd = Number(project?.valueUsd || 0);
    const rate = projectUsdRateForMonth(project?.month || thisMonth());
    return usd && rate ? usd * rate : 0;
  }

  function projectForMe(project) {
    const remainingWorkPayment = Number(project?.payForWork || 0) - Number(project?.paidForWork || 0);
    return projectValueLkr(project) - Number(project?.advance || 0) - remainingWorkPayment;
  }

  function updateSummary() {
    const month = monthInput.value || thisMonth();
    const monthProjects = projectsForMonth(month);
    const activeMonthProjects = monthProjects.filter(isActiveProject);
    const totalValue = activeMonthProjects.reduce((sum, p) => sum + projectValueLkr(p), 0);
    const totalProfit = activeMonthProjects.reduce((sum, p) => sum + projectForMe(p), 0);
    if (summaryTotalValue) summaryTotalValue.textContent = money(totalValue, "Rs.");
    if (summaryProfit) summaryProfit.textContent = money(totalProfit, "Rs.");
  }

  function renderProjectDetails(project) {
    if (!detailsContent) return;
    if (!project) {
      detailsContent.textContent = "Select a project to view details.";
      return;
    }
    detailsContent.innerHTML = [
      `<div><strong>Client:</strong> ${escapeHtml(project.clientName || "-")}</div>`,
      `<div><strong>Project:</strong> ${escapeHtml(project.name || "-")}</div>`,
      `<div><strong>Month:</strong> ${escapeHtml(project.month || "-")}</div>`,
      `<div><strong>Status:</strong> ${escapeHtml(project.paymentStatus || "-")}</div>`,
      `<div><strong>Value (LKR):</strong> ${escapeHtml(money(project.valueLkr, "Rs."))}</div>`,
      `<div><strong>Value (USD):</strong> ${escapeHtml(money(project.valueUsd, "$"))}</div>`,
      `<div><strong>Note:</strong> ${escapeHtml(project.note || "-")}</div>`,
      `<div><strong>Updated:</strong> ${escapeHtml(project.updatedAt ? new Date(project.updatedAt).toLocaleString() : "-")}</div>`,
    ].join("");
  }

  function fillFromExisting() {
    const id = existingSelect.value;
    if (!id) {
      renderProjectDetails(null);
      return;
    }
    const p = projects.find((item) => item.id === id);
    if (!p) {
      renderProjectDetails(null);
      return;
    }
    clientSelect.value = p.clientName || "";
    nameInput.value = p.name || "";
    monthInput.value = p.month || thisMonth();
    statusSelect.value = p.paymentStatus || "Waiting";
    valueLkrInput.value = String(p.valueLkr || 0);
    valueUsdInput.value = String(p.valueUsd || 0);
    noteInput.value = p.note || "";
    renderProjectDetails(p);
  }

  async function saveProject() {
    const existingId = String(existingSelect.value || "");
    const clientName = String(clientSelect.value || "").trim();
    const projectName = String(nameInput.value || "").trim();
    const month = String(monthInput.value || "").trim() || thisMonth();
    const paymentStatus = String(statusSelect.value || "Waiting");
    const valueLkr = Math.max(0, Number(valueLkrInput.value || 0));
    const valueUsd = Math.max(0, Number(valueUsdInput.value || 0));
    const note = String(noteInput.value || "").trim();

    if (!clientName || !projectName) {
      setText("Client and project name are required", true);
      return;
    }

    saveButton.disabled = true;
    setText("Saving...");
    try {
      const existing = projects.find((p) => p.id === existingId);
      const appId = existing?.id || createId();
      const payload = {
        id: appId,
        clientName,
        name: projectName,
        month,
        paymentStatus,
        valueLkr,
        valueUsd,
        note,
        repeat: existing?.repeat || "no",
        assignedTeamRole: existing?.assignedTeamRole || "",
        worker: existing?.worker || "",
        updatedAt: new Date().toISOString(),
        createdFrom: "mobile-project-update",
      };
      const body = {
        app_id: appId,
        client_name: clientName,
        project_name: projectName,
        month,
        status: paymentStatus,
        currency: valueUsd > 0 ? "USD" : "LKR",
        project_value: valueUsd > 0 ? valueUsd : valueLkr,
        advance_received: Number(existing?.advance || 0) || 0,
        pay_for_work: Number(existing?.payForWork || 0) || 0,
        paid_for_work: Number(existing?.paidForWork || 0) || 0,
        note,
        payload,
        updated_at: payload.updatedAt,
      };

      const res = await fetch(api("projects"), {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      setText("Project saved");
      await loadProjects();
      await loadProjectTargets();
      renderProjects();
      updateSummary();
      existingSelect.value = appId;
      fillFromExisting();
    } catch (error) {
      console.error("Project save failed", error);
      setText(`Save failed: ${String(error?.message || error).slice(0, 140)}`, true);
    } finally {
      saveButton.disabled = false;
    }
  }

  async function savePayment() {
    const clientName = String(paymentClient?.value || "").trim();
    const projectId = String(paymentProject?.value || "").trim();
    const project = projects.find((p) => p.id === projectId);
    const amount = Math.max(0, Number(paymentAmount?.value || 0));
    const date = String(paymentDate?.value || "").trim();
    const method = String(paymentMethod?.value || "Bank transfer");
    const reference = String(paymentReference?.value || "").trim();
    const note = String(paymentNote?.value || "").trim();
    if (!clientName || !date || !amount) {
      setPaymentText("Client, date, and amount are required", true);
      return;
    }
    if (savePaymentButton) savePaymentButton.disabled = true;
    setPaymentText("Saving...");
    try {
      const id = createId();
      const recordNote = [project?.name ? `Project: ${project.name}` : "", reference ? `Ref: ${reference}` : "", note]
        .filter(Boolean)
        .join(" | ");
      const payload = {
        id,
        type: "income",
        date,
        category: "Client payment",
        amount,
        status: "paid",
        repeat: "none",
        note: recordNote || `Payment by ${clientName}`,
        sourceType: "mobile-payment-update",
        sourceId: projectId || "",
        updatedAt: new Date().toISOString(),
        clientName,
        projectId,
        projectName: project?.name || "",
        method,
        reference,
        createdFrom: "mobile-payment-update",
      };
      const body = {
        app_id: id,
        record_date: date,
        month: String(date).slice(0, 7),
        type: "income",
        category: "Client payment",
        amount,
        status: "paid",
        source_type: "mobile-payment-update",
        source_id: projectId || "",
        repeat: "none",
        note: payload.note,
        payload,
        updated_at: payload.updatedAt,
      };
      const res = await fetch(api("finance_records"), {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      setPaymentText("Payment saved");
      if (paymentAmount) paymentAmount.value = "0";
      if (paymentReference) paymentReference.value = "";
      if (paymentNote) paymentNote.value = "";
    } catch {
      setPaymentText("Payment save failed", true);
    } finally {
      if (savePaymentButton) savePaymentButton.disabled = false;
    }
  }

  async function init() {
    if (!ready()) {
      setText("Supabase config missing", true);
      return;
    }
    monthInput.value = thisMonth();
    if (paymentDate) paymentDate.value = `${thisMonth()}-${String(new Date().getDate()).padStart(2, "0")}`;
    try {
      await Promise.all([loadClients(), loadProjects(), loadProjectTargets()]);
      renderClients();
      renderProjects();
      updateSummary();
    } catch {
      setText("Failed to load data", true);
    }
  }

  clientSelect.addEventListener("change", () => {
    renderProjects();
    existingSelect.value = "";
    renderProjectDetails(null);
  });
  existingSelect.addEventListener("change", fillFromExisting);
  monthInput.addEventListener("change", updateSummary);
  saveButton.addEventListener("click", saveProject);
  paymentClient?.addEventListener("change", () => {
    const selected = paymentClient.value;
    if (!selected) return renderProjects();
    const list = projects
      .filter((p) => p.clientName === selected)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (paymentProject) {
      paymentProject.innerHTML = ["<option value=''>No project</option>"]
        .concat(list.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.month)})</option>`))
        .join("");
    }
  });
  savePaymentButton?.addEventListener("click", savePayment);

  init();
})();
