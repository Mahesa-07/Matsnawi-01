// -*- coding: utf-8 -*-
// 📖 subbab.js — Subbab Loader & Renderer (ESModule Final, v3.1)
// ⚙️ Bahasa default: Indonesia | Toggle Inggris via tombol 🇬🇧
// ✏️ Sekarang sudah terhubung dengan edit-panel (localStorage)

import { showToast } from "./toast.js";
import {
  escapeHtml,
  getGlobals,
  setGlobals,
  getShowTranslation
} from "./utils.js";
import { addBaitListeners } from "./baitActions.js";
import { applySavedEdits } from "./editPanel.js"; // 🔹 Tambahan penting

const baitContainer = document.getElementById("baitContainer");

// =========================
// 🔹 Tombol "Selanjutnya"
// =========================
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

      // 🔸 Masih ada subbab berikutnya
      if (currentSubIndex < subs.length - 1) {
        const nextSub = subs[currentSubIndex + 1];
        await loadSubbab(nextSub.file, babNow.bab, currentSubIndex + 1, nextSub.title);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // 🔸 Kalau tidak ada, lanjut ke bab berikutnya
      const nextBab = index.files[babNowIndex + 1];
      if (nextBab && nextBab.subbabs && nextBab.subbabs.length > 0) {
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

// =========================
// 🔹 Fungsi memuat Subbab
// =========================
export async function loadSubbab(file, babIndex, subIndex, title) {
  if (!file) return;

  console.log("🔍 Memuat subbab:", file, babIndex, subIndex, title);
  const { currentSubbab, cacheSubbabs } = getGlobals();

  // 🧩 Cegah muat ulang sama
  if (currentSubbab === file) {
    showToast(`⚠️ ${title} sudah aktif`);
    return;
  }

  setGlobals({ currentBab: babIndex, currentSubbab: file });

  // 🔸 Cek cache
  if (cacheSubbabs[file]) {
    const { data, offset } = cacheSubbabs[file];
    // 🔹 Terapkan edit tersimpan
    applySavedEdits(data);
    setGlobals({ baits: data, baitOffset: offset });
    renderBaits(data, offset);
    showToast(`📖 ${title} (cached)`);
    return;
  }

  try {
    // ======================
    // 🔹 Hitung Offset Total
    // ======================
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

    // ======================
    // 🔹 Ambil Data Subbab
    // ======================
    const res = await fetch(file);
    const json = await res.json();
    const data = Array.isArray(json) ? json : json.baits || [];

    if (!data.length) {
      console.warn(`⚠️ Subbab kosong di ${file}`);
      showToast("❌ Tidak ada bait ditemukan dalam subbab ini.");
      baitContainer.innerHTML = `<div class="no-results">Subbab ini kosong.</div>`;
      return;
    }

    // 🔹 Terapkan hasil edit dari localStorage
    applySavedEdits(data);

    // Simpan cache & update global
    cacheSubbabs[file] = { data, offset };
    setGlobals({ baits: data, baitOffset: offset });

    // Render bait
    renderBaits(data, offset);
    showToast(`📖 ${title} dimuat`);
  } catch (err) {
    console.error("❌ Error loadSubbab:", err);
    showToast("⚠️ Gagal memuat subbab.");
  }
}

// =========================
// 🔹 Render Bait
// =========================
export function renderBaits(baits, offset = 0) {
  const showTrans = getShowTranslation();
  baitContainer.classList.add("bait-exit");

  setTimeout(() => {
    baitContainer.classList.remove("bait-exit");
    baitContainer.classList.add("bait-enter");

    baitContainer.innerHTML = baits
      .map((b, i) => {
        const baitNumber = offset + i + 1;
        const textDisplay = showTrans
          ? `<div class="bait-eng">${escapeHtml(b.inggris || "")}</div>`
          : `<div class="bait-indo">${escapeHtml(b.indo || "")}</div>`;

        return `
          <div class="bait" data-id="${b.id || baitNumber}" data-bait-index="${i}">
            ${b.title ? `<h3 class="bait-title">${escapeHtml(b.title)}</h3>` : ""}
            ${textDisplay}
            ${b.description ? `<p class="bait-desc hidden">${escapeHtml(b.description)}</p>` : ""}
            <div class="bait-footer">
              <div class="bait-marker">﴾${baitNumber}﴿</div>
              <div class="bait-actions">
                <button class="btn-desc" title="Lihat Deskripsi">
                  <svg width="20" height="20"><use href="#icon-open"></use></svg>
                </button>
                <button class="btn-bookmark" title="Bookmark">
                  <svg width="20" height="20"><use href="#icon-bookmark"></use></svg>
                </button>
                <button class="btn-edit" title="Edit">
                  <svg width="20" height="20"><use href="#icon-edit"></use></svg>
                </button>
              </div>
            </div>
          </div>`;
      })
      .join("");

    addBaitListeners();
    addNextButtonIfEnd();

    // 🔸 Animasi halus
    requestAnimationFrame(() => {
      baitContainer.classList.add("bait-enter-active");
      setTimeout(() => baitContainer.classList.remove("bait-enter", "bait-enter-active"), 600);
    });
  }, 400);
}

// =========================
// 🔹 Bersihkan Bait
// =========================
export function clearBaits() {
  baitContainer.innerHTML = "";
}