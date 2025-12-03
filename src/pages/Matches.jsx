import { useState, useEffect } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament
} from "../utils/storage";

export default function Matches() {
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);

  // Load the active tournament + matches when the page loads
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
    const updatedMatches = [...matches];
    updatedMatches[roundIndex][matchIndex][field] = value;

    setMatches(updatedMatches);

    // Save back to storage
    const all = loadTournaments();
    all[tournament].matches = updatedMatches;
    saveTournaments(all);
  };

  if (!tournament) {
    return <div className="page"><h2>No active tournament selected</h2></div>;
  }

  /*return (
    <div className="page">
      <h2>Matches — {tournament}</h2>

      {matches.map((round, rIndex) => (
        <div key={rIndex} className="round-block">
          <h3>Round {rIndex + 1}</h3>

          {round.map((m, mIndex) => (
            <div key={mIndex} className="match-block">
              <div className="team-row">
                <span>{m.team1}</span>
                <input
                  type="number"
                  value={m.score1 ?? ""}
                  onChange={(e) =>
                    updateScore(rIndex, mIndex, "score1", Number(e.target.value))
                  }
                  className="score-input"
                />
              </div>

              <div className="team-row">
                <span>{m.team2}</span>
                <input
                  type="number"
                  value={m.score2 ?? ""}
                  onChange={(e) =>
                    updateScore(rIndex, mIndex, "score2", Number(e.target.value))
                  }
                  className="score-input"
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );*/
  
   <div className={`match-card ${m.score1 !== null && m.score2 !== null ? "match-complete" : ""}`}>
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
      onChange={(e) => updateScore(rIndex, mIndex, "score1", e.target.value)}
    />
    <span className="dash">-</span>
    <input
      type="number"
      min="0"
      value={m.score2 ?? ""}
      onChange={(e) => updateScore(rIndex, mIndex, "score2", e.target.value)}
    />
  </div>
</div>
);
}


