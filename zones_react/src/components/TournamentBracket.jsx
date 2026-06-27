import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./TournamentBracket.css";
import {
  advanceWinner,
  applyTimeBasedStatusTransitions,
  buildBracketGridLayout,
  canSelectWinner,
  formatMatchSchedule,
  matchStatusCssKey,
  matchStatusLabel,
  MATCH_STATUS,
  normalizeMatchStatus,
  syncBracketMatchLifecycle,
  toDatetimeLocalValue,
  updateMatchSchedule,
} from "../features/tournaments/bracket/bracketUtils";
import { getOrCreateBracketState, saveBracketState } from "../features/tournaments/bracket/bracketStorage";
import { updateManagerMatch } from "../features/tournaments/data/managerTournamentsApi";

function uiStatus(match) {
  return normalizeMatchStatus(match);
}

function MatchStatusBadge({ status }) {
  const cssKey = matchStatusCssKey(status);
  const label = matchStatusLabel(status);

  return (
    <span className={`tb-match-status-badge tb-match-status-badge--${cssKey}`}>
      {status === MATCH_STATUS.LIVE ? (
        <>
          <span className="tb-live-dot" aria-hidden />
          <span>{label}</span>
        </>
      ) : (
        label
      )}
    </span>
  );
}

function initials(name) {
  if (!name || typeof name !== "string") return "؟";
  const t = name.trim();
  if (!t) return "؟";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).slice(0, 2);
  return t.slice(0, 2);
}

function isJoinLit(rounds, roundIndex, parentMatchIndex) {
  const feederA = rounds[roundIndex]?.matches[parentMatchIndex * 2];
  const feederB = rounds[roundIndex]?.matches[parentMatchIndex * 2 + 1];
  return Boolean(feederA?.winner || feederB?.winner);
}

function BracketJoin({ simple, lit }) {
  return (
    <div className={`tb-bracket-join ${simple ? "tb-bracket-join--simple" : ""} ${lit ? "tb-bracket-join--lit" : ""}`} aria-hidden>
      <span className="tb-bracket-join__in1" />
      <span className="tb-bracket-join__in2" />
      <span className="tb-bracket-join__v" />
      <span className="tb-bracket-join__out" />
      <span className="tb-bracket-join__arrow" />
    </div>
  );
}

function PlayerRow({ name, winnerName, score, completed }) {
  const isWait = !name?.trim();
  const display = isWait ? "بانتظار الفائز" : name.trim();
  const isWinner = Boolean(completed && winnerName && name && name === winnerName);
  const isLoser = Boolean(completed && winnerName && name && name !== winnerName);
  const hasScore = typeof score === "number" && !Number.isNaN(score);
  const scoreLabel = hasScore ? String(score) : "–";

  return (
    <div
      className={`tb-player-row ${isWait ? "tb-player-row--wait" : ""} ${isWinner ? "tb-player-row--winner" : ""} ${isLoser ? "tb-player-row--loser" : ""}`}
    >
      <span className="tb-player-avatar" aria-hidden>{isWait ? "…" : initials(name)}</span>
      <span className="tb-player-name" title={isWait ? undefined : display}>{display}</span>
      {isWinner ? <span className="tb-player-win-tag">فائز</span> : null}
      <span
        className={`tb-player-score ${hasScore ? "tb-player-score--set" : ""} ${isWinner ? "tb-player-score--winner" : ""}`}
        aria-label={hasScore ? `النتيجة ${scoreLabel}` : "لم تُحدد النتيجة"}
      >
        {scoreLabel}
      </span>
    </div>
  );
}

function MatchCard({ match, st, clickable, onOpen }) {
  const completed = st === MATCH_STATUS.FINISHED;
  const scheduleLabel = formatMatchSchedule(match.scheduledAt);
  const cssKey = matchStatusCssKey(st);

  return (
    <div
      role="button"
      tabIndex={clickable ? 0 : -1}
      className={`tb-match-card tb-match-card--${cssKey} ${clickable ? "tb-match-card--clickable" : ""}`}
      onClick={() => clickable && onOpen(match)}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(match);
        }
      }}
    >
      <div className="tb-match-card__head">
        <span className="tb-match-card__label">مباراة</span>
        <MatchStatusBadge status={st} />
      </div>
      {scheduleLabel ? (
        <p className="tb-match-card__schedule" title={scheduleLabel}>
          {scheduleLabel}
        </p>
      ) : null}
      <div className="tb-match-card__body">
        <PlayerRow name={match.playerA} winnerName={match.winner} score={match.scoreA} completed={completed} />
        <PlayerRow name={match.playerB} winnerName={match.winner} score={match.scoreB} completed={completed} />
      </div>
    </div>
  );
}

export default function TournamentBracket({
  tournament,
  onBack,
  breadcrumb,
  variant = "default",
  bracketState = null,
  onBracketChange = null,
  apiSync = false,
}) {
  const [bracket, setBracket] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalStep, setModalStep] = useState(null);
  const [confirmWinner, setConfirmWinner] = useState(null);
  const [scheduleInput, setScheduleInput] = useState("");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [winnerPushNotice, setWinnerPushNotice] = useState("");

  useEffect(() => {
    if (!tournament) {
      setBracket(null);
      return;
    }
    if (bracketState) {
      const rounds = structuredClone(bracketState.rounds);
      syncBracketMatchLifecycle(rounds);
      setBracket({ ...bracketState, rounds });
      return;
    }
    const local = getOrCreateBracketState(tournament);
    if (local?.rounds) {
      const rounds = structuredClone(local.rounds);
      syncBracketMatchLifecycle(rounds);
      setBracket({ ...local, rounds });
    } else {
      setBracket(local);
    }
  }, [tournament, bracketState]);

  useEffect(() => {
    if (!tournament) return undefined;

    const tick = () => {
      setBracket((current) => {
        if (!current?.rounds?.length) return current;
        const rounds = structuredClone(current.rounds);
        if (!applyTimeBasedStatusTransitions(rounds)) return current;
        const next = { ...current, rounds };
        saveBracketState(tournament.id, next);
        if (typeof onBracketChange === "function") onBracketChange(next);
        return next;
      });
    };

    tick();
    const interval = window.setInterval(tick, 10000);
    return () => window.clearInterval(interval);
  }, [tournament, onBracketChange]);

  const persistLocal = useCallback(
    (next) => {
      if (!tournament) return;
      saveBracketState(tournament.id, next);
      setBracket(next);
      if (typeof onBracketChange === "function") onBracketChange(next);
    },
    [tournament, onBracketChange],
  );

  const closeAll = () => {
    setSelectedMatch(null);
    setModalStep(null);
    setConfirmWinner(null);
    setScheduleInput("");
    setScoreA("");
    setScoreB("");
    setFormError("");
    setSaving(false);
  };

  const openMatchActions = (match) => {
    setSelectedMatch(match);
    setModalStep("actions");
    setConfirmWinner(null);
    setScheduleInput(toDatetimeLocalValue(match.scheduledAt));
    setScoreA(match.scoreA != null && match.scoreA !== "" ? String(match.scoreA) : "");
    setScoreB(match.scoreB != null && match.scoreB !== "" ? String(match.scoreB) : "");
    setFormError("");
  };

  const applyBracketFromServer = (serverBracket) => {
    if (!serverBracket?.rounds?.length) return;
    const rounds = structuredClone(serverBracket.rounds);
    syncBracketMatchLifecycle(rounds);
    persistLocal({ ...serverBracket, rounds });
  };

  const handleScheduleSave = async () => {
    if (!selectedMatch || !bracket || !tournament) return;
    if (!scheduleInput.trim()) {
      setFormError("اختر تاريخ ووقت للمباراة.");
      return;
    }
    const scheduledIso = new Date(scheduleInput).toISOString();
    if (Number.isNaN(new Date(scheduleInput).getTime())) {
      setFormError("التاريخ أو الوقت غير صالح.");
      return;
    }

    setSaving(true);
    setFormError("");

    if (apiSync && selectedMatch.dbId) {
      const result = await updateManagerMatch(tournament.id, selectedMatch.dbId, {
        scheduled_at: scheduledIso,
      });
      setSaving(false);
      if (!result.ok) {
        setFormError(result.error || "تعذر حفظ الموعد.");
        return;
      }
      applyBracketFromServer(result.bracket);
      closeAll();
      return;
    }

    const rounds = structuredClone(bracket.rounds);
    const ok = updateMatchSchedule(rounds, selectedMatch.id, scheduledIso);
    setSaving(false);
    if (!ok) {
      setFormError("تعذر تحديث الموعد.");
      return;
    }
    persistLocal({ ...bracket, rounds });
    closeAll();
  };

  const openWinnerFlow = () => {
    if (!selectedMatch) return;
    if (!canSelectWinner(selectedMatch)) {
      const st = normalizeMatchStatus(selectedMatch);
      if (st !== MATCH_STATUS.LIVE) {
        setFormError("يمكن اختيار الفائز فقط عندما تصبح المباراة جارية (بعد بدء الموعد المحدد).");
      } else {
        setFormError("لا يمكن اختيار الفائز قبل اكتمال اللاعبين وجدولة المباراة.");
      }
      return;
    }
    setFormError("");
    setModalStep("winner");
    setScoreA("");
    setScoreB("");
  };

  const handleWinnerPick = (playerName) => {
    const sa = Number.parseInt(scoreA, 10);
    const sb = Number.parseInt(scoreB, 10);
    if (!Number.isFinite(sa) || !Number.isFinite(sb) || sa < 0 || sb < 0) {
      setFormError("أدخل نتيجة صحيحة لكل لاعب.");
      return;
    }
    if (sa === sb) {
      setFormError("لا يمكن أن تكون النتيجة متعادلة.");
      return;
    }
    const highPlayer = sa > sb ? selectedMatch.playerA : selectedMatch.playerB;
    if (highPlayer !== playerName) {
      setFormError("الفائز يجب أن يكون صاحب النقاط الأعلى.");
      return;
    }
    setFormError("");
    setConfirmWinner(playerName);
  };

  const confirmSaveWinner = async () => {
    if (!selectedMatch || !confirmWinner || !bracket || !tournament) return;
    const sa = Number.parseInt(scoreA, 10);
    const sb = Number.parseInt(scoreB, 10);

    setSaving(true);
    setFormError("");

    if (apiSync && selectedMatch.dbId) {
      const winnerId =
        confirmWinner === selectedMatch.playerA ? selectedMatch.playerAId : selectedMatch.playerBId;
      if (!winnerId) {
        setSaving(false);
        setFormError("تعذر تحديد معرّف الفائز.");
        return;
      }
      const result = await updateManagerMatch(tournament.id, selectedMatch.dbId, {
        winner_id: Number(winnerId),
        score1: sa,
        score2: sb,
      });
      setSaving(false);
      if (!result.ok) {
        setFormError(result.error || "تعذر حفظ النتيجة.");
        return;
      }
      applyBracketFromServer(result.bracket);
      if (result.notificationQueued) {
        setWinnerPushNotice("تم إرسال إشعار الفوز لجميع مستخدمي التطبيق.");
      }
      closeAll();
      return;
    }

    const rounds = structuredClone(bracket.rounds);
    const ok = advanceWinner(rounds, selectedMatch.id, confirmWinner, { scoreA: sa, scoreB: sb });
    setSaving(false);
    if (!ok) {
      setFormError("تعذر حفظ النتيجة. تحقق من البيانات.");
      return;
    }
    persistLocal({ ...bracket, rounds });
    closeAll();
  };

  const gridLayout = useMemo(() => buildBracketGridLayout(bracket), [bracket]);

  if (!tournament) {
    return (
      <div className="tb-bracket-page tb-bracket-fallback" dir="rtl">
        <p style={{ textAlign: "center", color: "#9ca3af" }}>تعذر عرض الشجرة.</p>
      </div>
    );
  }

  if (!bracket || !gridLayout) {
    return (
      <div className="tb-bracket-page tb-bracket-fallback" dir="rtl">
        <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
          الشجرة غير جاهزة — أكمل عدد المشاركين أولاً.
        </p>
      </div>
    );
  }

  const rounds = bracket.rounds;
  const { numRows, numRounds, colTemplate, rowTemplate } = gridLayout;
  const isManager = variant === "manager";
  const pageClass = isManager ? "tb-bracket-page tb-bracket-page--manager" : "tb-bracket-page";
  const winnerEligible = selectedMatch ? canSelectWinner(selectedMatch) : false;

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

      {winnerPushNotice ? (
        <p className="tb-winner-push-notice" role="status">
          {winnerPushNotice}
        </p>
      ) : null}

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
                const clickable = isManager;
                const isFirstRound = r === 0;
                const isLastRound = r === numRounds - 1;
                const pathLit = Boolean(match.winner);
                const inboundLit = r > 0 && Boolean(match.playerA || match.playerB);

                return (
                  <div
                    key={match.id}
                    className="tb-grid-match-cell"
                    style={{ gridRow: `${rowStart} / span ${span}`, gridColumn: r * 2 + 1 }}
                  >
                    {!isFirstRound ? (
                      <div className="tb-conn-gutter tb-conn-gutter--in" aria-hidden>
                        <span className={`tb-conn-h-line tb-conn-h-line--inbound ${inboundLit ? "tb-conn-h-line--lit" : ""}`} />
                      </div>
                    ) : null}
                    <div className="tb-match-card-slot">
                      <MatchCard match={match} st={st} clickable={clickable} onOpen={openMatchActions} />
                    </div>
                    {!isLastRound ? (
                      <div className="tb-conn-gutter tb-conn-gutter--out" aria-hidden>
                        <span className={`tb-conn-h-line tb-conn-h-line--outbound ${pathLit ? "tb-conn-h-line--lit" : ""}`} />
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
                    <BracketJoin simple={simple} lit={isJoinLit(rounds, r, m)} />
                  </div>
                ));
              })}
          </div>
        </div>
      </div>

      {selectedMatch && modalStep === "actions" ? (
        <div className="tb-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="tb-winner-modal tb-action-modal">
            <button type="button" className="tb-close-btn" aria-label="إغلاق" onClick={closeAll}>
              ×
            </button>
            <h3>إدارة المباراة</h3>
            <p className="tb-match-meta">
              {selectedMatch.playerA || "بانتظار الفائز"} vs {selectedMatch.playerB || "بانتظار الفائز"}
            </p>
            {selectedMatch.scheduledAt ? (
              <p className="tb-schedule-hint">الموعد الحالي: {formatMatchSchedule(selectedMatch.scheduledAt)}</p>
            ) : (
              <p className="tb-schedule-hint">لم يُحدد موعد لهذه المباراة بعد.</p>
            )}

            {formError && modalStep === "actions" ? <p className="tb-form-error">{formError}</p> : null}

            <div className="tb-action-options">
              <button type="button" className="tb-action-btn tb-action-btn--schedule" onClick={() => setModalStep("schedule")}>
                <span className="tb-action-btn__title">إدارة موعد المباراة</span>
                <span className="tb-action-btn__hint">جدولة أو تعديل التاريخ والوقت</span>
              </button>
              <button
                type="button"
                className={`tb-action-btn tb-action-btn--winner ${winnerEligible ? "" : "tb-action-btn--disabled"}`}
                onClick={openWinnerFlow}
                disabled={!winnerEligible}
              >
                <span className="tb-action-btn__title">اختيار الفائز</span>
                <span className="tb-action-btn__hint">
                  {winnerEligible
                    ? "تسجيل النتيجة والتأهل التلقائي"
                    : "يتطلب مباراة جارية (بعد بدء الموعد)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMatch && modalStep === "schedule" ? (
        <div className="tb-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="tb-winner-modal">
            <button type="button" className="tb-close-btn" aria-label="إغلاق" onClick={() => setModalStep("actions")}>
              ×
            </button>
            <h3>إدارة موعد المباراة</h3>
            <p>حدد تاريخ ووقت المباراة أو عدّل الموعد الحالي.</p>

            <div className="tb-schedule-field">
              <label htmlFor="tb-schedule-input">التاريخ والوقت</label>
              <input
                id="tb-schedule-input"
                type="datetime-local"
                className="tb-datetime-input"
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
              />
            </div>

            {formError ? <p className="tb-form-error">{formError}</p> : null}

            <div className="tb-modal-actions">
              <button type="button" className="tb-primary-btn" onClick={handleScheduleSave} disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ الموعد"}
              </button>
              <button type="button" className="tb-secondary-btn" onClick={() => setModalStep("actions")}>
                رجوع
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMatch && modalStep === "winner" && !confirmWinner ? (
        <div className="tb-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="tb-winner-modal">
            <button type="button" className="tb-close-btn" aria-label="إغلاق" onClick={() => setModalStep("actions")}>
              ×
            </button>
            <h3>اختيار الفائز</h3>
            <p>{selectedMatch.playerA} vs {selectedMatch.playerB}</p>

            <div className="tb-score-grid">
              <div className="tb-score-field">
                <label htmlFor="tb-score-a">{selectedMatch.playerA}</label>
                <input
                  id="tb-score-a"
                  type="number"
                  min={0}
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                />
              </div>
              <div className="tb-score-field">
                <label htmlFor="tb-score-b">{selectedMatch.playerB}</label>
                <input
                  id="tb-score-b"
                  type="number"
                  min={0}
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                />
              </div>
            </div>

            {formError ? <p className="tb-form-error">{formError}</p> : null}

            <div className="tb-winner-options">
              <button type="button" onClick={() => handleWinnerPick(selectedMatch.playerA)}>
                فوز {selectedMatch.playerA}
              </button>
              <button type="button" onClick={() => handleWinnerPick(selectedMatch.playerB)}>
                فوز {selectedMatch.playerB}
              </button>
            </div>
            <button type="button" className="tb-secondary-btn tb-secondary-btn--inline" onClick={() => setModalStep("actions")}>
              رجوع
            </button>
          </div>
        </div>
      ) : null}

      {confirmWinner ? (
        <div className="tb-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setConfirmWinner(null)}>
          <div className="tb-confirm-modal">
            <h3>تأكيد الفائز</h3>
            <p>
              النتيجة {scoreA} – {scoreB} · الفائز: {confirmWinner}
            </p>
            {formError ? <p className="tb-form-error">{formError}</p> : null}
            <div className="tb-confirm-actions">
              <button type="button" className="tb-yes-btn" onClick={confirmSaveWinner} disabled={saving}>
                {saving ? "جاري الحفظ..." : "تأكيد"}
              </button>
              <button type="button" className="tb-no-btn" onClick={() => setConfirmWinner(null)}>
                تراجع
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
