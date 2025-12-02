// 🔍 search.js — Fullscreen Overlay Search (FAST v2)
import { showToast } from "./toast.js";
import { loadSubbab } from "./subbab.js";

let allBaitsCache = null;
let searching = false;

// ======================
// ELEMENTS
// ======================
const searchInput = document.getElementById("searchInput");
const searchOverlay = document.getElementById("searchOverlay");
const searchField = document.getElementById("searchField");
const searchResults = document.getElementById("searchResults");
const closeSearchBtn = document.getElementById("closeSearch");

// ======================
// OPEN & CLOSE
// ======================
export function openSearch() {
  searchOverlay.classList.add("show");
  searchField.focus();
}

export function closeSearch() {
  searchOverlay.classList.remove("show");
  searchField.value = "";
  searchResults.innerHTML = "";
}

searchInput?.addEventListener("focus", openSearch);
closeSearchBtn?.addEventListener("click", closeSearch);
document.querySelectorAll(".icon-search").forEach(i => i.addEventListener("click", openSearch));

// ======================
// Escape Regex
// ======================
function escapeRegex(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// ======================
// SUPER FAST CACHE LOADER
// ======================
async function loadGlobalCache() {
  const indexRes = await fetch("./assets/data/index.json");
  const index = await indexRes.json();

  const tasks = [];

  index.files.forEach((bab) => {
    bab.subbabs.forEach((sub, i) => {
      tasks.push({
        bab,
        sub,
        subIndex: i,
        promise: fetch(sub.file).then(r => r.json())
      });
    });
  });

  const results = await Promise.all(tasks.map(t => t.promise));

  allBaitsCache = [];

  results.forEach((json, i) => {
    const t = tasks[i];
    const arr = Array.isArray(json) ? json : json.baits || [];

    arr.forEach((b, baitIndex) => {
      allBaitsCache.push({
        ...b,
        babNum: t.bab.bab,
        babTitle: t.bab.title,
        subTitle: t.sub.title || "",
        file: t.sub.file,
        subIndex: t.subIndex,
        baitIndex,
      });
    });
  });
}

// ======================
// LIVE SEARCH
// ======================
searchField?.addEventListener("input", async () => {
  const query = searchField.value.toLowerCase().trim();
  if (!query) {
    searchResults.innerHTML = "";
    return;
  }

  if (searching) return;
  searching = true;

  // FAST global cache load sekali saja
  if (!allBaitsCache) {
    try {
      await loadGlobalCache();
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat data global.");
      searching = false;
      return;
    }
  }

  // Filter cepat
  const q = query;
  const filtered = allBaitsCache.filter((b) =>
    (b.indo || "").toLowerCase().includes(q) ||
    (b.inggris || "").toLowerCase().includes(q) ||
    b.id?.toString() === q ||
    b.id?.toString().includes(q)
  );

  if (!filtered.length) {
    searchResults.innerHTML = `
      <div class="no-results">❌ Tidak ditemukan: "<b>${query}</b>"</div>`;
    searching = false;
    return;
  }

  // Render
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");

  searchResults.innerHTML = filtered
    .map((b) => {
      const baitNum = b.id || b.baitIndex + 1;
      const text = (b.indo || b.inggris || "").replace(
        regex,
        `<span class="highlight">$1</span>`
      );

      const info = `${b.babTitle}${b.subTitle ? " › " + b.subTitle : ""} › Bait ${baitNum}`;

      return `
        <div class="search-item"
             data-file="${b.file}"
             data-bab="${b.babNum}"
             data-sub="${b.subIndex}"
             data-title="${b.subTitle}"
             data-bait="${baitNum}">
          <div class="text"><span class="bait-number">[${baitNum}]</span>${text}</div>
          <small>${info}</small>
        </div>`;
    })
    .join("");

  // Klik hasil
  searchResults.querySelectorAll(".search-item").forEach((el) => {
    el.addEventListener("click", async () => {
      const file = el.dataset.file;
      const bab = parseInt(el.dataset.bab);
      const subIndex = parseInt(el.dataset.sub);
      const baitId = parseInt(el.dataset.bait);
      const title = el.dataset.title;

      showToast(`📖 Membuka ${title} (Bait ${baitId})...`);
      await loadSubbab(file, bab, subIndex, title);

      const baitEl = document.querySelector(`.bait[data-id='${baitId}']`);
      if (baitEl) {
        baitEl.scrollIntoView({ behavior: "smooth", block: "center" });
        baitEl.classList.add("search-highlight");
        setTimeout(() => baitEl.classList.remove("search-highlight"), 2000);
      }

      closeSearch();
      searching = false;
    });
  });

  searching = false;
});