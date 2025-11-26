import { useEffect, useState } from "react";

export default function Summary() {
  const savedTournament = localStorage.getItem("tournament");
  const savedMatches = localStorage.getItem("matches");
  const savedResults = localStorage.getItem("results");

  const tournament = savedTournament ? JSON.parse(savedTournament) : null;
  const matches = savedMatches ? JSON.parse(savedMatches) : [];
  const results = savedResults ? JSON.parse(savedResults) : [];

  const [nextMatches, setNextMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!tournament) return;

    const upcoming = [];
    const completed = [];
    let total = 0;
    let done = 0;

    matches.forEach((round, rIdx) => {
      round.forEach((match, mIdx) => {
        total++;

        const res = results[rIdx]?.[mIdx];

        if (res && !isNaN(res.scoreA) && !isNaN(res.scoreB)) {
          done++;
          completed.push({ round: rIdx + 1, ...match, ...res });
        } else {
          upcoming.push({ round: rIdx + 1, ...match });
        }
      });
    });

    setNextMatches(upcoming.slice(0, 3)); // only show top 3 upcoming
    setCompletedMatches(completed.slice(-3)); // last 3 completed matches
    setProgressPercent(Math.round((done / total) * 100));
  }, [tournament, results]);

  if (!tournament) {
    return (
      <div className="page">
        <h2>No tournament found</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Tournament Summary</h2>

      <h3>Progress</h3>
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          height: "20px",
          background: "#ddd",
          borderRadius: "5px",
          overflow: "hidden",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "#1C5D3A",
          }}
        ></div>
      </div>
      <p>{progressPercent}% complete</p>

      <h3>Next Matches</h3>
      {nextMatches.length === 0 ? (
        <p>All matches are complete!</p>
      ) : (
        <ul>
          {nextMatches.map((m, i) => (
            <li key={i}>
              Round {m.round}: {m.teamA} vs {m.teamB}
            </li>
          ))}
        </ul>
      )}

      <h3>Recently Completed</h3>
      {completedMatches.length === 0 ? (
        <p>No completed matches yet.</p>
      ) : (
        <ul>
          {completedMatches.map((m, i) => (
            <li key={i}>
              Round {m.round}: {m.teamA} {m.scoreA} - {m.scoreB} {m.teamB}
            </li>
          ))}
		  <button
  onClick={() => {
    const rows = [
      ["Round", "Team A", "Score A", "Score B", "Team B"],
    ];

    matches.forEach((round, rIdx) => {
      round.forEach((match, mIdx) => {
        const res = results[rIdx]?.[mIdx] ?? { scoreA: "", scoreB: "" };

        rows.push([
          rIdx + 1,
          match.teamA,
          res.scoreA,
          res.scoreB,
          match.teamB,
        ]);
      });
    });

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "match-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }}
  style={{ marginTop: "1.5rem", padding: "0.5rem 1rem" }}
>
  Export Match Results to CSV
</button>

        </ul>
      )}
    </div>
  );
}
