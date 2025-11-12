// ✏️ Edit Panel — Hanya Bahasa Indonesia + Ekspor/Impor/Reset
import { renderBaits } from "./subbab.js";
import { showToast } from "./toast.js";
import { setGlobals, getGlobals } from "./utils.js";

const editPanel = document.getElementById("edit-panel");
const editIndo = document.getElementById("edit-indo");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const exportBtn = document.getElementById("exportEditsBtn");
const importBtn = document.getElementById("importEditsBtn");
const resetBtn  = document.getElementById("resetEditsBtn");

// ===============================
// 🔹 Buka Panel Edit
// ===============================
export function openEditPanel(baitId, indoText = "") {
  editIndo.value = indoText;
  setGlobals({ editingBait: { id: baitId, indo: indoText } });

  editPanel.setAttribute("aria-hidden", "false");
  editPanel.classList.add("show");
}

// ===============================
// 🔹 Tutup Panel Edit
// ===============================
export function closeEditPanel() {
  editPanel.classList.remove("show");
  editPanel.setAttribute("aria-hidden", "true");
  setGlobals({ editingBait: null });
}

// ===============================
// 🔹 Simpan Perubahan
// ===============================
saveEditBtn?.addEventListener("click", () => {
  const globals = getGlobals();
  const editing = globals.editingBait;
  if (!editing) return;

  const newIndo = editIndo.value.trim();

  const bait = globals.baits.find((b) => b.id === editing.id);
  if (bait) {
    bait.indo = newIndo;
  }

  const edits = JSON.parse(localStorage.getItem("baitEdits") || "{}");
  edits[editing.id] = { indo: newIndo };
  localStorage.setItem("baitEdits", JSON.stringify(edits));

  renderBaits();
  closeEditPanel();
  showToast("✅ Bait disimpan sementara (lokal)");
});

// ===============================
// 🔹 Batal Edit
// ===============================
cancelEditBtn?.addEventListener("click", closeEditPanel);

// ===============================
// 🔹 Terapkan edit dari localStorage saat render
// ===============================
export function applySavedEdits(baits) {
  const edits = JSON.parse(localStorage.getItem("baitEdits") || "{}");
  baits.forEach((b) => {
    if (edits[b.id]) {
      b.indo = edits[b.id].indo;
    }
  });
}

// ===============================
// 📤 EKSPOR Editan ke JSON (dengan timestamp)
// ===============================
exportBtn?.addEventListener("click", () => {
  const edits = JSON.parse(localStorage.getItem("baitEdits") || "{}");
  if (!Object.keys(edits).length) {
    showToast("⚠️ Tidak ada editan untuk diekspor");
    return;
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const filename = `bait_edits_${timestamp}.json`;

  const blob = new Blob([JSON.stringify(edits, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  showToast(`📦 Editan diekspor: ${filename}`);
});

// ===============================
// 📥 IMPOR Editan dari JSON
// ===============================
importBtn?.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        localStorage.setItem("baitEdits", JSON.stringify(imported));
        showToast(`✅ Editan dari "${file.name}" berhasil diimpor`);
        renderBaits();
      } catch (err) {
        console.error(err);
        showToast("❌ Gagal memuat file editan");
      }
    };
    reader.readAsText(file);
  };

  input.click();
});

// ===============================
// 🔄 RESET Editan Lokal
// ===============================
resetBtn?.addEventListener("click", () => {
  if (confirm("Yakin ingin menghapus semua editan lokal?")) {
    localStorage.removeItem("baitEdits");
    renderBaits();
    showToast("♻️ Semua editan lokal dihapus");
  }
});