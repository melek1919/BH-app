import model from '../models/vehicule.model.js';
import { vehiculeSchema, retraitSchema } from '../validators/vehicule.validator.js';
import { matchUsage } from '../services/usageMapping.js';

// Normalise l'usage : tout libellé envoyé par l'établissement qui n'est pas un
// usage standard est remplacé par l'usage standard correspondant (ex. DUMPER → PRIVE OU AFFAIRES).
const normalizeUsage = (data) => {
    if (data && data.usage) data.usage = matchUsage(data.usage, data.ptac) || data.usage;
    return data;
};

const getAll = async (req, res, next) => {
    try { res.json(await model.findAll()); }
    catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
    try {
        const vehicule = await model.findById(req.params.id);
        if (!vehicule) return res.status(404).json({ message: 'vehicule introuvable' });
        res.json(vehicule);
    } catch (err) { next(err); }
};

const getRetires = async (req, res, next) => {
    try { res.json(await model.findRetires()); }
    catch (err) { next(err); }
};

// ✅ remplace getByEtablissement : un véhicule est rattaché à un contrat,
// plus directement à un établissement.
const getByContrat = async (req, res, next) => {
    const contratId = Number(req.params.contratId);
    if (!Number.isInteger(contratId)) {
        return res.status(400).json({ message: 'Identifiant de contrat invalide' });
    }
    try {
        res.json(await model.findByContrat(contratId));
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    const { error, value } = vehiculeSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    normalizeUsage(value);
    try {
        const created = await model.create(value);
        res.status(201).json(created);
    } catch (err) {
        if (err.code === '23503') return res.status(400).json({ message: 'Contrat inexistant' });
        next(err);
    }
};

const update = async (req, res, next) => {
    const { error, value } = vehiculeSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    normalizeUsage(value);
    try {
        const updated = await model.update(req.params.id, value);
        if (!updated) return res.status(404).json({ message: 'vehicule introuvable' });
        res.json(updated);
    } catch (err) { next(err); }
};

const retirer = async (req, res, next) => {
    try {
        const retire = await model.retirer(req.params.id);
        if (!retire) return res.status(404).json({ message: 'vehicule introuvable ou déjà retiré' });
        res.json(retire);
    } catch (err) { next(err); }
};

const restaurer = async (req, res, next) => {
    try {
        const restaure = await model.restaurer(req.params.id);
        if (!restaure) return res.status(404).json({ message: 'vehicule introuvable ou déjà actif' });
        res.json(restaure);
    } catch (err) { next(err); }
};

export default { getAll, getOne, getRetires, getByContrat, create, update, retirer, restaurer };