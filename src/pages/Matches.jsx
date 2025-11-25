import { useState, useEffect } from "react";

export default function Matches() {
  const savedTournament = localStorage.getItem("tournament");
  const savedMatches = localStorage.getItem("matches");
  const savedResults = localStorage.getItem("results");

  const tournament = savedTournament ? JSON.parse(savedTournament) : null;
  const matches = savedMatches ? JSON.parse(savedMatches) : [];
  const [results, setResults] = useState(
    savedResults ? JSON.parse(savedResults) : []
  );

  useEffect(() => {
    localStorage.setItem("results", JSON.stringify(results));
  }, [results]);

  if (!tournament) {
    return (
      <div className="page">
        <h2>No tournament found</h2>
        <p>Please create a new tournament first.</p>
      </div>
    );
  }

  // Determine match colour (win/loss/draw)
  const getMatchStyle = (existing) => {
    if (!existing) return {};
    if (existing.scoreA > existing.scoreB)
      return { background: "#e6ffe6" }; // A wins
    if (existing.scoreB > existing.scoreA)
      return { background: "#ffe6e6" }; // B wins
    return { background: "#fff6cc" }; // draw
  };

  // Auto-save on typing
  const handleTyping = (roundIndex, matchIndex, scoreA, scoreB) => {
    const updated = [...results];
    if (!updated[roundIndex]) updated[roundIndex] = [];

    updated[roundIndex][matchIndex] = {
      teamA: matches[roundIndex][matchIndex].teamA,
      teamB: matches[roundIndex][matchIndex].teamB,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
    };

    setResults(updated);
  };

  return (
    <div className="page">
      <h2>Match Scoring</h2>

      {matches.map((round, r) => (
        <div key={r} style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              background: "#1C5D3A",
              color: "white",
              padding: "0.5rem",
            }}
          >
            Round {r + 1}
          </h3>

          {round.map((m, i) => {
            const existing = results[r]?.[i];

            return (
              <div
                key={i}
                style={{
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  ...getMatchStyle(existing),
                }}
              >
                <strong>
                  {m.teamA} vs {m.teamB}
                </strong>

                <div style={{ marginTop: "0.5rem" }}>
                  <input
                    type="number"
                    defaultValue={existing?.scoreA ?? ""}
                    onInput={(e) =>
                      handleTyping(
                        r,
                        i,
                        e.target.value,
                        document.getElementById(`scoreB-${r}-${i}`)?.value || 0
                      )
                    }
                    id={`scoreA-${r}-${i}`}
                    placeholder="Score A"
                    style={{ width: "60px", marginRight: "1rem" }}
                  />

                  <input
                    type="number"
                    defaultValue={existing?.scoreB ?? ""}
                    onInput={(e) =>
                      handleTyping(
                        r,
                        i,
                        document.getElementById(`scoreA-${r}-${i}`)?.value || 0,
                        e.target.value
                      )
                    }
                    id={`scoreB-${r}-${i}`}
                    placeholder="Score B"
                    style={{ width: "60px" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
