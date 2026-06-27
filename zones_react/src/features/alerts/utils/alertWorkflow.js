import { zonesToastError, zonesToastSuccess, zonesToastWarning } from "../../../shared/utils/zonesAlerts";
import { getActiveStaffSession, isApiStaffSession } from "../../devices-packages/data/hallCatalogSync";
import {
  targetAudienceRequiresCustomerPush,
  targetAudienceToCategories,
  validateTargetAudienceForSubmit,
} from "../data/alertsMeta";
import {
  archiveManagerStationAlert,
  createManagerStationAlert,
  emitAlertsArchived,
} from "../data/managerAlertsApi";
import { addAlert, stopAlert } from "../data/managerAlertsStorage";
import { pushManagerAlertNotification } from "../data/hallNotificationsStorage";

function useApiManager() {
  const session = getActiveStaffSession();
  return isApiStaffSession(session) && session?.role === "manager";
}

function formatDeliveryToast(delivery) {
  if (!delivery) return "تم إضافة التنبيه وإرساله للمستهدفين";

  const parts = [
    `مستلمون: ${delivery.recipients ?? 0}`,
    `إشعارات زبائن: ${delivery.customer_notifications ?? 0}`,
    `أجهزة FCM: ${delivery.valid_tokens ?? 0}`,
    `تم الإرسال: ${delivery.fcm_sent ?? 0}`,
  ];

  if (delivery.fcm_reason === "not_configured") {
    return `${parts.join(" · ")} — Firebase غير مهيأ على الخادم`;
  }

  if ((delivery.fcm_sent ?? 0) === 0 && (delivery.valid_tokens ?? 0) === 0) {
    return `${parts.join(" · ")} — لا توجد رموز أجهزة مسجّلة للزبائن`;
  }

  return parts.join(" · ");
}

export async function createManagerAlert(payload) {
  const validation = validateTargetAudienceForSubmit(payload.targetAudience);
  if (!validation.valid) {
    zonesToastError(validation.error || "يرجى اختيار المستهدف", "خطأ");
    return null;
  }

  const targetAudience = validation.normalized;
  const targetCategories = targetAudienceToCategories(targetAudience);
  const needsCustomerPush = targetAudienceRequiresCustomerPush(targetAudience);

  if (needsCustomerPush && !useApiManager()) {
    zonesToastError(
      "لإرسال إشعارات الزبائن يجب تسجيل الدخول بحساب مدير متصل بالخادم (API)، وليس الجلسة التجريبية المحلية.",
      "لا يمكن الإرسال للزبائن",
    );
    return null;
  }

  if (useApiManager()) {
    const result = await createManagerStationAlert({
      ...payload,
      targetAudience,
    });
    if (!result.ok) {
      zonesToastError(result.error || "تعذّر إرسال التنبيه", "خطأ");
      return null;
    }

    const alert = {
      ...result.alert,
      targetCategories,
      targetAudience,
      situationDescription: payload.situationDescription,
    };
    pushManagerAlertNotification(alert);

    const deliveryMessage = formatDeliveryToast(result.delivery);
    if ((result.delivery?.fcm_sent ?? 0) === 0 && needsCustomerPush) {
      zonesToastWarning(`تم الحفظ مع تحذير — ${deliveryMessage}`);
    } else {
      zonesToastSuccess(deliveryMessage);
    }

    return { alert, delivery: result.delivery };
  }

  const alert = addAlert({
    ...payload,
    targetAudience,
    targetCategories,
  });
  if (needsCustomerPush) {
    zonesToastWarning(
      "تنبيه محلي — تم حفظ التنبيه محلياً فقط ولن يصل لتطبيق الزبون بدون اتصال بالخادم.",
    );
  }
  return { alert, delivery: null };
}

export async function archiveManagerAlert(alert, { emit = true } = {}) {
  if (useApiManager() && alert?.id) {
    const result = await archiveManagerStationAlert(alert.id);
    if (!result.ok) {
      zonesToastError(result.error || "تعذّر أرشفة التنبيه", "خطأ");
      return { ok: false, alert: null };
    }
    if (emit && result.alert) {
      emitAlertsArchived([result.alert]);
    }
    return { ok: true, alert: result.alert };
  }

  const archived = stopAlert(alert.id);
  if (archived && emit) {
    emitAlertsArchived([archived]);
  }
  return { ok: Boolean(archived), alert: archived };
}

/** @deprecated استخدم archiveManagerAlert */
export async function stopManagerAlert(alert) {
  const result = await archiveManagerAlert(alert);
  return result.ok;
}

/**
 * @param {Array<{ id: number|string, source?: string }>} alerts
 * @param {Array<number|string>} ids
 */
export async function archiveManagerAlerts(alerts, ids) {
  const idSet = new Set(ids);
  const targets = alerts.filter((row) => idSet.has(row.id));
  if (!targets.length) {
    return { ok: false, success: 0, total: 0, alerts: [] };
  }

  const archivedAlerts = [];
  let success = 0;

  for (const alert of targets) {
    const result = await archiveManagerAlert(alert, { emit: false });
    if (result.ok) {
      success += 1;
      if (result.alert) archivedAlerts.push(result.alert);
    }
  }

  if (archivedAlerts.length) {
    emitAlertsArchived(archivedAlerts);
  }

  return {
    ok: success === targets.length,
    success,
    total: targets.length,
    alerts: archivedAlerts,
  };
}

/** @deprecated استخدم archiveManagerAlerts */
export async function stopManagerAlerts(alerts, ids) {
  return archiveManagerAlerts(alerts, ids);
}
