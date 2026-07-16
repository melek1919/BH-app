import model from '../models/contrat.model.js';
import etablissementModel from '../models/etablissement.model.js';
import { contratSchema } from '../validators/contrat.validator.js';

const getByEtablissement = async (req, res, next) => {
    try {
        res.json(await model.findByEtablissement(req.params.etablissementId));
    } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
    try {
        const contrat = await model.findById(req.params.id);
        if (!contrat) return res.status(404).json({ message: 'Contrat introuvable' });
        res.json(contrat);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    const { error, value } = contratSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const etab = await etablissementModel.findById(req.params.etablissementId);
        if (!etab) return res.status(404).json({ message: 'Établissement introuvable' });

        const created = await model.create(req.params.etablissementId, value);
        res.status(201).json(created);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Ce numéro de police est déjà utilisé' });
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const deleted = await model.remove(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Contrat introuvable' });
        res.status(204).send();
    } catch (err) {
        if (err.code === '23503') {
            return res.status(409).json({ message: 'Impossible de supprimer : des véhicules sont liés à ce contrat' });
        }
        next(err);
    }
};

export default { getByEtablissement, getOne, create, remove };