import { useEffect, useState } from "react";
import jsPDF from "jspdf";

import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";


export default function Standings() {
 const all = loadTournaments();
const active = getActiveTournament();
const data = all[active] || {};

const tournament = data.tournament || null;
const matches = data.matches || [];
const results = data.results || [];


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

    // Compute all results
    results.forEach((round) => {
      if (!round) return;
      round.forEach((match) => {
        if (!match) return;

        const { teamA, teamB, scoreA, scoreB } = match;

        stats[teamA].played++;
        stats[teamB].played++;

        stats[teamA].shotsFor += scoreA;
        stats[teamA].shotsAgainst += scoreB;
        stats[teamB].shotsFor += scoreB;
        stats[teamB].shotsAgainst += scoreA;

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

    Object.values(stats).forEach((t) => {
      t.shotDiff = t.shotsFor - t.shotsAgainst;
    });

    // Sort by points → shot diff → shots for
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

  const resetTournament = () => {
    if (window.confirm("Are you sure you want to reset the tournament?")) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  // Row background colours for top 3
  const getRowStyle = (index) => {
    if (index === 0) return { background: "#fffae6" }; // gold
    if (index === 1) return { background: "#f0f0f0" }; // silver
    if (index === 2) return { background: "#ffe6cc" }; // bronze
    return {};
  };

  return (
    <div className="page">
      <h2>Standings</h2>

      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          maxWidth: "800px",
        }}
      >
        <thead>
          <tr style={{ background: "#1C5D3A", color: "white" }}>
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
            <tr key={i} style={getRowStyle(i)}>
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
 <button
  onClick={() => {
    const rows = [
      ["Team", "P", "W", "D", "L", "SF", "SA", "SD", "Pts"],
      ...table.map((t) => [
        t.team,
        t.played,
        t.wins,
        t.draws,
        t.losses,
        t.shotsFor,
        t.shotsAgainst,
        t.shotDiff,
        t.points,
      ]),
    ];

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "standings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }}
  style={{ marginTop: "1.5rem", padding: "0.5rem 1rem" }}
>
  Export Standings to CSV
</button>

	  <button
  onClick={() => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Tournament Standings", 14, 20);

    doc.setFontSize(12);
    doc.text(
      "Team                 P   W   D   L   SF   SA   SD   Pts",
      14,
      35
    );

    let y = 45;

    table.forEach((t) => {
      const row = `${t.team.padEnd(18)} ${String(t.played).padStart(
        2
      )}   ${String(t.wins).padStart(2)}   ${String(t.draws).padStart(
        2
      )}   ${String(t.losses).padStart(2)}   ${String(t.shotsFor).padStart(
        3
      )}   ${String(t.shotsAgainst).padStart(
        3
      )}   ${String(t.shotDiff).padStart(3)}   ${String(t.points).padStart(
        3
      )}`;

      doc.text(row, 14, y);
      y += 8;

      // Create a new page if needed
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("standings.pdf");
  }}
  style={{ marginTop: "1.5rem", padding: "0.5rem 1rem" }}
>
  Export Standings to PDF
</button>

      <button
        onClick={resetTournament}
        style={{ marginTop: "1.5rem", padding: "0.5rem 1rem" }}
      >
        Reset Tournament
      </button>
	 

    </div>
  );
}
