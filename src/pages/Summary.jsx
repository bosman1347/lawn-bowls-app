import { useState, useEffect } from "react";
import {
  loadTournaments,
  getActiveTournament
} from "../utils/storage";

import { buildZIP } from "../utils/exporter";

export default function Summary() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);

  // Load tournament data
  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setMatches(data.matches);

      // Recompute standings using unified logic
      const table = computeStandings(data.matches);
      setStandings(table);
    }
  }, []);

  // Unified computeStandings (same logic as Standings.jsx)
  function computeStandings(matchRounds) {
    const table = {};

    matchRounds.forEach((round) => {
      round.forEach((m) => {
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
          const skins = m.skins;
          let totalA = 0,
            totalB = 0;
          let skinPointsA = 0,
            skinPointsB = 0;

          skins.forEach((s) => {
            const a = s.a == null ? null : Number(s.a);
            const b = s.b == null ? null : Number(s.b);
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

          const anyCompleteSkin = skins.some((s) => s.a != null && s.b != null);
          if (anyCompleteSkin) {
            t1.played++;
            t2.played++;
          }

          t1.shotsFor += totalA;
          t1.shotsAgainst += totalB;
          t2.shotsFor += totalB;
          t2.shotsAgainst += totalA;

          t1.diff = t1.shotsFor - t1.shotsAgainst;
          t2.diff = t2.shotsFor - t2.shotsAgainst;

          let bonusA = 0,
            bonusB = 0;
          if (skinPointsA > skinPointsB) bonusA = 2;
          else if (skinPointsB > skinPointsA) bonusB = 2;
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
      });
    });

    return Object.values(table).sort((a, b) =>
      b.points - a.points ||
      b.diff - a.diff ||
      b.shotsFor - a.shotsFor ||
      a.team.localeCompare(b.team)
    );
  }

  // Export
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

            {round.map((m, mIndex) => (
              <div
                key={mIndex}
                className={`summary-match ${
                  // mark complete if standard scores present OR all skins have values
                  (m.score1 != null && m.score2 != null) ||
                  (m.skins && m.skins.every((s) => s.a != null && s.b != null))
                    ? "summary-complete"
                    : ""
                }`}
              >
                <div className="summary-team">
                  <strong>{m.team1}</strong>
                </div>

                <div className="summary-score">
                  {m.score1 != null && m.score2 != null ? (
                    <>
                      {m.score1} <span className="summary-vs">vs</span> {m.score2}
                    </>
                  ) : m.skins ? (
                    <>
                      S1:{m.skins[0].a ?? "-"} S2:{m.skins[1].a ?? "-"} S3:{m.skins[2].a ?? "-"} <br />
                      Tot:{m.totalA ?? 0}
                    </>
                  ) : (
                    <>-</>
                  )}
                </div>

                <div className="summary-team">
                  <strong>{m.team2}</strong>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
