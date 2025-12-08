import { useState, useEffect } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament
} from "../utils/storage";

export default function Matches() {
  const [tournamentName, setTournamentName] = useState("");
  const [rounds, setRounds] = useState([]);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [scoringMethod, setScoringMethod] = useState("standard");

  // Load tournament on mount
  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setRounds(data.matches || []);
      setScoringMethod(data.scoring || "standard");
    }
  }, []);

  function saveRounds(updatedRounds) {
    const all = loadTournaments();
    const t = all[tournamentName];
    t.matches = updatedRounds;
    saveTournaments(all);
    setRounds(updatedRounds);
  }

  // Update standard score field
  function updateStandardScore(rIndex, mIndex, field, value) {
    const updated = rounds.map((round, i) => {
      if (i !== rIndex) return round;
      return round.map((m, j) => {
        if (j !== mIndex) return m;

        // Preserve green & rink
        return {
          ...m,
          green: m.green,
          rink: m.rink,
          [field]: value === "" ? null : Number(value)
        };
      });
    });

    saveRounds(updated);
  }

  // Update skins scores
  function updateSkinScore(rIndex, mIndex, team, skinIndex, rawValue) {
    const updated = rounds.map((round, i) => {
      if (i !== rIndex) return round;
      return round.map((m, j) => {
        if (j !== mIndex) return m;

        // preserve green & rink
        const newMatch = {
          ...m,
          green: m.green,
          rink: m.rink
        };

        const v = rawValue === "" ? null : Number(rawValue);

        if (team === "team1") {
          const arr = [...(newMatch.skinScores1 || [null, null, null])];
          arr[skinIndex] = v;
          newMatch.skinScores1 = arr;
        } else {
          const arr = [...(newMatch.skinScores2 || [null, null, null])];
          arr[skinIndex] = v;
          newMatch.skinScores2 = arr;
        }

        return newMatch;
      });
    });

    saveRounds(updated);
  }

  // Toggle verification
  function toggleVerified(rIndex, mIndex) {
    const updated = rounds.map((round, i) => {
      if (i !== rIndex) return round;
      return round.map((m, j) => {
        if (j !== mIndex) return m;

        // Preserve green & rink
        return {
          ...m,
          green: m.green,
          rink: m.rink,
          verified: !m.verified
        };
      });
    });

    saveRounds(updated);
  }

  if (!tournamentName) {
    return <div className="page"><h2>No active tournament</h2></div>;
  }

  const round = rounds[activeRoundIndex] || [];

  return (
    <div className="page">
      <h2>Matches — {tournamentName}</h2>

      <div className="round-nav">
        {rounds.map((_, i) => (
          <button
            key={i}
            className={i === activeRoundIndex ? "active" : ""}
            onClick={() => setActiveRoundIndex(i)}
          >
            Round {i + 1}
          </button>
        ))}
      </div>

      <h3>Round {activeRoundIndex + 1}</h3>

      {round.map((m, index) => (
        <div key={index} className="match-block">
          <h4>
            {m.team1} vs {m.team2} — {m.green} Rink {m.rink}
          </h4>

          {scoringMethod === "standard" ? (
            <div className="standard-scores">
              <input
                type="number"
                placeholder="Team 1 Score"
                value={m.score1 ?? ""}
                onChange={(e) =>
                  updateStandardScore(activeRoundIndex, index, "score1", e.target.value)
                }
              />
              <span>vs</span>
              <input
                type="number"
                placeholder="Team 2 Score"
                value={m.score2 ?? ""}
                onChange={(e) =>
                  updateStandardScore(activeRoundIndex, index, "score2", e.target.value)
                }
              />
            </div>
          ) : (
            <div className="skins-block">
              <div className="skins-row">
                <div>
                  <strong>{m.team1}</strong>
                  {[0, 1, 2].map((s) => (
                    <input
                      key={s}
                      type="number"
                      placeholder={`S${s + 1}`}
                      value={m.skinScores1?.[s] ?? ""}
                      onChange={(e) =>
                        updateSkinScore(activeRoundIndex, index, "team1", s, e.target.value)
                      }
                    />
                  ))}
                </div>

                <div>
                  <strong>{m.team2}</strong>
                  {[0, 1, 2].map((s) => (
                    <input
                      key={s}
                      type="number"
                      placeholder={`S${s + 1}`}
                      value={m.skinScores2?.[s] ?? ""}
                      onChange={(e) =>
                        updateSkinScore(activeRoundIndex, index, "team2", s, e.target.value)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            className={m.verified ? "verified" : ""}
            onClick={() => toggleVerified(activeRoundIndex, index)}
          >
            {m.verified ? "✓ Verified" : "Verify"}
          </button>
        </div>
      ))}
    </div>
  );
}
