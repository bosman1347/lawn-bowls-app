import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadTournaments } from "../utils/storage";

export default function PlayerEntry() {
  const [params] = useSearchParams();
  const tParam = params.get("t");

  const [tournamentName, setTournamentName] = useState("");
  const [round, setRound] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!tParam) {
      setMsg("Tournament not specified.");
      return;
    }

    const all = loadTournaments();

    // IMPORTANT: tournament names are keys
    const tournament = all[tParam];

    if (!tournament) {
      setMsg("Tournament not found. Ask the organisers for the correct link.");
      return;
    }

    setTournamentName(tParam);

    if (!tournament.matches || tournament.matches.length === 0) {
      setMsg("No matches available yet.");
      return;
    }

    // Current round = last round
    const currentRound = tournament.matches[tournament.matches.length - 1];
    setRound(currentRound);
  }, [tParam]);

  if (msg) {
    return <div className="page"><h3>{msg}</h3></div>;
  }

  if (!round) {
    return <div className="page"><h3>Loading…</h3></div>;
  }

  return (
    <div className="page">
      <h2>{tournamentName}</h2>
      <h3>Current Round</h3>

      {round.map((m, i) => (
        <div key={i} className="match-card">
          <strong>{m.team1}</strong> vs <strong>{m.team2}</strong>
          <div>Green {m.green}, Rink {m.rink}</div>
        </div>
      ))}
    </div>
  );
}
