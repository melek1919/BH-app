// Validations enrichies du formulaire véhicule, partagées entre
// VehiculesPage et ContratPage (mêmes règles d'affichage / saisie).

const USAGE_LOURD = "VEHICULES COMMERC. PLUS DE 3.5 T (U2)";
const USAGE_REMORQUE_AGRICOLE = "REMORQUES AGRICOLES PLUS DE 3.5 T";

const isRemorque = (usage = "", type = "") =>
  `${usage} ${type}`.toLowerCase().includes("remorq");

const isMoto = (usage = "", type = "") => {
  const u = `${usage} ${type}`.toLowerCase();
  return u.includes("moto") || u.includes("cycle");
};

export function validateVehiculeForm(form) {
  const errors = {};
  const usage = (form.usage || "").trim();
  const type = form.type_vehicule || "";

  // --- Champs obligatoires / formats basiques ---
  if (!form.immatriculation?.trim()) errors.immatriculation = "Champ requis";

  if (!form.nb_places && form.nb_places !== 0) {
    errors.nb_places = "Champ requis";
  } else if (!/^[0-9]+$/.test(String(form.nb_places))) {
    errors.nb_places = "Doit être un nombre";
  }

  if (form.puissance && !/^[0-9]+$/.test(String(form.puissance))) {
    errors.puissance = "Doit être un nombre";
  }

  if (!usage) errors.usage = "Champ requis";

  // --- Contraintes métier selon l'usage / le type ---
  const ptacRequired = usage === USAGE_LOURD || usage === USAGE_REMORQUE_AGRICOLE;
  if (ptacRequired && !form.ptac) {
    errors.ptac = "PTAC requis pour cet usage";
  }

  if (isRemorque(usage, type)) {
    if (form.puissance) errors.puissance = "Une remorque ne peut pas avoir de puissance";
  }

  if (isMoto(usage, type)) {
    const places = Number(form.nb_places);
    if (form.nb_places && places > 3) {
      errors.nb_places = "Une moto ne peut pas avoir plus de 3 places";
    }
  }

  return errors;
}