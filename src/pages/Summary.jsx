import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadTournament } from "../utils/api";

export default function Summary() {
  const [searchParams] = useSearchParams();
  const tournamentName = searchParams.get("t");

  const [tournament, setTournament] = useState(null);

  useEffect(() => {
    if (!tournamentName) return;

    loadTournament(tournamentName).then(setTournament);
  }, [tournamentName]);

  if (!tournamentName) {
    return (
      <div className="page">
        <h2>No tournament specified</h2>
        <p>Please scan the correct QR code.</p>
      </div>
    );
  }

  if (!tournament) {
    return <div className="page"><h2>Loading summary…</h2></div>;
  }

  const rounds = tournament.matches || [];
  const verifiedRounds = rounds.map((round) =>
    round.filter((m) => m.verified)
  ).filter((r) => r.length > 0);

  if (verifiedRounds.length === 0) {
    return <div className="page"><h2>No verified matches yet</h2></div>;
  }

  return (
    <div className="page">
      <h2>Match Summary — {tournamentName}</h2>

      {verifiedRounds.map((round, rIndex) => (
        <div key={rIndex} className="round-summary">
          <h3>Round {rIndex + 1}</h3>

          {round.map((m, i) => (
            <div key={i} className="match-summary">
              <strong>
                {m.team1} vs {m.team2}
              </strong>

              <div className="summary-line">
                Totals: {m.total1} – {m.total2}
              </div>

              <div className="summary-line">
                Skins: {m.skins1} – {m.skins2}
              </div>

              <div className="summary-line">
                Bonus: {m.bonus1} – {m.bonus2}
              </div>

              <div className="summary-line">
                Match Points: {m.points1} – {m.points2}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
