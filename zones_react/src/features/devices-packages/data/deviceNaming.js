/** بادئات أسماء الأجهزة الموحّدة */
export const DEVICE_TYPE_PREFIX = {
  ps5: "PS5",
  xbox: "XBOX",
  pc: "PC",
  vr: "VR",
};

export const DEVICE_TYPE_LABEL = {
  ps5: "PlayStation",
  xbox: "Xbox",
  pc: "Gaming PC",
  vr: "VR Headset",
};

export function typeLabelFromType(type) {
  return DEVICE_TYPE_LABEL[type] ?? type?.toUpperCase() ?? "—";
}

const DEVICE_CODE_PATTERN = /^(PS5|XBOX|PC|VR)-(\d{1,4})$/i;

/** هل الاسم بالصيغة الموحّدة PS5-01 / PC-016 … */
export function isCodeDeviceName(name) {
  return DEVICE_CODE_PATTERN.test(String(name || "").trim());
}

/**
 * يحوّل الأسماء العربية القديمة إلى PS5-01, XBOX-01 … حسب النوع وترتيب id
 * @returns {{ devices: object[], idToName: Map<number,string>, changed: boolean }}
 */
export function migrateDevicesToCodeNames(list) {
  const devices = Array.isArray(list) ? [...list] : [];
  const needsMigration = devices.some((d) => !isCodeDeviceName(d.name));
  if (!needsMigration) {
    return { devices, idToName: new Map(), changed: false };
  }

  const sorted = [...devices].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  const counters = { ps5: 0, xbox: 0, pc: 0, vr: 0 };
  const idToName = new Map();

  const migrated = sorted.map((d) => {
    const type = d.type && DEVICE_TYPE_PREFIX[d.type] ? d.type : "ps5";
    counters[type] = (counters[type] || 0) + 1;
    const prefix = DEVICE_TYPE_PREFIX[type] || "DEV";
    const newName = `${prefix}-${String(counters[type]).padStart(2, "0")}`;
    idToName.set(d.id, newName);
    return {
      ...d,
      name: newName,
      type,
      typeLabel: typeLabelFromType(type),
    };
  });

  return { devices: migrated, idToName, changed: true };
}

/** يولّد الاسم التالي: PS5-01, XBOX-02, PC-01, VR-01 */
export function suggestDeviceName(type, devices) {
  const prefix = DEVICE_TYPE_PREFIX[type] || "DEV";
  const list = Array.isArray(devices) ? devices : [];
  const sameType = list.filter((d) => d.type === type);
  const used = sameType
    .map((d) => {
      const m = String(d.name || "").match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = (used.length ? Math.max(...used) : 0) + 1;
  const padWidth = sameType.reduce((width, d) => {
    const m = String(d.name || "").match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
    return m ? Math.max(width, m[1].length) : width;
  }, 2);
  return `${prefix}-${String(next).padStart(padWidth, "0")}`;
}

/** يحلّ نوع الجهاز من نص مكتوب أو مختار */
export function resolveDeviceTypeInput(input, deviceTypeGroups = []) {
  const text = String(input || "").trim();
  if (!text) return { type: "ps5", typeLabel: DEVICE_TYPE_LABEL.ps5 };

  const flat = deviceTypeGroups.flatMap((g) => g.options || []);
  const byLabel = flat.find((o) => o.label.toLowerCase() === text.toLowerCase());
  if (byLabel) return { type: byLabel.value, typeLabel: byLabel.label };
  const byValue = flat.find((o) => o.value.toLowerCase() === text.toLowerCase());
  if (byValue) return { type: byValue.value, typeLabel: byValue.label };

  const slug = text.toLowerCase().replace(/\s+/g, "_").replace(/[^\w\u0600-\u06FF-]/g, "") || "custom";
  return { type: slug, typeLabel: text };
}

/** يطابق بادئة النوع: PS5-01 / PC-016 مع ps5 / pc */
export function deviceNameMatchesType(name, type) {
  const prefix = DEVICE_TYPE_PREFIX[type];
  const trimmed = String(name || "").trim();
  if (!trimmed) return false;
  if (!prefix) return isCodeDeviceName(trimmed);
  return new RegExp(`^${prefix}-\\d{1,4}$`, "i").test(trimmed);
}

/** يُطبّع الاسم إلى PS5-01 / PC-016 أو null إن كان غير صالح */
export function normalizeDeviceCodeName(name, type) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;

  const prefix = DEVICE_TYPE_PREFIX[type];
  const cleaned = trimmed.toUpperCase().replace(/-+/g, "-");

  if (prefix) {
    const match = cleaned.match(new RegExp(`^(${prefix})-(\\d{1,4})$`, "i"));
    if (match) {
      const num = parseInt(match[2], 10);
      if (!Number.isFinite(num) || num < 1) return null;
      const padWidth = Math.max(2, match[2].length);
      return `${match[1].toUpperCase()}-${String(num).padStart(padWidth, "0")}`;
    }
    return null;
  }

  const generic = cleaned.match(DEVICE_CODE_PATTERN);
  if (generic) {
    const num = parseInt(generic[2], 10);
    if (!Number.isFinite(num) || num < 1) return null;
    const padWidth = Math.max(2, generic[2].length);
    return `${generic[1].toUpperCase()}-${String(num).padStart(padWidth, "0")}`;
  }

  return null;
}
