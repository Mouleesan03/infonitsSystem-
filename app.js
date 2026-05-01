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
const FINANCE_PAGE_SIZE = 8;
const RECENT_INVOICE_PAGE_SIZE = 8;
const CLIENT_PAGE_SIZE = 10;
const INVOICE_PAGE_SIZE = 10;
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

let invoices = loadInvoices();
let clients = loadClients();
let projects = loadProjects();
let projectTargets = loadProjectTargets();
let financeRecords = loadFinanceRecords();
let services = loadServices();
let renewals = loadRenewals();
let websiteLogins = loadWebsiteLogins();
let employees = loadEmployees();
let settings = loadSettings();
let editingId = null;
let editingClientId = null;
let editingProjectId = null;
let editingServiceId = null;
let editingRenewalId = null;
let editingWebsiteLoginId = null;
let editingEmployeeId = null;
let linkedProjectId = null;
let selectedInvoiceId = invoices[0]?.id || null;
let previewZoom = 0.8;
let previewHidden = false;
let projectFormVisible = false;
let financePage = 1;
let recentInvoicesPage = 1;
let clientPage = 1;
let invoicePage = 1;
let portalCalendarMonth = today().slice(0, 7);
let portalCalendarPinned = false;
let pendingEmployeePhotoDataUrl = "";
const visibleWebsitePasswords = new Set();

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
  renewals: document.getElementById("renewalsView"),
  logins: document.getElementById("loginsView"),
  finance: document.getElementById("financeView"),
  settings: document.getElementById("settingsView"),
};

const form = document.getElementById("invoiceForm");
const clientForm = document.getElementById("clientForm");
const projectForm = document.getElementById("projectForm");
const serviceForm = document.getElementById("serviceForm");
const renewalForm = document.getElementById("renewalForm");
const websiteLoginForm = document.getElementById("websiteLoginForm");
const employeeForm = document.getElementById("employeeForm");
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
const statementClientSelect = document.getElementById("statementClientSelect");
const clientSelect = document.getElementById("clientSelect");
const previewScale = document.getElementById("previewScale");
const previewZoomLabel = document.getElementById("previewZoomLabel");
const togglePreviewButton = document.getElementById("togglePreviewButton");

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
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveInvoices() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

function loadClients() {
  try {
    return JSON.parse(localStorage.getItem(CLIENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveClients() {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProjects() {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function loadProjectTargets() {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_TARGETS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProjectTargets() {
  localStorage.setItem(PROJECT_TARGETS_KEY, JSON.stringify(projectTargets));
}

function loadFinanceRecords() {
  try {
    return JSON.parse(localStorage.getItem(FINANCE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFinanceRecords() {
  localStorage.setItem(FINANCE_KEY, JSON.stringify(financeRecords));
}

function loadServices() {
  try {
    return JSON.parse(localStorage.getItem(SERVICES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveServices() {
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
}

function loadRenewals() {
  try {
    return JSON.parse(localStorage.getItem(RENEWALS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRenewals() {
  localStorage.setItem(RENEWALS_KEY, JSON.stringify(renewals));
}

function loadWebsiteLogins() {
  try {
    return JSON.parse(localStorage.getItem(WEBSITE_LOGINS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveWebsiteLogins() {
  localStorage.setItem(WEBSITE_LOGINS_KEY, JSON.stringify(websiteLogins));
}

function loadEmployees() {
  try {
    return JSON.parse(localStorage.getItem(EMPLOYEES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEmployees() {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
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
  settings = loadSettings();
  selectedInvoiceId = invoices[0]?.id || null;
}

function loadSettings() {
  try {
    return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function addSheetDetailsToProjectsAndClients() {
  const hasSavedProjects = localStorage.getItem(PROJECTS_KEY) !== null;
  const hasSavedClients = localStorage.getItem(CLIENTS_KEY) !== null;
  if (hasSavedProjects || hasSavedClients) {
    return;
  }

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
  if (localStorage.getItem(SERVICES_KEY) !== null || services.length) return;
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
  document.getElementById("dashboardView").classList.toggle("preview-hidden", previewHidden);
  togglePreviewButton.textContent = previewHidden ? "Show preview" : "Hide preview";
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

function matchesMonth(dateString, monthValue) {
  return !monthValue || String(dateString || "").startsWith(monthValue);
}

function switchView(viewName) {
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
  selectedInvoiceId = id;
  renderPreview();
  switchView("dashboard");
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

function deleteProject(id) {
  id = ensureProjectForMonth(id);
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  const confirmed = confirm(`Delete ${project.name}?`);
  if (!confirmed) return;
  projects = projects.filter((item) => item.id !== id);
  saveProjects();
  renderProjects();
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
  const backup = {
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
      settings,
    },
  };
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

function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const backup = JSON.parse(reader.result);
      const data = backup.data || backup;
      if (!Array.isArray(data.invoices) || !Array.isArray(data.clients)) {
        throw new Error("Invalid backup file");
      }
      const confirmed = confirm("Import backup? This will replace current saved data.");
      if (!confirmed) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.invoices || []));
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(data.clients || []));
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects || []));
      localStorage.setItem(PROJECT_TARGETS_KEY, JSON.stringify(data.projectTargets || {}));
      localStorage.setItem(FINANCE_KEY, JSON.stringify(data.financeRecords || []));
      localStorage.setItem(SERVICES_KEY, JSON.stringify(data.services || []));
      localStorage.setItem(RENEWALS_KEY, JSON.stringify(data.renewals || []));
      localStorage.setItem(WEBSITE_LOGINS_KEY, JSON.stringify(data.websiteLogins || []));
      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(data.employees || []));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...defaultSettings, ...(data.settings || {}) }));
      refreshStateFromStorage();
      resetForm();
      resetClientForm();
      resetProjectForm();
      resetServiceForm();
      resetRenewalForm();
      resetWebsiteLoginForm();
      resetEmployeeForm();
      resetFinanceForm();
      renderAll();
      showToast("Backup imported");
    } catch {
      showToast("Backup import failed");
    } finally {
      document.getElementById("importBackupInput").value = "";
    }
  });
  reader.readAsText(file);
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
    ? pageInvoices.map((invoice) => documentRow(invoice)).join("")
    : emptyRow("No matching invoices", 7);
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

function documentRow(invoice, includeType = false) {
  const totals = calculateTotals(invoice);
  const typeCell = includeType ? `<td>${escapeHtml(invoice.documentType || "Invoice")}</td>` : "";
  return `
    <tr>
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
  renderItemSuggestions();
  renderProjects();
  renderFinance();
  renderInvoiceTable();
  renderQuotationTable();
  renderPreview();
  renderSettings();
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
togglePreviewButton.addEventListener("click", () => {
  previewHidden = !previewHidden;
  updatePreviewVisibility();
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
renewalSearchInput.addEventListener("input", renderRenewals);
websiteLoginSearchInput.addEventListener("input", renderWebsiteLogins);
employeeSearchInput.addEventListener("input", renderEmployees);
employeeStatusFilter.addEventListener("change", renderEmployees);

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
  if (statusSelect) updateProjectStatus(statusSelect.dataset.projectStatus, statusSelect.value);
  if (invoiceStatusSelect) updateInvoiceStatus(invoiceStatusSelect.dataset.invoiceStatus, invoiceStatusSelect.value);
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

populateCountrySelects();
populateFinanceCategories();
addSheetDetailsToProjectsAndClients();
seedDefaultServices();
resetForm();
resetClientForm();
resetEmployeeForm();
resetProjectForm();
resetServiceForm();
resetRenewalForm();
resetWebsiteLoginForm();
resetFinanceForm();
renderAll();
updatePreviewZoom();
updatePreviewVisibility();
