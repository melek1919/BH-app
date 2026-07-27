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
