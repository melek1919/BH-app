import ExcelJS from "exceljs";

// ---------------------------------------------------------------
// Réplique fidèle de calcul.xlsx : mêmes colonnes (A→S), même ordre,
// mêmes formules, même en-tête jaune, même encadré récapitulatif.
// Seule différence volontaire : les largeurs de colonnes D→S sont
// élargies pour que les intitulés ne débordent plus (structure et
// contenu identiques, juste plus lisible à l'écran/à l'impression).
// ---------------------------------------------------------------

const YELLOW = "FFFF00";
const MEDIUM = "medium";
const THIN = "thin";

const border = (t, r, b, l) => ({
  top: t ? { style: t } : undefined,
  right: r ? { style: r } : undefined,
  bottom: b ? { style: b } : undefined,
  left: l ? { style: l } : undefined,
});

/**
 * @param {Object} params
 * @param {Object} params.contrat    { numero_police }
 * @param {Array}  params.vehicules  lignes véhicule brutes (immatriculation, usage, marque, puissance, nb_places, pvid...)
 * @param {Object} params.tarif      résultat de calcContrat(vehicules) — { details[], ... }
 */
export async function buildContratWorkbook({ contrat, vehicules, tarif }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "BH Assurance";
  wb.created = new Date();

  const ws = wb.addWorksheet("Feuil1", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const vehicleByImmat = new Map(vehicules.map((v) => [v.immatriculation, v]));

  // ---------------------------------------------------------------
  // TITRE — B3, comme dans le fichier original
  // ---------------------------------------------------------------
  ws.getRow(3).height = 21;
  const titleCell = ws.getCell("B3");
  titleCell.value = `CONTRAT ${contrat.numero_police || ""}`;
  titleCell.font = { name: "Aptos Narrow", size: 16, bold: true, italic: true };

  ws.getRow(6).height = 15.75;

  // ---------------------------------------------------------------
  // EN-TÊTE — ligne 7, fond jaune, identique à l'original
  // ---------------------------------------------------------------
  const HEADER_ROW = 7;
  const headers = [
    "Immatriculation", "Usage", "Marque", "Puissance", "Nombre places", "Capital PTA",
    "Prime RC", "Prime DR", "Prime nette totale", "frais adhésion", "TUA", "FGA",
    "FPAC", "FSSR", "CFFGA", "TOTAL_SANS_PTA", "Prime PTA", "TUA_PTA", "TOTAL",
  ];
  ws.getRow(HEADER_ROW).height = 27.75;
  headers.forEach((label, i) => {
    const col = i + 1;
    const cell = ws.getCell(HEADER_ROW, col);
    cell.value = label;
    cell.font = { name: "Aptos Narrow", size: 10, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${YELLOW}` } };
    cell.alignment = { horizontal: "center", vertical: "center" };
    cell.border = border(MEDIUM, col === 19 ? MEDIUM : THIN, MEDIUM, col === 1 ? MEDIUM : undefined);
  });

  // ---------------------------------------------------------------
  // LIGNES VÉHICULES — mêmes 19 colonnes, mêmes formules Excel
  // ---------------------------------------------------------------
  const MONEY_FMT = "0.000";
  const firstDataRow = HEADER_ROW + 1;
  let r = firstDataRow;

  tarif.details.forEach((d) => {
    const v = vehicleByImmat.get(d.immatriculation) || {};
    const isFirst = r === firstDataRow;

    ws.getCell(r, 1).value = d.immatriculation || null;                 // A Immatriculation
    ws.getCell(r, 2).value = v.usage || "";                             // B Usage
    ws.getCell(r, 3).value = v.marque || "";                            // C Marque
    ws.getCell(r, 4).value = v.puissance ?? "";                         // D Puissance
    ws.getCell(r, 5).value = v.nb_places ?? "";                         // E Nombre places
    ws.getCell(r, 6).value = v.pvid ?? 0;                                // F Capital PTA (mappé sur vehicule.pvid — à confirmer)
    ws.getCell(r, 6).numFmt = "0";
    ws.getCell(r, 7).value = d.RC;                                       // G Prime RC
    ws.getCell(r, 8).value = d.DR;                                       // H Prime DR
    ws.getCell(r, 9).value = { formula: `G${r}+H${r}` };                 // I Prime nette totale
    ws.getCell(r, 10).value = d.fraisAdhesion;                           // J frais adhésion
    ws.getCell(r, 11).value = { formula: `12%*(I${r}+J${r})` };          // K TUA
    ws.getCell(r, 12).value = { formula: `G${r}*0.02` };                 // L FGA
    ws.getCell(r, 13).value = d.FPAC;                                    // M FPAC
    ws.getCell(r, 14).value = d.FSSR;                                    // N FSSR
    ws.getCell(r, 15).value = d.CFFGA;                                   // O CFFGA
    ws.getCell(r, 16).value = { formula: `I${r}+J${r}+K${r}+L${r}+M${r}+N${r}+O${r}` }; // P TOTAL_SANS_PTA
    ws.getCell(r, 17).value = d.primePTA;                                // Q Prime PTA
    ws.getCell(r, 18).value = { formula: `+Q${r}*0.12` };                // R TUA_PTA
    ws.getCell(r, 19).value = { formula: `+P${r}+Q${r}+R${r}` };         // S TOTAL

    for (let col = 1; col <= 19; col++) {
      const cell = ws.getCell(r, col);
      cell.font = { name: "Aptos Narrow", size: 11 };
      cell.alignment = { horizontal: "center" };
      if (col >= 7) cell.numFmt = MONEY_FMT;
      cell.border = border(
        isFirst ? MEDIUM : THIN,
        col === 19 ? MEDIUM : THIN,
        THIN,
        col === 1 ? MEDIUM : undefined
      );
    }
    r++;
  });

  const lastDataRow = r - 1;

  // ---------------------------------------------------------------
  // LIGNE DE TOTAUX — formules SUM, exactement comme la ligne 72 d'origine
  // ---------------------------------------------------------------
  const totalsRow = r;
  const sumCols = [9, 10, 11, 12, 13, 14, 15, 16, 17]; // I à Q
  sumCols.forEach((col) => {
    const letter = String.fromCharCode(64 + col);
    const cell = ws.getCell(totalsRow, col);
    cell.value = { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})` };
    cell.numFmt = MONEY_FMT;
    cell.font = { name: "Aptos Narrow", size: 11 };
    cell.border = border(undefined, col === 19 ? MEDIUM : THIN, MEDIUM, col === 1 ? MEDIUM : undefined);
  });
  ws.getCell(totalsRow, 18).value = { formula: `+Q${totalsRow}*0.12` };  // R
  ws.getCell(totalsRow, 18).numFmt = MONEY_FMT;
  ws.getCell(totalsRow, 18).border = border(undefined, THIN, MEDIUM);
  ws.getCell(totalsRow, 19).value = { formula: `+P${totalsRow}+Q${totalsRow}+R${totalsRow}` }; // S
  ws.getCell(totalsRow, 19).numFmt = MONEY_FMT;
  ws.getCell(totalsRow, 19).border = border(undefined, MEDIUM, MEDIUM);

  // ---------------------------------------------------------------
  // ENCADRÉ RÉCAPITULATIF — 3 lignes de blanc, puis la boîte B:C
  // ---------------------------------------------------------------
  const recapStart = totalsRow + 4;
  const RECAP_FMT = '#" "##0.000';

  const recapRows = [
    ["PRIME NETTE TOTALE", `I${totalsRow}+Q${totalsRow}`],
    ["FRAIS D'ADHESION + FRAIS CONTRAT", `J${totalsRow}+45`],
    ["TAXE SUR FRAIS CONTRAT", `45*12%`],
    ["TAXE", `K${totalsRow}+L${totalsRow}+R${totalsRow}`],
    ["FPAC", `M${totalsRow}`],
    ["FSSR", `N${totalsRow}`],
    ["CFFGA", `O${totalsRow}`],
  ];

  recapRows.forEach(([label, formula], i) => {
    const row = recapStart + i;
    const isFirst = i === 0;
    ws.getCell(row, 2).value = label;
    ws.getCell(row, 2).font = { name: "Aptos Narrow", size: 11, bold: true };
    ws.getCell(row, 2).border = border(isFirst ? MEDIUM : THIN, MEDIUM, THIN, MEDIUM);

    ws.getCell(row, 3).value = { formula };
    ws.getCell(row, 3).numFmt = RECAP_FMT;
    ws.getCell(row, 3).font = { name: "Aptos Narrow", size: 12, bold: true };
    ws.getCell(row, 3).alignment = { horizontal: "center" };
    ws.getCell(row, 3).border = border(isFirst ? MEDIUM : THIN, MEDIUM, THIN);
  });

  const ttcRow = recapStart + recapRows.length;
  ws.getCell(ttcRow, 2).value = "PRIME TTC";
  ws.getCell(ttcRow, 2).font = { name: "Aptos Narrow", size: 11, bold: true };
  ws.getCell(ttcRow, 2).border = border(MEDIUM, MEDIUM, MEDIUM, MEDIUM);

  ws.getCell(ttcRow, 3).value = { formula: `SUM(C${recapStart}:C${ttcRow - 1})` };
  ws.getCell(ttcRow, 3).numFmt = RECAP_FMT;
  ws.getCell(ttcRow, 3).font = { name: "Aptos Narrow", size: 14, bold: true };
  ws.getCell(ttcRow, 3).alignment = { horizontal: "center" };
  ws.getCell(ttcRow, 3).border = border(MEDIUM, MEDIUM, MEDIUM);

  // ---------------------------------------------------------------
  // LARGEURS DE COLONNES
  // Original : seules A/B/C ont une largeur définie (13.14 / 37.28 / 14.14),
  // D→S restent à la largeur par défaut (~8.43), ce qui tronque les intitulés
  // ("TOTAL_SANS_PTA", "Prime nette totale"...). On élargit D→S pour la
  // lisibilité — structure, ordre et contenu des colonnes restent identiques.
  // ---------------------------------------------------------------
  const widths = [13.14, 37.28, 14.14, 10, 12, 11, 10, 10, 15, 12, 9, 9, 8, 8, 8, 15, 10, 10, 10];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  return wb;
}