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

  const handleSaveScore = (roundIndex, matchIndex, scoreA, scoreB) => {
    const updated = [...results];

    if (!updated[roundIndex]) updated[roundIndex] = [];

    updated[roundIndex][matchIndex] = {
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      teamA: matches[roundIndex][matchIndex].teamA,
      teamB: matches[roundIndex][matchIndex].teamB,
    };

    setResults(updated);
  };

  return (
    <div className="page">
      <h2>Match Schedule & Scoring</h2>

      {matches.map((round, r) => (
        <div key={r} style={{ marginBottom: "1.5rem" }}>
          <h3>Round {r + 1}</h3>

          {round.map((m, i) => {
            const existing = results[r]?.[i];

            return (
              <div
                key={i}
                style={{
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                }}
              >
                <div>
                  <strong>
                    {m.teamA} vs {m.teamB}
                  </strong>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <input
                    type="number"
                    placeholder={m.teamA + " score"}
                    defaultValue={existing?.scoreA ?? ""}
                    id={`scoreA-${r}-${i}`}
                    style={{ width: "60px", marginRight: "1rem" }}
                  />

                  <input
                    type="number"
                    placeholder={m.teamB + " score"}
                    defaultValue={existing?.scoreB ?? ""}
                    id={`scoreB-${r}-${i}`}
                    style={{ width: "60px", marginRight: "1rem" }}
                  />

                  <button
                    onClick={() =>
                      handleSaveScore(
                        r,
                        i,
                        document.getElementById(`scoreA-${r}-${i}`).value,
                        document.getElementById(`scoreB-${r}-${i}`).value
                      )
                    }
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
