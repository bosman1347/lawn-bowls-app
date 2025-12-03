import { useState, useEffect } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament
} from "../utils/storage";

export default function Matches() {
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);

  // Load active tournament + matches when page loads
  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournament(name);
      setMatches(data.matches);
    }
  }, []);

  // Save score updates to storage
  const updateScore = (roundIndex, matchIndex, field, value) => {
    const updated = [...matches];
    updated[roundIndex][matchIndex][field] = Number(value);

    setMatches(updated);

    const all = loadTournaments();
    all[tournament].matches = updated;
    saveTournaments(all);
  };

  if (!tournament) {
    return (
      <div className="page">
        <h2>No active tournament selected</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Matches — {tournament}</h2>

      {matches.map((round, rIndex) => (
        <div key={rIndex} className="round-block">
          <h3>Round {rIndex + 1}</h3>

          {round.map((m, mIndex) => (
            <div
              key={mIndex}
              className={`match-card ${
                m.score1 !== null && m.score2 !== null
                  ? "match-complete"
                  : ""
              }`}
            >
              <div className="match-teams">
                <span className="team-name">{m.team1}</span>
                <span className="vs">vs</span>
                <span className="team-name">{m.team2}</span>
              </div>

              <div className="match-scores">
                <input
                  type="number"
                  min="0"
                  value={m.score1 ?? ""}
                  onChange={(e) =>
                    updateScore(rIndex, mIndex, "score1", e.target.value)
                  }
                />
                <span className="dash">-</span>
                <input
                  type="number"
                  min="0"
                  value={m.score2 ?? ""}
                  onChange={(e) =>
                    updateScore(rIndex, mIndex, "score2", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
