import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { resolveTournament } from "../utils/tournamentContext";
import { loadTournament } from "../utils/api";

export default function Summary() {
  const [searchParams] = useSearchParams();
  const tournamentName = resolveTournament(searchParams);
  const [data, setData] = useState(null);

  if (!tournamentName) {
    return <div className="page">No active tournament</div>;
  }

  useEffect(() => {
    loadTournament(tournamentName).then(setData);
  }, [tournamentName]);

  if (!data) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <h2>Summary — {tournamentName}</h2>
      <pre>{JSON.stringify(data.matches, null, 2)}</pre>
    </div>
  );
}
