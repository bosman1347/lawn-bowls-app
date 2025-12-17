import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { loadTournaments, getActiveTournament } from "../utils/storage";
import { loadAllTournaments } from "../utils/api";

export default function Standings() {
  const [params] = useSearchParams();
  const urlTournament = params.get("t");

  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // 📱 PHONE / QR MODE — URL PARAM IS KING
        if (urlTournament) {
          const all = await loadAllTournaments();
          const data = all[urlTournament];

          if (!data) {
            setError("Tournament not found.");
            return;
          }

          setTournamentName(urlTournament);
          setMatches(data.matches || []);
          return; // 🚨 DO NOT FALL THROUGH
        }

        // 🖥 DESKTOP / ADMIN MODE
        const active = getActiveTournament();
        if (!active) {
          setError("No active tournament.");
          return;
        }

        const all = loadTournaments();
        const data = all[active];

        if (!data) {
          setError("Tournament not found.");
          return;
        }

        setTournamentName(active);
        setMatches(data.matches || []);
      } catch (e) {
        setError("Unable to load standings.");
      }
    }

    load();
  }, [urlTournament]);

  const standings = useMemo(
    () => computeStandings(matches),
    [JSON.stringify(matches)]
  );

  if (error) {
    return (
      <div className="page">
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Standings — {tournamentName}</h2>

      <table className="standings-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>SF</th>
            <th>SA</th>
            <th>SD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((r, i) => (
            <tr key={r.team}>
              <td>{i + 1}</td>
              <td>{r.team}</td>
              <td>{r.played}</td>
              <td>{r.won}</td>
              <td>{r.drawn}</td>
              <td>{r.lost}</td>
              <td>{r.shotsFor}</td>
              <td>{r.shotsAgainst}</td>
              <td>{r.diff}</td>
              <td>{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function computeStandings(rounds) {
  const table = {};

  (rounds || []).forEach(round => {
    (round || []).forEach(m => {
      if (!m.verified) return;

      if (!table[m.team1]) table[m.team1] = base(m.team1);
      if (!table[m.team2]) table[m.team2] = base(m.team2);

      const t1 = table[m.team1];
      const t2 = table[m.team2];

      let A = 0, B = 0, spA = 0, spB = 0;

      (m.skins || []).forEach(s => {
        A += s.a || 0;
        B += s.b || 0;
        if (s.a > s.b) spA += 1;
        else if (s.b > s.a) spB += 1;
        else { spA += 0.5; spB += 0.5; }
      });

      t1.played++; t2.played++;
      t1.shotsFor += A; t1.shotsAgainst += B;
      t2.shotsFor += B; t2.shotsAgainst += A;

      let bonusA = 0, bonusB = 0;
      if (A > B) bonusA = 2;
      else if (B > A) bonusB = 2;
      else { bonusA = 1; bonusB = 1; }

      t1.points += spA + bonusA;
      t2.points += spB + bonusB;

      if (spA + bonusA > spB + bonusB) { t1.won++; t2.lost++; }
      else if (spB + bonusB > spA + bonusA) { t2.won++; t1.lost++; }
      else { t1.drawn++; t2.drawn++; }
    });
  });

  return Object.values(table).sort(
    (a, b) => b.points - a.points || b.diff - a.diff
  );
}

function base(team) {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    shotsFor: 0,
    shotsAgainst: 0,
    diff: 0
  };
}
