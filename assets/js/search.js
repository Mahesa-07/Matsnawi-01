// search.js — ZEN FIXED v4 (main thread, debounce + worker + fallback)
import { showToast } from "./toast.js";
import { loadSubbab } from "./subbab.js";

const searchInput = document.getElementById("searchInput");
const searchOverlay = document.getElementById("searchOverlay");
const searchField = document.getElementById("searchField");
const searchResults = document.getElementById("searchResults");
const closeSearchBtn = document.getElementById("closeSearch");

let worker = null;
let workerReady = false;
let fallbackCache = null;
let debounceTimer = null;
let runningSearch = false;

// open/close
export function openSearch() {
  searchOverlay?.classList.add("show");
  setTimeout(() => searchField?.focus(), 40);
}
export function closeSearch() {
  searchOverlay?.classList.remove("show");
  if (searchField) searchField.value = "";
  if (searchResults) searchResults.innerHTML = "";
}

searchInput?.addEventListener("focus", openSearch);
closeSearchBtn?.addEventListener("click", closeSearch);
document.querySelectorAll(".icon-search").forEach(i => i.addEventListener("click", openSearch));

// helpers
function escapeHtml(s) {
  return (s || "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return (s || "").toString().replace(/"/g, "&quot;");
}
function escapeRegex(s) {
  return (s || "").toString().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// init worker
function initWorker() {
  if (!window.Worker) return false;
  try {
    worker = new Worker("./js/search.worker.js", { type: "classic" }); // path updated to /js/
  } catch (e) {
    try {
      worker = new Worker("./js/search.worker.js", { type: "module" });
    } catch (err) {
      console.warn("Worker init failed:", err);
      worker = null;
      return false;
    }
  }

  worker.onmessage = (ev) => {
    const msg = ev.data;
    if (!msg) return;
    if (msg.type === "ready") {
      workerReady = true;
    } else if (msg.type === "results") {
      renderResults(msg.results || [], msg.q || "");
      runningSearch = false;
    } else if (msg.type === "error") {
      console.error("Worker error:", msg.message);
      runningSearch = false;
      showToast("Pencarian error di worker.");
    }
  };

  worker.onerror = (err) => {
    console.error("Worker global error:", err);
    worker = null;
    workerReady = false;
  };

  // start building cache
  try {
    worker.postMessage({ type: "init" });
  } catch (e) {
    console.warn("Worker postMessage failed", e);
  }
  return true;
}

// fallback cache builder (main thread, parallel)
async function buildFallbackCache() {
  if (fallbackCache) return fallbackCache;

  const idxRes = await fetch("./assets/data/index.json");
  const index = await idxRes.json();

  const tasks = [];
  index.files.forEach((bab) => {
    bab.subbabs.forEach((sub, i) => {
      tasks.push({
        babNum: bab.bab,
        babTitle: bab.title,
        subTitle: sub.title || "",
        file: sub.file,
        subIndex: i,
        promise: fetch(sub.file).then(r => r.ok ? r.json().catch(()=>[]) : [])
      });
    });
  });

  const results = await Promise.all(tasks.map(t => t.promise));
  const cache = [];
  results.forEach((json, i) => {
    const t = tasks[i];
    const arr = Array.isArray(json) ? json : (json.baits || []);
    arr.forEach((b, baitIndex) => {
      cache.push({
        id: b.id ?? (baitIndex + 1),
        indo: b.indo ?? "",
        inggris: b.inggris ?? "",
        title: b.title ?? "",
        description: b.description ?? "",
        babNum: t.babNum,
        babTitle: t.babTitle,
        subTitle: t.subTitle,
        file: t.file,
        subIndex: t.subIndex,
        baitIndex
      });
    });
  });

  fallbackCache = cache;
  return cache;
}

// render results
function renderResults(results = [], q = "") {
  if (!searchResults) return;
  if (!results.length) {
    searchResults.innerHTML = `<div class="no-results">❌ Tidak ditemukan: "<b>${escapeHtml(q)}</b>"</div>`;
    return;
  }

  const limited = results.slice(0, 300);
  const regex = new RegExp(`(${escapeRegex(q)})`, "gi");

  searchResults.innerHTML = limited.map((b) => {
    const baitNum = b.id ?? (b.baitIndex + 1);
    const text = escapeHtml((b.indo || b.inggris || "")).replace(regex, `<span class="highlight">$1</span>`);
    const info = `${escapeHtml(b.babTitle)}${b.subTitle ? " › " + escapeHtml(b.subTitle) : ""} › Bait ${baitNum}`;
    return `
      <div class="search-item"
           data-file="${escapeAttr(b.file)}"
           data-bab="${escapeAttr(b.babNum)}"
           data-sub="${escapeAttr(b.subIndex)}"
           data-bait="${escapeAttr(b.id ?? baitNum)}"
           data-title="${escapeAttr(b.subTitle || "")}">
        <div class="text"><span class="bait-number">[${baitNum}]</span>${text}</div>
        <small>${info}</small>
      </div>`;
  }).join("");

  // attach click handlers
  searchResults.querySelectorAll(".search-item").forEach((el) => {
    el.addEventListener("click", async () => {
      try {
        const file = el.dataset.file;
        const bab = parseInt(el.dataset.bab);
        const subIndex = parseInt(el.dataset.sub);
        const baitId = parseInt(el.dataset.bait);
        const title = el.dataset.title;

        showToast(`📖 Membuka ${title || "subbab"} (Bait ${baitId})...`);
        await loadSubbab(file, bab, subIndex, title);

        if (!isNaN(baitId)) {
          requestAnimationFrame(() => {
            const baitEl = document.querySelector(`.bait[data-id='${baitId}']`);
            if (baitEl) {
              baitEl.scrollIntoView({ behavior: "smooth", block: "center" });
              baitEl.classList.add("search-highlight");
              setTimeout(() => baitEl.classList.remove("search-highlight"), 2000);
            } else {
              console.warn(`Bait ${baitId} not found in DOM.`);
            }
          });
        }

        closeSearch();
      } catch (err) {
        console.error("Error opening subbab from search item:", err);
        showToast("Gagal membuka subbab.");
      }
    });
  });
}

// search pipeline (debounced)
async function runSearch(q) {
  if (!q || !q.trim()) {
    searchResults.innerHTML = "";
    runningSearch = false;
    return;
  }

  // prefer worker
  if (worker) {
    try {
      worker.postMessage({ type: "search", q });
      return;
    } catch (e) {
      console.warn("Worker post failed, falling back:", e);
      worker = null;
    }
  }

  // fallback main-thread search
  try {
    const cache = await buildFallbackCache();
    const qLow = q.toLowerCase();
    const filtered = cache.filter(b =>
      (b.indo || "").toLowerCase().includes(qLow) ||
      (b.inggris || "").toLowerCase().includes(qLow) ||
      (b.title || "").toLowerCase().includes(qLow) ||
      b.id?.toString().includes(qLow)
    );
    renderResults(filtered, q);
  } catch (err) {
    console.error("Fallback search error:", err);
    showToast("Gagal memuat data pencarian.");
  } finally {
    runningSearch = false;
  }
}

// debounce input
searchField?.addEventListener("input", () => {
  const q = (searchField.value || "").trim();
  if (!q) {
    searchResults.innerHTML = "";
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (runningSearch) return;
    runningSearch = true;
    if (worker && !workerReady) {
      searchResults.innerHTML = `<div class="loading">Mencari…</div>`;
      const check = setInterval(() => {
        if (workerReady) {
          clearInterval(check);
          runSearch(q);
        }
      }, 80);
    } else {
      runSearch(q);
    }
  }, 200);
});

// startup
(function startup() {
  const ok = initWorker();
  if (!ok) {
    console.info("Worker unsupported — fallback mode enabled.");
  }
})();