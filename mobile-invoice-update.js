(function () {
  const cfg = window.INFONITS_SUPABASE || {};
  const documentType = document.getElementById("documentType");
  const invoiceStatus = document.getElementById("invoiceStatus");
  const customerName = document.getElementById("customerName");
  const invoiceDate = document.getElementById("invoiceDate");
  const dueDate = document.getElementById("dueDate");
  const invoiceCurrency = document.getElementById("invoiceCurrency");
  const paymentMethod = document.getElementById("paymentMethod");
  const itemTitle = document.getElementById("itemTitle");
  const itemDescription = document.getElementById("itemDescription");
  const itemQuantity = document.getElementById("itemQuantity");
  const itemPrice = document.getElementById("itemPrice");
  const discount = document.getElementById("discount");
  const advancePaid = document.getElementById("advancePaid");
  const notes = document.getElementById("notes");
  const toggleInvoiceFormButton = document.getElementById("toggleInvoiceFormButton");
  const invoiceFormPanel = document.getElementById("invoiceFormPanel");
  const invoiceFormSummary = document.getElementById("invoiceFormSummary");
  const invoiceList = document.getElementById("invoiceList");
  const invoiceSearchFilter = document.getElementById("invoiceSearchFilter");
  const invoiceTypeFilter = document.getElementById("invoiceTypeFilter");
  const invoiceStatusFilter = document.getElementById("invoiceStatusFilter");
  const invoiceCustomerFilter = document.getElementById("invoiceCustomerFilter");
  const invoicePrevPage = document.getElementById("invoicePrevPage");
  const invoiceNextPage = document.getElementById("invoiceNextPage");
  const invoicePageLabel = document.getElementById("invoicePageLabel");
  const saveButton = document.getElementById("saveInvoiceButton");
  const statusText = document.getElementById("invoiceStatusText");
  const invoiceNoPreview = document.getElementById("invoiceNoPreview");
  const invoiceTotalPreview = document.getElementById("invoiceTotalPreview");

  let clients = [];
  let invoices = [];
  let invoicePage = 1;
  const INVOICE_PAGE_SIZE = 5;

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

  function today() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function addDays(dateString, days) {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function createId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `minv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function compactDate(dateString) {
    const [year, month, day] = String(dateString || today()).split("-");
    return `${year.slice(2)}${month}${day}`;
  }

  function generateDocumentNumber() {
    const type = documentType.value || "Invoice";
    const prefix = type === "Quotation" ? "INQU" : "INFO";
    const base = `${prefix}${compactDate(invoiceDate.value || today())}`;
    const count = invoices.filter((invoice) => {
      return (invoice.documentType || "Invoice") === type && String(invoice.invoiceNumber || "").startsWith(base);
    }).length;
    return count === 0 ? base : `${base}-${count + 1}`;
  }

  function money(value) {
    const label = invoiceCurrency.value === "USD" ? "$" : "Rs.";
    return `${label} ${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  function normalizeClient(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    return {
      id: payload.id || row.app_id || "",
      name: payload.name || row.name || "Client",
      email: payload.email || row.email || "",
      country: payload.country || row.country || "",
      address: payload.address || row.billing_address || "",
    };
  }

  function normalizeInvoice(row) {
    const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
    return {
      id: payload.id || row.app_id || "",
      documentType: payload.documentType || row.document_type || "Invoice",
      invoiceNumber: payload.invoiceNumber || row.invoice_no || "",
      invoiceDate: payload.invoiceDate || row.issue_date || "",
      dueDate: payload.dueDate || row.due_date || "",
      status: payload.status || row.status || "Unpaid",
      currency: payload.currency || row.currency || "LKR",
      customerName: payload.customerName || row.client_name || "Customer",
      discount: Number(payload.discount ?? row.discount ?? 0) || 0,
      advancePaid: Number(payload.advancePaid ?? row.advance_paid ?? 0) || 0,
      notes: payload.notes || "",
      items: Array.isArray(payload.items)
        ? payload.items
        : [{ title: "Service", description: "", quantity: 1, price: Number(row.subtotal || row.total || 0), amount: Number(row.subtotal || row.total || 0) }],
      total: Number(row.total || 0) || 0,
    };
  }

  async function loadClients() {
    const res = await fetch(api("clients?select=app_id,name,email,country,billing_address,payload&order=name.asc"), { headers: headers() });
    if (!res.ok) throw new Error(await res.text());
    clients = (await res.json()).map(normalizeClient).filter((client) => client.name);
  }

  async function loadInvoices() {
    const res = await fetch(api("invoices?select=app_id,document_type,invoice_no,client_name,issue_date,due_date,status,currency,subtotal,discount,advance_paid,total,payload&order=updated_at.desc"), { headers: headers() });
    if (!res.ok) throw new Error(await res.text());
    invoices = (await res.json()).map(normalizeInvoice);
  }

  function renderClients() {
    customerName.innerHTML = ["<option value=''>Select customer</option>"]
      .concat(clients.map((client) => `<option value="${client.name.replace(/"/g, "&quot;")}">${client.name}</option>`))
      .join("");
  }

  function calculateTotal() {
    const subtotal = Number(itemQuantity.value || 0) * Number(itemPrice.value || 0);
    return Math.max(subtotal - Number(discount.value || 0) - Number(advancePaid.value || 0), 0);
  }

  function updatePreview() {
    invoiceNoPreview.textContent = generateDocumentNumber();
    invoiceTotalPreview.textContent = money(calculateTotal());
  }

  function invoiceTotal(invoice) {
    if (Number(invoice.total || 0)) return Number(invoice.total || 0);
    const subtotal = (invoice.items || []).reduce((sum, item) => sum + Number(item.amount || Number(item.quantity || 0) * Number(item.price || 0)), 0);
    return Math.max(subtotal - Number(invoice.discount || 0) - Number(invoice.advancePaid || 0), 0);
  }

  function invoiceMoney(invoice, value) {
    const label = invoice.currency === "USD" ? "$" : "Rs.";
    return `${label} ${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderInvoices() {
    const invoiceDocs = filteredInvoices();
    const totalPages = Math.max(1, Math.ceil(invoiceDocs.length / INVOICE_PAGE_SIZE));
    if (invoicePage > totalPages) invoicePage = totalPages;
    const start = (invoicePage - 1) * INVOICE_PAGE_SIZE;
    const paged = invoiceDocs.slice(start, start + INVOICE_PAGE_SIZE);
    invoicePageLabel.textContent = `Page ${invoicePage} of ${totalPages}`;
    invoicePrevPage.disabled = invoicePage <= 1;
    invoiceNextPage.disabled = invoicePage >= totalPages;
    if (!paged.length) {
      invoiceList.innerHTML = `<article class="invoice-card"><small>No invoices created yet.</small></article>`;
      return;
    }
    invoiceList.innerHTML = paged
      .map(
        (invoice) => `
          <article class="invoice-card">
            <div class="invoice-card-head">
              <div>
                <strong>${escapeHtml(invoice.invoiceNumber)}</strong>
                <small>${escapeHtml(invoice.customerName)} | ${escapeHtml(invoice.invoiceDate || "-")} | ${escapeHtml(invoice.status || "Unpaid")}</small>
              </div>
              <strong>${escapeHtml(invoiceMoney(invoice, invoiceTotal(invoice)))}</strong>
            </div>
            <div class="invoice-card-actions">
              <button class="btn secondary" type="button" data-download-invoice="${escapeHtml(invoice.id)}">Download</button>
            </div>
          </article>
        `,
      )
      .join("");
  }

  function filteredInvoices() {
    const query = String(invoiceSearchFilter.value || "").trim().toLowerCase();
    const type = invoiceTypeFilter.value || "All";
    const status = invoiceStatusFilter.value || "All";
    const customer = String(invoiceCustomerFilter.value || "").trim().toLowerCase();
    return invoices.filter((invoice) => {
      const haystack = `${invoice.invoiceNumber || ""} ${invoice.customerName || ""}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesType = type === "All" || (invoice.documentType || "Invoice") === type;
      const matchesStatus = status === "All" || (invoice.status || "Unpaid") === status;
      const matchesCustomer = !customer || String(invoice.customerName || "").toLowerCase().includes(customer);
      return matchesQuery && matchesType && matchesStatus && matchesCustomer;
    });
  }

  function resetInvoicePageAndRender() {
    invoicePage = 1;
    renderInvoices();
  }

  function downloadInvoice(invoice) {
    const itemRows = (invoice.items || [])
      .map((item) => {
        const amount = Number(item.amount || Number(item.quantity || 0) * Number(item.price || 0));
        return `<tr><td>${escapeHtml(item.title || "Service")}<br><small>${escapeHtml(item.description || "")}</small></td><td>${escapeHtml(String(item.quantity || 1))}</td><td>${escapeHtml(invoiceMoney(invoice, item.price || amount))}</td><td>${escapeHtml(invoiceMoney(invoice, amount))}</td></tr>`;
      })
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(invoice.invoiceNumber)}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111827}.head{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:12px}h1{margin:0;color:#1d2e63}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border-bottom:1px solid #e5e7eb;padding:10px;text-align:left}th{background:#f8fafc}.total{text-align:right;margin-top:18px;font-size:20px;font-weight:700}@media print{button{display:none}}</style></head><body><div class="head"><div><h1>Invoice</h1><p>${escapeHtml(invoice.invoiceNumber)}</p></div><div><strong>${escapeHtml(invoice.customerName)}</strong><p>${escapeHtml(invoice.invoiceDate || "")}</p><p>Due: ${escapeHtml(invoice.dueDate || "")}</p></div></div><table><thead><tr><th>Service</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${itemRows}</tbody></table><p class="total">Total: ${escapeHtml(invoiceMoney(invoice, invoiceTotal(invoice)))}</p><p>${escapeHtml(invoice.notes || "")}</p><script>window.print();</script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.invoiceNumber || "invoice"}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function saveInvoice() {
    const clientName = String(customerName.value || "").trim();
    const issueDate = String(invoiceDate.value || "").trim();
    const serviceTitle = String(itemTitle.value || "").trim();
    const price = Number(itemPrice.value || 0);
    const quantity = Number(itemQuantity.value || 0);
    if (!clientName || !issueDate || !serviceTitle || !price || !quantity) {
      setText("Customer, date, service, quantity, and price are required", true);
      return;
    }

    saveButton.disabled = true;
    setText("Saving...");
    try {
      const client = clients.find((item) => item.name === clientName);
      const id = createId();
      const subtotal = quantity * price;
      const total = calculateTotal();
      const invoiceNumber = generateDocumentNumber();
      const item = {
        title: serviceTitle,
        description: String(itemDescription.value || "").trim(),
        quantity,
        price,
        amount: subtotal,
      };
      const payload = {
        id,
        documentType: documentType.value,
        invoiceNumber,
        invoiceDate: issueDate,
        dueDate: dueDate.value || issueDate,
        status: invoiceStatus.value,
        repeatFrequency: "none",
        paymentMethod: paymentMethod.value.trim(),
        currency: invoiceCurrency.value,
        customerName: clientName,
        customerEmail: client?.email || "",
        customerCountry: client?.country || "",
        customerAddress: client?.address || "",
        taxRate: 0,
        discount: Number(discount.value || 0),
        advancePaid: Number(advancePaid.value || 0),
        notes: notes.value.trim(),
        terms: "",
        authorizedBy: "Mobile",
        items: [item],
        projectId: "",
        updatedAt: new Date().toISOString(),
        createdFrom: "mobile-invoice-update",
      };
      const body = {
        app_id: id,
        document_type: payload.documentType,
        invoice_no: invoiceNumber,
        client_name: clientName,
        issue_date: issueDate,
        due_date: payload.dueDate,
        status: payload.status,
        currency: payload.currency,
        subtotal,
        tax: 0,
        discount: payload.discount,
        advance_paid: payload.advancePaid,
        total,
        payload,
        updated_at: payload.updatedAt,
      };
      const res = await fetch(api("invoices"), {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      invoices.unshift({ id, documentType: payload.documentType, invoiceNumber });
      setText(`${invoiceNumber} saved`);
      itemTitle.value = "";
      itemDescription.value = "";
      itemQuantity.value = "1";
      itemPrice.value = "0";
      discount.value = "0";
      advancePaid.value = "0";
      notes.value = "";
      await loadInvoices();
      renderInvoices();
      updatePreview();
    } catch (error) {
      console.error("Invoice save failed", error);
      setText(`Save failed: ${String(error?.message || error).slice(0, 140)}`, true);
    } finally {
      saveButton.disabled = false;
    }
  }

  async function init() {
    if (!ready()) {
      setText("Supabase config missing", true);
      return;
    }
    invoiceDate.value = today();
    dueDate.value = addDays(today(), 10);
    itemTitle.value = "Service";
    try {
      await Promise.all([loadClients(), loadInvoices()]);
      renderClients();
      renderInvoices();
      updatePreview();
    } catch (error) {
      console.error(error);
      setText("Failed to load invoice data", true);
    }
  }

  [documentType, invoiceDate, invoiceCurrency, itemQuantity, itemPrice, discount, advancePaid].forEach((input) => {
    input.addEventListener("input", updatePreview);
    input.addEventListener("change", updatePreview);
  });
  saveButton.addEventListener("click", saveInvoice);
  toggleInvoiceFormButton.addEventListener("click", () => {
    const hidden = invoiceFormPanel.classList.toggle("hidden");
    invoiceFormSummary.classList.toggle("hidden", hidden);
    toggleInvoiceFormButton.textContent = hidden ? "+ Create invoice" : "Close form";
    if (!hidden) invoiceFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  invoiceList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-download-invoice]");
    if (!button) return;
    const invoice = invoices.find((item) => item.id === button.getAttribute("data-download-invoice"));
    if (invoice) downloadInvoice(invoice);
  });
  [invoiceSearchFilter, invoiceTypeFilter, invoiceStatusFilter, invoiceCustomerFilter].forEach((input) => {
    input.addEventListener("input", resetInvoicePageAndRender);
    input.addEventListener("change", resetInvoicePageAndRender);
  });
  invoicePrevPage.addEventListener("click", () => {
    invoicePage = Math.max(1, invoicePage - 1);
    renderInvoices();
  });
  invoiceNextPage.addEventListener("click", () => {
    invoicePage += 1;
    renderInvoices();
  });
  init();
})();
