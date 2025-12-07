// src/utils/scorecards.js
// Scorecard generator for Centurion Bowls Club
// - A6 portrait scorecards (one per PDF, zipped)
// - A4 landscape sheets with two A6 cards per page
// - 15 ends, 3 skins of 5 ends, 5x4 scoring grid per skin

import jsPDF from "jspdf";
import JSZip from "jszip";

const A6_WIDTH = 105;
const A6_HEIGHT = 148.5;

// Draw a single scorecard at a given origin (x0, y0) on any page size
function drawScorecard(doc, x0, y0, options) {
  const {
    tournamentName,
    roundNumber,
    green,
    rink,
    team1,
    team2
  } = options || {};

  const cardWidth = A6_WIDTH;
  const startX = x0 + 5;
  let y = y0 + 10;
  const centerX = x0 + cardWidth / 2;

  // Header: club name, center-aligned, with space for logo above
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Centurion Bowls Club", centerX, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.text("Scorecard", centerX, y, { align: "center" });
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  const tourLabel =
    tournamentName && tournamentName.trim().length > 0
      ? tournamentName
      : "____________________________";
  doc.text(`Tournament: ${tourLabel}`, startX, y);
  y += 5;

  const roundLabel =
    roundNumber != null && roundNumber !== ""
      ? String(roundNumber)
      : "________";
  doc.text(`Round: ${roundLabel}`, startX, y);
  doc.text("Date: ________________", startX + 45, y);
  y += 5;

  const greenLabel = green && green.trim() ? green : "____";
  const rinkLabel =
    rink != null && rink !== "" && rink !== undefined ? String(rink) : "____";

  doc.text(
    `Green: ${greenLabel}   Rink: ${rinkLabel}`,
    startX,
    y
  );
  y += 6;

  const team1Label =
    team1 && team1.trim().length > 0
      ? team1
      : "____________________________";
  const team2Label =
    team2 && team2.trim().length > 0
      ? team2
      : "____________________________";

  doc.text(`Team 1: ${team1Label}`, startX, y);
  y += 5;
  doc.text(`Team 2: ${team2Label}`, startX, y);
  y += 7;

  // Light grid style
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);

  const rowHeight = 4.0;
  const endColWidth = 8;
  const totalWidth = 90;
  const scoreColWidth = (totalWidth - endColWidth) / 4; // 4 scoring columns

  const drawSkinTable = (label, startEnd) => {
    // Skin label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(label, startX, y);
    y += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    const tableX = startX;
    let tableY = y;

    // 5 rows for ends
    for (let i = 0; i < 5; i++) {
      const endNo = startEnd + i;
      const rowY = tableY + i * rowHeight;

      // End number cell
      let cellX = tableX;
      doc.rect(cellX, rowY, endColWidth, rowHeight);
      doc.text(String(endNo), cellX + 2, rowY + rowHeight - 1.2);

      cellX += endColWidth;

      // 4 scoring cells (blank, no headers)
      for (let c = 0; c < 4; c++) {
        doc.rect(cellX, rowY, scoreColWidth, rowHeight);
        cellX += scoreColWidth;
      }
    }

    y = tableY + 5 * rowHeight + 3;

    // One-line subtotals
    doc.text("Shots:", startX, y);
    doc.text("Team 1 __________", startX + 18, y);
    doc.text("Team 2 __________", startX + 60, y);
    y += 5;
  };

  // Skin 1 (Ends 1–5)
  drawSkinTable("Skin 1 — Ends 1–5", 1);
  // Skin 2 (Ends 6–10)
  drawSkinTable("Skin 2 — Ends 6–10", 6);
  // Skin 3 (Ends 11–15)
  drawSkinTable("Skin 3 — Ends 11–15", 11);

  // Final totals + signatures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("FINAL TOTAL SHOTS", startX, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Total shots: Team 1 __________________   Team 2 __________________",
    startX,
    y
  );
  y += 6;

  doc.text(
    "Captain Signature (Team 1): ____________________________",
    startX,
    y
  );
  y += 5;
  doc.text(
    "Captain Signature (Team 2): ____________________________",
    startX,
    y
  );
  y += 5;
  doc.text("Umpire Signature: ________________________________", startX, y);
}

// A6: build a ZIP of one A6-per-PDF scorecards for a round
export async function buildScorecardsZipForRound(
  tournamentName,
  roundIndex,
  roundMatches
) {
  const zip = new JSZip();
  const safeName =
    (tournamentName || "tournament").replace(/[^a-z0-9\\-]+/gi, "_") ||
    "tournament";
  const roundNumber = roundIndex + 1;

  for (let i = 0; i < roundMatches.length; i++) {
    const m = roundMatches[i];
    if (!m || !m.team1 || !m.team2) continue;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [A6_WIDTH, A6_HEIGHT]
    });

    drawScorecard(doc, 0, 0, {
      tournamentName,
      roundNumber,
      green: m.green || "",
      rink: m.rink,
      team1: m.team1,
      team2: m.team2
    });

    const pdfArrayBuf = doc.output("arraybuffer");

    const fileName = `${safeName}_R${roundNumber}_Rink_${m.green || "X"}${
      m.rink != null ? m.rink : "?"
    }.pdf`;

    zip.file(fileName, pdfArrayBuf);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return zipBlob;
}

// A4: TWO A6 CARDS PER LANDSCAPE PAGE (correct dimensions)
export async function buildScorecardsA4ForRound(
  tournamentName,
  roundIndex,
  roundMatches
) {
  // True A4 landscape size: 297 x 210 mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const roundNumber = roundIndex + 1;

  // Positions for 2 cards per page
  const positions = [
    { x: 10, y: 10 },                   // Left card
    { x: 10 + A6_WIDTH + 10, y: 10 }    // Right card
  ];

  let cardIndex = 0;

  for (let i = 0; i < roundMatches.length; i++) {
    const m = roundMatches[i];
    if (!m || !m.team1 || !m.team2) continue;

    // Add new page if starting a third card
    if (cardIndex > 0 && cardIndex % 2 === 0) {
      doc.addPage();
    }

    const pos = positions[cardIndex % 2];

    drawScorecard(doc, pos.x, pos.y, {
      tournamentName,
      roundNumber,
      green: m.green || "",
      rink: m.rink,
      team1: m.team1,
      team2: m.team2
    });

    cardIndex++;
  }

  // If odd number of matches → add one blank scorecard
  if (cardIndex % 2 === 1) {
    const pos = positions[1];
    drawScorecard(doc, pos.x, pos.y, {
      tournamentName: "",
      roundNumber: "",
      green: "",
      rink: "",
      team1: "",
      team2: ""
    });
  }

  return doc.output("blob");
}


  const pdfBlob = doc.output("blob");
  return pdfBlob;
}
