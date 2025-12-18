import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { resolveTournament } from "../utils/tournamentContext";
import { loadTournament } from "../utils/api";

export default function Standings() {
  const [searchParams] = useSearchParams();
  const tournamentName = resolveTournament(searchParams);
  const [table, setTable] = useState([]);

  if (!tournamentName) {
    return <div className="page">No active tournament</div>;
  }

  useEffect(() => {
    loadTournament(tournamentName).then((data) => {
      if (!data) return;

      const standings = {};
      data.matches.flat().forEach(m => {
        if (!m.result) return;

        for (const t of [m.team1, m.team2]) {
          standings[t] ||= { team: t, mp: 0 };
        }

        standings[m.team1].mp += m.result.mp1 || 0;
        standings[m.team2].mp += m.result.mp2 || 0;
      });

      setTable(Object.values(standings));
    });
  }, [tournamentName]);

  return (
    <div className="page">
      <h2>Standings — {tournamentName}</h2>
      <table>
        <tbody>
          {table.map(t => (
            <tr key={t.team}>
              <td>{t.team}</td>
              <td>{t.mp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
