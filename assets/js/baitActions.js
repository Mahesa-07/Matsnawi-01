// -*- coding: utf-8 -*-
// 🎯 baitActions.js — Bookmark, Edit, Deskripsi

import { showToast } from "./toast.js";
import { openEditPanel } from "./editPanel.js";
import { toggleBookmark } from "./bookmark.js";

export function addBaitListeners() {
  const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]").map(Number);

  document.querySelectorAll(".bait").forEach((bait) => {
    const baitId = Number(bait.dataset.id);
    const btnBookmark = bait.querySelector(".btn-bookmark");
    const btnEdit = bait.querySelector(".btn-edit");
    const btnDesc = bait.querySelector(".btn-desc");

    // Bookmark aktif
    if (bookmarks.includes(baitId)) {
      btnBookmark?.classList.add("active");
      btnBookmark.innerHTML = `<svg width="20" height="20"><use href="#icon-bookmark-filled"></use></svg>`;
    } else {
      btnBookmark?.classList.remove("active");
      btnBookmark.innerHTML = `<svg width="20" height="20"><use href="#icon-bookmark"></use></svg>`;
    }

    // Edit
    btnEdit?.addEventListener("click", () => {
      const indoText = bait.querySelector(".bait-indo")?.textContent.trim() || "";
      openEditPanel(baitId, indoText);
    });

    // Deskripsi
    btnDesc?.addEventListener("click", () => {
      bait.querySelector(".bait-desc")?.classList.toggle("hidden");
    });

    // Bookmark
    btnBookmark?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBookmark(baitId);
      const isActive = btnBookmark.classList.toggle("active");
      const useTag = btnBookmark.querySelector("use");
      if (useTag) {
        useTag.setAttribute("href", isActive ? "#icon-bookmark-filled" : "#icon-bookmark");
      }
    });
  });
}

export function scrollToBait(id) {
  const baitElement =
    document.querySelector(`.bait[data-bait-index="${id}"]`) ||
    document.querySelector(`.bait[data-id="${id}"]`);

  if (baitElement) {
    baitElement.scrollIntoView({ behavior: "smooth", block: "center" });
    baitElement.classList.add("highlight-bait");
    setTimeout(() => baitElement.classList.remove("highlight-bait"), 1500);
  } else {
    console.warn(`⚠️ Bait ${id} tidak ditemukan.`);
    showToast(`❌ Bait ${id} tidak ditemukan di halaman ini.`);
  }
}