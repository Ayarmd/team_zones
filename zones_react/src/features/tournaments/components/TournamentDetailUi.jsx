export function TournamentDetailCell({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xs font-bold text-gray-800 dark:text-gray-100">{value ?? "—"}</p>
    </div>
  );
}

export function TournamentBreadcrumb({ tournamentName, view }) {
  const idle = "text-gray-400 font-semibold";
  const active = "text-gray-900 font-extrabold dark:text-white";
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="مسار التنقل">
      <span className={idle}>{tournamentName}</span>
      {view === "participants" || view === "bracket" ? (
        <>
          <span className="text-gray-300">/</span>
          <span className={view === "participants" ? active : idle}>قائمة المشاركين</span>
        </>
      ) : (
        <>
          <span className="text-gray-300">/</span>
          <span className={view === "details" ? active : idle}>تفاصيل البطولة</span>
        </>
      )}
      {view === "bracket" ? (
        <>
          <span className="text-gray-300">/</span>
          <span className={active}>شجرة البطولة</span>
        </>
      ) : null}
    </nav>
  );
}
