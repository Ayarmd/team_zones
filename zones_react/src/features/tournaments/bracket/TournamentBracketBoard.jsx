import { useMemo } from "react";
import "./TournamentBracketBoard.css";

function initials(name) {
  if (!name || typeof name !== "string") return "؟";
  const t = name.trim();
  if (!t) return "؟";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).slice(0, 2);
  return t.slice(0, 2);
}

function statusLabel(match) {
  if (match.status === "completed" || match.winner) return "مكتمل";
  if (match.status === "live") return "جاري";
  return "قادم";
}

function BracketJoin({ simple }) {
  return (
    <div className={`tbb-join ${simple ? "tbb-join--simple" : ""}`} aria-hidden>
      <span className="tbb-join__h1" />
      <span className="tbb-join__h2" />
      <span className="tbb-join__v" />
      <span className="tbb-join__out" />
    </div>
  );
}

function PlayerRow({ name, winnerName, onLightSurface, score }) {
  const isWinner = Boolean(winnerName && name && name === winnerName);
  const display = name?.trim() || "بانتظار الفائز";
  const isWait = !name?.trim();
  const hasScore = typeof score === "number" && !Number.isNaN(score);

  return (
    <div
      className={`flex items-center gap-2 border-b border-black/10 py-1.5 pe-1.5 ps-2 last:border-b-0 ${
        isWinner ? (onLightSurface ? "bg-violet-200/50" : "bg-violet-500/15") : ""
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          isWait
            ? "border border-dashed border-white/15 bg-white/5 text-slate-500"
            : onLightSurface
              ? "border border-slate-400/60 bg-slate-100 text-slate-800 shadow-sm"
              : "border border-violet-500/35 bg-gradient-to-br from-violet-600/80 to-indigo-700/90 text-white shadow-sm"
        }`}
        aria-hidden
      >
        {isWait ? "…" : initials(name)}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-end text-xs font-semibold leading-tight ${
          isWait ? "text-slate-500" : onLightSurface ? "text-slate-900" : "text-slate-100"
        }`}
        title={name?.trim() || undefined}
      >
        {display}
      </span>
      <span
        className={`w-9 shrink-0 text-center text-xs font-black tabular-nums ${
          onLightSurface ? "text-slate-800" : "text-slate-200"
        }`}
      >
        {hasScore ? score : isWinner && !hasScore ? "✓" : "–"}
      </span>
    </div>
  );
}

function MatchCard({ match, menuMatch, onOpenMenu, onViewResult, onOpenResult }) {
  const completed = match.status === "completed" || match.winner;
  const active = match.status === "live" && !match.winner;

  const shell =
    completed
      ? "border-slate-400/70 bg-slate-200 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
      : active
        ? "border-emerald-400/65 bg-emerald-400/14 text-emerald-50 shadow-[0_0_26px_rgba(52,211,153,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]"
        : "border-white/12 bg-[#121622] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(99,102,241,0.08)]";

  const canAddResult = Boolean(match.playerA && match.playerB && !match.winner);

  return (
    <div className="tbb-match-wrap">
      <button
        type="button"
        onClick={() => onOpenMenu(match)}
        className={`group flex h-full min-h-0 w-full max-w-[17rem] flex-col overflow-hidden rounded-xl border-2 text-start transition ${shell} hover:brightness-[1.04] active:scale-[0.995]`}
        style={{ direction: "rtl" }}
      >
        <div className="flex items-center justify-between gap-1.5 border-b border-white/8 bg-black/15 px-2 py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300/90">مباراة</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
              completed ? "bg-slate-600/25 text-slate-800" : active ? "bg-emerald-500/25 text-emerald-200" : "bg-white/8 text-slate-400"
            }`}
          >
            {statusLabel(match)}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <PlayerRow name={match.playerA} winnerName={match.winner} onLightSurface={completed} score={match.scoreA} />
          <PlayerRow name={match.playerB} winnerName={match.winner} onLightSurface={completed} score={match.scoreB} />
        </div>
      </button>

      {menuMatch?.id === match.id ? (
        <div
          className="absolute end-0 top-[calc(100%-2px)] z-30 min-w-[11rem] overflow-hidden rounded-lg border border-violet-500/35 bg-[#0c101c] py-0.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-violet-500/25"
          style={{ direction: "rtl" }}
        >
          <button
            type="button"
            className="flex w-full justify-end px-3 py-2 text-end text-xs font-medium text-slate-100 transition hover:bg-violet-600/25"
            onClick={() => onViewResult(match)}
          >
            عرض النتيجة
          </button>
          <button
            type="button"
            disabled={!canAddResult}
            className={`flex w-full justify-end px-3 py-2 text-end text-xs font-medium transition ${
              canAddResult ? "text-emerald-200 hover:bg-emerald-600/20" : "cursor-not-allowed text-slate-600"
            }`}
            onClick={() => canAddResult && onOpenResult(match)}
          >
            إضافة النتيجة
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * شجرة إقصائية: أعمدة Grid + خطوط بين الأدوار.
 */
export default function TournamentBracketBoard({
  rounds,
  bracketSize,
  menuMatch,
  onOpenMenu,
  onViewResult,
  onOpenResult,
  containerRef,
}) {
  const numRows = bracketSize;
  const numRounds = rounds.length;

  const colTemplate = useMemo(() => {
    if (numRounds <= 1) return "minmax(220px, 17rem)";
    const parts = [];
    for (let r = 0; r < numRounds; r++) {
      parts.push("minmax(220px, 17rem)");
      if (r < numRounds - 1) parts.push("52px");
    }
    return parts.join(" ");
  }, [numRounds]);

  const rowTemplate = `auto repeat(${numRows}, minmax(56px, 78px))`;

  return (
    <div className="tbb-root pb-2 pt-1" ref={containerRef}>
      <div
        className="tbb-grid"
        style={{
          gridTemplateColumns: colTemplate,
          gridTemplateRows: rowTemplate,
        }}
      >
        {rounds.map((round, r) => (
          <div key={`h-${round.roundIndex}`} className="tbb-head" style={{ gridRow: 1, gridColumn: r * 2 + 1 }}>
            {round.title}
          </div>
        ))}

        {rounds.flatMap((round, r) =>
          round.matches.map((match, m) => {
            const span = numRows / round.matches.length;
            const rowStart = 2 + m * span;
            return (
              <div
                key={match.id}
                className="flex h-full min-h-0 flex-col items-center justify-center px-0.5 py-3"
                style={{ gridRow: `${rowStart} / span ${span}`, gridColumn: r * 2 + 1 }}
              >
                <MatchCard
                  match={match}
                  menuMatch={menuMatch}
                  onOpenMenu={onOpenMenu}
                  onViewResult={onViewResult}
                  onOpenResult={onOpenResult}
                />
              </div>
            );
          }),
        )}

        {numRounds > 1 &&
          rounds.slice(0, -1).flatMap((_, r) => {
            const next = rounds[r + 1];
            const parents = next.matches.length;
            const spanParent = numRows / parents;
            const simple = parents === 1;
            return next.matches.map((__, m) => (
              <div key={`join-${r}-${m}`} style={{ gridRow: `${2 + m * spanParent} / span ${spanParent}`, gridColumn: r * 2 + 2 }}>
                <BracketJoin simple={simple} />
              </div>
            ));
          })}
      </div>
    </div>
  );
}
