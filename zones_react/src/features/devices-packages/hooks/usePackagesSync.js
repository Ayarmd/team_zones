import { useEffect } from "react";
import { loadPackages, PACKAGES_STORAGE_EVENT } from "../data/packagesStorage";

const STORAGE_KEY = "zones-packages-v1";

/** مزامنة قائمة الباقات مع LocalStorage عبر التبويبات والواجهات */
export function usePackagesSync(setPackagesList) {
  useEffect(() => {
    const syncFromStorage = () => setPackagesList(loadPackages());

    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) syncFromStorage();
    };

    window.addEventListener(PACKAGES_STORAGE_EVENT, syncFromStorage);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncFromStorage);

    return () => {
      window.removeEventListener(PACKAGES_STORAGE_EVENT, syncFromStorage);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncFromStorage);
    };
  }, [setPackagesList]);
}
