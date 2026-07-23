import Joi from 'joi';

const etablissementSchema = Joi.object({
    nom: Joi.string().max(255).trim().required(),
    adresse: Joi.string().max(255).trim().allow('', null),
    gouvernorat: Joi.string().max(100).trim().allow('', null),
    identifiant_unique: Joi.string().max(50).trim().required(),
    telephone: Joi.string().max(20).trim().allow('', null),
    responsable_parc_auto: Joi.string().max(255).trim().allow('', null),
    mobile: Joi.string().max(20).trim().allow('', null),
    email: Joi.string().email().trim().allow('', null),
    code_fiabilisation: Joi.string().valid('A', 'B', 'C', 'D', 'M').allow(null),
    statut_gias_prod: Joi.string().max(100).trim().allow('', null),
});



const fusionSchema = Joi.object({
    source_id: Joi.number().integer().positive().required(),
    cible_id: Joi.number().integer().positive().required(),
});

export { etablissementSchema, fusionSchema };