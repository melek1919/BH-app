import Joi from 'joi';

const vehiculeSchema = Joi.object({
    contrat_id: Joi.number().integer().positive().required(),
    immatriculation: Joi.string().max(150).trim().allow('', null),
    usage: Joi.string().max(150).trim().allow('', null),
    type_vehicule: Joi.string().max(150).trim().allow('', null),
    numero_serie: Joi.string().max(150).trim().allow('', null),
    bonus_malus: Joi.string().max(20).trim().allow('', null),
    marque: Joi.string().max(100).trim().allow('', null),
    puissance: Joi.number().precision(2).positive().allow(null),
    pvid: Joi.number().precision(2).positive().allow(null),
    ptac: Joi.number().precision(2).positive().allow(null),
    nb_places_assises: Joi.number().integer().positive().allow(null),
    dmc: Joi.date().allow(null),
});

const retraitSchema = Joi.object({
    motif_retrait: Joi.string().max(255).trim().allow('', null),
});

export { vehiculeSchema, retraitSchema };