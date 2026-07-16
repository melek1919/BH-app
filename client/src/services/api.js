// src/services/api.js
// Point d'entrée unique pour tous les appels au backend.
// Toute la logique fetch/URL vit ici — les pages ne font plus jamais
// de fetch("http://...") en dur, elles importent ces fonctions.

const API_BASE = "http://localhost:5000/api";
// Idéalement, bascule vers une variable d'env Vite une fois en prod :
// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Wrapper fetch générique : gère le JSON, les erreurs HTTP,
 * et normalise les messages d'erreur renvoyés par ton backend
 * (ex: { message: "identifiant_unique déjà utilisé" }).
 */
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  // 204 No Content (ex: DELETE) n'a pas de body à parser
  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.message || `Erreur ${res.status}`;
    const details = body?.details ? ` (${body.details.join(", ")})` : "";
    throw new Error(message + details);
  }

  return body;
}

// ---------------------------------------------------------------
// ETABLISSEMENTS
// Un établissement n'a plus de contrat directement — voir contratsApi.
// ---------------------------------------------------------------
export const etablissementsApi = {
  getAll: () => request("/etablissements"),
  getOne: (id) => request(`/etablissements/${id}`),
  create: (data) => request("/etablissements", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/etablissements/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  fusionner: (sourceId, cibleId) =>
    request("/etablissements/fusion", { method: "POST", body: JSON.stringify({ source_id: sourceId, cible_id: cibleId }) }),
  remove: (id) => request(`/etablissements/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------
// CONTRATS
// Un établissement peut avoir plusieurs contrats (1 → N).
// Pas de renouvellement manuel : les dates sont prolongées automatiquement
// en fin d'année côté backend (lazy update), le numero_police ne change jamais.
// ---------------------------------------------------------------
export const contratsApi = {
  getByEtablissement: (etablissementId) => request(`/etablissements/${etablissementId}/contrats`),
  getOne: (id) => request(`/contrats/${id}`),
  create: (etablissementId, data) =>
    request(`/etablissements/${etablissementId}/contrats`, { method: "POST", body: JSON.stringify(data) }),
  remove: (id) => request(`/contrats/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------
// VEHICULES
// Chaque véhicule est rattaché à un contrat précis (contrat_id),
// pas directement à un établissement.
// ---------------------------------------------------------------
export const vehiculesApi = {
  getAll: () => request("/vehicules"),
  getRetires: () => request("/vehicules/retires"),
  getOne: (id) => request(`/vehicules/${id}`),
  getByContrat: (contratId) => request(`/vehicules/contrat/${contratId}`),
  create: (data) => request("/vehicules", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/vehicules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  retirer: (id) => request(`/vehicules/${id}/retirer`, { method: "PUT" }),
  restaurer: (id) => request(`/vehicules/${id}/restaurer`, { method: "PUT" }),
};  