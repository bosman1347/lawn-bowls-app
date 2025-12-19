import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadTournament } from "../utils/api";
import { resolveTournament } from "../utils/tournamentContext";

export default function Summary() {
  const [searchParams] = useSearchParams();
  const tournamentName = resolveTournament(searchParams);

  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tournamentName) return;

    loadTournament(tournamentName).then((tournament) => {
      if (!tournament) {
        setError("Tournament not found");
        return;
      }

      const verified = [];

      (tournament.matches || []).forEach((round, rIndex) => {
        round.forEach((m) => {
          if (m.verified) {
            verified.push({
              round: rIndex + 1,
              ...m,
            });
          }
        });
      });

      setMatches(verified);
    });
  }, [tournamentName]);

  if (!tournamentName) {
    return (
      <div className="page">
        <h2>No active tournament</h2>
        <p>Please scan the QR code or select a tournament.</p>
      </div>
    );
  }

  if (error) {
    return <div className="page"><h2>{error}</h2></div>;
  }

  return (
    <div className="page">
      <h2>Match Summary — {tournamentName}</h2>

      {matches.length === 0 ? (
        <p>No verified matches yet.</p>
      ) : (
        matches.map((m, i) => (
          <div key={i} className="summary-card">
            <strong>Round {m.round}</strong>
            <div>{m.team1} vs {m.team2}</div>
            <div>
              Shots: {m.total1} – {m.total2}
            </div>
            <div>
              Skins: {m.skins1} – {m.skins2}
            </div>
            <div>
              Bonus: {m.bonus1} – {m.bonus2}
            </div>
            <div>
              Match Points: {m.matchPoints1} – {m.matchPoints2}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
