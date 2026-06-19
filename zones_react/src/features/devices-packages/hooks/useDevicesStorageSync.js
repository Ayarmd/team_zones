import { useEffect } from "react";
import { DEVICES_STORAGE_EVENT, DEVICES_STORAGE_KEY } from "../data/devicesStorage";

/** مزامنة عند تغيير الأجهزة — نفس التبويب أو تبويب المدير */
export function useDevicesStorageSync(onSync) {
  useEffect(() => {
    const sync = () => onSync();

    const onStorage = (e) => {
      if (e.key === DEVICES_STORAGE_KEY || e.key === null) sync();
    };

    window.addEventListener(DEVICES_STORAGE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", sync);

    return () => {
      window.removeEventListener(DEVICES_STORAGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", sync);
    };
  }, [onSync]);
}
