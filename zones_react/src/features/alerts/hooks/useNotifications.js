import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearHallNotificationsForAudience,
  deleteHallNotification,
  deleteHallNotifications,
  getNotificationsForAudience,
  HALL_NOTIFICATIONS_EVENT,
  markAllHallNotificationsRead,
  markHallNotificationRead,
} from "../data/hallNotificationsStorage";
import { BOOKINGS_STOP_EVENT } from "../data/bookingsStopStorage";
import {
  deleteAllStaffNotifications,
  deleteStaffNotification,
  deleteStaffNotificationsBatch,
  markStaffNotificationRead,
} from "../data/staffNotificationsApi";
import {
  STAFF_NOTIFICATIONS_EVENT,
  syncStaffNotificationsFromApi,
  useStaffNotificationsSync,
} from "./useStaffNotificationsSync";
import { getActiveStaffSession, isApiStaffSession } from "../../devices-packages/data/hallCatalogSync";
import {
  clearFinancialAlerts,
  deleteFinancialAlert,
  deleteFinancialAlerts,
  getSuperAdminState,
  markAlertRead,
  markAllAlertsRead,
} from "../../super-admin/data/superAdminStorage";
import { fetchPendingJoinRequestsSummary } from "../../super-admin/data/hallJoinRequestsApi";
import { SUPER_ADMIN_ROUTES } from "../../super-admin/data/superAdminConstants";
import { financialAlertType } from "../notifications/notificationTypes";
import {
  clearDismissedJoinRequests,
  dismissJoinRequest,
  dismissJoinRequests,
  getDismissedJoinRequestIds,
} from "../notifications/superAdminNotificationsDismiss";

function mapLocalRow(row) {
  return {
    id: `local-${row.id}`,
    source: "local",
    localId: row.id,
    type: row.type,
    title: row.title || row.name || "",
    body: row.description || row.message || "",
    instructions: row.instructions || "",
    severity: row.severity,
    createdAt: row.createdAt || "",
    isRead: Boolean(row.isRead),
  };
}

function mapApiRow(row) {
  return {
    id: `api-${row.id}`,
    source: "api",
    apiId: row.id,
    type: row.type === "manager_broadcast" || row.type === "station_alert" ? "manager_alert" : row.type,
    title: row.name || row.title || "",
    body: row.message || "",
    instructions: row.instructions || "",
    severity: row.severity || "medium",
    createdAt: row.createdAt || "",
    isRead: Boolean(row.isRead),
  };
}

function mapFinancialAlert(alert) {
  const type = financialAlertType(alert);
  const message =
    alert.message ||
    (type === "financial_collected"
      ? `تم تحصيل عمولة ${alert.hallName} بقيمة ${alert.amount} د.ل`
      : `يتبقى ${alert.daysLeft} يوم على استحقاق عمولة ${alert.hallName} بقيمة ${alert.amount} د.ل`);

  return {
    id: `financial-${alert.id}`,
    source: "financial",
    financialId: alert.id,
    type,
    title: type === "financial_collected" ? "عمولة محصّلة" : "عمولة مستحقة",
    body: message,
    instructions: "",
    severity: type === "financial_due" ? "medium" : "low",
    createdAt: alert.createdAt || "",
    isRead: Boolean(alert.read),
  };
}

function mapJoinRequest(req) {
  return {
    id: `join-${req.id}`,
    source: "join_request",
    joinRequestId: req.id,
    type: "join_request",
    title: req.hallName || "طلب انضمام",
    body: `${req.city || "غير محددة"} · ${req.submittedAt?.replaceAll("-", "/") || ""}`,
    instructions: "",
    severity: "medium",
    createdAt: req.submittedAt || "",
    isRead: false,
    href: SUPER_ADMIN_ROUTES.pending,
  };
}

function mergeStaffNotifications(localItems, apiItems) {
  const localFiltered = localItems.map(mapLocalRow);
  const apiMapped = apiItems.map(mapApiRow);
  const seen = new Set();
  const merged = [];

  for (const row of [...apiMapped, ...localFiltered]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }

  return merged;
}

/**
 * @param {{ mode: 'staff' | 'super_admin', audience?: 'reception' | 'maintenance' | 'manager' }} config
 */
export function useNotifications({ mode = "staff", audience = "reception" } = {}) {
  const navigate = useNavigate();
  const session = getActiveStaffSession();
  const apiEnabled = mode === "staff" && isApiStaffSession(session);

  const [localItems, setLocalItems] = useState(() =>
    mode === "staff" ? getNotificationsForAudience(audience) : [],
  );
  const [apiItems, setApiItems] = useState([]);
  const [financialAlerts, setFinancialAlerts] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [dismissedJoinIds, setDismissedJoinIds] = useState(() => getDismissedJoinRequestIds());
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [busy, setBusy] = useState(false);

  useStaffNotificationsSync(apiEnabled ? 5000 : 0);

  const refreshLocal = useCallback(() => {
    if (mode !== "staff") return;
    setLocalItems(getNotificationsForAudience(audience));
  }, [audience, mode]);

  const refreshSuperAdmin = useCallback(async () => {
    if (mode !== "super_admin") return;
    const state = getSuperAdminState();
    setFinancialAlerts(state.financialAlerts || []);
    setDismissedJoinIds(getDismissedJoinRequestIds());

    const result = await fetchPendingJoinRequestsSummary();
    if (result.ok) {
      setJoinRequests(result.pendingRequests || []);
    }
  }, [mode]);

  const onStaffApiUpdate = useCallback((event) => {
    const rows = event?.detail?.notifications ?? [];
    setApiItems(rows);
  }, []);

  useEffect(() => {
    if (mode === "staff") {
      refreshLocal();
      window.addEventListener(HALL_NOTIFICATIONS_EVENT, refreshLocal);
      window.addEventListener(BOOKINGS_STOP_EVENT, refreshLocal);
      window.addEventListener(STAFF_NOTIFICATIONS_EVENT, onStaffApiUpdate);
      window.addEventListener("focus", refreshLocal);
      return () => {
        window.removeEventListener(HALL_NOTIFICATIONS_EVENT, refreshLocal);
        window.removeEventListener(BOOKINGS_STOP_EVENT, refreshLocal);
        window.removeEventListener(STAFF_NOTIFICATIONS_EVENT, onStaffApiUpdate);
        window.removeEventListener("focus", refreshLocal);
      };
    }

    refreshSuperAdmin();
    const handler = () => refreshSuperAdmin();
    window.addEventListener("super-admin-data-updated", handler);
    window.addEventListener("hall-join-requests-updated", handler);
    return () => {
      window.removeEventListener("super-admin-data-updated", handler);
      window.removeEventListener("hall-join-requests-updated", handler);
    };
  }, [mode, onStaffApiUpdate, refreshLocal, refreshSuperAdmin]);

  const staffItems = useMemo(
    () => (mode === "staff" ? mergeStaffNotifications(localItems, apiEnabled ? apiItems : []) : []),
    [apiEnabled, apiItems, localItems, mode],
  );

  const visibleJoinRequests = useMemo(
    () => joinRequests.filter((req) => !dismissedJoinIds.has(req.id)),
    [dismissedJoinIds, joinRequests],
  );

  const items = useMemo(() => {
    if (mode === "staff") return staffItems;
    return [
      ...visibleJoinRequests.map(mapJoinRequest),
      ...financialAlerts.map(mapFinancialAlert),
    ];
  }, [financialAlerts, mode, staffItems, visibleJoinRequests]);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const toggleSelected = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const markItemRead = useCallback(
    async (item) => {
      if (item.isRead) return;

      if (item.source === "local" && item.localId != null) {
        markHallNotificationRead(item.localId);
        refreshLocal();
        return;
      }

      if (item.source === "api" && item.apiId != null) {
        if (apiEnabled) await markStaffNotificationRead(item.apiId);
        setApiItems((rows) => rows.map((r) => (r.id === item.apiId ? { ...r, isRead: true } : r)));
        await syncStaffNotificationsFromApi();
        return;
      }

      if (item.source === "financial" && item.financialId != null) {
        markAlertRead(item.financialId);
        await refreshSuperAdmin();
      }
    },
    [apiEnabled, refreshLocal, refreshSuperAdmin],
  );

  const markAllRead = useCallback(async () => {
    setBusy(true);
    try {
      if (mode === "staff") {
        markAllHallNotificationsRead(audience);
        refreshLocal();
        if (apiEnabled) {
          const unreadApi = apiItems.filter((r) => !r.isRead);
          await Promise.all(unreadApi.map((r) => markStaffNotificationRead(r.id)));
          await syncStaffNotificationsFromApi();
        }
        return;
      }

      markAllAlertsRead();
      await refreshSuperAdmin();
    } finally {
      setBusy(false);
    }
  }, [apiEnabled, apiItems, audience, mode, refreshLocal, refreshSuperAdmin]);

  const deleteItem = useCallback(
    async (item) => {
      setSelectedIds((prev) => {
        if (!prev.has(item.id)) return prev;
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });

      if (item.source === "local" && item.localId != null) {
        setLocalItems((rows) => rows.filter((r) => r.id !== item.localId));
        deleteHallNotification(item.localId);
        return;
      }

      if (item.source === "api" && item.apiId != null) {
        setApiItems((rows) => rows.filter((r) => r.id !== item.apiId));
        if (apiEnabled) await deleteStaffNotification(item.apiId);
        await syncStaffNotificationsFromApi();
        return;
      }

      if (item.source === "financial" && item.financialId != null) {
        setFinancialAlerts((rows) => rows.filter((r) => r.id !== item.financialId));
        deleteFinancialAlert(item.financialId);
        return;
      }

      if (item.source === "join_request" && item.joinRequestId != null) {
        dismissJoinRequest(item.joinRequestId);
        setDismissedJoinIds(getDismissedJoinRequestIds());
      }
    },
    [apiEnabled],
  );

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBusy(true);

    const selected = items.filter((item) => selectedIds.has(item.id));
    const localIds = selected.filter((i) => i.source === "local").map((i) => i.localId);
    const apiIds = selected.filter((i) => i.source === "api").map((i) => i.apiId);
    const financialIds = selected.filter((i) => i.source === "financial").map((i) => i.financialId);
    const joinIds = selected.filter((i) => i.source === "join_request").map((i) => i.joinRequestId);

    if (localIds.length) deleteHallNotifications(localIds);
    if (financialIds.length) deleteFinancialAlerts(financialIds);
    if (joinIds.length) {
      dismissJoinRequests(joinIds);
      setDismissedJoinIds(getDismissedJoinRequestIds());
    }
    if (apiIds.length && apiEnabled) await deleteStaffNotificationsBatch(apiIds);

    refreshLocal();
    if (apiEnabled) {
      setApiItems((rows) => rows.filter((r) => !apiIds.includes(r.id)));
      await syncStaffNotificationsFromApi();
    }
    if (mode === "super_admin") await refreshSuperAdmin();

    clearSelection();
    setBusy(false);
  }, [apiEnabled, clearSelection, items, mode, refreshLocal, refreshSuperAdmin, selectedIds]);

  const deleteAll = useCallback(async () => {
    setBusy(true);
    try {
      if (mode === "staff") {
        clearHallNotificationsForAudience(audience);
        refreshLocal();
        if (apiEnabled) {
          await deleteAllStaffNotifications();
          setApiItems([]);
          await syncStaffNotificationsFromApi();
        }
        clearSelection();
        return;
      }

      clearFinancialAlerts();
      clearDismissedJoinRequests();
      visibleJoinRequests.forEach((req) => dismissJoinRequest(req.id));
      setDismissedJoinIds(getDismissedJoinRequestIds());
      await refreshSuperAdmin();
      clearSelection();
    } finally {
      setBusy(false);
    }
  }, [apiEnabled, audience, clearSelection, mode, refreshLocal, refreshSuperAdmin, visibleJoinRequests]);

  const openItem = useCallback(
    async (item) => {
      await markItemRead(item);
      if (item.href) navigate(item.href);
      if (item.source === "join_request") navigate(SUPER_ADMIN_ROUTES.pending);
    },
    [markItemRead, navigate],
  );

  return {
    items,
    unreadCount,
    selectedIds,
    selectionMode,
    setSelectionMode,
    busy,
    toggleSelected,
    selectAll,
    clearSelection,
    markItemRead,
    markAllRead,
    deleteItem,
    deleteSelected,
    deleteAll,
    openItem,
    refresh: mode === "super_admin" ? refreshSuperAdmin : refreshLocal,
  };
}
