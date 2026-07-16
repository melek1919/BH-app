import Joi from 'joi';

// Plus de libelle, plus de saisie manuelle de dates — juste le numéro de police.
// Les dates sont calculées automatiquement (année en cours, 01/01 → 31/12).
const contratSchema = Joi.object({
    numero_police: Joi.string().max(50).trim().required(),
});

export { contratSchema };