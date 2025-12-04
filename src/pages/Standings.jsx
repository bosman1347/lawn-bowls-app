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

  // ----------------------------------------------------
  // NEW computeStandings: Adds Shots For / Against
  // ----------------------------------------------------
  function computeStandings(matchRounds) {
    const table = {};

    matchRounds.forEach((round) => {
      round.forEach((m) => {
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

        if (m.score1 == null || m.score2 == null) return;

        const s1 = m.score1;
        const s2 = m.score2;

        // Played
        t1.played++;
        t2.played++;

        // NEW: Shots for / against
        t1.shotsFor += s1;
        t1.shotsAgainst += s2;

        t2.shotsFor += s2;
        t2.shotsAgainst += s1;

        // NEW: Shot difference
        t1.diff = t1.shotsFor - t1.shotsAgainst;
        t2.diff = t2.shotsFor - t2.shotsAgainst;

        // Result
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
      });
    });

    // NEW: Improved tie-breaking
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
