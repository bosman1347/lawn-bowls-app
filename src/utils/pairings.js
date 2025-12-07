// src/utils/pairings.js
// ----------------------------------------------------------
// Tournament Pairing Engine for Twilight Pairs (Skins + Standard)
// ----------------------------------------------------------

/*
  This file generates new rounds based on:

  • Week 1 → random shuffle
  • Week 2+ → standings-based seeding (1v2, 3v4, etc.)
  • Strong anti-repeat: avoid teams meeting again if any legal pairing exists
  • Assign greens & rinks (A1–A6, B1–B6), avoiding repeats per team
  • Supports both standard scoring and skins scoring
*/

//
// ----------------------------------------------------------
// 1. COMPUTE STANDINGS from stored matches
// (Used only for generating next-round pairings)
// ----------------------------------------------------------
//

export function computeStandingsForPairings(matches) {
  const table = {};

  (matches || []).forEach((round) => {
    (round || []).forEach((m) => {
      if (!table[m.team1]) {
        table[m.team1] = {
          team: m.team1,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          points: 0,
          shotsFor: 0,
          shotsAgainst: 0,
          diff: 0
        };
      }
      if (!table[m.team2]) {
        table[m.team2] = {
          team: m.team2,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          points: 0,
          shotsFor: 0,
          shotsAgainst: 0,
          diff: 0
        };
      }

      const t1 = table[m.team1];
      const t2 = table[m.team2];

      // -----------------------------
      // Standard scoring
      // -----------------------------
      if (m.score1 != null && m.score2 != null) {
        const s1 = Number(m.score1);
        const s2 = Number(m.score2);

        t1.played++;
        t2.played++;

        t1.shotsFor += s1;
        t1.shotsAgainst += s2;
        t2.shotsFor += s2;
        t2.shotsAgainst += s1;

        t1.diff = t1.shotsFor - t1.shotsAgainst;
        t2.diff = t2.shotsFor - t2.shotsAgainst;

        if (s1 > s2) {
          t1.won++;
          t1.points += 2;
          t2.lost++;
        } else if (s2 > s1) {
          t2.won++;
          t2.points += 2;
          t1.lost++;
        } else {
          t1.drawn++;
          t2.drawn++;
          t1.points++;
          t2.points++;
        }
      }

      // -----------------------------
      // Skins scoring
      // -----------------------------
      else if (m.skins) {
        const skins = m.skins || [];
        let totalA = 0,
          totalB = 0;
        let skinPointsA = 0,
          skinPointsB = 0;

        skins.forEach((s) => {
          const a = s?.a == null ? null : Number(s.a);
          const b = s?.b == null ? null : Number(s.b);
          if (a != null) totalA += a;
          if (b != null) totalB += b;

          if (a != null && b != null) {
            if (a > b) skinPointsA += 1;
            else if (b > a) skinPointsB += 1;
            else {
              skinPointsA += 0.5;
              skinPointsB += 0.5;
            }
          }
        });

        t1.shotsFor += totalA;
        t1.shotsAgainst += totalB;
        t2.shotsFor += totalB;
        t2.shotsAgainst += totalA;

        t1.diff = t1.shotsFor - t1.shotsAgainst;
        t2.diff = t2.shotsFor - t2.shotsAgainst;

        const allComplete =
          skins.length === 3 &&
          skins.every((s) => s?.a != null && s?.b != null);

        if (allComplete) {
          t1.played++;
          t2.played++;

          // Bonus by total shots (split on tie)
          let bonusA = 0,
            bonusB = 0;

          if (totalA > totalB) bonusA = 2;
          else if (totalB > totalA) bonusB = 2;
          else {
            bonusA = 1;
            bonusB = 1;
          }

          const matchPointsA = skinPointsA + bonusA;
          const matchPointsB = skinPointsB + bonusB;

          // Both teams get their own match points
          if (matchPointsA > matchPointsB) {
            t1.won++;
            t2.lost++;

            t1.points += matchPointsA;
            t2.points += matchPointsB;
          } else if (matchPointsB > matchPointsA) {
            t2.won++;
            t1.lost++;

            t2.points += matchPointsB;
            t1.points += matchPointsA;
          } else {
            t1.drawn++;
            t2.drawn++;

            t1.points += matchPointsA;
            t2.points += matchPointsB;
          }
        }
      }
    });
  });

  const arr = Object.values(table);

  return arr.sort(
    (a, b) =>
      b.points - a.points ||
      b.diff - a.diff ||
      b.shotsFor - a.shotsFor ||
      a.team.localeCompare(b.team)
  );
}

//
// ----------------------------------------------------------
// 2. CHECK IF TWO TEAMS HAVE PLAYED BEFORE
// ----------------------------------------------------------
//

function havePlayedBefore(A, B, matches) {
  return (matches || []).some((round) =>
    (round || []).some(
      (m) =>
        (m.team1 === A && m.team2 === B) ||
        (m.team1 === B && m.team2 === A)
    )
  );
}

//
// ----------------------------------------------------------
// 3. RINK ASSIGNMENT HISTORY
// ----------------------------------------------------------
//

function buildRinkHistory(matches) {
  const usage = {};

  (matches || []).forEach((round) => {
    (round || []).forEach((m) => {
      if (!m.green || m.rink == null) return;

      const id = `${m.green}${m.rink}`;
      [m.team1, m.team2].forEach((team) => {
        if (!usage[team]) usage[team] = {};
        usage[team][id] = (usage[team][id] || 0) + 1;
      });
    });
  });

  return usage;
}

//
// ----------------------------------------------------------
// 4. SHUFFLE FOR WEEK 1
// ----------------------------------------------------------
//

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

//
// ----------------------------------------------------------
// 5. RECURSIVE PAIR BUILDER (STRONG ANTI-REPEAT)
// ----------------------------------------------------------
//

// Try to build all pairs without repeat opponents.
// If impossible, allow repeats in a second pass.
function buildPairsRecursive(teams, matches, allowRepeats = false) {
  if (teams.length === 0) return [];

  const [A, ...rest] = teams;

  // BYE handling: if A is BYE, just recurse on the rest
  if (A === "BYE") {
    return buildPairsRecursive(rest, matches, allowRepeats);
  }

  for (let i = 0; i < rest.length; i++) {
    const B = rest[i];
    if (B === "BYE") continue;

    if (!allowRepeats && havePlayedBefore(A, B, matches)) {
      continue;
    }

    const remaining = rest.filter((_, idx) => idx !== i);
    const subPairs = buildPairsRecursive(remaining, matches, allowRepeats);

    if (subPairs !== null) {
      return [[A, B], ...subPairs];
    }
  }

  // No valid pairing found for A
  return null;
}

//
// ----------------------------------------------------------
// 6. GENERATE NEXT ROUND
// ----------------------------------------------------------
//

export function generateNextRound(teams, matches, scoringMethod) {
  const cleanTeams = (teams || []).map((t) => t.trim()).filter(Boolean);
  if (cleanTeams.length < 2) return [];

  const existing = matches || [];
  let ordered;

  // Week 1: Random
  if (existing.length === 0) {
    ordered = shuffle(cleanTeams);
  } else {
    // Later: standings order
    const standings = computeStandingsForPairings(existing);
    const fromStandings = standings.map((s) => s.team);
    const remaining = cleanTeams.filter((t) => !fromStandings.includes(t));
    ordered = [...fromStandings, ...remaining];
  }

  // Add BYE if odd number of teams
  if (ordered.length % 2 === 1) {
    ordered.push("BYE");
  }

  // First attempt: no repeats allowed
  let pairs = buildPairsRecursive(ordered, existing, false);

  // If impossible (rare), allow repeats to avoid deadlock
  if (pairs === null) {
    pairs = buildPairsRecursive(ordered, existing, true);
    if (pairs === null) {
      // Completely impossible (should not happen with sane inputs)
      return [];
    }
  }

  //
  // ------------------------------------------------------
  // 7. RINK ASSIGNMENTS (A1–A6, B1–B6)
  // ------------------------------------------------------
  //

  const allRinks = [
    "A1","A2","A3","A4","A5","A6",
    "B1","B2","B3","B4","B5","B6"
  ];

  const usage = buildRinkHistory(existing);
  const nextRound = [];

  pairs.forEach(([A, B]) => {
    // Choose best rink (least used by either team)
    let best = allRinks[0];
    let bestScore = Infinity;

    allRinks.forEach((r) => {
      const score = (usage[A]?.[r] || 0) + (usage[B]?.[r] || 0);
      if (score < bestScore) {
        bestScore = score;
        best = r;
      }
    });

    const green = best[0];
    const rink = Number(best.slice(1));

    // Update usage so next pair avoids same rink
    [A, B].forEach((t) => {
      if (!usage[t]) usage[t] = {};
      usage[t][best] = (usage[t][best] || 0) + 1;
    });

    const match = {
      team1: A,
      team2: B,
      scoringMethod: scoringMethod || "standard",
      verified: false,
      green,
      rink,
      score1: null,
      score2: null
    };

    if ((scoringMethod || "standard") === "skins") {
      match.skins = [
        { a: null, b: null },
        { a: null, b: null },
        { a: null, b: null }
      ];
    } else {
      match.skins = null;
    }

    nextRound.push(match);
  });

  return nextRound;
}
