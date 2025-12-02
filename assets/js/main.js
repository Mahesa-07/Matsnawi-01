// -*- coding: utf-8 -*-
// 🚀 Matsnawi Digital — ESModule 6 Version (Final Clean)

import { buildSidebar } from "./sidebar.js";
import { loadSubbab } from "./subbab.js";
import { showToast } from "./toast.js";
import { renderBookmarkList, toggleBookmarkPanel, closeBookmarkPanel } from "./bookmark.js";
import { toggleTranslation } from "./utils.js";
import "./search.js";

// ================================
// 🌐 Referensi Elemen DOM
// ================================
const themeToggle = document.getElementById("themeToggle");
const bookmarkToggle = document.getElementById("bookmark-toggle");
const bookmarkOverlay = document.getElementById("bookmark-overlay");
const toggleLangBtn = document.getElementById("toggleLangBtn");

// ================================
// 🚀 Init App
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🕓 Memulai Matsnawi Digital...");

  // ================================
  // 🌞 Set Default Theme to LIGHT
  // ================================
  const savedTheme = localStorage.getItem("theme");

  if (!savedTheme) {
    // No saved preference → default = light
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
  } else {
    // Restore user preference
    document.body.classList.toggle("light", savedTheme === "light");
  }

  // === Sinkronkan ikon toggle ===
  const syncUseTag = themeToggle?.querySelector("use");
  if (syncUseTag) {
    syncUseTag.setAttribute(
      "href",
      document.body.classList.contains("light") ? "#icon-sun" : "#icon-moon"
    );
  }

  // ================================
  // 🧩 Bangun Sidebar dinamis
  // ================================
  await buildSidebar();

  // ================================
  // 📘 Muat subbab pertama
  // ================================
  try {
    const res = await fetch("./assets/data/index.json");
    if (!res.ok) throw new Error("Gagal memuat index.json");

    const index = await res.json();
    const firstFile = index.files?.[0]?.subbabs?.[0];

    if (firstFile?.file) {
      await loadSubbab(firstFile.file, index.files[0].bab, 0, firstFile.title);
    }
  } catch (err) {
    console.error("❌ Error memuat subbab pertama:", err);
  }

  // ================================
  // 🌐 Tombol Ubah Bahasa
  // ================================
  toggleLangBtn?.addEventListener("click", toggleTranslation);

  // ================================
  // 🌗 Toggle Tema
  // ================================
  themeToggle?.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light");

    const useTag = themeToggle.querySelector("use");
    if (useTag) {
      useTag.setAttribute("href", isLight ? "#icon-sun" : "#icon-moon");
    }

    showToast(isLight ? "🌞 Mode Terang aktif" : "🌙 Mode Gelap aktif");
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });

  // ================================
  // 🔖 Sistem Bookmark
  // ================================
  bookmarkToggle?.addEventListener("click", toggleBookmarkPanel);
  bookmarkOverlay?.addEventListener("click", closeBookmarkPanel);
  renderBookmarkList();

  // ================================
  // ✨ Sorot bait dari sidebar
  // ================================
  sidebarHighlightHandler();

  // ================================
  // 🪶 Toast pertama kali
  // ================================
  showFirstTimeHint();

  console.log("✅ Matsnawi Digital Modular aktif");
});

// ================================
// 🪶 Toast Info Pertama Kali
// ================================
function showFirstTimeHint() {
  if (!localStorage.getItem("shownSwipeHint")) {
    showToast("📖 Selamat datang di Matsnawi Digital", 2500);
    localStorage.setItem("shownSwipeHint", "true");
  }
}

// ================================
// ✨ Efek sorot bait saat klik bait di sidebar
// ================================
function sidebarHighlightHandler() {
  document.addEventListener("click", (e) => {
    const baitItem = e.target.closest(".bait-item");
    if (!baitItem) return;

    const targetId = baitItem.dataset.target;
    const targetBait = document.getElementById(targetId);

    if (targetBait) {
      targetBait.scrollIntoView({ behavior: "smooth", block: "center" });

      document.querySelectorAll(".bait.highlighted")
        .forEach((b) => b.classList.remove("highlighted"));

      targetBait.classList.add("highlighted");
      setTimeout(() => targetBait.classList.remove("highlighted"), 2200);
    }
  });
}
/* =======================================================
⚡ HAPTIC ENGINE — Ripple + Micro Vibration
======================================================= */

function attachHapticToButtons(root = document) {
  const buttons = root.querySelectorAll(".bait-actions button, .btnDesc, .bookmark-btn, .sidebar-item");

  buttons.forEach(btn => {
    if (btn.dataset.haptic === "1") return; // Prevent double-binding
    btn.dataset.haptic = "1";

    btn.addEventListener("click", function(e) {
      // === Micro Haptic ===
      if (navigator.vibrate) navigator.vibrate(10);

      // === Ripple Element ===
      const ripple = document.createElement("span");
      ripple.classList.add("ripple");

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top  = `${e.clientY - rect.top  - size / 2}px`;

      btn.appendChild(ripple);

      setTimeout(() => ripple.remove(), 500);
    });
  });
}

// ⭐ Inisiasi pertama sekali
document.addEventListener("DOMContentLoaded", () => {
  attachHapticToButtons();
});

// ⭐ Panggil ulang setiap kali subbab selesai dimuat
window.attachHapticToButtons = attachHapticToButtons;