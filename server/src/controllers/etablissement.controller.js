import model from "../models/etablissement.model.js";
import { etablissementSchema, contratSchema, fusionSchema } from "../validators/etablissement.validator.js";

const getAll = async (req, res, next) => {
    try {
        res.json(await model.findAll());
    } catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
    try {
        const etablissement = await model.findById(req.params.id);
        if (!etablissement) return res.status(404).json({ message: 'etablissement introuvable' });
        res.json(etablissement);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    const { error, value } = etablissementSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    try {
        const created = await model.create(value);
        res.status(201).json(created);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'identifiant_unique déjà utilisé' });
        next(err);
    }
};

const update = async (req, res, next) => {
    const { error, value } = etablissementSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    try {
        const updated = await model.update(req.params.id, value);
        if (!updated) return res.status(404).json({ message: 'etablissement introuvable' });
        res.json(updated);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'identifiant_unique déjà utilisé' });
        next(err);
    }
};

// Affecter / modifier le numéro de contrat
const affecterContrat = async (req, res, next) => {
    const { error, value } = contratSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    try {
        const updated = await model.affecterContrat(req.params.id, value);
        if (!updated) return res.status(404).json({ message: 'etablissement introuvable' });
        res.json(updated);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Ce numéro de police est déjà utilisé' });
        next(err);
    }
};

// Fusion de deux établissements
const fusion = async (req, res, next) => {
    const { error, value } = fusionSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    if (value.source_id === value.cible_id) {
        return res.status(400).json({ message: 'Impossible de fusionner un établissement avec lui-même' });
    }

    try {
        const [source, cible] = await Promise.all([
            model.findById(value.source_id),
            model.findById(value.cible_id),
        ]);
        if (!source || !cible) {
            return res.status(404).json({ message: 'Établissement source ou cible introuvable' });
        }

        const supprime = await model.fusionner(value.source_id, value.cible_id);
        res.json({ message: `"${source.nom}" fusionné dans "${cible.nom}"`, supprime });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const deleted = await model.remove(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'etablissement introuvable' });
        res.status(204).send();
    } catch (err) {
        if (err.code === '23503') {
            return res.status(409).json({ message: "Impossible de supprimer, des véhicules sont liés à cet établissement" });
        }
        next(err);
    }
};

export default { getAll, getOne, create, update, affecterContrat, fusion, remove };