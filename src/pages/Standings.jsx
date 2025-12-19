import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadTournament } from "../utils/api";
import { resolveTournament } from "../utils/tournamentContext";

export default function Standings() {
  const [searchParams] = useSearchParams();
  const tournamentName = resolveTournament(searchParams);

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tournamentName) return;

    loadTournament(tournamentName).then((tournament) => {
      if (!tournament) {
        setError("Tournament not found");
        return;
      }

      const table = {};

      (tournament.matches || []).forEach((round) => {
        round.forEach((m) => {
          if (!m.verified) return;

          const t1 = m.team1;
          const t2 = m.team2;

          if (!table[t1]) {
            table[t1] = {
              team: t1,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              points: 0,
              diff: 0,
            };
          }

          if (!table[t2]) {
            table[t2] = {
              team: t2,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              points: 0,
              diff: 0,
            };
          }

          const a = table[t1];
          const b = table[t2];

          a.played++;
          b.played++;

          a.diff += (m.total1 || 0) - (m.total2 || 0);
          b.diff += (m.total2 || 0) - (m.total1 || 0);

          if (m.matchPoints1 > m.matchPoints2) {
            a.won++;
            b.lost++;
          } else if (m.matchPoints2 > m.matchPoints1) {
            b.won++;
            a.lost++;
          } else {
            a.drawn++;
            b.drawn++;
          }

          a.points += m.matchPoints1 || 0;
          b.points += m.matchPoints2 || 0;
        });
      });

      const sorted = Object.values(table).sort(
        (a, b) => b.points - a.points || b.diff - a.diff
      );

      setRows(sorted);
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
      <h2>Standings — {tournamentName}</h2>

      {rows.length === 0 ? (
        <p>No verified matches yet.</p>
      ) : (
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>Pts</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.team}>
                <td>{i + 1}</td>
                <td>{r.team}</td>
                <td>{r.played}</td>
                <td>{r.won}</td>
                <td>{r.drawn}</td>
                <td>{r.lost}</td>
                <td>{r.points}</td>
                <td>{r.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
