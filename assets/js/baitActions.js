// -*- coding: utf-8 -*-
// 🎯 baitActions.js — Bookmark, Edit, Deskripsi (ESModule Sinkron Final)

import { showToast } from "./toast.js";
import { openEditPanel } from "./editPanel.js";
import { toggleBookmark } from "./bookmark.js";

// =============================
// 🔹 Tambah Listener untuk Semua Bait
// =============================
export function addBaitListeners() {
  const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]").map(Number);

  // Hapus dulu semua listener lama untuk mencegah duplikasi
  document.querySelectorAll(".bait").forEach((bait) => {
    const newBait = bait.cloneNode(true);
    bait.parentNode.replaceChild(newBait, bait);
  });

  document.querySelectorAll(".bait").forEach((bait) => {
    const baitId = Number(bait.dataset.id);
    const btnBookmark = bait.querySelector(".btn-bookmark");
    const btnEdit = bait.querySelector(".btn-edit");
    const btnDesc = bait.querySelector(".btn-desc");

    // 🔸 Bookmark aktif/tidak
    if (bookmarks.includes(baitId)) {
      btnBookmark?.classList.add("active");
      btnBookmark.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24">
          <use href="#icon-bookmark-filled"></use>
        </svg>`;
    } else {
      btnBookmark?.classList.remove("active");
      btnBookmark.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24">
          <use href="#icon-bookmark"></use>
        </svg>`;
    }

    // === Tombol Edit ===
    btnEdit?.addEventListener("click", () => {
      const indoText = bait.querySelector(".bait-indo")?.textContent?.trim() || "";
      const engText = bait.querySelector(".bait-eng")?.textContent?.trim() || "";
      const descText = bait.querySelector(".bait-desc")?.textContent?.trim() || "";

      // Pastikan panel menerima payload berbentuk string
      openEditPanel({
        id: baitId,
        eng: engText,
        indo: indoText,
        desc: descText,
      });
    });

    // === Tombol Deskripsi ===
    btnDesc?.addEventListener("click", () => {
      const descEl = bait.querySelector(".bait-desc");
      if (descEl) {
        descEl.classList.toggle("hidden");
        descEl.classList.toggle("fade-in");
      }
    });

    // === Tombol Bookmark ===
    btnBookmark?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBookmark(baitId);

      const isActive = btnBookmark.classList.toggle("active");
      const useTag = btnBookmark.querySelector("use");

      if (useTag) {
        useTag.setAttribute(
          "href",
          isActive ? "#icon-bookmark-filled" : "#icon-bookmark"
        );
      }

      showToast(isActive ? "🔖 Ditambahkan ke bookmark" : "❌ Dihapus dari bookmark");
    });
  });
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