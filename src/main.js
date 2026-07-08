import {
  accountConnections,
  bulkDecisionCases,
  cravingSwaps,
  giftCardDeals,
  healthProfiles,
  livePriceAudits,
  locationProfile,
  products,
  sourceHealth,
  weekWindows,
} from "./data.js";

const root = document.getElementById("root");
const AUD = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const ACCOUNT_KEY = "grocery-scout-account-status";
const RECEIPT_KEY = "grocery-scout-receipts";

const state = {
  searchTerm: "milo bars",
  selectedProductId: "milo-original-bars-210",
  activeMode: "today",
  accountStatus: readJson(ACCOUNT_KEY, {}),
  receiptEntries: readJson(RECEIPT_KEY, []),
  receiptPanelOpen: false,
  toast: "",
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

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

function icon(name, size = 18) {
  const paths = {
    alert: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 8v5"/><path d="M12 17h.01"/>',
    basket: '<path d="M6 9h12l-1 10H7L6 9Z"/><path d="M9 9a3 3 0 0 1 6 0"/><path d="M9 13h6"/>',
    calendar: '<path d="M7 3v4"/><path d="M17 3v4"/><path d="M4 8h16"/><path d="M5 5h14v15H5Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M8 16h.01"/><path d="M12 16h.01"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    external: '<path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M20 14v5H5V4h5"/>',
    heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.4 5.4 0 1 0-7.7 7.7L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.7Z"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    lock: '<rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    pin: '<path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/>',
    search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
    settings: '<path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.64V21a2 2 0 1 1-4 0v-.06a1.8 1.8 0 0 0-1-1.64 1.8 1.8 0 0 0-2 .36l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.64-1H3a2 2 0 1 1 0-4h.06a1.8 1.8 0 0 0 1.64-1 1.8 1.8 0 0 0-.36-2l-.04-.04A2 2 0 1 1 7.13 4l.04.04a1.8 1.8 0 0 0 2 .36h.01A1.8 1.8 0 0 0 10.2 2.8V2a2 2 0 1 1 4 0v.06a1.8 1.8 0 0 0 1 1.64 1.8 1.8 0 0 0 2-.36l.04-.04A2 2 0 1 1 20.1 6.1l-.04.04a1.8 1.8 0 0 0-.36 2v.01a1.8 1.8 0 0 0 1.64 1H21a2 2 0 1 1 0 4h-.06a1.8 1.8 0 0 0-1.54 1Z"/>',
    spark: '<path d="M12 2v6"/><path d="M12 16v6"/><path d="m4.9 4.9 4.2 4.2"/><path d="m14.9 14.9 4.2 4.2"/><path d="M2 12h6"/><path d="M16 12h6"/><path d="m4.9 19.1 4.2-4.2"/><path d="m14.9 9.1 4.2-4.2"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.check}</svg>`;
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

  return {
    checkedAt: "8 Jul 2026",
    location: `${locationProfile.suburb} ${locationProfile.postcode}`,
    productName: product.name,
    recommendation: "Compare live checkout before buying",
    recommendationDetail: "This product has catalogue leads, but no complete live audit yet.",
    goodBuyPrice: product.watchTarget,
    futureSignal: "No confirmed future price signal yet.",
    historySignal: "History will improve after account connection and receipt import.",
    rows: product.offers.map((offer) => ({
      retailer: offer.retailer,
      match: offer.tag,
      pack: offer.packNote || product.unitLabel,
      price: offer.price,
      unit: offer.unitPrice == null ? "Needs check" : `${formatMoney(offer.unitPrice)} / ${product.unitLabel}`,
      per100g: offer.unitPrice100g == null ? "Needs check" : `${formatMoney(offer.unitPrice100g)} / 100g`,
      confidence: offer.confidence,
      action: offer.tag,
      url: offer.url,
    })),
    thresholds: [{ label: "Target", value: formatMoney(product.watchTarget), note: "Buy-below line" }],
    historyLinks: [],
  };
}

function bestConfirmed(rows) {
  return rows
    .filter((row) => row.price != null)
    .slice()
    .sort((a, b) => a.price - b.price)[0];
}

function retailerClass(retailer) {
  const name = retailer.toLowerCase();
  if (name.includes("coles")) return "coles";
  if (name.includes("woolworths")) return "woolies";
  if (name.includes("aldi")) return "aldi";
  if (name.includes("costco")) return "costco";
  if (name.includes("amazon")) return "amazon";
  return "other";
}

function retailerMark(retailer) {
  const clean = retailer.replace(" Ringwood", "").replace(" Croydon", "").replace(" AU", "");
  if (clean.toLowerCase().includes("woolworths")) return "W";
  if (clean.toLowerCase().includes("costco")) return "Co";
  if (clean.toLowerCase().includes("amazon")) return "A";
  return clean.slice(0, 2);
}

function accountMeta(account) {
  const status = state.accountStatus[account.id] || "not-connected";
  const meta = {
    "not-connected": { label: "Not connected", tone: "idle", next: "Open login" },
    opened: { label: "Login opened", tone: "pending", next: "Reopen" },
    ready: { label: "Ready to import", tone: "ready", next: "Reopen" },
    blocked: { label: "Popup blocked", tone: "blocked", next: "Open login" },
  };
  return meta[status] || meta["not-connected"];
}

function renderNav() {
  const items = [
    ["search", "Search", "#top"],
    ["calendar", "Specials", "#specials"],
    ["chart", "History", "#history"],
    ["list", "Lists", "#accounts"],
    ["spark", "Bulk", "#bulk"],
    ["heart", "Health", "#health"],
    ["settings", "Sources", "#sources"],
  ];

  return `
    <aside class="side-nav">
      <a class="brand-lockup" href="#top" aria-label="Grocery Scout home">
        <span class="brand-symbol">${icon("basket", 22)}</span>
        <span><strong>Grocery<br />Scout</strong></span>
      </a>
      <nav aria-label="Main sections">
        ${items
          .map(
            ([iconName, label, href], index) => `
              <a class="${index === 0 ? "active" : ""}" href="${href}">
                ${icon(iconName)}
                <span>${label}</span>
              </a>`,
          )
          .join("")}
      </nav>
      <div class="nav-location">
        ${icon("pin")}
        <span><strong>${locationProfile.postcode}</strong>${locationProfile.suburb}</span>
      </div>
    </aside>`;
}

function renderProductChoices(matches) {
  return matches
    .slice(0, 5)
    .map(
      (product) => `
        <button class="suggestion ${product.id === state.selectedProductId ? "selected" : ""}" data-product="${product.id}">
          ${escapeHtml(product.aliases[1] || product.aliases[0] || product.name)}
        </button>`,
    )
    .join("");
}

function renderModeTabs() {
  const modes = [
    ["today", "Today"],
    ["history", "History"],
    ["future", "Future"],
  ];

  return `
    <div class="mode-tabs" role="tablist" aria-label="Decision mode">
      ${modes
        .map(
          ([id, label]) => `
            <button class="${state.activeMode === id ? "active" : ""}" data-mode="${id}" role="tab">
              ${escapeHtml(label)}
            </button>`,
        )
        .join("")}
    </div>`;
}

function renderDecisionPanel(audit, best) {
  const modeCopy = {
    today: {
      icon: "clock",
      title: "Today",
      value: best ? `${formatMoney(best.price)} at ${best.retailer}` : "Needs login checks",
      note: audit.recommendationDetail,
    },
    history: {
      icon: "chart",
      title: "History",
      value: formatMoney(audit.goodBuyPrice),
      note: audit.historySignal,
    },
    future: {
      icon: "calendar",
      title: "Future",
      value: audit.futureSignal.includes("No confirmed") ? "No confirmed drop" : "Future drop found",
      note: audit.futureSignal,
    },
  }[state.activeMode];

  return `
    <section class="decision-panel" aria-live="polite">
      <div class="decision-icon">${icon(modeCopy.icon, 28)}</div>
      <div class="decision-copy">
        <span>${escapeHtml(modeCopy.title)} decision</span>
        <h1>${escapeHtml(audit.recommendation)}</h1>
        <p>${escapeHtml(modeCopy.note)}</p>
      </div>
      <div class="decision-meter">
        <span>Today</span>
        <strong>${escapeHtml(modeCopy.value)}</strong>
        <div class="meter-line" aria-hidden="true">
          <i style="left: 18%"></i><i class="active" style="left: 58%"></i><i style="left: 90%"></i>
        </div>
        <small>Watch for Wed-Tue catalogue movement</small>
      </div>
    </section>`;
}

function renderStoreLanes(audit) {
  const best = bestConfirmed(audit.rows);
  return audit.rows
    .map((row) => {
      const bestLane = row.price != null && best?.price === row.price;
      const needsCheck = row.price == null;
      return `
        <article class="store-lane ${bestLane ? "best" : ""} ${needsCheck ? "needs-check" : ""}">
          <div class="retailer-cell">
            <span class="retailer-mark ${retailerClass(row.retailer)}">${escapeHtml(retailerMark(row.retailer))}</span>
            <div>
              <strong>${escapeHtml(row.retailer)}</strong>
              <small>${escapeHtml(row.match)} / ${escapeHtml(row.pack)}</small>
            </div>
          </div>
          <div class="price-cell">
            <strong>${formatMoney(row.price)}</strong>
            <small>${escapeHtml(row.unit)}</small>
          </div>
          <div class="spark-cell" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="lane-note">
            <strong>${escapeHtml(row.action)}</strong>
            <small>${escapeHtml(row.confidence || row.per100g)}</small>
          </div>
          <a class="icon-link" href="${row.url}" target="_blank" rel="noreferrer">
            ${icon("external")}<span>Open</span>
          </a>
        </article>`;
    })
    .join("");
}

function renderThresholds(audit) {
  return audit.thresholds
    .map(
      (item) => `
        <div class="break-item">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.note)}</small>
        </div>`,
    )
    .join("");
}

function renderHistoryPanel(audit) {
  const links = audit.historyLinks.length
    ? audit.historyLinks
        .map(
          (link) => `
            <a href="${link.url}" target="_blank" rel="noreferrer">
              <span>${escapeHtml(link.label)}</span>
              ${icon("external", 16)}
            </a>`,
        )
        .join("")
    : `<span>Receipt imports will build your paid-price history.</span>`;

  return `
    <section class="history-panel" id="history">
      <div class="panel-heading">
        <div>
          <span>Price history</span>
          <h2>${escapeHtml(audit.productName)}</h2>
        </div>
        <div class="mini-tabs"><button class="active">3M</button><button>6M</button><button>1Y</button></div>
      </div>
      <div class="history-graph" aria-label="Illustrative historical price line">
        <svg viewBox="0 0 760 170" role="img">
          <path class="grid" d="M0 42H760M0 84H760M0 126H760" />
          <path class="line" d="M4 92 C50 78, 96 92, 140 76 S210 82, 250 68 S330 114, 390 90 S470 102, 540 78 S632 110, 756 70" />
          <path class="future" d="M632 110 C684 98, 712 104, 756 92" />
        </svg>
      </div>
      <div class="history-footer">
        <div><strong>${formatMoney(audit.goodBuyPrice)}</strong><span>Good buy target</span></div>
        <div class="history-links">${links}</div>
      </div>
    </section>`;
}

function renderBulkPanel(productId) {
  const bulk = bulkDecisionCases.find((item) => item.productId === productId) || bulkDecisionCases[0];
  return `
    <section class="bulk-panel" id="bulk">
      <div class="panel-heading">
        <div>
          <span>Costco bulk break-even</span>
          <h2>${escapeHtml(bulk.productName)}</h2>
        </div>
        <small>${escapeHtml(bulk.halfPriceFrequency)}</small>
      </div>
      <div class="break-grid">
        <div class="product-chip"><strong>MILO bars</strong><span>Costco 30 pack vs supermarket 10 pack</span></div>
        ${renderThresholds(livePriceAudits[productId] || { thresholds: [] })}
      </div>
    </section>`;
}

function renderAccountsPanel() {
  return `
    <section class="side-panel account-panel" id="accounts">
      <div class="panel-heading compact">
        <div>
          <span>Accounts</span>
          <h2>Connect safely</h2>
        </div>
        ${icon("lock")}
      </div>
      <p class="panel-note">This static GitHub Pages app cannot store passwords or silently sync orders. Use these buttons to open your retailer login pages, then mark the account ready for a future import/check.</p>
      <div class="account-list">
        ${accountConnections
          .map((account) => {
            const meta = accountMeta(account);
            return `
              <article class="account-row ${meta.tone}">
                <div>
                  <strong>${escapeHtml(account.name)}</strong>
                  <span>${escapeHtml(meta.label)}</span>
                </div>
                <div class="account-actions">
                  <a href="${account.loginUrl}" target="_blank" rel="noreferrer" data-open-account="${account.id}">${escapeHtml(meta.next)}</a>
                  <button data-mark-ready="${account.id}" title="Mark this account as ready after you log in">${icon("check", 15)}</button>
                </div>
              </article>`;
          })
          .join("")}
      </div>
      <button class="wide-action" id="receipt-toggle">${icon("upload")} Add receipt / order text</button>
      ${renderReceiptPanel()}
    </section>`;
}

function renderReceiptPanel() {
  const latest = state.receiptEntries[0];
  return `
    <div class="receipt-panel ${state.receiptPanelOpen ? "open" : ""}">
      ${
        state.receiptPanelOpen
          ? `
            <textarea id="receipt-text" rows="5" placeholder="Paste receipt lines, e.g.&#10;Coles MILO bars $9.00&#10;Woolworths yoghurt $5.50"></textarea>
            <button id="receipt-save">${icon("check")} Save receipt lines</button>`
          : ""
      }
      <small>${state.receiptEntries.length} saved receipt${state.receiptEntries.length === 1 ? "" : "s"}${latest ? ` / latest: ${escapeHtml(latest.lines[0] || "receipt")}` : ""}</small>
    </div>`;
}

function renderHealthPanel(product) {
  const profile = healthProfiles[product.id] || healthProfiles["milo-original-bars-210"];
  const swap = cravingSwaps[0];
  return `
    <section class="side-panel" id="health">
      <div class="panel-heading compact">
        <div>
          <span>Health swap</span>
          <h2>${escapeHtml(profile.verdict)}</h2>
        </div>
        ${icon("heart")}
      </div>
      <p class="panel-note">${escapeHtml(profile.summary)}</p>
      <div class="swap-feature">
        <strong>${escapeHtml(swap.name)}</strong>
        <span>${escapeHtml(swap.why)}</span>
        <small>${escapeHtml(swap.protein)} protein</small>
      </div>
      <button class="wide-action ghost" data-mode="history">${icon("chart")} Compare with craving history</button>
    </section>`;
}

function renderGiftCardPanel() {
  const bestDeal = giftCardDeals[0];
  return `
    <section class="side-panel" id="specials">
      <div class="panel-heading compact">
        <div>
          <span>Gift cards</span>
          <h2>Stackable savings</h2>
        </div>
        ${icon("spark")}
      </div>
      <div class="gift-card-line">
        <strong>${escapeHtml(bestDeal.title)}</strong>
        <span>${escapeHtml(bestDeal.window)}</span>
        <small>${escapeHtml(bestDeal.caveat)}</small>
      </div>
      <a class="wide-action ghost link-action" href="${bestDeal.url}" target="_blank" rel="noreferrer">
        ${icon("external")} Open GCDB / OzBargain watch
      </a>
    </section>`;
}

function renderSourcePanel() {
  return `
    <section class="source-panel" id="sources">
      <div class="panel-heading">
        <div>
          <span>Source coverage</span>
          <h2>What gets checked</h2>
        </div>
        <small>${weekWindows[0].range}</small>
      </div>
      <div class="source-strip">
        ${sourceHealth
          .slice(0, 8)
          .map(
            (source) => `
              <a href="${source.url}" target="_blank" rel="noreferrer">
                <strong>${escapeHtml(source.name)}</strong>
                <span>${escapeHtml(source.cadence)}</span>
              </a>`,
          )
          .join("")}
      </div>
    </section>`;
}

function renderToast() {
  return state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : "";
}

function render() {
  const { selected, matches } = findProduct();
  const audit = auditFor(selected);
  const best = bestConfirmed(audit.rows);

  root.innerHTML = `
    <div class="app-shell" id="top">
      ${renderNav()}
      <main class="workspace">
        <section class="command-bar">
          <button class="location-card">${icon("pin")}<span><strong>${locationProfile.postcode}</strong>${locationProfile.suburb}</span></button>
          <form class="search-command" id="search-form">
            ${icon("search", 22)}
            <input id="search-input" value="${escapeHtml(state.searchTerm)}" placeholder="Search product, barcode, or Amazon link" autocomplete="off" />
            <button class="clear-button" id="clear-search" type="button" aria-label="Clear search">${icon("close", 16)}</button>
            <button class="search-submit" type="submit">Search ${icon("chevron", 17)}</button>
          </form>
          <button class="profile-button" aria-label="Account settings">${icon("user", 22)}${icon("chevron", 14)}</button>
        </section>

        <div class="suggestions">${renderProductChoices(matches)}</div>

        <section class="content-grid">
          <div class="primary-stack">
            <div class="status-line">
              <span>Checked ${escapeHtml(audit.checkedAt)} / ${escapeHtml(audit.location)}</span>
              ${renderModeTabs()}
            </div>
            ${renderDecisionPanel(audit, best)}

            <section class="store-board" id="prices">
              <div class="panel-heading">
                <div>
                  <span>Today at Croydon Hills 3136</span>
                  <h2>${escapeHtml(audit.productName)}</h2>
                </div>
                <small>Confirmed prices only count toward the verdict</small>
              </div>
              <div class="store-list">${renderStoreLanes(audit)}</div>
            </section>

            ${renderHistoryPanel(audit)}
            ${renderBulkPanel(selected.id)}
            ${renderSourcePanel()}
          </div>

          <aside class="side-stack">
            ${renderAccountsPanel()}
            ${renderHealthPanel(selected)}
            ${renderGiftCardPanel()}
          </aside>
        </section>
      </main>
      ${renderToast()}
    </div>`;

  wireEvents();
}

function wireEvents() {
  document.getElementById("search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.searchTerm = document.getElementById("search-input")?.value || "";
    state.selectedProductId = "";
    render();
  });

  document.getElementById("clear-search")?.addEventListener("click", () => {
    state.searchTerm = "";
    state.selectedProductId = "";
    render();
  });

  document.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = products.find((item) => item.id === button.dataset.product);
      state.selectedProductId = button.dataset.product;
      state.searchTerm = product?.aliases[1] || product?.aliases[0] || product?.name || "";
      render();
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeMode = button.dataset.mode;
      render();
    });
  });

  document.querySelectorAll("[data-open-account]").forEach((button) => {
    button.addEventListener("click", () => {
      const account = accountConnections.find((item) => item.id === button.dataset.openAccount);
      if (!account) return;

      state.accountStatus[account.id] = "opened";
      state.toast = `${account.name} login link opened.`;
      writeJson(ACCOUNT_KEY, state.accountStatus);
      setTimeout(render, 120);
    });
  });

  document.querySelectorAll("[data-mark-ready]").forEach((button) => {
    button.addEventListener("click", () => {
      const account = accountConnections.find((item) => item.id === button.dataset.markReady);
      if (!account) return;
      state.accountStatus[account.id] = "ready";
      state.toast = `${account.name} marked ready for order import checks.`;
      writeJson(ACCOUNT_KEY, state.accountStatus);
      render();
    });
  });

  document.getElementById("receipt-toggle")?.addEventListener("click", () => {
    state.receiptPanelOpen = !state.receiptPanelOpen;
    render();
  });

  document.getElementById("receipt-save")?.addEventListener("click", () => {
    const lines = (document.getElementById("receipt-text")?.value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 20);

    if (!lines.length) {
      state.toast = "Paste at least one receipt line first.";
      render();
      return;
    }

    state.receiptEntries.unshift({
      id: Date.now(),
      savedAt: new Date().toISOString(),
      lines,
    });
    state.receiptEntries = state.receiptEntries.slice(0, 20);
    writeJson(RECEIPT_KEY, state.receiptEntries);
    state.receiptPanelOpen = false;
    state.toast = `Saved ${lines.length} receipt line${lines.length === 1 ? "" : "s"}.`;
    render();
  });
}

render();
