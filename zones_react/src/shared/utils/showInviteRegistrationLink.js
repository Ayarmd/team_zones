import { zonesSwal, zonesToastSuccess } from "./zonesAlerts";

export async function showInviteRegistrationLink({
  title = "رابط التسجيل",
  recipientEmail = "",
  registerLink = "",
  mailSent = false,
} = {}) {
  if (!registerLink) return;

  const emailNote = recipientEmail
    ? `<p class="text-xs text-gray-500 mb-2">لـ <strong dir="ltr">${recipientEmail}</strong></p>`
    : "";

  const mailNote = mailSent
    ? '<p class="text-xs text-emerald-600 mb-2">تم محاولة إرسال البريد — إن لم يصل، انسخ الرابط وأرسله يدوياً (واتساب).</p>'
    : '<p class="text-xs text-amber-600 mb-2">البريد غير مفعّل على السيرفر — انسخ الرابط وأرسله للموظف/المدير عبر واتساب.</p>';

  const result = await zonesSwal({
    title,
    html: `${emailNote}${mailNote}<p class="text-xs">اضغط «نسخ الرابط» ثم أرسله.</p>`,
    input: "text",
    inputValue: registerLink,
    inputAttributes: { dir: "ltr", readonly: "readonly" },
    confirmButtonText: "نسخ الرابط",
    showCancelButton: true,
    cancelButtonText: "إغلاق",
  });

  if (result.isConfirmed) {
    try {
      await navigator.clipboard.writeText(registerLink);
      zonesToastSuccess("تم نسخ الرابط");
    } catch {
      zonesSwal({
        icon: "info",
        title: "انسخ الرابط يدوياً",
        input: "text",
        inputValue: registerLink,
        inputAttributes: { dir: "ltr", readonly: "readonly" },
      });
    }
  }
}
