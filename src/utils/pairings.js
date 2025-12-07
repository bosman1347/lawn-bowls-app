/**
 * Pairing Engine v2 — Centurion Bowls Club
 * ---------------------------------------
 * NEW FEATURES:
 *  - Deterministic rink assignment (A1–A6 then B1–B6)
 *  - Avoid teams using the same rink twice (until all rinks exhausted)
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

      const rink = m.green + String(m.rink);

      if (!teamRinkHistory[m.team1]) teamRinkHistory[m.team1] = {};
      if (!teamRinkHistory[m.team2]) teamRinkHistory[m.team2] = {};

      teamRinkHistory[m.team1][rink] =
        (teamRinkHistory[m.team1][rink] || 0) + 1;

      teamRinkHistory[m.team2][rink] =
        (teamRinkHistory[m.team2][rink] || 0) + 1;
    });
  });

  /** ----------------------------------------------------------
   * STEP 1 — Make provisional opponent list based on standings
   * ---------------------------------------------------------- */
  const provisional = [];
  for (let i = 0; i < N; i += 2) {
    if (i + 1 < N) {
      provisional.push([teams[i], teams[i + 1]]);
    }
  }

  /** ----------------------------------------------------------
   * STEP 2 — Repair any repeated opponents
   * ---------------------------------------------------------- */
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

  /** ----------------------------------------------------------
   * STEP 3 — Assign Rinks (the fixed version)
   * ---------------------------------------------------------- */

  // Deterministic order: first match A1, last match B6
  const rinkOrder = [
    "A1","A2","A3","A4","A5","A6",
    "B1","B2","B3","B4","B5","B6"
  ];
  let rinkPointer = 0;

  const round = [];

  for (let i = 0; i < provisional.length; i++) {
    const [team1, team2] = provisional[i];

    // Default rink in simple rotation
    let assigned = rinkOrder[rinkPointer % rinkOrder.length];
    rinkPointer++;

    // Avoid repeat rinks IF possible
    const avoid = (teamRinkHistory[team1] || {});
    const avoid2 = (teamRinkHistory[team2] || {});
    const safeRinks = rinkOrder.filter(
      r => !avoid[r] && !avoid2[r]
    );

    // If there exists a rink neither team has used → choose the FIRST such rink
    if (safeRinks.length > 0) {
      assigned = safeRinks[0];
    }

    // Parse into green + rink number
    const green = assigned[0];
    const rink = parseInt(assigned.slice(1), 10);

    // Record rink usage
    teamRinkHistory[team1] = teamRinkHistory[team1] || {};
    teamRinkHistory[team2] = teamRinkHistory[team2] || {};

    teamRinkHistory[team1][assigned] =
      (teamRinkHistory[team1][assigned] || 0) + 1;

    teamRinkHistory[team2][assigned] =
      (teamRinkHistory[team2][assigned] || 0) + 1;

    // Push final match object
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
