// src/utils/scorecards.js
// Scorecard generator for Centurion Bowls Club
// - A6 portrait scorecards (one per PDF, zipped)
// - A4 portrait sheets with four A6 cards per page
// - 15 ends, 3 skins of 5 ends, 5x4 scoring grid per skin

import jsPDF from "jspdf";
import JSZip from "jszip";

const A6_WIDTH = 105;
const A6_HEIGHT = 148.5;

// Draw a single scorecard at a given origin (x0, y0) on any page size
function drawScorecard(doc, x0, y0, options) {
  const { tournamentName, roundNumber, green, rink } = options || {};

  const cardWidth = A6_WIDTH;
  const startX = x0 + 5;
  let y = y0 + 10;
  const centerX = x0 + cardWidth / 2;

  // Header: logo space + club name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  // Space for logo (just visual gap for now)
  // (If you later add an image, place it here.)
  doc.text("Centurion Bowls Club", centerX, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.text("Scorecard", centerX, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  const tourLabel = tournamentName || "____________________________";
  doc.text(`Tournament: ${tourLabel}`, startX, y);
  y += 5;

  doc.text(`Round: ${roundNumber || ""}`, startX, y);
  doc.text("Date: ________________", startX + 45, y);
  y += 5;

  doc.text(
    `Green: ${green || "____"}   Rink: ${
      rink != null ? rink : "____"
    }`,
    startX,
    y
  );
  y += 6;

  doc.text("Team 1: ________________________________", startX, y);
  y += 5;
  doc.text("Team 2: ________________________________", startX, y);
  y += 8;

  // Light grid style
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);

  const rowHeight = 4.2;
  const endColWidth = 8;
  const totalWidth = 90;
  const scoreColWidth = (totalWidth - endColWidth) / 4; // 4 scoring columns

  const drawSkinTable = (label, startEnd) => {
    // Skin label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(label, startX, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    const tableX = startX;
    let tableY = y;

    // 5 rows for ends
    for (let i = 0; i < 5; i++) {
      const endNo = startEnd + i;
      const rowY = tableY + i * rowHeight;

      // Draw 5 cells: [End][col1][col2][col3][col4]
      let cellX = tableX;

      // End number cell
      doc.rect(cellX, rowY, endColWidth, rowHeight);
      doc.text(String(endNo), cellX + 2, rowY + rowHeight - 1.2);

      cellX += endColWidth;

      // 4 scoring cells (blank)
      for (let c = 0; c < 4; c++) {
        doc.rect(cellX, rowY, scoreColWidth, rowHeight);
        cellX += scoreColWidth;
      }
    }

    y = tableY + 5 * rowHeight + 4;

    // Subtotals
    doc.text("Team 1 Subtotal: ________________", startX, y);
    y += 4;
    doc.text("Team 2 Subtotal: ________________", startX, y);
    y += 6;
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
  doc.text("Team 1 Total: ____________________________", startX, y);
  y += 4;
  doc.text("Team 2 Total: ____________________________", startX, y);
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
    (tournamentName || "tournament").replace(/[^a-z0-9\-]+/gi, "_") ||
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
      rink: m.rink
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

// A4: TWO A6 CARDS PER LANDSCAPE PAGE (clean margins, no overlap)
export async function buildScorecardsA4ForRound(
  tournamentName,
  roundIndex,
  roundMatches
) {
  // Landscape A4: 297 x 210 mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const roundNumber = roundIndex + 1;

  // Two positions per landscape page
  const positions = [
    { x: 10, y: 10 },                           // Left card
    { x: A6_WIDTH + 20, y: 10 }                 // Right card
  ];

  const perPage = 2;
  let cardIndex = 0;

  for (let i = 0; i < roundMatches.length; i++) {
    const m = roundMatches[i];
    if (!m || !m.team1 || !m.team2) continue;

    if (cardIndex > 0 && cardIndex % perPage === 0) {
      doc.addPage();
    }

    const posIndex = cardIndex % perPage;
    const { x, y } = positions[posIndex];

    drawScorecard(doc, x, y, {
      tournamentName,
      roundNumber,
      green: m.green || "",
      rink: m.rink
    });

    cardIndex++;
  }

  // If card count ends with only 1 used position, add a blank card
  if (cardIndex > 0 && cardIndex % perPage === 1) {
    const posIndex = 1;             // Right-hand position
    const { x, y } = positions[posIndex];

    drawScorecard(doc, x, y, {
      tournamentName: "",
      roundNumber: "",
      green: "",
      rink: ""
    });
  }

  const pdfBlob = doc.output("blob");
  return pdfBlob;
}


  // Option 3: if last page not full, add ONE blank generic card
  if (cardIndex > 0 && cardIndex % perPage !== 0) {
    if (cardIndex % perPage !== 0) {
      if (cardIndex % perPage === 0) {
        // full page - do nothing
      } else {
        const posIndex = cardIndex % perPage;
        if (posIndex === 0) {
          doc.addPage();
        }
        const { x, y } = positions[posIndex];
        drawScorecard(doc, x, y, {
          tournamentName: "",
          roundNumber: "",
          green: "",
          rink: ""
        });
      }
    }
  }

  const pdfBlob = doc.output("blob");
  return pdfBlob;
}
