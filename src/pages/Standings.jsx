import { useState, useEffect } from "react";
import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";

export default function Standings() {
  const [tournamentName, setTournamentName] = useState("");
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);

      const computed = computeStandings(data.matches);
      setStandings(computed);
    }
  }, []);

  // Compute standings matrix from matches
  function computeStandings(matchRounds) {
    const table = {};

    matchRounds.forEach((round) => {
      round.forEach((m) => {
        if (!table[m.team1]) {
          table[m.team1] = { team: m.team1, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0 };
        }
        if (!table[m.team2]) {
          table[m.team2] = { team: m.team2, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0 };
        }

        const t1 = table[m.team1];
        const t2 = table[m.team2];

        if (m.score1 == null || m.score2 == null) return;

        t1.played++;
        t2.played++;

        const s1 = m.score1;
        const s2 = m.score2;

        t1.diff += s1 - s2;
        t2.diff += s2 - s1;

        if (s1 > s2) {
          t1.won++; t1.points += 2;
          t2.lost++;
        } else if (s2 > s1) {
          t2.won++; t2.points += 2;
          t1.lost++;
        } else {
          t1.drawn++; t2.drawn++;
          t1.points++; t2.points++;
        }
      });
    });

    return Object.values(table).sort((a, b) =>
      b.points - a.points || b.diff - a.diff
    );
  }

  if (!tournamentName) {
    return <div className="page"><h2>No active tournament</h2></div>;
  }

  return (
    <div className="page">
      <h2>Standings — {tournamentName}</h2>

      <table className="standings-table">
        <table className="standings-table">
			<thead>
				<tr>
					<th>Position</th>
					<th>Team</th>
					<th>Played</th>
					<th>Won</th>
					<th>Lost</th>
					<th>Points</th>
					<th>Shot Diff</th>
				</tr>
			</thead>

			<tbody>
				{standings.map((row, index) => (
				<tr
					key={row.team}
					className={index === 0 ? "first-place" : index === 1 ? "second-place" : ""}
					>
						<td>{index + 1}</td>
						<td>{row.team}</td>
						<td>{row.played}</td>
						<td>{row.won}</td>
						<td>{row.lost}</td>
						<td>{row.points}</td>
						<td>{row.diff}</td>
				</tr>
			   ))}
			</tbody>
		</table>
	</div>
  );
}
