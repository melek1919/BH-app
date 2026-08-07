import { describe, it, expect } from "vitest";
import { vehiculeSchema } from "../src/validators/vehicule.validator.js";
import { matchUsage } from "../src/services/usageMapping.js";

describe("validators/vehicule — règles métier enrichies", () => {
  const base = {
    contrat_id: 1,
    immatriculation: "123 TUN 1234",
    usage: "VEHICULES COMMERC. PLUS DE 3.5 T (U2)",
    type_vehicule: "Camion",
    nb_places: 3,
  };

  it("accepte un véhicule valide", () => {
    const { error } = vehiculeSchema.validate(base);
    expect(error).toBeUndefined();
  });

  it("une remorque ne peut pas avoir de puissance", () => {
    const { error } = vehiculeSchema.validate({
      ...base,
      usage: "REMORQUES AGRICOLES PLUS DE 3.5 T",
      type_vehicule: "Remorque",
      puissance: 120,
    });
    expect(error).toBeDefined();
    expect(error.message).toContain("remorque");
  });

  it("une moto ne peut pas avoir plus de 3 places", () => {
    const { error } = vehiculeSchema.validate({
      ...base,
      usage: "MOTOCYCLES DE 50 à 125 CM3",
      type_vehicule: "Moto",
      nb_places: 5,
    });
    expect(error).toBeDefined();
    expect(error.message).toContain("3 places");
  });

  it("une moto avec 3 places est acceptée", () => {
    const { error } = vehiculeSchema.validate({
      ...base,
      usage: "MOTOCYCLES DE 50 à 125 CM3",
      type_vehicule: "Moto",
      nb_places: 3,
    });
    expect(error).toBeUndefined();
  });
});

describe("services/usageMapping — matching d'usage établissement", () => {
  it("mappe les codes courts vers l'usage standard", () => {
    expect(matchUsage("MOTO")).toBe("MOTOCYCLES DE 50 à 125 CM3");
    expect(matchUsage("CAMION")).toBe("VEHICULES COMMERC. PLUS DE 3.5 T (U2)");
    expect(matchUsage("TRAC")).toBe("TRAC. à ROUES SANS LOCAT. AVEC REMORQUE");
    expect(matchUsage("CTTE")).toBe("VEHICULES COMMERC. JUSQU'A 3.5 T (U1)");
    expect(matchUsage("AMB")).toBe("AMBULANCES/POMPIERS/POMPES");
    expect(matchUsage("MINI-BUS")).toBe("TRANSPORT DE PERSONNEL (utilitaires)");
    expect(matchUsage("REMOQUE")).toBe("REMORQUES AGRICOLES PLUS DE 3.5 T");
  });

  it("est insensible à la casse (variantes)", () => {
    expect(matchUsage("sem-rem")).toBe("VEHICULES COMMERC. PLUS DE 3.5 T (U2)");
    expect(matchUsage("Chariot")).toBe("ENGINS DE CHANTIER");
  });

  it("gère la règle 'selon poids (PTAC)'", () => {
    expect(matchUsage("Selon poids (PTAC > 3,5 ==> U2 ; U1)", 2)).toBe("VEHICULES COMMERC. JUSQU'A 3.5 T (U1)");
    expect(matchUsage("Selon poids (PTAC > 3,5 ==> U2 ; U1)", 5)).toBe("VEHICULES COMMERC. PLUS DE 3.5 T (U2)");
  });

  it("retourne null pour un usage inconnu ou vide", () => {
    expect(matchUsage("qqq inconnu")).toBeNull();
    expect(matchUsage("")).toBeNull();
    expect(matchUsage(null)).toBeNull();
  });
});