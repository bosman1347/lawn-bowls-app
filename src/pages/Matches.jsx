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

  const [openRound, setOpenRound] = useState(null); // which round is expanded

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

  // Determine match win/loss/draw styling
  const getMatchStyle = (existing) => {
    if (!existing) return {};
    if (existing.scoreA > existing.scoreB)
      return { background: "#e6ffe6" }; // A wins
    if (existing.scoreB > existing.scoreA)
      return { background: "#ffe6e6" }; // B wins
    return { background: "#fff6cc" }; // draw
  };

  // Auto-save scores
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

  // Is a round complete?
  const isRoundComplete = (roundIndex) => {
    const round = results[roundIndex];
    if (!round) return false;
    return round.every(
      (m) =>
        m &&
        typeof m.scoreA === "number" &&
        typeof m.scoreB === "number" &&
        !isNaN(m.scoreA) &&
        !isNaN(m.scoreB)
    );
  };

  return (
    <div className="page">
      <h2>Match Scoring</h2>

      {matches.map((round, r) => {
        const complete = isRoundComplete(r);

        return (
          <div key={r} style={{ marginBottom: "1.5rem" }}>
            {/* Round header */}
            <h3
              onClick={() =>
                setOpenRound((prev) => (prev === r ? null : r))
              }
              style={{
                background: complete ? "#1C5D3A" : "#8a1f1f",
                color: "white",
                padding: "0.5rem",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Round {r + 1} &nbsp;
              {complete ? "🟢 Complete" : "🔴 Incomplete"}
              <span style={{ float: "right" }}>
                {openRound === r ? "▾" : "▸"}
              </span>
            </h3>

            {/* Collapsible content */}
            {openRound === r && (
              <div style={{ padding: "0.5rem 0" }}>
                {round.map((m, i) => {
                  const existing = results[r]?.[i];

                  return (
                    <div
						key={i}
						className={`match-card ${existing ? "completed" : ""}`}
				>
					<div className="match-header">
						{m.teamA} vs {m.teamB}
					</div>

					<div className="match-row">
						<div className="match-team">{m.teamA}</div>

						<input
							className="match-score"
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
						/>

						<div style={{ fontWeight: 600 }}>vs</div>

						<input
							className="match-score"
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
				/>

				<div className="match-team">{m.teamB}</div>
			</div>
		</div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
