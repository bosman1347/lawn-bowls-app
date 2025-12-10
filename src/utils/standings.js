// src/utils/standings.js

export function computeStandings(matchRounds) {
  const table = {};

  if (!Array.isArray(matchRounds)) return [];

  matchRounds.forEach((round) => {
    (round || []).forEach((m) => {
      if (!m || !m.team1 || !m.team2) return;

      if (!table[m.team1]) {
        table[m.team1] = {
          team: m.team1,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          points: 0,
          diff: 0,
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
          diff: 0,
        };
      }

      // Skip unverified or incomplete matches
      if (!m.verified) return;

      const s1 = m.totalA ?? m.score1;
      const s2 = m.totalB ?? m.score2;

      if (s1 == null || s2 == null) return;

      const t1 = table[m.team1];
      const t2 = table[m.team2];

      t1.played++;
      t2.played++;

      t1.diff += s1 - s2;
      t2.diff += s2 - s1;

      if (s1 > s2) {
        t1.won++;
        t1.points += m.matchPointsA ?? 2;
        t2.lost++;
      } else if (s2 > s1) {
        t2.won++;
        t2.points += m.matchPointsB ?? 2;
        t1.lost++;
      } else {
        t1.drawn++;
        t2.drawn++;
        t1.points += m.matchPointsA ?? 1;
        t2.points += m.matchPointsB ?? 1;
      }
    });
  });

  return Object.values(table).sort(
    (a, b) => b.points - a.points || b.diff - a.diff
  );
}
