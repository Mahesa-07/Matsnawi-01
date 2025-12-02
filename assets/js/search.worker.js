// search.worker.js
// WebWorker: build cache (parallel) + fast filtering
// Messages:
//  - { type: "init" }      -> respond { type: "ready" }
//  - { type: "search", q } -> respond { type: "results", q, results }
//  - errors -> { type: "error", message }

self._cache = null;
self._readyPromise = null;

function escapeForRegex(s) {
  return (s || "").toString().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

async function buildCache() {
  if (self._cache) return self._cache;

  const idxRes = await fetch("./assets/data/index.json");
  if (!idxRes.ok) throw new Error("Gagal memuat index.json");
  const index = await idxRes.json();

  const tasks = [];
  index.files.forEach((bab) => {
    bab.subbabs.forEach((sub, i) => {
      // promise returns parsed json or [] on error
      const p = fetch(sub.file)
        .then(r => r.ok ? r.json().catch(()=>[]) : [])
        .catch(()=>[]);
      tasks.push({ bab, sub, subIndex: i, promise: p });
    });
  });

  const results = await Promise.all(tasks.map(t => t.promise));

  const cache = [];
  results.forEach((json, i) => {
    const t = tasks[i];
    const arr = Array.isArray(json) ? json : (json.baits || []);
    arr.forEach((b, baitIndex) => {
      cache.push({
        id: b.id ?? (baitIndex + 1),
        indo: b.indo ?? "",
        inggris: b.inggris ?? "",
        title: b.title ?? "",
        description: b.description ?? "",
        babNum: t.bab.bab,
        babTitle: t.bab.title,
        subTitle: t.sub.title || "",
        file: t.sub.file,
        subIndex: t.subIndex,
        baitIndex
      });
    });
  });

  self._cache = cache;
  return cache;
}

self.addEventListener("message", async (ev) => {
  const msg = ev.data;
  try {
    if (!msg) return;
    if (msg.type === "init") {
      if (!self._readyPromise) self._readyPromise = buildCache();
      await self._readyPromise;
      self.postMessage({ type: "ready" });
      return;
    }

    if (msg.type === "search") {
      const qRaw = (msg.q || "").toString().trim();
      const q = qRaw.toLowerCase();
      if (!q) {
        self.postMessage({ type: "results", q: qRaw, results: [] });
        return;
      }

      if (!self._readyPromise) self._readyPromise = buildCache();
      await self._readyPromise;
      const cache = self._cache || [];

      const results = [];
      // simple linear scan (fast in worker)
      for (let i = 0; i < cache.length; i++) {
        const b = cache[i];
        if ((b.indo && b.indo.toLowerCase().includes(q)) ||
            (b.inggris && b.inggris.toLowerCase().includes(q)) ||
            (b.title && b.title.toLowerCase().includes(q)) ||
            (b.id && b.id.toString().includes(q))) {
          results.push({
            id: b.id,
            indo: b.indo,
            inggris: b.inggris,
            title: b.title,
            description: b.description,
            babNum: b.babNum,
            babTitle: b.babTitle,
            subTitle: b.subTitle,
            file: b.file,
            subIndex: b.subIndex,
            baitIndex: b.baitIndex
          });
          if (results.length >= 300) break; // cap
        }
      }

      self.postMessage({ type: "results", q: qRaw, results });
    }
  } catch (err) {
    self.postMessage({ type: "error", message: err?.message ?? String(err) });
  }
});