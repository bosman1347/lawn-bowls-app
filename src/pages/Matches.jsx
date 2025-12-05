import { useState, useEffect, useRef } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament
} from "../utils/storage";

/*
 Patched Matches.jsx
 - Uses shallow updates (setMatches(prev => ...)) instead of deep cloning
 - Debounces saving to storage (300ms)
 - Keeps skins logic: totals, skinPoints, bonus (by total shots), matchPoints
 - Keeps standard scoring support
*/

export default function Matches() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);
 const [scoringMode, setScoringMode] = useState("standard");


  const saveTimeoutRef = useRef(null);

  // Load tournament
  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setMatches(data.matches || []);
      setScoringMode(data.scoringMethod || "standard");
    }
  }, []);

  // Debounced save helper
  const saveMatchesToStorage = (latestMatches) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const all = loadTournaments();
        if (!all[tournamentName]) all[tournamentName] = {};
        all[tournamentName].matches = latestMatches;
        saveTournaments(all);
      } catch (err) {
        console.error("Error saving matches:", err);
      }
      saveTimeoutRef.current = null;
    }, 300);
  };

  // For skins scoring
  const computeSkinsMatchTotals = (skins) => {
    let totalA = 0,
      totalB = 0;
    let skinPointsA = 0,
      skinPointsB = 0;

    skins.forEach((s) => {
      const a = s?.a == null ? null : Number(s.a);
      const b = s?.b == null ? null : Number(s.b);

      if (a != null) totalA += a;
      if (b != null) totalB += b;

      if (a != null && b != null) {
        if (a > b) skinPointsA += 1;
        else if (b > a) skinPointsB += 1;
        else {
          skinPointsA += 0.5;
          skinPointsB += 0.5;
        }
      }
    });

    // Bonus allocation BY TOTAL SHOTS (equal -> split)
    let bonusA = 0,
      bonusB = 0;
    if (totalA > totalB) bonusA = 2;
    else if (totalB > totalA) bonusB = 2;
    else {
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

  // Standard match update (shallow update, debounced save)
  const updateStandardScore = (roundIndex, matchIndex, field, value) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) =>
        ri !== roundIndex
          ? round
          : round.map((m, mi) => {
              if (mi !== matchIndex) return m;
              const updated = { ...m, [field]: value === "" ? null : Number(value) };

              // if switching to standard, clear skins data
              if (field === "score1" || field === "score2") {
                delete updated.skins;
                delete updated.totalA;
                delete updated.totalB;
                delete updated.skinPointsA;
                delete updated.skinPointsB;
                delete updated.bonusA;
                delete updated.bonusB;
                delete updated.matchPointsA;
                delete updated.matchPointsB;
              }

              return updated;
            })
      );

      saveMatchesToStorage(next);
      return next;
    });
  };

  // Skins update (shallow update, debounced save)
  const updateSkinScore = (roundIndex, matchIndex, skinIndex, team, value) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) =>
        ri !== roundIndex
          ? round
          : round.map((m, mi) => {
              if (mi !== matchIndex) return m;

              const updated = { ...m };
              if (!updated.skins) updated.skins = [{ a: null, b: null }, { a: null, b: null }, { a: null, b: null }];

              // shallow copy skin row
              updated.skins = updated.skins.map((s, si) => (si === skinIndex ? { ...s } : s));
              updated.skins[skinIndex][team] = value === "" ? null : Number(value);

              // Recompute totals
              const totals = computeSkinsMatchTotals(updated.skins);
              updated.totalA = totals.totalA;
              updated.totalB = totals.totalB;
              updated.skinPointsA = totals.skinPointsA;
              updated.skinPointsB = totals.skinPointsB;
              updated.bonusA = totals.bonusA;
              updated.bonusB = totals.bonusB;
              updated.matchPointsA = totals.matchPointsA;
              updated.matchPointsB = totals.matchPointsB;

              // Clear standard fields if any
              delete updated.score1;
              delete updated.score2;

              return updated;
            })
      );

      saveMatchesToStorage(next);
      return next;
    });
  };

  if (!tournamentName) {
    return <div className="page"><h2>No active tournament</h2></div>;
  }

  return (
    <div className="page">
      <h2>Match Scoring — {tournamentName}</h2>

      <p>Scoring Mode: <strong>{scoringMode}</strong></p>

      {matches.map((round, rIndex) => (
        <div key={rIndex} className="round-block">
          <h3>Round {rIndex + 1}</h3>

          {round.map((m, mIndex) => (
            <div key={mIndex} className="match-card">
              <h4>
                {m.team1} vs {m.team2}
              </h4>

              {scoringMode === "standard" ? (
                <div className="standard-score">
                  <input
                    type="number"
                    placeholder={m.team1}
                    value={m.score1 ?? ""}
                    onChange={(e) =>
                      updateStandardScore(rIndex, mIndex, "score1", e.target.value)
                    }
                  />
                  <span className="vs">vs</span>
                  <input
                    type="number"
                    placeholder={m.team2}
                    value={m.score2 ?? ""}
                    onChange={(e) =>
                      updateStandardScore(rIndex, mIndex, "score2", e.target.value)
                    }
                  />
                </div>
              ) : (
                <div className="skins-score">
                  {[0, 1, 2].map((s) => (
                    <div key={s} className="skin-row">
                      <span>Skin {s + 1}</span>

                      <input
                        type="number"
                        placeholder={m.team1}
                        value={m.skins?.[s]?.a ?? ""}
                        onChange={(e) =>
                          updateSkinScore(rIndex, mIndex, s, "a", e.target.value)
                        }
                      />

                      <span className="vs">vs</span>

                      <input
                        type="number"
                        placeholder={m.team2}
                        value={m.skins?.[s]?.b ?? ""}
                        onChange={(e) =>
                          updateSkinScore(rIndex, mIndex, s, "b", e.target.value)
                        }
                      />
                    </div>
                  ))}

                  {/* Summary block */}
                  {(m.totalA != null || m.totalB != null) && (
                    <div className="match-summary">
                      <small>
                        Totals — {m.team1}: {m.totalA ?? 0} , {m.team2}: {m.totalB ?? 0}
                        &nbsp; | Skins — {m.team1}: {m.skinPointsA ?? 0} , {m.team2}: {m.skinPointsB ?? 0}
                        &nbsp; | Bonus — {m.team1}: {m.bonusA ?? 0} , {m.team2}: {m.bonusB ?? 0}
                        &nbsp; | Match Points — {m.team1}: {m.matchPointsA ?? 0} , {m.team2}: {m.matchPointsB ?? 0}
                      </small>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
