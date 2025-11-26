import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const savedTournament = localStorage.getItem("tournament");
  const savedMatches = localStorage.getItem("matches");
  const savedResults = localStorage.getItem("results");

  const tournament = savedTournament ? JSON.parse(savedTournament) : null;
  const matches = savedMatches ? JSON.parse(savedMatches) : [];
  const results = savedResults ? JSON.parse(savedResults) : [];

  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!matches.length) return;

    let total = 0;
    let done = 0;

    matches.forEach((round, rIdx) =>
      round.forEach((match, mIdx) => {
        total++;
        const res = results[rIdx]?.[mIdx];
        if (res && !isNaN(res.scoreA) && !isNaN(res.scoreB)) {
          done++;
        }
      })
    );

    setProgressPercent(Math.round((done / total) * 100));
  }, [matches, results]);

  return (
    <div className="page">
      <h1>Lawn Bowls Tournament</h1>

      {!tournament ? (
        <div>
          <h3>No active tournament</h3>
          <Link to="/new">
            <button>Create New Tournament</button>
          </Link>
        </div>
      ) : (
        <>
          <h3>Current Tournament</h3>
          <p>
            <strong>Teams:</strong> {tournament.teams.length}
          </p>
          <p>
            <strong>Progress:</strong> {progressPercent}%
          </p>

          {/* EXPORT BUTTON */}
          <button
            onClick={() => {
              const data = {
                tournament,
                matches,
                results,
              };

              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              });

              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "tournament-backup.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ marginTop: "1rem" }}
          >
            Export Tournament Data
          </button>

          {/* IMPORT BUTTON */}
          <div style={{ marginTop: "1rem" }}>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const data = JSON.parse(ev.target.result);

                    localStorage.setItem("tournament", JSON.stringify(data.tournament));
                    localStorage.setItem("matches", JSON.stringify(data.matches));
                    localStorage.setItem("results", JSON.stringify(data.results));

                    alert("Tournament restored successfully!");
                    window.location.reload();
                  } catch (err) {
                    alert("Invalid tournament file.");
                  }
                };

                reader.readAsText(file);
              }}
            />
          </div>

          {/* Quick Links */}
          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/matches">
              <button style={{ marginRight: "1rem" }}>Matches</button>
            </Link>

            <Link to="/standings">
              <button style={{ marginRight: "1rem" }}>Standings</button>
            </Link>

            <Link to="/summary">
              <button style={{ marginRight: "1rem" }}>Summary</button>
            </Link>

            <Link to="/new">
              <button>Create New Tournament</button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
