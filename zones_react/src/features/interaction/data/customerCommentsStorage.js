const STORAGE_KEY = "zones-customer-comments-v1";
export const CUSTOMER_COMMENTS_EVENT = "zones-customer-comments-updated";

const DAY_MS = 24 * 60 * 60 * 1000;

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CUSTOMER_COMMENTS_EVENT));
}

function buildSeedComments() {
  const now = Date.now();
  return [
    {
      id: 1,
      customerName: "أحمد العقيبي",
      text: "الصالة نظيفة والأجهزة ممتازة. شكراً على الاستقبال الراقي.",
      rating: 5,
      createdAt: now - 2 * DAY_MS,
      source: "customer_app",
      managerReply: null,
    },
    {
      id: 2,
      customerName: "سارة محمد",
      text: "الإنترنت سريع والدعم الفني متعاون جداً. أنصح بزيارة الصالة.",
      rating: 5,
      createdAt: now - 5 * DAY_MS,
      source: "customer_app",
      managerReply: {
        text: "شكراً سارة — سعداء بتجربتك وننتظرك دائماً.",
        repliedAt: now - 4 * DAY_MS,
        managerName: "مدير الصالة",
      },
    },
    {
      id: 3,
      customerName: "فيصل الحربي",
      text: "الأسعار مناسبة والعروض جميلة. ياريت تزيدون بطولات PS5.",
      rating: 4,
      createdAt: now - 7 * DAY_MS,
      source: "customer_app",
      managerReply: null,
    },
    {
      id: 4,
      customerName: "نور الهادي",
      text: "تجربة ممتازة لكن انتظار الجهاز كان طويلاً قليلاً مساءً.",
      rating: 3,
      createdAt: now - 12 * DAY_MS,
      source: "customer_app",
      managerReply: null,
    },
  ];
}

function normalizeComment(row) {
  return {
    id: row.id,
    customerName: String(row.customerName || "زبون").trim(),
    text: String(row.text || "").trim(),
    rating: Math.min(5, Math.max(0, Number(row.rating) || 0)),
    createdAt: Number(row.createdAt) || Date.now(),
    source: row.source || "customer_app",
    managerReply: row.managerReply
      ? {
          text: String(row.managerReply.text || "").trim(),
          repliedAt: Number(row.managerReply.repliedAt) || Date.now(),
          managerName: String(row.managerReply.managerName || "مدير الصالة").trim(),
        }
      : null,
  };
}

export function loadComments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedComments().map(normalizeComment);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return buildSeedComments().map(normalizeComment);
    return parsed.map(normalizeComment);
  } catch {
    return buildSeedComments().map(normalizeComment);
  }
}

export function saveComments(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.map(normalizeComment)));
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

export function nextCommentId(list = loadComments()) {
  return list.reduce((max, c) => Math.max(max, c.id ?? 0), 0) + 1;
}

export function addCustomerComment({ customerName, text, rating = 0 }) {
  const trimmed = String(text || "").trim();
  const name = String(customerName || "زبون").trim();
  if (!trimmed) return null;

  const list = loadComments();
  const comment = normalizeComment({
    id: nextCommentId(list),
    customerName: name || "زبون",
    text: trimmed,
    rating,
    createdAt: Date.now(),
    source: "customer_app",
    managerReply: null,
  });
  saveComments([comment, ...list]);
  return comment;
}

export function replyToComment(commentId, replyText, managerName = "مدير الصالة") {
  const trimmed = String(replyText || "").trim();
  if (!trimmed) return null;

  const list = loadComments();
  let updated = null;
  const next = list.map((c) => {
    if (c.id !== commentId) return c;
    updated = normalizeComment({
      ...c,
      managerReply: {
        text: trimmed,
        repliedAt: Date.now(),
        managerName: managerName.trim() || "مدير الصالة",
      },
    });
    return updated;
  });
  saveComments(next);
  return updated;
}

export function deleteComment(commentId) {
  const list = loadComments();
  const next = list.filter((c) => c.id !== commentId);
  if (next.length === list.length) return false;
  saveComments(next);
  return true;
}

export function getCommentStats(comments = loadComments()) {
  const replied = comments.filter((c) => c.managerReply?.text).length;
  return {
    total: comments.length,
    pending: comments.length - replied,
    replied,
  };
}

export function formatRelativeTime(timestamp) {
  const ts = Number(timestamp);
  if (!ts) return "—";

  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "منذ ساعة" : `منذ ${hours} ساعة`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "منذ يوم" : `منذ ${days} يوم`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "منذ أسبوع" : `منذ ${weeks} أسبوع`;

  return new Date(ts).toLocaleDateString("ar-LY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function customerInitials(name) {
  const parts = String(name || "ز").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "ز";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] || ""}${parts[1][0] || ""}`;
}
