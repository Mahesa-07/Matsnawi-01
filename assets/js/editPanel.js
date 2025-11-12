// -*- coding: utf-8 -*-
// 📝 editPanel.js — Panel Edit Bait dengan Sinkronisasi dan LocalStorage

import { showToast } from "./toast.js";
import { getGlobals, setGlobals } from "./utils.js";
import { renderBaits } from "./subbab.js";

const editPanel = document.getElementById("edit-panel");
const editIndo = document.getElementById("edit-indo");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const exportBtn = document.getElementById("exportEditBtn");
const importBtn = document.getElementById("importEditBtn");

// ================================
// 🔹 Buka Panel Edit
// ================================
export function openEditPanel(baitId, indoText = "") {
  editIndo.value = indoText || "";
  setGlobals({ editingBait: { id: baitId, indo: indoText } });

  editPanel.style.display = "block";
  requestAnimationFrame(() => {
    editPanel.classList.add("open");
  });
}

// ================================
// 🔹 Tutup Panel Edit
// ================================
function closeEditPanel() {
  editPanel.classList.remove("open");
  setTimeout(() => (editPanel.style.display = "none"), 250);
  setGlobals({ editingBait: null });
}

// ================================
// 🔹 Simpan Perubahan
// ================================
saveEditBtn?.addEventListener("click", () => {
  const globals = getGlobals();
  const editing = globals.editingBait;
  const newIndo = editIndo.value.trim();

  if (!editing || !editing.id) {
    showToast("⚠️ Tidak ada bait yang sedang diedit.");
    return;
  }

  const baits = globals.baits || [];
  const bait = baits.find((b) => b.id === editing.id);
  if (bait) bait.indo = newIndo;

  // Simpan ke localStorage
  localStorage.setItem("editedBaits", JSON.stringify(baits));

  // Render ulang
  renderBaits();
  closeEditPanel();
  showToast("✅ Bait disimpan!");
});

// ================================
// 🔹 Batal
// ================================
cancelEditBtn?.addEventListener("click", closeEditPanel);

// ================================
// 🔹 Ekspor / Impor
// ================================
exportBtn?.addEventListener("click", () => {
  const data = localStorage.getItem("editedBaits") || "[]";
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "edited_baits.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("📤 Ekspor selesai!");
});

importBtn?.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        localStorage.setItem("editedBaits", JSON.stringify(imported));
        showToast("✅ Impor berhasil!");
        renderBaits();
      } catch {
        showToast("❌ File tidak valid.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
});