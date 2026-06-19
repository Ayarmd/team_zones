/** true إذا المفتاح غير موجود أو فارغ أو مصفوفة/كائن فارغ */
export function needsStorageSeed(raw) {
  if (raw == null || raw === "") return true;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length === 0;
    if (parsed && typeof parsed === "object") return Object.keys(parsed).length === 0;
    return false;
  } catch {
    return true;
  }
}

export function ensureListPersisted(storageKey, loadFn, saveFn) {
  if (typeof window === "undefined") return;
  if (!needsStorageSeed(localStorage.getItem(storageKey))) return;
  saveFn(loadFn());
}
