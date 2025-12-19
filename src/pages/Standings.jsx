import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadTournament } from "../utils/api";

export default function Standings() {
  const [searchParams] = useSearchParams();
  const tournamentName = searchParams.get("t");

  const [tournament, setTournament] = useState(null);
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    if (!tournamentName) return;

    loadTournament(tournamentName).then((data) => {
      if (!data) return;
      setTournament(data);
      computeStandings(data);
    });
  }, [tournamentName]);

  function computeStandings(data) {
    const table = {};

    const rounds = data.matches || [];

    rounds.forEach((round) => {
      round.forEach((m) => {
        if (!m.verified) return;

        if (!table[m.team1]) {
          table[m.team1] = {
            team: m.team1,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            points: 0,
            shotsFor: 0,
            shotsAgainst: 0,
            diff: 0,
          };
        }

        if (!table[m.team2]) {
          table[m.team2] = {
            team: m.team2,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            points: 0,
            shotsFor: 0,
            shotsAgainst: 0,
            diff: 0,
          };
        }

        const t1 = table[m.team1];
        const t2 = table[m.team2];

        t1.played++;
        t2.played++;

        t1.shotsFor += m.total1;
        t1.shotsAgainst += m.total2;
        t2.shotsFor += m.total2;
        t2.shotsAgainst += m.total1;

        t1.diff = t1.shotsFor - t1.shotsAgainst;
        t2.diff = t2.shotsFor - t2.shotsAgainst;

        t1.points += m.points1;
        t2.points += m.points2;

        if (m.points1 > m.points2) {
          t1.won++;
          t2.lost++;
        } else if (m.points2 > m.points1) {
          t2.won++;
          t1.lost++;
        } else {
          t1.drawn++;
          t2.drawn++;
        }
      });
    });

    const sorted = Object.values(table).sort(
      (a, b) =>
        b.points - a.points ||
        b.diff - a.diff ||
        b.shotsFor - a.shotsFor
    );

    setStandings(sorted);
  }

  if (!tournamentName) {
    return (
      <div className="page">
        <h2>No tournament specified</h2>
        <p>Please scan the correct QR code.</p>
      </div>
    );
  }

  if (!tournament) {
    return <div className="page"><h2>Loading standings…</h2></div>;
  }

  if (standings.length === 0) {
    return <div className="page"><h2>No verified matches yet</h2></div>;
  }

  return (
    <div className="page">
      <h2>Standings — {tournamentName}</h2>

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
            <th>Shots</th>
            <th>Diff</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((t, i) => (
            <tr key={t.team}>
              <td>{i + 1}</td>
              <td>{t.team}</td>
              <td>{t.played}</td>
              <td>{t.won}</td>
              <td>{t.drawn}</td>
              <td>{t.lost}</td>
              <td>{t.points}</td>
              <td>{t.shotsFor}</td>
              <td>{t.diff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

