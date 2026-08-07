import Joi from 'joi';

const isRemorque = (usage = '', type = '') => `${usage || ''} ${type || ''}`.toLowerCase().includes('remorq');
const isMoto = (usage = '', type = '') => {
    const u = `${usage || ''} ${type || ''}`.toLowerCase();
    return u.includes('moto') || u.includes('cycle');
};

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
    nb_places: Joi.number().integer().min(0).allow(null),
    dmc: Joi.date().allow(null),
}).custom((value, helpers) => {
    if (isRemorque(value.usage, value.type_vehicule) && value.puissance != null) {
        return helpers.message('Une remorque ne peut pas avoir de puissance');
    }
    if (isMoto(value.usage, value.type_vehicule) && value.nb_places != null && value.nb_places > 3) {
        return helpers.message('Une moto ne peut pas avoir plus de 3 places');
    }
    return value;
});

const retraitSchema = Joi.object({
    motif_retrait: Joi.string().max(255).trim().allow('', null),
});

export { vehiculeSchema, retraitSchema };