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
const WATCHLIST_KEY = "grocery-scout-watchlist";

const productVisuals = {
  "milo-original-bars-210": { label: "MILO", tone: "green", pack: "10 pack / 210g" },
  "cadbury-dairy-milk-180": { label: "CAD", tone: "purple", pack: "180g block" },
  "sensodyne-repair-protect": { label: "SEN", tone: "blue", pack: "100g tube" },
  "head-shoulders-660": { label: "H&S", tone: "navy", pack: "660ml bottle" },
  "solo-10-pack": { label: "SOLO", tone: "yellow", pack: "10 x 375ml cans" },
  "dettol-wipes": { label: "DET", tone: "teal", pack: "120 wipes" },
  "musashi-protein-bar-90": { label: "MUS", tone: "dark", pack: "90g bar" },
};

const historySeeds = {
  "milo-original-bars-210": [
    { label: "Jul 25", coles: 9, woolworths: 9, note: "Regular shelf" },
    { label: "Aug 25", coles: 9, woolworths: 9, note: "No half-price record" },
    { label: "Sep 25", coles: 9, woolworths: 8.8, note: "Small movement" },
    { label: "Oct 25", coles: 8.75, woolworths: 9, note: "Minor dip" },
    { label: "Nov 25", coles: 9, woolworths: 9, note: "Regular shelf" },
    { label: "Dec 25", coles: 9.2, woolworths: 9, note: "Holiday shelf" },
    { label: "Jan 26", coles: 9, woolworths: 9, note: "Regular shelf" },
    { label: "Feb 26", coles: 9, woolworths: 9.1, note: "Recall check month" },
    { label: "Mar 26", coles: 9, woolworths: 9, note: "No special" },
    { label: "Apr 26", coles: 9, woolworths: 9, note: "No special" },
    { label: "May 26", coles: 9, woolworths: 9, note: "No special" },
    { label: "Jun 26", coles: 9, woolworths: 9, note: "No special" },
    { label: "Jul 26", coles: 9, woolworths: 9, note: "Today" },
  ],
  "cadbury-dairy-milk-180": [
    { label: "Jan", coles: 6.5, woolworths: 6.5, note: "Shelf" },
    { label: "Feb", coles: 3.25, woolworths: 5.5, note: "Coles half-price" },
    { label: "Mar", coles: 5.5, woolworths: 3.25, note: "Woolworths half-price" },
    { label: "Apr", coles: 5.5, woolworths: 5.5, note: "Shelf" },
    { label: "May", coles: 4.5, woolworths: 5.5, note: "Special" },
    { label: "Jun", coles: 5.5, woolworths: 5.5, note: "Shelf" },
    { label: "Jul", coles: 3.25, woolworths: 5.5, note: "Future Coles drop" },
  ],
  "musashi-protein-bar-90": [
    { label: "Jan", coles: 6.9, woolworths: 6.9, note: "Shelf" },
    { label: "Feb", coles: 5.5, woolworths: 6.9, note: "Minor special" },
    { label: "Mar", coles: 6.9, woolworths: 3.45, note: "Half price" },
    { label: "Apr", coles: 6.9, woolworths: 6.9, note: "Shelf" },
    { label: "May", coles: 6.9, woolworths: 6.9, note: "Shelf" },
    { label: "Jun", coles: 6.9, woolworths: 3.45, note: "Half price" },
    { label: "Jul", coles: 6.9, woolworths: 3.45, note: "Verified watch" },
  ],
};

const state = {
  selectedProductId: "milo-original-bars-210",
  catalogueSearch: "",
  category: "All",
  sort: "watch",
  specialsOnly: false,
  historyRange: "12m",
  receiptOpen: false,
  accountStatus: readJson(ACCOUNT_KEY, {}),
  receiptEntries: readJson(RECEIPT_KEY, []),
  watchlist: new Set(readJson(WATCHLIST_KEY, ["milo-original-bars-210"])),
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
    calendar: '<path d="M7 3v4"/><path d="M17 3v4"/><path d="M4 8h16"/><path d="M5 5h14v15H5Z"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    external: '<path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M20 14v5H5V4h5"/>',
    filter: '<path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>',
    heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.4 5.4 0 1 0-7.7 7.7L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.7Z"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    lock: '<rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    pin: '<path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/>',
    receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/>',
    search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
    settings: '<path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19 12h2"/><path d="M3 12h2"/><path d="m17 7 1.5-1.5"/><path d="m5.5 18.5L7 17"/><path d="m17 17 1.5 1.5"/><path d="M5.5 5.5 7 7"/>',
    tag: '<path d="M20 12 12 20 4 12V4h8Z"/><path d="M7.5 7.5h.01"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.check}</svg>`;
}

function auditFor(product) {
  if (livePriceAudits[product.id]) return livePriceAudits[product.id];

  return {
    checkedAt: "9 Jul 2026",
    location: `${locationProfile.suburb} ${locationProfile.postcode}`,
    productName: product.name,
    recommendation: "Compare live checkout before buying",
    recommendationDetail: "This product has catalogue leads, but no complete live audit yet.",
    goodBuyPrice: product.watchTarget,
    futureSignal: "No confirmed future price signal yet.",
    historySignal: "History will improve from receipt imports and retailer login checks.",
    rows: product.offers.map((offer) => ({
      retailer: offer.retailer,
      match: offer.tag,
      pack: offer.packNote || product.unitLabel,
      grams: null,
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

function offersFor(product) {
  return auditFor(product).rows;
}

function bestOffer(product) {
  return offersFor(product)
    .filter((row) => row.price != null)
    .slice()
    .sort((a, b) => a.price - b.price)[0];
}

function selectedProduct() {
  return products.find((product) => product.id === state.selectedProductId) || products[0];
}

function categories() {
  return ["All", ...Array.from(new Set(products.map((product) => product.category)))];
}

function productSearchHaystack(product) {
  return [product.name, product.category, ...product.aliases].join(" ").toLowerCase();
}

function filteredProducts() {
  const term = state.catalogueSearch.trim().toLowerCase();
  let list = products.filter((product) => {
    const categoryMatch = state.category === "All" || product.category === state.category;
    const termMatch = !term || productSearchHaystack(product).includes(term);
    const specialMatch = !state.specialsOnly || product.offers.some((offer) => /half|special|future|catalogue/i.test(offer.tag));
    return categoryMatch && termMatch && specialMatch;
  });

  if (state.sort === "price") {
    list = list.slice().sort((a, b) => (bestOffer(a)?.price ?? 9999) - (bestOffer(b)?.price ?? 9999));
  } else if (state.sort === "watch") {
    list = list.slice().sort((a, b) => {
      const watchDelta = Number(state.watchlist.has(b.id)) - Number(state.watchlist.has(a.id));
      return watchDelta || (bestOffer(a)?.price ?? 9999) - (bestOffer(b)?.price ?? 9999);
    });
  } else {
    list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }
  return list;
}

function visualFor(product) {
  return productVisuals[product.id] || {
    label: product.name.slice(0, 3).toUpperCase(),
    tone: "neutral",
    pack: product.unitLabel,
  };
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

function shortRetailer(retailer) {
  if (!retailer) return "No retailer";
  return retailer.replace(" Croydon", "").replace(" Ringwood", "").replace(" AU", "");
}

function historyFor(product, audit) {
  if (historySeeds[product.id]) return historySeeds[product.id];
  const best = bestOffer(product);
  const target = product.watchTarget || audit.goodBuyPrice || best?.price || 1;
  const current = best?.price || target * 1.25;
  return [
    { label: "Jan", coles: current * 1.18, woolworths: current * 1.12, note: "Seed" },
    { label: "Feb", coles: current, woolworths: current * 1.08, note: "Seed" },
    { label: "Mar", coles: target, woolworths: current, note: "Target week" },
    { label: "Apr", coles: current, woolworths: target, note: "Target week" },
    { label: "May", coles: current * 0.95, woolworths: current, note: "Special" },
    { label: "Jun", coles: current, woolworths: current * 0.97, note: "Recent" },
    { label: "Jul", coles: best?.price || current, woolworths: best?.price || current, note: "Today" },
  ];
}

function historyPointsForRange(product, audit) {
  const points = historyFor(product, audit);
  if (state.historyRange === "3m") return points.slice(-4);
  if (state.historyRange === "6m") return points.slice(-7);
  if (state.historyRange === "12m") return points.slice(-13);
  return points;
}

function historyValues(points) {
  return points.flatMap((point) => [point.coles, point.woolworths]).filter((value) => value != null);
}

function stepPathFor(points, key, min, max, width, height, padX, padY) {
  const span = Math.max(max - min, 1);
  const coords = points.map((point, index) => ({
    x: padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2),
    y: padY + (1 - (point[key] - min) / span) * (height - padY * 2),
  }));
  return coords
    .map((point, index) => {
      if (index === 0) return `M${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      const previous = coords[index - 1];
      return `H${point.x.toFixed(1)} V${point.y.toFixed(1)}`;
    })
    .join(" ");
}

function renderHistoryChart(product, audit) {
  const points = historyPointsForRange(product, audit);
  const values = historyValues(points);
  const target = audit.goodBuyPrice || product.watchTarget;
  const min = Math.max(0, Math.min(...values, target || Infinity) * 0.85);
  const max = Math.max(...values, target || 0) * 1.12;
  const width = 760;
  const height = 300;
  const padX = 48;
  const padY = 34;
  const colesPath = stepPathFor(points, "coles", min, max, width, height, padX, padY);
  const wooliesPath = stepPathFor(points, "woolworths", min, max, width, height, padX, padY);
  const targetY = target == null ? null : padY + (1 - (target - min) / Math.max(max - min, 1)) * (height - padY * 2);
  const labels = [max, (max + min) / 2, min].map((value) => formatMoney(value).replace(".00", ""));

  return `
    <svg class="history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Price history chart">
      <path class="grid" d="M48 34H730M48 150H730M48 266H730" />
      ${labels
        .map((label, index) => `<text class="axis-label" x="6" y="${index === 0 ? 39 : index === 1 ? 155 : 270}">${escapeHtml(label)}</text>`)
        .join("")}
      ${points
        .map((point, index) => {
          const x = padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
          return `<text class="date-label" x="${x.toFixed(1)}" y="294">${escapeHtml(point.label)}</text>`;
        })
        .join("")}
      ${targetY == null ? "" : `<path class="target-line" d="M48 ${targetY.toFixed(1)}H730" />`}
      <path class="coles-line" d="${colesPath}" />
      <path class="woolies-line" d="${wooliesPath}" />
      ${points
        .map((point, index) => {
          const x = padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
          const y = padY + (1 - (point.coles - min) / Math.max(max - min, 1)) * (height - padY * 2);
          return `<circle class="point coles-point" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" />`;
        })
        .join("")}
    </svg>`;
}

function priceStats(product, audit) {
  const points = historyFor(product, audit);
  const values = historyValues(points);
  const best = bestOffer(product);
  const last = points[points.length - 1];
  const previous = points[points.length - 2] || last;
  const lastAvg = ((last?.coles || 0) + (last?.woolworths || 0)) / 2;
  const previousAvg = ((previous?.coles || 0) + (previous?.woolworths || 0)) / 2;
  return {
    current: best?.price ?? lastAvg,
    currentRetailer: shortRetailer(best?.retailer),
    target: audit.goodBuyPrice || product.watchTarget,
    lowest: Math.min(...values),
    highest: Math.max(...values),
    average: values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1),
    trend: lastAvg <= previousAvg ? "Down or flat" : "Up",
  };
}

function renderHeader() {
  return `
    <header class="app-header">
      <a class="brand" href="#top">${icon("basket", 28)}<strong>Grocery Scout 3136</strong></a>
      <div class="location-pill">${icon("pin", 17)}<span>${locationProfile.suburb} ${locationProfile.postcode}</span><button>Change</button></div>
      <form class="global-search" id="catalogue-search-form">
        ${icon("search", 19)}
        <input id="catalogue-search-input" value="${escapeHtml(state.catalogueSearch)}" placeholder="Search products, brands or categories..." />
        <button type="submit">Search</button>
      </form>
      <nav class="top-nav">
        <a href="#watchlist">${icon("heart", 17)} Watchlist</a>
        <a href="#accounts">${icon("receipt", 17)} Receipts</a>
        <a href="#history">${icon("chart", 17)} Reports</a>
        <a href="#sources">${icon("settings", 17)} Settings</a>
      </nav>
    </header>`;
}

function renderCatalogue() {
  const visibleProducts = filteredProducts();
  return `
    <aside class="catalogue-panel" id="top">
      <div class="catalogue-head">
        <div>
          <span>Product catalogue</span>
          <strong>${products.length} tracked products</strong>
        </div>
        <div class="catalogue-actions">
          <button class="all-products-button" data-all-products>All products</button>
          <button class="filter-button" aria-label="Filter products">${icon("filter", 17)}</button>
        </div>
      </div>
      <form class="catalogue-search" id="side-search-form">
        ${icon("search", 17)}
        <input id="side-search-input" value="${escapeHtml(state.catalogueSearch)}" placeholder="Search in products..." />
      </form>
      <div class="category-row">
        ${categories()
          .map(
            (category) => `
              <button class="${state.category === category ? "active" : ""}" data-category="${escapeHtml(category)}">
                ${escapeHtml(category)}
              </button>`,
          )
          .join("")}
      </div>
      <div class="sort-row">
        <label>Sort:
          <select id="sort-select">
            <option value="watch" ${state.sort === "watch" ? "selected" : ""}>Watchlist first</option>
            <option value="price" ${state.sort === "price" ? "selected" : ""}>Lowest price</option>
            <option value="best" ${state.sort === "best" ? "selected" : ""}>A-Z</option>
          </select>
        </label>
        <label class="special-toggle">
          <input id="specials-only" type="checkbox" ${state.specialsOnly ? "checked" : ""} />
          On special
        </label>
        <span>${visibleProducts.length} shown</span>
      </div>
      <div class="catalogue-table-label"><span>Product</span><span>Today from</span></div>
      <div class="product-list">
        ${visibleProducts.map(renderProductRow).join("") || `<div class="empty-list">No products match this search.</div>`}
      </div>
      <div class="catalogue-footer"><button data-all-products>Show all ${products.length} products</button><span>Connect accounts to grow this list from receipts.</span></div>
    </aside>`;
}

function productBadges(product) {
  const tags = product.offers.map((offer) => offer.tag);
  const badges = [];
  if (state.watchlist.has(product.id)) badges.push("Watching");
  if (tags.some((tag) => /half/i.test(tag))) badges.push("Half price");
  else if (tags.some((tag) => /special|catalogue/i.test(tag))) badges.push("Special");
  if (tags.some((tag) => /future/i.test(tag))) badges.push("Future drop");
  if (tags.some((tag) => /bulk|costco/i.test(tag))) badges.push("Bulk check");
  return badges.slice(0, 3);
}

function renderProductRow(product) {
  const visual = visualFor(product);
  const best = bestOffer(product);
  const isSelected = product.id === state.selectedProductId;
  const badges = productBadges(product);
  return `
    <button class="product-row ${isSelected ? "selected" : ""}" data-product="${product.id}" data-product-id="${product.id}">
      <span class="product-thumb ${visual.tone}"><b>${escapeHtml(visual.label)}</b><small>${escapeHtml(visual.pack.split(" / ")[0])}</small></span>
      <span class="product-meta">
        <strong>${escapeHtml(product.name)}</strong>
        <small>${escapeHtml(visual.pack)}</small>
        <span class="product-badges">${badges.map((badge) => `<em>${escapeHtml(badge)}</em>`).join("")}</span>
      </span>
      <span class="product-price">
        <strong>${formatMoney(best?.price)}</strong>
        <small>${escapeHtml(shortRetailer(best?.retailer))}</small>
      </span>
      ${icon("chevron", 15)}
    </button>`;
}

function renderProductHero(product, audit) {
  const visual = visualFor(product);
  const stats = priceStats(product, audit);
  const watched = state.watchlist.has(product.id);
  return `
    <section class="product-hero">
      <div class="hero-thumb ${visual.tone}">${escapeHtml(visual.label)}</div>
      <div class="hero-main">
        <span>${escapeHtml(product.category)}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <p>${escapeHtml(visual.pack)} / ${escapeHtml(audit.location)} / Checked ${escapeHtml(audit.checkedAt)}</p>
        <div class="hero-actions">
          <button id="watch-toggle">${icon("heart", 16)} ${watched ? "Watching" : "Add to watchlist"}</button>
          <button id="price-alert">${icon("alert", 16)} Price alert at ${formatMoney(stats.target)}</button>
        </div>
      </div>
      <div class="price-range">
        <span>Typical price range</span>
        <strong>${formatMoney(stats.lowest)} - ${formatMoney(stats.highest)}</strong>
        <small>Today from ${formatMoney(stats.current)} at ${escapeHtml(stats.currentRetailer)}</small>
      </div>
    </section>`;
}

function renderHistoryPanel(product, audit) {
  const stats = priceStats(product, audit);
  const points = historyFor(product, audit);
  const latest = points[points.length - 1];
  const bestMonth = points.reduce((best, point) => Math.min(point.coles, point.woolworths) < Math.min(best.coles, best.woolworths) ? point : best, points[0]);
  return `
    <section class="history-panel" id="history">
      <div class="section-head">
        <div>
          <span>Price history</span>
          <h2>History for ${escapeHtml(product.name)}</h2>
        </div>
        <div class="range-tabs">
          ${["3m", "6m", "12m", "all"]
            .map((range) => `<button class="${state.historyRange === range ? "active" : ""}" data-range="${range}">${range.toUpperCase()}</button>`)
            .join("")}
        </div>
      </div>
      <div class="chart-layout">
        <div class="chart-card">
          <div class="legend"><span class="coles-key">Coles</span><span class="woolies-key">Woolworths</span><span class="target-key">Best buy target</span></div>
          ${renderHistoryChart(product, audit)}
        </div>
        <div class="history-stats">
          <div><span>Current</span><strong>${formatMoney(stats.current)}</strong><small>${escapeHtml(stats.currentRetailer)}</small></div>
          <div><span>Best target</span><strong>${formatMoney(stats.target)}</strong><small>Buy at or below</small></div>
          <div><span>Lowest tracked</span><strong>${formatMoney(stats.lowest)}</strong><small>Seed/import history</small></div>
          <div><span>Average</span><strong>${formatMoney(stats.average)}</strong><small>${escapeHtml(stats.trend)}</small></div>
        </div>
      </div>
      <div class="history-summary">
        <div><span>Latest point</span><strong>${escapeHtml(latest.label)}</strong><small>Coles ${formatMoney(latest.coles)} / Woolworths ${formatMoney(latest.woolworths)}</small></div>
        <div><span>Best month shown</span><strong>${escapeHtml(bestMonth.label)}</strong><small>${escapeHtml(bestMonth.note)}</small></div>
        <div><span>Future signal</span><strong>${escapeHtml(audit.futureSignal)}</strong><small>Catalogue preview is separated from current price.</small></div>
      </div>
      <div class="history-ledger" aria-label="Price history ledger">
        <div class="history-ledger-head"><span>Month</span><span>Coles</span><span>Woolworths</span><span>Signal</span></div>
        ${points
          .slice()
          .reverse()
          .map(
            (point) => `
              <div class="history-ledger-row">
                <strong>${escapeHtml(point.label)}</strong>
                <span>${formatMoney(point.coles)}</span>
                <span>${formatMoney(point.woolworths)}</span>
                <em>${escapeHtml(point.note)}</em>
              </div>`,
          )
          .join("")}
      </div>
      <p class="history-note">${escapeHtml(audit.historySignal)} Imported receipts and account checks will replace the seed history over time.</p>
    </section>`;
}

function renderRetailerTable(product, audit) {
  return `
    <section class="retailer-panel" id="prices">
      <div class="section-head">
        <div>
          <span>Today's prices - compare stores</span>
          <h2>${escapeHtml(locationProfile.suburb)} ${escapeHtml(locationProfile.postcode)}</h2>
        </div>
        <small>Confirmed prices count toward the recommendation</small>
      </div>
      <div class="retailer-grid">
        ${offersFor(product)
          .map(
            (row) => `
              <article class="retailer-card ${retailerClass(row.retailer)}">
                <strong>${escapeHtml(shortRetailer(row.retailer))}</strong>
                <span class="retailer-price">${formatMoney(row.price)}</span>
                <small>${escapeHtml(row.unit)} / ${escapeHtml(row.pack)}</small>
                <em>${escapeHtml(row.action)}</em>
                <a href="${row.url}" target="_blank" rel="noreferrer">View price ${icon("external", 14)}</a>
              </article>`,
          )
          .join("")}
      </div>
    </section>`;
}

function renderMovements(product, audit) {
  const points = historyFor(product, audit).slice(-5).reverse();
  return `
    <section class="movements-panel">
      <div class="section-head">
        <div>
          <span>Recent price movements</span>
          <h2>What changed recently</h2>
        </div>
        <a href="#history">View full history</a>
      </div>
      <div class="movement-grid">
        ${points
          .map((point, index) => {
            const previous = points[index + 1] || point;
            const delta = point.coles - previous.coles;
            const direction = delta <= 0 ? "down" : "up";
            return `
              <article class="${direction}">
                ${icon(direction === "down" ? "check" : "alert", 17)}
                <strong>${escapeHtml(point.label)} - ${escapeHtml(point.note)}</strong>
                <span>Coles ${formatMoney(previous.coles)} -> ${formatMoney(point.coles)}</span>
              </article>`;
          })
          .join("")}
      </div>
    </section>`;
}

function renderRecommendation(product, audit) {
  const stats = priceStats(product, audit);
  const saving = stats.current - stats.target;
  const wait = saving > 0.5;
  return `
    <section class="side-card recommendation-card">
      <div class="side-title">${icon("alert", 17)} Smart recommendation</div>
      <div class="recommendation ${wait ? "wait" : "buy"}">
        <strong>${wait ? "WAIT" : "BUY"}</strong>
        <span>${escapeHtml(audit.recommendation)}</span>
      </div>
      <ul class="decision-list">
        <li>${icon("check", 15)} Best target: <strong>${formatMoney(stats.target)} or less</strong></li>
        <li>${icon("check", 15)} Chance of better price: <strong>${wait ? "High" : "Low"}</strong></li>
        <li>${icon("calendar", 15)} Next check: <strong>${escapeHtml(weekWindows[0].range)}</strong></li>
        <li>${icon("tag", 15)} Potential saving: <strong>${saving > 0 ? formatMoney(saving) : "$0.00"}</strong></li>
      </ul>
    </section>`;
}

function renderBulk(product) {
  const bulk = bulkDecisionCases.find((item) => item.productId === product.id) || bulkDecisionCases[0];
  return `
    <section class="side-card" id="bulk">
      <div class="side-title">${icon("basket", 17)} Costco bulk break-even</div>
      <p>${escapeHtml(bulk.note)}</p>
      <div class="mini-metric"><span>Beat current</span><strong>${formatMoney(bulk.sameBarsNowLimit)}</strong></div>
      <div class="mini-metric"><span>Beat half-price</span><strong>${formatMoney(bulk.sameBarsHalfLimit)}</strong></div>
    </section>`;
}

function accountMeta(account) {
  const status = state.accountStatus[account.id] || "not-connected";
  if (status === "ready") return { label: "Ready to import", tone: "ready" };
  if (status === "opened") return { label: "Login opened", tone: "pending" };
  return { label: account.status, tone: "idle" };
}

function renderAccounts() {
  return `
    <section class="side-card" id="accounts">
      <div class="side-title">${icon("lock", 17)} Accounts and import</div>
      <p>Open retailer logins in your browser, then mark ready. This page stores only local status, not passwords.</p>
      <div class="account-list">
        ${accountConnections
          .map((account) => {
            const meta = accountMeta(account);
            return `
              <article class="account-line ${meta.tone}">
                <div><strong>${escapeHtml(account.name)}</strong><span>${escapeHtml(meta.label)}</span></div>
                <a href="${account.loginUrl}" target="_blank" rel="noreferrer" data-open-account="${account.id}">Connect</a>
                <button data-mark-ready="${account.id}" title="Mark ready after login">${icon("check", 14)}</button>
              </article>`;
          })
          .join("")}
      </div>
      <button class="receipt-button" id="receipt-toggle">${icon("upload", 16)} Paste receipt lines</button>
      ${state.receiptOpen ? renderReceiptForm() : `<small>${state.receiptEntries.length} receipts saved locally</small>`}
    </section>`;
}

function renderImportedHistory() {
  const recentLines = state.receiptEntries.flatMap((entry) => entry.lines.map((line) => ({ line, savedAt: entry.savedAt }))).slice(0, 4);
  return `
    <section class="side-card import-history-card">
      <div class="side-title">${icon("receipt", 17)} Purchase history</div>
      <div class="mini-metric"><span>Imported receipts</span><strong>${state.receiptEntries.length}</strong></div>
      ${
        recentLines.length
          ? `<div class="receipt-history">${recentLines
              .map((item) => `<span>${escapeHtml(item.line)}<small>${new Date(item.savedAt).toLocaleDateString("en-AU")}</small></span>`)
              .join("")}</div>`
          : `<p>No purchase history imported yet. Paste receipts or mark retailer accounts ready, then the tracker can compare your usual buy price against current and future specials.</p>`
      }
    </section>`;
}

function renderReceiptForm() {
  return `
    <div class="receipt-form">
      <textarea id="receipt-text" rows="5" placeholder="Coles MILO bars $9.00&#10;Woolworths yoghurt $5.50"></textarea>
      <button id="receipt-save">Save receipt history</button>
    </div>`;
}

function renderHealth(product) {
  const profile = healthProfiles[product.id] || healthProfiles["milo-original-bars-210"];
  const swap = cravingSwaps[0];
  return `
    <section class="side-card" id="health">
      <div class="side-title">${icon("heart", 17)} Health note</div>
      <strong>${escapeHtml(profile.verdict)}</strong>
      <p>${escapeHtml(profile.summary)}</p>
      <div class="swap-line"><span>Try instead</span><strong>${escapeHtml(swap.name)}</strong><small>${escapeHtml(swap.why)}</small></div>
    </section>`;
}

function renderGiftCards() {
  return `
    <section class="side-card" id="gift-cards">
      <div class="side-title">${icon("tag", 17)} Gift card stack</div>
      ${giftCardDeals
        .slice(0, 3)
        .map((deal) => `<a class="gift-line" href="${deal.url}" target="_blank" rel="noreferrer"><strong>${escapeHtml(deal.retailer)}</strong><span>${escapeHtml(deal.title)}</span></a>`)
        .join("")}
    </section>`;
}

function renderSources() {
  return `
    <section class="sources-panel" id="sources">
      <div class="section-head">
        <div>
          <span>Sources checked</span>
          <h2>Retailer and price-history sources</h2>
        </div>
      </div>
      <div class="source-grid">
        ${sourceHealth
          .map((source) => `<a href="${source.url}" target="_blank" rel="noreferrer"><strong>${escapeHtml(source.name)}</strong><span>${escapeHtml(source.cadence)} / ${escapeHtml(source.status)}</span></a>`)
          .join("")}
      </div>
    </section>`;
}

function renderToast() {
  return state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : "";
}

function render() {
  const product = selectedProduct();
  const audit = auditFor(product);
  root.innerHTML = `
    <div class="tracker-shell">
      ${renderHeader()}
      <main class="tracker-layout">
        ${renderCatalogue()}
        <section class="detail-column">
          ${renderProductHero(product, audit)}
          <nav class="detail-tabs">
            <a href="#history">Price history</a>
            <a href="#prices">Today's prices</a>
            <a href="#movements">Movements</a>
            <a href="#sources">Sources</a>
          </nav>
          ${renderHistoryPanel(product, audit)}
          ${renderRetailerTable(product, audit)}
          <div id="movements">${renderMovements(product, audit)}</div>
          ${renderSources()}
        </section>
        <aside class="decision-column">
          ${renderRecommendation(product, audit)}
          ${renderBulk(product)}
          ${renderAccounts()}
          ${renderImportedHistory()}
          ${renderHealth(product)}
          ${renderGiftCards()}
        </aside>
      </main>
      ${renderToast()}
    </div>`;
  wireEvents();
}

function submitSearch(inputId) {
  state.catalogueSearch = document.getElementById(inputId)?.value || "";
  const first = filteredProducts()[0];
  if (first) state.selectedProductId = first.id;
  render();
}

function wireEvents() {
  document.getElementById("catalogue-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitSearch("catalogue-search-input");
  });

  document.getElementById("side-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitSearch("side-search-input");
  });

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      render();
    });
  });

  document.getElementById("sort-select")?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  document.getElementById("specials-only")?.addEventListener("change", (event) => {
    state.specialsOnly = event.target.checked;
    render();
  });

  document.querySelectorAll("[data-all-products]").forEach((button) => {
    button.addEventListener("click", () => {
      state.catalogueSearch = "";
      state.category = "All";
      state.specialsOnly = false;
      render();
    });
  });

  document.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedProductId = button.dataset.product;
      render();
    });
  });

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => {
      state.historyRange = button.dataset.range;
      render();
    });
  });

  document.getElementById("watch-toggle")?.addEventListener("click", () => {
    const product = selectedProduct();
    if (state.watchlist.has(product.id)) {
      state.watchlist.delete(product.id);
      state.toast = `${product.name} removed from watchlist.`;
    } else {
      state.watchlist.add(product.id);
      state.toast = `${product.name} added to watchlist.`;
    }
    writeJson(WATCHLIST_KEY, Array.from(state.watchlist));
    render();
  });

  document.getElementById("price-alert")?.addEventListener("click", () => {
    state.toast = "Price alert saved locally. A backend can later turn this into real email/push alerts.";
    render();
  });

  document.querySelectorAll("[data-open-account]").forEach((link) => {
    link.addEventListener("click", () => {
      state.accountStatus[link.dataset.openAccount] = "opened";
      writeJson(ACCOUNT_KEY, state.accountStatus);
      setTimeout(render, 120);
    });
  });

  document.querySelectorAll("[data-mark-ready]").forEach((button) => {
    button.addEventListener("click", () => {
      const account = accountConnections.find((item) => item.id === button.dataset.markReady);
      state.accountStatus[button.dataset.markReady] = "ready";
      state.toast = `${account?.name || "Account"} marked ready for import.`;
      writeJson(ACCOUNT_KEY, state.accountStatus);
      render();
    });
  });

  document.getElementById("receipt-toggle")?.addEventListener("click", () => {
    state.receiptOpen = !state.receiptOpen;
    render();
  });

  document.getElementById("receipt-save")?.addEventListener("click", () => {
    const lines = (document.getElementById("receipt-text")?.value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 30);

    if (!lines.length) {
      state.toast = "Paste at least one receipt line first.";
      render();
      return;
    }

    state.receiptEntries.unshift({ id: Date.now(), savedAt: new Date().toISOString(), lines });
    state.receiptEntries = state.receiptEntries.slice(0, 40);
    writeJson(RECEIPT_KEY, state.receiptEntries);
    state.receiptOpen = false;
    state.toast = `Saved ${lines.length} receipt line${lines.length === 1 ? "" : "s"} into history.`;
    render();
  });
}

render();
