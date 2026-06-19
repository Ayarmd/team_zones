import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./TournamentBracket.css";
import { advanceWinner } from "../features/tournaments/bracket/bracketUtils";
import { getOrCreateBracketState, saveBracketState } from "../features/tournaments/bracket/bracketStorage";

function uiStatus(match) {
  if (match.winner || match.status === "completed") return "completed";
  if (match.status === "live") return "active";
  return "upcoming";
}

/** موصل بين دورين: خطان أفقيان من اليسار + عمودي + خط لليمين + سهم */
function BracketJoin({ simple }) {
  return (
    <div className={`tb-bracket-join ${simple ? "tb-bracket-join--simple" : ""}`} aria-hidden>
      <span className="tb-bracket-join__in1" />
      <span className="tb-bracket-join__in2" />
      <span className="tb-bracket-join__v" />
      <span className="tb-bracket-join__out" />
      <span className="tb-bracket-join__arrow" />
    </div>
  );
}

export default function TournamentBracket({ tournament, onBack, breadcrumb, variant = "default", bracketState = null }) {
  const [bracket, setBracket] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [addStep, setAddStep] = useState(null);
  const [confirmWinner, setConfirmWinner] = useState(null);

  useEffect(() => {
    if (!tournament) {
      setBracket(null);
      return;
    }
    if (bracketState) {
      setBracket(bracketState);
      return;
    }
    setBracket(getOrCreateBracketState(tournament));
  }, [tournament, bracketState]);

  const persist = useCallback(
    (next) => {
      if (!tournament) return;
      saveBracketState(tournament.id, next);
      setBracket(next);
    },
    [tournament],
  );

  const closeAll = () => {
    setSelectedMatch(null);
    setAddStep(null);
    setConfirmWinner(null);
  };

  const openAddFlow = (match) => {
    if (!match.playerA || !match.playerB || match.winner) return;
    setSelectedMatch(match);
    setAddStep("intro");
    setConfirmWinner(null);
  };

  const handleWinnerPick = (playerName) => {
    setConfirmWinner(playerName);
  };

  const confirmSaveWinner = () => {
    if (!selectedMatch || !confirmWinner || !bracket || !tournament) return;
    const rounds = structuredClone(bracket.rounds);
    const ok = advanceWinner(rounds, selectedMatch.id, confirmWinner, null);
    if (!ok) return;
    persist({ ...bracket, rounds });
    closeAll();
  };

  const gridLayout = useMemo(() => {
    if (!bracket?.rounds?.length) return null;
    const numRows = bracket.bracketSize;
    const numRounds = bracket.rounds.length;
    const colParts = [];
    for (let r = 0; r < numRounds; r++) {
      colParts.push("minmax(232px, 18rem)");
      if (r < numRounds - 1) colParts.push("minmax(56px, 4.5rem)");
    }
    return {
      numRows,
      numRounds,
      colTemplate: colParts.join(" "),
      rowTemplate: `auto repeat(${numRows}, minmax(58px, 78px))`,
    };
  }, [bracket]);

  if (!tournament) {
    return (
      <div className="tb-bracket-page" dir="rtl">
        <p style={{ textAlign: "center", color: "#94a3b8" }}>تعذر عرض الشجرة.</p>
      </div>
    );
  }

  if (!bracket || !gridLayout) {
    return (
      <div className="tb-bracket-page" dir="rtl">
        <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
          الشجرة غير جاهزة — أكمل عدد المشاركين أولاً.
        </p>
      </div>
    );
  }

  const rounds = bracket.rounds;
  const { numRows, numRounds, colTemplate, rowTemplate } = gridLayout;
  const isManager = variant === "manager";
  const pageClass = isManager ? "tb-bracket-page tb-bracket-page--manager" : "tb-bracket-page";

  return (
    <div className={pageClass} dir="rtl">
      {!isManager ? (
        <div className="tb-bracket-header">
          <div>
            {breadcrumb ? <p className="tb-breadcrumb">{breadcrumb}</p> : null}
            <h1>شجرة البطولة</h1>
            <p className="tb-bracket-subtitle">
              {tournament.name} · {bracket.bracketSize} لاعباً
            </p>
          </div>
          {typeof onBack === "function" ? (
            <button type="button" className="tb-back-btn" onClick={onBack}>
              العودة لتفاصيل البطولة
            </button>
          ) : null}
        </div>
      ) : (
        <p className="tb-bracket-subtitle tb-bracket-subtitle--manager">
          {tournament.name} · {bracket.bracketSize} لاعباً
        </p>
      )}

      {/* LTR: أول دور يسار ← النهائي يمين؛ خطوط الموصل تتجه يميناً */}
      <div className="tb-bracket-scroll">
        <div className="tb-bracket-grid-wrap" dir="ltr">
          <div
            className="tb-bracket-grid"
            style={{
              gridTemplateColumns: colTemplate,
              gridTemplateRows: rowTemplate,
            }}
          >
            {rounds.map((round, r) => (
              <div key={`h-${round.roundIndex}`} className="tb-bracket-grid-head" style={{ gridRow: 1, gridColumn: r * 2 + 1 }}>
                {round.title}
              </div>
            ))}

            {rounds.flatMap((round, r) =>
              round.matches.map((match, m) => {
                const span = numRows / round.matches.length;
                const rowStart = 2 + m * span;
                const st = uiStatus(match);
                const clickable = isManager && Boolean(match.playerA && match.playerB && !match.winner);
                const isFirstRound = r === 0;
                const isLastRound = r === numRounds - 1;
                return (
                  <div
                    key={match.id}
                    className="tb-grid-match-cell"
                    style={{ gridRow: `${rowStart} / span ${span}`, gridColumn: r * 2 + 1 }}
                  >
                    {!isFirstRound ? (
                      <div className="tb-conn-gutter tb-conn-gutter--in" aria-hidden>
                        <span className="tb-conn-h-line tb-conn-h-line--inbound" />
                      </div>
                    ) : null}
                    <div className="tb-match-card-slot">
                      <div
                        role="button"
                        tabIndex={clickable ? 0 : -1}
                        className={`tb-match-card tb-match-card--${st} ${clickable ? "tb-match-card--clickable" : ""}`}
                        onClick={() => clickable && openAddFlow(match)}
                        onKeyDown={(e) => {
                          if (!clickable) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openAddFlow(match);
                          }
                        }}
                      >
                        <div className={`tb-player-row ${match.winner === match.playerA ? "winner" : ""}`}>
                          <span>{match.playerA || "بانتظار الفائز"}</span>
                          {match.winner === match.playerA ? <b>فائز</b> : null}
                        </div>
                        <div className={`tb-player-row ${match.winner === match.playerB ? "winner" : ""}`}>
                          <span>{match.playerB || "بانتظار الفائز"}</span>
                          {match.winner === match.playerB ? <b>فائز</b> : null}
                        </div>
                        <span className="tb-match-status">
                          {st === "completed" ? "مكتملة" : st === "active" ? "جارية" : "قادمة"}
                        </span>
                      </div>
                    </div>
                    {!isLastRound ? (
                      <div className="tb-conn-gutter tb-conn-gutter--out" aria-hidden>
                        <span className="tb-conn-h-line tb-conn-h-line--outbound" />
                      </div>
                    ) : null}
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
                  <div
                    key={`join-${r}-${m}`}
                    className="tb-grid-join-cell"
                    style={{ gridRow: `${2 + m * spanParent} / span ${spanParent}`, gridColumn: r * 2 + 2 }}
                  >
                    <BracketJoin simple={simple} />
                  </div>
                ));
              })}
          </div>
        </div>
      </div>

      {selectedMatch && addStep === "intro" ? (
        <div className="tb-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="tb-winner-modal">
            <button type="button" className="tb-close-btn" aria-label="إغلاق" onClick={closeAll}>
              ×
            </button>
            <h3>إضافة</h3>
            <p>اختر الفائز من هذه المباراة.</p>
            <button type="button" className="tb-primary-btn" onClick={() => setAddStep("pick")}>
              متابعة
            </button>
          </div>
        </div>
      ) : null}

      {selectedMatch && addStep === "pick" && !confirmWinner ? (
        <div className="tb-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="tb-winner-modal">
            <button type="button" className="tb-close-btn" aria-label="إغلاق" onClick={closeAll}>
              ×
            </button>
            <h3>إضافة</h3>
            <p>اختر الفائز من المباراة</p>
            <div className="tb-winner-options">
              <button type="button" onClick={() => handleWinnerPick(selectedMatch.playerA)}>
                {selectedMatch.playerA}
              </button>
              <button type="button" onClick={() => handleWinnerPick(selectedMatch.playerB)}>
                {selectedMatch.playerB}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmWinner ? (
        <div className="tb-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setConfirmWinner(null)}>
          <div className="tb-confirm-modal">
            <h3>تأكيد الفائز</h3>
            <p>هل أنت متأكد أن الفائز هو {confirmWinner}؟</p>
            <div className="tb-confirm-actions">
              <button type="button" className="tb-yes-btn" onClick={confirmSaveWinner}>
                نعم
              </button>
              <button type="button" className="tb-no-btn" onClick={() => setConfirmWinner(null)}>
                لا
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
