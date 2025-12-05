import { useState, useEffect, useMemo } from "react";
import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";

/*
 Patched Standings.jsx
 - computeStandings is memoized with useMemo
 - only recalculates when matches data changes
 - uses 'allSkinsComplete' logic so partial skins don't mark played/W/D/L
*/

export default function Standings() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setMatches(data.matches || []);
    }
  }, []);

  // memoized computeStandings - runs only when matches changes
  const computedStandings = useMemo(() => {
    return computeStandings(matches);
  }, [JSON.stringify(matches)]); // stringify is cheap enough for moderate sizes

  // computeStandings implementation
  function computeStandings(matchRounds) {
    const table = {};

    (matchRounds || []).forEach((round) => {
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

        // Standard match
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
        } else if (m.skins) {
          // SKINS match
          const skins = m.skins || [];
          let totalA = 0, totalB = 0;
          let skinPointsA = 0, skinPointsB = 0;

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

          // accumulate shots even if partial
          t1.shotsFor += totalA;
          t1.shotsAgainst += totalB;
          t2.shotsFor += totalB;
          t2.shotsAgainst += totalA;

          t1.diff = t1.shotsFor - t1.shotsAgainst;
          t2.diff = t2.shotsFor - t2.shotsAgainst;

          // Fully completed match only when all skins have both values
          const allSkinsComplete = skins.length === 3 && skins.every((s) => s?.a != null && s?.b != null);

          if (allSkinsComplete) {
            t1.played++;
            t2.played++;

            // Bonus by total shots (split if equal)
            let bonusA = 0, bonusB = 0;
            if (totalA > totalB) bonusA = 2;
            else if (totalB > totalA) bonusB = 2;
            else {
              bonusA = 1;
              bonusB = 1;
            }

            const matchPointsA = skinPointsA + bonusA;
            const matchPointsB = skinPointsB + bonusB;

            if (matchPointsA > matchPointsB) {
              t1.won++;
              t1.points += matchPointsA;
              t2.lost++;
            } else if (matchPointsB > matchPointsA) {
              t2.won++;
              t2.points += matchPointsB;
              t1.lost++;
            } else {
              t1.drawn++;
              t2.drawn++;
              t1.points += matchPointsA;
              t2.points += matchPointsB;
            }
          } else {
            // partial: don't increment played/WDL; shots already accumulated
          }
        }
      });
    });

    return Object.values(table).sort((a, b) =>
      b.points - a.points ||
      b.diff - a.diff ||
      b.shotsFor - a.shotsFor ||
      a.team.localeCompare(b.team)
    );
  }

  if (!tournamentName) {
    return <div className="page"><h2>No active tournament</h2></div>;
  }

  const standings = computedStandings;

  return (
    <div className="page">
      <h2>Standings — {tournamentName}</h2>

      <table className="standings-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>SF</th>
            <th>SA</th>
            <th>SD</th>
            <th>Pts</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((row, index) => (
            <tr
              key={row.team}
              className={
                index === 0
                  ? "first-place"
                  : index === 1
                  ? "second-place"
                  : ""
              }
            >
              <td>{index + 1}</td>
              <td>{row.team}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.shotsFor}</td>
              <td>{row.shotsAgainst}</td>
              <td>{row.diff}</td>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
