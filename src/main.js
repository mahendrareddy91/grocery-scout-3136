import {
  accountConnections,
  cravingSwaps,
  healthProfiles,
  livePriceAudits,
  locationProfile,
  products,
} from "./data.js";

const root = document.getElementById("root");
const AUD = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

const state = {
  searchTerm: "milo bars",
  selectedProductId: "milo-original-bars-210",
  activeTab: "decision",
  openedAccounts: new Set(),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return value == null || Number.isNaN(value) ? "Needs check" : AUD.format(value);
}

function icon(name) {
  const paths = {
    basket: '<path d="M6 9h12l-1 10H7L6 9Z"/><path d="M9 9a3 3 0 0 1 6 0"/><path d="M9 13h6"/>',
    search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
    pin: '<path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 8v5"/><path d="M12 17h.01"/>',
    link: '<path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M20 14v5H5V4h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-8"/>',
    heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.4 5.4 0 1 0-7.7 7.7L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.7Z"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.check}</svg>`;
}

function findProduct() {
  const term = state.searchTerm.trim().toLowerCase();
  const matches = products.filter((product) => {
    const haystack = [product.name, product.category, ...product.aliases].join(" ").toLowerCase();
    return !term || haystack.includes(term);
  });
  const selected = matches.find((product) => product.id === state.selectedProductId) || matches[0] || products[0];
  state.selectedProductId = selected.id;
  return { selected, matches };
}

function auditFor(product) {
  if (livePriceAudits[product.id]) return livePriceAudits[product.id];
  const rows = product.offers.map((offer) => ({
    retailer: offer.retailer,
    match: "Catalogue/product lead",
    pack: offer.packNote || product.unitLabel,
    grams: null,
    price: offer.price,
    unit: offer.unitPrice == null ? "Needs check" : `${formatMoney(offer.unitPrice)} / ${product.unitLabel}`,
    per100g: "Needs check",
    confidence: offer.confidence,
    action: offer.tag,
    url: offer.url,
  }));
  return {
    checkedAt: "8 Jul 2026",
    location: `${locationProfile.suburb} ${locationProfile.postcode}`,
    productName: product.name,
    recommendation: "Compare live checkout before buying",
    recommendationDetail: "This product has catalogue leads, but no complete live audit yet.",
    goodBuyPrice: product.watchTarget,
    futureSignal: "No confirmed future price signal yet.",
    historySignal: "History will improve after account connection and receipt import.",
    rows,
    thresholds: [
      { label: "Target", value: formatMoney(product.watchTarget), note: "Buy-below line" },
    ],
    historyLinks: [],
  };
}

function bestConfirmed(rows) {
  return rows
    .filter((row) => row.price != null)
    .slice()
    .sort((a, b) => a.price - b.price)[0];
}

function renderProductChoices(matches) {
  return matches
    .slice(0, 6)
    .map(
      (product) => `
        <button class="choice ${product.id === state.selectedProductId ? "selected" : ""}" data-product="${product.id}">
          ${escapeHtml(product.aliases[0] || product.name)}
        </button>`,
    )
    .join("");
}

function renderPriceRows(audit) {
  return audit.rows
    .map(
      (row) => `
        <article class="price-row ${row.price == null ? "needs-check" : ""}">
          <div>
            <strong>${escapeHtml(row.retailer)}</strong>
            <span>${escapeHtml(row.match)} · ${escapeHtml(row.pack)}</span>
          </div>
          <div class="price-pill">${formatMoney(row.price)}</div>
          <div class="unit-copy">
            <span>${escapeHtml(row.unit)}</span>
            <small>${escapeHtml(row.per100g)}</small>
          </div>
          <div class="row-action">
            <span>${escapeHtml(row.action)}</span>
            <a href="${row.url}" target="_blank" rel="noreferrer">Open ${icon("link")}</a>
          </div>
        </article>`,
    )
    .join("");
}

function renderThresholds(audit) {
  return audit.thresholds
    .map(
      (item) => `
        <div class="threshold">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.note)}</small>
        </div>`,
    )
    .join("");
}

function renderHistory(audit) {
  const links = audit.historyLinks.length
    ? audit.historyLinks
        .map(
          (link) => `
            <a class="history-link" href="${link.url}" target="_blank" rel="noreferrer">
              <strong>${escapeHtml(link.label)}</strong>
              <span>${escapeHtml(link.source)} · ${escapeHtml(link.status)}</span>
              ${icon("link")}
            </a>`,
        )
        .join("")
    : `<p class="muted">Connect accounts or import receipts to build your real paid-price history.</p>`;

  return `
    <section class="detail-section" id="history">
      <div class="section-heading">${icon("chart")}<h2>Historical price</h2></div>
      <p>${escapeHtml(audit.historySignal)}</p>
      <div class="history-card">
        <div class="sparkline" aria-hidden="true">
          <span style="height: 42%"></span><span style="height: 54%"></span><span style="height: 38%"></span>
          <span style="height: 61%"></span><span style="height: 44%"></span><span style="height: 72%"></span>
          <span style="height: 49%"></span><span style="height: 58%"></span><span style="height: 36%"></span>
        </div>
        <div>
          <strong>Best buy target: ${formatMoney(audit.goodBuyPrice)}</strong>
          <span>Track future drops and compare against what you actually paid.</span>
        </div>
      </div>
      <div class="history-links">${links}</div>
    </section>`;
}

function renderAccounts() {
  return `
    <section class="detail-section" id="accounts">
      <div class="section-heading">${icon("user")}<h2>Connect purchase history</h2></div>
      <p>You sign in on each retailer site. The tracker can then read visible order history or receipts with your permission. No passwords are stored in this static app.</p>
      <div class="account-toolbar">
        <button id="connect-all">${icon("check")} Prepare all accounts</button>
        <button id="import-receipt">${icon("upload")} Add receipt manually</button>
      </div>
      <div class="account-grid">
        ${accountConnections
          .map((account) => {
            const opened = state.openedAccounts.has(account.id);
            return `
              <article class="account-card">
                <div>
                  <strong>${escapeHtml(account.name)}</strong>
                  <span>${escapeHtml(account.purpose)}</span>
                  <small>${opened ? "Login page opened" : account.status} · ${escapeHtml(account.historyAccess)}</small>
                </div>
                <a href="${account.loginUrl}" target="_blank" rel="noreferrer" data-account="${account.id}">
                  ${opened ? "Opened" : "Connect"}
                </a>
              </article>`;
          })
          .join("")}
      </div>
    </section>`;
}

function renderHealth(product) {
  const profile = healthProfiles[product.id] || healthProfiles["milo-original-bars-210"];
  return `
    <section class="detail-section" id="health">
      <div class="section-heading">${icon("heart")}<h2>Health and cravings</h2></div>
      <p>${escapeHtml(profile.summary)}</p>
      <div class="health-summary">
        <strong>${escapeHtml(profile.verdict)}</strong>
        <span>${escapeHtml(profile.recommendation)}</span>
      </div>
      <div class="swap-grid">
        ${cravingSwaps
          .map(
            (swap) => `
              <article>
                <strong>${escapeHtml(swap.name)}</strong>
                <span>${escapeHtml(swap.why)}</span>
                <small>${escapeHtml(swap.protein)} protein</small>
              </article>`,
          )
          .join("")}
      </div>
    </section>`;
}

function render() {
  const { selected, matches } = findProduct();
  const audit = auditFor(selected);
  const best = bestConfirmed(audit.rows);

  root.innerHTML = `
    <div class="simple-shell">
      <header class="simple-header">
        <div class="brand">
          <div class="brand-icon">${icon("basket")}</div>
          <div><strong>Grocery Scout 3136</strong><span>${locationProfile.suburb} ${locationProfile.postcode}</span></div>
        </div>
        <nav>
          <a href="#prices">Prices</a>
          <a href="#history">History</a>
          <a href="#accounts">Accounts</a>
          <a href="#health">Health</a>
        </nav>
        <button class="location-button">${icon("pin")} ${locationProfile.postcode}</button>
      </header>

      <main class="simple-main">
        <section class="search-stage">
          <h1>Ask before you buy.</h1>
          <p>Fetch today’s price, compare history, check future catalogue hints, and decide whether to buy now, wait, bulk-buy, or choose a healthier swap.</p>
          <div class="search-panel">
            ${icon("search")}
            <input id="search-input" value="${escapeHtml(state.searchTerm)}" placeholder="Search a product or paste Amazon link" />
            <button id="search-button">Check prices</button>
          </div>
          <div class="choices">${renderProductChoices(matches)}</div>
        </section>

        <section class="verdict-card">
          <div class="verdict-copy">
            <span>Checked ${escapeHtml(audit.checkedAt)} · ${escapeHtml(audit.location)}</span>
            <h2>${escapeHtml(audit.productName)}</h2>
            <strong>${escapeHtml(audit.recommendation)}</strong>
            <p>${escapeHtml(audit.recommendationDetail)}</p>
          </div>
          <div class="verdict-actions">
            <a href="#prices">${icon("check")} Compare today</a>
            <a href="#history">${icon("chart")} View history</a>
            <a href="#accounts">${icon("user")} Connect accounts</a>
          </div>
        </section>

        <section class="summary-strip">
          <div><span>Best confirmed today</span><strong>${formatMoney(best?.price)}</strong><small>${escapeHtml(best?.retailer || "No confirmed price")}</small></div>
          <div><span>Best buy target</span><strong>${formatMoney(audit.goodBuyPrice)}</strong><small>Alert when below this</small></div>
          <div><span>Future signal</span><strong>${audit.futureSignal.includes("No confirmed") ? "No signal" : "Found"}</strong><small>${escapeHtml(audit.futureSignal)}</small></div>
        </section>

        <section class="detail-section" id="prices">
          <div class="section-heading">${icon("check")}<h2>Today’s price check</h2></div>
          <p>Only confirmed prices are counted. Login/postcode-only prices stay marked as needing a check.</p>
          <div class="price-list">${renderPriceRows(audit)}</div>
        </section>

        <section class="detail-section">
          <div class="section-heading">${icon("alert")}<h2>Best price to buy</h2></div>
          <div class="threshold-grid">${renderThresholds(audit)}</div>
        </section>

        ${renderHistory(audit)}
        ${renderAccounts()}
        ${renderHealth(selected)}
      </main>
    </div>`;

  wireEvents();
}

function wireEvents() {
  document.getElementById("search-input")?.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    state.selectedProductId = "";
    render();
  });

  document.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = products.find((item) => item.id === button.dataset.product);
      state.selectedProductId = button.dataset.product;
      state.searchTerm = product?.aliases[0] || product?.name || "";
      render();
    });
  });

  document.querySelectorAll("[data-account]").forEach((link) => {
    link.addEventListener("click", () => {
      state.openedAccounts.add(link.dataset.account);
      setTimeout(render, 300);
    });
  });

  document.getElementById("connect-all")?.addEventListener("click", () => {
    accountConnections.forEach((account) => state.openedAccounts.add(account.id));
    render();
  });

  document.getElementById("import-receipt")?.addEventListener("click", () => {
    alert("Receipt import placeholder: next build can accept CSV, email export, or screenshots of receipts.");
  });
}

render();
