export const USAGE_OPTIONS = [
  "PRIVE OU AFFAIRES",
  "VEHICULES COMMERC. JUSQU'A 3.5 T (U1)",
  "ENGINS DE CHANTIER",
  "AMBULANCES/POMPIERS/POMPES",
  "TRANSPORT DE PERSONNEL (utilitaires)",
  "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
  "TRAC. à ROUES SANS LOCAT. AVEC REMORQUE",
  "REMORQUES AGRICOLES PLUS DE 3.5 T",
  "MOTOCYCLES DE 50 à 125 CM3",
  "CYCLES SUPERIEURS à 125 CM3",
];

// Correspondance des libellés envoyés par l'établissement → usage standard.
// Doit rester un miroir EXACT de server/src/services/usageMapping.js (source de vérité côté serveur).
const USAGE_MATCHING = {
  MOTO: "MOTOCYCLES DE 50 à 125 CM3",
  CAMION: "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
  TRAC: "TRAC. à ROUES SANS LOCAT. AVEC REMORQUE",
  "T.TERR": "PRIVE OU AFFAIRES",
  "T TERR": "PRIVE OU AFFAIRES",
  "V P": "PRIVE OU AFFAIRES",
  CTTE: "VEHICULES COMMERC. JUSQU'A 3.5 T (U1)",
  CHARIOT: "ENGINS DE CHANTIER",
  "MINI-BUS": "TRANSPORT DE PERSONNEL (utilitaires)",
  "MIC-BUS": "TRANSPORT DE PERSONNEL (utilitaires)",
  AMB: "AMBULANCES/POMPIERS/POMPES",
  CELLUL: "TRANSPORT DE PERSONNEL (utilitaires)",
  REMORQUE: "REMORQUES AGRICOLES PLUS DE 3.5 T",
  DEMPER: "PRIVE OU AFFAIRES",
  DUMPER: "PRIVE OU AFFAIRES",
  BUS: "TRANSPORT DE PERSONNEL (utilitaires)",
  "TETE CAMION": "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
  REMORQ: "REMORQUES AGRICOLES PLUS DE 3.5 T",
  "SEM-REM": "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
  CITERNE: "REMORQUES AGRICOLES PLUS DE 3.5 T",
  "MINI BUS": "TRANSPORT DE PERSONNEL (utilitaires)",
  "ANTI-EMUTE": "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
  TRAX: "ENGINS DE CHANTIER",
  CHARG: "ENGINS DE CHANTIER",
  CARG: "ENGINS DE CHANTIER",
  SCANER: "VEHICULES COMMERC. JUSQU'A 3.5 T (U1)",
  "T TROUP": "TRANSPORT DE PERSONNEL (utilitaires)",
  REMOR: "REMORQUES AGRICOLES PLUS DE 3.5 T",
  "MIN-BUS": "TRANSPORT DE PERSONNEL (utilitaires)",
  RQ: "REMORQUES AGRICOLES PLUS DE 3.5 T",
  "MICRO- BUS": "TRANSPORT DE PERSONNEL (utilitaires)",
  REMOQUE: "REMORQUES AGRICOLES PLUS DE 3.5 T",
  "MICRO-BUS": "TRANSPORT DE PERSONNEL (utilitaires)",
  MINIBUS: "TRANSPORT DE PERSONNEL (utilitaires)",
  CHARIO: "ENGINS DE CHANTIER",
  "MICRO BUS": "TRANSPORT DE PERSONNEL (utilitaires)",
  "VEHICULES COMMERCIAUX PLUS DE 3.5 T (U2)": "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
};

// Retourne l'usage standard correspondant au libellé saisi, sinon null.
export function matchUsageClient(usage = "") {
  if (!usage) return null;
  const key = String(usage).trim().toUpperCase();
  return USAGE_MATCHING[key] ?? null;
}

// Normalise un usage saisi (hors standard) vers l'usage standard correspondant.
export function normalizeUsage(usage = "") {
  return matchUsageClient(usage) || String(usage).trim();
}

export const USAGE_TAG = (usage = "") => {
  const u = usage.toLowerCase();
  if (u.includes("moto") || u.includes("cycle")) return { bg: "#EAF1FB", fg: "#2B6CB0" };
  if (u.includes("ambulance") || u.includes("pompier")) return { bg: "#FBE7E7", fg: "#B3261E" };
  if (u.includes("engin") || u.includes("chantier")) return { bg: "#FDF1DE", fg: "#A15C00" };
  if (u.includes("remorqu")) return { bg: "#EDE7F6", fg: "#6A1B9A" };
  if (u.includes("prive") || u.includes("affaire")) return { bg: "#E7F5EC", fg: "#1E7B3A" };
  if (u.includes("transport") || u.includes("utilitaire")) return { bg: "#E0F2FE", fg: "#0369A1" };
  if (u.includes("commerc")) return { bg: "#FFF3E0", fg: "#E65100" };
  return { bg: "#EEF2F7", fg: "#0B1F38" };
};
