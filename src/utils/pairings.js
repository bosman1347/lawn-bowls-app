// src/utils/pairings.js

/**
 * Generate the next round of pairings.
 *
 * standings: [{ team, points?, diff? }, ...]
 * previousRounds: [
 *   [
 *     { team1, team2, green, rink, ... },
 *     ...
 *   ],
 *   ...
 * ]
 */
export function generateNextRound(standings, previousRounds) {
  console.log("PAIRINGS DEBUG — previousRounds:", previousRounds);

  if (!standings || standings.length < 2) return [];

  // 1) Order teams by points & shot diff if available
  const ordered = [...standings].sort((a, b) => {
    const pa = a.points ?? 0;
    const pb = b.points ?? 0;
    if (pb !== pa) return pb - pa;

    const da = a.diff ?? 0;
    const db = b.diff ?? 0;
    if (db !== da) return db - da;

    // fallback: alphabetical
    return String(a.team).localeCompare(String(b.team));
  });

  const teams = ordered.map((s) => s.team);
  const N = teams.length;

  // 2) Build opponent + rink history from ALL previous rounds
  const usedPairs = new Set();          // "AA_BB"
  const teamRinkHistory = {};           // team -> { "A1": count, "B3": count, ... }

  previousRounds.forEach((round) => {
    (round || []).forEach((m) => {
      if (!m || !m.team1 || !m.team2) return;

      const k1 = m.team1 + "_" + m.team2;
      const k2 = m.team2 + "_" + m.team1;
      usedPairs.add(k1);
      usedPairs.add(k2);

      if (m.green && m.rink != null) {
        const rinkName = String(m.green) + String(m.rink);

        if (!teamRinkHistory[m.team1]) teamRinkHistory[m.team1] = {};
        if (!teamRinkHistory[m.team2]) teamRinkHistory[m.team2] = {};

        teamRinkHistory[m.team1][rinkName] =
          (teamRinkHistory[m.team1][rinkName] || 0) + 1;
        teamRinkHistory[m.team2][rinkName] =
          (teamRinkHistory[m.team2][rinkName] || 0) + 1;
      }
    });
  });

  // 3) Initial pairings: 1 vs 2, 3 vs 4, ...
  const provisional = [];
  for (let i = 0; i + 1 < N; i += 2) {
    provisional.push([teams[i], teams[i + 1]]);
  }

  // 4) Repair any repeated opponents by swapping
  for (let i = 0; i < provisional.length; i++) {
    let [A, B] = provisional[i];
    let key = A + "_" + B;
    if (!usedPairs.has(key)) continue; // unique -> OK

    // Try to swap B with someone else
    for (let j = i + 1; j < provisional.length; j++) {
      let [C, D] = provisional[j];

      // Try A vs C
      if (!usedPairs.has(A + "_" + C) && !usedPairs.has(C + "_" + A)) {
        provisional[i] = [A, C];
        provisional[j] = [B, D];
        key = A + "_" + C;
        break;
      }

      // Try A vs D
      if (!usedPairs.has(A + "_" + D) && !usedPairs.has(D + "_" + A)) {
        provisional[i] = [A, D];
        provisional[j] = [B, C];
        key = A + "_" + D;
        break;
      }
    }
  }

  // 5) Rink allocation
  // Rinks available THIS round (no duplicates per round)
  const rinkOrder = [
    "A1", "A2", "A3", "A4", "A5", "A6",
    "B1", "B2", "B3", "B4", "B5", "B6"
  ];
  const rinksThisRound = new Set(); // "A1", "B3", ...

  const round = [];

  for (const [team1, team2] of provisional) {
    // Pick the "best" rink for these two teams:
    // - must not be used yet this round
    // - minimise (historyTeam1 + historyTeam2)
    let bestLabel = null;
    let bestScore = Infinity;

    for (const label of rinkOrder) {
      if (rinksThisRound.has(label)) continue;

      const h1 = teamRinkHistory[team1]?.[label] || 0;
      const h2 = teamRinkHistory[team2]?.[label] || 0;
      const score = h1 + h2;

      if (score < bestScore) {
        bestScore = score;
        bestLabel = label;
      }
    }

    // Fallback in case there are more matches than rinks
    if (!bestLabel) {
      for (const label of rinkOrder) {
        const h1 = teamRinkHistory[team1]?.[label] || 0;
        const h2 = teamRinkHistory[team2]?.[label] || 0;
        const score = h1 + h2;
        if (score < bestScore) {
          bestScore = score;
          bestLabel = label;
        }
      }
    }

    // Parse green + rink
    const green = bestLabel ? bestLabel[0] : "A";
    const rink = bestLabel ? parseInt(bestLabel.slice(1), 10) : 1;

    // Mark rink used this round
    const rinkName = green + String(rink);
    rinksThisRound.add(rinkName);

    // Update cumulative rink history for future rounds
    if (!teamRinkHistory[team1]) teamRinkHistory[team1] = {};
    if (!teamRinkHistory[team2]) teamRinkHistory[team2] = {};
    teamRinkHistory[team1][rinkName] =
      (teamRinkHistory[team1][rinkName] || 0) + 1;
    teamRinkHistory[team2][rinkName] =
      (teamRinkHistory[team2][rinkName] || 0) + 1;

    // Build match object expected by the rest of the app
    round.push({
      team1,
      team2,
      green,
      rink,
      // Skins/standard fields start empty; Matches.jsx will fill them
      score1: null,
      score2: null,
      skins: [
        { a: null, b: null },
        { a: null, b: null },
        { a: null, b: null }
      ],
      totalA: null,
      totalB: null,
      skinPointsA: null,
      skinPointsB: null,
      bonusA: null,
      bonusB: null,
      matchPointsA: null,
      matchPointsB: null,
      verified: false
    });
  }

  console.log("PAIRINGS DEBUG — generated round:", round);
  return round;
}

