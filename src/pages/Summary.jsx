import { useState, useEffect } from "react";
import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";

import { buildZIP } from "../utils/exporter";

export default function Summary() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);

  // Load tournament data
  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setMatches(data.matches);

      // Recompute standings
      const table = computeStandings(data.matches);
      setStandings(table);
    }
  }, []);

  // compute standings logic (same as in Standings.jsx)
  function computeStandings(matchRounds) {
    const table = {};

    matchRounds.forEach((round) => {
      round.forEach((m) => {
        if (!table[m.team1]) {
          table[m.team1] = { team: m.team1, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0 };
        }
        if (!table[m.team2]) {
          table[m.team2] = { team: m.team2, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0 };
        }

        const t1 = table[m.team1];
        const t2 = table[m.team2];

        if (m.score1 == null || m.score2 == null) return;

        t1.played++;
        t2.played++;

        const s1 = m.score1;
        const s2 = m.score2;

        t1.diff += s1 - s2;
        t2.diff += s2 - s1;

        if (s1 > s2) {
          t1.won++; t1.points += 2;
          t2.lost++;
        } else if (s2 > s1) {
          t2.won++; t2.points += 2;
          t1.lost++;
        } else {
          t1.drawn++; t2.drawn++;
          t1.points++; t2.points++;
        }
      });
    });

    return Object.values(table).sort((a, b) =>
      b.points - a.points || b.diff - a.diff
    );
  }

  // ----------------------------------------------------
  // Correct Export Function (INSIDE component)
  // ----------------------------------------------------
  async function exportBundle() {
    const zipBlob = await buildZIP(standings, matches);

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${tournamentName}-export.zip`;
    a.click();

    URL.revokeObjectURL(url);
  }

  if (!tournamentName) {
    return (
      <div className="page">
        <h2>No active tournament</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Summary — {tournamentName}</h2>

      <button className="btn-primary" onClick={exportBundle}>
        Export Tournament ZIP
      </button>

      <p style={{ marginTop: "1rem" }}>
        A quick overview of all match scores entered so far.
      </p>

      <div className="summary-container">
        {matches.map((round, rIndex) => (
          <div key={rIndex} className="summary-round-card">
            <h3>Round {rIndex + 1}</h3>

            {round.map((m, mIndex) => (
              <div
                key={mIndex}
                className={`summary-match ${
                  m.score1 !== null && m.score2 !== null
                    ? "summary-complete"
                    : ""
                }`}
              >
                <div className="summary-team">
                  <strong>{m.team1}</strong>
                </div>

                <div className="summary-score">
                  {m.score1 ?? "-"} <span className="summary-vs">vs</span>{" "}
                  {m.score2 ?? "-"}
                </div>

                <div className="summary-team">
                  <strong>{m.team2}</strong>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
