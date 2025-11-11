// 🔍 search.js — Fullscreen Overlay Search
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

// Klik input utama di header → buka overlay
searchInput?.addEventListener("focus", openSearch);
closeSearchBtn?.addEventListener("click", closeSearch);

// ======================
// LIVE SEARCH HANDLER
// ======================
searchField?.addEventListener("input", async () => {
  const query = searchField.value.toLowerCase().trim();
  if (!query) {
    searchResults.innerHTML = "";
    return;
  }

  if (searching) return;
  searching = true;

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

  searchResults.innerHTML = filtered
    .map((b) => {
      const text = (b.indo || b.inggris || "").replace(
        new RegExp(`(${query})`, "gi"),
        `<span class="highlight">$1</span>`
      );
      return `
        <div class="search-item"
             data-file="${b.file}"
             data-bab="${b.babNum}"
             data-sub="${b.subIndex}"
             data-title="${b.subTitle}">
          <div class="text">${text}</div>
          <small>📘 ${b.babTitle}${b.subTitle ? " › " + b.subTitle : ""}</small>
        </div>`;
    })
    .join("");

  // klik hasil
  searchResults.querySelectorAll(".search-item").forEach((el) => {
    el.addEventListener("click", async () => {
      const file = el.dataset.file;
      const bab = parseInt(el.dataset.bab);
      const subIndex = parseInt(el.dataset.sub);
      const title = el.dataset.title;
      showToast(`📖 Membuka ${title}...`);
      await loadSubbab(file, bab, subIndex, title);
      closeSearch();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  searching = false;
});