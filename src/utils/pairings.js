/**
 * Pairing Engine v2 — Centurion Bowls Club
 * ---------------------------------------
 * FEATURES:
 *  - Deterministic rink assignment (A1–A6 then B1–B6)
 *  - Avoid teams using the same rink twice (once they have history)
 *  - Avoid repeat opponents
 *  - Works for 24-team Twilight Pairs (12 matches per round)
 */

export function generateNextRound(standings, previousRounds) {
  if (!standings || standings.length === 0) return [];

  const teams = standings.map((s) => s.team);
  const N = teams.length;
  const usedPairs = new Set();
  const teamRinkHistory = {}; // team -> { rinkName: count }

  // Build previous opponent + rink history
  previousRounds.forEach((round) => {
    round.forEach((m) => {
      const k1 = m.team1 + "_" + m.team2;
      const k2 = m.team2 + "_" + m.team1;
      usedPairs.add(k1);
      usedPairs.add(k2);

      const rinkName = m.green + String(m.rink);

      if (!teamRinkHistory[m.team1]) teamRinkHistory[m.team1] = {};
      if (!teamRinkHistory[m.team2]) teamRinkHistory[m.team2] = {};

      teamRinkHistory[m.team1][rinkName] =
        (teamRinkHistory[m.team1][rinkName] || 0) + 1;

      teamRinkHistory[m.team2][rinkName] =
        (teamRinkHistory[m.team2][rinkName] || 0) + 1;
    });
  });

  /** STEP 1 — provisional pairings by standings */
  const provisional = [];
  for (let i = 0; i < N; i += 2) {
    if (i + 1 < N) {
      provisional.push([teams[i], teams[i + 1]]);
    }
  }

  /** STEP 2 — repair any repeated opponents */
  for (let i = 0; i < provisional.length; i++) {
    let [A, B] = provisional[i];
    let key = A + "_" + B;

    if (!usedPairs.has(key)) continue; // OK pair

    // Try to swap with another pairing
    for (let j = i + 1; j < provisional.length; j++) {
      let [C, D] = provisional[j];

      // Try swap B <-> C
      if (!usedPairs.has(A + "_" + C)) {
        provisional[i] = [A, C];
        provisional[j] = [B, D];
        break;
      }

      // Try swap B <-> D
      if (!usedPairs.has(A + "_" + D)) {
        provisional[i] = [A, D];
        provisional[j] = [B, C];
        break;
      }
    }
  }

  /** STEP 3 — Assign rinks */

  const rinkOrder = [
    "A1","A2","A3","A4","A5","A6",
    "B1","B2","B3","B4","B5","B6"
  ];
  let rinkPointer = 0;

  const round = [];

  for (let i = 0; i < provisional.length; i++) {
    const [team1, team2] = provisional[i];

    // Default rink in simple rotation (A1..A6,B1..B6)
    let assigned = rinkOrder[rinkPointer % rinkOrder.length];
    rinkPointer++;

    // Only try to avoid repeat rinks if either team has history
    const avoid = teamRinkHistory[team1] || {};
    const avoid2 = teamRinkHistory[team2] || {};
    const hasHistory =
      Object.keys(avoid).length > 0 || Object.keys(avoid2).length > 0;

    if (hasHistory) {
      const safeRinks = rinkOrder.filter(
        (r) => !avoid[r] && !avoid2[r]
      );

      if (safeRinks.length > 0) {
        assigned = safeRinks[0];
      }
    }

    const green = assigned[0];
    const rink = parseInt(assigned.slice(1), 10);

    // Record rink usage for future rounds
    const rinkName = assigned;
    teamRinkHistory[team1] = teamRinkHistory[team1] || {};
    teamRinkHistory[team2] = teamRinkHistory[team2] || {};

    teamRinkHistory[team1][rinkName] =
      (teamRinkHistory[team1][rinkName] || 0) + 1;
    teamRinkHistory[team2][rinkName] =
      (teamRinkHistory[team2][rinkName] || 0) + 1;

    round.push({
      team1,
      team2,
      green,
      rink,
      score1: null,
      score2: null,
      verified: false
    });
  }

  return round;
}
