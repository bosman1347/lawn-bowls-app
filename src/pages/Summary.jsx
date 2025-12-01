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
    return <div className="page"><h2>No active tournament</h2></div>;
  }

  return (
    <div className="page">
      <h2>Summary — {tournamentName}</h2>

      <p>This page gives a quick overview of all match scores entered so far.</p>

      {matches.map((round, rIndex) => (
        <div key={rIndex} className="round-block">
          <h3>Round {rIndex + 1}</h3>

          {round.map((m, mIndex) => (
            <div key={mIndex} className="summary-match">
              <strong>{m.team1}</strong> ({m.score1 ?? "-"})  
              {" vs "}
              <strong>{m.team2}</strong> ({m.score2 ?? "-"})
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
