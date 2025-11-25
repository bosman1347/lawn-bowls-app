import { useEffect, useState } from "react";

export default function Standings() {
  const savedTournament = localStorage.getItem("tournament");
  const savedResults = localStorage.getItem("results");

  const tournament = savedTournament ? JSON.parse(savedTournament) : null;
  const results = savedResults ? JSON.parse(savedResults) : [];

  const [table, setTable] = useState([]);

  useEffect(() => {
    if (!tournament) return;

    // Initialize team stats
    const stats = {};
    tournament.teams.forEach((team) => {
      stats[team] = {
        team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        shotsFor: 0,
        shotsAgainst: 0,
        shotDiff: 0,
        points: 0,
      };
    });

    // Process all results
    results.forEach((round) => {
      if (!round) return;

      round.forEach((match) => {
        if (!match) return;

        const { teamA, teamB, scoreA, scoreB } = match;

        // Update basic stats
        stats[teamA].played++;
        stats[teamB].played++;

        stats[teamA].shotsFor += scoreA;
        stats[teamA].shotsAgainst += scoreB;
        stats[teamB].shotsFor += scoreB;
        stats[teamB].shotsAgainst += scoreA;

        // Determine match outcome
        if (scoreA > scoreB) {
          stats[teamA].wins++;
          stats[teamB].losses++;
          stats[teamA].points += 2;
        } else if (scoreB > scoreA) {
          stats[teamB].wins++;
          stats[teamA].losses++;
          stats[teamB].points += 2;
        } else {
          stats[teamA].draws++;
          stats[teamB].draws++;
          stats[teamA].points += 1;
          stats[teamB].points += 1;
        }
      });
    });

    // Compute shot difference
    Object.values(stats).forEach((t) => {
      t.shotDiff = t.shotsFor - t.shotsAgainst;
    });

    // Sort table: points → shotDiff → shotsFor
    const sorted = Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.shotDiff !== a.shotDiff) return b.shotDiff - a.shotDiff;
      return b.shotsFor - a.shotsFor;
    });

    setTable(sorted);
  }, [results, tournament]);

  if (!tournament) {
    return (
      <div className="page">
        <h2>No tournament found</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Standings</h2>

      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
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
          {table.map((t, i) => (
            <tr key={i}>
              <td>{t.team}</td>
              <td>{t.played}</td>
              <td>{t.wins}</td>
              <td>{t.draws}</td>
              <td>{t.losses}</td>
              <td>{t.shotsFor}</td>
              <td>{t.shotsAgainst}</td>
              <td>{t.shotDiff}</td>
              <td>{t.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
