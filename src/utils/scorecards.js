// src/utils/scorecards.js
// Generate portrait 15-end scorecards (3 skins of 5 ends) for a round of matches.

import jsPDF from "jspdf";
import JSZip from "jszip";

// Draw a single scorecard for one match
function drawScorecard(doc, options) {
  const {
    tournamentName,
    roundNumber,
    green,
    rink,
    // team1,
    // team2
  } = options;

  const marginLeft = 15;
  let y = 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Twilight Pairs Scorecard", marginLeft, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  // Tournament + Round + Date
  doc.text(`Tournament: ${tournamentName || "________________"}`, marginLeft, y);
  y += 6;
  doc.text(`Round: ${roundNumber}`, marginLeft, y);
  doc.text("Date: ____________________", marginLeft + 60, y);
  y += 8;

  // Green / Rink
  doc.text(
    `Green: ${green || "___"}    Rink: ${rink != null ? rink : "___"}`,
    marginLeft,
    y
  );
  y += 8;

  // Teams (blank lines for names)
  doc.text("Team 1: _______________________________", marginLeft, y);
  y += 6;
  doc.text("Team 2: _______________________________", marginLeft, y);
  y += 10;

  const drawSkinBlock = (label, startEnd) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, marginLeft, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Table header
    doc.text("End", marginLeft, y);
    doc.text("AA S", marginLeft + 15, y);
    doc.text("AA C", marginLeft + 30, y);
    doc.text("HH S", marginLeft + 50, y);
    doc.text("HH C", marginLeft + 65, y);
    y += 5;

    // Lines for 5 ends
    for (let i = 0; i < 5; i++) {
      const endNo = startEnd + i;
      doc.text(String(endNo).padStart(2, " "), marginLeft, y);

      // just underscores for writing
      doc.text("______", marginLeft + 15, y);
      doc.text("______", marginLeft + 30, y);
      doc.text("______", marginLeft + 50, y);
      doc.text("______", marginLeft + 65, y);

      y += 5;
    }

    y += 3;
    // Subtotals
    doc.text("Subtotal AA: ____________", marginLeft, y);
    doc.text("Subtotal HH: ____________", marginLeft + 60, y);
    y += 6;
    doc.text("Skin Winner:  AA / HH / Tie", marginLeft, y);
    y += 10;
  };

  // Skin 1: ends 1–5
  drawSkinBlock("Skin 1 — Ends 1–5", 1);
  // Skin 2: ends 6–10
  drawSkinBlock("Skin 2 — Ends 6–10", 6);
  // Skin 3: ends 11–15
  drawSkinBlock("Skin 3 — Ends 11–15", 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("FINAL TOTAL SHOTS", marginLeft, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text("Team 1 Total: ____________", marginLeft, y);
  y += 6;
  doc.text("Team 2 Total: ____________", marginLeft, y);
  y += 10;

  doc.text("AA Captain Signature: ___________________________", marginLeft, y);
  y += 7;
  doc.text("HH Captain Signature: ___________________________", marginLeft, y);
  y += 7;
  doc.text("Umpire Signature: _______________________________", marginLeft, y);
}

// Build a ZIP of scorecards for one round
export async function buildScorecardsZipForRound(
  tournamentName,
  roundIndex,
  roundMatches
) {
  const zip = new JSZip();
  const safeName =
    (tournamentName || "tournament").replace(/[^a-z0-9\-]+/gi, "_") || "tournament";
  const roundNumber = roundIndex + 1;

  for (let i = 0; i < roundMatches.length; i++) {
    const m = roundMatches[i];
    // Skip weird internal or bye-like matches if any ever appear
    if (!m || !m.team1 || !m.team2) continue;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    drawScorecard(doc, {
      tournamentName,
      roundNumber,
      green: m.green || "",
      rink: m.rink
      // We leave team names blank on the card for handwriting.
    });

    const pdfBlob = doc.output("blob");

    const fileName = `${safeName}_R${roundNumber}_Rink_${m.green || "X"}${
      m.rink != null ? m.rink : "?"
    }.pdf`;

    zip.file(fileName, pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return zipBlob;
}
