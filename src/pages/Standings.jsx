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
