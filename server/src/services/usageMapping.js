// Correspondance entre les libellés "usage" envoyés par l'établissement dans
// ses fichiers Excel et les usages standard de l'application (voir usageConfig
// côté front / USAGES dans tarification.service).
//
// Le texte à gauche (clé) = ce que l'établissement envoie réellement
// (codes courts, fautes de frappe, variantes). À droite = l'usage standard
// qui doit être stocké pour être correctement pris en compte par la tarification.

export const USAGE_POIDS = "Selon poids (PTAC > 3,5 ==> U2 ; U1)";

const USAGE_STANDARD = {
  PRIVE: "PRIVE OU AFFAIRES",
  U1: "VEHICULES COMMERC. JUSQU'A 3.5 T (U1)",
  U2: "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
  CHANTIER: "ENGINS DE CHANTIER",
  AMBULANCE: "AMBULANCES/POMPIERS/POMPES",
  TRANSPORT: "TRANSPORT DE PERSONNEL (utilitaires)",
  TRAC: "TRAC. à ROUES SANS LOCAT. AVEC REMORQUE",
  AGRICOLE: "REMORQUES AGRICOLES PLUS DE 3.5 T",
  MOTO125: "MOTOCYCLES DE 50 à 125 CM3",
  CYCLE: "CYCLES SUPERIEURS à 125 CM3",
};

// Libellés tels qu'envoyés par l'établissement → usage standard.
const USAGE_MATCHING = {
  "MOTO": USAGE_STANDARD.MOTO125,
  "CAMION": USAGE_STANDARD.U2,
  "TRAC": USAGE_STANDARD.TRAC,
  "T.TERR": USAGE_STANDARD.PRIVE,
  "T TERR": USAGE_STANDARD.PRIVE,
  "V P": USAGE_STANDARD.PRIVE,
  "CTTE": USAGE_STANDARD.U1,
  "CHARIOT": USAGE_STANDARD.CHANTIER,
  "MINI-BUS": USAGE_STANDARD.TRANSPORT,
  "MIC-BUS": USAGE_STANDARD.TRANSPORT,
  "AMB": USAGE_STANDARD.AMBULANCE,
  "CELLUL": USAGE_STANDARD.TRANSPORT,
  "REMORQUE": USAGE_STANDARD.AGRICOLE,
  "DEMPER": USAGE_STANDARD.PRIVE,
  "DUMPER": USAGE_STANDARD.PRIVE,
  "BUS": USAGE_STANDARD.TRANSPORT,
  "TETE CAMION": USAGE_STANDARD.U2,
  "REMORQ": USAGE_STANDARD.AGRICOLE,
  "SEM-REM": USAGE_STANDARD.U2,
  "CITERNE": USAGE_STANDARD.AGRICOLE,
  "MINI BUS": USAGE_STANDARD.TRANSPORT,
  "ANTI-EMUTE": USAGE_STANDARD.U2,
  "TRAX": USAGE_STANDARD.CHANTIER,
  "CHARG": USAGE_STANDARD.CHANTIER,
  "CARG": USAGE_STANDARD.CHANTIER,
  "SCANER": USAGE_STANDARD.U1,
  "T TROUP": USAGE_STANDARD.TRANSPORT,
  "REMOR": USAGE_STANDARD.AGRICOLE,
  "MIN-BUS": USAGE_STANDARD.TRANSPORT,
  "RQ": USAGE_STANDARD.AGRICOLE,
  "MICRO- BUS": USAGE_STANDARD.TRANSPORT,
  "REMOQUE": USAGE_STANDARD.AGRICOLE,
  "MICRO-BUS": USAGE_STANDARD.TRANSPORT,
  "MINIBUS": USAGE_STANDARD.TRANSPORT,
  "CHARIO": USAGE_STANDARD.CHANTIER,
  "MICRO BUS": USAGE_STANDARD.TRANSPORT,
  "VEHICULES COMMERCIAUX PLUS DE 3.5 T (U2)": USAGE_STANDARD.U2,
};

const normalizeKey = (s = "") => String(s).trim().toUpperCase();

/**
 * Retourne l'usage standard correspondant au libellé envoyé par
 * l'établissement, ou `null` s'il n'y a pas de correspondance.
 * Le cas particulier "Selon poids (... PTAC ...)" dépend de la valeur de
 * PTAC : > 3.5 → U2, sinon U1. Si PTAC est absent, U1 est retenu.
 */
export function matchUsage(usage, ptac) {
  if (!usage) return null;
  const key = normalizeKey(usage);

  if (key === normalizeKey(USAGE_POIDS)) {
    const p = Number(ptac);
    return !Number.isNaN(p) && p > 3.5 ? USAGE_STANDARD.U2 : USAGE_STANDARD.U1;
  }

  return USAGE_MATCHING[key] ?? null;
}