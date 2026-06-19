/** أقرب أس 2 ≥ n (للبطولة الإقصائية) */
export function nextPowerOfTwo(n) {
  const x = Math.max(2, Math.floor(Number(n)) || 2);
  let p = 1;
  while (p < x) p <<= 1;
  return p;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleRandom(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function shuffleSeeded(arr, seed) {
  const out = [...arr];
  const rnd = mulberry32(typeof seed === "number" ? seed : String(seed).split("").reduce((s, c) => s + c.charCodeAt(0), 0));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export { shuffleRandom };

const NAME_POOL = [
  "أحمد محمد",
  "محمد علي",
  "خالد سالم",
  "يوسف إبراهيم",
  "عمر حسن",
  "سعيد ماجد",
  "طارق فيصل",
  "ناصر وليد",
  "فهد راشد",
  "مشعل عبدالله",
  "راكان سلطان",
  "بندر نايف",
  "سلطان تركي",
  "تركي مشعل",
  "عبدالرحمن صالح",
  "صالح عبدالعزيز",
  "عزيز منصور",
  "منصور حمد",
  "حمد جاسم",
  "جاسم مبارك",
  "مبارك علي",
  "علي حسين",
  "حسين كريم",
  "كريم رامي",
  "رامي لؤي",
  "لؤي زياد",
  "زياد مازن",
  "مازن شادي",
  "شادي باسم",
  "باسم هشام",
  "هشام وليد",
  "وليد عماد",
];

export function buildPlayerSlots(tournament, options = {}) {
  const { realOnly = false, playerNames = null } = options;
  const count = Math.max(2, Number(tournament.participants) || 2);
  const size = nextPowerOfTwo(count);

  let names = playerNames;
  if (!names && Array.isArray(tournament.registeredPlayers)) {
    names = tournament.registeredPlayers.filter((x) => typeof x === "string" && x.trim());
  }

  if (names && names.length >= count) {
    const shuffled = shuffleSeeded(names.slice(0, count), tournament.id ?? 1);
    const slots = [];
    for (let i = 0; i < size; i += 1) {
      slots.push(i < shuffled.length ? shuffled[i].trim() : `BYE ${i + 1}`);
    }
    return { bracketSize: size, players: slots };
  }

  if (realOnly) {
    return null;
  }

  const reg = names ?? [];
  const slots = [];
  if (reg.length > 0) {
    for (let i = 0; i < reg.length; i += 1) slots.push(reg[i].trim());
    for (let i = reg.length; i < size; i += 1) slots.push(`مشارك ${i + 1}`);
  } else {
    const shuffled = shuffleSeeded([...NAME_POOL], tournament.id ?? 1);
    for (let i = 0; i < size; i += 1) {
      slots.push(i < shuffled.length ? shuffled[i] : `لاعب ${i + 1}`);
    }
  }
  return { bracketSize: size, players: slots };
}

export function roundTitleAtIndex(bracketSize, roundIndex) {
  const teamsAtStart = bracketSize / 2 ** roundIndex;
  if (teamsAtStart >= 16) return "دور الـ16";
  if (teamsAtStart === 8) return "ربع النهائي";
  if (teamsAtStart === 4) return "نصف النهائي";
  if (teamsAtStart === 2) return "النهائي";
  return `الدور ${roundIndex + 1}`;
}

/** يضمن وجود حقول النتيجة ويُكمّل مباريات قديمة بلا أرقام */
export function normalizeBracketRounds(rounds) {
  for (const round of rounds) {
    for (const m of round.matches) {
      if (m.scoreA === undefined) m.scoreA = null;
      if (m.scoreB === undefined) m.scoreB = null;
      if (m.winner && m.playerA && m.playerB && (m.scoreA == null || m.scoreB == null)) {
        m.scoreA = m.winner === m.playerA ? 1 : 0;
        m.scoreB = m.winner === m.playerB ? 1 : 0;
      }
    }
  }
}

export function createEmptyBracket(tournament, options = {}) {
  const built = buildPlayerSlots(tournament, options);
  if (!built) return null;
  const { bracketSize, players } = built;
  const numRounds = Math.log2(bracketSize);
  const rounds = [];
  for (let r = 0; r < numRounds; r++) {
    const matchesInRound = bracketSize / 2 ** (r + 1);
    const matches = [];
    for (let m = 0; m < matchesInRound; m++) {
      const id = `r${r}-m${m}`;
      if (r === 0) {
        const pa = players[m * 2] ?? null;
        const pb = players[m * 2 + 1] ?? null;
        matches.push({
          id,
          r,
          m,
          playerA: pa,
          playerB: pb,
          winner: null,
          scoreA: null,
          scoreB: null,
          status: "pending",
        });
      } else {
        matches.push({
          id,
          r,
          m,
          playerA: null,
          playerB: null,
          winner: null,
          scoreA: null,
          scoreB: null,
          status: "pending",
        });
      }
    }
    rounds.push({
      roundIndex: r,
      title: roundTitleAtIndex(bracketSize, r),
      matches,
    });
  }
  applyLiveStatus(rounds);
  return { bracketSize, players, rounds, tournamentId: tournament.id };
}

export function applyLiveStatus(rounds) {
  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.status === "live") match.status = "pending";
    }
  }
  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.status === "completed") continue;
      if (match.playerA && match.playerB && !match.winner) {
        match.status = "live";
        return;
      }
    }
  }
}

/**
 * @param {{ scoreA: number, scoreB: number } | null} scores - إن وُجد يجب أن يطابق الفائز (الأعلى نقاطاً).
 */
export function advanceWinner(rounds, matchId, winnerName, scores = null) {
  const flat = rounds.flatMap((x) => x.matches);
  const match = flat.find((x) => x.id === matchId);
  if (!match || match.winner) return false;
  if (winnerName !== match.playerA && winnerName !== match.playerB) return false;

  let sa;
  let sb;
  if (scores && typeof scores.scoreA === "number" && typeof scores.scoreB === "number") {
    sa = scores.scoreA;
    sb = scores.scoreB;
    if (sa < 0 || sb < 0 || sa === sb) return false;
    const hi = sa > sb ? match.playerA : match.playerB;
    if (hi !== winnerName) return false;
  } else {
    sa = winnerName === match.playerA ? 1 : 0;
    sb = winnerName === match.playerB ? 1 : 0;
  }
  match.scoreA = sa;
  match.scoreB = sb;
  match.winner = winnerName;
  match.status = "completed";

  const nextR = match.r + 1;
  if (nextR >= rounds.length) {
    applyLiveStatus(rounds);
    return true;
  }
  const nextM = Math.floor(match.m / 2);
  const next = rounds[nextR].matches[nextM];
  if (match.m % 2 === 0) next.playerA = winnerName;
  else next.playerB = winnerName;

  applyLiveStatus(rounds);
  return true;
}
