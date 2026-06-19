import { useEffect } from "react";
import { loadTournamentRows, TOURNAMENTS_LIST_EVENT } from "../tournamentsListStorage";

function rowsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** مزامنة قائمة البطولات بين تبويبات/صفحات المدير وموظف الاستقبال */
export function useTournamentRowsSync(setRows) {
  useEffect(() => {
    const sync = () => {
      setRows((prev) => {
        const next = loadTournamentRows();
        return rowsEqual(prev, next) ? prev : next;
      });
    };

    window.addEventListener(TOURNAMENTS_LIST_EVENT, sync);
    window.addEventListener("focus", sync);

    return () => {
      window.removeEventListener(TOURNAMENTS_LIST_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, [setRows]);
}
