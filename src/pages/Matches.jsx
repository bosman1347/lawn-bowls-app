import { useState, useEffect, useRef } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament
} from "../utils/storage";
import {
  buildScorecardsZipForRound,
  buildScorecardsA4ForRound
} from "../utils/scorecards";


/*
 Matches.jsx
 - Supports Standard and Skins scoring
 - Debounced saves to storage
 - Highlights skins (win/draw)
 - Highlights completed + verified matches
 - Adds umpire verification with lock
 - Adds "Download Scorecards" (15-end, portrait) for latest round
*/

export default function Matches() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);
  const [scoringMode, setScoringMode] = useState("standard"); // "standard" | "skins"

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

    (skins || []).forEach((s) => {
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
              if (m.verified) return m; // lock when verified

              const updated = { ...m, [field]: value === "" ? null : Number(value) };

              // if typing standard scores, clear skins data
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
              if (m.verified) return m; // lock when verified

              const updated = { ...m };
              if (!updated.skins) {
                updated.skins = [
                  { a: null, b: null },
                  { a: null, b: null },
                  { a: null, b: null }
                ];
              }

              // shallow copy skin row
              updated.skins = updated.skins.map((s, si) =>
                si === skinIndex ? { ...s } : s
              );
              updated.skins[skinIndex][team] =
                value === "" ? null : Number(value);

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

  // Toggle verification (full lock when verified)
  const toggleVerified = (roundIndex, matchIndex) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) =>
        ri !== roundIndex
          ? round
          : round.map((m, mi) => {
              if (mi !== matchIndex) return m;

              const isStandardComplete =
                m.score1 != null && m.score2 != null;
              const isSkinsComplete =
                m.skins &&
                m.skins.length === 3 &&
                m.skins.every((s) => s?.a != null && s?.b != null);

              const isComplete =
                scoringMode === "standard"
                  ? isStandardComplete
                  : isSkinsComplete;

              if (!m.verified && !isComplete) {
                alert(
                  "You can only verify a match once all scores or skins are fully entered."
                );
                return m;
              }

              return { ...m, verified: !m.verified };
            })
      );

      saveMatchesToStorage(next);
      return next;
    });
  };

  // Download scorecards ZIP for the latest round
  const handleDownloadScorecards = async () => {
    if (!tournamentName) {
      alert("No active tournament.");
      return;
    }
    if (!matches || matches.length === 0) {
      alert("No rounds are available yet.");
      return;
    }

    const roundIndex = matches.length - 1; // latest round
    const roundMatches = matches[roundIndex];

    if (!roundMatches || roundMatches.length === 0) {
      alert("The latest round has no matches.");
      return;
    }

    try {
      const zipBlob = await buildScorecardsZipForRound(
        tournamentName,
        roundIndex,
        roundMatches
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName.replace(
        /[^a-z0-9\-]+/gi,
        "_"
      )}_round_${roundIndex + 1}_scorecards.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error building scorecards ZIP:", err);
      alert("Could not generate scorecards. See console for details.");
    }
  };
  
    const handleDownloadScorecardsA4 = async () => {
    if (!tournamentName) {
      alert("No active tournament.");
      return;
    }
    if (!matches || matches.length === 0) {
      alert("No rounds are available yet.");
      return;
    }

    const roundIndex = matches.length - 1; // latest round
    const roundMatches = matches[roundIndex];

    if (!roundMatches || roundMatches.length === 0) {
      alert("The latest round has no matches.");
      return;
    }

    try {
      const pdfBlob = await buildScorecardsA4ForRound(
        tournamentName,
        roundIndex,
        roundMatches
      );

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName.replace(
        /[^a-z0-9\-]+/gi,
        "_"
      )}_round_${roundIndex + 1}_scorecards_A4.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error building A4 scorecards PDF:", err);
      alert("Could not generate A4 scorecards. See console for details.");
    }
  };


  if (!tournamentName) {
    return (
      <div className="page">
        <h2>No active tournament</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Match Scoring — {tournamentName}</h2>

      <p>
        Scoring Mode: <strong>{scoringMode}</strong>
      </p>

      <button
        className="btn-secondary"
        style={{ marginBottom: "1rem" }}
        onClick={handleDownloadScorecards}
      >
        Download Scorecards (PDF ZIP) for Latest Round
      </button>
	  
	  <button
        className="btn-secondary"
        style={{ marginBottom: "1rem", marginRight: "0.5rem" }}
        onClick={handleDownloadScorecards}
      >
        Download Scorecards (A6 ZIP)
      </button>

      <button
        className="btn-secondary"
        style={{ marginBottom: "1rem" }}
        onClick={handleDownloadScorecardsA4}
      >
        Download Scorecards (A4 — 4 per page)
      </button>
	  

      {matches.map((round, rIndex) => (
        <div key={rIndex} className="round-block">
          <h3>Round {rIndex + 1}</h3>

          {round.map((m, mIndex) => {
            const isStandardComplete =
              m.score1 != null && m.score2 != null;
            const hasSkins = m.skins && m.skins.length === 3;
            const isSkinsComplete =
              hasSkins &&
              m.skins.every((s) => s?.a != null && s?.b != null);

            const isComplete =
              scoringMode === "standard"
                ? isStandardComplete
                : isSkinsComplete;

            const matchCardClass = [
              "match-card",
              isComplete ? "match-complete" : "",
              m.verified ? "match-verified" : ""
            ]
              .join(" ")
              .trim();

            return (
              <div key={mIndex} className={matchCardClass}>
                {/* Green & rink header */}
                {m.green && m.rink != null && (
                  <div className="match-location">
                    <strong>🟩 Green {m.green} — Rink {m.rink}</strong>
                  </div>
                )}

                <div className="match-header">
                  <h4>
                    {m.team1} vs {m.team2}
                  </h4>
                  <div className="match-status">
                    {m.verified ? (
                      <span className="badge-verified">Verified ✓</span>
                    ) : isComplete ? (
                      <span className="badge-pending">
                        Complete — Not Verified
                      </span>
                    ) : (
                      <span className="badge-incomplete">In Progress</span>
                    )}
                    <button
                      className="btn-verify"
                      type="button"
                      onClick={() => toggleVerified(rIndex, mIndex)}
                    >
                      {m.verified ? "Unverify" : "Mark as Verified"}
                    </button>
                  </div>
                </div>

                {scoringMode === "standard" ? (
                  <div className="standard-score">
                    <input
                      type="number"
                      placeholder={m.team1}
                      value={m.score1 ?? ""}
                      disabled={m.verified}
                      onChange={(e) =>
                        updateStandardScore(
                          rIndex,
                          mIndex,
                          "score1",
                          e.target.value
                        )
                      }
                    />
                    <span className="vs">vs</span>
                    <input
                      type="number"
                      placeholder={m.team2}
                      value={m.score2 ?? ""}
                      disabled={m.verified}
                      onChange={(e) =>
                        updateStandardScore(
                          rIndex,
                          mIndex,
                          "score2",
                          e.target.value
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="skins-score">
                    {[0, 1, 2].map((s) => {
                      const skin = m.skins?.[s] || {};
                      const a = skin.a;
                      const b = skin.b;

                      let rowClass = "skin-row";
                      if (a != null && b != null) {
                        if (a > b) rowClass += " skin-win-team1";
                        else if (b > a) rowClass += " skin-win-team2";
                        else rowClass += " skin-draw";
                      }

                      return (
                        <div key={s} className={rowClass}>
                          <span>Skin {s + 1}</span>

                          <input
                            type="number"
                            placeholder={m.team1}
                            value={a ?? ""}
                            disabled={m.verified}
                            onChange={(e) =>
                              updateSkinScore(
                                rIndex,
                                mIndex,
                                s,
                                "a",
                                e.target.value
                              )
                            }
                          />

                          <span className="vs">vs</span>

                          <input
                            type="number"
                            placeholder={m.team2}
                            value={b ?? ""}
                            disabled={m.verified}
                            onChange={(e) =>
                              updateSkinScore(
                                rIndex,
                                mIndex,
                                s,
                                "b",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      );
                    })}

                    {(m.totalA != null || m.totalB != null) && (
                      <div className="match-summary">
                        <small>
                          Totals — {m.team1}: {m.totalA ?? 0} , {m.team2}:{" "}
                          {m.totalB ?? 0}
                          &nbsp; | Skins — {m.team1}: {m.skinPointsA ?? 0} ,{" "}
                          {m.team2}: {m.skinPointsB ?? 0}
                          &nbsp; | Bonus — {m.team1}: {m.bonusA ?? 0} ,{" "}
                          {m.team2}: {m.bonusB ?? 0}
                          &nbsp; | Match Points — {m.team1}:{" "}
                          {m.matchPointsA ?? 0} , {m.team2}:{" "}
                          {m.matchPointsB ?? 0}
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
