import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";

import { buildZIP } from "../utils/exporter";

import { resolveTournament } from "../utils/tournamentContext";
	
	
export default function Summary() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    

	const [searchParams] = useSearchParams();
	const name = resolveTournament(searchParams);

    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setMatches(data.matches || []);
    }
  }, []);

  const standings = useMemo(
    () => computeStandings(matches),
    [JSON.stringify(matches)]
  );

  function computeStandings(matchRounds) {
    const table = {};

    (matchRounds || []).forEach((round) => {
      (round || []).forEach((m) => {
        if (!table[m.team1]) {
          table[m.team1] = {
            team: m.team1,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            points: 0,
            shotsFor: 0,
            shotsAgainst: 0,
            diff: 0
          };
        }
        if (!table[m.team2]) {
          table[m.team2] = {
            team: m.team2,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            points: 0,
            shotsFor: 0,
            shotsAgainst: 0,
            diff: 0
          };
        }

        const t1 = table[m.team1];
        const t2 = table[m.team2];

        if (m.score1 != null && m.score2 != null) {
          const s1 = Number(m.score1);
          const s2 = Number(m.score2);

          t1.played++;
          t2.played++;

          t1.shotsFor += s1;
          t1.shotsAgainst += s2;
          t2.shotsFor += s2;
          t2.shotsAgainst += s1;

          t1.diff = t1.shotsFor - t1.shotsAgainst;
          t2.diff = t2.shotsFor - t2.shotsAgainst;

          if (s1 > s2) {
            t1.won++;
            t1.points += 2;
            t2.lost++;
          } else if (s2 > s1) {
            t2.won++;
            t2.points += 2;
            t1.lost++;
          } else {
            t1.drawn++;
            t2.drawn++;
            t1.points++;
            t2.points++;
          }
        } else if (m.skins) {
          const skins = m.skins || [];
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

          // accumulate shots even if partial
          t1.shotsFor += totalA;
          t1.shotsAgainst += totalB;
          t2.shotsFor += totalB;
          t2.shotsAgainst += totalA;

          t1.diff = t1.shotsFor - t1.shotsAgainst;
          t2.diff = t2.shotsFor - t2.shotsAgainst;

          const allSkinsComplete =
            skins.length === 3 &&
            skins.every((s) => s?.a != null && s?.b != null);

          if (allSkinsComplete) {
            t1.played++;
            t2.played++;

            // bonus by total shots (tie -> split)
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

            if (matchPointsA > matchPointsB) {
              t1.won++;
              t1.points += matchPointsA;
              t2.lost++;
            } else if (matchPointsB > matchPointsA) {
              t2.won++;
              t2.points += matchPointsB;
              t1.lost++;
            } else {
              t1.drawn++;
              t2.drawn++;
              t1.points += matchPointsA;
              t2.points += matchPointsB;
            }
          }
        }
      });
    });

    return Object.values(table).sort(
      (a, b) =>
        b.points - a.points ||
        b.diff - a.diff ||
        b.shotsFor - a.shotsFor ||
        a.team.localeCompare(b.team)
    );
  }

  async function exportBundle() {
    const zipBlob = await buildZIP(standings, matches);

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${tournamentName}-export.zip`;
    a.click();

    URL.revokeObjectURL(url);
  }

  if (!tournamentName) {
    return (
      <div className="page">
        <h2>No active tournament</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Summary — {tournamentName}</h2>

      <button className="btn-primary" onClick={exportBundle}>
        Export Tournament ZIP
      </button>

      <p style={{ marginTop: "1rem" }}>
        A quick overview of all match scores entered so far.
      </p>

      <div className="summary-container">
        {matches.map((round, rIndex) => (
          <div key={rIndex} className="summary-round-card">
            <h3>Round {rIndex + 1}</h3>

            {round.map((m, mIndex) => {
              const isStandardComplete =
                m.score1 != null && m.score2 != null;
              const isSkinsComplete =
                m.skins &&
                m.skins.length === 3 &&
                m.skins.every((s) => s.a != null && s.b != null);

              const isComplete =
                isStandardComplete || isSkinsComplete;

              const matchClass = [
                "summary-match",
                isComplete ? "summary-complete" : "",
                m.verified ? "summary-verified" : ""
              ]
                .join(" ")
                .trim();

              return (
                <div key={mIndex} className={matchClass}>
                  <div className="summary-header">
                    <span className="summary-title">
                      {m.team1} vs {m.team2}
                    </span>
                    {m.verified ? (
                      <span className="badge-verified">Verified ✓</span>
                    ) : isComplete ? (
                      <span className="badge-pending">Complete — Not Verified</span>
                    ) : (
                      <span className="badge-incomplete">In Progress</span>
                    )}
                  </div>

                  <div className="summary-team">
                    <strong>{m.team1}</strong>
                    {m.skins ? (
                      <div>
                        S1:{m.skins[0].a ?? "-"} S2:{m.skins[1].a ?? "-"} S3:{m.skins[2].a ?? "-"} <br />
                        Tot:{m.totalA ?? 0} &nbsp; MP:{m.matchPointsA ?? "-"}
                      </div>
                    ) : m.score1 != null ? (
                      <div>{m.score1}</div>
                    ) : null}
                  </div>

                  <div className="summary-score">
                    {m.score1 != null && m.score2 != null ? (
                      <>
                        {m.score1} <span className="summary-vs">vs</span>{" "}
                        {m.score2}
                      </>
                    ) : m.skins ? (
                      <div style={{ textAlign: "center" }}>
                        <div>
                          Skins: {m.skinPointsA ?? 0} - {m.skinPointsB ?? 0}
                        </div>
                        <div>
                          Totals: {m.totalA ?? 0} - {m.totalB ?? 0}
                        </div>
                        <div>
                          MP: {m.matchPointsA ?? "-"} -{" "}
                          {m.matchPointsB ?? "-"}
                        </div>
                      </div>
                    ) : (
                      <>-</>
                    )}
                  </div>

                  <div
                    className="summary-team"
                    style={{ textAlign: "right" }}
                  >
                    <strong>{m.team2}</strong>
                    {m.skins ? (
                      <div>
                        S1:{m.skins[0].b ?? "-"} S2:{m.skins[1].b ?? "-"} S3:{m.skins[2].b ?? "-"} <br />
                        Tot:{m.totalB ?? 0} &nbsp; MP:{m.matchPointsB ?? "-"}
                      </div>
                    ) : m.score2 != null ? (
                      <div>{m.score2}</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
