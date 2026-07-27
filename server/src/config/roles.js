// Rôles disponibles pour un utilisateur (agent BH Assurances)
export const ROLES = {
    GUEST: 'guest',                              // Lecture seule — aucune opération d'écriture
    ADMIN: 'admin',                              // Tout, y compris la gestion des utilisateurs
    GESTION_ETABLISSEMENT: 'gestion_etablissement', // Établissements uniquement
    GESTION_VEHICULE: 'gestion_vehicule',           // Véhicules uniquement
    GESTION_GLOBALE: 'gestion_globale',             // Véhicules + établissements + contrats + injections
};

export const ALL_ROLES = Object.values(ROLES);

// Qui a le droit d'écrire (créer/modifier/supprimer) sur chaque ressource.
// La lecture (GET) reste ouverte à tout utilisateur authentifié, quel que soit son rôle.
export const PERMISSIONS = {
    etablissements: [ROLES.ADMIN, ROLES.GESTION_ETABLISSEMENT, ROLES.GESTION_GLOBALE],
    vehicules: [ROLES.ADMIN, ROLES.GESTION_VEHICULE, ROLES.GESTION_GLOBALE],
    contrats: [ROLES.ADMIN, ROLES.GESTION_GLOBALE],
    injections: [ROLES.ADMIN, ROLES.GESTION_GLOBALE],
    utilisateurs: [ROLES.ADMIN],
};
