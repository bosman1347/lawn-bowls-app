import { useState, useEffect } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament
} from "../utils/storage";

export default function Matches() {
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);

  // Load active tournament + matches when page loads
  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournament({ name, ...data });
      setMatches(data.matches);
    }
  }, []);

  // Save updates to storage for any match change
  const persistMatches = (updatedMatches) => {
    setMatches(updatedMatches);
    const all = loadTournaments();
    all[tournament.name].matches = updatedMatches;
    saveTournaments(all);
  };

  // Standard match score update
  const updateStandardScore = (rIndex, mIndex, field, value) => {
    const updated = matches.map((round, ri) =>
      round.map((m, mi) => {
        if (ri === rIndex && mi === mIndex) {
          return { ...m, [field]: value === "" ? null : Number(value) };
        }
        return m;
      })
    );
    persistMatches(updated);
  };

  // SKINS: update skin value
  const updateSkinScore = (rIndex, mIndex, skinIndex, side, value) => {
    const updated = matches.map((round, ri) =>
      round.map((m, mi) => {
        if (ri === rIndex && mi === mIndex) {
          const copy = { ...m, skins: m.skins.map((s) => ({ ...s })) };
          copy.skins[skinIndex][side] = value === "" ? null : Number(value);

          // recompute totals & points for the match
          const totals = computeSkinsMatchTotals(copy.skins);
          copy.totalA = totals.totalA;
          copy.totalB = totals.totalB;
          copy.skinPointsA = totals.skinPointsA;
          copy.skinPointsB = totals.skinPointsB;
          copy.bonusA = totals.bonusA;
          copy.bonusB = totals.bonusB;
          copy.matchPointsA = totals.matchPointsA;
          copy.matchPointsB = totals.matchPointsB;

          return copy;
        }
        return m;
      })
    );
    persistMatches(updated);
  };

  // Compute skins totals & points (per match)
  const computeSkinsMatchTotals = (skins) => {
    // skins: [{a,b},{a,b},{a,b}]
    let totalA = 0,
      totalB = 0,
      skinPointsA = 0,
      skinPointsB = 0;

    skins.forEach((s) => {
      const a = s.a == null ? null : Number(s.a);
      const b = s.b == null ? null : Number(s.b);

      if (a == null || b == null) {
        // incomplete skin; treat as zeros for totals but don't award points yet
        if (a != null) totalA += a;
        if (b != null) totalB += b;
        return;
      }

      totalA += a;
      totalB += b;

      if (a > b) skinPointsA += 1;
      else if (b > a) skinPointsB += 1;
      else {
        // tied skin: each get 0.5
        skinPointsA += 0.5;
        skinPointsB += 0.5;
      }
    });

    // Bonus allocation by skin points
    let bonusA = 0,
      bonusB = 0;
    if (skinPointsA > skinPointsB) {
      bonusA = 2;
    } else if (skinPointsB > skinPointsA) {
      bonusB = 2;
    } else {
      // tied skin points => share bonus 1 each
      bonusA = 1;
      bonusB = 1;
    }

    const matchPointsA = skinPointsA + bonusA;
    const matchPointsB = skinPointsB + bonusB;

    return {
      totalA,
      totalB,
      skinPointsA,
      skinPointsB,
      bonusA,
      bonusB,
      matchPointsA,
      matchPointsB
    };
  };

  if (!tournament) {
    return (
      <div className="page">
        <h2>No active tournament selected</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Matches — {tournament.name}</h2>

      {matches.map((round, rIndex) => (
        <div key={rIndex} className="round-block">
          <h3>Round {rIndex + 1}</h3>

          {round.map((m, mIndex) => (
            <div key={mIndex} className="match-card">
              <div className="match-teams">
                <span className="team-name">{m.team1}</span>
                <span className="vs">vs</span>
                <span className="team-name">{m.team2}</span>
              </div>

              {tournament.scoringMode === "skins" ? (
                <div className="skins-input">
                  <div style={{ marginBottom: "0.6rem" }}>
                    <strong>Skin 1</strong>
                    <input
                      type="number"
                      min="0"
                      placeholder="A"
                      value={m.skins[0].a ?? ""}
                      onChange={(e) =>
                        updateSkinScore(rIndex, mIndex, 0, "a", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="B"
                      value={m.skins[0].b ?? ""}
                      onChange={(e) =>
                        updateSkinScore(rIndex, mIndex, 0, "b", e.target.value)
                      }
                    />
                  </div>

                  <div style={{ marginBottom: "0.6rem" }}>
                    <strong>Skin 2</strong>
                    <input
                      type="number"
                      min="0"
                      placeholder="A"
                      value={m.skins[1].a ?? ""}
                      onChange={(e) =>
                        updateSkinScore(rIndex, mIndex, 1, "a", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="B"
                      value={m.skins[1].b ?? ""}
                      onChange={(e) =>
                        updateSkinScore(rIndex, mIndex, 1, "b", e.target.value)
                      }
                    />
                  </div>

                  <div style={{ marginBottom: "0.6rem" }}>
                    <strong>Skin 3</strong>
                    <input
                      type="number"
                      min="0"
                      placeholder="A"
                      value={m.skins[2].a ?? ""}
                      onChange={(e) =>
                        updateSkinScore(rIndex, mIndex, 2, "a", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="B"
                      value={m.skins[2].b ?? ""}
                      onChange={(e) =>
                        updateSkinScore(rIndex, mIndex, 2, "b", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <div style={{ marginTop: "0.5rem" }}>
                      <small>
                        Totals — A: {m.totalA ?? 0} , B: {m.totalB ?? 0} &nbsp;
                        Skins — A: {m.skinPointsA ?? 0} , B: {m.skinPointsB ?? 0}
                        &nbsp; Bonus — A: {m.bonusA ?? 0} , B: {m.bonusB ?? 0}
                        &nbsp; Match Points — A: {m.matchPointsA ?? 0} , B: {m.matchPointsB ?? 0}
                      </small>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="match-scores">
                  <input
                    type="number"
                    min="0"
                    value={m.score1 ?? ""}
                    onChange={(e) =>
                      updateStandardScore(rIndex, mIndex, "score1", e.target.value)
                    }
                  />
                  <span className="dash">-</span>
                  <input
                    type="number"
                    min="0"
                    value={m.score2 ?? ""}
                    onChange={(e) =>
                      updateStandardScore(rIndex, mIndex, "score2", e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
