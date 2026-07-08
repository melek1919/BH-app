import model from "../models/etablissement.model.js";
import { etablissementSchema } from "../validators/etablissement.validator.js";

const getAll = async (req, res, next) => {
    try {
        const etablissements = await model.findAll();
        res.json(etablissements);
    } catch (error) {
        next(error);
    }
};

const getOne = async (req, res, next) => {
    try {
        const etablissement = await model.findById(req.params.id);
        if (!etablissement) {
            return res.status(404).json({ message: 'etablissement introuvable' });
        }
        res.json(etablissement); // <-- manquait
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    const { error, value } = etablissementSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            message: 'données invalides',
            details: error.details.map((d) => d.message),
        });
    }
    try {
        const created = await model.create(value);
        res.status(201).json(created);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'identifiant_unique déjà utilisé' });
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    const { error, value } = etablissementSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            message: 'données invalides',
            details: error.details.map((d) => d.message),
        });
    }
    try {
        const updated = await model.update(req.params.id, value);
        if (!updated) {
            return res.status(404).json({ message: 'etablissement introuvable' });
        }
        res.json(updated);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'identifiant_unique déjà utilisé' });
        }
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const deleted = await model.remove(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'etablissement introuvable' });
        }
        res.status(204).send();
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ message: "Impossible de supprimer l'etablissement car il est référencé par d'autres enregistrements" });
        }
        next(err);
    }
};

export default { getAll, getOne, create, update, remove };