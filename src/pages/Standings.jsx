import { useState, useEffect } from "react";
import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";

export default function Standings() {
  const [tournamentName, setTournamentName] = useState("");
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);

      const computed = computeStandings(data.matches);
      setStandings(computed);
    }
  }, []);

  // computeStandings handles both standard and skins match formats
  function computeStandings(matchRounds) {
    const table = {};

    matchRounds.forEach((round) => {
      round.forEach((m) => {
        // ensure team entries exist
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

        // Standard match (score1/score2)
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
          // skins: [{a,b},{a,b},{a,b}]
          const skins = m.skins;
          let totalA = 0,
            totalB = 0;
          let skinPointsA = 0,
            skinPointsB = 0;

          skins.forEach((s) => {
            const a = s.a == null ? null : Number(s.a);
            const b = s.b == null ? null : Number(s.b);
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

          // Only count match as played if at least one skin has both values filled
          const anyCompleteSkin = skins.some((s) => s.a != null && s.b != null);
          if (anyCompleteSkin) {
            t1.played++;
            t2.played++;
          }

          // Shots totals
          t1.shotsFor += totalA;
          t1.shotsAgainst += totalB;
          t2.shotsFor += totalB;
          t2.shotsAgainst += totalA;

          t1.diff = t1.shotsFor - t1.shotsAgainst;
          t2.diff = t2.shotsFor - t2.shotsAgainst;

          // Bonus allocation based on total skin points (tie -> split)
          let bonusA = 0,
            bonusB = 0;
          if (skinPointsA > skinPointsB) {
            bonusA = 2;
          } else if (skinPointsB > skinPointsA) {
            bonusB = 2;
          } else {
            bonusA = 1;
            bonusB = 1;
          }

          const matchPointsA = skinPointsA + bonusA;
          const matchPointsB = skinPointsB + bonusB;

          // Assign points and W/D/L based on matchPoints
          if (matchPointsA > matchPointsB) {
            t1.won++;
            t1.points += matchPointsA;
            t2.lost++;
          } else if (matchPointsB > matchPointsA) {
            t2.won++;
            t2.points += matchPointsB;
            t1.lost++;
          } else {
            // tie on match points
            t1.drawn++;
            t2.drawn++;
            t1.points += matchPointsA;
            t2.points += matchPointsB;
          }
        }
      });
    });

    // Sort by points, diff, shotsFor, name
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
