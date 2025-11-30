import { useState, useEffect } from "react";

import {
  loadTournaments,
  getActiveTournament,
  saveTournaments,
} from "../utils/storage";

const all = loadTournaments();
const active = getActiveTournament();
const data = all[active];

const tournament = data?.tournament;
const matches = data?.matches || [];
const storedResults = data?.results || {};



export default function Matches() {
  const all = loadTournaments();
  const active = getActiveTournament();
  const data = all[active] || {};

  const savedTournament = data.tournament;
  const storedMatches = data.matches || [];
  const storedResults = data.results || [];


  const [matches] = useState(storedMatches);
  const [results, setResults] = useState(storedResults);
  const [roundOpen, setRoundOpen] = useState(() =>
    matches.map(() => true)
  );

  useEffect(() => {
    data.results = results;
    all[active] = data;
    saveTournaments(all);

  }, [results]);

  const updateScore = (roundIdx, matchIdx, type, value) => {
    const updated = [...results];
    if (!updated[roundIdx]) updated[roundIdx] = [];
    if (!updated[roundIdx][matchIdx]) updated[roundIdx][matchIdx] = {};

    updated[roundIdx][matchIdx][`score${type}`] =
      value === "" ? "" : Number(value);

    setResults(updated);
  };

  const toggleRound = (roundIdx) => {
    const arr = [...roundOpen];
    arr[roundIdx] = !arr[roundIdx];
    setRoundOpen(arr);
  };

  if (!savedTournament) {
    return (
      <div className="page">
        <h1>No active tournament</h1>
        <p>Create a tournament first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Matches</h1>

      {matches.map((round, r) => (
        <div key={r} style={{ marginBottom: "2rem" }}>
          <div
            className="match-divider"
            onClick={() => toggleRound(r)}
            style={{ cursor: "pointer" }}
          >
            Round {r + 1} {roundOpen[r] ? "▾" : "▸"}
          </div>

          {roundOpen[r] &&
            round.map((m, i) => {
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
                        updateScore(
                          r,
                          i,
                          "A",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />

                    <div style={{ fontWeight: 600 }}>vs</div>

                    <input
                      className="match-score"
                      type="number"
                      defaultValue={existing?.scoreB ?? ""}
                      onInput={(e) =>
                        updateScore(
                          r,
                          i,
                          "B",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />

                    <div className="match-team">{m.teamB}</div>
                  </div>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
