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
  const invoiceOutstanding = document.getElementById("invoiceOutstanding");
  const invoiceOutstandingMeta = document.getElementById("invoiceOutstandingMeta");
  const invoicePaidMonth = document.getElementById("invoicePaidMonth");
  const invoicePaidMonthMeta = document.getElementById("invoicePaidMonthMeta");
  const invoiceSentCount = document.getElementById("invoiceSentCount");
  const invoiceSentMeta = document.getElementById("invoiceSentMeta");
  const invoiceDraftCount = document.getElementById("invoiceDraftCount");
  const invoiceDraftMeta = document.getElementById("invoiceDraftMeta");
  const invoiceShownCount = document.getElementById("invoiceShownCount");
  const invoicePeriod = document.getElementById("invoicePeriod");
  const invoiceTime = document.getElementById("invoiceTime");
  const invoiceBackButton = document.getElementById("invoiceBackButton");
  const saveButton = document.getElementById("saveInvoiceButton");
  const statusText = document.getElementById("invoiceStatusText");
  const invoiceNoPreview = document.getElementById("invoiceNoPreview");
  const invoiceTotalPreview = document.getElementById("invoiceTotalPreview");

  let clients = [];
  let invoices = [];
  let projectTargets = {};
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

  function monthValueFromDate(dateString) {
    return String(dateString || "").slice(0, 7);
  }

  function effectiveStatus(invoice) {
    const status = String(invoice.status || "Unpaid");
    if (status === "Paid" || status === "Draft" || status === "Overdue") return status;
    if (status !== "Unpaid") return status;
    const due = String(invoice.dueDate || "");
    if (due && due < today()) return "Overdue";
    return status;
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

  function compactAmount(value) {
    const n = Number(value || 0);
    if (Math.abs(n) >= 1000000) return `Rs. ${(n / 1000000).toFixed(2).replace(/\.00$/, "")}m`;
    if (Math.abs(n) >= 1000) return `Rs. ${(n / 1000).toFixed(0)}k`;
    return `Rs. ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  function formatLkrExact(value) {
    const n = Number(value || 0);
    const hasDecimal = Math.abs(n % 1) > 0;
    return `Rs. ${n.toLocaleString("en-US", {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }

  function projectUsdRateForMonth(month) {
    return Number(projectTargets?.[month]?.usdRate || 0);
  }

  function invoiceTotalInLkr(invoice) {
    const total = invoiceTotal(invoice);
    if ((invoice.currency || "LKR") !== "USD") return total;
    const month = String(invoice.invoiceDate || today()).slice(0, 7);
    const rate = projectUsdRateForMonth(month) || projectUsdRateForMonth(today().slice(0, 7)) || 319.6;
    return total * rate;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderSummaryCards() {
    let pendingLkr = 0;
    let paidTotalLkr = 0;
    let sentCount = 0;
    let draftCount = 0;
    let overdueCount = 0;
    const now = today();
    const invoiceDocs = invoices.filter((invoice) => (invoice.documentType || "Invoice") === "Invoice");

    invoiceDocs.forEach((invoice) => {
      const status = effectiveStatus(invoice);
      const amountLkr = invoiceTotalInLkr(invoice);
      if (status === "Sent") sentCount += 1;
      if (status === "Draft") draftCount += 1;
      const isOverdue = status === "Overdue" || (status === "Unpaid" && invoice.dueDate && invoice.dueDate < now);
      if (isOverdue) overdueCount += 1;
      if (status === "Paid") {
        paidTotalLkr += amountLkr;
      } else if (status !== "Draft") {
        pendingLkr += amountLkr;
      }
    });

    const billedLkr = paidTotalLkr + pendingLkr;
    const paidPercent = billedLkr > 0 ? Math.round((paidTotalLkr / billedLkr) * 100) : 0;

    invoiceOutstanding.textContent = formatLkrExact(pendingLkr);
    invoiceOutstandingMeta.textContent = `${overdueCount} overdue`;
    invoicePaidMonth.textContent = formatLkrExact(paidTotalLkr);
    invoicePaidMonthMeta.textContent = `${paidPercent}% of billed`;
    invoiceSentCount.textContent = String(sentCount);
    invoiceSentMeta.textContent = sentCount > 0 ? "awaiting" : "none";
    invoiceDraftCount.textContent = String(draftCount);
    invoiceDraftMeta.textContent = draftCount > 0 ? "in progress" : "none";
  }

  function statusClass(status) {
    const key = String(status || "").toLowerCase();
    if (key === "paid") return "paid";
    if (key === "overdue") return "overdue";
    if (key === "sent") return "sent";
    if (key === "draft") return "draft";
    return "";
  }

  function renderInvoices() {
    const invoiceDocs = filteredInvoices();
    const totalPages = Math.max(1, Math.ceil(invoiceDocs.length / INVOICE_PAGE_SIZE));
    if (invoicePage > totalPages) invoicePage = totalPages;
    const start = (invoicePage - 1) * INVOICE_PAGE_SIZE;
    const paged = invoiceDocs.slice(start, start + INVOICE_PAGE_SIZE);
    invoicePageLabel.textContent = `${invoicePage} / ${totalPages}`;
    invoiceShownCount.textContent = `${invoiceDocs.length} shown`;
    invoicePrevPage.disabled = invoicePage <= 1;
    invoiceNextPage.disabled = invoicePage >= totalPages;
    if (!paged.length) {
      invoiceList.innerHTML = `<article class="invoice-card"><small>No invoices created yet.</small></article>`;
      return;
    }
    invoiceList.innerHTML = paged
      .map(
        (invoice) => `
          <article class="invoice-card ${statusClass(effectiveStatus(invoice))}">
            <div class="invoice-card-head">
              <div>
                <div class="invoice-title">
                  <strong>${escapeHtml(invoice.invoiceNumber)}</strong>
                  <span class="status-chip ${statusClass(effectiveStatus(invoice))}">${escapeHtml(effectiveStatus(invoice))}</span>
                </div>
                <small>${escapeHtml(invoice.customerName)} | ${escapeHtml(invoice.invoiceDate || "-")} | ${escapeHtml(invoice.currency || "LKR")}</small>
              </div>
              <strong>${escapeHtml(invoiceMoney(invoice, invoiceTotal(invoice)))}</strong>
            </div>
            <div class="invoice-card-actions">
              <button class="btn secondary" type="button" data-download-invoice="${escapeHtml(invoice.id)}">Download</button>
              <button class="btn secondary" type="button" data-view-invoice="${escapeHtml(invoice.id)}">View</button>
              <button class="mini-btn" type="button" aria-label="More actions">...</button>
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
      const statusValue = effectiveStatus(invoice);
      const haystack = `${invoice.invoiceNumber || ""} ${invoice.customerName || ""}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesType = type === "All" || (invoice.documentType || "Invoice") === type;
      const matchesStatus = status === "All" || statusValue === status;
      const matchesCustomer = !customer || String(invoice.customerName || "").toLowerCase().includes(customer);
      return matchesQuery && matchesType && matchesStatus && matchesCustomer;
    });
  }

  function resetInvoicePageAndRender() {
    invoicePage = 1;
    renderInvoices();
  }

  async function downloadInvoice(invoice) {
    setText("Preparing PDF...");
    const canvas = renderInvoiceCanvas(invoice);
    const pdf = buildImagePdf(canvas.toDataURL("image/jpeg", 0.98), canvas.width, canvas.height);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.invoiceNumber || "invoice"}-${(invoice.customerName || "client").replace(/[^\w.-]+/g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    setText("PDF downloaded");
  }

  async function viewInvoice(invoice) {
    setText("Opening preview...");
    const canvas = renderInvoiceCanvas(invoice);
    const pdf = buildImagePdf(canvas.toDataURL("image/jpeg", 0.98), canvas.width, canvas.height);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    setText("Preview opened");
  }

  function renderInvoiceCanvas(invoice) {
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    const navy = "#1d2e63";
    const orange = "#ff6b2c";
    const light = "#f4f6fb";
    const line = "#d7dce7";
    const gray = "#555555";
    const dark = "#3f3f46";
    const items = invoice.items || [];
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount || Number(item.quantity || 0) * Number(item.price || 0)), 0);
    const total = invoiceTotal(invoice);
    const docType = invoice.documentType || "Invoice";
    const docTitle = docType.toUpperCase();

    const drawText = (value, x, y, size, color = gray, weight = 400, align = "left") => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px Arial, sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(String(value || ""), x, y);
    };
    const wrapText = (value, x, y, maxWidth, lineHeight, size, color = gray, weight = 400) => {
      ctx.font = `${weight} ${size}px Arial, sans-serif`;
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
    const fillRound = (x, y, w, h, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    };
    const amountText = (value) => invoiceMoney(invoice, value).replace(".00", "");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = navy;
    ctx.fillRect(0, 0, canvas.width, 202);
    ctx.fillStyle = orange;
    ctx.fillRect(0, 202, canvas.width, 8);
    drawInfonitsLogo(ctx, 100, 62);
    drawText(docTitle, 1088, 128, 46, "#ffffff", 700, "right");

    drawText("infonits Pvt Ltd.", 106, 318, 38, navy, 700);
    drawText("1st Lane Arasady Road, Nallur, Jaffna, Sri Lanka.", 106, 362, 21, gray);
    wrapText("+94 77 607 9157 | hello@infonits.com | www.infonits.io", 106, 402, 560, 31, 21, gray);

    fillRound(760, 282, 365, 282, 20, light);
    drawText(`${docTitle} DETAILS`, 792, 330, 22, navy, 700);
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(792, 354);
    ctx.lineTo(1094, 354);
    ctx.stroke();
    [
      [`${docType} No.:`, `#${invoice.invoiceNumber}`],
      ["Date:", invoice.invoiceDate || ""],
      ["Due Date:", invoice.dueDate || ""],
      ["Status:", invoice.status || ""],
    ].forEach(([label, value], index) => {
      const y = 390 + index * 40;
      drawText(label, 792, y, 18, gray);
      drawText(value, 1094, y, 18, navy, 700, "right");
    });

    ctx.fillStyle = navy;
    ctx.fillRect(106, 540, 16, 132);
    drawText(docType === "Quotation" ? "PREPARED FOR" : "BILLED TO", 145, 570, 20, navy, 700);
    drawText(invoice.customerName, 145, 624, 34, dark, 700);
    wrapText([invoice.customerEmail, invoice.customerAddress, invoice.customerCountry].filter(Boolean).join(" | "), 145, 674, 600, 31, 21, gray);

    ctx.strokeStyle = "#c8ced8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(106, 720);
    ctx.lineTo(1134, 720);
    ctx.stroke();

    ctx.fillStyle = navy;
    ctx.fillRect(106, 740, 1028, 72);
    drawText("DESCRIPTION", 126, 786, 20, "#ffffff", 700);
    drawText("QTY", 748, 786, 20, "#ffffff", 700, "right");
    drawText("UNIT PRICE", 934, 786, 20, "#ffffff", 700, "right");
    drawText("AMOUNT", 1116, 786, 20, "#ffffff", 700, "right");

    let rowY = 812;
    items.forEach((item, index) => {
      const amount = Number(item.amount || Number(item.quantity || 0) * Number(item.price || 0));
      const rowHeight = item.description ? 112 : 72;
      if (index % 2 === 0) {
        ctx.fillStyle = light;
        ctx.fillRect(106, rowY, 1028, rowHeight);
      }
      drawText(item.title || "Service", 126, rowY + 44, 20, navy, 700);
      if (item.description) wrapText(item.description, 126, rowY + 82, 470, 24, 16, "#111111", 500);
      drawText(String(item.quantity || 1), 748, rowY + 44, 20, navy, 700, "right");
      drawText(amountText(item.price || amount), 934, rowY + 44, 20, navy, 700, "right");
      drawText(amountText(amount), 1116, rowY + 44, 20, navy, 700, "right");
      rowY += rowHeight;
      ctx.strokeStyle = line;
      ctx.beginPath();
      ctx.moveTo(106, rowY);
      ctx.lineTo(1134, rowY);
      ctx.stroke();
    });

    const lowerY = Math.max(rowY + 70, 1028);
    const totalsX = 596;
    const totalsValueX = 1090;
    drawText("Subtotal", totalsX, lowerY + 22, 22, gray);
    drawText(amountText(subtotal), totalsValueX, lowerY + 22, 22, gray, 700, "right");
    drawText("Tax (0%)", totalsX, lowerY + 82, 22, gray);
    drawText(amountText(0), totalsValueX, lowerY + 82, 22, gray, 700, "right");
    drawText("Discount", totalsX, lowerY + 142, 22, gray);
    drawText(amountText(invoice.discount || 0), totalsValueX, lowerY + 142, 22, gray, 700, "right");
    drawText("Advance paid", totalsX, lowerY + 202, 22, gray);
    drawText(amountText(invoice.advancePaid || 0), totalsValueX, lowerY + 202, 22, gray, 700, "right");
    fillRound(totalsX, lowerY + 262, 538, 84, 14, navy);
    drawText("GRAND TOTAL", totalsX + 32, lowerY + 314, 24, "#ffffff", 700);
    drawText(amountText(total), totalsX + 510, lowerY + 314, 24, "#ffffff", 700, "right");

    drawText("Notes", 106, lowerY + 410, 24, navy, 700);
    wrapText(invoice.notes || "Payment is due within 10 days of the invoice date.", 106, lowerY + 460, 600, 34, 20, gray);

    ctx.fillStyle = orange;
    ctx.fillRect(0, canvas.height - 136, canvas.width, 8);
    ctx.fillStyle = navy;
    ctx.fillRect(0, canvas.height - 128, canvas.width, 128);
    drawText("Thank You for Your Business with Us!", 620, canvas.height - 70, 30, "#ffffff", 700, "center");
    drawText("www.infonits.io | hello@infonits.com | +94 77 607 9157", 620, canvas.height - 30, 20, "#d9e2ff", 400, "center");
    return canvas;
  }

  function drawInfonitsLogo(ctx, x, y) {
    const dot = 15;
    const gap = 8;
    const colors = ["#ffffff", "#ff6b2c", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        ctx.fillStyle = colors[row * 3 + col];
        ctx.beginPath();
        ctx.roundRect(x + col * (dot + gap), y + row * (dot + gap), dot, dot, 4);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 54px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("infonits", x + 88, y + 58);
  }

  function buildImagePdf(jpegDataUrl, imageWidth = 1240, imageHeight = 1754) {
    const encoder = new TextEncoder();
    const jpegBytes = base64ToBytes(jpegDataUrl.split(",")[1]);
    const page = { width: 595.28, height: 595.28 * (imageHeight / imageWidth) };
    const content = `q\n${page.width} 0 0 ${page.height} 0 0 cm\n/Im1 Do\nQ\n`;
    const objects = [
      [`<< /Type /Catalog /Pages 2 0 R >>\n`],
      [`<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n`],
      [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\n`],
      [`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`, jpegBytes, "\nendstream\n"],
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
    const totalLength = parts.reduce((sum, part) => sum + (typeof part === "string" ? encoder.encode(part).length : part.length), 0);
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
      await Promise.all([loadInvoices(), loadProjectTargets()]);
      renderSummaryCards();
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
      await Promise.all([loadClients(), loadInvoices(), loadProjectTargets()]);
      renderClients();
      renderSummaryCards();
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
    const downloadButton = event.target.closest("[data-download-invoice]");
    const viewButton = event.target.closest("[data-view-invoice]");
    if (downloadButton) {
      const invoice = invoices.find((item) => item.id === downloadButton.getAttribute("data-download-invoice"));
      if (invoice) downloadInvoice(invoice);
      return;
    }
    if (viewButton) {
      const invoice = invoices.find((item) => item.id === viewButton.getAttribute("data-view-invoice"));
      if (invoice) viewInvoice(invoice);
    }
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
  invoiceBackButton.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "./mobile-dashboard.html?v=20260521-sync";
  });
  (function updateHeaderClock() {
    const now = new Date();
    invoicePeriod.textContent = `${now.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} · INVOICES`;
    invoiceTime.textContent = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const paidMonthLabel = document.querySelector(".summary div:nth-child(2) span");
    if (paidMonthLabel) paidMonthLabel.innerHTML = `<i class="dot green"></i>PAID · ${now.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}`;
  })();
  init();
})();
