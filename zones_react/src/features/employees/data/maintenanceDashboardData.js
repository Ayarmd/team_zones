import {
  getHallFaultSummary,
  getHallFaultTableRows,
  loadSyncedActiveDevices,
} from "../../devices-packages/utils/deviceFaultSync";
import { loadFaults } from "../../maintenance/data/maintenanceFaultsStorage";
import { faultTypeLabel } from "../../maintenance/data/faultMeta";

const RED = { r: 239, g: 68, b: 68 };
const PURPLE = { r: 107, g: 84, b: 120 };

function colorForRank(value, max, min) {
  const t = max === min ? 0 : (max - value) / (max - min);
  const r = Math.round(RED.r + (PURPLE.r - RED.r) * t);
  const g = Math.round(RED.g + (PURPLE.g - RED.g) * t);
  const b = Math.round(RED.b + (PURPLE.b - RED.b) * t);
  return `rgb(${r},${g},${b})`;
}

export function getMaintenanceFaultsSummary() {
  return getHallFaultSummary();
}

export function getMaintenancePendingBadgeCount() {
  return getHallFaultSummary().waiting;
}

export function getMaintenanceDashboardView() {
  const summary = getHallFaultSummary();
  return {
    kpis: {
      waitingFaults: summary.waiting,
      inProgressFaults: summary.inProgress,
      resolvedFaults: summary.resolved,
    },
  };
}

export function getMaintenanceDashboardTableRows(filter) {
  return getHallFaultTableRows(filter);
}

export function buildFaultReasonBreakdown() {
  const deviceIds = new Set(loadSyncedActiveDevices().map((d) => d.id));
  const map = {};

  for (const fault of loadFaults().filter(
    (f) => !f.archived && f.status === "pending" && deviceIds.has(f.deviceId),
  )) {
    const label = faultTypeLabel(fault.faultType, fault.faultTypeCustom);
    map[label] = (map[label] || 0) + 1;
  }

  const entries = Object.entries(map).map(([name, value]) => ({ name, value }));
  if (entries.length === 0) return [];

  entries.sort((a, b) => b.value - a.value);
  const max = entries[0].value;
  const min = entries[entries.length - 1].value;

  return entries.map((entry) => ({
    ...entry,
    color: colorForRank(entry.value, max, min),
  }));
}
