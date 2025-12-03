import { useState, useEffect } from "react";
import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";

export default function Summary() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setMatches(data.matches);
    }
  }, []);

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

      <p style={{ marginBottom: "1.5rem" }}>
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
