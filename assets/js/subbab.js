// -*- coding: utf-8 -*-
// 📖 subbab.js — Subbab Loader & Renderer (ESModule Final, v3.2)
// ⚙️ Bahasa default per-bait (disimpan per ID)
// ✏️ Terhubung dengan Edit Panel + Cache Subbab

import { showToast } from "./toast.js";
import {
  escapeHtml,
  getGlobals,
  setGlobals,
} from "./utils.js";
import { addBaitListeners } from "./baitActions.js";
import { applySavedEdits } from "./editPanel.js";

const baitContainer = document.getElementById("baitContainer");

// =======================================================
// 🔹 LocalStorage untuk bahasa per-bait
// =======================================================
function getBaitLangState() {
  return JSON.parse(localStorage.getItem("baitLangState") || "{}");
}

function saveBaitLangState(state) {
  localStorage.setItem("baitLangState", JSON.stringify(state));
}

// =======================================================
// 🔹 Tombol Selanjutnya
// =======================================================
export function addNextButtonIfEnd() {
  const old = document.querySelector(".next-sub-btn");
  if (old) old.remove();

  const nextBtn = document.createElement("button");
  nextBtn.className = "next-sub-btn";
  nextBtn.innerHTML = "⟩⟩ Selanjutnya";

  nextBtn.addEventListener("click", async () => {
    try {
      const { currentBab, currentSubbab } = getGlobals();
      const res = await fetch("./assets/data/index.json");
      const index = await res.json();

      const babNowIndex = index.files.findIndex((b) => b.bab === currentBab);
      const babNow = index.files[babNowIndex];
      if (!babNow) return showToast("⚠️ Bab tidak ditemukan.");

      const subs = babNow.subbabs || [];
      const currentSubIndex = subs.findIndex((s) => s.file === currentSubbab);

      // 🔸 Ada subbab berikutnya
      if (currentSubIndex < subs.length - 1) {
        const nextSub = subs[currentSubIndex + 1];
        await loadSubbab(nextSub.file, babNow.bab, currentSubIndex + 1, nextSub.title);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // 🔸 Tidak ada → ke bab berikutnya
      const nextBab = index.files[babNowIndex + 1];
      if (nextBab && nextBab.subbabs?.length > 0) {
        const firstSub = nextBab.subbabs[0];
        await loadSubbab(firstSub.file, nextBab.bab, 0, firstSub.title);
        showToast(`📖 ${nextBab.title || "Bab berikutnya"} dimulai`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        showToast("✨ Kamu sudah di akhir karya ini.");
      }
    } catch (err) {
      console.error("❌ Error nextSubbab:", err);
      showToast("⚠️ Tidak bisa memuat subbab berikutnya.");
    }
  });

  baitContainer.appendChild(nextBtn);
}

// =======================================================
// 🔹 Memuat Subbab
// =======================================================
export async function loadSubbab(file, babIndex, subIndex, title) {
  if (!file) return;

  console.log("🔍 Memuat subbab:", file, babIndex, subIndex);
  const { currentSubbab, cacheSubbabs } = getGlobals();

  // Cegah muat ulang sama
  if (currentSubbab === file) {
    showToast(`⚠️ ${title} sudah aktif`);
    return;
  }

  setGlobals({ currentBab: babIndex, currentSubbab: file });

  // 🔸 Cache
  if (cacheSubbabs[file]) {
    const { data, offset } = cacheSubbabs[file];
    applySavedEdits(data);
    setGlobals({ baits: data, baitOffset: offset });
    renderBaits(data, offset);
    showToast(`📖 ${title} (cached)`);
    return;
  }

  try {
    // =====================================================
    // 🔹 Hitung Offset Global
    // =====================================================
    let offset = 0;
    const indexRes = await fetch("./assets/data/index.json");
    const index = await indexRes.json();

    for (const bab of index.files) {
      if (bab.bab < babIndex) {
        for (const s of bab.subbabs) {
          const r = await fetch(s.file);
          const arr = await r.json();
          offset += Array.isArray(arr)
            ? arr.length
            : (arr.baits?.length || 0);
        }
      } else if (bab.bab === babIndex) {
        for (let i = 0; i < subIndex; i++) {
          const r = await fetch(bab.subbabs[i].file);
          const arr = await r.json();
          offset += Array.isArray(arr)
            ? arr.length
            : (arr.baits?.length || 0);
        }
        break;
      }
    }

    // =====================================================
    // 🔹 Ambil Data Subbab
    // =====================================================
    const res = await fetch(file);
    const json = await res.json();
    const data = Array.isArray(json) ? json : json.baits || [];

    if (!data.length) {
      baitContainer.innerHTML = `<div class="no-results">Subbab ini kosong.</div>`;
      showToast("❌ Tidak ada bait dalam subbab.");
      return;
    }

    applySavedEdits(data);

    cacheSubbabs[file] = { data, offset };
    setGlobals({ baits: data, baitOffset: offset });

    renderBaits(data, offset);
    showToast(`📖 ${title} dimuat`);
  } catch (err) {
    console.error("❌ Error loadSubbab:", err);
    showToast("⚠️ Gagal memuat subbab.");
  }
}

// =======================================================
// 🔹 FUNGSI RENDER BAIT (utama)
// =======================================================
export function renderBaits(baits = null, offset = 0) {
  if (!baits) {
    const globals = getGlobals();
    baits = globals.baits;
    offset = globals.baitOffset;
  }

  const edits = JSON.parse(localStorage.getItem("baitEdits") || "{}");
  const langState = getBaitLangState();

  baitContainer.classList.add("bait-exit");

  setTimeout(() => {
    baitContainer.classList.remove("bait-exit");
    baitContainer.classList.add("bait-enter");

    baitContainer.innerHTML = baits
      .map((b, i) => {
        const baitNumber = offset + i + 1;
        const baitId = b.id || baitNumber;
        const isEdited = !!edits[baitId];

        const engText = b.inggris || "";
        const indoText = b.indo || "";
        const safeDesc = b.description || "";
        const safeTitle = escapeHtml(b.title || "");

        // Bahasa per bait
        const isEng = langState[baitId] === true;
        const textDisplay = isEng
          ? `<div class="bait-eng">${engText}</div>`
          : `<div class="bait-indo">${indoText}</div>`;

        const langLabel = isEng ? "Inggris" : "Indonesia";

        return `
<div class="bait" data-id="${baitId}" data-bait-index="${i}">
  ${safeTitle ? `<h3 class="bait-title">${safeTitle}</h3>` : ""}
  ${textDisplay}
  ${safeDesc ? `<p class="bait-desc hidden">${safeDesc}</p>` : ""}

  <div class="bait-footer">
    <div class="bait-marker">
      ﴾${baitNumber}﴿
      ${isEdited ? `<span class="edit-indicator">°</span>` : ""}
    </div>

    <div class="bait-actions">
      <button class="btn-desc">
        <svg width="20" height="20"><use href="#icon-collapse"></use></svg>
      </button>

      <button class="btn-bookmark">
        <svg width="20" height="20"><use href="#icon-bookmark"></use></svg>
      </button>

      <button class="btn-edit">
        <svg width="20" height="20"><use href="#icon-edit"></use></svg>
      </button>

      <button class="toggle-lang-btn icon-btn" data-bait="${baitId}">
        <svg width="20" height="20"><use href="#icon-language"></use></svg>
        <span>${langLabel}</span>
      </button>
    </div>
  </div>
</div>`;
      })
      .join("");

    addBaitListeners();
    initLangToggleButtons();
    addNextButtonIfEnd();

    requestAnimationFrame(() => {
      baitContainer.classList.add("bait-enter-active");
      setTimeout(() => baitContainer.classList.remove("bait-enter", "bait-enter-active"), 600);
    });
  }, 400);
}

// =======================================================
// 🔹 Toggle Bahasa PER BAIT
// =======================================================
function initLangToggleButtons() {
  const langState = getBaitLangState();

  document.querySelectorAll(".toggle-lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-bait");
      langState[id] = !langState[id]; // toggle
      saveBaitLangState(langState);
      renderBaits(); // refresh tampilan bait
    });
  });
}

// =======================================================
export function clearBaits() {
  baitContainer.innerHTML = "";
}
