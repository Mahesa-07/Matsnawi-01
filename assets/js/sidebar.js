// -*- coding: utf-8 -*-
// 📚 sidebar.js — FINAL ZEN + SMOOTH UI

import { loadSubbab } from "./subbab.js";
import { showToast } from "./toast.js";

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const baitList = document.getElementById("baitList");

let animLocked = false; // ⛔ Hindari animasi bertumpuk

function animateOnce(action, delay = 250) {
  if (animLocked) return;
  animLocked = true;
  action();
  setTimeout(() => (animLocked = false), delay);
}

// =============================
// ⚡ Flash Sidebar Saat Awal
// =============================
function flashSidebar(duration = 800) {
  animateOnce(() => {
    sidebar.classList.add("show");
    menuToggle.textContent = "✖";
  });
  setTimeout(() => {
    sidebar.classList.remove("show");
    menuToggle.textContent = "☰";
  }, duration);
}

// =============================
// 🧭 Build Sidebar Utama
// =============================
export async function buildSidebar() {
  if (!baitList) return console.warn("⚠️ #baitList tidak ditemukan.");

  baitList.innerHTML = "";

  try {
    const res = await fetch("./assets/data/index.json");
    if (!res.ok) throw new Error("Gagal memuat index.json");
    const index = await res.json();

    index.files.forEach((bab) => {
      const babItem = document.createElement("div");
      babItem.className = "sidebar-bab";
      babItem.innerHTML = `
        <div class="bab-title" data-bab="${bab.bab}">
          <span>${bab.title}</span>
          <span class="arrow">▶</span>
        </div>
      `;

      const subbabList = document.createElement("ul");
      subbabList.className = "subbab-list";

      bab.subbabs.forEach((sub, subIndex) => {
        const subItem = document.createElement("li");
        subItem.className = "subbab-item";
        subItem.innerHTML = `
          <div class="subbab-title" data-file="${sub.file}">
            ${sub.title}
            ${sub.description ? `<span class="desc">${sub.description}</span>` : ""}
          </div>
          <ul class="bait-sublist"></ul>
        `;

        subbabList.appendChild(subItem);

        const subTitle = subItem.querySelector(".subbab-title");
        const baitSublist = subItem.querySelector(".bait-sublist");

        // Klik sekali → Preview smooth
        subTitle.addEventListener("click", async (e) => {
          e.stopPropagation();

          const isVisible = baitSublist.classList.contains("show");

          document.querySelectorAll(".bait-sublist.show").forEach((l) => {
            l.classList.remove("show");
            l.style.transform = "scaleY(0)";
          });

          if (!isVisible) {
            await loadSubbabPreview(sub.file, baitSublist, bab, subIndex, sub);
            requestAnimationFrame(() => {
              baitSublist.classList.add("show");
              baitSublist.style.transform = "scaleY(1)";
            });
          } else {
            baitSublist.classList.remove("show");
            baitSublist.style.transform = "scaleY(0)";
          }
        });

        // Klik dua kali → Buka langsung
        subTitle.addEventListener("dblclick", () => {
          loadSubbab(sub.file, bab.bab, subIndex, sub.title);
          closeSidebar();
        });
      });

      const babTitle = babItem.querySelector(".bab-title");

      babTitle.addEventListener("click", (e) => {
        e.stopPropagation();
        const isVisible = subbabList.classList.contains("show");

        document.querySelectorAll(".subbab-list.show").forEach((list) => {
          list.classList.remove("show");
          list.style.transform = "scaleY(0)";
        });

        if (!isVisible) {
          animateOnce(() => {
            subbabList.classList.add("show");
            subbabList.style.transform = "scaleY(1)";
            babTitle.classList.add("show");
          });
        } else {
          subbabList.classList.remove("show");
          subbabList.style.transform = "scaleY(0)";
          babTitle.classList.remove("show");
        }
      });

      babItem.appendChild(subbabList);
      baitList.appendChild(babItem);
    });

    if (!window._sidebarFlashed) {
      window._sidebarFlashed = true;
      flashSidebar(650);
    }
  } catch (err) {
    console.error("❌ buildSidebar error:", err);
    baitList.innerHTML = "<li>⚠️ Gagal memuat daftar Bab</li>";
    showToast("Tidak bisa memuat daftar Bab.");
  }
}

// =============================
// 🪶 Preview Bait
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
          <span class="bait-text">${(b.indo || "").slice(0, 40)}...</span>
        </li>
      `
      )
      .join("");

    subList.querySelectorAll(".bait-item").forEach((li) => {
      li.addEventListener("click", async () => {
        await loadSubbab(sub.file, bab.bab, subIndex, sub.title);
        const el = document.querySelector(`.bait[data-id='${li.dataset.id}']`);
        if (el) {
          document.querySelectorAll(".bait.highlighted").forEach((b) => b.classList.remove("highlighted"));
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          requestAnimationFrame(() => el.classList.add("highlighted"));
          setTimeout(() => el.classList.remove("highlighted"), 2000);
        }
        closeSidebar();
      });
    });
  } catch (err) {
    console.error("❌ loadSubbabPreview error:", err);
    subList.innerHTML = "<li>⚠️ Gagal memuat bait</li>";
  }
}

// =============================
// 🎛 Kontrol Sidebar
// =============================
export const openSidebar = () => {
  animateOnce(() => {
    sidebar.classList.add("show");
    menuToggle.textContent = "✖";
  });
};

export const closeSidebar = () => {
  animateOnce(() => {
    sidebar.classList.remove("show");
    menuToggle.textContent = "☰";
  });
};

// =============================
// 🌐 Event Global
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