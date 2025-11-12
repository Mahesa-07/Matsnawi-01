// -*- coding: utf-8 -*-
// 📚 sidebar.js — Bab → Subbab → Bait Preview (ESModule Final + Flash Sidebar)

import { loadSubbab } from "./subbab.js";
import { showToast } from "./toast.js";

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const baitList = document.getElementById("baitList");

// =============================
// 🔹 Efek flash sidebar saat pertama kali load
// =============================
function flashSidebar(duration = 800) {
  sidebar.classList.add("show");
  menuToggle.textContent = "✖";

  setTimeout(() => {
    sidebar.classList.remove("show");
    menuToggle.textContent = "☰";
  }, duration);
}

// =============================
// 🔹 Membangun Sidebar Utama
// =============================
export async function buildSidebar() {
  if (!baitList) {
    console.warn("⚠️ Elemen #baitList tidak ditemukan di DOM.");
    return;
  }

  baitList.innerHTML = "";

  try {
    const res = await fetch("./assets/data/index.json");
    if (!res.ok) throw new Error("Gagal memuat index.json");
    const index = await res.json();

    for (const bab of index.files) {
      const babItem = document.createElement("div");
      babItem.className = "sidebar-bab";
      babItem.innerHTML = `<div class="bab-title" data-bab="${bab.bab}">${bab.title}</div>`;

      const subbabList = document.createElement("ul");
      subbabList.className = "subbab-list hidden";

      // 🔸 Loop setiap subbab
      for (let subIndex = 0; subIndex < bab.subbabs.length; subIndex++) {
        const sub = bab.subbabs[subIndex];

        const subItem = document.createElement("li");
        subItem.className = "subbab-item";
        subItem.innerHTML = `
          <div class="subbab-title" data-file="${sub.file}">
            ${sub.title}
            ${sub.description ? `<span class="desc">${sub.description}</span>` : ""}
          </div>
          <ul class="bait-sublist hidden"></ul>
        `;
        subbabList.appendChild(subItem);

        const subTitle = subItem.querySelector(".subbab-title");
        const baitSublist = subItem.querySelector(".bait-sublist");

        // Klik sekali → tampilkan preview bait
        subTitle.addEventListener("click", async () => {
          const visible = !baitSublist.classList.contains("hidden");
          document.querySelectorAll(".bait-sublist").forEach((l) => l.classList.add("hidden"));
          if (!visible) {
            await loadSubbabPreview(sub.file, baitSublist, bab, subIndex, sub);
            baitSublist.classList.remove("hidden");
          } else baitSublist.classList.add("hidden");
        });

        // Klik dua kali → langsung buka subbab
        subTitle.addEventListener("dblclick", () => {
          loadSubbab(sub.file, bab.bab, subIndex, sub.title);
          closeSidebar();
        });
      }

      const babTitle = babItem.querySelector(".bab-title");
      babTitle.addEventListener("click", () => {
        const visible = !subbabList.classList.contains("hidden");
        document.querySelectorAll(".subbab-list").forEach((l) => l.classList.add("hidden"));
        if (!visible) subbabList.classList.remove("hidden");
      });

      babItem.appendChild(subbabList);
      baitList.appendChild(babItem);
    }

    // 🔹 Flash sidebar hanya sekali
    if (!window._sidebarFlashed) {
      window._sidebarFlashed = true;
      flashSidebar(800); // durasi dalam ms
    }

  } catch (err) {
    console.error("❌ buildSidebar error:", err);
    baitList.innerHTML = "<li>⚠️ Gagal memuat daftar Bab</li>";
    showToast("Tidak bisa memuat daftar Bab.");
  }
}

// =============================
// 🔹 Memuat Preview Bait per Subbab
// =============================
async function loadSubbabPreview(file, subList, bab, subIndex, sub) {
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`Gagal memuat ${file}`);
    const data = await res.json();

    subList.innerHTML = data
      .map(
        (b) => `
        <li class="bait-item" data-id="${b.id}">
          <span class="bait-number">${b.id}.</span>
          <span class="bait-text">${(b.indo || "").slice(0, 30)}...</span>
        </li>`
      )
      .join("");

    subList.querySelectorAll(".bait-item").forEach((li) => {
      li.addEventListener("click", async () => {
        await loadSubbab(sub.file, bab.bab, subIndex, sub.title);
        const id = Number(li.dataset.id);
        const el = document.querySelector(`.bait[data-id='${id}']`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        closeSidebar();
      });
    });
  } catch (err) {
    console.error("❌ loadSubbabPreview error:", err);
    subList.innerHTML = "<li>⚠️ Gagal memuat bait</li>";
  }
}

// =============================
// 🔹 Kontrol Sidebar
// =============================
export function openSidebar() {
  sidebar.classList.add("show");
  menuToggle.textContent = "✖";
}
export function closeSidebar() {
  sidebar.classList.remove("show");
  menuToggle.textContent = "☰";
}

// =============================
// 🔹 Event Listener Global
// =============================
menuToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebar.classList.contains("show") ? closeSidebar() : openSidebar();
});

document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) closeSidebar();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar.classList.contains("show")) closeSidebar();
});

// 4️⃣ Efek klik untuk buka/tutup subbab (expand/collapse)
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("subbab-title")) {
    const sublist = e.target.nextElementSibling;
    if (sublist && sublist.classList.contains("bait-sublist")) {
      sublist.classList.toggle("show");
    }
  }
});
