import { formatAlertDateTime, normalizeTargetCategories } from "./alertsMeta";
import { pushManagerAlertNotification } from "./hallNotificationsStorage";

const STORAGE_KEY = "zones-manager-alerts-v1";
export const MANAGER_ALERTS_EVENT = "zones-manager-alerts-updated";

function buildSeedAlerts() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return [
    {
      id: 1003,
      name: "تنبيه نشط — استقبال",
      targetCategories: ["reception"],
      severity: "medium",
      situationDescription: "يرجى التأكد من جاهزية أجهزة الاستقبال قبل بدء الوردية.",
      alternativeInstructions: "راجع قائمة الأجهزة المتاحة قبل قبول الحجوزات.",
      message: "يرجى التأكد من جاهزية أجهزة الاستقبال قبل بدء الوردية.",
      status: "active",
      source: "manual",
      startDate: formatAlertDateTime(now),
      endDate: "",
    },
    {
      id: 1001,
      name: "تنبيه صيانة الشبكة",
      targetCategories: ["reception"],
      severity: "high",
      situationDescription: "تعطل مؤقت في شبكة الصالة يؤثر على نظام الحجز.",
      alternativeInstructions: "سجّل الحجوزات يدوياً وأبلغ الزبائن بالتأخير المتوقع.",
      message: "تعطل مؤقت في شبكة الصالة يؤثر على نظام الحجز.",
      status: "stopped",
      source: "manual",
      startDate: formatAlertDateTime(yesterday),
      endDate: formatAlertDateTime(now),
    },
    {
      id: 1002,
      name: "تنبيه عام للموظفين",
      targetCategories: ["reception", "maintenance"],
      severity: "medium",
      situationDescription: "تذكير بالالتزام بإجراءات السلامة داخل الصالة.",
      alternativeInstructions: "راجع لائحة السلامة المعلّقة عند مدخل الصالة.",
      message: "تذكير بالالتزام بإجراءات السلامة داخل الصالة.",
      status: "stopped",
      source: "manual",
      startDate: formatAlertDateTime(yesterday),
      endDate: formatAlertDateTime(yesterday),
    },
  ];
}

function normalizeAlert(row) {
  const situationDescription =
    row.situationDescription?.trim() || row.message?.trim() || "";
  const targetCategories = normalizeTargetCategories(
    row.targetCategories ?? row.targetCategory,
  );
  return {
    ...row,
    status: row.status === "active" ? "active" : "stopped",
    endDate: row.endDate || "",
    severity: row.severity || "medium",
    targetCategories,
    targetCategory: targetCategories.includes("all") ? "all" : targetCategories[0] || "all",
    situationDescription,
    alternativeInstructions: row.alternativeInstructions?.trim() || "",
    message: situationDescription,
    source: row.source || "manual",
  };
}

export function loadAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedAlerts().map(normalizeAlert);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return buildSeedAlerts().map(normalizeAlert);
    return parsed.map(normalizeAlert);
  } catch {
    return buildSeedAlerts().map(normalizeAlert);
  }
}

export function saveAlerts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.map(normalizeAlert)));
    window.dispatchEvent(new Event(MANAGER_ALERTS_EVENT));
  } catch {
    /* ignore */
  }
}

export function nextAlertId(list = loadAlerts()) {
  const base = list.reduce((max, row) => Math.max(max, row.id ?? 0), 1000);
  return base + 1;
}

export function addAlert(payload) {
  const list = loadAlerts();
  const situationDescription =
    payload.situationDescription?.trim() || payload.message?.trim() || "";
  const alert = normalizeAlert({
    id: nextAlertId(list),
    name: payload.name?.trim() || "تنبيه",
    targetCategories: normalizeTargetCategories(
      payload.targetCategories ?? payload.targetCategory ?? "all",
    ),
    severity: payload.severity || "medium",
    situationDescription,
    alternativeInstructions: payload.alternativeInstructions?.trim() || "",
    message: situationDescription,
    status: "active",
    source: payload.source || "manual",
    startDate: formatAlertDateTime(),
    endDate: "",
  });
  const next = [alert, ...list];
  saveAlerts(next);
  pushManagerAlertNotification(alert);
  return alert;
}

export function loadActiveAlerts() {
  return loadAlerts().filter((row) => row.status === "active");
}

export function loadArchivedAlerts() {
  return loadAlerts().filter((row) => row.status === "stopped");
}

/** إيقاف التنبيه — لا يمكن إعادة تفعيله؛ يُنقل إلى الأرشيف */
export function stopAlert(id) {
  const list = loadAlerts();
  const next = list.map((row) =>
    row.id === id && row.status === "active"
      ? { ...row, status: "stopped", endDate: formatAlertDateTime() }
      : row,
  );
  saveAlerts(next);
  return next.find((row) => row.id === id) ?? null;
}
