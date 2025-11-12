// -*- coding: utf-8 -*-
// 🎯 baitActions.js — Bookmark, Edit, Deskripsi (ESModule Final)

import { showToast } from "./toast.js";
import { openEditPanel } from "./editPanel.js";
import { toggleBookmark } from "./bookmark.js";

// =============================
// 🔹 Tambah Listener untuk Semua Bait
// =============================
export function addBaitListeners() {
  const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]").map(Number);

  document.querySelectorAll(".bait").forEach((bait) => {
    const baitId = Number(bait.dataset.id);
    const btnBookmark = bait.querySelector(".btn-bookmark");
    const btnEdit = bait.querySelector(".btn-edit");
    const btnDesc = bait.querySelector(".btn-desc");

    // 🔸 Tandai tombol aktif jika sudah di-bookmark
    if (bookmarks.includes(baitId)) {
      btnBookmark?.classList.add("active");
      btnBookmark.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24">
          <use href="#icon-bookmark-filled"></use>
        </svg>
      `;
    } else {
      btnBookmark?.classList.remove("active");
      btnBookmark.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24">
          <use href="#icon-bookmark"></use>
        </svg>
      `;
    }

    // === Tombol Edit ===
    btnEdit?.addEventListener("click", () => {
      const indoText = bait.querySelector(".bait-indo")?.textContent.trim() || "";
      const engText = bait.querySelector(".bait-eng")?.textContent.trim() || "";
      openEditPanel(baitId, engText, indoText);
    });

    // === Tombol Deskripsi ===
    btnDesc?.addEventListener("click", () => {
      bait.querySelector(".bait-desc")?.classList.toggle("hidden");
    });

    // === Tombol Bookmark ===
    btnBookmark?.addEventListener("click", (e) => {
      e.stopPropagation(); // cegah klik ganda pada parent
      toggleBookmark(baitId);

      // Update tampilan langsung (tanpa reload)
      const isActive = btnBookmark.classList.toggle("active");

      // Ambil elemen <use> di dalam tombol
      const useTag = btnBookmark.querySelector("use");

      // Ganti ikon sesuai status
      if (useTag) {
        useTag.setAttribute(
          "href",
          isActive ? "#icon-bookmark-filled" : "#icon-bookmark"
        );
      }
    });
  }); // ← penting: tutup forEach
}

// =============================
// 🔹 Scroll ke Bait Tertentu
// =============================
export function scrollToBait(id) {
  const baitElement =
    document.querySelector(`.bait[data-bait-index="${id}"]`) ||
    document.querySelector(`.bait[data-id="${id}"]`);

  if (baitElement) {
    baitElement.scrollIntoView({ behavior: "smooth", block: "center" });
    baitElement.classList.add("highlight-bait");
    setTimeout(() => baitElement.classList.remove("highlight-bait"), 1500);
  } else {
    console.warn(`⚠️ Bait dengan ID ${id} tidak ditemukan.`);
    showToast(`❌ Bait ${id} tidak ditemukan di halaman ini.`);
  }
}