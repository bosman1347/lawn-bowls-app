import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { loadTournaments, getActiveTournament } from "./storage";

// ----------------------------------------------------
// Build Standings CSV
// ----------------------------------------------------
export function buildStandingsCSV(standings) {
  let csv = "Team,Played,Won,Drawn,Lost,Points,ShotDiff\n";

  standings.forEach((row) => {
    csv += `${row.team},${row.played},${row.won},${row.drawn},${row.lost},${row.points},${row.diff}\n`;
  });

  return csv;
}

// ----------------------------------------------------
// Build Matches CSV
// ----------------------------------------------------
export function buildMatchesCSV(matches) {
  let csv = "Round,Team1,Score1,Team2,Score2\n";

  matches.forEach((round, rIndex) => {
    round.forEach((m) => {
      csv += `${rIndex + 1},${m.team1},${m.score1 ?? ""},${m.team2},${m.score2 ?? ""}\n`;
    });
  });

  return csv;
}

// ----------------------------------------------------
// Build JSON export of entire tournament
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
      doc.text(
        `${m.team1} ${m.score1 ?? "-"} vs ${m.score2 ?? "-"} ${m.team2}`,
        10,
        y
      );
      y += 7;
    });

    y += 4;

    // If we reach the bottom, create a new page
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  return doc.output("blob");
}

// ----------------------------------------------------
// Build ZIP file containing everything
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
