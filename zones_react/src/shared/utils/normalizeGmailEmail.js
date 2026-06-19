/** توحيد عناوين البريد على نمط @gmail.com — للدخول، التسجيل، الدعوات، والتخزين */
export function normalizeGmailEmail(email) {
  if (!email || typeof email !== "string") return email;
  const value = email.trim().toLowerCase();
  if (!value.includes("@")) return value;

  if (value.endsWith("@gmail.com")) return value;
  if (value.endsWith("@zones.ly")) return value.replace("@zones.ly", "@gmail.com");
  if (value.endsWith("@email.com")) return value.replace("@email.com", "@gmail.com");
  if (value.endsWith("@zones.com")) return value.replace("@zones.com", "@gmail.com");
  if (value.endsWith("@example.com")) return value.replace("@example.com", "@gmail.com");
  if (value.endsWith("@hall-platform.ly")) return value.replace("@hall-platform.ly", "@gmail.com");
  if (value === "admin@hall-platform.ly" || value === "superadmin@system.com") {
    return "superadmin@gmail.com";
  }
  return value;
}

/** alias — نفس normalizeGmailEmail لكل مسارات المصادقة */
export const normalizeAuthEmail = normalizeGmailEmail;
