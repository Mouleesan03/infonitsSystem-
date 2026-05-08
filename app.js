const STORAGE_KEY = "infonits.invoices";
const SETTINGS_KEY = "infonits.settings";
const CLIENTS_KEY = "infonits.clients";
const PROJECTS_KEY = "infonits.projects";
const PROJECT_TARGETS_KEY = "infonits.projectTargets";
const FINANCE_KEY = "infonits.financeRecords";
const SERVICES_KEY = "infonits.services";
const RENEWALS_KEY = "infonits.renewals";
const WEBSITE_LOGINS_KEY = "infonits.websiteLogins";
const EMPLOYEES_KEY = "infonits.employees";
const USERS_KEY = "infonits.users";
const CURRENT_USER_KEY = "infonits.currentUserId";
const AUTH_SESSION_KEY = "infonits.loggedInUserId";
const MANAGER_HANDLES_KEY = "infonits.managerHandles";
const SOCIAL_POSTS_KEY = "infonits.socialMediaPosts";
const CORRECTIONS_KEY = "infonits.corrections";
const PM_NOTIFICATIONS_KEY = "infonits.notifications";
const MONTHLY_POST_REPORTS_KEY = "infonits.monthlyPostReports";
const CLOUD_BACKUP_KEY = "infonits.cloudBackup";
const FINANCE_PAGE_SIZE = 8;
const RECENT_INVOICE_PAGE_SIZE = 8;
const CLIENT_PAGE_SIZE = 10;
const INVOICE_PAGE_SIZE = 10;
const PM_PROJECT_PAGE_SIZE = 6;
const PM_POST_PAGE_SIZE = 5;
const PM_WEEKLY_POST_TARGET = 3;
const PM_MONTHLY_POST_TARGET = PM_WEEKLY_POST_TARGET * 4;
const MAX_IMAGE_UPLOAD_SIZE = 2 * 1024 * 1024;

const defaultSettings = {
  businessName: "infonits",
  businessEmail: "hello@infonits.com",
  businessPhone: "+94 77 607 9157",
  businessAddress: "1st Lane Arasady Road, Nallur, Jaffna, Sri Lanka.",
  businessWebsite: "www.infonits.io",
  currencyLabel: "LKR",
  bankName: "Commercial Bank of Ceylon",
  accountName: "infonits Pvt Ltd.",
  accountNumber: "8001XXXXXXXX",
  bankBranch: "Jaffna",
  showPaymentDetails: "yes",
  contactPhone: "+94 77 607 9157",
  logoDataUrl: "assets/infonits-logo.jpg",
  autoProjectFinance: "no",
  aiMode: "local",
  aiApiKey: "",
};

const accessSections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "create", label: "Create Invoice" },
  { id: "clients", label: "Customers" },
  { id: "employees", label: "Employees" },
  { id: "services", label: "Service Catalog" },
  { id: "invoices", label: "Invoices" },
  { id: "quotations", label: "Quotations" },
  { id: "projects", label: "Projects" },
  { id: "manager", label: "Pr Tracker" },
  { id: "renewals", label: "Subscriptions" },
  { id: "logins", label: "Portal Access" },
  { id: "finance", label: "Finance" },
  { id: "users", label: "Users & Access" },
  { id: "settings", label: "Settings" },
];

const roleLabels = {
  admin: "Admin",
  "project-manager": "Project manager",
  designer: "Designer",
  developer: "Developer",
};

const roleDefaultAccess = {
  admin: accessSections.map((section) => section.id),
  "project-manager": ["dashboard", "clients", "invoices", "quotations", "projects", "manager", "renewals"],
  designer: ["dashboard", "projects", "manager", "services"],
  developer: ["dashboard", "create", "clients", "employees", "services", "invoices", "quotations", "projects", "manager", "renewals"],
};

let invoices = loadInvoices();
let clients = loadClients();
let projects = loadProjects();
let projectTargets = loadProjectTargets();
let financeRecords = loadFinanceRecords();
let services = loadServices();
let renewals = loadRenewals();
let websiteLogins = loadWebsiteLogins();
let employees = loadEmployees();
let users = hardenDefaultUserAccess(loadUsers());
let managerHandles = loadManagerHandles();
let socialMediaPosts = loadSocialMediaPosts();
let corrections = loadCorrections();
let pmNotifications = loadPmNotifications();
let monthlyPostReports = loadMonthlyPostReports();
let clientColors = {};
let settings = loadSettings();
let editingId = null;
let editingClientId = null;
let editingProjectId = null;
let editingServiceId = null;
let editingRenewalId = null;
let editingWebsiteLoginId = null;
let editingEmployeeId = null;
let editingUserId = null;
let editingManagerHandleId = null;
let editingSocialPostId = null;
let editingCorrectionId = null;
let linkedProjectId = null;
let currentUserId = sessionStorage.getItem(AUTH_SESSION_KEY) || "";
let activeUserSnapshot = null;
let selectedInvoiceId = invoices[0]?.id || null;
let previewZoom = 0.8;
let previewHidden = true;
let projectFormVisible = false;
let financePage = 1;
let recentInvoicesPage = 1;
let clientPage = 1;
let invoicePage = 1;
let pmProjectPage = 1;
let pmPostPage = 1;
let portalCalendarMonth = today().slice(0, 7);
let portalCalendarPinned = false;
let pendingEmployeePhotoDataUrl = "";
const visibleWebsitePasswords = new Set();

let appIsStarting = true;

const navTabs = document.querySelectorAll(".nav-tab");
const views = {
  dashboard: document.getElementById("dashboardView"),
  create: document.getElementById("createView"),
  clients: document.getElementById("clientsView"),
  employees: document.getElementById("employeesView"),
  services: document.getElementById("servicesView"),
  invoices: document.getElementById("invoicesView"),
  quotations: document.getElementById("quotationsView"),
  projects: document.getElementById("projectsView"),
  manager: document.getElementById("managerView"),
  renewals: document.getElementById("renewalsView"),
  logins: document.getElementById("loginsView"),
  finance: document.getElementById("financeView"),
  users: document.getElementById("usersView"),
  settings: document.getElementById("settingsView"),
};

const form = document.getElementById("invoiceForm");
const clientForm = document.getElementById("clientForm");
const projectForm = document.getElementById("projectForm");
const serviceForm = document.getElementById("serviceForm");
const renewalForm = document.getElementById("renewalForm");
const websiteLoginForm = document.getElementById("websiteLoginForm");
const employeeForm = document.getElementById("employeeForm");
const userForm = document.getElementById("userForm");
const managerHandleForm = document.getElementById("managerHandleForm");
const socialPostForm = document.getElementById("socialPostForm");
const correctionForm = document.querySelector("#correctionForm");
const itemsContainer = document.getElementById("itemsContainer");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const dashboardSearchInput = document.getElementById("dashboardSearchInput");
const aiPromptInput = document.getElementById("aiPromptInput");
const quotationSearchInput = document.getElementById("quotationSearchInput");
const quotationStatusFilter = document.getElementById("quotationStatusFilter");
const invoiceMonthFilter = document.getElementById("invoiceMonthFilter");
const quotationMonthFilter = document.getElementById("quotationMonthFilter");
const projectSearchInput = document.getElementById("projectSearchInput");
const projectMonthFilter = document.getElementById("projectMonthFilter");
const projectStatusFilter = document.getElementById("projectStatusFilter");
const projectUsdRate = document.getElementById("projectUsdRate");
const toggleProjectFormButton = document.getElementById("toggleProjectFormButton");
const financeForm = document.getElementById("financeForm");
const financeMonthFilter = document.getElementById("financeMonthFilter");
const financeTypeFilter = document.getElementById("financeTypeFilter");
const financeCategoryFilter = document.getElementById("financeCategoryFilter");
const renewalSearchInput = document.getElementById("renewalSearchInput");
const websiteLoginSearchInput = document.getElementById("websiteLoginSearchInput");
const employeeSearchInput = document.getElementById("employeeSearchInput");
const employeeStatusFilter = document.getElementById("employeeStatusFilter");
const appShell = document.getElementById("appShell");
const loginScreen = document.getElementById("loginScreen");
const appPreloader = document.getElementById("appPreloader");
const loginForm = document.getElementById("loginForm");
const userMenuButton = document.getElementById("userMenuButton");
const userMenu = document.getElementById("userMenu");
const activeUserInitial = document.getElementById("activeUserInitial");
const activeUserName = document.getElementById("activeUserName");
const activeUserRole = document.getElementById("activeUserRole");
const managerHandleSearchInput = document.getElementById("managerHandleSearchInput");
const pmMonthFilter = document.getElementById("pmMonthFilter");
const statementClientSelect = document.getElementById("statementClientSelect");
const clientSelect = document.getElementById("clientSelect");
const previewScale = document.getElementById("previewScale");
const previewZoomLabel = document.getElementById("previewZoomLabel");
const invoiceModal = document.getElementById("invoiceModal");

const countries = [
  "Sri Lanka",
  "Australia",
  "Canada",
  "India",
  "United Kingdom",
  "United States",
  "Germany",
  "France",
  "Italy",
  "Singapore",
  "Switzerland",
  "United Arab Emirates",
  "Qatar",
  "Saudi Arabia",
  "Malaysia",
  "Other",
];

const financeCategories = [
  "Client payment",
  "Project bonus",
  "Hosting",
  "Software",
  "Salary",
  "Freelancer",
  "Marketing",
  "Transport",
  "Office",
  "Rent",
  "Internet",
  "Home expenses",
  "Tax",
  "Saving",
  "Emergency fund",
  "Gold coin",
  "Gold jewellery",
  "Other",
];

const socialPlatforms = ["Facebook", "Instagram", "TikTok"];
const socialPostStatuses = [
  "Planned",
  "Design Pending",
  "Design Completed",
  "Waiting for Approval",
  "Approved",
  "Scheduled",
  "Uploaded",
  "Missed",
  "Correction Needed",
  "Cancelled",
];
const correctionStatuses = [
  "Received from Client",
  "Assigned to Designer",
  "Assigned to Developer",
  "In Progress",
  "Completed by Team",
  "Checked by Project Manager",
  "Sent to Client",
  "Approved by Client",
  "Need More Correction",
];

const aprilProjectSeed = [
  { name: "Tharany Super Market", clientName: "Tharany Super Market", valueLkr: 65000 },
  { name: "XMARD Social Media Marketing", clientName: "XMARD", valueLkr: 20000, repeat: "monthly" },
  { name: "Jeyadurga Website Maintainance", clientName: "Jeyadurga", valueLkr: 20773.95, valueUsd: 65, note: "wise", repeat: "monthly" },
  { name: "AB restaurants SM", clientName: "AB restaurants", valueLkr: 25000, repeat: "monthly" },
  { name: "Hertsgas SM", clientName: "Hertsgas", valueLkr: 22371.94, valueUsd: 70, repeat: "monthly" },
  { name: "KTN Motors SM", clientName: "KTN Motors", valueLkr: 22371.94, valueUsd: 70, repeat: "monthly" },
  { name: "Magazine 2 TESS", clientName: "TESS", valueLkr: 812101.57, valueUsd: 2541, payForWork: 160000 },
  { name: "Sekar Printers", clientName: "Sekar Printers", valueLkr: 47939.88, valueUsd: 150 },
  { name: "dev prohect yaso", clientName: "Yaso", valueLkr: 35000, note: "jhon", payForWork: 15000 },
  { name: "omkara logo", clientName: "Omkara", valueLkr: 30000, note: "ishuru", payForWork: 8000 },
  { name: "Subath Work CA", clientName: "Subath Work CA", valueLkr: 140623.65, valueUsd: 440, note: "flyers" },
  { name: "Thuva Card wedding", clientName: "Thuva", note: "200x400" },
  { name: "Trinethra Website", clientName: "Trinethra", valueLkr: 100000 },
  { name: "hindu mission rangoli", clientName: "Hindu Mission", valueLkr: 6391.98, valueUsd: 20 },
  { name: "Tess flyer", clientName: "TESS", valueLkr: 4793.99, valueUsd: 15 },
  { name: "TESS VALTHUMADAL", clientName: "TESS Valthumadal", valueLkr: 3195.99, valueUsd: 10 },
  { name: "Yarl YIT Branding", clientName: "Yarl YIT", valueLkr: 40000, advance: 20000 },
  { name: "Akie Services", clientName: "Akie Services", valueLkr: 1140545.68, valueUsd: 5000, advance: 500000, payForWork: 500000, paidForWork: 200000 },
];

const defaultServices = [
  {
    name: "Website Design & Development",
    category: "Website",
    currency: "LKR",
    price: 100000,
    billing: "one-time",
    description: "Custom responsive website design and development with basic SEO and contact form setup.",
  },
  {
    name: "Website Maintenance & Support",
    category: "Maintenance",
    currency: "USD",
    price: 210,
    billing: "monthly",
    description: "Monthly website updates, security checks, backups, performance monitoring, and minor content revisions.",
  },
  {
    name: "Domain, Hosting & SSL Renewal",
    category: "Hosting",
    currency: "LKR",
    price: 0,
    billing: "yearly",
    description: "Domain, hosting, SSL, email, and server renewal management.",
  },
  {
    name: "Social Media Marketing",
    category: "Social Media",
    currency: "LKR",
    price: 25000,
    billing: "monthly",
    description: "Monthly social media campaign planning, creative posts, and page management.",
  },
];

function loadInvoices() {
  return [];
}

function saveInvoices() {
  syncCollectionToSupabase("invoices");
}

function loadClients() {
  return [];
}

function saveClients() {
  clients = normalizeClientRecords();
  syncCollectionToSupabase("clients");
}

function loadProjects() {
  return [];
}

function saveProjects() {
  syncCollectionToSupabase("projects");
}

function loadProjectTargets() {
  return {};
}

function saveProjectTargets() {
  syncCollectionToSupabase("projectTargets");
}

function loadFinanceRecords() {
  return [];
}

function saveFinanceRecords() {
  syncCollectionToSupabase("financeRecords");
}

function loadServices() {
  return [];
}

function saveServices() {
  syncCollectionToSupabase("services");
}

function loadRenewals() {
  return [];
}

function saveRenewals() {
  syncCollectionToSupabase("renewals");
}

function loadWebsiteLogins() {
  return [];
}

function saveWebsiteLogins() {
  syncCollectionToSupabase("websiteLogins");
}

function loadEmployees() {
  return [];
}

function saveEmployees() {
  syncCollectionToSupabase("employees");
}

function defaultUsers() {
  return [
    { id: "admin", name: "Admin", username: "admin", passwordHash: encodePassword("admin123"), email: "", role: "admin", status: "Active", access: roleDefaultAccess.admin, updatedAt: new Date().toISOString() },
    { id: "project-manager", name: "Project Manager", username: "manager", passwordHash: encodePassword("manager123"), email: "", role: "project-manager", status: "Active", access: roleDefaultAccess["project-manager"], updatedAt: new Date().toISOString() },
    { id: "designer", name: "Designer", username: "designer", passwordHash: encodePassword("designer123"), email: "", role: "designer", status: "Active", access: roleDefaultAccess.designer, updatedAt: new Date().toISOString() },
    { id: "developer", name: "Developer", username: "developer", passwordHash: encodePassword("developer123"), email: "", role: "developer", status: "Active", access: roleDefaultAccess.developer, updatedAt: new Date().toISOString() },
  ];
}

function encodePassword(password = "") {
  return btoa(unescape(encodeURIComponent(password)));
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
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((hashPart) => hashPart.toString(16).padStart(8, "0")).join("");
}

function passwordMatches(user, password, hashedPassword) {
  const savedHash = user.passwordHash || "";
  return savedHash === hashedPassword || savedHash === encodePassword(password);
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

function normalizeUser(user) {
  const username = user.username || String(user.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "user";
  return {
    ...user,
    username,
    passwordHash: user.passwordHash || encodePassword(user.password || `${username}123`),
    access: user.role === "admin" ? roleDefaultAccess.admin : user.access || roleDefaultAccess[user.role] || ["dashboard"],
  };
}

function loadUsers() {
  return defaultUsers();
}

function hardenDefaultUserAccess(savedUsers) {
  const defaultAccountIds = new Set(["project-manager", "designer", "developer"]);
  return savedUsers.map((user) => {
    if (!defaultAccountIds.has(user.id) || user.role === "admin") return user;
    return {
      ...user,
      access: roleDefaultAccess[user.role] || ["dashboard"],
      updatedAt: user.updatedAt || new Date().toISOString(),
    };
  });
}

function ensureDefaultAdminUser() {
  const defaultAdmin = defaultUsers()[0];
  const admin = users.find((user) => user.id === "admin" || String(user.username || "").trim().toLowerCase() === "admin");
  if (!admin) {
    users = [defaultAdmin, ...users];
    return;
  }
  users = users.map((user) =>
    user.id === admin.id
      ? {
          ...defaultAdmin,
          ...user,
          id: user.id || "admin",
          username: "admin",
          role: "admin",
          status: "Active",
          access: roleDefaultAccess.admin,
        }
      : user,
  );
}

function saveUsers() {
  syncCollectionToSupabase("users");
}

function loadManagerHandles() {
  return [];
}

function saveManagerHandles() {
  syncCollectionToSupabase("managerHandles");
}

function loadSocialMediaPosts() {
  return [];
}

function saveSocialMediaPosts() {
  syncCollectionToSupabase("socialMediaPosts");
}

function loadCorrections() {
  return [];
}

function saveCorrections() {
  syncCollectionToSupabase("corrections");
}

function loadPmNotifications() {
  return [];
}

function savePmNotifications() {
  syncCollectionToSupabase("pmNotifications");
}

function loadMonthlyPostReports() {
  return [];
}

function saveMonthlyPostReports() {
  syncCollectionToSupabase("monthlyPostReports");
}

function refreshStateFromStorage() {
  invoices = loadInvoices();
  clients = loadClients();
  projects = loadProjects();
  projectTargets = loadProjectTargets();
  financeRecords = loadFinanceRecords();
  services = loadServices();
  renewals = loadRenewals();
  websiteLogins = loadWebsiteLogins();
  employees = loadEmployees();
  users = hardenDefaultUserAccess(loadUsers());
  managerHandles = loadManagerHandles();
  socialMediaPosts = loadSocialMediaPosts();
  corrections = loadCorrections();
  pmNotifications = loadPmNotifications();
  monthlyPostReports = loadMonthlyPostReports();
  settings = loadSettings();
  currentUserId = "";
  selectedInvoiceId = invoices[0]?.id || null;
}

function loadSettings() {
  return { ...defaultSettings };
}

function saveSettings() {
  syncCollectionToSupabase("settings");
}

function loadCloudBackupSettings() {
  try {
    const hostedConfig = window.INFONITS_SUPABASE || {};
    return {
      url: hostedConfig.url || "",
      anonKey: hostedConfig.anonKey || "",
      backupId: hostedConfig.backupId || "infonits-main",
      autoBackup: "live",
      lastAutoBackupDate: "",
    };
  } catch {
    const hostedConfig = window.INFONITS_SUPABASE || {};
    return { url: hostedConfig.url || "", anonKey: hostedConfig.anonKey || "", backupId: hostedConfig.backupId || "infonits-main", autoBackup: "live", lastAutoBackupDate: "" };
  }
}

function saveCloudBackupSettings(config) {
  window.INFONITS_SUPABASE = {
    ...(window.INFONITS_SUPABASE || {}),
    url: config.url || "",
    anonKey: config.anonKey || "",
    backupId: config.backupId || "infonits-main",
  };
}

let cloudBackupTimer = null;

function cloudBackupIsReady(config = loadCloudBackupSettings()) {
  return Boolean(config.url && config.anonKey && config.backupId);
}

function queueCloudBackup() {
  return;
}

function supabaseConfig() {
  return loadCloudBackupSettings();
}

function supabaseReady() {
  const config = supabaseConfig();
  return Boolean(config.url && config.anonKey && !String(config.url).includes("PASTE_SUPABASE"));
}

function supabaseTableUrl(table, query = "") {
  const config = supabaseConfig();
  return `${config.url}/rest/v1/${table}${query}`;
}

function supabaseTableHeaders(extra = {}) {
  const config = supabaseConfig();
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function cleanDate(value, fallback = today()) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? value : fallback;
}

function cleanNumber(value) {
  return Number(value || 0) || 0;
}

function payloadId(item, fallback) {
  return String(item?.id || item?.invoiceNumber || item?.clientCode || item?.name || fallback);
}

function invoiceSubtotalValue(invoice) {
  return (invoice.items || []).reduce((sum, item) => sum + cleanNumber(item.amount || cleanNumber(item.quantity) * cleanNumber(item.price)), 0);
}

function invoiceTotalValue(invoice) {
  const subtotal = invoiceSubtotalValue(invoice);
  const tax = subtotal * (cleanNumber(invoice.taxRate) / 100);
  return Math.max(0, subtotal + tax - cleanNumber(invoice.discount) - cleanNumber(invoice.advancePaid));
}

function hasUsefulPayload(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

function rowPayload(row, fallback) {
  return hasUsefulPayload(row.payload) ? row.payload : fallback;
}

const supabaseDirectCollections = {
  clients: {
    table: "clients",
    get: () => clients,
    set: (rows) => {
      clients = normalizeClientRecords(rows);
    },
    toRow: (client, index) => ({
      app_id: payloadId(client, `client-${index + 1}`),
      client_code: client.clientCode || null,
      name: client.name || "Client",
      email: client.email || "",
      phone: client.phone || "",
      country: client.country || "",
      billing_address: client.address || client.billingAddress || "",
      payload: client,
      updated_at: client.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        clientCode: row.client_code || "",
        name: row.name || "Client",
        email: row.email || "",
        phone: row.phone || "",
        country: row.country || "",
        address: row.billing_address || "",
        updatedAt: row.updated_at || "",
      }),
  },
  employees: {
    table: "employees",
    get: () => employees,
    set: (rows) => {
      employees = rows;
    },
    toRow: (employee, index) => ({
      app_id: payloadId(employee, `employee-${index + 1}`),
      name: employee.name || [employee.firstName, employee.lastName].filter(Boolean).join(" ") || "Employee",
      role: employee.jobTitle || employee.role || "",
      email: employee.workEmail || employee.email || "",
      phone: employee.phone || "",
      status: employee.status || "Active",
      payload: employee,
      updated_at: employee.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        name: row.name || "Employee",
        jobTitle: row.role || "",
        workEmail: row.email || "",
        phone: row.phone || "",
        status: row.status || "Active",
        updatedAt: row.updated_at || "",
      }),
  },
  services: {
    table: "services",
    get: () => services,
    set: (rows) => {
      services = rows;
    },
    toRow: (service, index) => ({
      app_id: payloadId(service, `service-${index + 1}`),
      title: service.name || service.title || "Service",
      description: service.description || "",
      default_amount: cleanNumber(service.price || service.defaultAmount),
      currency: service.currency || "LKR",
      payload: service,
      updated_at: service.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        name: row.title || "Service",
        title: row.title || "Service",
        description: row.description || "",
        price: cleanNumber(row.default_amount),
        currency: row.currency || "LKR",
        updatedAt: row.updated_at || "",
      }),
  },
  invoices: {
    table: "invoices",
    get: () => invoices,
    set: (rows) => {
      invoices = rows;
    },
    toRow: (invoice, index) => ({
      app_id: payloadId(invoice, `invoice-${index + 1}`),
      document_type: invoice.documentType || "Invoice",
      invoice_no: invoice.invoiceNumber || `DOC-${index + 1}`,
      client_name: invoice.customerName || "Customer",
      issue_date: cleanDate(invoice.invoiceDate),
      due_date: cleanDate(invoice.dueDate || invoice.invoiceDate),
      status: invoice.status || "Unpaid",
      currency: invoice.currency || invoice.invoiceCurrency || settings.currencyLabel || "LKR",
      subtotal: invoiceSubtotalValue(invoice),
      tax: invoiceSubtotalValue(invoice) * (cleanNumber(invoice.taxRate) / 100),
      discount: cleanNumber(invoice.discount),
      advance_paid: cleanNumber(invoice.advancePaid),
      total: invoiceTotalValue(invoice),
      payload: invoice,
      updated_at: invoice.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        documentType: row.document_type || "Invoice",
        invoiceNumber: row.invoice_no || "",
        customerName: row.client_name || "Customer",
        invoiceDate: row.issue_date || today(),
        dueDate: row.due_date || row.issue_date || today(),
        status: row.status || "Unpaid",
        currency: row.currency || "LKR",
        items: [
          {
            title: "Service",
            description: "",
            quantity: "",
            price: "",
            amount: cleanNumber(row.subtotal || row.total),
          },
        ],
        taxRate: row.subtotal ? (cleanNumber(row.tax) / cleanNumber(row.subtotal)) * 100 : 0,
        discount: cleanNumber(row.discount),
        advancePaid: cleanNumber(row.advance_paid),
        updatedAt: row.updated_at || "",
      }),
  },
  projects: {
    table: "projects",
    get: () => projects,
    set: (rows) => {
      projects = rows;
    },
    toRow: (project, index) => ({
      app_id: payloadId(project, `project-${index + 1}`),
      client_name: project.clientName || project.name || "Client",
      project_name: project.name || project.projectName || "Project",
      month: project.month || today().slice(0, 7),
      status: project.paymentStatus || project.status || "Waiting",
      currency: cleanNumber(project.valueUsd) ? "USD" : "LKR",
      project_value: cleanNumber(project.valueLkr || project.valueUsd),
      advance_received: cleanNumber(project.advance),
      pay_for_work: cleanNumber(project.payForWork),
      paid_for_work: cleanNumber(project.paidForWork),
      note: project.note || "",
      payload: project,
      updated_at: project.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        clientName: row.client_name || "Client",
        name: row.project_name || "Project",
        month: row.month || today().slice(0, 7),
        paymentStatus: row.status || "Waiting",
        valueLkr: row.currency === "USD" ? 0 : cleanNumber(row.project_value),
        valueUsd: row.currency === "USD" ? cleanNumber(row.project_value) : 0,
        advance: cleanNumber(row.advance_received),
        payForWork: cleanNumber(row.pay_for_work),
        paidForWork: cleanNumber(row.paid_for_work),
        note: row.note || "",
        updatedAt: row.updated_at || "",
      }),
  },
  socialMediaPosts: {
    table: "social_media_posts",
    get: () => socialMediaPosts,
    set: (rows) => {
      socialMediaPosts = rows;
    },
    toRow: (post, index) => ({
      app_id: payloadId(post, `post-${index + 1}`),
      client_name: post.clientName || "Client",
      project_name: post.projectName || "Project",
      posted_date: cleanDate(post.postedDate || post.date),
      post_count: cleanNumber(post.count || post.postCount || 1) || 1,
      platforms: Array.isArray(post.platforms) ? post.platforms : [post.platform].filter(Boolean),
      platform_links: post.platformLinks || {},
      note: post.note || post.remarks || "",
      payload: post,
      updated_at: post.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        clientName: row.client_name || "Client",
        projectName: row.project_name || "Project",
        postedDate: row.posted_date || today(),
        count: cleanNumber(row.post_count || 1) || 1,
        platforms: Array.isArray(row.platforms) ? row.platforms : [],
        platformLinks: row.platform_links || {},
        note: row.note || "",
        updatedAt: row.updated_at || "",
      }),
  },
  financeRecords: {
    table: "finance_records",
    get: () => financeRecords,
    set: (rows) => {
      financeRecords = rows;
    },
    toRow: (record, index) => ({
      app_id: payloadId(record, `finance-${index + 1}`),
      record_date: cleanDate(record.date),
      month: String(record.date || today()).slice(0, 7),
      type: record.type || "expense",
      category: record.category || "General",
      amount: cleanNumber(record.amount),
      status: record.status || "unpaid",
      source_type: record.sourceType || "",
      source_id: record.sourceId || "",
      repeat: record.repeat || "none",
      note: record.note || "",
      payload: record,
      updated_at: record.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        date: row.record_date || today(),
        type: row.type || "expense",
        category: row.category || "General",
        amount: cleanNumber(row.amount),
        status: row.status || "unpaid",
        sourceType: row.source_type || "",
        sourceId: row.source_id || "",
        repeat: row.repeat || "none",
        note: row.note || "",
        updatedAt: row.updated_at || "",
      }),
  },
  renewals: {
    table: "renewals",
    get: () => renewals,
    set: (rows) => {
      renewals = rows;
    },
    toRow: (renewal, index) => ({
      app_id: payloadId(renewal, `renewal-${index + 1}`),
      name: renewal.name || "Renewal",
      renewal_type: renewal.type || renewal.renewalType || "Renewal",
      renewal_date: cleanDate(renewal.date || renewal.renewalDate),
      amount: cleanNumber(renewal.amount),
      status: renewal.status || "Active",
      note: renewal.note || "",
      payload: renewal,
      updated_at: renewal.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        name: row.name || "Renewal",
        type: row.renewal_type || "Renewal",
        renewalType: row.renewal_type || "Renewal",
        date: row.renewal_date || today(),
        renewalDate: row.renewal_date || today(),
        amount: cleanNumber(row.amount),
        status: row.status || "Active",
        note: row.note || "",
        updatedAt: row.updated_at || "",
      }),
  },
  websiteLogins: {
    table: "website_logins",
    get: () => websiteLogins,
    set: (rows) => {
      websiteLogins = rows;
    },
    toRow: (login, index) => ({
      app_id: payloadId(login, `login-${index + 1}`),
      website_name: login.websiteName || "Website",
      website_login_url: login.websiteLoginUrl || "",
      username: login.username || "",
      password_encrypted: login.password || "",
      domain_source: login.domainSource || "",
      domain_login_url: login.domainLoginUrl || "",
      hosting_provider: login.hostingProvider || "",
      hosting_login_url: login.hostingLoginUrl || "",
      domain_renewal_date: login.domainRenewalDate || null,
      hosting_renewal_date: login.hostingRenewalDate || null,
      note: login.note || "",
      payload: login,
      updated_at: login.updatedAt || new Date().toISOString(),
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        websiteName: row.website_name || "Website",
        websiteLoginUrl: row.website_login_url || "",
        username: row.username || "",
        password: row.password_encrypted || "",
        domainSource: row.domain_source || "",
        domainLoginUrl: row.domain_login_url || "",
        hostingProvider: row.hosting_provider || "",
        hostingLoginUrl: row.hosting_login_url || "",
        domainRenewalDate: row.domain_renewal_date || "",
        hostingRenewalDate: row.hosting_renewal_date || "",
        note: row.note || "",
        updatedAt: row.updated_at || "",
      }),
  },
  pmNotifications: {
    table: "notifications",
    get: () => pmNotifications,
    set: (rows) => {
      pmNotifications = rows;
    },
    toRow: (notification, index) => ({
      app_id: payloadId(notification, `notification-${index + 1}`),
      type: notification.type || "Notification",
      title: notification.title || notification.message || "Notification",
      message: notification.message || "",
      status: notification.status || "Unread",
      payload: notification,
    }),
    fromRow: (row) =>
      rowPayload(row, {
        id: row.app_id || row.id,
        type: row.type || "Notification",
        title: row.title || "Notification",
        message: row.message || "",
        status: row.status || "Unread",
      }),
  },
};

const supabaseAppDataCollections = {
  users: {
    get: () => users,
    set: (value) => {
      users = hardenDefaultUserAccess((Array.isArray(value) && value.length ? value : defaultUsers()).map(normalizeUser));
    },
  },
  managerHandles: {
    get: () => managerHandles,
    set: (value) => {
      managerHandles = Array.isArray(value) ? value : [];
    },
  },
  corrections: {
    get: () => corrections,
    set: (value) => {
      corrections = Array.isArray(value) ? value : [];
    },
  },
  monthlyPostReports: {
    get: () => monthlyPostReports,
    set: (value) => {
      monthlyPostReports = Array.isArray(value) ? value : [];
    },
  },
  clientColors: {
    get: () => clientColors,
    set: (value) => {
      clientColors = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    },
  },
  projectTargets: {
    get: () => projectTargets,
    set: (value) => {
      projectTargets = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    },
  },
};

const supabaseSyncTimers = {};
let pendingSupabaseSaves = 0;

function setSupabaseSaveStatus(status) {
  const labels = {
    saving: "Saving to Supabase...",
    saved: "Saved to Supabase",
    failed: "Supabase save failed",
  };
  if (labels[status]) showToast(labels[status]);
}

function syncCollectionToSupabase(collection) {
  if (!supabaseReady()) return;
  window.clearTimeout(supabaseSyncTimers[collection]);
  supabaseSyncTimers[collection] = window.setTimeout(() => {
    pendingSupabaseSaves += 1;
    if (pendingSupabaseSaves === 1) setSupabaseSaveStatus("saving");
    writeCollectionToSupabase(collection)
      .then(() => {
        pendingSupabaseSaves = Math.max(0, pendingSupabaseSaves - 1);
        if (!pendingSupabaseSaves) setSupabaseSaveStatus("saved");
      })
      .catch((error) => {
        pendingSupabaseSaves = Math.max(0, pendingSupabaseSaves - 1);
        console.error(error);
        showToast(`Supabase save failed: ${collection}`);
      });
  }, 350);
}

function syncAllCollectionsToSupabase() {
  Object.keys(supabaseDirectCollections).forEach(syncCollectionToSupabase);
  Object.keys(supabaseAppDataCollections).forEach(syncCollectionToSupabase);
  syncCollectionToSupabase("settings");
}

function saveClientColors() {
  syncCollectionToSupabase("clientColors");
}

async function syncAllCollectionsToSupabaseNow(options = {}) {
  if (!supabaseReady()) return false;
  Object.values(supabaseSyncTimers).forEach((timer) => window.clearTimeout(timer));
  const collections = [
    ...Object.keys(supabaseDirectCollections),
    ...Object.keys(supabaseAppDataCollections),
    "settings",
  ];
  setSupabaseSaveStatus("saving");
  const results = await Promise.allSettled(collections.map((collection) => writeCollectionToSupabase(collection, options)));
  const failed = results
    .map((result, index) => (result.status === "rejected" ? collections[index] : ""))
    .filter(Boolean);
  if (failed.length) {
    console.error("Supabase immediate save failed:", failed, results);
    showToast(`Supabase save failed: ${failed.slice(0, 3).join(", ")}`);
    return false;
  }
  setSupabaseSaveStatus("saved");
  return true;
}

async function deleteSupabaseRows(table, keepAppIds = []) {
  const keepFilter = keepAppIds.length ? `&app_id=not.in.(${keepAppIds.map((id) => encodeURIComponent(id)).join(",")})` : "";
  const response = await fetch(supabaseTableUrl(table, `?app_id=not.is.null${keepFilter}`), {
    method: "DELETE",
    headers: supabaseTableHeaders({ Prefer: "return=minimal" }),
  });
  if (!response.ok) throw new Error(await response.text());
}

function deleteSupabaseRecord(collection, id) {
  const direct = supabaseDirectCollections[collection];
  if (!supabaseReady() || !direct || !id) return;
  fetch(supabaseTableUrl(direct.table, `?app_id=eq.${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: supabaseTableHeaders({ Prefer: "return=minimal" }),
  }).catch((error) => {
    console.error(error);
    showToast(`Supabase delete failed: ${collection}`);
  });
}

async function insertSupabaseRows(table, rows) {
  if (!rows.length) return;
  const response = await fetch(supabaseTableUrl(table, "?on_conflict=app_id"), {
    method: "POST",
    headers: supabaseTableHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(await response.text());
}

async function writeCollectionToSupabase(collection, options = {}) {
  if (!supabaseReady()) return false;
  if (collection === "settings") {
    const response = await fetch(supabaseTableUrl("app_settings"), {
      method: "POST",
      headers: supabaseTableHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({ id: "default", payload: settings, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(await response.text());
    return true;
  }
  const direct = supabaseDirectCollections[collection];
  if (direct) {
    const rows = direct.get().map(direct.toRow);
    await insertSupabaseRows(direct.table, rows);
    if (options.replaceStale) {
      await deleteSupabaseRows(direct.table, rows.map((row) => row.app_id).filter(Boolean));
    }
    return true;
  }
  const appData = supabaseAppDataCollections[collection];
  if (appData) {
    const response = await fetch(supabaseTableUrl("app_data", `?collection=eq.${encodeURIComponent(collection)}`), {
      method: "DELETE",
      headers: supabaseTableHeaders({ Prefer: "return=minimal" }),
    });
    if (!response.ok) throw new Error(await response.text());
    const insertResponse = await fetch(supabaseTableUrl("app_data"), {
      method: "POST",
      headers: supabaseTableHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({ collection, app_id: "main", payload: appData.get(), updated_at: new Date().toISOString() }),
    });
    if (!insertResponse.ok) throw new Error(await insertResponse.text());
    return true;
  }
  return false;
}

async function readTableRows(config) {
  const response = await fetch(supabaseTableUrl(config.table, "?select=*"), {
    headers: supabaseTableHeaders(),
  });
  if (!response.ok) throw new Error(await response.text());
  const rows = await response.json();
  return rows
    .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
    .map((row) => config.fromRow(row))
    .filter(Boolean);
}

async function readAppDataPayload(collection, fallback) {
  const response = await fetch(supabaseTableUrl("app_data", `?collection=eq.${encodeURIComponent(collection)}&app_id=eq.main&select=payload&limit=1`), {
    headers: supabaseTableHeaders(),
  });
  if (!response.ok) throw new Error(await response.text());
  const rows = await response.json();
  return rows[0]?.payload ?? fallback;
}

async function checkSupabaseTables() {
  if (!supabaseReady()) return [];
  const tableChecks = [
    ...Object.values(supabaseDirectCollections).map((config) => config.table),
    "app_data",
    "app_settings",
  ];
  const checks = await Promise.allSettled(
    [...new Set(tableChecks)].map(async (table) => {
      const response = await fetch(supabaseTableUrl(table, "?select=*&limit=1"), {
        headers: supabaseTableHeaders(),
      });
      if (!response.ok) throw new Error(`${table}: ${await response.text()}`);
      return table;
    }),
  );
  return checks
    .map((result, index) => (result.status === "rejected" ? [...new Set(tableChecks)][index] : ""))
    .filter(Boolean);
}

async function loadAllDataFromSupabase() {
  if (!supabaseReady()) {
    showToast("Supabase config missing");
    return false;
  }
  let hasLoadError = false;
  try {
    const failedTables = await checkSupabaseTables();
    if (failedTables.length) {
      console.error("Supabase table check failed:", failedTables);
      showToast(`Check Supabase SQL: ${failedTables.slice(0, 3).join(", ")}`);
    }
    const directEntries = Object.entries(supabaseDirectCollections);
    const directData = await Promise.allSettled(directEntries.map(([, config]) => readTableRows(config)));
    directEntries.forEach(([collection, config], index) => {
      const result = directData[index];
      if (result.status === "fulfilled") {
        config.set(result.value);
      } else {
        hasLoadError = true;
        console.error(`Supabase load failed: ${collection}`, result.reason);
      }
    });

    const appDataEntries = Object.entries(supabaseAppDataCollections);
    const appData = await Promise.allSettled(appDataEntries.map(([collection, config]) => readAppDataPayload(collection, config.get())));
    appDataEntries.forEach(([collection, config], index) => {
      const result = appData[index];
      if (result.status === "fulfilled") {
        config.set(result.value);
      } else {
        hasLoadError = true;
        console.error(`Supabase app data load failed: ${collection}`, result.reason);
      }
    });

    const settingsResponse = await fetch(supabaseTableUrl("app_settings", "?id=eq.default&select=payload&limit=1"), {
      headers: supabaseTableHeaders(),
    });
    if (settingsResponse.ok) {
      const settingsRows = await settingsResponse.json();
      settings = { ...defaultSettings, ...(settingsRows[0]?.payload || {}) };
    }
    selectedInvoiceId = invoices[0]?.id || null;
    ensureDefaultAdminUser();
    if (hasLoadError) showToast("Some Supabase tables could not load");
    return true;
  } catch (error) {
    console.error(error);
    showToast("Supabase data load failed");
    return false;
  }
}

function readOldLocalJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function removeOldLocalData() {
  [
    STORAGE_KEY,
    SETTINGS_KEY,
    CLIENTS_KEY,
    PROJECTS_KEY,
    PROJECT_TARGETS_KEY,
    FINANCE_KEY,
    SERVICES_KEY,
    RENEWALS_KEY,
    WEBSITE_LOGINS_KEY,
    EMPLOYEES_KEY,
    USERS_KEY,
    CURRENT_USER_KEY,
    AUTH_SESSION_KEY,
    MANAGER_HANDLES_KEY,
    SOCIAL_POSTS_KEY,
    CORRECTIONS_KEY,
    PM_NOTIFICATIONS_KEY,
    MONTHLY_POST_REPORTS_KEY,
    CLOUD_BACKUP_KEY,
  ].forEach((key) => localStorage.removeItem(key));
}

function oldLocalDataExists() {
  return [
    STORAGE_KEY,
    CLIENTS_KEY,
    PROJECTS_KEY,
    FINANCE_KEY,
    SERVICES_KEY,
    RENEWALS_KEY,
    WEBSITE_LOGINS_KEY,
    EMPLOYEES_KEY,
    USERS_KEY,
    MANAGER_HANDLES_KEY,
    SOCIAL_POSTS_KEY,
    SETTINGS_KEY,
  ].some((key) => localStorage.getItem(key) !== null);
}

async function migrateOldLocalDataToSupabase() {
  if (!oldLocalDataExists()) return false;
  const oldData = {
    invoices: readOldLocalJson(STORAGE_KEY, []),
    clients: readOldLocalJson(CLIENTS_KEY, []),
    projects: readOldLocalJson(PROJECTS_KEY, []),
    projectTargets: readOldLocalJson(PROJECT_TARGETS_KEY, {}),
    financeRecords: readOldLocalJson(FINANCE_KEY, []),
    services: readOldLocalJson(SERVICES_KEY, []),
    renewals: readOldLocalJson(RENEWALS_KEY, []),
    websiteLogins: readOldLocalJson(WEBSITE_LOGINS_KEY, []),
    employees: readOldLocalJson(EMPLOYEES_KEY, []),
    users: readOldLocalJson(USERS_KEY, []),
    managerHandles: readOldLocalJson(MANAGER_HANDLES_KEY, []),
    socialMediaPosts: readOldLocalJson(SOCIAL_POSTS_KEY, []),
    corrections: readOldLocalJson(CORRECTIONS_KEY, []),
    pmNotifications: readOldLocalJson(PM_NOTIFICATIONS_KEY, []),
    monthlyPostReports: readOldLocalJson(MONTHLY_POST_REPORTS_KEY, []),
    settings: readOldLocalJson(SETTINGS_KEY, {}),
  };
  let moved = false;
  if (!invoices.length && oldData.invoices.length) { invoices = oldData.invoices; moved = true; }
  if (!clients.length && oldData.clients.length) { clients = oldData.clients; moved = true; }
  if (!projects.length && oldData.projects.length) { projects = oldData.projects; moved = true; }
  if (!Object.keys(projectTargets).length && Object.keys(oldData.projectTargets).length) { projectTargets = oldData.projectTargets; moved = true; }
  if (!financeRecords.length && oldData.financeRecords.length) { financeRecords = oldData.financeRecords; moved = true; }
  if (!services.length && oldData.services.length) { services = oldData.services; moved = true; }
  if (!renewals.length && oldData.renewals.length) { renewals = oldData.renewals; moved = true; }
  if (!websiteLogins.length && oldData.websiteLogins.length) { websiteLogins = oldData.websiteLogins; moved = true; }
  if (!employees.length && oldData.employees.length) { employees = oldData.employees; moved = true; }
  if (users.length <= defaultUsers().length && oldData.users.length) { users = hardenDefaultUserAccess(oldData.users.map(normalizeUser)); moved = true; }
  if (!managerHandles.length && oldData.managerHandles.length) { managerHandles = oldData.managerHandles; moved = true; }
  if (!socialMediaPosts.length && oldData.socialMediaPosts.length) { socialMediaPosts = oldData.socialMediaPosts; moved = true; }
  if (!corrections.length && oldData.corrections.length) { corrections = oldData.corrections; moved = true; }
  if (!pmNotifications.length && oldData.pmNotifications.length) { pmNotifications = oldData.pmNotifications; moved = true; }
  if (!monthlyPostReports.length && oldData.monthlyPostReports.length) { monthlyPostReports = oldData.monthlyPostReports; moved = true; }
  if (Object.keys(oldData.settings).length) { settings = { ...defaultSettings, ...settings, ...oldData.settings }; moved = true; }
  removeOldLocalData();
  if (!moved) return false;
  await syncAllCollectionsToSupabaseNow();
  showToast("Old browser data moved to Supabase");
  return true;
}

function addSheetDetailsToProjectsAndClients() {
  if (projects.length || clients.length) return;

  let changedProjects = false;
  let changedClients = false;
  const month = "2026-04";
  const now = new Date().toISOString();

  aprilProjectSeed.forEach((seed, index) => {
    const alreadyProject = projects.some((project) => {
      return project.month === month && project.name.trim().toLowerCase() === seed.name.toLowerCase();
    });
    if (!alreadyProject) {
      projects.push({
        id: `april-2026-project-${index + 1}`,
        month,
        name: seed.name,
        clientName: seed.clientName || seed.name,
        valueLkr: Number(seed.valueLkr || 0),
        valueUsd: Number(seed.valueUsd || 0),
        note: seed.note || "",
        advance: Number(seed.advance || 0),
        payForWork: Number(seed.payForWork || 0),
        paidForWork: Number(seed.paidForWork || 0),
        paymentStatus: "Waiting",
        repeat: seed.repeat || "no",
        worker: seed.worker || "",
        updatedAt: now,
      });
      changedProjects = true;
    }

    const clientName = seed.clientName || seed.name;
    const alreadyClient = clients.some((client) => client.name.trim().toLowerCase() === clientName.toLowerCase());
    if (!alreadyClient) {
      clients.push({
        id: `april-2026-client-${index + 1}`,
        name: clientName,
        email: "",
        phone: "",
        country: "Sri Lanka",
        address: "",
        updatedAt: now,
      });
      changedClients = true;
    }
  });

  if (!projectTargets[month]) {
    projectTargets[month] = { usdRate: 319.6 };
    saveProjectTargets();
  }
  if (changedProjects) saveProjects();
  if (changedClients) saveClients();
}

function seedDefaultServices() {
  if (services.length) return;
  services = defaultServices.map((service, index) => ({
    id: `default-service-${index + 1}`,
    updatedAt: new Date().toISOString(),
    ...service,
  }));
  saveServices();
}

function formatNumber(value, options = {}) {
  const number = Number(value || 0);
  return number.toLocaleString("en-LK", {
    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
    ...options,
  });
}

function currencyPrefix(currency = settings.currencyLabel) {
  const symbols = {
    LKR: "Rs.",
    USD: "$",
    AUD: "A$",
    GBP: "£",
    CAD: "C$",
  };
  return symbols[currency] || currency || "LKR";
}

function money(value, currency = settings.currencyLabel) {
  const number = Number(value || 0);
  const sign = number < 0 ? "-" : "";
  return `${sign}${currencyPrefix(currency)} ${formatNumber(Math.abs(number))}`.trim();
}

function compactMoney(value, currency = settings.currencyLabel) {
  return money(value, currency);
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatPhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+94 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("94")) {
    return `+94 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return raw.replace(/\s+/g, " ");
}

function parseFormattedNumber(value) {
  return Number(String(value || "").replace(/,/g, "").trim() || 0);
}

function formatMonth(monthValue) {
  if (!monthValue) return "";
  const [year, month] = String(monthValue).split("-").map(Number);
  if (!year || !month) return String(monthValue);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(dateString, months) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function generateInvoiceNumber() {
  return generateDocumentNumber(document.getElementById("documentType")?.value || "Invoice");
}

function generateDocumentNumber(type = "Invoice", dateString = document.getElementById("invoiceDate")?.value || today()) {
  const prefix = type === "Quotation" ? "INQU" : "INFO";
  const datePart = compactDate(dateString);
  const base = `${prefix}${datePart}`;
  const sameDayCount = invoices.filter((invoice) => {
    return (invoice.documentType || "Invoice") === type && String(invoice.invoiceNumber || "").startsWith(base);
  }).length;
  return sameDayCount === 0 ? base : `${base}-${sameDayCount + 1}`;
}

function compactDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year.slice(2)}${month}${day}`;
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `invoice-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generateClientCode() {
  const year = String(new Date().getFullYear()).slice(2);
  const maxNumber = clients.reduce((max, client) => {
    const match = String(client.clientCode || "").match(/^CL\d{2}(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `CL${year}${String(maxNumber + 1).padStart(4, "0")}`;
}

function normalizeClientRecords(records = clients) {
  const year = String(new Date().getFullYear()).slice(2);
  const usedIds = new Set();
  const usedCodes = new Set();
  const usedNames = new Set();
  let codeCounter = records.reduce((max, client) => {
    const match = String(client.clientCode || "").match(/^CL\d{2}(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  const nextCode = () => {
    let code = "";
    do {
      codeCounter += 1;
      code = `CL${year}${String(codeCounter).padStart(4, "0")}`;
    } while (usedCodes.has(code));
    return code;
  };

  return records.reduce((cleaned, client) => {
    const name = String(client.name || client.customerName || "").trim();
    if (!name) return cleaned;
    const duplicateKey = name.toLowerCase();
    if (usedNames.has(duplicateKey)) return cleaned;
    usedNames.add(duplicateKey);

    let id = String(client.id || "").trim();
    if (!id || usedIds.has(id)) id = createId();
    usedIds.add(id);

    let clientCode = String(client.clientCode || "").trim();
    if (!clientCode || usedCodes.has(clientCode)) clientCode = nextCode();
    usedCodes.add(clientCode);

    cleaned.push({
      ...client,
      id,
      clientCode,
      name,
      email: String(client.email || "").trim(),
      phone: formatPhone(client.phone),
      country: client.country || "Sri Lanka",
      address: client.address || client.billingAddress || "",
      updatedAt: client.updatedAt || new Date().toISOString(),
    });
    return cleaned;
  }, []);
}

function generateEmployeeCode() {
  const maxNumber = employees.reduce((max, employee) => {
    const match = String(employee.employeeCode || "").match(/^EMP-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `EMP-${String(maxNumber + 1).padStart(3, "0")}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function updatePreviewZoom() {
  previewScale.style.transform = `scale(${previewZoom})`;
  previewScale.style.width = `${100 / previewZoom}%`;
  previewZoomLabel.textContent = formatPercent(Math.round(previewZoom * 100));
}

function updatePreviewVisibility() {
  invoiceModal.classList.toggle("is-open", !previewHidden);
  invoiceModal.setAttribute("aria-hidden", previewHidden ? "true" : "false");
}

function openInvoiceModal(id) {
  selectedInvoiceId = id;
  previewHidden = false;
  renderPreview();
  updatePreviewVisibility();
}

function closeInvoiceModal() {
  previewHidden = true;
  updatePreviewVisibility();
}

function populateCountrySelects() {
  const options = countries.map((country) => `<option value="${escapeAttribute(country)}">${escapeHtml(country)}</option>`).join("");
  document.getElementById("customerCountry").innerHTML = options;
  document.getElementById("clientCountry").innerHTML = options;
}

function populateFinanceCategories() {
  const options = financeCategories
    .map((category) => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`)
    .join("");
  document.getElementById("financeCategory").innerHTML = options;
  financeCategoryFilter.innerHTML = `<option value="All">All categories</option>${options}`;
}

function currentUser() {
  const savedUser = users.find((user) => user.id === currentUserId && user.status !== "Disabled") || null;
  if (savedUser) {
    activeUserSnapshot = savedUser;
    return savedUser;
  }
  if (activeUserSnapshot?.id === currentUserId && activeUserSnapshot.status !== "Disabled") {
    return activeUserSnapshot;
  }
  return null;
}

function isLoggedIn() {
  return Boolean(currentUser());
}

function userCanAccess(viewName) {
  const user = currentUser();
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.access || []).includes(viewName);
}

function firstAllowedView() {
  return accessSections.find((section) => views[section.id] && userCanAccess(section.id))?.id || "dashboard";
}

function applyAccessControl() {
  if (appIsStarting) {
    appPreloader.classList.remove("is-hidden");
    loginScreen.classList.add("is-loading");
    appShell.classList.add("is-locked");
    return;
  }
  appPreloader.classList.add("is-hidden");
  loginScreen.classList.remove("is-loading");
  const loggedIn = isLoggedIn();
  appShell.classList.toggle("is-locked", !loggedIn);
  loginScreen.classList.toggle("is-hidden", loggedIn);
  userMenu.classList.remove("is-open");
  if (!loggedIn) return;
  const activeView = Object.entries(views).find(([, element]) => element.classList.contains("active"))?.[0] || "dashboard";
  navTabs.forEach((tab) => {
    tab.hidden = !userCanAccess(tab.dataset.view);
  });
  document.querySelectorAll(".nav-section-label").forEach((label) => {
    let sibling = label.nextElementSibling;
    let hasVisibleItem = false;
    while (sibling && !sibling.classList.contains("nav-section-label")) {
      if (sibling.classList.contains("nav-tab") && !sibling.hidden) hasVisibleItem = true;
      sibling = sibling.nextElementSibling;
    }
    label.hidden = !hasVisibleItem;
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.hidden = !userCanAccess(button.dataset.viewTarget);
  });
  document.getElementById("newInvoiceButton").hidden = !userCanAccess("create");
  document.getElementById("newQuotationButton").hidden = !userCanAccess("quotations");
  document.getElementById("newProjectButton").hidden = !userCanAccess("projects");
  document.getElementById("editProfileButton").hidden = !userCanAccess("users");
  renderActiveUserBadge();
  if (!userCanAccess(activeView)) switchView(firstAllowedView());
}

function renderActiveUserBadge() {
  const user = currentUser();
  activeUserInitial.textContent = user ? String(user.name || user.username || "U").slice(0, 1).toUpperCase() : "U";
  activeUserName.textContent = user?.name || "";
  activeUserRole.textContent = user ? `${roleLabels[user.role] || user.role} • ${user.username || ""}` : "";
}

function openAuthenticatedApp() {
  appIsStarting = false;
  document.body.classList.remove("app-loading");
  appPreloader.classList.add("is-hidden");
  loginScreen.classList.remove("is-loading");
  loginScreen.classList.add("is-hidden");
  appShell.classList.remove("is-locked");
  switchView(firstAllowedView());
  applyAccessControl();
}

function populateUserAccessOptions(selected = roleDefaultAccess["project-manager"]) {
  document.getElementById("userAccessOptions").innerHTML = accessSections
    .map(
      (section) => `
        <label class="access-option">
          <input type="checkbox" value="${escapeAttribute(section.id)}" ${selected.includes(section.id) ? "checked" : ""} />
          <span>${escapeHtml(section.label)}</span>
        </label>
      `,
    )
    .join("");
}

async function loginUser(username, password) {
  ensureDefaultAdminUser();
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const passwordValue = String(password || "").trim();
  const passwordHash = await hashPassword(passwordValue);
  let user = users.find((item) => {
    return String(item.username || "").trim().toLowerCase() === normalizedUsername && passwordMatches(item, passwordValue, passwordHash) && item.status !== "Disabled";
  });
  if (!user && normalizedUsername === "admin" && passwordValue === "admin123") {
    const existingAdmin = users.find((item) => item.id === "admin" || String(item.username || "").trim().toLowerCase() === "admin");
    const repairedAdmin = {
      ...(existingAdmin || defaultUsers()[0]),
      id: existingAdmin?.id || "admin",
      name: existingAdmin?.name || "Admin",
      username: "admin",
      passwordHash,
      role: "admin",
      status: "Active",
      access: roleDefaultAccess.admin,
      updatedAt: new Date().toISOString(),
    };
    users = existingAdmin
      ? users.map((item) => (item.id === existingAdmin.id ? repairedAdmin : item))
      : [repairedAdmin, ...users];
    saveUsers();
    user = repairedAdmin;
    showToast("Admin login repaired");
  }
  if (!user) {
    showToast(users.length ? "Invalid username or password" : "Users not loaded from Supabase");
    return false;
  }
  if (user.passwordHash !== passwordHash) {
    users = users.map((item) => (item.id === user.id ? { ...item, passwordHash, updatedAt: new Date().toISOString() } : item));
    saveUsers();
  }
  currentUserId = user.id;
  activeUserSnapshot = user;
  sessionStorage.setItem(AUTH_SESSION_KEY, currentUserId);
  loginForm.reset();
  openAuthenticatedApp();
  showToast(isDefaultPassword(normalizedUsername, passwordValue) ? "Login ok. Please change this default password now." : `Welcome ${user.name}`);
  return true;
}

function logoutUser() {
  currentUserId = "";
  activeUserSnapshot = null;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  loginForm.reset();
  applyAccessControl();
}

function matchesMonth(dateString, monthValue) {
  return !monthValue || String(dateString || "").startsWith(monthValue);
}

function switchView(viewName) {
  if (!userCanAccess(viewName)) {
    showToast("This user cannot access that section");
    viewName = firstAllowedView();
  }
  Object.entries(views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });

  navTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === viewName);
  });
}

function calculateTotals(invoice) {
  const subtotal = invoice.items.reduce((sum, item) => {
    return sum + lineItemAmount(item);
  }, 0);
  const tax = subtotal * (Number(invoice.taxRate || 0) / 100);
  const discount = Number(invoice.discount || 0);
  const advancePaid = Number(invoice.advancePaid || 0);
  const total = Math.max(subtotal + tax - discount - advancePaid, 0);
  return { subtotal, tax, discount, advancePaid, total };
}

function lineItemAmount(item = {}) {
  const directAmount = Number(item.amount || 0);
  if (directAmount > 0) return directAmount;
  return Number(item.quantity || 0) * Number(item.price || 0);
}

function isDirectAmountItem(item = {}) {
  return Number(item.amount || 0) > 0 && (!Number(item.quantity || 0) || !Number(item.price || 0));
}

function hasQuantityPricing(invoice = {}) {
  return (invoice.items || []).some((item) => Number(item.quantity || 0) > 0 && Number(item.price || 0) > 0);
}

function invoiceCurrency(invoice = {}) {
  return invoice.currency || settings.currencyLabel || "LKR";
}

function invoiceTotalInLkr(invoice) {
  const total = calculateTotals(invoice).total;
  if (invoiceCurrency(invoice) !== "USD") return total;
  const month = String(invoice.invoiceDate || today()).slice(0, 7);
  const rate = projectUsdRateForMonth(month) || projectUsdRateForMonth(today().slice(0, 7)) || 319.6;
  return total * rate;
}

function addFinanceRecordOnce(record) {
  if (record.sourceId && financeRecords.some((item) => item.sourceId === record.sourceId)) return false;
  financeRecords.unshift({ id: createId(), updatedAt: new Date().toISOString(), repeat: "none", ...record });
  saveFinanceRecords();
  return true;
}

function getFormInvoice() {
  const items = [...itemsContainer.querySelectorAll(".item-row")].map((row) => ({
    title: row.querySelector(".item-title").value.trim(),
    description: row.querySelector(".item-description").value.trim(),
    quantity: Number(row.querySelector(".item-quantity").value || 0),
    price: Number(row.querySelector(".item-price").value || 0),
    amount: Number(row.querySelector(".item-amount").value || 0),
  }));

  return {
    id: editingId || createId(),
    documentType: document.getElementById("documentType").value,
    invoiceNumber: document.getElementById("invoiceNumber").value.trim(),
    invoiceDate: document.getElementById("invoiceDate").value,
    dueDate: document.getElementById("dueDate").value,
    status: document.getElementById("status").value,
    repeatFrequency: document.getElementById("repeatFrequency").value,
    paymentMethod: document.getElementById("paymentMethod").value,
    currency: document.getElementById("invoiceCurrency").value,
    customerName: document.getElementById("customerName").value.trim(),
    customerEmail: document.getElementById("customerEmail").value.trim(),
    customerCountry: document.getElementById("customerCountry").value,
    customerAddress: document.getElementById("customerAddress").value.trim(),
    taxRate: Number(document.getElementById("taxRate").value || 0),
    discount: Number(document.getElementById("discount").value || 0),
    advancePaid: Number(document.getElementById("advancePaid").value || 0),
    notes: document.getElementById("notes").value.trim(),
    terms: document.getElementById("terms").value.trim(),
    authorizedBy: document.getElementById("authorizedBy").value.trim(),
    items,
    projectId: linkedProjectId,
    updatedAt: new Date().toISOString(),
  };
}

function addItemRow(item = { title: "", description: "", quantity: 1, price: 0, amount: 0 }) {
  const title = item.title || item.description || "";
  const description = item.title ? item.description || "" : "";
  const amount = Number(item.amount || 0) || Number(item.quantity || 0) * Number(item.price || 0);
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <label>
      Saved item
      <select class="item-suggestion">
        <option value="">Choose saved item</option>
        ${getItemTemplates()
          .map((template, index) => `<option value="${index}">${escapeHtml(template.title)}</option>`)
          .join("")}
      </select>
    </label>
    <label>
      Item title
      <input class="item-title" list="itemTitleSuggestions" required value="${escapeAttribute(title)}" />
    </label>
    <label>
      Description
      <textarea class="item-description" list="itemDescriptionSuggestions" rows="2">${escapeHtml(description)}</textarea>
    </label>
    <label>
      Qty
      <input class="item-quantity" min="0" step="0.01" type="number" value="${item.quantity}" />
    </label>
    <label>
      Price
      <input class="item-price" min="0" step="0.01" type="number" value="${item.price}" />
    </label>
    <label>
      Amount
      <input class="item-amount" min="0" step="0.01" type="number" value="${amount}" />
    </label>
    <button class="icon-button remove-item" title="Remove item" type="button">x</button>
  `;
  itemsContainer.appendChild(row);
  row.querySelector(".item-suggestion").addEventListener("change", (event) => {
    const template = getItemTemplates()[Number(event.target.value)];
    if (!template) return;
    row.querySelector(".item-title").value = template.title;
    row.querySelector(".item-description").value = template.description;
    row.querySelector(".item-quantity").value = template.quantity;
    row.querySelector(".item-price").value = template.price;
    row.querySelector(".item-amount").value = Number(template.amount || 0) || Number(template.quantity || 0) * Number(template.price || 0);
    updateFormTotals();
  });
  row.querySelector(".item-quantity").addEventListener("input", () => {
    row.querySelector(".item-amount").value =
      Number(row.querySelector(".item-quantity").value || 0) * Number(row.querySelector(".item-price").value || 0);
    updateFormTotals();
  });
  row.querySelector(".item-price").addEventListener("input", () => {
    row.querySelector(".item-amount").value =
      Number(row.querySelector(".item-quantity").value || 0) * Number(row.querySelector(".item-price").value || 0);
    updateFormTotals();
  });
  row.querySelector(".item-title").addEventListener("input", updateFormTotals);
  row.querySelector(".item-description").addEventListener("input", updateFormTotals);
  row.querySelector(".item-amount").addEventListener("input", updateFormTotals);
  row.querySelector(".remove-item").addEventListener("click", () => {
    if (itemsContainer.children.length === 1) {
      showToast("An invoice needs at least one item");
      return;
    }
    row.remove();
    updateFormTotals();
  });
  updateFormTotals();
}

function getItemTemplates() {
  const templates = new Map();
  services.forEach((service) => {
    const key = `${service.name}|${service.description || ""}|${service.price || 0}`;
    templates.set(key, {
      title: service.name,
      description: service.description || "",
      quantity: service.billing === "one-time" ? 1 : 1,
      price: service.price || 0,
      amount: service.price || 0,
    });
  });
  invoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      const title = item.title || item.description;
      if (!title) return;
      const key = `${title}|${item.description || ""}|${item.price || 0}`;
      if (!templates.has(key)) {
        templates.set(key, {
          title,
          description: item.title ? item.description || "" : "",
          quantity: item.quantity || 1,
          price: item.price || 0,
          amount: item.amount || 0,
        });
      }
    });
  });
  return [...templates.values()].slice(0, 80);
}

function updateFormTotals() {
  const invoice = getFormInvoice();
  const totals = calculateTotals(invoice);
  const currency = invoiceCurrency(invoice);

  [...itemsContainer.querySelectorAll(".item-row")].forEach((row) => {
    const quantity = Number(row.querySelector(".item-quantity").value || 0);
    const price = Number(row.querySelector(".item-price").value || 0);
    const amount = Number(row.querySelector(".item-amount").value || 0) || quantity * price;
    row.querySelector(".item-amount").value = amount;
  });

  document.getElementById("formSubtotal").textContent = money(totals.subtotal, currency);
  document.getElementById("formTax").textContent = money(totals.tax, currency);
  document.getElementById("formDiscount").textContent = money(totals.discount, currency);
  document.getElementById("formAdvancePaid").textContent = money(totals.advancePaid, currency);
  document.getElementById("formTotal").textContent = money(totals.total, currency);
}

function resetForm() {
  editingId = null;
  linkedProjectId = null;
  form.reset();
  document.getElementById("documentType").value = "Invoice";
  document.getElementById("invoiceNumber").value = generateInvoiceNumber();
  document.getElementById("invoiceDate").value = today();
  document.getElementById("dueDate").value = addDays(today(), 14);
  document.getElementById("status").value = "Unpaid";
  document.getElementById("repeatFrequency").value = "none";
  document.getElementById("paymentMethod").value = "";
  document.getElementById("invoiceCurrency").value = settings.currencyLabel;
  document.getElementById("customerCountry").value = "Sri Lanka";
  clientSelect.value = "";
  document.getElementById("taxRate").value = 0;
  document.getElementById("discount").value = 0;
  document.getElementById("advancePaid").value = 0;
  document.getElementById("terms").value = "50% advance may be required before work starts. Final files, hosting access, or deployment will be completed after payment clearance.";
  document.getElementById("authorizedBy").value = settings.businessName || "Infonits";
  itemsContainer.innerHTML = "";
  addItemRow();
  updateFormTotals();
}

function startNewDocument(type = "Invoice") {
  resetForm();
  document.getElementById("documentType").value = type;
  document.getElementById("status").value = type === "Quotation" ? "Draft" : "Unpaid";
  document.getElementById("invoiceNumber").value = generateDocumentNumber(type);
  switchView("create");
}

function createDocumentFromPrompt() {
  const prompt = aiPromptInput.value.trim();
  if (!prompt) {
    addAiMessage("bot", "Please type what you want to create.");
    return;
  }

  addAiMessage("user", prompt);
  const draft = parseAiPrompt(prompt);
  fillDocumentDraft(draft);
  addAiMessage("bot", `${draft.type} draft created for ${draft.customerName}. Check the details, then save or download.`);
  aiPromptInput.value = "";
  switchView("create");
}

function parseAiPrompt(prompt) {
  const lower = prompt.toLowerCase();
  const type = lower.includes("quotation") || lower.includes("quote") ? "Quotation" : "Invoice";
  const currencyMatch = prompt.match(/\b(USD|AUD|GBP|LKR|CAD|pounds?)\b/i);
  const currency = currencyMatch ? normalizeCurrency(currencyMatch[1]) : settings.currencyLabel || "LKR";
  const amountMatch = prompt.match(/(?:rs\.?|lkr|usd|aud|cad|gbp|\$|£)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:rs\.?|lkr|usd|aud|cad|gbp|\$|£)?/i);
  const amount = amountMatch ? Number(amountMatch[1].replaceAll(",", "")) : 0;
  const customerName = extractPromptCustomer(prompt) || "Manual customer";
  const title = extractPromptTitle(prompt, customerName, amountMatch?.[0] || "", currencyMatch?.[0] || "") || "Project service";
  const matchedClient = clients.find((client) => client.name.toLowerCase() === customerName.toLowerCase());

  return {
    type,
    currency,
    amount,
    customerName: matchedClient?.name || customerName,
    customerEmail: matchedClient?.email || "",
    customerCountry: matchedClient?.country || "Sri Lanka",
    customerAddress: [matchedClient?.address, formatPhone(matchedClient?.phone), matchedClient?.country].filter(Boolean).join(" | "),
    title,
    description: prompt,
  };
}

function normalizeCurrency(value) {
  const currency = value.toUpperCase();
  if (currency.startsWith("POUND")) return "GBP";
  return currency === "$" ? "USD" : currency;
}

function extractPromptCustomer(prompt) {
  const match = prompt.match(/\b(?:for|to|client)\s+(.+?)(?:\s+(?:for|about|with|worth|amount|price|total)\b|,|$)/i);
  if (match) return cleanPromptPiece(match[1]);
  const knownClient = clients.find((client) => prompt.toLowerCase().includes(client.name.toLowerCase()));
  return knownClient?.name || "";
}

function extractPromptTitle(prompt, customerName, amountText, currencyText) {
  let title = prompt
    .replace(/create|make|generate|invoice|quotation|quote|bill/gi, " ")
    .replace(customerName, " ")
    .replace(amountText, " ")
    .replace(currencyText, " ")
    .replace(/\b(for|to|client|amount|price|total|worth|of)\b/gi, " ");
  return cleanPromptPiece(title);
}

function cleanPromptPiece(value) {
  return String(value || "")
    .replace(/[.,:;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fillDocumentDraft(draft) {
  resetForm();
  document.getElementById("documentType").value = draft.type;
  document.getElementById("status").value = draft.type === "Quotation" ? "Draft" : "Unpaid";
  document.getElementById("invoiceCurrency").value = draft.currency;
  document.getElementById("invoiceNumber").value = generateDocumentNumber(draft.type);
  document.getElementById("customerName").value = draft.customerName;
  document.getElementById("customerEmail").value = draft.customerEmail;
  document.getElementById("customerCountry").value = draft.customerCountry;
  document.getElementById("customerAddress").value = draft.customerAddress;
  itemsContainer.innerHTML = "";
  addItemRow({
    title: draft.title,
    description: draft.description,
    quantity: 1,
    price: draft.amount,
  });
  document.getElementById("notes").value = draft.type === "Quotation" ? "Quotation prepared based on your request." : "";
  updateFormTotals();
}

function addAiMessage(role, text) {
  const log = document.getElementById("aiChatLog");
  log.insertAdjacentHTML("beforeend", `<div class="ai-message ai-message-${role}">${escapeHtml(text)}</div>`);
  log.scrollTop = log.scrollHeight;
}

function editInvoice(id) {
  const invoice = invoices.find((item) => item.id === id);
  if (!invoice) return;

  editingId = invoice.id;
  linkedProjectId = invoice.projectId || null;
  document.getElementById("documentType").value = invoice.documentType || "Invoice";
  document.getElementById("invoiceNumber").value = invoice.invoiceNumber;
  document.getElementById("invoiceDate").value = invoice.invoiceDate;
  document.getElementById("dueDate").value = invoice.dueDate;
  document.getElementById("status").value = invoice.status;
  document.getElementById("repeatFrequency").value = invoice.repeatFrequency || "none";
  document.getElementById("paymentMethod").value = invoice.paymentMethod || "";
  document.getElementById("invoiceCurrency").value = invoiceCurrency(invoice);
  document.getElementById("customerName").value = invoice.customerName;
  document.getElementById("customerEmail").value = invoice.customerEmail;
  document.getElementById("customerCountry").value = invoice.customerCountry || "Sri Lanka";
  document.getElementById("customerAddress").value = invoice.customerAddress;
  document.getElementById("taxRate").value = invoice.taxRate;
  document.getElementById("discount").value = invoice.discount;
  document.getElementById("advancePaid").value = invoice.advancePaid || 0;
  document.getElementById("notes").value = invoice.notes;
  document.getElementById("terms").value = invoice.terms || "";
  document.getElementById("authorizedBy").value = invoice.authorizedBy || "";
  itemsContainer.innerHTML = "";
  invoice.items.forEach(addItemRow);
  updateFormTotals();
  switchView("create");
}

function createMonthlyCopy(id) {
  const source = invoices.find((item) => item.id === id);
  if (!source) return;
  const nextDate = addMonths(source.invoiceDate || today(), 1);
  const copy = {
    ...source,
    id: createId(),
    invoiceNumber: generateDocumentNumber(source.documentType || "Invoice", nextDate),
    invoiceDate: nextDate,
    dueDate: addDays(nextDate, 14),
    status: source.documentType === "Quotation" ? "Draft" : "Unpaid",
    projectId: null,
    updatedAt: new Date().toISOString(),
  };
  invoices.unshift(copy);
  selectedInvoiceId = copy.id;
  saveInvoices();
  renderAll();
  showToast(`${copy.invoiceNumber} created for next month`);
}

function deleteInvoice(id) {
  const invoice = invoices.find((item) => item.id === id);
  if (!invoice) return;

  const confirmed = confirm(`Delete ${invoice.invoiceNumber}?`);
  if (!confirmed) return;

  invoices = invoices.filter((item) => item.id !== id);
  deleteSupabaseRecord("invoices", id);
  if (selectedInvoiceId === id) {
    selectedInvoiceId = invoices[0]?.id || null;
  }
  saveInvoices();
  renderAll();
  showToast("Invoice deleted");
}

function markInvoicePaid(id) {
  const invoice = invoices.find((item) => item.id === id);
  if (!invoice) return;
  invoices = invoices.map((item) => (item.id === id ? { ...item, status: "Paid", updatedAt: new Date().toISOString() } : item));
  saveInvoices();
  markLinkedProjectPaid(invoice);
  addFinanceRecordOnce({
    sourceId: `invoice-paid-${id}`,
    type: "income",
    date: today(),
    category: "Client payment",
    amount: invoiceTotalInLkr(invoice),
    note: `Payment received for ${invoice.invoiceNumber} - ${invoice.customerName}`,
  });
  renderAll();
  showToast("Invoice marked paid and added to Finance");
}

function markLinkedProjectPaid(invoice) {
  const project = findProjectForInvoice(invoice);
  if (!project) return;
  projects = projects.map((item) =>
    item.id === project.id ? { ...item, paymentStatus: "Paid", updatedAt: new Date().toISOString() } : item,
  );
  saveProjects();
}

function findProjectForInvoice(invoice) {
  if (invoice.projectId) {
    const linkedProject = projects.find((project) => project.id === invoice.projectId);
    if (linkedProject) return linkedProject;
  }
  const customerName = String(invoice.customerName || "").trim().toLowerCase();
  const firstItemTitle = String(invoice.items?.[0]?.title || "").trim().toLowerCase();
  return projects.find((project) => {
    const projectClient = String(project.clientName || project.name || "").trim().toLowerCase();
    const projectName = String(project.name || "").trim().toLowerCase();
    return customerName && firstItemTitle && projectClient === customerName && projectName === firstItemTitle;
  });
}

function updateInvoiceStatus(id, status) {
  if (status === "Paid") {
    markInvoicePaid(id);
    return;
  }
  invoices = invoices.map((item) => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
  saveInvoices();
  renderAll();
  showToast("Invoice status updated");
}

function convertQuotationToInvoice(id) {
  const quotation = invoices.find((item) => item.id === id);
  if (!quotation) return;
  const invoiceDate = today();
  const invoice = {
    ...quotation,
    id: createId(),
    documentType: "Invoice",
    invoiceNumber: generateDocumentNumber("Invoice", invoiceDate),
    invoiceDate,
    dueDate: addDays(invoiceDate, 14),
    status: "Unpaid",
    updatedAt: new Date().toISOString(),
  };
  invoices.unshift(invoice);
  selectedInvoiceId = invoice.id;
  saveInvoices();
  renderAll();
  showToast("Quotation converted to invoice");
}

function invoiceStatusSelect(invoice) {
  const statuses = ["Draft", "Sent", "Unpaid", "Paid", "Overdue"];
  return `
    <select class="table-status-select ${escapeAttribute(invoice.status)}" data-invoice-status="${invoice.id}">
      ${statuses
        .map((status) => `<option value="${status}" ${invoice.status === status ? "selected" : ""}>${status}</option>`)
        .join("")}
    </select>
  `;
}

function selectInvoice(id) {
  openInvoiceModal(id);
}

function getClientFormData() {
  return {
    id: editingClientId || createId(),
    clientCode: editingClientId
      ? clients.find((item) => item.id === editingClientId)?.clientCode || generateClientCode()
      : generateClientCode(),
    name: document.getElementById("clientName").value.trim(),
    email: document.getElementById("clientEmail").value.trim(),
    phone: formatPhone(document.getElementById("clientPhone").value),
    country: document.getElementById("clientCountry").value.trim(),
    address: document.getElementById("clientAddress").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetClientForm() {
  editingClientId = null;
  clientForm.reset();
  document.getElementById("clientCountry").value = "Sri Lanka";
}

function fillInvoiceClient(clientId) {
  const client = clients.find((item) => item.id === clientId);
  if (!client) return;
  document.getElementById("customerName").value = client.name;
  document.getElementById("customerEmail").value = client.email;
  document.getElementById("customerCountry").value = client.country || "Sri Lanka";
  document.getElementById("customerAddress").value = [client.address, formatPhone(client.phone), client.country]
    .filter(Boolean)
    .join(" | ");
}

function editClient(id) {
  const client = clients.find((item) => item.id === id);
  if (!client) return;
  editingClientId = client.id;
  document.getElementById("clientName").value = client.name;
  document.getElementById("clientEmail").value = client.email;
  document.getElementById("clientPhone").value = client.phone;
  document.getElementById("clientCountry").value = client.country || "Sri Lanka";
  document.getElementById("clientAddress").value = client.address;
  switchView("clients");
}

function deleteClient(id) {
  const client = clients.find((item) => item.id === id);
  if (!client) return;
  const confirmed = confirm(`Delete ${client.name}?`);
  if (!confirmed) return;
  clients = clients.filter((item) => item.id !== id);
  deleteSupabaseRecord("clients", id);
  saveClients();
  renderClients();
  showToast("Client deleted");
}

function getEmployeeFormData() {
  const existing = employees.find((employee) => employee.id === editingEmployeeId);
  const now = new Date().toISOString();
  return {
    id: editingEmployeeId || createId(),
    employeeCode: document.getElementById("employeeCode").value.trim(),
    firstName: document.getElementById("employeeFirstName").value.trim(),
    lastName: document.getElementById("employeeLastName").value.trim(),
    dateOfBirth: document.getElementById("employeeDateOfBirth").value,
    gender: document.getElementById("employeeGender").value,
    nationalId: document.getElementById("employeeNationalId").value.trim(),
    personalEmail: document.getElementById("employeePersonalEmail").value.trim(),
    workEmail: document.getElementById("employeeWorkEmail").value.trim(),
    phone: formatPhone(document.getElementById("employeePhone").value),
    address: document.getElementById("employeeAddress").value.trim(),
    department: document.getElementById("employeeDepartment").value.trim(),
    jobTitle: document.getElementById("employeeJobTitle").value.trim(),
    employmentType: document.getElementById("employeeEmploymentType").value,
    startDate: document.getElementById("employeeStartDate").value,
    reportingManager: document.getElementById("employeeReportingManager").value.trim(),
    emergencyContact: document.getElementById("employeeEmergencyContact").value.trim(),
    bankDetails: document.getElementById("employeeBankDetails").value.trim(),
    salaryGrade: document.getElementById("employeeSalaryGrade").value.trim(),
    skills: document.getElementById("employeeSkills").value.trim(),
    profilePhoto: pendingEmployeePhotoDataUrl || existing?.profilePhoto || "",
    status: document.getElementById("employeeStatus").value,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function resetEmployeeForm() {
  editingEmployeeId = null;
  pendingEmployeePhotoDataUrl = "";
  employeeForm.reset();
  document.getElementById("employeeCode").value = generateEmployeeCode();
  document.getElementById("employeeStatus").value = "Active";
  document.getElementById("employeeEmploymentType").value = "Full-time";
  document.getElementById("employeePhotoPreview").removeAttribute("src");
  document.getElementById("employeeProfilePhoto").value = "";
}

function editEmployee(id) {
  const employee = employees.find((item) => item.id === id);
  if (!employee) return;
  editingEmployeeId = id;
  pendingEmployeePhotoDataUrl = employee.profilePhoto || "";
  document.getElementById("employeeCode").value = employee.employeeCode || "";
  document.getElementById("employeeFirstName").value = employee.firstName || "";
  document.getElementById("employeeLastName").value = employee.lastName || "";
  document.getElementById("employeeDateOfBirth").value = employee.dateOfBirth || "";
  document.getElementById("employeeGender").value = employee.gender || "";
  document.getElementById("employeeNationalId").value = employee.nationalId || "";
  document.getElementById("employeePersonalEmail").value = employee.personalEmail || "";
  document.getElementById("employeeWorkEmail").value = employee.workEmail || "";
  document.getElementById("employeePhone").value = employee.phone || "";
  document.getElementById("employeeAddress").value = employee.address || "";
  document.getElementById("employeeDepartment").value = employee.department || "";
  document.getElementById("employeeJobTitle").value = employee.jobTitle || "";
  document.getElementById("employeeEmploymentType").value = employee.employmentType || "Full-time";
  document.getElementById("employeeStartDate").value = employee.startDate || "";
  document.getElementById("employeeReportingManager").value = employee.reportingManager || "";
  document.getElementById("employeeEmergencyContact").value = employee.emergencyContact || "";
  document.getElementById("employeeBankDetails").value = employee.bankDetails || "";
  document.getElementById("employeeSalaryGrade").value = employee.salaryGrade || "";
  document.getElementById("employeeSkills").value = employee.skills || "";
  document.getElementById("employeeStatus").value = employee.status || "Active";
  const preview = document.getElementById("employeePhotoPreview");
  if (employee.profilePhoto) preview.src = employee.profilePhoto;
  else preview.removeAttribute("src");
  switchView("employees");
}

function deleteEmployee(id) {
  const employee = employees.find((item) => item.id === id);
  if (!employee) return;
  const confirmed = confirm(`Delete ${employee.firstName} ${employee.lastName}?`);
  if (!confirmed) return;
  employees = employees.filter((item) => item.id !== id);
  deleteSupabaseRecord("employees", id);
  saveEmployees();
  renderEmployees();
  resetEmployeeForm();
  showToast("Employee deleted");
}

function getProjectFormData() {
  const valueUsd = Number(document.getElementById("projectValueUsd").value || 0);
  const valueLkr = Number(document.getElementById("projectValueLkr").value || 0) || convertedProjectUsd(valueUsd);
  return {
    id: editingProjectId || createId(),
    month: document.getElementById("projectMonth").value,
    name: document.getElementById("projectName").value.trim(),
    clientName: document.getElementById("projectClientName").value.trim(),
    valueLkr,
    valueUsd,
    note: document.getElementById("projectNote").value.trim(),
    advance: Number(document.getElementById("projectAdvance").value || 0),
    payForWork: Number(document.getElementById("projectPayForWork").value || 0),
    paidForWork: Number(document.getElementById("projectPaidForWork").value || 0),
    paymentStatus: document.getElementById("projectPaymentStatus").value,
    repeat: document.getElementById("projectRepeat").value,
    worker: document.getElementById("projectWorker").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetProjectForm() {
  editingProjectId = null;
  projectForm.reset();
  const currentMonth = today().slice(0, 7);
  document.getElementById("projectMonth").value = currentMonth;
  if (!projectMonthFilter.value) projectMonthFilter.value = currentMonth;
  document.getElementById("projectPaymentStatus").value = "Waiting";
  document.getElementById("projectRepeat").value = "no";
  hideProjectForm();
}

function projectOptionLabel(project) {
  return `${project.name || "Project"}${project.clientName ? ` - ${project.clientName}` : ""}`;
}

function populateManagerHandleSelects() {
  const projectOptions = projects.length
    ? projects
        .map((project) => `<option value="${escapeAttribute(project.id)}">${escapeHtml(projectOptionLabel(project))}</option>`)
        .join("")
    : `<option value="">No projects yet</option>`;
  document.getElementById("handleProject").innerHTML = projectOptions;

  const assignableUsers = users.filter((user) => user.status !== "Disabled" && user.role !== "admin");
  document.getElementById("handleUser").innerHTML = (assignableUsers.length ? assignableUsers : users)
    .map((user) => `<option value="${escapeAttribute(user.id)}">${escapeHtml(user.name)} - ${escapeHtml(roleLabels[user.role] || user.role)}</option>`)
    .join("");
}

function editProject(id) {
  id = ensureProjectForMonth(id);
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  editingProjectId = id;
  document.getElementById("projectMonth").value = project.month;
  document.getElementById("projectName").value = project.name;
  ensureProjectClientOption(project.clientName || project.name || "");
  document.getElementById("projectClientName").value = project.clientName || project.name || "";
  document.getElementById("projectValueLkr").value = project.valueLkr || "";
  document.getElementById("projectValueUsd").value = project.valueUsd || "";
  document.getElementById("projectNote").value = project.note || "";
  document.getElementById("projectAdvance").value = project.advance || "";
  document.getElementById("projectPayForWork").value = project.payForWork || "";
  document.getElementById("projectPaidForWork").value = project.paidForWork || "";
  document.getElementById("projectPaymentStatus").value = project.paymentStatus || "Waiting";
  document.getElementById("projectRepeat").value = project.repeat || "no";
  document.getElementById("projectWorker").value = project.worker || "";
  showProjectForm();
  switchView("projects");
}

function projectDeleteScope(id) {
  const virtual = parseVirtualProjectId(id);
  const project = virtual ? projects.find((item) => item.id === virtual.sourceId) : projects.find((item) => item.id === id);
  if (!project) return { project: null, ids: [] };
  const key = projectRecurringKey(project);
  const ids = projects
    .filter((item) => item.id === project.id || item.sourceProjectId === project.id || projectRecurringKey(item) === key)
    .map((item) => item.id);
  return { project, ids: [...new Set(ids)] };
}

function deleteProject(id) {
  const { project, ids } = projectDeleteScope(id);
  if (!project) return;
  const confirmed = confirm(`Delete ${project.name}? This will remove its monthly copies and linked manager records.`);
  if (!confirmed) return;
  projects = projects.filter((item) => !ids.includes(item.id));
  managerHandles = managerHandles.filter((item) => !ids.includes(item.projectId));
  socialMediaPosts = socialMediaPosts.map((post) => (ids.includes(post.projectId) ? { ...post, projectId: "", projectName: "" } : post));
  corrections = corrections.map((correction) => (ids.includes(correction.projectId) ? { ...correction, projectId: "", projectName: "" } : correction));
  ids.forEach((projectId) => deleteSupabaseRecord("projects", projectId));
  saveProjects();
  saveManagerHandles();
  saveSocialMediaPosts();
  saveCorrections();
  renderProjects();
  renderManagerHandles();
  renderProjectManagerWorkspace();
  renderFinance();
  showToast("Project deleted");
}

function ensureProjectClientOption(clientName) {
  if (!clientName) return;
  const projectClientSelect = document.getElementById("projectClientName");
  const exists = [...projectClientSelect.options].some((option) => option.value === clientName);
  if (!exists) {
    projectClientSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${escapeAttribute(clientName)}">${escapeHtml(clientName)}</option>`,
    );
  }
}

function updateProjectStatus(id, status) {
  id = ensureProjectForMonth(id);
  const source = projects.find((project) => project.id === id);
  projects = projects.map((project) => {
    if (project.id !== id) return project;
    return { ...project, paymentStatus: status, updatedAt: new Date().toISOString() };
  });
  saveProjects();
  if (settings.autoProjectFinance === "yes" && ["Paid", "Completed"].includes(status) && source) {
    const sourceMonth = source.month || today().slice(0, 7);
    addFinanceRecordOnce({
      sourceId: `project-complete-${id}-${sourceMonth}`,
      type: "income",
      date: `${sourceMonth}-01`,
      category: "Project profit",
      amount: projectForMe(source),
      note: `Project ${status.toLowerCase()}: ${source.name}`,
    });
  }
  renderProjects();
  renderFinance();
  showToast("Project status updated");
}

function updateProjectMoney(id, field, value) {
  id = ensureProjectForMonth(id);
  const allowedFields = ["valueLkr", "valueUsd", "advance", "payForWork", "paidForWork"];
  if (!allowedFields.includes(field)) return;
  const amount = parseFormattedNumber(value);
  projects = projects.map((project) => {
    if (project.id !== id) return project;
    const updated = { ...project, [field]: amount, updatedAt: new Date().toISOString() };
    if (field === "valueUsd") {
      updated.valueLkr = convertedProjectUsd(amount, project.month);
    }
    return updated;
  });
  saveProjects();
  renderProjects();
  renderFinance();
}

function nextProjectMonth(month) {
  return addMonths(`${month}-01`, 1).slice(0, 7);
}

function canMoveProjectToNextMonth(project) {
  return (project.repeat || "no") === "monthly" && !["Paid", "Completed"].includes(project.paymentStatus || "Waiting");
}

function isActiveProject(project = {}) {
  return !["Paid", "Completed"].includes(project.paymentStatus || "Waiting");
}

function projectRecurringKey(project = {}) {
  return `${project.clientName || ""}|${project.name || ""}`.trim().toLowerCase();
}

function virtualProjectId(sourceId, month) {
  return `virtual::${sourceId}::${month}`;
}

function parseVirtualProjectId(id = "") {
  const parts = String(id).split("::");
  if (parts.length !== 3 || parts[0] !== "virtual") return null;
  return { sourceId: parts[1], month: parts[2] };
}

function carriedProjectFrom(source, month, reason) {
  const resetMoney = reason === "monthly";
  return {
    ...source,
    id: virtualProjectId(source.id, month),
    sourceProjectId: source.id,
    originalMonth: source.month,
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

function ensureProjectForMonth(id) {
  const virtual = parseVirtualProjectId(id);
  if (!virtual) return id;
  const source = projects.find((project) => project.id === virtual.sourceId);
  if (!source) return id;
  const existing = projects.find((project) => project.month === virtual.month && projectRecurringKey(project) === projectRecurringKey(source));
  if (existing) return existing.id;
  const reason = (source.repeat || "no") === "monthly" ? "monthly" : "unpaid";
  const carried = carriedProjectFrom(source, virtual.month, reason);
  const savedProject = {
    ...carried,
    id: createId(),
    sourceProjectId: source.id,
    updatedAt: new Date().toISOString(),
  };
  projects.unshift(savedProject);
  saveProjects();
  return savedProject.id;
}

function createNextMonthProject(id) {
  id = ensureProjectForMonth(id);
  const project = projects.find((item) => item.id === id);
  if (!project || !canMoveProjectToNextMonth(project)) return;
  const nextMonth = nextProjectMonth(project.month);
  const alreadyExists = projects.some((item) => {
    return item.month === nextMonth && item.name.trim().toLowerCase() === project.name.trim().toLowerCase();
  });
  if (alreadyExists) {
    showToast("Already added to next month");
    return;
  }
  projects.unshift({
    ...project,
    id: createId(),
    month: nextMonth,
    advance: 0,
    payForWork: 0,
    paidForWork: 0,
    paymentStatus: "Waiting",
    updatedAt: new Date().toISOString(),
  });
  saveProjects();
  projectMonthFilter.value = nextMonth;
  renderProjects();
  showToast(`${project.name} moved to next month`);
}

function createInvoiceFromProject(id) {
  id = ensureProjectForMonth(id);
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  const clientName = project.clientName || project.name;
  const client = clients.find((item) => item.name.trim().toLowerCase() === clientName.trim().toLowerCase());

  resetForm();
  const useUsd = Number(project.valueUsd || 0) > 0;
  linkedProjectId = id;
  document.getElementById("customerName").value = clientName;
  document.getElementById("customerEmail").value = client?.email || "";
  document.getElementById("customerCountry").value = client?.country || "Sri Lanka";
  document.getElementById("customerAddress").value = [client?.address, formatPhone(client?.phone), client?.country].filter(Boolean).join(" | ");
  document.getElementById("invoiceCurrency").value = useUsd ? "USD" : "LKR";
  itemsContainer.innerHTML = "";
  addItemRow({
    title: project.name,
    description: project.note || "",
    quantity: 1,
    price: useUsd ? Number(project.valueUsd || 0) : projectValueLkr(project),
  });
  updateFormTotals();
  switchView("create");
  showToast("Invoice ready from project");
}

function projectForMe(project) {
  const remainingWorkPayment = Number(project.payForWork || 0) - Number(project.paidForWork || 0);
  return projectValueLkr(project) - Number(project.advance || 0) - remainingWorkPayment;
}

function currentProjectMonth() {
  return projectMonthFilter.value || document.getElementById("projectMonth").value || today().slice(0, 7);
}

function getProjectMonthSettings(month = currentProjectMonth()) {
  return projectTargets[month] || { usdRate: 0 };
}

function projectUsdRateForMonth(month = currentProjectMonth()) {
  if (projectUsdRate && month === currentProjectMonth() && Number(projectUsdRate.value || 0)) {
    return Number(projectUsdRate.value || 0);
  }
  return Number(getProjectMonthSettings(month).usdRate || 0);
}

function convertedProjectUsd(valueUsd, month = currentProjectMonth()) {
  const usd = Number(valueUsd || 0);
  const rate = projectUsdRateForMonth(month);
  return usd && rate ? usd * rate : 0;
}

function projectValueLkr(project) {
  return Number(project.valueLkr || 0) || convertedProjectUsd(project.valueUsd, project.month);
}

function updateProjectMonthFields() {
  const month = currentProjectMonth();
  const target = getProjectMonthSettings(month);
  projectUsdRate.value = target.usdRate || "";
  if (document.getElementById("projectMonth")) {
    document.getElementById("projectMonth").value = month;
  }
}

function saveCurrentProjectMonthSettings() {
  const month = currentProjectMonth();
  projectTargets[month] = {
    usdRate: Number(projectUsdRate.value || 0),
  };
  saveProjectTargets();
  recalculateProjectUsdValues(month);
  convertProjectUsdToLkr();
  renderProjects();
  renderFinance();
  showToast("USD rate saved");
}

function exportBackup() {
  const backup = createBackupPackage();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `infonits-backup-${today()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  showToast("Backup exported");
}

function createBackupPackage() {
  return {
    app: "Infonits Invoice Manager",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      invoices,
      clients,
      projects,
      projectTargets,
      financeRecords,
      services,
      renewals,
      websiteLogins,
      employees,
      users,
      managerHandles,
      socialMediaPosts,
      corrections,
      pmNotifications,
      monthlyPostReports,
      clientColors,
      settings,
    },
  };
}

async function applyBackupData(backup) {
  const data = backup.data || backup;
  if (!Array.isArray(data.invoices) || !Array.isArray(data.clients)) {
    throw new Error("Invalid backup file");
  }
  invoices = data.invoices || [];
  clients = data.clients || [];
  projects = data.projects || [];
  projectTargets = data.projectTargets || {};
  financeRecords = data.financeRecords || [];
  services = data.services || [];
  renewals = data.renewals || [];
  websiteLogins = data.websiteLogins || [];
  employees = data.employees || [];
  users = hardenDefaultUserAccess((data.users || defaultUsers()).map(normalizeUser));
  managerHandles = data.managerHandles || [];
  socialMediaPosts = data.socialMediaPosts || [];
  corrections = data.corrections || [];
  pmNotifications = data.pmNotifications || [];
  monthlyPostReports = data.monthlyPostReports || [];
  clientColors = data.clientColors && typeof data.clientColors === "object" && !Array.isArray(data.clientColors) ? data.clientColors : {};
  settings = { ...defaultSettings, ...(data.settings || {}) };
  await syncAllCollectionsToSupabaseNow({ replaceStale: true });
  resetForm();
  resetClientForm();
  resetProjectForm();
  resetServiceForm();
  resetRenewalForm();
  resetWebsiteLoginForm();
  resetEmployeeForm();
  resetUserForm();
  resetManagerHandleForm();
  resetFinanceForm();
  renderAll();
}

async function restoreCloudOnEmptyLocalData() {
  const config = loadCloudBackupSettings();
  if (!cloudBackupIsReady(config)) return false;
  const hasLocalBusinessData = invoices.length || clients.length || projects.length || financeRecords.length || socialMediaPosts.length;
  if (hasLocalBusinessData) return false;
  try {
    const response = await fetch(
      supabaseBackupEndpoint(config, `?id=eq.${encodeURIComponent(config.backupId)}&select=data,updated_at&limit=1`),
      { headers: supabaseHeaders(config) },
    );
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    if (!rows.length || !rows[0].data) return false;
    await applyBackupData(rows[0].data);
    showToast("Cloud data loaded");
    return true;
  } catch (error) {
    console.error(error);
    showToast("Cloud data load failed");
    return false;
  }
}

function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    try {
      const backup = JSON.parse(reader.result);
      const confirmed = confirm("Import backup? This will replace current saved data.");
      if (!confirmed) return;
      showToast("Saving imported data to Supabase...");
      await applyBackupData(backup);
      showToast("Backup imported and saved to Supabase");
    } catch {
      showToast("Backup import failed");
    } finally {
      document.getElementById("importBackupInput").value = "";
    }
  });
  reader.readAsText(file);
}

function cloudBackupConfigFromForm() {
  const existing = loadCloudBackupSettings();
  const config = {
    url: document.getElementById("cloudSupabaseUrl").value.trim().replace(/\/$/, ""),
    anonKey: document.getElementById("cloudSupabaseKey").value.trim(),
    backupId: document.getElementById("cloudBackupId").value.trim() || "infonits-main",
    autoBackup: document.getElementById("cloudAutoBackup").value,
    lastAutoBackupDate: existing.lastAutoBackupDate || "",
  };
  saveCloudBackupSettings(config);
  return config;
}

function renderCloudBackupSettings() {
  const config = loadCloudBackupSettings();
  const urlInput = document.getElementById("cloudSupabaseUrl");
  const keyInput = document.getElementById("cloudSupabaseKey");
  const backupIdInput = document.getElementById("cloudBackupId");
  const autoBackupInput = document.getElementById("cloudAutoBackup");
  if (!urlInput || !keyInput || !backupIdInput || !autoBackupInput) return;
  urlInput.value = config.url || "";
  keyInput.value = config.anonKey || "";
  backupIdInput.value = config.backupId || "infonits-main";
  autoBackupInput.value = config.autoBackup || "off";
}

function supabaseBackupEndpoint(config, query = "") {
  return `${config.url}/rest/v1/app_backups${query}`;
}

function supabaseHeaders(config, extra = {}) {
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function backupToCloud() {
  const config = cloudBackupConfigFromForm();
  return saveBackupToCloud(config, { silent: false });
}

async function saveBackupToCloud(config, options = {}) {
  const silent = Boolean(options.silent);
  if (!config.url || !config.anonKey) {
    if (!silent) showToast("Add Supabase URL and anon key");
    return false;
  }
  try {
    const backup = createBackupPackage();
    const response = await fetch(supabaseBackupEndpoint(config), {
      method: "POST",
      headers: supabaseHeaders(config, { Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify({
        id: config.backupId,
        data: backup,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    saveCloudBackupSettings({ ...config, lastCloudBackupAt: backup.exportedAt });
    if (!silent) showToast("Cloud backup saved");
    return true;
  } catch (error) {
    console.error(error);
    if (!silent) showToast("Cloud backup failed");
    return false;
  }
}

async function runDailyCloudBackup() {
  const config = loadCloudBackupSettings();
  if (config.autoBackup !== "daily" || !config.url || !config.anonKey) return;
  if (config.lastAutoBackupDate === today()) return;
  const saved = await saveBackupToCloud(config, { silent: true });
  if (!saved) return;
  saveCloudBackupSettings({ ...config, lastAutoBackupDate: today() });
  showToast("Daily cloud backup saved");
}

async function restoreFromCloud() {
  const config = cloudBackupConfigFromForm();
  if (!config.url || !config.anonKey) {
    showToast("Add Supabase URL and anon key");
    return;
  }
  const confirmed = confirm("Restore cloud backup? This will replace current saved data.");
  if (!confirmed) return;
  try {
    const response = await fetch(
      supabaseBackupEndpoint(config, `?id=eq.${encodeURIComponent(config.backupId)}&select=data,updated_at&limit=1`),
      { headers: supabaseHeaders(config) },
    );
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    if (!rows.length || !rows[0].data) throw new Error("No cloud backup found");
    await applyBackupData(rows[0].data);
    showToast("Cloud backup restored and saved to Supabase");
  } catch (error) {
    console.error(error);
    showToast("Cloud restore failed");
  }
}

function recalculateProjectUsdValues(month) {
  projects = projects.map((project) => {
    if (project.month !== month || !Number(project.valueUsd || 0)) return project;
    return { ...project, valueLkr: convertedProjectUsd(project.valueUsd, month), updatedAt: new Date().toISOString() };
  });
  saveProjects();
}

function convertProjectUsdToLkr() {
  const usdInput = document.getElementById("projectValueUsd");
  const lkrInput = document.getElementById("projectValueLkr");
  const converted = convertedProjectUsd(usdInput.value, document.getElementById("projectMonth").value);
  if (converted) {
    lkrInput.value = converted.toFixed(2).replace(/\.00$/, "");
  }
}

function showProjectForm() {
  projectFormVisible = true;
  projectForm.classList.remove("is-hidden");
  toggleProjectFormButton.textContent = editingProjectId ? "Edit project" : "Hide form";
}

function hideProjectForm() {
  projectFormVisible = false;
  projectForm.classList.add("is-hidden");
  toggleProjectFormButton.textContent = "+ Add project";
}

function toggleProjectForm() {
  if (projectFormVisible) {
    resetProjectForm();
    return;
  }
  showProjectForm();
}

function renderDashboard() {
  const invoiceDocs = invoices.filter((invoice) => (invoice.documentType || "Invoice") === "Invoice");
  const totals = invoiceDocs.reduce(
    (summary, invoice) => {
      const invoiceTotal = invoiceTotalInLkr(invoice);
      summary.count += 1;
      summary.billed += invoiceTotal;
      if (invoice.status === "Paid") {
        summary.paid += invoiceTotal;
      } else {
        summary.pending += invoiceTotal;
      }
      return summary;
    },
    { count: 0, billed: 0, paid: 0, pending: 0 },
  );

  document.getElementById("totalInvoices").textContent = formatNumber(totals.count);
  document.getElementById("totalBilled").textContent = compactMoney(totals.billed);
  document.getElementById("totalPaid").textContent = compactMoney(totals.paid);
  document.getElementById("totalPending").textContent = compactMoney(totals.pending);

  const table = document.getElementById("recentInvoicesTable");
  const recent = [...invoiceDocs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const totalPages = Math.max(1, Math.ceil(recent.length / RECENT_INVOICE_PAGE_SIZE));
  recentInvoicesPage = Math.min(recentInvoicesPage, totalPages);
  const start = (recentInvoicesPage - 1) * RECENT_INVOICE_PAGE_SIZE;
  const pageItems = recent.slice(start, start + RECENT_INVOICE_PAGE_SIZE);
  table.innerHTML = pageItems.length
    ? pageItems
        .map((invoice, index) => {
          const totals = calculateTotals(invoice);
          return `
            <tr>
              <td>${start + index + 1}</td>
              <td><button class="text-action" type="button" data-select="${invoice.id}">${invoice.invoiceNumber}</button></td>
              <td>${escapeHtml(invoice.customerName)}</td>
              <td>${invoiceStatusSelect(invoice)}</td>
              <td>${money(totals.total, invoiceCurrency(invoice))}</td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action edit" title="Edit invoice" aria-label="Edit invoice" type="button" data-edit="${invoice.id}">${iconEdit()}</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : emptyRow("No invoices yet", 6);
  document.getElementById("recentInvoicesPrevPage").disabled = recentInvoicesPage <= 1;
  document.getElementById("recentInvoicesNextPage").disabled = recentInvoicesPage >= totalPages;
  document.getElementById("recentInvoicesPageLabel").textContent = `Page ${recentInvoicesPage} of ${totalPages}`;

  renderDashboardSearch();
}

function renderDashboardSearch() {
  const query = dashboardSearchInput.value.trim().toLowerCase();
  const table = document.getElementById("dashboardSearchTable");
  const searchPanel = document.querySelector(".dashboard-search-panel");
  const resultsWrap = document.querySelector(".dashboard-search-results");
  if (!query) {
    searchPanel.classList.add("is-hidden");
    resultsWrap.classList.add("is-hidden");
    table.innerHTML = "";
    return;
  }
  searchPanel.classList.remove("is-hidden");
  resultsWrap.classList.remove("is-hidden");

  const results = invoices
    .filter((invoice) => {
      const haystack =
        `${invoice.invoiceNumber} ${invoice.documentType || "Invoice"} ${invoice.customerName} ${invoice.customerEmail}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 8);

  table.innerHTML = results.length
    ? results.map((invoice) => dashboardDocumentRow(invoice)).join("")
    : emptyRow("No matching documents", 6);
}

function dashboardDocumentRow(invoice) {
  const totals = calculateTotals(invoice);
  return `
    <tr>
      <td>${escapeHtml(invoice.invoiceNumber)}</td>
      <td>${escapeHtml(invoice.documentType || "Invoice")}</td>
      <td>${escapeHtml(invoice.customerName)}</td>
      <td>${(invoice.documentType || "Invoice") === "Invoice" ? invoiceStatusSelect(invoice) : statusBadge(invoice.status)}</td>
      <td>${money(totals.total, invoiceCurrency(invoice))}</td>
      <td>
        <div class="action-row icon-actions">
          <button class="icon-action info" title="View invoice" aria-label="View invoice" type="button" data-select="${invoice.id}">${iconView()}</button>
          <button class="icon-action edit" title="Edit invoice" aria-label="Edit invoice" type="button" data-edit="${invoice.id}">${iconEdit()}</button>
          ${
            (invoice.documentType || "Invoice") === "Invoice" && invoice.status !== "Paid"
              ? `<button class="icon-action paid" title="Mark as paid" aria-label="Mark as paid" type="button" data-paid="${invoice.id}">${iconPaid()}</button>`
              : ""
          }
        </div>
      </td>
    </tr>
  `;
}

function renderInvoiceTable() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const month = invoiceMonthFilter.value;
  const filtered = invoices.filter((invoice) => {
    const matchesStatus = status === "All" || invoice.status === status;
    const matchesType = (invoice.documentType || "Invoice") === "Invoice";
    const matchesSelectedMonth = matchesMonth(invoice.invoiceDate, month);
    const haystack = `${invoice.invoiceNumber} ${invoice.customerName} ${invoice.customerEmail}`.toLowerCase();
    return matchesStatus && matchesType && matchesSelectedMonth && haystack.includes(query);
  });

  const table = document.getElementById("invoiceTable");
  const totalPages = Math.max(1, Math.ceil(filtered.length / INVOICE_PAGE_SIZE));
  invoicePage = Math.min(invoicePage, totalPages);
  const start = (invoicePage - 1) * INVOICE_PAGE_SIZE;
  const pageInvoices = filtered.slice(start, start + INVOICE_PAGE_SIZE);
  table.innerHTML = pageInvoices.length
    ? pageInvoices.map((invoice, index) => documentRow(invoice, false, start + index + 1)).join("")
    : emptyRow("No matching invoices", 8);
  document.getElementById("invoicePrevPage").disabled = invoicePage <= 1;
  document.getElementById("invoiceNextPage").disabled = invoicePage >= totalPages;
  document.getElementById("invoicePageLabel").textContent = `Page ${invoicePage} of ${totalPages}`;
}

function renderQuotationTable() {
  const query = quotationSearchInput.value.trim().toLowerCase();
  const status = quotationStatusFilter.value;
  const month = quotationMonthFilter.value;
  const filtered = invoices.filter((invoice) => {
    const matchesStatus = status === "All" || invoice.status === status;
    const matchesType = (invoice.documentType || "Invoice") === "Quotation";
    const matchesSelectedMonth = matchesMonth(invoice.invoiceDate, month);
    const haystack = `${invoice.invoiceNumber} ${invoice.customerName} ${invoice.customerEmail}`.toLowerCase();
    return matchesStatus && matchesType && matchesSelectedMonth && haystack.includes(query);
  });

  const table = document.getElementById("quotationTable");
  table.innerHTML = filtered.length
    ? filtered.map((invoice) => documentRow(invoice)).join("")
    : emptyRow("No matching quotations", 7);
}

function documentRow(invoice, includeType = false, rowNumber = null) {
  const totals = calculateTotals(invoice);
  const numberCell = rowNumber === null ? "" : `<td class="row-number-cell">${rowNumber}</td>`;
  const typeCell = includeType ? `<td>${escapeHtml(invoice.documentType || "Invoice")}</td>` : "";
  return `
    <tr>
      ${numberCell}
      <td>${escapeHtml(invoice.invoiceNumber)}</td>
      ${typeCell}
      <td>${escapeHtml(invoice.customerName)}</td>
      <td>${formatDate(invoice.invoiceDate)}</td>
      <td>${formatDate(invoice.dueDate)}</td>
      <td>${(invoice.documentType || "Invoice") === "Invoice" ? invoiceStatusSelect(invoice) : statusBadge(invoice.status)}</td>
      <td>${money(totals.total, invoiceCurrency(invoice))}</td>
      <td>
        <div class="action-row icon-actions">
          <button class="icon-action info" title="View document" aria-label="View document" type="button" data-select="${invoice.id}">${iconView()}</button>
          <button class="icon-action edit" title="Edit document" aria-label="Edit document" type="button" data-edit="${invoice.id}">${iconEdit()}</button>
          ${
            (invoice.documentType || "Invoice") === "Quotation"
              ? `<button class="icon-action paid" title="Convert to invoice" aria-label="Convert to invoice" type="button" data-convert="${invoice.id}">${iconConvert()}</button>`
              : ""
          }
          ${
            (invoice.documentType || "Invoice") === "Invoice" && invoice.status !== "Paid"
              ? `<button class="icon-action paid" title="Mark as paid" aria-label="Mark as paid" type="button" data-paid="${invoice.id}">${iconPaid()}</button>`
              : ""
          }
          ${
            invoice.repeatFrequency === "monthly"
              ? `<button class="icon-action next" title="Create next month" aria-label="Create next month" type="button" data-monthly="${invoice.id}">${iconNext()}</button>`
              : ""
          }
          <button class="icon-action delete" title="Delete document" aria-label="Delete document" type="button" data-delete="${invoice.id}">${iconDelete()}</button>
        </div>
      </td>
    </tr>
  `;
}

function renderClients() {
  clients = clients.map((client, index) => ({
    ...client,
    clientCode: client.clientCode || `CL${String(index + 1).padStart(4, "0")}`,
  }));
  clientSelect.innerHTML = `<option value="">Manual customer</option>${clients
    .map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`)
    .join("")}`;
  document.getElementById("projectClientName").innerHTML = `<option value="">Select client</option>${clients
    .map((client) => `<option value="${escapeAttribute(client.name)}">${escapeHtml(client.name)}</option>`)
    .join("")}`;
  statementClientSelect.innerHTML = `<option value="">Select client</option>${clients
    .map((client) => `<option value="${escapeAttribute(client.name)}">${escapeHtml(client.name)}</option>`)
    .join("")}`;
  document.getElementById("renewalClient").innerHTML = `<option value="">Select client</option>${clients
    .map((client) => `<option value="${escapeAttribute(client.name)}">${escapeHtml(client.name)}</option>`)
    .join("")}`;
  document.getElementById("clientNameSuggestions").innerHTML = clients
    .map((client) => `<option value="${escapeAttribute(client.name)}"></option>`)
    .join("");

  const table = document.getElementById("clientTable");
  const totalPages = Math.max(1, Math.ceil(clients.length / CLIENT_PAGE_SIZE));
  clientPage = Math.min(clientPage, totalPages);
  const start = (clientPage - 1) * CLIENT_PAGE_SIZE;
  const pageClients = clients.slice(start, start + CLIENT_PAGE_SIZE);
  table.innerHTML = pageClients.length
    ? pageClients
        .map(
          (client) => `
            <tr>
              <td>${escapeHtml(client.clientCode)}</td>
              <td>${escapeHtml(client.name)}</td>
              <td>${escapeHtml([client.email, formatPhone(client.phone)].filter(Boolean).join(" | "))}</td>
              <td>${escapeHtml(client.country)}</td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action invoice" title="Create invoice" aria-label="Create invoice" type="button" data-client-invoice="${client.id}">${iconInvoice()}</button>
                  <button class="icon-action edit" title="Edit client" aria-label="Edit client" type="button" data-client-edit="${client.id}">${iconEdit()}</button>
                  <button class="icon-action delete" title="Delete client" aria-label="Delete client" type="button" data-client-delete="${client.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : emptyRow("No saved clients yet", 5);
  document.getElementById("clientPrevPage").disabled = clientPage <= 1;
  document.getElementById("clientNextPage").disabled = clientPage >= totalPages;
  document.getElementById("clientPageLabel").textContent = `Page ${clientPage} of ${totalPages}`;
}

function renderEmployees() {
  const query = employeeSearchInput.value.trim().toLowerCase();
  const status = employeeStatusFilter.value;
  const rows = employees
    .filter((employee) => status === "All" || (employee.status || "Active") === status)
    .filter((employee) => {
      const haystack = [
        employee.employeeCode,
        employee.firstName,
        employee.lastName,
        employee.workEmail,
        employee.personalEmail,
        formatPhone(employee.phone),
        employee.department,
        employee.jobTitle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

  document.getElementById("employeeTable").innerHTML = rows.length
    ? rows
        .map((employee) => {
          const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
          const photo = employee.profilePhoto
            ? `<img class="employee-avatar" src="${escapeAttribute(employee.profilePhoto)}" alt="${escapeAttribute(fullName)}" />`
            : `<span class="employee-avatar employee-avatar-fallback">${escapeHtml((employee.firstName || "E").slice(0, 1))}</span>`;
          return `
            <tr>
              <td>
                <div class="employee-cell">
                  ${photo}
                  <div>
                    <strong>${escapeHtml(fullName)}</strong>
                    <span>${escapeHtml(employee.employeeCode || "")}</span>
                  </div>
                </div>
              </td>
              <td>${escapeHtml([employee.workEmail || employee.personalEmail, formatPhone(employee.phone)].filter(Boolean).join(" | "))}</td>
              <td>${escapeHtml([employee.department, employee.jobTitle, employee.employmentType].filter(Boolean).join(" | "))}</td>
              <td>${statusBadge(employee.status || "Active")}</td>
              <td>${formatDate(String(employee.updatedAt || "").slice(0, 10))}</td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action edit" title="Edit employee" aria-label="Edit employee" type="button" data-employee-edit="${employee.id}">${iconEdit()}</button>
                  <button class="icon-action delete" title="Delete employee" aria-label="Delete employee" type="button" data-employee-delete="${employee.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : emptyRow("No employees yet", 6);
}

function getSelectedUserAccess() {
  return [...document.querySelectorAll("#userAccessOptions input:checked")].map((input) => input.value);
}

async function getUserFormData() {
  const role = document.getElementById("userRole").value;
  const access = role === "admin" ? roleDefaultAccess.admin : getSelectedUserAccess();
  const existing = users.find((user) => user.id === editingUserId);
  const password = document.getElementById("userPassword").value;
  return {
    id: editingUserId || createId(),
    name: document.getElementById("userName").value.trim(),
    username: document.getElementById("userUsername").value.trim(),
    passwordHash: password ? await hashPassword(password) : existing?.passwordHash || (await hashPassword("123456")),
    email: document.getElementById("userEmail").value.trim(),
    role,
    status: document.getElementById("userStatus").value,
    access,
    updatedAt: new Date().toISOString(),
  };
}

function resetUserForm() {
  editingUserId = null;
  userForm.reset();
  document.getElementById("userRole").value = "project-manager";
  document.getElementById("userStatus").value = "Active";
  document.getElementById("userPassword").placeholder = "Password";
  populateUserAccessOptions(roleDefaultAccess["project-manager"]);
}

function editUser(id) {
  const user = users.find((item) => item.id === id);
  if (!user) return;
  editingUserId = id;
  document.getElementById("userName").value = user.name || "";
  document.getElementById("userUsername").value = user.username || "";
  document.getElementById("userPassword").value = "";
  document.getElementById("userPassword").placeholder = "Leave blank to keep old password";
  document.getElementById("userEmail").value = user.email || "";
  document.getElementById("userRole").value = user.role || "project-manager";
  document.getElementById("userStatus").value = user.status || "Active";
  populateUserAccessOptions(user.access || roleDefaultAccess[user.role] || []);
  switchView("users");
}

function deleteUser(id) {
  const user = users.find((item) => item.id === id);
  if (!user || user.role === "admin") {
    showToast("Admin user cannot be deleted");
    return;
  }
  const confirmed = confirm(`Delete ${user.name}?`);
  if (!confirmed) return;
  users = users.filter((item) => item.id !== id);
  if (currentUserId === id) logoutUser();
  saveUsers();
  renderUsers();
  renderManagerHandles();
  applyAccessControl();
  showToast("User deleted");
}

function renderUsers() {
  document.getElementById("userTable").innerHTML = users.length
    ? users
        .map((user) => {
          const accessText = user.role === "admin" ? "Full control" : `${(user.access || []).length} sections`;
          return `
            <tr>
              <td><strong>${escapeHtml(user.name)}</strong><br /><span class="muted-label">${escapeHtml(user.email || "")}</span></td>
              <td>${escapeHtml(user.username || "")}</td>
              <td>${escapeHtml(roleLabels[user.role] || user.role)}</td>
              <td>${escapeHtml(accessText)}</td>
              <td>${statusBadge(user.status || "Active")}</td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action edit" title="Edit user" aria-label="Edit user" type="button" data-user-edit="${user.id}">${iconEdit()}</button>
                  <button class="icon-action delete" title="Delete user" aria-label="Delete user" type="button" data-user-delete="${user.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : emptyRow("No users yet", 6);
}

function getManagerHandleFormData() {
  const project = projects.find((item) => item.id === document.getElementById("handleProject").value);
  const assignedUser = users.find((item) => item.id === document.getElementById("handleUser").value);
  return {
    id: editingManagerHandleId || createId(),
    projectId: project?.id || "",
    projectName: project?.name || "",
    clientName: project?.clientName || "",
    userId: assignedUser?.id || "",
    userName: assignedUser?.name || "",
    userRole: assignedUser?.role || "",
    task: document.getElementById("handleTask").value.trim(),
    priority: document.getElementById("handlePriority").value,
    dueDate: document.getElementById("handleDueDate").value,
    status: document.getElementById("handleStatus").value,
    note: document.getElementById("handleNote").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetManagerHandleForm() {
  editingManagerHandleId = null;
  managerHandleForm.reset();
  populateManagerHandleSelects();
  document.getElementById("handlePriority").value = "Normal";
  document.getElementById("handleStatus").value = "Waiting";
}

function editManagerHandle(id) {
  const handle = managerHandles.find((item) => item.id === id);
  if (!handle) return;
  editingManagerHandleId = id;
  populateManagerHandleSelects();
  document.getElementById("handleProject").value = handle.projectId || "";
  document.getElementById("handleUser").value = handle.userId || "";
  document.getElementById("handleTask").value = handle.task || "";
  document.getElementById("handlePriority").value = handle.priority || "Normal";
  document.getElementById("handleDueDate").value = handle.dueDate || "";
  document.getElementById("handleStatus").value = handle.status || "Waiting";
  document.getElementById("handleNote").value = handle.note || "";
  switchView("manager");
}

function deleteManagerHandle(id) {
  const handle = managerHandles.find((item) => item.id === id);
  if (!handle) return;
  const confirmed = confirm(`Delete handle for ${handle.projectName || handle.task}?`);
  if (!confirmed) return;
  managerHandles = managerHandles.filter((item) => item.id !== id);
  saveManagerHandles();
  renderManagerHandles();
  resetManagerHandleForm();
  showToast("Handle deleted");
}

function renderManagerHandles() {
  populateManagerHandleSelects();
  const query = managerHandleSearchInput.value.trim().toLowerCase();
  const rows = managerHandles.filter((handle) => {
    const haystack = `${handle.projectName} ${handle.clientName} ${handle.userName} ${handle.task} ${handle.status}`.toLowerCase();
    return haystack.includes(query);
  });
  document.getElementById("managerHandleTable").innerHTML = rows.length
    ? rows
        .map(
          (handle) => `
            <tr>
              <td><strong>${escapeHtml(handle.projectName || "Project")}</strong><br /><span class="muted-label">${escapeHtml(handle.clientName || "")}</span></td>
              <td>${escapeHtml(handle.userName || "")}<br /><span class="muted-label">${escapeHtml(roleLabels[handle.userRole] || handle.userRole || "")}</span></td>
              <td title="${escapeAttribute(handle.note || "")}">${escapeHtml(handle.task || "")}<br /><span class="muted-label">${escapeHtml(handle.priority || "Normal")}</span></td>
              <td>${formatDate(handle.dueDate)}</td>
              <td>${statusBadge(handle.status || "Waiting")}</td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action edit" title="Edit handle" aria-label="Edit handle" type="button" data-handle-edit="${handle.id}">${iconEdit()}</button>
                  <button class="icon-action delete" title="Delete handle" aria-label="Delete handle" type="button" data-handle-delete="${handle.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : emptyRow("No assigned project work yet", 6);
}

function activeTeamUsers(role) {
  return users.filter((user) => user.status !== "Disabled" && (!role || user.role === role));
}

function fieldValue(id, fallback = "") {
  const element = document.getElementById(id);
  return element ? element.value : fallback;
}

function setFieldValue(id, value = "") {
  const element = document.getElementById(id);
  if (element) element.value = value;
}

function setText(id, value = "") {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function isManagerProject(project = {}) {
  const text = `${project.name || ""} ${project.clientName || ""} ${project.note || ""}`.toLowerCase();
  return text.includes("social media") || /\bsm\b/.test(text) || text.includes("maintenance") || text.includes("maintainance");
}

function assignedTeamUser(project = {}) {
  const id =
    project.assignedTeamId ||
    project.assignedDesignerId ||
    project.assignedDeveloperId ||
    users.find((user) => user.name === project.assignedDesigner || user.name === project.assignedDeveloper)?.id ||
    "";
  return users.find((user) => user.id === id) || null;
}

function isPostTrackedProject(project = {}) {
  const text = `${project.name || ""} ${project.note || ""}`.toLowerCase();
  const team = assignedTeamUser(project);
  const isDeveloperWork = team?.role === "developer" || project.assignedTeamRole === "developer";
  const isSocialWork = text.includes("social media") || /\bsm\b/.test(text);
  return isSocialWork && !isDeveloperWork;
}

function managerMonth() {
  return fieldValue("pmMonthFilter", today().slice(0, 7)) || today().slice(0, 7);
}

function managerProjects() {
  const monthRows = projectsForMonth(managerMonth()).filter(isManagerProject);
  const unique = new Map();
  monthRows.forEach((project) => {
    const key = projectRecurringKey(project);
    if (!unique.has(key)) unique.set(key, project);
  });
  return [...unique.values()];
}

function postCount(post = {}) {
  return Math.max(1, Number(post.count || 1));
}

function projectPlatformLinks(projectId) {
  const links = new Map();
  socialMediaPosts
    .filter((post) => post.projectId === projectId && post.platform)
    .sort((a, b) => String(b.uploadDate || "").localeCompare(String(a.uploadDate || "")))
    .forEach((post) => {
      if (!links.has(post.platform)) links.set(post.platform, post.link || "");
    });
  return socialPlatforms.map((platform) => ({ platform, link: links.get(platform) || "" }));
}

function platformIcon(platform = "") {
  const name = String(platform).toLowerCase();
  if (name.includes("instagram")) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="4"></rect><circle cx="12" cy="12" r="3"></circle><circle cx="16.5" cy="7.5" r="1"></circle></svg>`;
  }
  if (name.includes("tiktok")) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v9.2a4.2 4.2 0 1 1-3-4V12a1.8 1.8 0 1 0 1.2 1.7V4h1.8c.4 2.2 1.8 3.6 4 4v2.3c-1.7-.2-3.1-.9-4-2v-4.3Z"></path></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v2H6v4h3v5h4v-5h3l1-4h-4V9c0-.6.4-1 1-1Z"></path></svg>`;
}

function platformButtons(projectId) {
  const virtual = parseVirtualProjectId(projectId);
  const ids = [projectId, virtual?.sourceId].filter(Boolean);
  const buttons = socialPlatforms
    .map((platform) => {
      const posts = socialMediaPosts.filter((item) => ids.includes(item.projectId) && item.platform === platform && postMonth(item) === managerMonth());
      const count = posts.reduce((sum, item) => sum + postCount(item), 0);
      const post = posts
        .filter((item) => item.link)
        .sort((a, b) => String(b.uploadDate || "").localeCompare(String(a.uploadDate || "")))[0];
      return { platform, link: post?.link || "", count };
    })
    .filter((item) => item.count || item.link);
  if (!buttons.length) return `<span class="muted-label">No links</span>`;
  return buttons
    .map((item) =>
      item.link
        ? `<a class="pm-platform-link" href="${escapeAttribute(normalizeOpenUrl(item.link))}" target="_blank" rel="noopener noreferrer" title="${escapeAttribute(item.platform)}">${platformIcon(item.platform)}<span>${item.count}</span></a>`
        : `<span class="pm-platform-link is-muted" title="${escapeAttribute(item.platform)}">${platformIcon(item.platform)}<span>${item.count}</span></span>`,
    )
    .join("");
}

function userOptions(role, selected = "") {
  const rows = activeTeamUsers(role);
  return [`<option value="">Not assigned</option>`]
    .concat(rows.map((user) => `<option value="${escapeAttribute(user.id)}" ${user.id === selected ? "selected" : ""}>${escapeHtml(user.name)}</option>`))
    .join("");
}

function managerTeamOptions(selected = "") {
  const rows = users.filter((user) => user.status !== "Disabled" && ["designer", "developer"].includes(user.role));
  return [`<option value="">Not assigned</option>`]
    .concat(
      rows.map(
        (user) =>
          `<option value="${escapeAttribute(user.id)}" ${user.id === selected ? "selected" : ""}>${escapeHtml(user.name)} - ${escapeHtml(roleLabels[user.role] || user.role)}</option>`,
      ),
    )
    .join("");
}

function teamSelect(selectedId, projectId) {
  return `<select class="pm-inline-select" data-pm-team="${escapeAttribute(projectId)}">${managerTeamOptions(selectedId || "")}</select>`;
}

function clientOptions(selected = "") {
  const names = [...new Set(managerProjects().map((project) => project.clientName || project.name).filter(Boolean))];
  return [`<option value="">Select client</option>`]
    .concat(names.map((name) => `<option value="${escapeAttribute(name)}" ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`))
    .join("");
}

function projectOptions(selected = "", clientName = "") {
  const source = document.getElementById("managerView") ? managerProjects() : projects;
  const filtered = clientName ? source.filter((project) => (project.clientName || project.name) === clientName) : source;
  return [`<option value="">Select project</option>`]
    .concat(filtered.map((project) => `<option value="${escapeAttribute(project.id)}" ${project.id === selected ? "selected" : ""}>${escapeHtml(projectOptionLabel(project))}</option>`))
    .join("");
}

function selectOptions(values, selected = "") {
  return values.map((value) => `<option value="${escapeAttribute(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function socialPostDateTime(post = {}) {
  if (!post.scheduledDate) return null;
  return new Date(`${post.scheduledDate}T${post.scheduledTime || "00:00"}`);
}

function isPostMissed(post = {}) {
  const due = socialPostDateTime(post);
  return Boolean(due && due < new Date() && !["Uploaded", "Cancelled"].includes(post.status || ""));
}

function postMonth(post = {}) {
  return (post.uploadDate || post.scheduledDate || "").slice(0, 7);
}

function currentWeekRange() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function pastWeekRange() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function addPmNotificationOnce(type, title, message, sourceId, assignedTo = "project-manager", extra = {}) {
  if (pmNotifications.some((item) => item.sourceId === sourceId)) return;
  pmNotifications.unshift({
    id: createId(),
    type,
    title,
    message,
    sourceId,
    assignedTo,
    status: "Unread",
    createdAt: new Date().toISOString(),
    ...extra,
  });
  savePmNotifications();
}

function updatePmNotifications() {
  pmNotifications = pmNotifications.filter((note) => ["Weekly missed post", "Team notify"].includes(note.type || ""));
  savePmNotifications();
}

function visiblePmNotifications() {
  return pmNotifications.filter((note) => note.type === "Weekly missed post");
}

function notifyDesignerForMissedPost(notificationId) {
  const note = pmNotifications.find((item) => item.id === notificationId);
  if (!note) return;
  if (!note.designerId) {
    showToast("Assign a designer before notifying");
    return;
  }
  addPmNotificationOnce(
    "Team notify",
    "Missed post alert",
    `${note.clientName || "Client"} - ${note.projectName || "Project"} is missing ${note.missing || 0} post${Number(note.missing || 0) === 1 ? "" : "s"} this week.`,
    `designer-alert-${note.id}-${note.designerId}`,
    note.designerId,
    {
      projectId: note.projectId || "",
      clientName: note.clientName || "",
      projectName: note.projectName || "",
      missing: note.missing || 0,
      required: note.required || PM_WEEKLY_POST_TARGET,
      posted: note.posted || 0,
    },
  );
  note.status = "Notified";
  savePmNotifications();
  renderPmNotifications();
  showToast(`Alert sent to ${note.designerName || "designer"}`);
}

function projectAssignedDesigner(project = {}) {
  if (project.assignedTeamRole === "designer" && project.assignedTeamId) return users.find((user) => user.id === project.assignedTeamId);
  if (project.assignedDesignerId) return users.find((user) => user.id === project.assignedDesignerId);
  if (project.assignedDesigner) return users.find((user) => user.name === project.assignedDesigner);
  return null;
}

function updateWeeklyProjectNotifications() {
  const { start, end } = pastWeekRange();
  const weekKey = start.toISOString().slice(0, 10);
  pmNotifications = pmNotifications.filter((note) => !["Weekly warning", "Weekly missed post"].includes(note.type || ""));
  managerProjects()
    .filter(isActiveProject)
    .filter(isPostTrackedProject)
    .forEach((project) => {
      const weeklyPosts = socialMediaPosts.filter((post) => {
        const postedDate = post.uploadDate || post.scheduledDate || "";
        const due = postedDate ? new Date(`${postedDate}T00:00:00`) : null;
        return post.projectId === project.id && due && due >= start && due < end;
      });
      const uploaded = groupedSocialPostCount(weeklyPosts);
      const missing = Math.max(0, PM_WEEKLY_POST_TARGET - uploaded);
      if (!missing) return;
      const clientName = project.clientName || project.name || "Client";
      const projectName = project.name || "Project";
      const designer = projectAssignedDesigner(project);
      addPmNotificationOnce(
        "Weekly missed post",
        "Missed posts this week",
        `${clientName} - ${projectName} missed ${missing} post${missing === 1 ? "" : "s"} this week. Required ${PM_WEEKLY_POST_TARGET}, posted ${uploaded}.`,
        `weekly-missed-${project.id}-${weekKey}`,
        "project-manager",
        {
          projectId: project.id,
          projectName,
          clientName,
          missing,
          required: PM_WEEKLY_POST_TARGET,
          posted: uploaded,
          designerId: designer?.id || "",
          designerName: designer?.name || "",
        },
      );
    });
  savePmNotifications();
}

function populateProjectManagerForms() {
  const clientHtml = clientOptions();
  const projectHtml = projectOptions();
  const designerHtml = userOptions("designer");
  const developerHtml = userOptions("developer");
  const assignableHtml = userOptions();
  const elements = {
    postClient: clientHtml,
    postProject: projectHtml,
    postDesigner: designerHtml,
    postDeveloper: developerHtml,
    postStatus: selectOptions(socialPostStatuses, "Planned"),
    correctionClient: clientHtml,
    correctionProject: projectHtml,
    correctionAssignedTo: assignableHtml,
    correctionStatus: selectOptions(correctionStatuses, "Received from Client"),
  };
  Object.entries(elements).forEach(([id, html]) => {
    const element = document.getElementById(id);
    if (element && !element.dataset.locked) element.innerHTML = html;
  });
}

function getSocialPostFormData() {
  const selectedProjectId = fieldValue("postProject");
  const projectId = selectedProjectId ? ensureProjectForMonth(selectedProjectId) : "";
  const project = projects.find((item) => item.id === projectId);
  const designer = users.find((item) => item.id === fieldValue("postDesigner"));
  const developer = users.find((item) => item.id === fieldValue("postDeveloper"));
  const postedDate = fieldValue("postUploadDate") || fieldValue("postScheduledDate") || today();
  const count = Math.max(1, Number(fieldValue("postCount", 1) || 1));
  return {
    id: editingSocialPostId || createId(),
    clientName: fieldValue("postClient") || project?.clientName || "",
    projectId: project?.id || "",
    projectName: project?.name || "",
    platform: "Social",
    title: fieldValue("postTitle", "Posted count").trim() || "Posted count",
    description: fieldValue("postDescription").trim(),
    type: fieldValue("postType", "Posted count").trim() || "Posted count",
    count,
    scheduledDate: postedDate,
    scheduledTime: fieldValue("postScheduledTime", "09:00"),
    designerId: designer?.id || "",
    designerName: designer?.name || "",
    developerId: developer?.id || "",
    developerName: developer?.name || "",
    status: fieldValue("postStatus", "Uploaded"),
    uploadDate: postedDate,
    uploadTime: fieldValue("postUploadTime"),
    link: "",
    remarks: fieldValue("postRemarks").trim(),
    attachment: fieldValue("postAttachment").trim(),
    updatedAt: new Date().toISOString(),
  };
}

function selectedPostPlatforms() {
  return socialPlatforms
    .map((platform) => {
      const key = platform === "TikTok" ? "TikTok" : platform;
      const checked = document.getElementById(`postPlatform${key}`)?.checked;
      const link = fieldValue(`postLink${key}`).trim();
      return checked || link ? { platform, link } : null;
    })
    .filter(Boolean);
}

function resetSocialPostForm() {
  editingSocialPostId = null;
  socialPostForm?.reset();
  populateProjectManagerForms();
  setFieldValue("pmMonthFilter", managerMonth());
  socialPlatforms.forEach((platform) => {
    const key = platform === "TikTok" ? "TikTok" : platform;
    const checkbox = document.getElementById(`postPlatform${key}`);
    if (checkbox) checkbox.checked = false;
    setFieldValue(`postLink${key}`, "");
  });
  setFieldValue("postScheduledDate", today());
  setFieldValue("postScheduledTime", "09:00");
  setFieldValue("postUploadDate", today());
  setFieldValue("postCount", 1);
  setFieldValue("postStatus", "Uploaded");
}

function editSocialPost(id) {
  const post = socialMediaPosts.find((item) => item.id === id);
  if (!post) return;
  editingSocialPostId = id;
  populateProjectManagerForms();
  setFieldValue("postClient", post.clientName || "");
  setFieldValue("postProject", post.projectId || "");
  socialPlatforms.forEach((platform) => {
    const key = platform === "TikTok" ? "TikTok" : platform;
    const checkbox = document.getElementById(`postPlatform${key}`);
    if (checkbox) checkbox.checked = platform === post.platform;
    setFieldValue(`postLink${key}`, platform === post.platform ? post.link || "" : "");
  });
  setFieldValue("postTitle", post.title || "");
  setFieldValue("postDescription", post.description || "");
  setFieldValue("postType", post.type || "");
  setFieldValue("postScheduledDate", post.scheduledDate || "");
  setFieldValue("postScheduledTime", post.scheduledTime || "");
  setFieldValue("postDesigner", post.designerId || "");
  setFieldValue("postDeveloper", post.developerId || "");
  setFieldValue("postStatus", post.status || "Uploaded");
  setFieldValue("postUploadDate", post.uploadDate || post.scheduledDate || "");
  setFieldValue("postUploadTime", post.uploadTime || "");
  setFieldValue("postCount", post.count || 1);
  setFieldValue("postRemarks", post.remarks || "");
  setFieldValue("postAttachment", post.attachment || "");
  switchView("manager");
}

function deleteSocialPost(id) {
  const post = socialMediaPosts.find((item) => item.id === id);
  if (!post || !confirm(`Delete post ${post.title || ""}?`)) return;
  socialMediaPosts = socialMediaPosts.filter((item) => item.id !== id);
  deleteSupabaseRecord("socialMediaPosts", id);
  saveSocialMediaPosts();
  pmPostPage = 1;
  renderProjectManagerWorkspace();
  showToast("Post deleted");
}

function socialPostGroupKey(post = {}) {
  if (post.groupId) return post.groupId;
  return [
    post.uploadDate || post.scheduledDate || "",
    post.clientName || "",
    post.projectId || post.projectName || "",
    post.count || 1,
    post.remarks || "",
  ].join("||");
}

function groupedSocialPosts(sourcePosts) {
  const groups = new Map();
  (sourcePosts || socialMediaPosts.filter((post) => postMonth(post) === managerMonth()))
    .forEach((post) => {
      const key = socialPostGroupKey(post);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          posts: [],
          date: post.uploadDate || post.scheduledDate || "",
          clientName: post.clientName || "",
          projectName: post.projectName || "",
          remarks: post.remarks || "",
        });
      }
      groups.get(key).posts.push(post);
    });
  return [...groups.values()].map((group) => ({
    ...group,
    count: Math.max(...group.posts.map((post) => postCount(post)), 0),
  }));
}

function groupedSocialPostCount(posts) {
  return groupedSocialPosts(posts).reduce((sum, group) => sum + group.count, 0);
}

function socialPostGroupPlatforms(posts = []) {
  const byPlatform = new Map();
  posts.forEach((post) => {
    if (!post.platform || byPlatform.has(post.platform)) return;
    byPlatform.set(post.platform, post);
  });
  return socialPlatforms
    .map((platform) => byPlatform.get(platform))
    .filter(Boolean)
    .map((post) =>
      post.link
        ? `<a class="pm-platform-link pm-platform-icon-only" href="${escapeAttribute(normalizeOpenUrl(post.link))}" target="_blank" rel="noopener noreferrer" title="${escapeAttribute(post.platform)}">${platformIcon(post.platform)}</a>`
        : `<span class="pm-platform-link pm-platform-icon-only is-muted" title="${escapeAttribute(post.platform)}">${platformIcon(post.platform)}</span>`,
    )
    .join("");
}

function filteredSocialPostGroups() {
  const clientFilter = fieldValue("pmPostClientFilter");
  return groupedSocialPosts()
    .filter((group) => !clientFilter || group.clientName === clientFilter)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function renderPostClientFilter() {
  const select = document.getElementById("pmPostClientFilter");
  if (!select) return;
  const selected = select.value;
  const names = [...new Set(groupedSocialPosts().map((group) => group.clientName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  select.innerHTML = [`<option value="">All clients</option>`]
    .concat(names.map((name) => `<option value="${escapeAttribute(name)}" ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`))
    .join("");
}

function deleteSocialPostGroup(encodedKey) {
  const key = decodeURIComponent(encodedKey || "");
  const group = groupedSocialPosts().find((item) => item.key === key);
  if (!group || !confirm("Delete this posted record?")) return;
  const ids = new Set(group.posts.map((post) => post.id));
  socialMediaPosts = socialMediaPosts.filter((post) => !ids.has(post.id));
  group.posts.forEach((post) => deleteSupabaseRecord("socialMediaPosts", post.id));
  saveSocialMediaPosts();
  pmPostPage = 1;
  renderProjectManagerWorkspace();
  showToast("Posted record deleted");
}

function getCorrectionFormData() {
  const project = projects.find((item) => item.id === fieldValue("correctionProject"));
  const assignedUser = users.find((item) => item.id === fieldValue("correctionAssignedTo"));
  return {
    id: editingCorrectionId || createId(),
    clientName: fieldValue("correctionClient") || project?.clientName || "",
    projectId: project?.id || "",
    projectName: project?.name || "",
    type: fieldValue("correctionType").trim(),
    description: fieldValue("correctionDescription").trim(),
    assignedToId: assignedUser?.id || "",
    assignedToName: assignedUser?.name || "",
    assignedToRole: assignedUser?.role || "",
    priority: fieldValue("correctionPriority", "Normal"),
    dueDate: fieldValue("correctionDueDate"),
    status: fieldValue("correctionStatus", "Received from Client"),
    attachment: fieldValue("correctionAttachment").trim(),
    clientMessage: fieldValue("correctionClientMessage").trim(),
    pmRemark: fieldValue("correctionPmRemark").trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetCorrectionForm() {
  editingCorrectionId = null;
  correctionForm?.reset();
  populateProjectManagerForms();
  setFieldValue("correctionPriority", "Normal");
  setFieldValue("correctionStatus", "Received from Client");
}

function editCorrection(id) {
  const correction = corrections.find((item) => item.id === id);
  if (!correction) return;
  editingCorrectionId = id;
  populateProjectManagerForms();
  setFieldValue("correctionClient", correction.clientName || "");
  setFieldValue("correctionProject", correction.projectId || "");
  setFieldValue("correctionType", correction.type || "");
  setFieldValue("correctionAssignedTo", correction.assignedToId || "");
  setFieldValue("correctionPriority", correction.priority || "Normal");
  setFieldValue("correctionDueDate", correction.dueDate || "");
  setFieldValue("correctionStatus", correction.status || "Received from Client");
  setFieldValue("correctionAttachment", correction.attachment || "");
  setFieldValue("correctionDescription", correction.description || "");
  setFieldValue("correctionClientMessage", correction.clientMessage || "");
  setFieldValue("correctionPmRemark", correction.pmRemark || "");
  switchView("manager");
}

function deleteCorrection(id) {
  const correction = corrections.find((item) => item.id === id);
  if (!correction || !confirm(`Delete correction for ${correction.clientName || "client"}?`)) return;
  corrections = corrections.filter((item) => item.id !== id);
  saveCorrections();
  renderProjectManagerWorkspace();
  showToast("Correction deleted");
}

function assignProjectTeamMember(projectId, role) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;
  const available = activeTeamUsers(role);
  const current = role === "designer" ? project.assignedDesigner || "" : project.assignedDeveloper || "";
  const typed = prompt(
    `Assign ${role}. Available: ${available.map((user) => user.name).join(", ") || "no saved users"}`,
    current,
  );
  if (typed === null) return;
  const matched = available.find((user) => user.name.toLowerCase() === typed.trim().toLowerCase());
  projects = projects.map((item) => {
    if (item.id !== projectId) return item;
    return role === "designer"
      ? { ...item, assignedDesigner: matched?.name || typed.trim(), assignedDesignerId: matched?.id || "", updatedAt: new Date().toISOString() }
      : { ...item, assignedDeveloper: matched?.name || typed.trim(), assignedDeveloperId: matched?.id || "", updatedAt: new Date().toISOString() };
  });
  saveProjects();
  renderProjectManagerWorkspace();
  renderProjects();
  showToast(`${roleLabels[role] || role} assigned`);
}

function updateProjectTeamFromSelect(projectId, userId) {
  projectId = ensureProjectForMonth(projectId);
  const user = users.find((item) => item.id === userId);
  projects = projects.map((project) => {
    if (project.id !== projectId) return project;
    return {
      ...project,
      assignedTeamId: user?.id || "",
      assignedTeamName: user?.name || "",
      assignedTeamRole: user?.role || "",
      assignedDesignerId: user?.role === "designer" ? user.id : project.assignedDesignerId || "",
      assignedDesigner: user?.role === "designer" ? user.name : project.assignedDesigner || "",
      assignedDeveloperId: user?.role === "developer" ? user.id : project.assignedDeveloperId || "",
      assignedDeveloper: user?.role === "developer" ? user.name : project.assignedDeveloper || "",
      updatedAt: new Date().toISOString(),
    };
  });
  saveProjects();
  renderProjectManagerWorkspace();
  showToast("Team updated");
}

function renderProjectManagerDashboard() {
  const month = managerMonth();
  const activeProjects = managerProjects().filter(isActiveProject);
  const trackedProjects = activeProjects.filter(isPostTrackedProject);
  const monthPosts = socialMediaPosts.filter((post) => postMonth(post) === month);
  const posted = groupedSocialPostCount(monthPosts);
  const required = trackedProjects.length * PM_MONTHLY_POST_TARGET;
  const remaining = Math.max(0, required - posted);
  setText("pmActiveProjects", activeProjects.length);
  setText("pmPendingPosts", remaining);
  setText("pmUploadedPosts", posted);
  setText("pmMissedPosts", 0);
  setText("pmPendingCorrections", 0);
  setText("pmDesignerPending", 0);
  setText("pmDeveloperPending", 0);
  setText("pmNotificationCount", visiblePmNotifications().length);
}

function renderProjectManagerProjects() {
  const rows = managerProjects();
  const totalPages = Math.max(1, Math.ceil(rows.length / PM_PROJECT_PAGE_SIZE));
  pmProjectPage = Math.min(pmProjectPage, totalPages);
  const start = (pmProjectPage - 1) * PM_PROJECT_PAGE_SIZE;
  const visibleRows = rows.slice(start, start + PM_PROJECT_PAGE_SIZE);
  document.getElementById("pmProjectTable").innerHTML = rows.length
    ? visibleRows.map((project) => {
        const team = assignedTeamUser(project);
        const teamId = team?.id || "";
        const tracksPosts = isPostTrackedProject(project);
        const posted = tracksPosts ? socialMediaPosts.filter((post) => post.projectId === project.id && postMonth(post) === managerMonth()) : [];
        const postedCount = groupedSocialPostCount(posted);
        const remaining = Math.max(0, PM_MONTHLY_POST_TARGET - postedCount);
        const clientName = project.clientName || project.name || "";
        return `
          <tr>
            <td><span class="pm-client-cell">${clientColorDot(clientName)}${escapeHtml(clientName)}</span></td>
            <td><strong>${escapeHtml(project.name || "")}</strong></td>
            <td><div class="pm-platform-list">${platformButtons(project.id)}</div></td>
            <td><div class="pm-team-cell">${teamSelect(teamId, project.id)}</div></td>
            <td>${tracksPosts ? `${postedCount} / ${PM_MONTHLY_POST_TARGET}` : `<span class="muted-label">Not tracked</span>`}</td>
            <td>${tracksPosts ? remaining : `<span class="muted-label">-</span>`}</td>
          </tr>
        `;
      }).join("")
    : emptyRow("No social media or maintenance projects yet", 6);
  document.getElementById("pmProjectPrevPage").disabled = pmProjectPage <= 1;
  document.getElementById("pmProjectNextPage").disabled = pmProjectPage >= totalPages;
  document.getElementById("pmProjectPageLabel").textContent = `Page ${pmProjectPage} of ${totalPages}`;
}

function renderSocialMediaPosts() {
  const table = document.getElementById("socialPostTable");
  if (!table) return;
  renderPostClientFilter();
  const rows = filteredSocialPostGroups();
  const totalPages = Math.max(1, Math.ceil(rows.length / PM_POST_PAGE_SIZE));
  pmPostPage = Math.min(pmPostPage, totalPages);
  const start = (pmPostPage - 1) * PM_POST_PAGE_SIZE;
  const visibleRows = rows.slice(start, start + PM_POST_PAGE_SIZE);
  table.innerHTML = rows.length
    ? visibleRows.map((group, index) => `
        <tr>
          <td>${start + index + 1}</td>
          <td>${formatDate(group.date)}</td>
          <td>${escapeHtml(group.clientName || "")}</td>
          <td>${escapeHtml(group.projectName || "")}</td>
          <td><div class="pm-platform-list">${socialPostGroupPlatforms(group.posts)}</div></td>
          <td><strong>${group.count}</strong></td>
          <td title="${escapeAttribute(group.remarks || "")}">${escapeHtml(group.remarks || "")}</td>
          <td><div class="action-row icon-actions">
            <button class="icon-action edit" title="Edit posted record" aria-label="Edit posted record" type="button" data-post-edit="${group.posts[0]?.id || ""}">${iconEdit()}</button>
            <button class="icon-action delete" title="Delete posted record" aria-label="Delete posted record" type="button" data-post-delete-group="${escapeAttribute(encodeURIComponent(group.key))}">${iconDelete()}</button>
          </div></td>
        </tr>
      `).join("")
    : emptyRow("No posted records for this month", 8);
  document.getElementById("pmPostPrevPage").disabled = pmPostPage <= 1;
  document.getElementById("pmPostNextPage").disabled = pmPostPage >= totalPages;
  document.getElementById("pmPostPageLabel").textContent = `Page ${pmPostPage} of ${totalPages}`;
}

function monthlyPostRows() {
  const month = managerMonth();
  const clientNames = [...new Set([...managerProjects().filter(isPostTrackedProject).map((project) => project.clientName || project.name), ...socialMediaPosts.map((post) => post.clientName)].filter(Boolean))];
  return clientNames.map((clientName) => {
    const posts = socialMediaPosts.filter((post) => post.clientName === clientName && postMonth(post) === month);
    const uploaded = groupedSocialPostCount(posts);
    const remaining = Math.max(0, PM_MONTHLY_POST_TARGET - uploaded);
    const status = uploaded >= PM_MONTHLY_POST_TARGET ? "Complete" : "Pending";
    return { clientName, required: PM_MONTHLY_POST_TARGET, uploaded, remaining, status };
  });
}

function renderMonthlyPostTracking() {
  const rows = monthlyPostRows();
  monthlyPostReports = rows.map((row) => ({ ...row, month: today().slice(0, 7), updatedAt: new Date().toISOString() }));
  saveMonthlyPostReports();
  document.getElementById("monthlyPostTable").innerHTML = rows.length
    ? rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.clientName)}</td>
          <td>${row.required}</td>
          <td>${row.uploaded}</td>
          <td>${row.remaining}</td>
          <td>${statusBadge(row.status)}</td>
        </tr>
      `).join("")
    : emptyRow("No clients to track yet", 5);
}

function renderWeeklyPostTracking() {
  const { start, end } = currentWeekRange();
  const clientNames = [...new Set([...managerProjects().filter(isPostTrackedProject).map((project) => project.clientName || project.name), ...socialMediaPosts.map((post) => post.clientName)].filter(Boolean))];
  const rows = clientNames.map((clientName) => {
    const posts = socialMediaPosts.filter((post) => {
      const due = new Date(`${post.uploadDate || post.scheduledDate || ""}T00:00:00`);
      return post.clientName === clientName && due && due >= start && due < end;
    });
    const uploaded = groupedSocialPostCount(posts);
    const missing = Math.max(0, PM_WEEKLY_POST_TARGET - uploaded);
    return { clientName, required: PM_WEEKLY_POST_TARGET, uploaded, missing, status: missing ? "Warning" : "On track" };
  });
  document.getElementById("weeklyPostTable").innerHTML = rows.length
    ? rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.clientName)}</td>
          <td>${row.required}</td>
          <td>${row.uploaded}</td>
          <td>${row.missing}</td>
          <td>${statusBadge(row.status)}</td>
        </tr>
      `).join("")
    : emptyRow("No weekly tracking yet", 5);
}

function clientCalendarColor(clientName = "") {
  const saved = clientColors[String(clientName || "").trim()];
  if (/^#[0-9a-f]{6}$/i.test(saved || "")) return saved;
  const colors = ["#2563eb", "#7c3aed", "#0f766e", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#4f46e5", "#be123c", "#9333ea"];
  const seed = [...String(clientName || "Client")].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[seed % colors.length];
}

function clientColorDot(clientName = "") {
  return `<button class="pm-client-color" style="background:${clientCalendarColor(clientName)}" title="Change ${escapeAttribute(clientName || "client")} color" aria-label="Change ${escapeAttribute(clientName || "client")} color" type="button" data-client-color="${escapeAttribute(clientName)}"></button>`;
}

function changeClientColor(clientName = "") {
  const name = String(clientName || "").trim();
  if (!name) return;
  const picker = document.createElement("input");
  picker.type = "color";
  picker.value = clientCalendarColor(name);
  picker.style.position = "fixed";
  picker.style.left = "-100px";
  picker.style.top = "0";
  document.body.appendChild(picker);
  picker.addEventListener("input", () => {
    clientColors = { ...clientColors, [name]: picker.value };
    saveClientColors();
    renderProjectManagerWorkspace();
  });
  picker.addEventListener("change", () => {
    picker.remove();
    showToast(`${name} color updated`);
  });
  picker.click();
}

function renderPostCalendar() {
  const calendar = document.querySelector("#postCalendarGrid");
  if (!calendar) return;
  const month = managerMonth();
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const leadingEmptyDays = firstDay.getDay();
  const postedGroups = groupedSocialPosts(socialMediaPosts.filter((post) => postMonth(post) === month));
  const postsByDate = new Map();
  postedGroups.forEach((group) => {
    if (!group.date) return;
    const list = postsByDate.get(group.date) || [];
    list.push(group);
    postsByDate.set(group.date, list);
  });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells = [
    ...weekdays.map((day) => `<div class="pm-calendar-weekday">${day}</div>`),
    ...Array.from({ length: leadingEmptyDays }, () => `<div class="pm-calendar-day is-empty"></div>`),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dateKey = `${month}-${String(day).padStart(2, "0")}`;
      const posted = postsByDate.get(dateKey) || [];
      const chips = posted
        .map((group) => {
          const label = `${group.clientName || "Client"} (${group.count}) - ${group.projectName || ""}`;
          return `<span class="pm-calendar-dot" style="background:${clientCalendarColor(group.clientName)}" title="${escapeAttribute(label)}" data-calendar-client="${escapeAttribute(group.clientName || "Client")}"></span>`;
        })
        .join("");
      return `
        <div class="pm-calendar-day">
          <div class="pm-calendar-date"><span>${day}</span>${chips ? `<small>${posted.length}</small>` : ""}</div>
          ${chips ? `<div class="pm-calendar-dot-list">${chips}</div>` : ""}
        </div>
      `;
    }),
  ];
  calendar.innerHTML = cells.join("");
}

function renderCorrections() {
  const table = document.querySelector("#correctionTable");
  if (!table) return;
  table.innerHTML = corrections.length
    ? corrections.map((correction) => `
        <tr>
          <td><strong>${escapeHtml(correction.clientName || "")}</strong><br /><span class="muted-label">${escapeHtml(correction.projectName || "")}</span></td>
          <td title="${escapeAttribute(correction.description || "")}">${escapeHtml(correction.type || "")}</td>
          <td>${escapeHtml(correction.assignedToName || "Not assigned")}</td>
          <td>${escapeHtml(correction.priority || "Normal")}</td>
          <td>${formatDate(correction.dueDate)}</td>
          <td>${statusBadge(correction.status || "Received from Client")}</td>
          <td><div class="action-row icon-actions">
            <button class="icon-action edit" title="Edit correction" aria-label="Edit correction" type="button" data-correction-edit="${correction.id}">${iconEdit()}</button>
            <button class="icon-action delete" title="Delete correction" aria-label="Delete correction" type="button" data-correction-delete="${correction.id}">${iconDelete()}</button>
          </div></td>
        </tr>
      `).join("")
    : emptyRow("No corrections yet", 7);
}

function renderPmNotifications() {
  const list = document.getElementById("pmNotificationList");
  if (!list) return;
  const notes = visiblePmNotifications();
  list.innerHTML = notes.length
    ? notes.slice(0, 8).map((note) => `
        <article class="pm-notification ${escapeAttribute(note.status === "Notified" ? "Notified" : "Missed")}">
          <div class="pm-notification-copy">
            <strong>${escapeHtml(note.clientName || "Client")}</strong>
            <p>${escapeHtml(note.projectName || "Project")} missed <b>${formatNumber(note.missing || 0)}</b> post${Number(note.missing || 0) === 1 ? "" : "s"} this week.</p>
            <span>Required ${formatNumber(note.required || PM_WEEKLY_POST_TARGET)} · Posted ${formatNumber(note.posted || 0)} · Designer: ${escapeHtml(note.designerName || "Not assigned")}</span>
          </div>
          <div class="pm-notification-actions">
            <button class="secondary-action" type="button" data-notify-designer="${escapeAttribute(note.id)}">${note.status === "Notified" ? "Notify again" : "Notify designer"}</button>
          </div>
        </article>
      `).join("")
    : `<p class="muted-label">No missed posts this week.</p>`;
}

function renderPmDatabaseTables() {
  const table = document.querySelector("#pmDatabaseTables");
  if (!table) return;
  const tables = [
    ["projects", projects.length],
    ["social_media_posts", socialMediaPosts.length],
    ["monthly_post_reports", monthlyPostReports.length],
    ["corrections", corrections.length],
    ["notifications", pmNotifications.length],
  ];
  table.innerHTML = tables
    .map(([name, count]) => `<article><strong>${escapeHtml(name)}</strong><span>${count} records</span></article>`)
    .join("");
}

function renderProjectManagerWorkspace() {
  if (!views.manager) return;
  populateProjectManagerForms();
  updateWeeklyProjectNotifications();
  renderProjectManagerDashboard();
  renderProjectManagerProjects();
  renderSocialMediaPosts();
  renderPmNotifications();
  renderPostCalendar();
}

function renderItemSuggestions() {
  const titles = new Set();
  const descriptions = new Set();
  invoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      if (item.title || item.description) titles.add(item.title || item.description);
      if (item.description) descriptions.add(item.description);
    });
  });

  document.getElementById("itemTitleSuggestions").innerHTML = [...titles]
    .slice(0, 80)
    .map((value) => `<option value="${escapeAttribute(value)}"></option>`)
    .join("");
  document.getElementById("itemDescriptionSuggestions").innerHTML = [...descriptions]
    .slice(0, 80)
    .map((value) => `<option value="${escapeAttribute(value)}"></option>`)
    .join("");
}

function getServiceFormData() {
  return {
    id: editingServiceId || createId(),
    name: document.getElementById("serviceName").value.trim(),
    category: document.getElementById("serviceCategory").value,
    currency: document.getElementById("serviceCurrency").value,
    price: Number(document.getElementById("servicePrice").value || 0),
    billing: document.getElementById("serviceBilling").value,
    description: document.getElementById("serviceDescription").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetServiceForm() {
  editingServiceId = null;
  serviceForm.reset();
  document.getElementById("serviceCurrency").value = settings.currencyLabel || "LKR";
  document.getElementById("serviceBilling").value = "one-time";
}

function editService(id) {
  const service = services.find((item) => item.id === id);
  if (!service) return;
  editingServiceId = id;
  document.getElementById("serviceName").value = service.name;
  document.getElementById("serviceCategory").value = service.category || "Website";
  document.getElementById("serviceCurrency").value = service.currency || settings.currencyLabel;
  document.getElementById("servicePrice").value = service.price || "";
  document.getElementById("serviceBilling").value = service.billing || "one-time";
  document.getElementById("serviceDescription").value = service.description || "";
  switchView("services");
}

function deleteService(id) {
  const service = services.find((item) => item.id === id);
  if (!service) return;
  const confirmed = confirm(`Delete service "${service.name}"?`);
  if (!confirmed) return;
  services = services.filter((item) => item.id !== id);
  deleteSupabaseRecord("services", id);
  saveServices();
  renderServices();
  renderItemSuggestions();
  showToast("Service deleted");
}

function renderServices() {
  document.getElementById("serviceTable").innerHTML = services.length
    ? services
        .map(
          (service) => `
            <tr>
              <td>${escapeHtml(service.name)}</td>
              <td>${escapeHtml(service.category || "")}</td>
              <td>${escapeHtml(service.billing || "one-time")}</td>
              <td>${money(service.price, service.currency || settings.currencyLabel)}</td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action edit" title="Edit service" aria-label="Edit service" type="button" data-service-edit="${service.id}">${iconEdit()}</button>
                  <button class="icon-action delete" title="Delete service" aria-label="Delete service" type="button" data-service-delete="${service.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : emptyRow("No saved services yet", 5);
}

function getRenewalFormData() {
  return {
    id: editingRenewalId || createId(),
    clientName: document.getElementById("renewalClient").value,
    name: document.getElementById("renewalName").value.trim(),
    type: document.getElementById("renewalType").value,
    expiryDate: document.getElementById("renewalExpiry").value,
    amount: Number(document.getElementById("renewalAmount").value || 0),
    status: document.getElementById("renewalStatus").value,
    note: document.getElementById("renewalNote").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetRenewalForm() {
  editingRenewalId = null;
  renewalForm.reset();
  document.getElementById("renewalStatus").value = "Active";
}

function editRenewal(id) {
  const renewal = renewals.find((item) => item.id === id);
  if (!renewal) return;
  editingRenewalId = id;
  document.getElementById("renewalClient").value = renewal.clientName || "";
  document.getElementById("renewalName").value = renewal.name || "";
  document.getElementById("renewalType").value = renewal.type || "Domain";
  document.getElementById("renewalExpiry").value = renewal.expiryDate || "";
  document.getElementById("renewalAmount").value = renewal.amount || "";
  document.getElementById("renewalStatus").value = renewal.status || "Active";
  document.getElementById("renewalNote").value = renewal.note || "";
  switchView("renewals");
}

function deleteRenewal(id) {
  const renewal = renewals.find((item) => item.id === id);
  if (!renewal) return;
  const confirmed = confirm(`Delete renewal "${renewal.name}"?`);
  if (!confirmed) return;
  renewals = renewals.filter((item) => item.id !== id);
  deleteSupabaseRecord("renewals", id);
  saveRenewals();
  renderRenewals();
  showToast("Renewal deleted");
}

function renderRenewals() {
  const query = renewalSearchInput.value.trim().toLowerCase();
  const rows = renewals
    .filter((renewal) => `${renewal.clientName} ${renewal.name} ${renewal.type} ${renewal.status}`.toLowerCase().includes(query))
    .sort((a, b) => String(a.expiryDate || "").localeCompare(String(b.expiryDate || "")));
  document.getElementById("renewalTable").innerHTML = rows.length
    ? rows
        .map(
          (renewal) => `
            <tr>
              <td>${escapeHtml(renewal.clientName || "")}</td>
              <td>${escapeHtml(renewal.name)}</td>
              <td>${escapeHtml(renewal.type)}</td>
              <td>${formatDate(renewal.expiryDate)}</td>
              <td>${compactMoney(renewal.amount, "LKR")}</td>
              <td>${statusBadge(renewal.status || "Active")}</td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action edit" title="Edit renewal" aria-label="Edit renewal" type="button" data-renewal-edit="${renewal.id}">${iconEdit()}</button>
                  <button class="icon-action delete" title="Delete renewal" aria-label="Delete renewal" type="button" data-renewal-delete="${renewal.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : emptyRow("No renewal records yet", 7);
}

function getWebsiteLoginFormData() {
  return {
    id: editingWebsiteLoginId || createId(),
    websiteName: document.getElementById("websiteName").value.trim(),
    websiteLoginUrl: document.getElementById("websiteLoginUrl").value.trim(),
    username: document.getElementById("websiteUsername").value.trim(),
    password: document.getElementById("websitePassword").value,
    domainSource: document.getElementById("domainSource").value.trim(),
    domainLoginUrl: document.getElementById("domainLoginUrl").value.trim(),
    hostingProvider: document.getElementById("hostingProvider").value.trim(),
    hostingLoginUrl: document.getElementById("hostingLoginUrl").value.trim(),
    domainRenewalDate: document.getElementById("domainRenewalDate").value,
    hostingRenewalDate: document.getElementById("hostingRenewalDate").value,
    note: document.getElementById("websiteLoginNote").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetWebsiteLoginForm() {
  editingWebsiteLoginId = null;
  websiteLoginForm.reset();
}

function editWebsiteLogin(id) {
  const login = websiteLogins.find((item) => item.id === id);
  if (!login) return;
  editingWebsiteLoginId = id;
  document.getElementById("websiteName").value = login.websiteName || "";
  document.getElementById("websiteLoginUrl").value = login.websiteLoginUrl || "";
  document.getElementById("websiteUsername").value = login.username || "";
  document.getElementById("websitePassword").value = login.password || "";
  document.getElementById("domainSource").value = login.domainSource || "";
  document.getElementById("domainLoginUrl").value = login.domainLoginUrl || "";
  document.getElementById("hostingProvider").value = login.hostingProvider || "";
  document.getElementById("hostingLoginUrl").value = login.hostingLoginUrl || "";
  document.getElementById("domainRenewalDate").value = login.domainRenewalDate || "";
  document.getElementById("hostingRenewalDate").value = login.hostingRenewalDate || "";
  document.getElementById("websiteLoginNote").value = login.note || "";
  switchView("logins");
}

function deleteWebsiteLogin(id) {
  const login = websiteLogins.find((item) => item.id === id);
  if (!login) return;
  const confirmed = confirm(`Delete portal access for ${login.websiteName}?`);
  if (!confirmed) return;
  websiteLogins = websiteLogins.filter((item) => item.id !== id);
  deleteSupabaseRecord("websiteLogins", id);
  saveWebsiteLogins();
  renderWebsiteLogins();
  showToast("Website login deleted");
}

function normalizeOpenUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function openSavedLogin(url) {
  const safeUrl = normalizeOpenUrl(url);
  if (!safeUrl) {
    showToast("Add a login URL first");
    return;
  }
  window.open(safeUrl, "_blank", "noopener,noreferrer");
}

async function copyLoginField(id, field) {
  const login = websiteLogins.find((item) => item.id === id);
  const value = login?.[field] || "";
  if (!value) {
    showToast("Nothing to copy");
    return;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const input = document.createElement("textarea");
      input.value = value;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    showToast(field === "password" ? "Password copied" : "Username copied");
  } catch {
    showToast("Copy failed");
  }
}

function toggleWebsitePassword(id) {
  if (visibleWebsitePasswords.has(id)) {
    visibleWebsitePasswords.delete(id);
  } else {
    visibleWebsitePasswords.add(id);
  }
  renderWebsiteLogins();
}

function portalRenewalEvents() {
  return websiteLogins.flatMap((login) => {
    const websiteName = login.websiteName || "Website";
    const events = [];
    if (login.domainRenewalDate) {
      events.push({ date: addDays(login.domainRenewalDate, -20), kind: "reminder", type: "Domain", websiteName });
      events.push({ date: login.domainRenewalDate, kind: "expiry", type: "Domain", websiteName });
    }
    if (login.hostingRenewalDate) {
      events.push({ date: addDays(login.hostingRenewalDate, -20), kind: "reminder", type: "Hosting", websiteName });
      events.push({ date: login.hostingRenewalDate, kind: "expiry", type: "Hosting", websiteName });
    }
    return events;
  });
}

function portalCalendarTitle(monthValue) {
  return formatMonth(monthValue);
}

function preferredPortalCalendarMonth() {
  const events = portalRenewalEvents().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const upcoming = events.find((event) => event.date >= today());
  return String(upcoming?.date || events[0]?.date || today()).slice(0, 7);
}

function renderPortalCalendar() {
  const grid = document.getElementById("portalCalendarGrid");
  const list = document.getElementById("portalCalendarEvents");
  const label = document.getElementById("portalCalendarLabel");
  if (!grid || !list || !label) return;

  label.textContent = portalCalendarTitle(portalCalendarMonth);
  const [year, month] = portalCalendarMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEvents = portalRenewalEvents()
    .filter((event) => String(event.date || "").startsWith(portalCalendarMonth))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.kind.localeCompare(b.kind));
  const eventsByDate = monthEvents.reduce((map, event) => {
    if (!map.has(event.date)) map.set(event.date, []);
    map.get(event.date).push(event);
    return map;
  }, new Map());

  const blanks = Array.from({ length: firstDay.getDay() }, () => `<div class="portal-calendar-day is-empty"></div>`);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${portalCalendarMonth}-${String(day).padStart(2, "0")}`;
    const events = eventsByDate.get(date) || [];
    const classes = ["portal-calendar-day", date === today() ? "is-today" : "", events.length ? "has-event" : ""].filter(Boolean).join(" ");
    return `
      <div class="${classes}">
        <span>${day}</span>
        ${
          events.length
            ? `<div class="portal-calendar-dots">${events
                .slice(0, 3)
                .map((event) => `<i class="${event.kind}" title="${escapeAttribute(`${event.websiteName} ${event.type} ${event.kind}`)}"></i>`)
                .join("")}</div>`
            : ""
        }
      </div>
    `;
  });
  grid.innerHTML = [...blanks, ...days].join("");

  list.innerHTML = monthEvents.length
    ? monthEvents
        .map(
          (event) => `
            <div class="portal-calendar-event ${event.kind}">
              <span>${formatDate(event.date)}</span>
              <strong>${escapeHtml(event.kind === "reminder" ? "Reminder" : "Expiry")}</strong>
              <small>${escapeHtml(event.websiteName)} • ${escapeHtml(event.type)}</small>
            </div>
          `,
        )
        .join("")
    : `<div class="portal-calendar-empty">No domain or hosting renewals in this month.</div>`;
}

function shiftPortalCalendar(months) {
  portalCalendarPinned = true;
  portalCalendarMonth = addMonths(`${portalCalendarMonth}-01`, months).slice(0, 7);
  renderPortalCalendar();
}

function renderWebsiteLogins() {
  const query = websiteLoginSearchInput.value.trim().toLowerCase();
  const rows = websiteLogins.filter((login) =>
    `${login.websiteName} ${login.username} ${login.domainSource} ${login.hostingProvider}`.toLowerCase().includes(query),
  );
  document.getElementById("websiteLoginTable").innerHTML = rows.length
    ? rows
        .map(
          (login) => `
            <tr>
              <td>
                <strong>${escapeHtml(login.websiteName)}</strong>
                ${login.note ? `<p class="muted-cell">${escapeHtml(login.note)}</p>` : ""}
              </td>
              <td>
                <div class="credential-cell">
                  <span>${escapeHtml(login.username || "")}</span>
                  <button class="icon-action compact" title="Copy username" aria-label="Copy username" type="button" data-copy-login="${login.id}" data-copy-field="username">${iconCopy()}</button>
                </div>
              </td>
              <td>
                <div class="credential-cell">
                  <span>${login.password ? (visibleWebsitePasswords.has(login.id) ? escapeHtml(login.password) : "••••••••") : ""}</span>
                  <button class="icon-action compact" title="Show or hide password" aria-label="Show or hide password" type="button" data-toggle-password="${login.id}">${iconEye()}</button>
                  <button class="icon-action compact" title="Copy password" aria-label="Copy password" type="button" data-copy-login="${login.id}" data-copy-field="password">${iconCopy()}</button>
                </div>
              </td>
              <td>${escapeHtml(login.domainSource || "")}</td>
              <td>${escapeHtml(login.hostingProvider || "")}</td>
              <td>
                <span>Domain: ${formatDate(login.domainRenewalDate)}</span><br />
                <span>Hosting: ${formatDate(login.hostingRenewalDate)}</span>
              </td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action info" title="Open website login" aria-label="Open website login" type="button" data-open-url="${escapeAttribute(login.websiteLoginUrl || "")}">${iconExternal()}</button>
                  <button class="icon-action invoice" title="Open domain login" aria-label="Open domain login" type="button" data-open-url="${escapeAttribute(login.domainLoginUrl || "")}">${iconGlobe()}</button>
                  <button class="icon-action next" title="Open hosting login" aria-label="Open hosting login" type="button" data-open-url="${escapeAttribute(login.hostingLoginUrl || "")}">${iconServer()}</button>
                  <button class="icon-action edit" title="Edit login" aria-label="Edit login" type="button" data-login-edit="${login.id}">${iconEdit()}</button>
                  <button class="icon-action delete" title="Delete login" aria-label="Delete login" type="button" data-login-delete="${login.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : emptyRow("No website login details yet", 7);
  if (!portalCalendarPinned) portalCalendarMonth = preferredPortalCalendarMonth();
  renderPortalCalendar();
}

function renderProjects() {
  const query = projectSearchInput.value.trim().toLowerCase();
  const month = projectMonthFilter.value;
  const status = projectStatusFilter.value;
  updateProjectMonthFields();
  const monthProjects = projectsForMonth(month);
  const filtered = monthProjects.filter((project) => {
    const haystack = `${project.name} ${project.clientName || ""} ${project.note} ${project.worker}`.toLowerCase();
    const matchesStatus = status === "All" || project.paymentStatus === status;
    return matchesStatus && haystack.includes(query);
  });
  const activeMonthProjects = monthProjects.filter(isActiveProject);
  const activeFilteredProjects = filtered.filter(isActiveProject);
  const monthProjectValue = activeMonthProjects.reduce((sum, project) => sum + projectValueLkr(project), 0);
  const monthProjectProfit = activeMonthProjects.reduce((sum, project) => {
    return sum + projectForMe(project);
  }, 0);

  const totals = activeFilteredProjects.reduce(
    (sum, project) => {
      sum.valueLkr += projectValueLkr(project);
      sum.valueUsd += Number(project.valueUsd || 0);
      sum.advance += Number(project.advance || 0);
      sum.payForWork += Number(project.payForWork || 0);
      sum.paidForWork += Number(project.paidForWork || 0);
      sum.forMe += projectForMe(project);
      return sum;
    },
    { valueLkr: 0, valueUsd: 0, advance: 0, payForWork: 0, paidForWork: 0, forMe: 0 },
  );

  document.getElementById("projectTable").innerHTML = filtered.length
    ? filtered
        .map(
          (project, index) => `
            <tr>
              <td>${index + 1}</td>
              <td title="${escapeAttribute(project.clientName || project.name || "")}">${escapeHtml(project.clientName || project.name || "")}</td>
              <td title="${escapeAttribute(project.name)}">
                <strong class="project-name-text">${escapeHtml(project.name)}</strong>
                ${project.carriedFromMonth ? `<span class="muted-label">${project.carryReason === "monthly" ? "Monthly" : "Pending"} from ${escapeHtml(formatMonth(project.carriedFromMonth))}</span>` : ""}
              </td>
              <td>${projectMoneyInput(project, "valueLkr", "LKR")}</td>
              <td>${projectMoneyInput(project, "valueUsd", "USD")}</td>
              <td>${projectMoneyInput(project, "advance", "LKR")}</td>
              <td>${projectMoneyInput(project, "payForWork", "LKR")}</td>
              <td>${projectMoneyInput(project, "paidForWork", "LKR")}</td>
              <td>${projectStatusSelect(project)}</td>
              <td title="${escapeAttribute(project.worker)}">${escapeHtml(project.worker)}</td>
              <td>
                <div class="action-row icon-actions">
                  <button class="icon-action info" title="${escapeAttribute(project.note || "No note")}" aria-label="Project note" type="button">${iconInfo()}</button>
                  <button class="icon-action invoice" title="Create invoice" aria-label="Create invoice" type="button" data-project-invoice="${project.id}">${iconInvoice()}</button>
                  ${canMoveProjectToNextMonth(project) ? `<button class="icon-action next" title="Move to next month" aria-label="Move to next month" type="button" data-project-next="${project.id}">${iconNext()}</button>` : ""}
                  <button class="icon-action edit" title="Edit project" aria-label="Edit project" type="button" data-project-edit="${project.id}">${iconEdit()}</button>
                  <button class="icon-action delete" title="Delete project" aria-label="Delete project" type="button" data-project-delete="${project.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : emptyRow("No projects for this month", 11);

  document.getElementById("projectTotalLkr").textContent = compactMoney(totals.valueLkr, "LKR");
  document.getElementById("projectTotalUsd").textContent = compactMoney(totals.valueUsd, "USD");
  document.getElementById("projectTotalAdvance").textContent = compactMoney(totals.advance, "LKR");
  document.getElementById("projectTotalPayForWork").textContent = compactMoney(totals.payForWork, "LKR");
  document.getElementById("projectTotalPaidForWork").textContent = compactMoney(totals.paidForWork, "LKR");
  renderProjectSummary(monthProjectValue, monthProjectProfit, activeMonthProjects.length);
}

function getFinanceFormData() {
  const date = document.getElementById("financeDate").value;
  const month = String(date || "").slice(0, 7);
  const status = document.getElementById("financeStatus").value;
  return {
    id: createId(),
    type: document.getElementById("financeType").value,
    date,
    category: document.getElementById("financeCategory").value.trim(),
    amount: Number(document.getElementById("financeAmount").value || 0),
    repeat: document.getElementById("financeRepeat").value,
    status,
    paidMonths: status === "paid" && month ? [month] : [],
    note: document.getElementById("financeNote").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetFinanceForm() {
  financeForm.reset();
  document.getElementById("financeDate").value = today();
  document.getElementById("financeType").value = "income";
  document.getElementById("financeRepeat").value = "none";
  document.getElementById("financeStatus").value = "unpaid";
  if (!financeMonthFilter.value) financeMonthFilter.value = today().slice(0, 7);
}

function projectFinanceSummary(month) {
  return projectsForMonth(month)
    .filter((project) => isActiveProject(project) && !hasLinkedProjectFinanceRecord(project.id, month))
    .reduce(
      (summary, project) => {
        summary.income += projectForMe(project);
        summary.workDue += Number(project.payForWork || 0);
        return summary;
      },
      { income: 0, workDue: 0 },
    );
}

function hasLinkedProjectFinanceRecord(projectId, month) {
  return financeRecords.some((record) => {
    if (record.sourceId === `project-complete-${projectId}-${month}`) return true;
    return record.sourceId === `project-complete-${projectId}` && financeRecordMonth(record) === month;
  });
}

function financeRecordMonth(record) {
  return String(record.date || "").slice(0, 7);
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

function financeRecordDisplayDate(record, month) {
  if (record.repeat !== "monthly") return record.date;
  return `${month}-01`;
}

function financeRecordPaidAmount(record, month) {
  if (!financeRecordIsExpenseLike(record)) return 0;
  return financeRecordPaidInMonth(record, month) ? Number(record.amount || 0) : 0;
}

function financeStatusLabel(record, month) {
  if (!financeRecordIsExpenseLike(record)) return "Recorded";
  return financeRecordPaidInMonth(record, month) ? "Paid / done" : "Unpaid / pending";
}

function renderFinance() {
  const month = financeMonthFilter.value || today().slice(0, 7);
  if (!financeMonthFilter.value) financeMonthFilter.value = month;
  const projectSummary = projectFinanceSummary(month);
  const monthRecords = financeRecords.filter((record) => financeRecordAppliesToMonth(record, month));
  const typeFilter = financeTypeFilter.value;
  const categoryFilter = financeCategoryFilter.value;
  const otherIncome = monthRecords
    .filter((record) => record.type === "income")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const unpaidManualExpenses = monthRecords
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + financeRecordOutstandingAmount(record, month), 0);
  const savings = monthRecords
    .filter((record) => record.type === "saving")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const goldAssets = monthRecords
    .filter((record) => record.type === "gold")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const unpaidLoans = monthRecords
    .filter((record) => record.type === "loan")
    .reduce((sum, record) => sum + financeRecordOutstandingAmount(record, month), 0);
  const paidExpenses = monthRecords.reduce((sum, record) => sum + financeRecordPaidAmount(record, month), 0);
  const totalIncome = projectSummary.income + otherIncome;
  const balanceIncome = otherIncome;
  const unpaidExpenses = unpaidManualExpenses + unpaidLoans;
  const balance = balanceIncome - paidExpenses;
  const totalFlow = totalIncome + unpaidExpenses + savings + goldAssets;
  const incomePercent = totalFlow ? Math.round((totalIncome / totalFlow) * 100) : 0;
  const expensePercent = totalFlow ? Math.round((unpaidExpenses / totalFlow) * 100) : 0;
  const savingPercent = totalFlow ? Math.round((savings / totalFlow) * 100) : 0;

  document.getElementById("financeProjectIncome").textContent = compactMoney(projectSummary.income, "LKR");
  document.getElementById("financeOtherIncome").textContent = compactMoney(otherIncome, "LKR");
  document.getElementById("financeExpenses").textContent = compactMoney(unpaidExpenses, "LKR");
  document.getElementById("financeBalance").textContent = compactMoney(balance, "LKR");
  document.getElementById("financeSavings").textContent = compactMoney(savings, "LKR");
  document.getElementById("financeGoldAssets").textContent = compactMoney(goldAssets, "LKR");
  document.getElementById("financeIncomeBar").style.width = `${incomePercent}%`;
  document.getElementById("financeExpenseBar").style.width = `${expensePercent}%`;
  document.getElementById("financeSavingBar").style.width = `${savingPercent}%`;
  document.getElementById("financeGoldBar").style.width = `${Math.max(0, 100 - incomePercent - expensePercent - savingPercent)}%`;
  setFinanceBarTooltip("financeIncomeBar", "Income", totalIncome, incomePercent);
  setFinanceBarTooltip("financeExpenseBar", "Unpaid expenses", unpaidExpenses, expensePercent);
  setFinanceBarTooltip("financeSavingBar", "Savings", savings, savingPercent);
  setFinanceBarTooltip(
    "financeGoldBar",
    "Gold assets",
    goldAssets,
    Math.max(0, 100 - incomePercent - expensePercent - savingPercent),
  );

  const autoRows = [
    {
      date: `${month}-01`,
      type: "income",
      category: "Project profit",
      note: "Automatically calculated from Infonits project profit",
      amount: projectSummary.income,
      isAuto: true,
    },
  ].filter((record) => record.amount > 0);

  const rows = [...autoRows, ...monthRecords]
    .filter((record) => typeFilter === "All" || record.type === typeFilter)
    .filter((record) => categoryFilter === "All" || record.category === categoryFilter)
    .sort((a, b) => String(financeRecordDisplayDate(b, month)).localeCompare(String(financeRecordDisplayDate(a, month))));
  const totalPages = Math.max(1, Math.ceil(rows.length / FINANCE_PAGE_SIZE));
  financePage = Math.min(financePage, totalPages);
  const visibleRows = rows.slice((financePage - 1) * FINANCE_PAGE_SIZE, financePage * FINANCE_PAGE_SIZE);
  document.getElementById("financeTable").innerHTML = visibleRows.length
    ? visibleRows
        .map(
          (record) => `
            <tr>
              <td>${formatDate(financeRecordDisplayDate(record, month))}</td>
              <td><span class="finance-type ${record.type}">${financeTypeLabel(record.type)}</span></td>
              <td>${escapeHtml(record.category)}</td>
              <td>${escapeHtml([record.note, record.repeat === "monthly" ? "Monthly" : ""].filter(Boolean).join(" | "))}</td>
              <td>${compactMoney(record.amount, "LKR")}</td>
              <td><span class="finance-status ${financeRecordPaidInMonth(record, month) ? "paid" : "unpaid"}">${financeStatusLabel(record, month)}</span></td>
              <td>
                ${
                  record.isAuto
                    ? `<span class="muted-label">Auto</span>`
                    : `<div class="action-row">
                        ${
                          financeRecordIsExpenseLike(record)
                            ? `<button class="secondary-action" type="button" data-finance-toggle-paid="${record.id}" data-finance-paid-month="${month}">${financeRecordPaidInMonth(record, month) ? "Mark unpaid" : "Mark paid"}</button>`
                            : ""
                        }
                        <button class="danger-action" type="button" data-finance-delete="${record.id}">Delete</button>
                      </div>`
                }
              </td>
            </tr>
          `,
        )
        .join("")
    : emptyRow("No finance records for this month", 7);
  document.getElementById("financePageLabel").textContent = `Page ${financePage} of ${totalPages}`;
  document.getElementById("financePrevPage").disabled = financePage <= 1;
  document.getElementById("financeNextPage").disabled = financePage >= totalPages;
}

function setFinanceBarTooltip(id, label, amount, percent) {
  const element = document.getElementById(id);
  element.dataset.monitorLabel = `${label}: ${compactMoney(amount, "LKR")} (${formatPercent(percent)})`;
  element.title = element.dataset.monitorLabel;
}

function deleteFinanceRecord(id) {
  const record = financeRecords.find((item) => item.id === id);
  if (!record) return;
  const confirmed = confirm(`Delete finance record "${record.category}" for ${compactMoney(record.amount, "LKR")}?`);
  if (!confirmed) return;
  financeRecords = financeRecords.filter((record) => record.id !== id);
  deleteSupabaseRecord("financeRecords", id);
  saveFinanceRecords();
  renderFinance();
  showToast("Finance record deleted");
}

function toggleFinancePaid(id, month) {
  financeRecords = financeRecords.map((record) => {
    if (record.id !== id) return record;
    const paidMonths = Array.isArray(record.paidMonths) ? [...record.paidMonths] : [];
    const paid = paidMonths.includes(month) || (record.repeat !== "monthly" && record.status === "paid");
    const nextPaidMonths = paid ? paidMonths.filter((paidMonth) => paidMonth !== month) : [...new Set([...paidMonths, month])];
    return {
      ...record,
      status: paid ? "unpaid" : "paid",
      paidMonths: nextPaidMonths,
      updatedAt: new Date().toISOString(),
    };
  });
  saveFinanceRecords();
  renderFinance();
  showToast("Finance status updated");
}

function financeTypeLabel(type) {
  const labels = {
    income: "Income",
    expense: "Expense",
    saving: "Saving",
    gold: "Gold",
    loan: "Loan",
  };
  return labels[type] || "Record";
}

function financeSummaryForMonth(month) {
  const projectSummary = projectFinanceSummary(month);
  const monthRecords = financeRecords.filter((record) => financeRecordAppliesToMonth(record, month));
  const sumType = (type) =>
    monthRecords.filter((record) => record.type === type).reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const otherIncome = sumType("income");
  const unpaidExpenses = monthRecords.reduce((sum, record) => sum + financeRecordOutstandingAmount(record, month), 0);
  const paidExpenses = monthRecords.reduce((sum, record) => sum + financeRecordPaidAmount(record, month), 0);
  const savings = sumType("saving");
  const gold = sumType("gold");
  const income = otherIncome;
  return {
    projectProfit: projectSummary.income,
    otherIncome,
    income,
    expenses: unpaidExpenses,
    paidExpenses,
    savings,
    gold,
    balance: otherIncome - paidExpenses,
  };
}

function projectExportRows(month) {
  return projectsForMonth(month)
    .sort((a, b) => `${a.clientName || a.name}${a.name}`.localeCompare(`${b.clientName || b.name}${b.name}`))
    .map((project, index) => ({
      no: index + 1,
      client: project.clientName || project.name || "",
      project: project.name || "",
      source: project.carriedFromMonth
        ? project.carryReason === "monthly"
          ? `Monthly from ${formatMonth(project.carriedFromMonth)}`
          : `Pending from ${formatMonth(project.carriedFromMonth)}`
        : "Current month",
      valueLkr: projectValueLkr(project),
      valueUsd: Number(project.valueUsd || 0),
      advance: Number(project.advance || 0),
      payForWork: Number(project.payForWork || 0),
      paidForWork: Number(project.paidForWork || 0),
      profit: projectForMe(project),
      status: project.paymentStatus || "Waiting",
      worker: project.worker || "",
      note: project.note || "",
    }));
}

function managerProjectsForMonth(month) {
  const unique = new Map();
  projectsForMonth(month)
    .filter(isManagerProject)
    .forEach((project) => {
      const key = projectRecurringKey(project);
      if (!unique.has(key)) unique.set(key, project);
    });
  return [...unique.values()];
}

function managerMonthlyReportData(month = managerMonth()) {
  const reportProjects = managerProjectsForMonth(month).filter(isActiveProject);
  const groupedPosts = groupedSocialPosts(socialMediaPosts.filter((post) => postMonth(post) === month));
  const clientMap = new Map();
  reportProjects.forEach((project) => {
    const clientName = project.clientName || project.name || "Client";
    if (!clientMap.has(clientName)) {
      clientMap.set(clientName, { clientName, projects: [], required: 0, posted: 0, remaining: 0 });
    }
    const row = clientMap.get(clientName);
    row.projects.push(project.name || "Project");
    row.required += PM_MONTHLY_POST_TARGET;
  });
  groupedPosts.forEach((group) => {
    const clientName = group.clientName || "Client";
    if (!clientMap.has(clientName)) {
      clientMap.set(clientName, { clientName, projects: [], required: PM_MONTHLY_POST_TARGET, posted: 0, remaining: 0 });
    }
    const row = clientMap.get(clientName);
    row.posted += group.count;
    if (group.projectName && !row.projects.includes(group.projectName)) row.projects.push(group.projectName);
  });
  const clientRows = [...clientMap.values()]
    .map((client) => ({ ...client, remaining: Math.max(0, client.required - client.posted) }))
    .sort((a, b) => a.clientName.localeCompare(b.clientName));
  const postRows = groupedPosts
    .map((group) => ({
      date: group.date,
      clientName: group.clientName || "",
      projectName: group.projectName || "",
      count: group.count,
      platforms: group.posts.map((post) => post.platform).filter(Boolean).join(" | "),
      links: group.posts.map((post) => [post.platform, post.link].filter(Boolean).join(": ")).filter(Boolean).join(" | "),
      note: group.remarks || "",
    }))
    .sort((a, b) => `${a.clientName}${a.date}`.localeCompare(`${b.clientName}${b.date}`));
  const summary = {
    clients: clientRows.length,
    projects: reportProjects.length,
    required: clientRows.reduce((sum, row) => sum + row.required, 0),
    posted: clientRows.reduce((sum, row) => sum + row.posted, 0),
    remaining: clientRows.reduce((sum, row) => sum + row.remaining, 0),
  };
  return { summary, clientRows, postRows };
}

function postedRecordExportRows() {
  return filteredSocialPostGroups().map((group) => ({
    date: group.date,
    clientName: group.clientName || "",
    projectName: group.projectName || "",
    count: group.count,
    platforms: group.posts.map((post) => post.platform).filter(Boolean).join(" | "),
    links: group.posts.map((post) => [post.platform, post.link].filter(Boolean).join(": ")).filter(Boolean).join(" | "),
    note: group.remarks || "",
  }));
}

function postedRecordExportName() {
  const client = fieldValue("pmPostClientFilter");
  return client ? safeFilename(client) : "all-clients";
}

function downloadPostedRecordsCsv() {
  const month = managerMonth();
  const rows = postedRecordExportRows();
  if (!rows.length) {
    showToast("No posted records to export");
    return;
  }
  const lines = [
    ["Client monthly post details"],
    ["Month", formatMonth(month)],
    ["Client", fieldValue("pmPostClientFilter") || "All clients"],
    ["Generated", formatDate(today())],
    [],
    ["Date", "Client", "Project", "Post count", "Platforms", "Post links", "Remarks"],
    ...rows.map((row) => [row.date, row.clientName, row.projectName, row.count, row.platforms, row.links, row.note]),
  ].map((line) => line.map(escapeCsv).join(","));
  saveBlob(`\uFEFF${lines.join("\n")}`, `infonits-posts-${postedRecordExportName()}-${month}.csv`, "text/csv;charset=utf-8");
  showToast("Posted records CSV downloaded");
}

function downloadPostedRecordsPdf() {
  const month = managerMonth();
  const rows = postedRecordExportRows();
  if (!rows.length) {
    showToast("No posted records to export");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = Math.max(900, 260 + rows.length * 54);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1d2e63";
  ctx.fillRect(0, 0, canvas.width, 126);
  ctx.fillStyle = "#ff6b2c";
  ctx.fillRect(0, 126, canvas.width, 7);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 34px Poppins, Arial, sans-serif";
  ctx.fillText("Client Monthly Post Details", 60, 72);
  ctx.font = "400 18px Poppins, Arial, sans-serif";
  ctx.fillText(`${fieldValue("pmPostClientFilter") || "All clients"} | ${formatMonth(month)} | Generated ${formatDate(today())}`, 60, 104);

  const columns = [
    ["Date", 60, 130],
    ["Client", 200, 170],
    ["Project", 380, 230],
    ["Count", 625, 80],
    ["Platforms", 720, 150],
    ["Remarks", 890, 285],
  ];
  let y = 185;
  ctx.fillStyle = "#eef2f7";
  ctx.fillRect(50, y - 30, 1140, 44);
  ctx.fillStyle = "#172033";
  ctx.font = "600 17px Poppins, Arial, sans-serif";
  columns.forEach(([label, x, width]) => drawFitText(ctx, label, x, y, width));
  y += 44;
  ctx.font = "500 16px Poppins, Arial, sans-serif";
  rows.forEach((row, index) => {
    ctx.fillStyle = index % 2 === 0 ? "#ffffff" : "#f8fafc";
    ctx.fillRect(50, y - 28, 1140, 42);
    ctx.fillStyle = "#334155";
    const values = [formatShortDate(row.date), row.clientName, row.projectName, row.count, row.platforms, row.note];
    columns.forEach(([, x, width], columnIndex) => drawFitText(ctx, values[columnIndex], x, y, width));
    y += 54;
  });
  const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  ctx.fillStyle = "#1d2e63";
  ctx.fillRect(50, y - 26, 1140, 44);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 17px Poppins, Arial, sans-serif";
  drawFitText(ctx, "Total posts", 60, y, 160);
  drawFitText(ctx, formatNumber(total), 625, y, 80);
  const pdf = buildImagePdf(canvas.toDataURL("image/jpeg", 0.98), canvas.width, canvas.height);
  saveBlob(pdf, `infonits-posts-${postedRecordExportName()}-${month}.pdf`, "application/pdf");
  showToast("Posted records PDF downloaded");
}

function downloadManagerMonthlyReport() {
  const month = managerMonth();
  const { summary, clientRows, postRows } = managerMonthlyReportData(month);
  if (!clientRows.length && !postRows.length) {
    showToast("No manager report data for this month");
    return;
  }
  const sections = [
    ["Infonits Manager Handle Monthly Report"],
    ["Month", formatMonth(month)],
    ["Generated", formatDate(today())],
    [],
    ["Overall Summary"],
    ["Clients", "Active projects", "Required posts", "Posted posts", "Remaining posts"],
    [summary.clients, summary.projects, summary.required, summary.posted, summary.remaining],
    [],
    ["Client Summary"],
    ["Client", "Projects", "Required posts", "Posted posts", "Remaining posts"],
    ...clientRows.map((row) => [row.clientName, row.projects.join(" | "), row.required, row.posted, row.remaining]),
    [],
    ["Posted Details"],
    ["Date", "Client", "Project", "Post count", "Platforms", "Post links", "Note"],
    ...postRows.map((row) => [row.date, row.clientName, row.projectName, row.count, row.platforms, row.links, row.note]),
  ];
  const csv = sections.map((line) => line.map(escapeCsv).join(",")).join("\n");
  saveBlob(`\uFEFF${csv}`, `infonits-manager-report-${month}.csv`, "text/csv;charset=utf-8");
  showToast("Manager CSV report downloaded");
}

function downloadManagerMonthlyPdfReport() {
  const month = managerMonth();
  const { summary, clientRows, postRows } = managerMonthlyReportData(month);
  if (!clientRows.length && !postRows.length) {
    showToast("No manager report data for this month");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = Math.max(1754, 520 + clientRows.length * 58 + postRows.length * 68);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1d2e63";
  ctx.fillRect(0, 0, canvas.width, 150);
  ctx.fillStyle = "#ff6b2c";
  ctx.fillRect(0, 150, canvas.width, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 36px Poppins, Arial, sans-serif";
  ctx.fillText("Manager Handle Monthly Report", 70, 82);
  ctx.font = "400 20px Poppins, Arial, sans-serif";
  ctx.fillText(`${formatMonth(month)} | Generated ${formatDate(today())}`, 70, 118);

  let y = 220;
  ctx.fillStyle = "#172033";
  ctx.font = "600 24px Poppins, Arial, sans-serif";
  ctx.fillText("Overall Summary", 70, y);
  y += 34;
  const summaryCards = [
    ["Clients", summary.clients],
    ["Projects", summary.projects],
    ["Required", summary.required],
    ["Posted", summary.posted],
    ["Remaining", summary.remaining],
  ];
  summaryCards.forEach(([label, value], index) => {
    const x = 70 + index * 220;
    ctx.fillStyle = "#f5f8fc";
    ctx.fillRect(x, y, 195, 76);
    ctx.fillStyle = "#64748b";
    ctx.font = "500 16px Poppins, Arial, sans-serif";
    ctx.fillText(label, x + 16, y + 28);
    ctx.fillStyle = "#1d2e63";
    ctx.font = "600 26px Poppins, Arial, sans-serif";
    ctx.fillText(String(value), x + 16, y + 58);
  });
  y += 130;

  ctx.fillStyle = "#172033";
  ctx.font = "600 24px Poppins, Arial, sans-serif";
  ctx.fillText("Client Summary", 70, y);
  y += 36;
  const clientColumns = [
    ["Client", 70, 280],
    ["Projects", 360, 420],
    ["Required", 800, 100],
    ["Posted", 920, 100],
    ["Remaining", 1040, 120],
  ];
  drawReportHeader(ctx, clientColumns, y);
  y += 42;
  ctx.font = "500 16px Poppins, Arial, sans-serif";
  clientRows.forEach((row, index) => {
    drawReportRowBg(ctx, y, index);
    drawFitText(ctx, row.clientName, 80, y, 260);
    drawFitText(ctx, row.projects.join(" | "), 370, y, 400);
    drawFitText(ctx, row.required, 815, y, 80);
    drawFitText(ctx, row.posted, 935, y, 80);
    drawFitText(ctx, row.remaining, 1060, y, 90);
    y += 42;
  });
  y += 40;

  ctx.fillStyle = "#172033";
  ctx.font = "600 24px Poppins, Arial, sans-serif";
  ctx.fillText("Posted Details", 70, y);
  y += 36;
  const postColumns = [
    ["Date", 70, 120],
    ["Client", 200, 210],
    ["Project", 425, 240],
    ["Count", 680, 70],
    ["Platforms", 760, 150],
    ["Links", 925, 240],
  ];
  drawReportHeader(ctx, postColumns, y);
  y += 42;
  ctx.font = "500 15px Poppins, Arial, sans-serif";
  postRows.forEach((row, index) => {
    drawReportRowBg(ctx, y, index);
    drawFitText(ctx, formatDate(row.date), 80, y, 105);
    drawFitText(ctx, row.clientName, 210, y, 195);
    drawFitText(ctx, row.projectName, 435, y, 225);
    drawFitText(ctx, row.count, 700, y, 50);
    drawFitText(ctx, row.platforms, 770, y, 140);
    drawFitText(ctx, row.links || "-", 935, y, 220);
    y += 48;
  });
  const pdf = buildImagePdf(canvas.toDataURL("image/jpeg", 0.98), canvas.width, canvas.height);
  saveBlob(pdf, `infonits-manager-report-${month}.pdf`, "application/pdf");
  showToast("Manager PDF report downloaded");
}

function drawReportHeader(ctx, columns, y) {
  ctx.fillStyle = "#eef2f7";
  ctx.fillRect(60, y - 28, 1120, 42);
  ctx.fillStyle = "#172033";
  ctx.font = "600 16px Poppins, Arial, sans-serif";
  columns.forEach(([label, x, width]) => drawFitText(ctx, label, x, y, width));
}

function drawReportRowBg(ctx, y, index) {
  ctx.fillStyle = index % 2 === 0 ? "#ffffff" : "#f8fafc";
  ctx.fillRect(60, y - 26, 1120, 40);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadProjectSheet() {
  const month = projectMonthFilter.value || today().slice(0, 7);
  const rows = projectExportRows(month);
  if (!rows.length) {
    showToast("No projects to export");
    return;
  }
  const headers = [
    "No",
    "Client name",
    "Project details",
    "Source",
    "Total value LKR",
    "Total value USD",
    "Advance received",
    "Pay for work",
    "Paid for work",
    "Infonits profit",
    "Status",
    "Who worked",
    "Note",
  ];
  const lines = [
    headers,
    ...rows.map((row) => [
      row.no,
      row.client,
      row.project,
      row.source,
      row.valueLkr,
      row.valueUsd,
      row.advance,
      row.payForWork,
      row.paidForWork,
      row.profit,
      row.status,
      row.worker,
      row.note,
    ]),
  ].map((line) => line.map(escapeCsv).join(","));
  saveBlob(`\uFEFF${lines.join("\n")}`, `infonits-projects-${month}.csv`, "text/csv;charset=utf-8");
  showToast("Project sheet downloaded");
}

function drawFitText(ctx, text, x, y, maxWidth) {
  const value = String(text || "");
  if (ctx.measureText(value).width <= maxWidth) {
    ctx.fillText(value, x, y);
    return;
  }
  let clipped = value;
  while (clipped.length > 1 && ctx.measureText(`${clipped}...`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  ctx.fillText(`${clipped}...`, x, y);
}

function downloadProjectPdf() {
  const month = projectMonthFilter.value || today().slice(0, 7);
  const rows = projectExportRows(month);
  if (!rows.length) {
    showToast("No projects to export");
    return;
  }
  const totals = rows.reduce(
    (sum, row) => {
      sum.valueLkr += row.valueLkr;
      sum.valueUsd += row.valueUsd;
      sum.advance += row.advance;
      sum.payForWork += row.payForWork;
      sum.paidForWork += row.paidForWork;
      sum.profit += row.profit;
      return sum;
    },
    { valueLkr: 0, valueUsd: 0, advance: 0, payForWork: 0, paidForWork: 0, profit: 0 },
  );
  const canvas = document.createElement("canvas");
  canvas.width = 1754;
  canvas.height = Math.max(1240, 260 + rows.length * 42 + 90);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1d2e63";
  ctx.fillRect(0, 0, canvas.width, 130);
  ctx.fillStyle = "#ff6b2c";
  ctx.fillRect(0, 130, canvas.width, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 38px Poppins, Arial, sans-serif";
  ctx.fillText(`Monthly Project Details - ${formatMonth(month)}`, 60, 76);
  ctx.font = "400 20px Poppins, Arial, sans-serif";
  ctx.fillText(`Generated ${formatDate(today())}`, 60, 108);

  const columns = [
    ["No", 60, 50],
    ["Client", 120, 220],
    ["Project", 350, 250],
    ["Source", 620, 170],
    ["LKR", 810, 150],
    ["USD", 980, 110],
    ["Advance", 1110, 140],
    ["Work Pay", 1260, 140],
    ["Profit", 1410, 140],
    ["Status", 1560, 120],
  ];
  let y = 195;
  ctx.fillStyle = "#eef2f7";
  ctx.fillRect(50, y - 32, 1650, 46);
  ctx.fillStyle = "#172033";
  ctx.font = "600 18px Poppins, Arial, sans-serif";
  columns.forEach(([label, x, width]) => drawFitText(ctx, label, x, y, width));
  y += 44;
  ctx.font = "500 17px Poppins, Arial, sans-serif";
  rows.forEach((row, index) => {
    ctx.fillStyle = index % 2 === 0 ? "#ffffff" : "#f8fafc";
    ctx.fillRect(50, y - 28, 1650, 40);
    ctx.fillStyle = "#334155";
    const values = [
      row.no,
      row.client,
      row.project,
      row.source,
      compactMoney(row.valueLkr, "LKR"),
      compactMoney(row.valueUsd, "USD"),
      compactMoney(row.advance, "LKR"),
      compactMoney(row.payForWork, "LKR"),
      compactMoney(row.profit, "LKR"),
      row.status,
    ];
    columns.forEach(([, x, width], columnIndex) => drawFitText(ctx, values[columnIndex], x, y, width));
    y += 42;
  });
  y += 20;
  ctx.fillStyle = "#1d2e63";
  ctx.fillRect(50, y - 30, 1650, 48);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 18px Poppins, Arial, sans-serif";
  drawFitText(ctx, "Totals", 60, y, 120);
  drawFitText(ctx, compactMoney(totals.valueLkr, "LKR"), 810, y, 150);
  drawFitText(ctx, compactMoney(totals.valueUsd, "USD"), 980, y, 110);
  drawFitText(ctx, compactMoney(totals.advance, "LKR"), 1110, y, 140);
  drawFitText(ctx, compactMoney(totals.payForWork, "LKR"), 1260, y, 140);
  drawFitText(ctx, compactMoney(totals.profit, "LKR"), 1410, y, 140);
  const pdf = buildImagePdf(canvas.toDataURL("image/jpeg", 0.98), canvas.width, canvas.height);
  saveBlob(pdf, `infonits-projects-${month}.pdf`, "application/pdf");
  showToast("Project PDF downloaded");
}

function downloadFinanceReport() {
  const month = financeMonthFilter.value || today().slice(0, 7);
  const summary = financeSummaryForMonth(month);
  const rows = [
    ["Project profit", summary.projectProfit],
    ["Income", summary.otherIncome],
    ["Unpaid expenses", summary.expenses],
    ["Paid / done expenses", summary.paidExpenses],
    ["Balance (income - paid expenses)", summary.balance],
    ["Savings", summary.savings],
    ["Gold assets", summary.gold],
  ];
  const pdf = buildSimpleReportPdf(`Finance Report ${formatMonth(month)}`, rows, `Generated ${formatDate(today())}`);
  saveBlob(pdf, `finance-report-${month}.pdf`, "application/pdf");
  showToast("Finance report downloaded");
}

function downloadClientStatement() {
  const clientName = statementClientSelect.value;
  if (!clientName) {
    showToast("Select a client first");
    return;
  }
  const clientInvoices = invoices.filter((invoice) => invoice.customerName === clientName);
  const clientProjects = projects.filter((project) => (project.clientName || project.name) === clientName);
  const rows = [
    ...clientInvoices.map((invoice) => [
      `${invoice.documentType || "Invoice"} ${invoice.invoiceNumber}`,
      invoiceTotalInLkr(invoice),
    ]),
    ...clientProjects.map((project) => [`Project ${project.name}`, projectValueLkr(project)]),
  ];
  if (!rows.length) {
    showToast("No client records found");
    return;
  }
  const pdf = buildSimpleReportPdf(`Client Statement - ${clientName}`, rows, `Invoices, quotations, and projects`);
  saveBlob(pdf, `client-statement-${clientName.replaceAll(" ", "-")}.pdf`, "application/pdf");
  showToast("Client statement downloaded");
}

function buildSimpleReportPdf(title, rows, subtitle) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = Math.max(1754, 360 + rows.length * 58);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1d2e63";
  ctx.fillRect(0, 0, canvas.width, 150);
  ctx.fillStyle = "#ff6b2c";
  ctx.fillRect(0, 150, canvas.width, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 40px Poppins, Arial, sans-serif";
  ctx.fillText(title, 80, 92);
  ctx.font = "400 22px Poppins, Arial, sans-serif";
  ctx.fillText(subtitle, 80, 124);
  ctx.fillStyle = "#172033";
  ctx.font = "600 26px Poppins, Arial, sans-serif";
  ctx.fillText("Description", 80, 240);
  ctx.fillText("Amount", 1060, 240);
  ctx.strokeStyle = "#dbe3ec";
  ctx.beginPath();
  ctx.moveTo(80, 260);
  ctx.lineTo(1160, 260);
  ctx.stroke();
  let y = 320;
  rows.forEach(([label, amount]) => {
    ctx.fillStyle = "#334155";
    ctx.font = "500 24px Poppins, Arial, sans-serif";
    ctx.fillText(String(label), 80, y);
    ctx.textAlign = "right";
    ctx.fillText(compactMoney(amount, "LKR"), 1160, y);
    ctx.textAlign = "left";
    y += 58;
  });
  return buildImagePdf(canvas.toDataURL("image/jpeg", 0.98), canvas.width, canvas.height);
}

function renderProjectSummary(projectValue, profit, projectCount) {
  document.getElementById("projectTotalValueSummary").textContent = compactMoney(projectValue, "LKR");
  document.getElementById("projectProfitSummary").textContent = compactMoney(profit, "LKR");
}

function projectMoneyInput(project, field, currency) {
  const value = field === "valueLkr" ? projectValueLkr(project) : Number(project[field] || 0);
  return `
    <label class="table-money-field">
      <span>${currency === "USD" ? "$" : "Rs."}</span>
      <input
        data-project-money="${project.id}"
        data-project-money-field="${field}"
        inputmode="decimal"
        type="text"
        value="${value ? formatNumber(value) : ""}"
      />
    </label>
  `;
}

function projectStatusSelect(project) {
  const status = project.paymentStatus || "Waiting";
  const options = ["Waiting", "Partial", "Paid", "Completed"];
  return `
    <select
      class="project-status-select ${escapeAttribute(status)}"
      data-project-status="${project.id}"
      title="${escapeAttribute(status)}"
      aria-label="Project status: ${escapeAttribute(status)}"
    >
      ${options
        .map((option) => `<option value="${option}" ${option === status ? "selected" : ""}>${statusIcon(option)} ${option}</option>`)
        .join("")}
    </select>
  `;
}

function statusIcon(status) {
  if (status === "Paid") return "OK";
  if (status === "Completed") return "✓";
  if (status === "Partial") return "½";
  return "!";
}

function svgIcon(path) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
}

function iconInvoice() {
  return svgIcon("M7 3h7l4 4v14H7V3Zm7 1v4h4M9 12h6M9 16h6M9 8h3");
}

function iconInfo() {
  return svgIcon("M12 17v-6M12 7h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z");
}

function iconView() {
  return svgIcon("M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z");
}

function iconExternal() {
  return svgIcon("M14 4h6v6M20 4 10 14M20 14v6H4V4h6");
}

function iconGlobe() {
  return svgIcon("M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20");
}

function iconServer() {
  return svgIcon("M4 4h16v6H4V4Zm0 10h16v6H4v-6Zm4-7h.01M8 17h.01");
}

function iconCopy() {
  return svgIcon("M8 8h10v12H8V8Zm-4 8V4h10");
}

function iconEye() {
  return svgIcon("M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z");
}

function iconPaid() {
  return svgIcon("M20 6 9 17l-5-5");
}

function iconConvert() {
  return svgIcon("M7 7h9l-3-3M17 17H8l3 3M6 17a7 7 0 0 1 0-10M18 7a7 7 0 0 1 0 10");
}

function iconNext() {
  return svgIcon("M5 12h12M13 6l6 6-6 6");
}

function iconEdit() {
  return svgIcon("M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4");
}

function iconDelete() {
  return svgIcon("M6 7h12M9 7V5h6v2M8 7l1 13h6l1-13");
}

function renderPreview() {
  const invoice = invoices.find((item) => item.id === selectedInvoiceId) || invoices[0];
  const preview = document.getElementById("invoicePreview");

  if (!invoice) {
    preview.innerHTML = `<div class="empty">Create an invoice to see a clean printable preview here.</div>`;
    return;
  }

  selectedInvoiceId = invoice.id;
  const totals = calculateTotals(invoice);
  const currency = invoiceCurrency(invoice);
  const documentType = invoice.documentType || "Invoice";
  const documentTitle = documentType.toUpperCase();
  const showQuantityPricing = hasQuantityPricing(invoice);
  const logo = settings.logoDataUrl
    ? `<img class="invoice-logo-image" src="${escapeAttribute(settings.logoDataUrl)}" alt="${escapeAttribute(settings.businessName)} logo" />`
    : `<div class="infonits-logo"><span class="logo-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><strong>${escapeHtml(settings.businessName || "infonits")}</strong></div>`;
  preview.innerHTML = `
    <div class="invoice-header">
      ${logo}
      <h2>${documentTitle}</h2>
    </div>

    <div class="invoice-orange-line"></div>

    <div class="invoice-body">
      <div class="invoice-intro">
        <div class="company-block">
          <h3>${escapeHtml(settings.businessName || "infonits")} Pvt Ltd.</h3>
          <p>${escapeHtml(settings.businessAddress)}</p>
          <p>${escapeHtml(formatPhone(settings.businessPhone))} | ${escapeHtml(settings.businessEmail)} | ${escapeHtml(settings.businessWebsite)}</p>
        </div>

        <div class="details-card">
          <h3>${documentTitle} DETAILS</h3>
          <dl>
            <div><dt>${documentType} No.:</dt><dd>#${escapeHtml(invoice.invoiceNumber)}</dd></div>
            <div><dt>Date:</dt><dd>${formatDate(invoice.invoiceDate)}</dd></div>
            <div><dt>Due Date:</dt><dd>${formatDate(invoice.dueDate)}</dd></div>
            <div><dt>Status:</dt><dd>${escapeHtml(invoice.status)}</dd></div>
          </dl>
        </div>
      </div>

      <div class="bill-to-block">
        <span>${documentType === "Quotation" ? "PREPARED FOR" : "BILLED TO"}</span>
        <strong>${escapeHtml(invoice.customerName)}</strong>
        <p>${escapeHtml(invoice.customerEmail)}</p>
        <p>${escapeHtml([invoice.customerAddress, invoice.customerCountry].filter(Boolean).join(" | "))}</p>
      </div>

      <table class="customer-table">
        <thead>
          <tr>
            <th>Description</th>
            ${showQuantityPricing ? "<th>Qty</th><th>Unit Price</th>" : ""}
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items
            .map(
              (item) => {
                const directAmount = isDirectAmountItem(item);
                return `
                <tr>
                  <td>
                    <strong class="item-title-preview">${escapeHtml(item.title || item.description)}</strong>
                    ${item.title && item.description ? `<p class="item-description-preview">${escapeHtml(item.description)}</p>` : ""}
                  </td>
                  ${showQuantityPricing ? `<td>${directAmount ? "" : formatNumber(item.quantity)}</td><td>${directAmount ? "" : money(item.price, currency)}</td>` : ""}
                  <td>${money(lineItemAmount(item), currency)}</td>
                </tr>
              `;
              },
            )
            .join("")}
        </tbody>
      </table>

      <div class="invoice-lower">
        <div>
          ${
            settings.showPaymentDetails !== "no"
              ? `<div class="payment-card">
                  <h3>PAYMENT DETAILS</h3>
                  <p>Bank: ${escapeHtml(settings.bankName)}</p>
                  <p>Account Name: ${escapeHtml(settings.accountName)}</p>
                  <p>Account No.: ${escapeHtml(settings.accountNumber || "Add account number in settings")} | Branch: ${escapeHtml(settings.bankBranch)}</p>
                  ${invoice.paymentMethod ? `<p>Method: ${escapeHtml(invoice.paymentMethod)}</p>` : ""}
                  <p>Reference: ${escapeHtml(documentType)} #${escapeHtml(invoice.invoiceNumber)}</p>
                </div>`
              : ""
          }

          <div class="invoice-notes">
            <h3>Notes</h3>
            <p>${escapeHtml(invoice.notes || "Payment is due within 15 days of the invoice date.")}</p>
            ${invoice.terms ? `<h3>Terms</h3><p>${escapeHtml(invoice.terms)}</p>` : ""}
            ${invoice.authorizedBy ? `<p><strong>Authorized by:</strong> ${escapeHtml(invoice.authorizedBy)}</p>` : ""}
            <p>For questions, contact: ${escapeHtml(settings.businessEmail)}${settings.contactPhone ? ` | ${escapeHtml(formatPhone(settings.contactPhone))}` : ""}</p>
          </div>
        </div>

        <div class="customer-total">
          <div><span>Subtotal</span><strong>${money(totals.subtotal, currency)}</strong></div>
          <div><span>Tax (${formatPercent(invoice.taxRate)})</span><strong>${money(totals.tax, currency)}</strong></div>
          <div><span>Discount</span><strong>${money(totals.discount, currency)}</strong></div>
          <div><span>Advance paid</span><strong>${money(totals.advancePaid, currency)}</strong></div>
          <div class="grand-pill"><span>GRAND TOTAL</span><strong>${money(totals.total, currency)}</strong></div>
        </div>
      </div>
    </div>

    <div class="invoice-orange-line"></div>
    <div class="invoice-footer">
      <strong>Thank You for Your Business with Us!</strong>
      <span>${escapeHtml(settings.businessWebsite)} | ${escapeHtml(settings.businessEmail)}${settings.contactPhone ? ` | ${escapeHtml(formatPhone(settings.contactPhone))}` : ""}</span>
    </div>
  `;
}

function renderSettings() {
  document.getElementById("businessName").value = settings.businessName;
  document.getElementById("businessEmail").value = settings.businessEmail;
  document.getElementById("businessPhone").value = settings.businessPhone;
  document.getElementById("businessAddress").value = settings.businessAddress;
  document.getElementById("businessWebsite").value = settings.businessWebsite;
  document.getElementById("currencyLabel").value = settings.currencyLabel;
  document.getElementById("bankName").value = settings.bankName;
  document.getElementById("accountName").value = settings.accountName;
  document.getElementById("accountNumber").value = settings.accountNumber;
  document.getElementById("bankBranch").value = settings.bankBranch;
  document.getElementById("showPaymentDetails").value = settings.showPaymentDetails;
  document.getElementById("contactPhone").value = settings.contactPhone;
  document.getElementById("autoProjectFinance").value = settings.autoProjectFinance || "no";
  document.getElementById("aiMode").value = settings.aiMode || "local";
  document.getElementById("aiApiKey").value = settings.aiApiKey || "";
  document.getElementById("logoPreview").src = settings.logoDataUrl || defaultSettings.logoDataUrl;
  renderCloudBackupSettings();
}

async function downloadInvoicePdf(invoice) {
  try {
    showToast("Preparing PDF...");
    const canvas = await getInvoiceCanvas(invoice);
    const pdf = buildImagePdf(canvas.toDataURL("image/jpeg", 0.98), canvas.width, canvas.height);
    const clientPart = safeFilename(invoice.customerName || "client");
    const invoicePart = safeFilename(invoice.invoiceNumber || "invoice");
    const filename = `${invoicePart}-${clientPart}.pdf`;
    saveBlob(pdf, filename, "application/pdf");
    showToast(`${filename} downloaded`);
  } catch (error) {
    console.error(error);
    showToast("PDF download failed");
  }
}

async function getInvoiceCanvas(invoice) {
  try {
    renderPreview();
    return await renderDisplayedInvoiceCanvas();
  } catch {
    return renderInvoiceCanvas(invoice);
  }
}

function saveBlob(data, filename, type) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(value) {
  return (
    String(value || "")
      .trim()
      .replace(/[^\w\s.-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "file"
  );
}

async function renderDisplayedInvoiceCanvas() {
  const invoiceElement = document.getElementById("invoicePreview");
  const rect = invoiceElement.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(invoiceElement.scrollHeight);
  const clone = invoiceElement.cloneNode(true);
  const styles = getDocumentStyles();

  clone.style.width = `${width}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";

  await inlineImages(clone);

  const html = `
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <style>
          ${styles}
          body { margin: 0; background: #ffffff; }
          .invoice-paper { box-shadow: none !important; border-radius: 0 !important; width: ${width}px !important; }
        </style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject width="100%" height="100%">${html}</foreignObject>
    </svg>
  `;

  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function getDocumentStyles() {
  return [...document.styleSheets]
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");
}

async function inlineImages(root) {
  const images = [...root.querySelectorAll("img")];
  await Promise.all(
    images.map(async (image) => {
      if (!image.src || image.src.startsWith("data:")) return;
      const dataUrl = await imageToDataUrl(image.src).catch(() => "");
      if (dataUrl) image.setAttribute("src", dataUrl);
    }),
  );
}

function imageToDataUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    });
    image.addEventListener("error", reject);
    image.src = src;
  });
}

async function renderInvoiceCanvas(invoice) {
  const totals = calculateTotals(invoice);
  const currency = invoiceCurrency(invoice);
  const documentType = invoice.documentType || "Invoice";
  const documentTitle = documentType.toUpperCase();
  const showQuantityPricing = hasQuantityPricing(invoice);
  const width = 1240;
  const estimatedItemsHeight = invoice.items.reduce((sum, item) => {
    return sum + estimateItemRowHeight(item);
  }, 0);
  const lowerStart = Math.max(812 + estimatedItemsHeight + 70, 1028);
  const footerTop = lowerStart + 600;
  const height = Math.max(1754, footerTop + 136);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const navy = "#1d2e63";
  const orange = "#ff6b2c";
  const light = "#f4f6fb";
  const line = "#d7dce7";
  const gray = "#555555";
  const dark = "#3f3f46";

  const roundedRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const fillRound = (x, y, w, h, r, color) => {
    ctx.fillStyle = color;
    roundedRect(x, y, w, h, r);
    ctx.fill();
  };
  const drawText = (value, x, y, size, color = gray, weight = 400, align = "left") => {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px Poppins, Arial, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(value || ""), x, y);
  };
  const wrapText = (value, x, y, maxWidth, lineHeight, size, color = gray, weight = 400) => {
    ctx.font = `${weight} ${size}px Poppins, Arial, sans-serif`;
    const words = String(value || "").split(/\s+/).filter(Boolean);
    let lineText = "";
    words.forEach((word) => {
      const test = `${lineText} ${word}`.trim();
      if (ctx.measureText(test).width > maxWidth && lineText) {
        drawText(lineText, x, y, size, color, weight);
        lineText = word;
        y += lineHeight;
      } else {
        lineText = test;
      }
    });
    if (lineText) drawText(lineText, x, y, size, color, weight);
    return y + lineHeight;
  };
  const moneyCanvas = (value) => money(value, currency).replace(".00", "");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, width, 202);
  ctx.fillStyle = orange;
  ctx.fillRect(0, 202, width, 8);

  const logoImage = await loadImage(settings.logoDataUrl || defaultSettings.logoDataUrl).catch(() => null);
  if (logoImage) {
    ctx.drawImage(logoImage, 100, 62, 355, 76);
  } else {
    drawText(settings.businessName || "infonits", 112, 128, 56, "#ffffff", 600);
  }
  drawText(documentTitle, 1088, 128, 46, "#ffffff", 600, "right");

  drawText(`${settings.businessName || "infonits"} Pvt Ltd.`, 106, 318, 38, navy, 600);
  drawText(settings.businessAddress, 106, 362, 21, gray);
  const contactLine = `${formatPhone(settings.businessPhone)} | ${settings.businessEmail} | ${settings.businessWebsite}`;
  wrapText(contactLine, 106, 402, 560, 31, 21, gray);

  fillRound(760, 282, 365, 282, 20, light);
  drawText(`${documentTitle} DETAILS`, 792, 330, 22, navy, 600);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(792, 354);
  ctx.lineTo(1094, 354);
  ctx.stroke();
  const details = [
    [`${documentType} No.:`, `#${invoice.invoiceNumber}`],
    ["Date:", formatDate(invoice.invoiceDate)],
    ["Due Date:", formatDate(invoice.dueDate)],
    ["Status:", invoice.status],
  ];
  details.forEach(([label, value], index) => {
    const y = 390 + index * 40;
    drawText(label, 792, y, 18, gray);
    drawText(value, 1094, y, 18, navy, 600, "right");
  });

  ctx.fillStyle = navy;
  ctx.fillRect(106, 540, 16, 132);
  drawText(documentType === "Quotation" ? "PREPARED FOR" : "BILLED TO", 145, 570, 20, navy, 600);
  drawText(invoice.customerName, 145, 624, 34, dark, 600);
  wrapText([invoice.customerEmail, invoice.customerAddress, invoice.customerCountry].filter(Boolean).join(" | "), 145, 674, 600, 31, 21, gray);

  ctx.strokeStyle = "#c8ced8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(106, 720);
  ctx.lineTo(1134, 720);
  ctx.stroke();

  ctx.fillStyle = navy;
  ctx.fillRect(106, 740, 1028, 72);
  drawText("DESCRIPTION", 126, 786, 20, "#ffffff", 600);
  if (showQuantityPricing) {
    drawText("QTY", 748, 786, 20, "#ffffff", 600, "right");
    drawText("UNIT PRICE", 934, 786, 20, "#ffffff", 600, "right");
  }
  drawText("AMOUNT", 1116, 786, 20, "#ffffff", 600, "right");

  let rowY = 812;
  invoice.items.forEach((item, index) => {
    const amount = lineItemAmount(item);
    const directAmount = isDirectAmountItem(item);
    const rowHeight = estimateItemRowHeight(item);
    if (index % 2 === 0) {
      ctx.fillStyle = light;
      ctx.fillRect(106, rowY, 1028, rowHeight);
    }
    drawText(item.title || item.description, 126, rowY + 44, 20, navy, 600);
    if (item.title && item.description) {
      wrapText(item.description, 126, rowY + 82, 470, 24, 16, "#111111", 500);
    }
    if (showQuantityPricing) {
      drawText(directAmount ? "" : formatNumber(item.quantity), 748, rowY + 44, 20, navy, 600, "right");
      drawText(directAmount ? "" : moneyCanvas(item.price), 934, rowY + 44, 20, navy, 600, "right");
    }
    drawText(moneyCanvas(amount), 1116, rowY + 44, 20, navy, 600, "right");
    rowY += rowHeight;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(106, rowY);
    ctx.lineTo(1134, rowY);
    ctx.stroke();
  });

  const lowerY = Math.max(rowY + 70, 1028);
  if (settings.showPaymentDetails !== "no") {
    fillRound(106, lowerY, 378, 330, 16, light);
    drawText("PAYMENT DETAILS", 142, lowerY + 54, 22, navy, 600);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(142, lowerY + 84);
    ctx.lineTo(446, lowerY + 84);
    ctx.stroke();
    let paymentY = wrapText(`Bank: ${settings.bankName}`, 142, lowerY + 124, 270, 30, 20, gray);
    paymentY = wrapText(`Account Name: ${settings.accountName || ""}`, 142, paymentY + 8, 270, 30, 20, gray);
    paymentY = wrapText(`Account No.: ${settings.accountNumber || ""} | Branch: ${settings.bankBranch}`, 142, paymentY + 8, 270, 30, 20, gray);
    if (invoice.paymentMethod) paymentY = wrapText(`Method: ${invoice.paymentMethod}`, 142, paymentY + 8, 270, 30, 20, gray);
    wrapText(`Reference: ${documentType} #${invoice.invoiceNumber}`, 142, paymentY + 8, 270, 30, 20, gray);
  }

  const totalsX = 552;
  const totalsValueX = 1090;
  drawText("Subtotal", totalsX, lowerY + 22, 22, gray);
  drawText(moneyCanvas(totals.subtotal), totalsValueX, lowerY + 22, 22, gray, 600, "right");
  drawText(`Tax (${formatPercent(invoice.taxRate)})`, totalsX, lowerY + 82, 22, gray);
  drawText(moneyCanvas(totals.tax), totalsValueX, lowerY + 82, 22, gray, 600, "right");
  drawText("Discount", totalsX, lowerY + 142, 22, gray);
  drawText(moneyCanvas(totals.discount), totalsValueX, lowerY + 142, 22, gray, 600, "right");
  drawText("Advance paid", totalsX, lowerY + 202, 22, gray);
  drawText(moneyCanvas(totals.advancePaid), totalsValueX, lowerY + 202, 22, gray, 600, "right");
  fillRound(totalsX, lowerY + 262, 538, 84, 14, navy);
  drawText("GRAND TOTAL", totalsX + 32, lowerY + 314, 24, "#ffffff", 600);
  drawText(moneyCanvas(totals.total), totalsX + 510, lowerY + 314, 24, "#ffffff", 600, "right");

  drawText("Notes", 106, lowerY + 410, 24, navy, 600);
  let notesY = wrapText(invoice.notes || "Payment is due within 15 days of the invoice date.", 106, lowerY + 460, 600, 34, 20, gray);
  if (invoice.terms) {
    drawText("Terms", 106, notesY + 28, 22, navy, 600);
    notesY = wrapText(invoice.terms, 106, notesY + 66, 600, 30, 18, gray);
  }
  if (invoice.authorizedBy) {
    notesY = wrapText(`Authorized by: ${invoice.authorizedBy}`, 106, notesY + 6, 600, 30, 18, gray, 600);
  }
  wrapText(`For queries, contact: ${settings.businessEmail} | ${formatPhone(settings.contactPhone)}`, 106, notesY + 6, 600, 34, 20, gray);

  const footerY = Math.max(lowerY + 560, height - 136);
  ctx.fillStyle = orange;
  ctx.fillRect(0, footerY, width, 8);
  ctx.fillStyle = navy;
  ctx.fillRect(0, footerY + 8, width, 128);
  drawText("Thank You for Your Business with Us!", 620, footerY + 66, 30, "#ffffff", 600, "center");
  drawText(`${settings.businessWebsite}  |  ${settings.businessEmail}  |  ${formatPhone(settings.contactPhone)}`, 620, footerY + 106, 20, "#d9e2ff", 400, "center");

  return canvas;
}

function estimateItemRowHeight(item) {
  if (!item.description) return 72;
  const lineCount = Math.max(1, Math.ceil(String(item.description).length / 42));
  return Math.max(112, 64 + lineCount * 24);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

function buildImagePdf(jpegDataUrl, imageWidth = 1240, imageHeight = 1754) {
  const encoder = new TextEncoder();
  const jpegBytes = base64ToBytes(jpegDataUrl.split(",")[1]);
  const page = { width: 595.28, height: 595.28 * (imageHeight / imageWidth) };
  const content = `q\n${page.width} 0 0 ${page.height} 0 0 cm\n/Im1 Do\nQ\n`;
  const objects = [
    [`<< /Type /Catalog /Pages 2 0 R >>\n`],
    [`<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n`],
    [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\n`,
    ],
    [
      `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
      jpegBytes,
      "\nendstream\n",
    ],
    [`<< /Length ${content.length} >>\nstream\n${content}endstream\n`],
  ];
  const parts = ["%PDF-1.4\n"];
  const offsets = [0];
  let length = encoder.encode(parts[0]).length;

  objects.forEach((objectParts, index) => {
    offsets.push(length);
    const header = `${index + 1} 0 obj\n`;
    parts.push(header, ...objectParts, "endobj\n");
    length += encoder.encode(header).length;
    objectParts.forEach((part) => {
      length += typeof part === "string" ? encoder.encode(part).length : part.length;
    });
    length += encoder.encode("endobj\n").length;
  });

  const xrefOffset = length;
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    trailer += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  trailer += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(trailer);

  const totalLength = parts.reduce((sum, part) => {
    return sum + (typeof part === "string" ? encoder.encode(part).length : part.length);
  }, 0);
  const output = new Uint8Array(totalLength);
  let position = 0;
  parts.forEach((part) => {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    output.set(bytes, position);
    position += bytes.length;
  });
  return output;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function formatShortDate(dateString) {
  if (!dateString) return "";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderAll() {
  renderDashboard();
  renderClients();
  renderEmployees();
  renderServices();
  renderRenewals();
  renderWebsiteLogins();
  renderUsers();
  renderManagerHandles();
  renderProjectManagerWorkspace();
  renderItemSuggestions();
  renderProjects();
  renderFinance();
  renderInvoiceTable();
  renderQuotationTable();
  renderPreview();
  renderSettings();
  applyAccessControl();
}

function statusBadge(status) {
  return `<span class="status ${status}">${status}</span>`;
}

function emptyRow(message, columns) {
  return `<tr><td colspan="${columns}">${message}</td></tr>`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function yearsBetween(startDate, endDate = today()) {
  if (!startDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  let years = end.getFullYear() - start.getFullYear();
  const beforeAnniversary =
    end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;
  return years;
}

function imageFileIsAllowed(file) {
  if (!file) return false;
  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file");
    return false;
  }
  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    showToast("Image must be 2 MB or smaller");
    return false;
  }
  return true;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("\n", " ");
}

navTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.viewTarget));
});

document.getElementById("newInvoiceButton").addEventListener("click", () => startNewDocument("Invoice"));
document.getElementById("newQuotationButton").addEventListener("click", () => startNewDocument("Quotation"));
document.getElementById("newProjectButton").addEventListener("click", () => {
  resetProjectForm();
  showProjectForm();
  switchView("projects");
});
document.getElementById("aiCreateDraftButton").addEventListener("click", createDocumentFromPrompt);
document.getElementById("exportBackupButton").addEventListener("click", exportBackup);
document.getElementById("importBackupInput").addEventListener("change", (event) => importBackup(event.target.files[0]));
document.getElementById("cloudBackupButton").addEventListener("click", backupToCloud);
document.getElementById("cloudRestoreButton").addEventListener("click", restoreFromCloud);
document.getElementById("cloudAutoBackup").addEventListener("change", cloudBackupConfigFromForm);
aiPromptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    createDocumentFromPrompt();
  }
});
document.getElementById("zoomInButton").addEventListener("click", () => {
  previewZoom = Math.min(1.2, previewZoom + 0.1);
  updatePreviewZoom();
});
document.getElementById("zoomOutButton").addEventListener("click", () => {
  previewZoom = Math.max(0.45, previewZoom - 0.1);
  updatePreviewZoom();
});
document.getElementById("documentType").addEventListener("change", () => {
  if (!editingId) {
    const type = document.getElementById("documentType").value;
    document.getElementById("status").value = type === "Quotation" ? "Draft" : "Unpaid";
    document.getElementById("invoiceNumber").value = generateDocumentNumber(type);
  }
});

document.getElementById("invoiceDate").addEventListener("change", () => {
  if (!editingId) {
    document.getElementById("invoiceNumber").value = generateInvoiceNumber();
  }
});

document.getElementById("addItemButton").addEventListener("click", () => addItemRow());
document.getElementById("resetFormButton").addEventListener("click", resetForm);
document.getElementById("taxRate").addEventListener("input", updateFormTotals);
document.getElementById("discount").addEventListener("input", updateFormTotals);
document.getElementById("advancePaid").addEventListener("input", updateFormTotals);
document.getElementById("invoiceCurrency").addEventListener("change", updateFormTotals);
searchInput.addEventListener("input", () => {
  invoicePage = 1;
  renderInvoiceTable();
});
statusFilter.addEventListener("change", () => {
  invoicePage = 1;
  renderInvoiceTable();
});
invoiceMonthFilter.addEventListener("change", () => {
  invoicePage = 1;
  renderInvoiceTable();
});
dashboardSearchInput.addEventListener("input", renderDashboardSearch);
quotationSearchInput.addEventListener("input", renderQuotationTable);
quotationStatusFilter.addEventListener("change", renderQuotationTable);
quotationMonthFilter.addEventListener("change", renderQuotationTable);
projectSearchInput.addEventListener("input", renderProjects);
projectMonthFilter.addEventListener("change", () => {
  updateProjectMonthFields();
  renderProjects();
});
projectStatusFilter.addEventListener("change", renderProjects);
projectUsdRate.addEventListener("input", convertProjectUsdToLkr);
pmMonthFilter.addEventListener("change", () => {
  pmProjectPage = 1;
  pmPostPage = 1;
  renderProjectManagerWorkspace();
});
document.getElementById("pmProjectPrevPage").addEventListener("click", () => {
  pmProjectPage = Math.max(1, pmProjectPage - 1);
  renderProjectManagerWorkspace();
});
document.getElementById("pmProjectNextPage").addEventListener("click", () => {
  pmProjectPage += 1;
  renderProjectManagerWorkspace();
});
document.getElementById("pmPostPrevPage").addEventListener("click", () => {
  pmPostPage = Math.max(1, pmPostPage - 1);
  renderProjectManagerWorkspace();
});
document.getElementById("pmPostNextPage").addEventListener("click", () => {
  pmPostPage += 1;
  renderProjectManagerWorkspace();
});
document.getElementById("pmPostClientFilter").addEventListener("change", () => {
  pmPostPage = 1;
  renderSocialMediaPosts();
});
document.getElementById("downloadPmPostCsvButton").addEventListener("click", downloadPostedRecordsCsv);
document.getElementById("downloadPmPostPdfButton").addEventListener("click", downloadPostedRecordsPdf);
document.getElementById("saveProjectTargetButton").addEventListener("click", saveCurrentProjectMonthSettings);
toggleProjectFormButton.addEventListener("click", toggleProjectForm);
document.getElementById("projectValueUsd").addEventListener("input", convertProjectUsdToLkr);
document.getElementById("projectMonth").addEventListener("change", convertProjectUsdToLkr);
financeMonthFilter.addEventListener("change", () => {
  financePage = 1;
  renderFinance();
});
financeTypeFilter.addEventListener("change", () => {
  financePage = 1;
  renderFinance();
});
financeCategoryFilter.addEventListener("change", () => {
  financePage = 1;
  renderFinance();
});
document.getElementById("financePrevPage").addEventListener("click", () => {
  financePage = Math.max(1, financePage - 1);
  renderFinance();
});
document.getElementById("financeNextPage").addEventListener("click", () => {
  financePage += 1;
  renderFinance();
});
document.getElementById("recentInvoicesPrevPage").addEventListener("click", () => {
  recentInvoicesPage = Math.max(1, recentInvoicesPage - 1);
  renderDashboard();
});
document.getElementById("recentInvoicesNextPage").addEventListener("click", () => {
  recentInvoicesPage += 1;
  renderDashboard();
});
document.getElementById("clientPrevPage").addEventListener("click", () => {
  clientPage = Math.max(1, clientPage - 1);
  renderClients();
});
document.getElementById("clientNextPage").addEventListener("click", () => {
  clientPage += 1;
  renderClients();
});
document.getElementById("invoicePrevPage").addEventListener("click", () => {
  invoicePage = Math.max(1, invoicePage - 1);
  renderInvoiceTable();
});
document.getElementById("invoiceNextPage").addEventListener("click", () => {
  invoicePage += 1;
  renderInvoiceTable();
});
document.getElementById("downloadFinanceReportButton").addEventListener("click", downloadFinanceReport);
document.getElementById("downloadClientStatementButton").addEventListener("click", downloadClientStatement);
document.getElementById("downloadProjectSheetButton").addEventListener("click", downloadProjectSheet);
document.getElementById("downloadProjectPdfButton").addEventListener("click", downloadProjectPdf);
document.getElementById("downloadPmReportButton").addEventListener("click", downloadManagerMonthlyReport);
document.getElementById("downloadPmPdfReportButton").addEventListener("click", downloadManagerMonthlyPdfReport);
clientSelect.addEventListener("change", () => fillInvoiceClient(clientSelect.value));

clientForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const client = getClientFormData();
  if (!client.name) {
    showToast("Client name is required");
    return;
  }
  const duplicate = clients.some((item) => {
    return item.id !== editingClientId && item.name.trim().toLowerCase() === client.name.trim().toLowerCase();
  });
  if (duplicate) {
    showToast("Client already exists");
    return;
  }

  if (editingClientId) {
    clients = clients.map((item) => (item.id === editingClientId ? client : item));
    showToast("Client updated");
  } else {
    clients.unshift(client);
    showToast("Client saved");
  }

  saveClients();
  resetClientForm();
  clientPage = 1;
  renderClients();
});

document.getElementById("resetClientButton").addEventListener("click", resetClientForm);
document.getElementById("resetEmployeeButton").addEventListener("click", resetEmployeeForm);
document.getElementById("resetProjectButton").addEventListener("click", resetProjectForm);
document.getElementById("resetServiceButton").addEventListener("click", resetServiceForm);
document.getElementById("resetRenewalButton").addEventListener("click", resetRenewalForm);
document.getElementById("resetWebsiteLoginButton").addEventListener("click", resetWebsiteLoginForm);
document.getElementById("resetUserButton").addEventListener("click", resetUserForm);
document.getElementById("resetManagerHandleButton").addEventListener("click", resetManagerHandleForm);
document.getElementById("resetSocialPostButton").addEventListener("click", resetSocialPostForm);
document.querySelector("#resetCorrectionButton")?.addEventListener("click", resetCorrectionForm);
document.getElementById("refreshPmNotificationsButton").addEventListener("click", () => {
  renderProjectManagerWorkspace();
  showToast("Project manager notifications refreshed");
});
renewalSearchInput.addEventListener("input", renderRenewals);
websiteLoginSearchInput.addEventListener("input", renderWebsiteLogins);
employeeSearchInput.addEventListener("input", renderEmployees);
employeeStatusFilter.addEventListener("change", renderEmployees);
managerHandleSearchInput.addEventListener("input", renderManagerHandles);
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loginUser(document.getElementById("loginUsername").value, document.getElementById("loginPassword").value);
});
document.getElementById("loginPasswordToggle").addEventListener("click", () => {
  const passwordInput = document.getElementById("loginPassword");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});
userMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  userMenu.classList.toggle("is-open");
});
document.getElementById("editProfileButton").addEventListener("click", () => {
  userMenu.classList.remove("is-open");
  const user = currentUser();
  if (user) editUser(user.id);
});
document.getElementById("logoutButton").addEventListener("click", () => {
  userMenu.classList.remove("is-open");
  logoutUser();
  showToast("Logged out");
});
document.getElementById("userRole").addEventListener("change", (event) => {
  populateUserAccessOptions(roleDefaultAccess[event.target.value] || []);
});

document.getElementById("employeeProfilePhoto").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!imageFileIsAllowed(file)) {
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    pendingEmployeePhotoDataUrl = reader.result;
    document.getElementById("employeePhotoPreview").src = pendingEmployeePhotoDataUrl;
  });
  reader.readAsDataURL(file);
});

serviceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const service = getServiceFormData();
  if (!service.name) {
    showToast("Service name is required");
    return;
  }
  if (editingServiceId) {
    services = services.map((item) => (item.id === editingServiceId ? service : item));
    showToast("Service updated");
  } else {
    services.unshift(service);
    showToast("Service saved");
  }
  saveServices();
  resetServiceForm();
  renderServices();
  renderItemSuggestions();
});

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const employee = getEmployeeFormData();
  const requiredFields = [
    employee.employeeCode,
    employee.firstName,
    employee.lastName,
    employee.dateOfBirth,
    employee.gender,
    employee.nationalId,
    employee.workEmail,
    formatPhone(employee.phone),
    employee.department,
    employee.jobTitle,
    employee.startDate,
  ];
  if (requiredFields.some((value) => !value)) {
    showToast("Fill all required employee details");
    return;
  }
  if (employee.dateOfBirth > today()) {
    showToast("Date of birth cannot be in the future");
    return;
  }
  if (yearsBetween(employee.dateOfBirth, employee.startDate) < 16) {
    showToast("Joining date must be at least 16 years after date of birth");
    return;
  }
  if (employee.startDate < employee.dateOfBirth) {
    showToast("Joining date cannot be before date of birth");
    return;
  }
  const duplicate = employees.some((item) => {
    return item.id !== editingEmployeeId && item.employeeCode.trim().toLowerCase() === employee.employeeCode.trim().toLowerCase();
  });
  if (duplicate) {
    showToast("Employee ID already exists");
    return;
  }
  const duplicateWorkEmail = employees.some((item) => {
    return (
      employee.workEmail &&
      item.id !== editingEmployeeId &&
      String(item.workEmail || "").trim().toLowerCase() === employee.workEmail.toLowerCase()
    );
  });
  if (duplicateWorkEmail) {
    showToast("Work email already belongs to another employee");
    return;
  }

  if (editingEmployeeId) {
    employees = employees.map((item) => (item.id === editingEmployeeId ? employee : item));
    showToast("Employee updated");
  } else {
    employees.unshift(employee);
    showToast("Employee saved");
  }

  saveEmployees();
  resetEmployeeForm();
  renderEmployees();
});

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = await getUserFormData();
  if (!user.name) {
    showToast("User name is required");
    return;
  }
  if (!user.username) {
    showToast("Username is required");
    return;
  }
  if (!editingUserId && !document.getElementById("userPassword").value) {
    showToast("Password is required");
    return;
  }
  const duplicate = users.some((item) => item.id !== user.id && item.name.trim().toLowerCase() === user.name.toLowerCase());
  if (duplicate) {
    showToast("User already exists");
    return;
  }
  const duplicateUsername = users.some((item) => item.id !== user.id && String(item.username || "").trim().toLowerCase() === user.username.toLowerCase());
  if (duplicateUsername) {
    showToast("Username already exists");
    return;
  }
  if (editingUserId) {
    users = users.map((item) => (item.id === editingUserId ? user : item));
    showToast("User updated");
  } else {
    users.unshift(user);
    showToast("User created");
  }
  saveUsers();
  resetUserForm();
  renderUsers();
  renderManagerHandles();
  applyAccessControl();
});

managerHandleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const handle = getManagerHandleFormData();
  if (!handle.projectId || !handle.userId || !handle.task) {
    showToast("Select project, user, and task");
    return;
  }
  if (editingManagerHandleId) {
    managerHandles = managerHandles.map((item) => (item.id === editingManagerHandleId ? handle : item));
    showToast("Handle updated");
  } else {
    managerHandles.unshift(handle);
    showToast("Handle saved");
  }
  saveManagerHandles();
  resetManagerHandleForm();
  renderManagerHandles();
  renderDashboard();
});

socialPostForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const post = getSocialPostFormData();
  if (!post.clientName || !post.uploadDate || !post.count) {
    showToast("Client, posted date, and count are required");
    return;
  }
  const platforms = selectedPostPlatforms();
  if (!platforms.length) {
    showToast("Select at least one platform");
    return;
  }
  if (editingSocialPostId) {
    const platform = platforms[0];
    const existingPost = socialMediaPosts.find((item) => item.id === editingSocialPostId);
    socialMediaPosts = socialMediaPosts.map((item) =>
      item.id === editingSocialPostId ? { ...post, groupId: existingPost?.groupId || post.groupId || createId(), platform: platform.platform, link: platform.link } : item,
    );
    showToast("Posted count updated");
  } else {
    const groupId = createId();
    const posts = platforms.map((platform) => ({
      ...post,
      id: createId(),
      groupId,
      platform: platform.platform,
      link: platform.link,
    }));
    socialMediaPosts.unshift(...posts);
    showToast(`${posts.length} platform record${posts.length === 1 ? "" : "s"} saved`);
  }
  saveSocialMediaPosts();
  pmPostPage = 1;
  resetSocialPostForm();
  renderProjectManagerWorkspace();
});

correctionForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const correction = getCorrectionFormData();
  if (!correction.clientName || !correction.type || !correction.description) {
    showToast("Client, correction type, and description are required");
    return;
  }
  if (editingCorrectionId) {
    corrections = corrections.map((item) => (item.id === editingCorrectionId ? correction : item));
    showToast("Correction updated");
  } else {
    corrections.unshift(correction);
    showToast("Correction saved");
  }
  saveCorrections();
  resetCorrectionForm();
  renderProjectManagerWorkspace();
});

renewalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const renewal = getRenewalFormData();
  if (!renewal.name || !renewal.expiryDate) {
    showToast("Renewal name and expiry are required");
    return;
  }
  if (editingRenewalId) {
    renewals = renewals.map((item) => (item.id === editingRenewalId ? renewal : item));
    showToast("Renewal updated");
  } else {
    renewals.unshift(renewal);
    showToast("Renewal saved");
  }
  saveRenewals();
  resetRenewalForm();
  renderRenewals();
});

websiteLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const login = getWebsiteLoginFormData();
  if (!login.websiteName) {
    showToast("Website name is required");
    return;
  }
  if (editingWebsiteLoginId) {
    websiteLogins = websiteLogins.map((item) => (item.id === editingWebsiteLoginId ? login : item));
    showToast("Website login updated");
  } else {
    websiteLogins.unshift(login);
    showToast("Website login saved");
  }
  saveWebsiteLogins();
  resetWebsiteLoginForm();
  renderWebsiteLogins();
});

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const project = getProjectFormData();
  if (!project.name || !project.month) {
    showToast("Project name and month are required");
    return;
  }

  if (editingProjectId) {
    projects = projects.map((item) => (item.id === editingProjectId ? project : item));
    showToast("Project updated");
  } else {
    projects.unshift(project);
    showToast("Project saved");
  }

  saveProjects();
  resetProjectForm();
  renderProjects();
  renderManagerHandles();
  renderFinance();
});

financeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const record = getFinanceFormData();
  if (!record.category || !record.amount || !record.date) {
    showToast("Add finance category, date, and amount");
    return;
  }
  financeRecords.unshift(record);
  saveFinanceRecords();
  resetFinanceForm();
  financeMonthFilter.value = record.date.slice(0, 7);
  financePage = 1;
  renderFinance();
  showToast("Finance record saved");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const invoice = getFormInvoice();
  invoice.items = invoice.items.filter((item) => item.title);

  if (!invoice.items.length) {
    showToast("Add at least one invoice item");
    return;
  }

  if (editingId) {
    invoices = invoices.map((item) => (item.id === editingId ? invoice : item));
    showToast("Invoice updated");
  } else {
    invoices.unshift(invoice);
    showToast("Invoice saved");
  }

  selectedInvoiceId = invoice.id;
  saveInvoices();
  resetForm();
  renderAll();
  switchView("dashboard");
});

document.body.addEventListener("click", (event) => {
  if (!event.target.closest(".user-menu-wrap")) userMenu.classList.remove("is-open");
  const selectButton = event.target.closest("[data-select]");
  const editButton = event.target.closest("[data-edit]");
  const monthlyButton = event.target.closest("[data-monthly]");
  const paidButton = event.target.closest("[data-paid]");
  const convertButton = event.target.closest("[data-convert]");
  const deleteButton = event.target.closest("[data-delete]");
  const clientInvoiceButton = event.target.closest("[data-client-invoice]");
  const clientEditButton = event.target.closest("[data-client-edit]");
  const clientDeleteButton = event.target.closest("[data-client-delete]");
  const employeeEditButton = event.target.closest("[data-employee-edit]");
  const employeeDeleteButton = event.target.closest("[data-employee-delete]");
  const userEditButton = event.target.closest("[data-user-edit]");
  const userDeleteButton = event.target.closest("[data-user-delete]");
  const handleEditButton = event.target.closest("[data-handle-edit]");
  const handleDeleteButton = event.target.closest("[data-handle-delete]");
  const postEditButton = event.target.closest("[data-post-edit]");
  const postDeleteButton = event.target.closest("[data-post-delete]");
  const postDeleteGroupButton = event.target.closest("[data-post-delete-group]");
  const correctionEditButton = event.target.closest("[data-correction-edit]");
  const correctionDeleteButton = event.target.closest("[data-correction-delete]");
  const notifyDesignerButton = event.target.closest("[data-notify-designer]");
  const pmAssignDesignerButton = event.target.closest("[data-pm-assign-designer]");
  const pmAssignDeveloperButton = event.target.closest("[data-pm-assign-developer]");
  const pmViewProjectButton = event.target.closest("[data-pm-view-project]");
  const pmSocialPlanButton = event.target.closest("[data-pm-social-plan]");
  const pmCorrectionsButton = event.target.closest("[data-pm-corrections]");
  const projectEditButton = event.target.closest("[data-project-edit]");
  const projectDeleteButton = event.target.closest("[data-project-delete]");
  const projectNextButton = event.target.closest("[data-project-next]");
  const projectInvoiceButton = event.target.closest("[data-project-invoice]");
  const financeDeleteButton = event.target.closest("[data-finance-delete]");
  const financeTogglePaidButton = event.target.closest("[data-finance-toggle-paid]");
  const serviceEditButton = event.target.closest("[data-service-edit]");
  const serviceDeleteButton = event.target.closest("[data-service-delete]");
  const renewalEditButton = event.target.closest("[data-renewal-edit]");
  const renewalDeleteButton = event.target.closest("[data-renewal-delete]");
  const loginEditButton = event.target.closest("[data-login-edit]");
  const loginDeleteButton = event.target.closest("[data-login-delete]");
  const openUrlButton = event.target.closest("[data-open-url]");
  const copyLoginButton = event.target.closest("[data-copy-login]");
  const togglePasswordButton = event.target.closest("[data-toggle-password]");
  const portalCalendarButton = event.target.closest("[data-portal-calendar]");
  const closeInvoiceModalButton = event.target.closest("[data-close-invoice-modal]");
  const clientColorButton = event.target.closest("[data-client-color]");

  if (clientColorButton) changeClientColor(clientColorButton.dataset.clientColor);
  if (closeInvoiceModalButton) closeInvoiceModal();
  if (selectButton) selectInvoice(selectButton.dataset.select);
  if (editButton) editInvoice(editButton.dataset.edit);
  if (monthlyButton) createMonthlyCopy(monthlyButton.dataset.monthly);
  if (paidButton) markInvoicePaid(paidButton.dataset.paid);
  if (convertButton) convertQuotationToInvoice(convertButton.dataset.convert);
  if (deleteButton) deleteInvoice(deleteButton.dataset.delete);
  if (clientInvoiceButton) {
    resetForm();
    clientSelect.value = clientInvoiceButton.dataset.clientInvoice;
    fillInvoiceClient(clientInvoiceButton.dataset.clientInvoice);
    switchView("create");
  }
  if (clientEditButton) editClient(clientEditButton.dataset.clientEdit);
  if (clientDeleteButton) deleteClient(clientDeleteButton.dataset.clientDelete);
  if (employeeEditButton) editEmployee(employeeEditButton.dataset.employeeEdit);
  if (employeeDeleteButton) deleteEmployee(employeeDeleteButton.dataset.employeeDelete);
  if (userEditButton) editUser(userEditButton.dataset.userEdit);
  if (userDeleteButton) deleteUser(userDeleteButton.dataset.userDelete);
  if (handleEditButton) editManagerHandle(handleEditButton.dataset.handleEdit);
  if (handleDeleteButton) deleteManagerHandle(handleDeleteButton.dataset.handleDelete);
  if (postEditButton) editSocialPost(postEditButton.dataset.postEdit);
  if (postDeleteButton) deleteSocialPost(postDeleteButton.dataset.postDelete);
  if (postDeleteGroupButton) deleteSocialPostGroup(postDeleteGroupButton.dataset.postDeleteGroup);
  if (correctionEditButton) editCorrection(correctionEditButton.dataset.correctionEdit);
  if (correctionDeleteButton) deleteCorrection(correctionDeleteButton.dataset.correctionDelete);
  if (notifyDesignerButton) notifyDesignerForMissedPost(notifyDesignerButton.dataset.notifyDesigner);
  if (pmAssignDesignerButton) assignProjectTeamMember(pmAssignDesignerButton.dataset.pmAssignDesigner, "designer");
  if (pmAssignDeveloperButton) assignProjectTeamMember(pmAssignDeveloperButton.dataset.pmAssignDeveloper, "developer");
  if (pmViewProjectButton) editProject(pmViewProjectButton.dataset.pmViewProject);
  if (pmSocialPlanButton) {
    const project = projects.find((item) => item.id === pmSocialPlanButton.dataset.pmSocialPlan);
    showToast(`${socialMediaPosts.filter((post) => post.projectId === project?.id).length} social posts for ${project?.name || "project"}`);
  }
  if (pmCorrectionsButton) {
    const project = projects.find((item) => item.id === pmCorrectionsButton.dataset.pmCorrections);
    showToast(`${corrections.filter((item) => item.projectId === project?.id).length} corrections for ${project?.name || "project"}`);
  }
  if (projectEditButton) editProject(projectEditButton.dataset.projectEdit);
  if (projectDeleteButton) deleteProject(projectDeleteButton.dataset.projectDelete);
  if (projectNextButton) createNextMonthProject(projectNextButton.dataset.projectNext);
  if (projectInvoiceButton) createInvoiceFromProject(projectInvoiceButton.dataset.projectInvoice);
  if (financeTogglePaidButton) {
    toggleFinancePaid(financeTogglePaidButton.dataset.financeTogglePaid, financeTogglePaidButton.dataset.financePaidMonth);
  }
  if (financeDeleteButton) deleteFinanceRecord(financeDeleteButton.dataset.financeDelete);
  if (serviceEditButton) editService(serviceEditButton.dataset.serviceEdit);
  if (serviceDeleteButton) deleteService(serviceDeleteButton.dataset.serviceDelete);
  if (renewalEditButton) editRenewal(renewalEditButton.dataset.renewalEdit);
  if (renewalDeleteButton) deleteRenewal(renewalDeleteButton.dataset.renewalDelete);
  if (loginEditButton) editWebsiteLogin(loginEditButton.dataset.loginEdit);
  if (loginDeleteButton) deleteWebsiteLogin(loginDeleteButton.dataset.loginDelete);
  if (openUrlButton) openSavedLogin(openUrlButton.dataset.openUrl);
  if (copyLoginButton) copyLoginField(copyLoginButton.dataset.copyLogin, copyLoginButton.dataset.copyField);
  if (togglePasswordButton) toggleWebsitePassword(togglePasswordButton.dataset.togglePassword);
  if (portalCalendarButton) shiftPortalCalendar(Number(portalCalendarButton.dataset.portalCalendar || 0));
});

document.body.addEventListener("change", (event) => {
  const statusSelect = event.target.closest("[data-project-status]");
  const invoiceStatusSelect = event.target.closest("[data-invoice-status]");
  const moneyInput = event.target.closest("[data-project-money]");
  const postClientSelect = event.target.closest("#postClient");
  const correctionClientSelect = event.target.closest("#correctionClient");
  const pmTeamSelect = event.target.closest("[data-pm-team]");
  if (statusSelect) updateProjectStatus(statusSelect.dataset.projectStatus, statusSelect.value);
  if (invoiceStatusSelect) updateInvoiceStatus(invoiceStatusSelect.dataset.invoiceStatus, invoiceStatusSelect.value);
  if (postClientSelect) document.getElementById("postProject").innerHTML = projectOptions("", postClientSelect.value);
  if (correctionClientSelect) document.querySelector("#correctionProject").innerHTML = projectOptions("", correctionClientSelect.value);
  if (pmTeamSelect) updateProjectTeamFromSelect(pmTeamSelect.dataset.pmTeam, pmTeamSelect.value);
  if (moneyInput) {
    const amount = parseFormattedNumber(moneyInput.value);
    moneyInput.value = amount ? formatNumber(amount) : "";
    updateProjectMoney(moneyInput.dataset.projectMoney, moneyInput.dataset.projectMoneyField, amount);
  }
});

document.getElementById("printInvoiceButton").addEventListener("click", () => {
  const invoice = invoices.find((item) => item.id === selectedInvoiceId) || invoices[0];
  if (!invoice) {
    showToast("Create an invoice before printing");
    return;
  }
  downloadInvoicePdf(invoice);
});

document.getElementById("saveSettingsButton").addEventListener("click", () => {
  settings = {
    businessName: document.getElementById("businessName").value.trim() || defaultSettings.businessName,
    businessEmail: document.getElementById("businessEmail").value.trim(),
    businessPhone: formatPhone(document.getElementById("businessPhone").value),
    businessAddress: document.getElementById("businessAddress").value.trim(),
    businessWebsite: document.getElementById("businessWebsite").value.trim(),
    currencyLabel: document.getElementById("currencyLabel").value.trim() || defaultSettings.currencyLabel,
    bankName: document.getElementById("bankName").value.trim(),
    accountName: document.getElementById("accountName").value.trim(),
    accountNumber: document.getElementById("accountNumber").value.trim(),
    bankBranch: document.getElementById("bankBranch").value.trim(),
    showPaymentDetails: document.getElementById("showPaymentDetails").value,
    contactPhone: formatPhone(document.getElementById("contactPhone").value),
    autoProjectFinance: document.getElementById("autoProjectFinance").value,
    aiMode: document.getElementById("aiMode").value,
    aiApiKey: document.getElementById("aiApiKey").value.trim(),
    logoDataUrl: settings.logoDataUrl || defaultSettings.logoDataUrl,
  };
  saveSettings();
  document.getElementById("invoiceCurrency").value = settings.currencyLabel;
  renderAll();
  showToast("Settings saved");
});

document.getElementById("logoInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!imageFileIsAllowed(file)) {
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    settings.logoDataUrl = reader.result;
    saveSettings();
    renderAll();
    showToast("Logo saved");
  });
  reader.readAsDataURL(file);
});

async function startApp() {
  appIsStarting = true;
  applyAccessControl();
  populateCountrySelects();
  populateFinanceCategories();
  const supabaseLoaded = await loadAllDataFromSupabase();
  if (supabaseLoaded) {
    await migrateOldLocalDataToSupabase();
    ensureDefaultAdminUser();
    seedDefaultServices();
  } else {
    ensureDefaultAdminUser();
    currentUserId = "";
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  }
  resetForm();
  resetClientForm();
  resetEmployeeForm();
  resetProjectForm();
  resetServiceForm();
  resetRenewalForm();
  resetWebsiteLoginForm();
  resetUserForm();
  resetManagerHandleForm();
  resetSocialPostForm();
  resetCorrectionForm();
  resetFinanceForm();
  activeUserSnapshot = currentUser();
  appIsStarting = false;
  document.body.classList.remove("app-loading");
  renderAll();
  updatePreviewZoom();
  updatePreviewVisibility();
}

startApp();
