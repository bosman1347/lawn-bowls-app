import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadAllTournaments } from "../utils/api";

export default function PlayerEntry() {
  const [params] = useSearchParams();
  const tournamentName = params.get("t");

  const [tournament, setTournament] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!tournamentName) {
        setError("Tournament not specified.");
        return;
      }

      try {
        const all = await loadAllTournaments();
        const data = all[tournamentName];

        if (!data) {
          setError("Tournament not found. Ask the organisers for the correct link.");
          return;
        }

        setTournament(data);
      } catch (err) {
        setError("Unable to load tournament.");
      }
    }

    load();
  }, [tournamentName]);

  if (error) {
    return <div className="page"><h2>{error}</h2></div>;
  }

  if (!tournament) {
    return <div className="page"><h2>Loading…</h2></div>;
  }

  return (
    <div className="page">
      <h2>{tournamentName}</h2>
      <h3>Matches (Player Entry)</h3>

      {tournament.matches.length === 0 && (
        <p>No matches yet.</p>
      )}

      {tournament.matches.map((round, rIdx) => (
        <div key={rIdx} className="round-block">
          <h4>Round {rIdx + 1}</h4>

          {round.map((m, idx) => (
            <div key={idx} className="match-card">
              <strong>{m.team1}</strong> vs <strong>{m.team2}</strong>
              <div>Green {m.green}, Rink {m.rink}</div>
              <div>Status: {m.verified ? "Verified" : "Pending"}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
