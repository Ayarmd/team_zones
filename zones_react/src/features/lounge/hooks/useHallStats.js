import { useEffect, useState } from "react";
import { DEVICES_STORAGE_EVENT, loadActiveDevices } from "../../devices-packages/data/devicesStorage";
import { loadActivePackages, PACKAGES_STORAGE_EVENT } from "../../devices-packages/data/packagesStorage";
import { EMPLOYEES_STORAGE_EVENT, loadEmployees } from "../../employees/data/employeesStorage";

export function getHallStats() {
  return {
    deviceCount: loadActiveDevices().length,
    packageCount: loadActivePackages().length,
    employeeCount: loadEmployees().length,
  };
}

/** إحصائيات الصالة — تُحدَّث تلقائياً عند إضافة أو حذف أجهزة / باقات / موظفين */
export function useHallStats() {
  const [stats, setStats] = useState(getHallStats);

  useEffect(() => {
    const refresh = () => setStats(getHallStats());

    window.addEventListener(DEVICES_STORAGE_EVENT, refresh);
    window.addEventListener(PACKAGES_STORAGE_EVENT, refresh);
    window.addEventListener(EMPLOYEES_STORAGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(DEVICES_STORAGE_EVENT, refresh);
      window.removeEventListener(PACKAGES_STORAGE_EVENT, refresh);
      window.removeEventListener(EMPLOYEES_STORAGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return stats;
}
