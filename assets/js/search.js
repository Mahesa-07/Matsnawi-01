// 🔍 search.js — Fullscreen Overlay Search (ESModule Final)
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

// Klik input & ikon search → buka overlay
searchInput?.addEventListener("focus", openSearch);
closeSearchBtn?.addEventListener("click", closeSearch);
document.querySelectorAll(".icon-search").forEach(icon => icon.addEventListener("click", openSearch));

// ======================
// HELPER: Escape Regex
// ======================
function escapeRegex(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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

  // 🔹 Load data global jika belum ada
  if (!allBaitsCache) {
    try {
      const indexRes = await fetch("./assets/data/index.json");
      const index = await indexRes.json();
      allBaitsCache = [];

      for (const bab of index.files) {
        for (let i = 0; i < bab.subbabs.length; i++) {
          const sub = bab.subbabs[i];
          const res = await fetch(sub.file);
          const arr = await res.json();
          const data = Array.isArray(arr) ? arr : arr.baits || [];

          data.forEach((b, baitIndex) => {
            allBaitsCache.push({
              ...b,
              babNum: bab.bab,
              babTitle: bab.title,
              subTitle: sub.title || "",
              file: sub.file,
              subIndex: i,
              baitIndex,
            });
          });
        }
      }
    } catch (err) {
      console.error("❌ Gagal memuat data global:", err);
      showToast("Gagal memuat data global.");
      searching = false;
      return;
    }
  }

  // 🔹 Filter berdasarkan query
  const filtered = allBaitsCache.filter(
    (b) =>
      (b.indo || "").toLowerCase().includes(query) ||
      (b.inggris || "").toLowerCase().includes(query)
  );

  if (!filtered.length) {
    searchResults.innerHTML = `
      <div class="no-results">
        ❌ Tidak ditemukan hasil untuk "<b>${query}</b>".
      </div>`;
    searching = false;
    return;
  }

  // 🔹 Render hasil
  const queryRegex = new RegExp(`(${escapeRegex(query)})`, "gi");
  searchResults.innerHTML = filtered
    .map((b) => {
      const baitNum = b.id || b.baitIndex + 1;

      // teks bait dengan highlight + nomor bait
      const text = (b.indo || b.inggris || "").replace(
        queryRegex,
        `<span class="highlight">$1</span>`
      );
      const combinedText = `<span class="bait-number">[${baitNum}]</span>${text}`;

      // info compact
      const info = `${b.babTitle}${b.subTitle ? " › " + b.subTitle : ""} › Bait ${baitNum}`;

      return `
        <div class="search-item"
             data-file="${b.file}"
             data-bab="${b.babNum}"
             data-sub="${b.subIndex}"
             data-title="${b.subTitle}"
             data-bait="${baitNum}">
          <div class="text">${combinedText}</div>
          <small>${info}</small>
        </div>`;
    })
    .join("");

  // 🔹 Klik hasil → buka subbab & scroll ke bait + highlight smooth
  searchResults.querySelectorAll(".search-item").forEach((el) => {
    el.addEventListener("click", async () => {
      const file = el.dataset.file;
      const bab = parseInt(el.dataset.bab);
      const subIndex = parseInt(el.dataset.sub);
      const baitId = parseInt(el.dataset.bait);
      const title = el.dataset.title;

      showToast(`📖 Membuka ${title} (Bait ${baitId})...`);
      await loadSubbab(file, bab, subIndex, title);

      if (!isNaN(baitId)) {
        const baitEl = document.querySelector(`.bait[data-id='${baitId}']`);
        if (baitEl) {
          baitEl.scrollIntoView({ behavior: "smooth", block: "center" });

          // highlight smooth
          baitEl.classList.add("search-highlight");
          setTimeout(() => {
            baitEl.classList.remove("search-highlight");
          }, 2000);
        } else {
          console.warn(`⚠️ Bait ${baitId} tidak ditemukan di DOM.`);
        }
      }

      closeSearch();
      searching = false;
    });
  });

  searching = false;
});