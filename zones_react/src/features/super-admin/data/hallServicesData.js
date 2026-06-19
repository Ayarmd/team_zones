/** ملحقات الألعاب — تظهر في قائمة منسدلة عند تفعيل «بيع ملحقات الألعاب» */
export const GAMING_ACCESSORY_OPTIONS = [
  { key: "cds", label: "سي دي", shortLabel: "سي دي" },
  { key: "ps_controller", label: "يد بلاستيشن", shortLabel: "يد بلاستيشن" },
  { key: "headphones", label: "سماعات", shortLabel: "سماعات" },
  { key: "keyboard", label: "كيبورد", shortLabel: "كيبورد" },
  { key: "mouse", label: "ماوس", shortLabel: "ماوس" },
  { key: "headset", label: "سماعة رأس", shortLabel: "سماعة رأس" },
  { key: "cables", label: "كابلات وشواحن", shortLabel: "كابلات" },
];

export const HALL_SERVICE_OPTIONS = [
  { key: "drinks_fridge", label: "ثلاجة مشروبات", shortLabel: "مشروبات" },
  { key: "fast_food", label: "وجبات سريعة", shortLabel: "وجبات سريعة" },
  { key: "snacks", label: "سناكس", shortLabel: "سناكس" },
  { key: "free_internet", label: "إنترنت مجاني", shortLabel: "إنترنت مجاني" },
  { key: "table_games", label: "ألعاب طاولة", shortLabel: "ألعاب طاولة" },
  { key: "private_room", label: "إيجار غرفة معزولة", shortLabel: "غرفة معزولة" },
  { key: "device_maintenance", label: "صيانة الأجهزة", shortLabel: "صيانة الأجهزة" },
  {
    key: "gaming_accessories",
    label: "بيع ملحقات الألعاب",
    shortLabel: "بيع ملحقات الألعاب",
    hasAccessories: true,
  },
  { key: "tournaments", label: "تنظيم بطولات", shortLabel: "تنظيم بطولات" },
];

/** خريطة is_available الافتراضية — كل الخدمات مطفأة حتى يفعّلها المدير */
export function createDefaultServicesAvailability() {
  return Object.fromEntries(HALL_SERVICE_OPTIONS.map(({ key }) => [key, false]));
}

export function createDefaultAccessoriesAvailability() {
  return Object.fromEntries(GAMING_ACCESSORY_OPTIONS.map(({ key }) => [key, false]));
}

/** دمج التخزين مع القائمة الكاملة (يدعم مفاتيح جديدة لاحقاً) */
export function normalizeServicesAvailability(stored) {
  const base = createDefaultServicesAvailability();
  if (!stored || typeof stored !== "object") return base;
  for (const { key } of HALL_SERVICE_OPTIONS) {
    if (typeof stored[key] === "boolean") {
      base[key] = stored[key];
    }
  }
  // ترحيل cds القديمة كملحق
  if (stored.cds === true) {
    base.gaming_accessories = true;
  }
  return base;
}

export function normalizeAccessoriesAvailability(stored, servicesStored) {
  const base = createDefaultAccessoriesAvailability();
  if (stored && typeof stored === "object") {
    for (const { key } of GAMING_ACCESSORY_OPTIONS) {
      if (typeof stored[key] === "boolean") {
        base[key] = stored[key];
      }
    }
  }
  if (servicesStored?.cds === true) {
    base.cds = true;
  }
  return base;
}

function buildAccessoryDisplayLabel(activeKeys) {
  const labels = GAMING_ACCESSORY_OPTIONS.filter(({ key }) => activeKeys[key]).map(({ label }) => label);
  if (labels.length === 0) return "بيع ملحقات الألعاب";
  return `بيع ملحقات الألعاب (${labels.join("، ")})`;
}

/** محاكاة API الزبون: جلب الخدمات حيث is_available === true فقط */
export function getAvailableHallServices(availabilityMap, accessoriesMap) {
  const normalized = normalizeServicesAvailability(availabilityMap);
  const accessories = normalizeAccessoriesAvailability(accessoriesMap, availabilityMap);
  const results = [];

  for (const service of HALL_SERVICE_OPTIONS) {
    if (!normalized[service.key]) continue;

    if (service.key === "gaming_accessories") {
      const activeAccessoryKeys = GAMING_ACCESSORY_OPTIONS.filter(({ key }) => accessories[key]);
      if (activeAccessoryKeys.length > 0) {
        for (const item of activeAccessoryKeys) {
          results.push({
            key: `accessory_${item.key}`,
            label: item.label,
            shortLabel: item.label,
            is_available: true,
            parentKey: "gaming_accessories",
          });
        }
      } else {
        results.push({
          ...service,
          shortLabel: buildAccessoryDisplayLabel(accessories),
          is_available: true,
        });
      }
      continue;
    }

    results.push({ ...service, is_available: true });
  }

  return results;
}

export function countAvailableHallServices(availabilityMap, accessoriesMap) {
  return getAvailableHallServices(availabilityMap, accessoriesMap).length;
}

const LABEL_BY_KEY = {
  ...Object.fromEntries(HALL_SERVICE_OPTIONS.map((s) => [s.key, s.label])),
  ...Object.fromEntries(GAMING_ACCESSORY_OPTIONS.map((s) => [s.key, s.label])),
  cds: "سي دي",
};

const PRESETS_BY_HALL_ID = {
  101: ["drinks_fridge", "free_internet", "gaming_accessories", "tournaments"],
  102: ["drinks_fridge", "fast_food", "snacks", "free_internet", "gaming_accessories", "tournaments"],
  103: ["drinks_fridge", "snacks", "free_internet"],
  104: ["drinks_fridge", "fast_food", "snacks", "free_internet", "tournaments"],
  105: ["drinks_fridge", "snacks"],
  106: ["drinks_fridge", "fast_food", "snacks", "free_internet", "gaming_accessories", "cds", "tournaments"],
  107: ["fast_food", "snacks", "free_internet", "gaming_accessories", "tournaments"],
};

export function resolveHallServices(hall) {
  if (Array.isArray(hall?.services) && hall.services.length > 0) {
    return hall.services.filter((key) => LABEL_BY_KEY[key]);
  }
  return PRESETS_BY_HALL_ID[hall?.id] || ["drinks_fridge", "free_internet"];
}

export function hallServiceLabels(hall) {
  return resolveHallServices(hall).map((key) => LABEL_BY_KEY[key]);
}

export function formatHallServicesHtml(hall) {
  const labels = hallServiceLabels(hall);
  if (labels.length === 0) {
    return "<span style='color:#9ca3af'>لا توجد خدمات مسجّلة</span>";
  }
  return labels
    .map(
      (label) =>
        `<span style="display:inline-block;margin:0 0 6px 6px;padding:6px 14px;border-radius:999px;background:rgba(107,84,120,0.12);color:#6B5478;font-size:12px;font-weight:700">${label}</span>`,
    )
    .join("");
}

export const DEFAULT_ACTIVE_HALLS = [
  {
    id: 101,
    name: "ZONES Gaming Center",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=240&fit=crop",
    address: "طرابلس — شارع الجمهورية",
    commercialPhone: "091 111 2233",
    managerName: "مدير النظام",
    managerId: 1,
    status: "active",
    monthlyIncome: 7000,
    employeeCount: 6,
    services: ["drinks_fridge", "free_internet", "gaming_accessories", "tournaments"],
  },
  {
    id: 102,
    name: "صالة الأبطال VIP",
    image: "https://images.unsplash.com/photo-1593305841991-05c298ba4575?w=400&h=240&fit=crop",
    address: "بنغازي — الكويفية",
    commercialPhone: "092 444 5566",
    managerName: "خالد الفيتوري",
    managerId: 2,
    status: "active",
    monthlyIncome: 12500,
    employeeCount: 9,
    services: ["drinks_fridge", "fast_food", "snacks", "free_internet", "gaming_accessories", "tournaments"],
  },
  {
    id: 103,
    name: "صالة المستقبل",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=240&fit=crop",
    address: "مصراتة — شارع عمر المختار",
    commercialPhone: "091 777 8899",
    managerName: "نور الهادي",
    managerId: 3,
    status: "closed",
    monthlyIncome: 3200,
    employeeCount: 4,
    services: ["drinks_fridge", "snacks", "free_internet"],
  },
  {
    id: 104,
    name: "قاعة الأندلس",
    image: "https://images.unsplash.com/photo-1511886929834-cd04b0d64d4b?w=400&h=240&fit=crop",
    address: "طرابلس — حي الأندلس",
    commercialPhone: "021 333 4455",
    managerName: "فهد بن سالم",
    managerId: 4,
    status: "active",
    monthlyIncome: 9800,
    employeeCount: 11,
    services: ["drinks_fridge", "fast_food", "snacks", "free_internet", "tournaments"],
  },
  {
    id: 105,
    name: "قاعة الواحة",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=240&fit=crop",
    address: "الزاوية — وسط المدينة",
    commercialPhone: "023 777 8888",
    managerName: "عبدالله العريفي",
    managerId: 5,
    status: "closed",
    monthlyIncome: 0,
    employeeCount: 5,
    services: ["drinks_fridge", "snacks"],
  },
  {
    id: 106,
    name: "قاعة الرواد",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=240&fit=crop",
    address: "سبها — حي المهدية",
    commercialPhone: "071 222 3344",
    managerName: "محمد الفيتوري",
    managerId: 6,
    status: "active",
    monthlyIncome: 8400,
    employeeCount: 8,
    services: ["drinks_fridge", "fast_food", "snacks", "free_internet", "gaming_accessories", "cds", "tournaments"],
  },
  {
    id: 107,
    name: "صالة النخبة للاحتفالات",
    image: "https://images.unsplash.com/photo-1593305841991-05c298ba4575?w=400&h=240&fit=crop",
    address: "حي العليا، شارع الملك فهد",
    commercialPhone: "050 111 2222",
    managerName: "فهد بن عبدالعزيز",
    managerId: null,
    status: "active",
    monthlyIncome: 11200,
    employeeCount: 12,
    services: ["fast_food", "snacks", "free_internet", "gaming_accessories", "tournaments"],
  },
];
