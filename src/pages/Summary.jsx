import { useEffect, useState } from "react";

import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";


export default function Summary() {
  const all = loadTournaments();
  const active = getActiveTournament();
  const data = all[active] || {};

  const tournament = data.tournament || null;
  const matches = data.matches || [];
  const results = data.results || [];


  useEffect(() => {
    const comp = [];
    const nxt = [];

    matches.forEach((round, rIdx) => {
      round.forEach((m, mIdx) => {
        const res = results[rIdx]?.[mIdx];
        if (res && res.scoreA !== "" && res.scoreB !== "") {
          comp.push({ ...m, ...res, round: rIdx + 1 });
        } else {
          nxt.push({ ...m, round: rIdx + 1 });
        }
      });
    });

    setCompletedMatches(comp);
    setNextMatches(nxt);
  }, [matches, results]);

  if (!tournament) {
    return (
      <div className="page">
        <h1>No active tournament</h1>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Summary</h1>

      {/* NEXT MATCHES CARD */}
      <div className="summary-card">
        <div className="summary-title">Next Matches</div>

        {nextMatches.length === 0 ? (
          <p>All matches are complete!</p>
        ) : (
          nextMatches.map((m, i) => (
            <div key={i} className="summary-match">
              <div className="summary-team">{m.teamA}</div>
              <div className="summary-score">vs</div>
              <div className="summary-team">{m.teamB}</div>
              <div style={{ opacity: 0.6 }}>Round {m.round}</div>
            </div>
          ))
        )}
      </div>

      {/* RECENTLY COMPLETED CARD */}
      <div className="summary-card">
        <div className="summary-title">Recently Completed Matches</div>

        {completedMatches.length === 0 ? (
          <p>No completed matches yet.</p>
        ) : (
          completedMatches.map((m, i) => (
            <div key={i} className="summary-match summary-complete">
              <div className="summary-team">{m.teamA}</div>

              <div className="summary-score">
                {m.scoreA} - {m.scoreB}
              </div>

              <div className="summary-team">{m.teamB}</div>

              <div style={{ opacity: 0.6 }}>Round {m.round}</div>
            </div>
          ))
        )}
      </div>

      {/* BUTTONS AT THE BOTTOM */}
      <button
        onClick={() => {
          const csvRows = [["Team A", "Score A", "Score B", "Team B", "Round"]];
          completedMatches.forEach((m) => {
            csvRows.push([
              m.teamA,
              m.scoreA,
              m.scoreB,
              m.teamB,
              "Round " + m.round,
            ]);
          });

          const csv = csvRows.map((row) => row.join(",")).join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = "completed_matches.csv";
          a.click();
        }}
        style={{ marginRight: "1rem" }}
      >
        Export Completed Matches (CSV)
      </button>

      <button
        onClick={() => {
          window.print();
        }}
      >
        Print Summary
      </button>
    </div>
  );
}
