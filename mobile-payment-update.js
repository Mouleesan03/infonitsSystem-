(function () {
  if (!window.InfonitsMobileAuth || !window.InfonitsMobileAuth.requireAuth()) return;
  const cfg = window.INFONITS_SUPABASE || {};

  const addPanel = document.getElementById("addRecordPanel");
  const toggleAddRecordButton = document.getElementById("toggleAddRecordButton");
  const refreshFinanceButton = document.getElementById("refreshFinanceButton");
  const financePeriod = document.getElementById("financePeriod");
  const financeTime = document.getElementById("financeTime");
  const financeBackButton = document.getElementById("financeBackButton");

  const financeMonthFilter = document.getElementById("financeMonthFilter");
  const financeTypeFilter = document.getElementById("financeTypeFilter");
  const financeCategoryFilter = document.getElementById("financeCategoryFilter");

  const paymentClient = document.getElementById("paymentClient");
  const paymentProject = document.getElementById("paymentProject");
  const financeType = document.getElementById("financeType");
  const financeStatus = document.getElementById("financeStatus");
  const financeCategory = document.getElementById("financeCategory");
  const paymentDate = document.getElementById("paymentDate");
  const paymentAmount = document.getElementById("paymentAmount");
  const paymentMethod = document.getElementById("paymentMethod");
  const paymentReference = document.getElementById("paymentReference");
  const paymentNote = document.getElementById("paymentNote");
  const savePaymentButton = document.getElementById("savePaymentButton");
  const paymentStatusText = document.getElementById("paymentStatusText");

  const sumIncome = document.getElementById("sumIncome");
  const sumProjectProfit = document.getElementById("sumProjectProfit");
  const sumBalance = document.getElementById("sumBalance");
  const sumUnpaid = document.getElementById("sumUnpaid");
  const sumSavings = document.getElementById("sumSavings");
  const sumGold = document.getElementById("sumGold");
  const sumProjectProfitMeta = document.getElementById("sumProjectProfitMeta");
  const sumIncomeMeta = document.getElementById("sumIncomeMeta");
  const sumUnpaidMeta = document.getElementById("sumUnpaidMeta");
  const sumBalanceMeta = document.getElementById("sumBalanceMeta");
  const sumSavingsMeta = document.getElementById("sumSavingsMeta");
  const sumGoldMeta = document.getElementById("sumGoldMeta");
  const financeRecordCount = document.getElementById("financeRecordCount");
  const financeRecordList = document.getElementById("financeRecordList");
  const financePrevPage = document.getElementById("financePrevPage");
  const financeNextPage = document.getElementById("financeNextPage");
  const financePageLabel = document.getElementById("financePageLabel");

  let clients = [];
  let projects = [];
  let records = [];
  let projectTargets = {};
  let financePage = 1;
  let editingRecordId = "";
  const FINANCE_PAGE_SIZE = 5;

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
    paymentStatusText.textContent = message || "";
    paymentStatusText.style.color = bad ? "#b91c1c" : "#0f172a";
  }

  function today() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function thisMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function createId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `mfin-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function money(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  function compactMoney(value) {
    const n = Number(value || 0);
    if (Math.abs(n) >= 1000000) return `Rs. ${(n / 1000000).toFixed(2).replace(/\.00$/, "")}M`;
    if (Math.abs(n) >= 1000) return `Rs. ${(n / 1000).toFixed(0)}k`;
    return money(n);
  }

  function escapeHtml(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeClient(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    return { id: payload.id || row.app_id || "", name: payload.name || row.name || "Client" };
  }

  function normalizeProject(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    const rowCurrency = String(row.currency || "").toUpperCase();
    const rowProjectValue = Number(row.project_value || 0) || 0;
    return {
      id: payload.id || row.app_id || "",
      clientName: payload.clientName || row.client_name || "Client",
      name: payload.name || row.project_name || "Project",
      month: payload.month || row.month || "",
      paymentStatus: payload.paymentStatus || row.status || "Waiting",
      valueLkr: Number(payload.valueLkr !== undefined ? payload.valueLkr : rowCurrency === "USD" ? 0 : rowProjectValue) || 0,
      valueUsd: Number(payload.valueUsd !== undefined ? payload.valueUsd : rowCurrency === "USD" ? rowProjectValue : 0) || 0,
      advance: Number(payload.advance ?? row.advance_received ?? 0) || 0,
      payForWork: Number(payload.payForWork ?? row.pay_for_work ?? 0) || 0,
      paidForWork: Number(payload.paidForWork ?? row.paid_for_work ?? 0) || 0,
      repeat: payload.repeat || "no",
    };
  }

  function normalizeFinance(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    return {
      id: row.app_id || row.id || payload.id || "",
      date: row.record_date || payload.date || today(),
      month: row.month || String(row.record_date || payload.date || today()).slice(0, 7),
      type: row.type || payload.type || "expense",
      category: row.category || payload.category || "General",
      amount: Number(row.amount || payload.amount || 0) || 0,
      status: row.status || payload.status || "unpaid",
      repeat: row.repeat || payload.repeat || "none",
      note: row.note || payload.note || "",
      sourceId: row.source_id || payload.sourceId || "",
      paidMonths: Array.isArray(payload.paidMonths) ? payload.paidMonths : [],
      clientName: payload.clientName || "",
      projectName: payload.projectName || "",
      updatedAt: row.updated_at || payload.updatedAt || "",
    };
  }

  async function loadClients() {
    const res = await fetch(api("clients?select=app_id,name,payload&order=name.asc"), { headers: headers() });
    if (!res.ok) throw new Error("Failed to load clients");
    clients = (await res.json()).map(normalizeClient).filter((c) => c.name);
  }

  async function loadProjects() {
    const res = await fetch(api("projects?select=app_id,client_name,project_name,month,status,currency,project_value,advance_received,pay_for_work,paid_for_work,payload&order=updated_at.desc"), { headers: headers() });
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

  async function loadFinanceRecords() {
    const res = await fetch(api("finance_records?select=app_id,record_date,month,type,category,amount,status,repeat,source_id,note,payload,updated_at&order=record_date.desc"), { headers: headers() });
    if (!res.ok) throw new Error("Failed to load finance records");
    records = (await res.json()).map(normalizeFinance);
  }

  function isActiveProject(project = {}) {
    return !["Paid", "Completed"].includes(project.paymentStatus || "Waiting");
  }

  function projectRecurringKey(project = {}) {
    return `${project.clientName || ""}|${project.name || ""}`.trim().toLowerCase();
  }

  function carriedProjectFrom(source, month, reason) {
    const resetMoney = reason === "monthly";
    return {
      ...source,
      month,
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
    const carryProjects = [...latestPreviousProjects.values()].filter((project) => (project.repeat || "no") === "monthly" || isActiveProject(project));
    return [
      ...exactProjects,
      ...carryProjects.map((project) => carriedProjectFrom(project, month, (project.repeat || "no") === "monthly" ? "monthly" : "unpaid")),
    ];
  }

  function projectUsdRateForMonth(month) {
    return Number(projectTargets?.[month]?.usdRate || 0);
  }

  function projectValueLkr(project) {
    const localValue = Number(project.valueLkr || 0);
    if (localValue) return localValue;
    const usd = Number(project.valueUsd || 0);
    const rate = projectUsdRateForMonth(project.month || thisMonth());
    return usd && rate ? usd * rate : 0;
  }

  function projectForMe(project) {
    const remainingWorkPayment = Number(project.payForWork || 0) - Number(project.paidForWork || 0);
    return projectValueLkr(project) - Number(project.advance || 0) - remainingWorkPayment;
  }

  function hasLinkedProjectFinanceRecord(projectId, month) {
    return records.some((record) => {
      if (record.sourceId === `project-complete-${projectId}-${month}`) return true;
      return record.sourceId === `project-complete-${projectId}` && String(record.date || "").slice(0, 7) === month;
    });
  }

  function projectFinanceSummary(month) {
    return projectsForMonth(month)
      .filter((project) => isActiveProject(project) && !hasLinkedProjectFinanceRecord(project.id, month))
      .reduce(
        (summary, project) => {
          summary.income += projectForMe(project);
          return summary;
        },
        { income: 0 },
      );
  }

  function financeRecordMonth(record) {
    return String(record.date || "").slice(0, 7);
  }

  function financeRecordIsExpenseLike(record) {
    return record.type === "expense" || record.type === "loan";
  }

  function firstFinancePaidMonth(record) {
    const paidMonths = Array.isArray(record.paidMonths) ? [...record.paidMonths].sort() : [];
    if (paidMonths.length) return paidMonths[0];
    if (record.repeat !== "monthly" && record.status === "paid") return financeRecordMonth(record);
    return "";
  }

  function financeRecordPaidInMonth(record, month) {
    const paidMonths = Array.isArray(record.paidMonths) ? record.paidMonths : [];
    if (paidMonths.includes(month)) return true;
    return record.repeat !== "monthly" && financeRecordMonth(record) === month && record.status === "paid";
  }

  function financeRecordOutstandingAmount(record, month) {
    if (!financeRecordIsExpenseLike(record)) return 0;
    return financeRecordPaidInMonth(record, month) ? 0 : Number(record.amount || 0);
  }

  function financeRecordPaidAmount(record, month) {
    if (!financeRecordIsExpenseLike(record)) return 0;
    return financeRecordPaidInMonth(record, month) ? Number(record.amount || 0) : 0;
  }

  function financeRecordAppliesToMonth(record, month) {
    const recordMonth = financeRecordMonth(record);
    if (!recordMonth) return false;
    if (record.type === "saving" || record.type === "gold") return recordMonth <= month;
    if (record.repeat === "monthly") return recordMonth <= month;
    if (financeRecordIsExpenseLike(record)) {
      const paidMonth = firstFinancePaidMonth(record);
      return recordMonth <= month && (!paidMonth || month <= paidMonth);
    }
    return recordMonth === month;
  }

  function renderClients() {
    const names = [...new Set(clients.map((c) => c.name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    paymentClient.innerHTML = ["<option value=''>Select client</option>"]
      .concat(names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`))
      .join("");
  }

  function renderProjects() {
    const selectedClient = String(paymentClient.value || "");
    const list = projects
      .filter((p) => !selectedClient || p.clientName === selectedClient)
      .sort((a, b) => a.name.localeCompare(b.name));
    paymentProject.innerHTML = ["<option value=''>No project</option>"]
      .concat(list.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.month)})</option>`))
      .join("");
  }

  function filteredRecords() {
    const month = financeMonthFilter.value || thisMonth();
    const type = String(financeTypeFilter.value || "all");
    const category = String(financeCategoryFilter.value || "").trim().toLowerCase();
    return records.filter((record) => {
      if (!financeRecordAppliesToMonth(record, month)) return false;
      const matchType = type === "all" || record.type === type;
      const matchCategory = !category || String(record.category || "").toLowerCase().includes(category);
      return matchType && matchCategory;
    });
  }

  function renderSummary(list) {
    const month = financeMonthFilter.value || thisMonth();
    const monthRecords = records.filter((record) => financeRecordAppliesToMonth(record, month));
    const [yearText, monthText] = month.split("-");
    const prevDate = new Date(Number(yearText), Math.max(0, Number(monthText) - 2), 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const prevMonthRecords = records.filter((record) => financeRecordAppliesToMonth(record, prevMonth));
    const projectSummary = projectFinanceSummary(month);
    const otherIncome = monthRecords.filter((record) => record.type === "income").reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const unpaidManualExpenses = monthRecords.filter((record) => record.type === "expense").reduce((sum, record) => sum + financeRecordOutstandingAmount(record, month), 0);
    const savings = monthRecords.filter((record) => record.type === "saving").reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const goldAssets = monthRecords.filter((record) => record.type === "gold").reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const unpaidLoans = monthRecords.filter((record) => record.type === "loan").reduce((sum, record) => sum + financeRecordOutstandingAmount(record, month), 0);
    const paidExpenses = monthRecords.reduce((sum, record) => sum + financeRecordPaidAmount(record, month), 0);
    const unpaidExpenses = unpaidManualExpenses + unpaidLoans;
    const balance = otherIncome - paidExpenses;
    const prevIncome = prevMonthRecords.filter((record) => record.type === "income").reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const prevSavings = prevMonthRecords.filter((record) => record.type === "saving").reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const incomePct = prevIncome > 0 ? Math.round(((otherIncome - prevIncome) / prevIncome) * 100) : 0;
    const overdueCount = monthRecords.filter((record) => financeRecordIsExpenseLike(record) && financeRecordOutstandingAmount(record, month) > 0).length;
    const goldNewCount = monthRecords.filter((record) => record.type === "gold" && financeRecordMonth(record) === month).length;
    if (sumProjectProfit) sumProjectProfit.textContent = compactMoney(projectSummary.income);
    sumIncome.textContent = compactMoney(otherIncome);
    sumUnpaid.textContent = compactMoney(unpaidExpenses);
    sumBalance.textContent = compactMoney(balance);
    if (sumSavings) sumSavings.textContent = compactMoney(savings);
    if (sumGold) sumGold.textContent = compactMoney(goldAssets);
    if (sumProjectProfitMeta) sumProjectProfitMeta.textContent = "live";
    if (sumIncomeMeta) sumIncomeMeta.textContent = `${incomePct >= 0 ? "+" : ""}${incomePct}%`;
    if (sumUnpaidMeta) sumUnpaidMeta.textContent = `${overdueCount} overdue`;
    if (sumBalanceMeta) sumBalanceMeta.textContent = "this month";
    if (sumSavingsMeta) sumSavingsMeta.textContent = `${savings - prevSavings >= 0 ? "+" : ""}${money(savings - prevSavings).replace("Rs. ", "Rs. ")}`;
    if (sumGoldMeta) sumGoldMeta.textContent = `+${goldNewCount} entry`;
  }

  function typeChip(record) {
    const text = String(record.type || "");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function renderRecords() {
    const list = filteredRecords();
    renderSummary(list);
    const totalPages = Math.max(1, Math.ceil(list.length / FINANCE_PAGE_SIZE));
    if (financePage > totalPages) financePage = totalPages;
    const start = (financePage - 1) * FINANCE_PAGE_SIZE;
    const paged = list.slice(start, start + FINANCE_PAGE_SIZE);
    if (financeRecordCount) financeRecordCount.textContent = `${paged.length} of ${list.length}`;
    if (financePageLabel) financePageLabel.textContent = `Page ${financePage} of ${totalPages}`;
    if (financePrevPage) financePrevPage.disabled = financePage <= 1;
    if (financeNextPage) financeNextPage.disabled = financePage >= totalPages;
    if (!paged.length) {
      financeRecordList.innerHTML = `<div class=\"record-item\"><div class=\"record-meta\">No finance records for this filter.</div></div>`;
      return;
    }
    financeRecordList.innerHTML = paged
      .map((record) => {
        const statusText = record.status === "paid" ? "Recorded" : "Unpaid";
        return `
          <article class=\"record-item ${escapeHtml(record.type)}\">
            <div class=\"record-top\">
              <div class=\"chips\">
                <span class=\"chip\">${escapeHtml(typeChip(record))}</span>
                <span class=\"chip status\">${escapeHtml(statusText)}</span>
              </div>
              <strong class=\"record-amount\">${escapeHtml(money(record.amount))}</strong>
            </div>
            <div class=\"record-meta\">${escapeHtml(record.date)} · ${escapeHtml(record.category)}</div>
            <div class=\"record-meta\">${escapeHtml(record.note || "-")}</div>
            <div class=\"record-actions\">
              <button class=\"btn edit\" type=\"button\" data-edit-finance=\"${escapeHtml(record.id)}\">Edit</button>
              <button class=\"btn delete\" type=\"button\" data-delete-finance=\"${escapeHtml(record.id)}\">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function startEditRecord(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return;
    editingRecordId = id;
    financeType.value = record.type || "income";
    financeStatus.value = record.status || "paid";
    paymentDate.value = record.date || today();
    paymentAmount.value = String(record.amount || 0);
    financeCategory.value = record.category || "";
    paymentNote.value = record.note || "";
    addPanel.classList.remove("hidden");
    toggleAddRecordButton.textContent = "Close form";
    savePaymentButton.textContent = "Save changes";
    setText("Editing finance record");
    addPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteRecord(id) {
    if (!id) return;
    const ok = window.confirm("Delete this record?");
    if (!ok) return;
    try {
      const res = await fetch(api(`finance_records?app_id=eq.${encodeURIComponent(id)}`), {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error(await res.text());
      await refreshFinance();
    } catch {
      setText("Delete failed", true);
    }
  }

  async function saveRecord() {
    const type = String(financeType?.value || "income");
    const status = String(financeStatus?.value || "paid");
    const categoryInput = String(financeCategory?.value || "").trim();
    const clientName = String(paymentClient.value || "").trim();
    const projectId = String(paymentProject.value || "").trim();
    const project = projects.find((p) => p.id === projectId);
    const amount = Math.max(0, Number(paymentAmount.value || 0));
    const date = String(paymentDate.value || "").trim();
    const method = String(paymentMethod.value || "Bank transfer");
    const reference = String(paymentReference.value || "").trim();
    const note = String(paymentNote.value || "").trim();

    if (!date || !amount) {
      setText("Date and amount are required", true);
      return;
    }

    savePaymentButton.disabled = true;
    setText("Saving...");
    try {
      const id = editingRecordId || createId();
      const recordNote = [clientName ? `Client: ${clientName}` : "", project?.name ? `Project: ${project.name}` : "", reference ? `Ref: ${reference}` : "", note]
        .filter(Boolean)
        .join(" | ");
      const defaultCategory = type === "income" ? "Client payment" : "General";
      const category = categoryInput || defaultCategory;
      const payload = {
        id,
        type,
        date,
        category,
        amount,
        status,
        repeat: "none",
        note: recordNote || "Finance update",
        sourceType: "mobile-finance-update",
        sourceId: projectId || "",
        updatedAt: new Date().toISOString(),
        clientName,
        projectId,
        projectName: project?.name || "",
        method,
        reference,
        createdFrom: "mobile-finance-update",
      };
      const body = {
        app_id: id,
        record_date: date,
        month: String(date).slice(0, 7),
        type,
        category,
        amount,
        status,
        source_type: "mobile-finance-update",
        source_id: projectId || "",
        repeat: "none",
        note: payload.note,
        payload,
        updated_at: payload.updatedAt,
      };
      const res = editingRecordId
        ? await fetch(api(`finance_records?app_id=eq.${encodeURIComponent(editingRecordId)}`), {
            method: "PATCH",
            headers: headers({ Prefer: "return=minimal" }),
            body: JSON.stringify(body),
          })
        : await fetch(api("finance_records"), {
            method: "POST",
            headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error(await res.text());

      setText(editingRecordId ? "Finance record updated" : "Finance record saved");
      paymentAmount.value = "0";
      paymentReference.value = "";
      paymentNote.value = "";
      financeCategory.value = "";
      editingRecordId = "";
      savePaymentButton.textContent = "Save record";
      addPanel.classList.add("hidden");
      toggleAddRecordButton.textContent = "+ Add record";
      await refreshFinance();
    } catch (error) {
      console.error("Finance save failed", error);
      setText(`Finance save failed: ${String(error?.message || error).slice(0, 140)}`, true);
    } finally {
      savePaymentButton.disabled = false;
    }
  }

  async function refreshFinance() {
    await loadFinanceRecords();
    renderRecords();
  }

  async function init() {
    if (!ready()) {
      setText("Supabase config missing", true);
      return;
    }
    const nowDate = today();
    paymentDate.value = nowDate;
    financeMonthFilter.value = nowDate.slice(0, 7);
    financeStatus.value = "paid";
    financeType.value = "income";
    try {
      await Promise.all([loadClients(), loadProjects(), loadProjectTargets()]);
      renderClients();
      renderProjects();
      await refreshFinance();
    } catch {
      setText("Failed to load data", true);
    }
  }

  toggleAddRecordButton.addEventListener("click", () => {
    const hidden = addPanel.classList.toggle("hidden");
    toggleAddRecordButton.textContent = hidden ? "+ Add record" : "Close form";
    if (hidden) {
      editingRecordId = "";
      savePaymentButton.textContent = "Save record";
    }
    if (!hidden) addPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  paymentClient.addEventListener("change", renderProjects);
  savePaymentButton.addEventListener("click", saveRecord);
  refreshFinanceButton.addEventListener("click", refreshFinance);
  financeMonthFilter.addEventListener("change", () => {
    financePage = 1;
    refreshFinance();
  });
  financeTypeFilter.addEventListener("change", () => {
    financePage = 1;
    renderRecords();
  });
  financeCategoryFilter.addEventListener("input", () => {
    financePage = 1;
    renderRecords();
  });
  financePrevPage.addEventListener("click", () => {
    financePage = Math.max(1, financePage - 1);
    renderRecords();
  });
  financeNextPage.addEventListener("click", () => {
    financePage += 1;
    renderRecords();
  });

  document.addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit-finance]");
    const btn = event.target.closest("[data-delete-finance]");
    if (editBtn) {
      startEditRecord(editBtn.getAttribute("data-edit-finance"));
      return;
    }
    if (!btn) return;
    deleteRecord(btn.getAttribute("data-delete-finance"));
  });

  financeBackButton.addEventListener("click", () => {
    window.location.href = "./mobile-dashboard.html?v=20260521-sync";
  });

  (function updateHeaderClock() {
    const now = new Date();
    financePeriod.textContent = `${now.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()} · FINANCE`;
    financeTime.textContent = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  })();

  init();
})();
