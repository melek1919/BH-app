import model from '../models/vehicule.model.js';
import { vehiculeSchema, retraitSchema } from '../validators/vehicule.validator.js';

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

const getByEtablissement = async (req, res, next) => {
    try { res.json(await model.findByEtablissement(req.params.etablissementId)); }
    catch (err) { next(err); }
};

const create = async (req, res, next) => {
    const { error, value } = vehiculeSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    try {
        const created = await model.create(value);
        res.status(201).json(created);
    } catch (err) {
        if (err.code === '23503') return res.status(400).json({ message: 'Établissement inexistant' });
        next(err);
    }
};

const update = async (req, res, next) => {
    const { error, value } = vehiculeSchema.validate(req.body, { abortEarly: false }); // <-- corrigé
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    try {
        const updated = await model.update(req.params.id, value);
        if (!updated) return res.status(404).json({ message: 'vehicule introuvable' }); // <-- return ajouté
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

export default { getAll, getOne, getRetires, getByEtablissement, create, update, retirer, restaurer };