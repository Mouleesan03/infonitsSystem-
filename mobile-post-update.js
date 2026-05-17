(function () {
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

  let projectRows = [];

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
      setText("Posted update saved");
      postLink.value = "";
      postRemarks.value = "";
      postCount.value = "1";
      ensureDateValue();
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
      await loadProjects();
    } catch {
      setText("Failed to load projects", true);
    }
  }

  postClient.addEventListener("change", populateProjectOptions);
  postLink.addEventListener("input", () => {
    if (!postDate.value) ensureDateValue();
  });
  submitButton.addEventListener("click", savePost);
  init();
})();
