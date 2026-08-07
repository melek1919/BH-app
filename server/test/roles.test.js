import { describe, it, expect } from "vitest";
import { ROLES, ALL_ROLES, PERMISSIONS } from "../src/config/roles.js";

describe("config/roles", () => {
  it("définit tous les rôles attendus", () => {
    expect(ROLES).toEqual({
      GUEST: "guest",
      ADMIN: "admin",
      GESTION_ETABLISSEMENT: "gestion_etablissement",
      GESTION_VEHICULE: "gestion_vehicule",
      GESTION_GLOBALE: "gestion_globale",
    });
  });

  it("ALL_ROLES contient exactement 5 rôles, sans doublon", () => {
    const dedup = new Set(ALL_ROLES);
    expect(ALL_ROLES).toHaveLength(5);
    expect(dedup.size).toBe(5);
  });

  it("chaque rôle a un authoriseur associé (écriture)", () => {
    expect(PERMISSIONS.utilisateurs).toBeDefined();
    expect(PERMISSIONS.etablissements).toBeDefined();
    expect(PERMISSIONS.vehicules).toBeDefined();
    expect(PERMISSIONS.contrats).toBeDefined();
    expect(PERMISSIONS.injections).toBeDefined();
  });

  it("seul l'admin peut gérer les utilisateurs", () => {
    expect(PERMISSIONS.utilisateurs).toEqual([ROLES.ADMIN]);
  });

  it("gestion_globale a accès en écriture à toutes les ressources métier (sauf utilisateurs)", () => {
    for (const resource of ["etablissements", "vehicules", "contrats", "injections"]) {
      expect(PERMISSIONS[resource]).toContain(ROLES.GESTION_GLOBALE);
    }
    expect(PERMISSIONS.utilisateurs).not.toContain(ROLES.GESTION_GLOBALE);
  });

  it("chaque ressource n'autorise que des rôles existants", () => {
    for (const roles of Object.values(PERMISSIONS)) {
      for (const role of roles) {
        expect(ALL_ROLES).toContain(role);
      }
    }
  });

  it("le guest n'a aucun droit d'écriture", () => {
    for (const roles of Object.values(PERMISSIONS)) {
      expect(roles).not.toContain(ROLES.GUEST);
    }
  });
});