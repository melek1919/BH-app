const USAGES = {
  PRIVE: "PRIVE OU AFFAIRES",
  U1: "VEHICULES COMMERC. JUSQU'A 3.5 T (U1)",
  CHANTIER: "ENGINS DE CHANTIER",
  AMBULANCE: "AMBULANCES/POMPIERS/POMPES",
  TRANSPORT: "TRANSPORT DE PERSONNEL (utilitaires)",
  U2: "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
  U2_JUSQUA: "VEHICULES COMMERC. JUSQU'A 3.5 T (U2)",
  REMORQUE: "TRAC. à ROUES SANS LOCAT. AVEC REMORQUE",
  AGRICOLE: "REMORQUES AGRICOLES PLUS DE 3.5 T",
  MOTO125: "MOTOCYCLES DE 50 à 125 CM3",
  CYCLE: "CYCLES SUPERIEURS à 125 CM3",
};

function normalize(s) {
  return (s || "")
    .trim()
    .toUpperCase()
    // Normalise les variantes orthographiques de "COMMERCIAL(S)" pour qu'elles
    // se comparent à "COMMERC." (JUSQU'A 3.5T) des usages standards.
    .replace(/\bCOMMERCIALS?\b/g, "COMMERC")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // retire les accents
    .replace(/[^0-9A-Z]/g, ""); // retire tout caractère non alphanumérique (points, apostrophes, espaces, parenthèses)
}

function eq(usage, ref) {
  return normalize(usage) === normalize(ref);
}

function isMoto(usage) {
  return eq(usage, USAGES.MOTO125) || eq(usage, USAGES.CYCLE);
}

function hasFixedRC(usage) {
  return isMoto(usage);
}

function getFixedRC(usage) {
  if (eq(usage, USAGES.MOTO125)) return 62;
  if (eq(usage, USAGES.CYCLE)) return 168;
  return null;
}

function getVariable(vehicule) {
  const usage = vehicule.usage || "";
  const p = Number(vehicule.puissance) || 0;
  const nb = Number(vehicule.nb_places) || 0;
  const ptac = Number(vehicule.ptac) || 0;

  if (eq(usage, USAGES.PRIVE)) {
    if (p >= 3 && p <= 4) return 110;
    if (p >= 5 && p <= 6) return 140;
    if (p >= 7 && p <= 10) return 170;
    if (p >= 11 && p <= 14) return 220; 
    if (p >= 15) return 264;
  }

  if (eq(usage, USAGES.U1)) {
    if (p >= 3 && p <= 4) return 171;
    if (p >= 5 && p <= 6) return 214;
    if (p >= 7 && p <= 10) return 262;
    if (p >= 11 && p <= 14) return 338;
    if (p >= 15) return 405;
  }

  if (eq(usage, USAGES.CHANTIER)) {
    if (p >= 7 && p <= 10) return 183.4;
    if (p >= 11 && p <= 14) return 236.6;
    if (p >= 15) return 283.5;
  }

  if (eq(usage, USAGES.AMBULANCE)) {
    if (p >= 5 && p <= 6) return 214;
    if (p >= 7 && p <= 10) return 262;
    if (p >= 11 && p <= 14) return 338;
    if (p >= 15) return 405;
  }

  if (eq(usage, USAGES.TRANSPORT)) {
    if (p >= 5 && p <= 6) return 214 + 1.98 * nb;
    if (p >= 7 && p <= 10) return 262 + 1.98 * nb;
    if (p >= 11 && p <= 14) return 338 + 1.98 * nb;
    if (p >= 15) return 405 + 1.98 * nb;
  }

  if (eq(usage, USAGES.U2)) {
    return 257 + 21 * (ptac - 3.5);
  }

  if (eq(usage, USAGES.U2_JUSQUA)) {
    return 257 + 21 * (ptac - 3.5);
  }

  if (eq(usage, USAGES.REMORQUE)) {
    return 42;
  }

  if (eq(usage, USAGES.AGRICOLE)) {
    return 13 + 1 * (ptac - 3.5);
  }

  return 0;
}

export function calcVehicule(vehicule) {
  const nb = Number(vehicule.nb_places) || 0;
  const usage = vehicule.usage || "";

  const fixedRC = hasFixedRC(usage) ? getFixedRC(usage) : null;
  const variable = fixedRC !== null ? fixedRC : getVariable(vehicule);
  const RC = fixedRC !== null ? fixedRC : variable * 1.2;
  const FGA = RC * 0.02;
  const CFFGA = 3;
  const FSSR = 0.3;
  const FPAC = 0.5;
  const fraisAdhesion = 10;
  const DR = isMoto(usage) ? 50 : 20;
  const primeNetteTotale = RC + DR;
  const TUA = (primeNetteTotale + fraisAdhesion) * 0.12;
  const totalSansPTA = primeNetteTotale + fraisAdhesion + TUA + FGA + FPAC + FSSR + CFFGA;
  const primePTA = 2 * nb;
  const TUA_PTA = primePTA * 0.12;

  const totalAvecPTA = Math.round((totalSansPTA + primePTA + TUA_PTA) * 100) / 100;

  return {
    variable: Math.round(variable * 100) / 100,
    RC: Math.round(RC * 100) / 100,
    FGA: Math.round(FGA * 100) / 100,
    CFFGA,
    FSSR,
    FPAC,
    fraisAdhesion,
    DR,
    primeNetteTotale: Math.round(primeNetteTotale * 100) / 100,
    TUA: Math.round(TUA * 100) / 100,
    totalSansPTA: Math.round(totalSansPTA * 100) / 100,
    primePTA,
    TUA_PTA: Math.round(TUA_PTA * 100) / 100,
    totalAvecPTA,
  };
}

export function calcContrat(vehicules) {
  const details = vehicules.map((v, idx) => ({
    index: idx,
    immatriculation: v.immatriculation || `Véhicule ${idx + 1}`,
    ...calcVehicule(v),
  }));

  const primeNetteTotale = details.reduce((s, d) => s + d.primeNetteTotale, 0);
  const totalPrimePTA = details.reduce((s, d) => s + d.primePTA, 0);
  const totalFraisAdhesion = details.reduce((s, d) => s + d.fraisAdhesion, 0);
  const totalTUA = details.reduce((s, d) => s + d.TUA, 0);
  const totalFGA = details.reduce((s, d) => s + d.FGA, 0);
  const totalTUA_PTA = details.reduce((s, d) => s + d.TUA_PTA, 0);
  const totalFPAC = details.reduce((s, d) => s + d.FPAC, 0);
  const totalFSSR = details.reduce((s, d) => s + d.FSSR, 0);
  const totalCFFGA = details.reduce((s, d) => s + d.CFFGA, 0);

  const fraisContrat = 45;
  const taxeFraisContrat = 45 * 0.12;

  const primeNetteContrat = primeNetteTotale + totalPrimePTA;
  const fraisAdhesionContrat = totalFraisAdhesion + fraisContrat;
  const taxe = totalTUA + totalFGA + totalTUA_PTA;
  const totalSansPTAVehicules = details.reduce((s, d) => s + d.totalSansPTA, 0);
  const totalTous = totalSansPTAVehicules + totalTUA_PTA + fraisContrat + taxeFraisContrat;

  return {
    primeNetteContrat: Math.round(primeNetteContrat * 100) / 100,
    fraisAdhesionContrat: Math.round(fraisAdhesionContrat * 100) / 100,
    taxeFraisContrat: Math.round(taxeFraisContrat * 100) / 100,
    taxe: Math.round(taxe * 100) / 100,
    FPAC: Math.round(totalFPAC * 100) / 100,
    FSSR: Math.round(totalFSSR * 100) / 100,
    CFFGA: Math.round(totalCFFGA * 100) / 100,
    primeTTC: Math.round(totalTous * 100) / 100,
    details,
  };
}
