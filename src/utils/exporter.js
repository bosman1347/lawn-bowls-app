import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { loadTournaments, getActiveTournament } from "./storage";

// ----------------------------------------------------
// Build Standings CSV
// ----------------------------------------------------
export function buildStandingsCSV(standings) {
  let csv = "Team,Played,Won,Drawn,Lost,Points,ShotsFor,ShotsAgainst,ShotDiff\n";

  standings.forEach((row) => {
    csv += `${row.team},${row.played},${row.won},${row.drawn},${row.lost},${row.points},${row.shotsFor},${row.shotsAgainst},${row.diff}\n`;
  });

  return csv;
}

// ----------------------------------------------------
// Build Matches CSV (supports standard and skins)
// ----------------------------------------------------
export function buildMatchesCSV(matches) {
  // We'll produce flexible CSV rows with headers describing type
  let rows = [];
  let header = "";

  // We'll build two-line header so tools can read it
  header =
    "Round,Type,Team1,Team2,Score1,Score2,S1A,S2A,S3A,S1B,S2B,S3B,TotalA,TotalB,MatchPointsA,MatchPointsB\n";

  matches.forEach((round, rIndex) => {
    round.forEach((m) => {
      if (m.score1 != null && m.score2 != null) {
        // standard
        rows.push(
          `${rIndex + 1},standard,${m.team1},${m.team2},${m.score1},${m.score2},,,,,,${m.score1},${m.score2},,`
        );
      } else if (m.skins) {
        const s1A = m.skins[0].a ?? "";
        const s2A = m.skins[1].a ?? "";
        const s3A = m.skins[2].a ?? "";
        const s1B = m.skins[0].b ?? "";
        const s2B = m.skins[1].b ?? "";
        const s3B = m.skins[2].b ?? "";
        const totalA = m.totalA ?? "";
        const totalB = m.totalB ?? "";
        const mpA = m.matchPointsA ?? "";
        const mpB = m.matchPointsB ?? "";
        rows.push(
          `${rIndex + 1},skins,${m.team1},${m.team2},,,${s1A},${s2A},${s3A},${s1B},${s2B},${s3B},${totalA},${totalB},${mpA},${mpB}`
        );
      } else {
        // empty placeholder
        rows.push(`${rIndex + 1},unknown,${m.team1},${m.team2},,,,,,,,,,,`);
      }
    });
  });

  return header + rows.join("\n");
}

// ----------------------------------------------------
// Build JSON for full tournament backup
// ----------------------------------------------------
export function buildTournamentJSON(tournament) {
  return JSON.stringify(tournament, null, 2);
}

// ----------------------------------------------------
// Build Summary PDF
// ----------------------------------------------------
export function buildSummaryPDF(tournamentName, matches) {
  const doc = new jsPDF();
  doc.text(`Tournament Summary: ${tournamentName}`, 10, 10);

  let y = 20;

  matches.forEach((round, rIndex) => {
    doc.text(`Round ${rIndex + 1}`, 10, y);
    y += 8;

    round.forEach((m) => {
      if (m.score1 != null && m.score2 != null) {
        doc.text(`${m.team1} ${m.score1} vs ${m.score2} ${m.team2}`, 10, y);
        y += 7;
      } else if (m.skins) {
        doc.text(
          `${m.team1} [S:${m.skins.map((s) => s.a ?? "-").join(",")}; Tot:${m.totalA ?? 0}] vs [${m.skins
            .map((s) => s.b ?? "-")
            .join(",")}; Tot:${m.totalB ?? 0}] ${m.team2}`,
          10,
          y
        );
        y += 7;
      } else {
        doc.text(`${m.team1} vs ${m.team2} — not entered`, 10, y);
        y += 7;
      }
    });

    y += 4;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  return doc.output("blob");
}

// ----------------------------------------------------
// Build ZIP bundle
// ----------------------------------------------------
export async function buildZIP(standings, matches) {
  const zip = new JSZip();
  const name = getActiveTournament();
  const all = loadTournaments();
  const tournament = all[name];

  // CSVs
  zip.file("standings.csv", buildStandingsCSV(standings));
  zip.file("matches.csv", buildMatchesCSV(matches));

  // JSON (backup of entire tournament)
  zip.file("tournament.json", buildTournamentJSON(tournament));

  // PDF
  const pdfBlob = buildSummaryPDF(name, matches);
  zip.file("summary.pdf", pdfBlob);

  // Generate ZIP
  return zip.generateAsync({ type: "blob" });
}
