import model from '../models/utilisateur.model.js';
import { createUtilisateurSchema, updateUtilisateurSchema, changePasswordSchema } from '../validators/utilisateur.validator.js';

const getAll = async (req, res, next) => {
    try { res.json(await model.findAll()); }
    catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
    try {
        const utilisateur = await model.findById(req.params.id);
        if (!utilisateur) return res.status(404).json({ message: 'utilisateur introuvable' });
        res.json(utilisateur);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    const { error, value } = createUtilisateurSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    try {
        const created = await model.create(value);
        res.status(201).json(created);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        next(err);
    }
};

const update = async (req, res, next) => {
    const { error, value } = updateUtilisateurSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }
    try {
        const updated = await model.update(req.params.id, value);
        if (!updated) return res.status(404).json({ message: 'utilisateur introuvable' });
        res.json(updated);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        next(err);
    }
};

// Changement de mot de passe : un utilisateur ne peut changer que le sien.
// Un admin peut le faire pour n'importe qui (voir routes.js).
const changePassword = async (req, res, next) => {
    const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }

    const targetId = req.params.id;
    const isSelf = String(req.user.id) === String(targetId);
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) {
        return res.status(403).json({ message: 'Vous ne pouvez modifier que votre propre mot de passe' });
    }

    try {
        // Un admin qui réinitialise le mot de passe d'un autre agent n'a pas
        // besoin de connaître l'ancien mot de passe.
        if (isSelf) {
            const utilisateurAvecHash = await model.findByEmailWithHash(req.user.email);
            const valide = await model.verifyPassword(value.ancien_mot_de_passe, utilisateurAvecHash.mot_de_passe_hash);
            if (!valide) return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
        }

        const updated = await model.updatePassword(targetId, value.nouveau_mot_de_passe);
        if (!updated) return res.status(404).json({ message: 'utilisateur introuvable' });
        res.json({ message: 'Mot de passe mis à jour' });
    } catch (err) { next(err); }
};

const desactiver = async (req, res, next) => {
    try {
        const updated = await model.setActif(req.params.id, false);
        if (!updated) return res.status(404).json({ message: 'utilisateur introuvable' });
        res.json(updated);
    } catch (err) { next(err); }
};

const activer = async (req, res, next) => {
    try {
        const updated = await model.setActif(req.params.id, true);
        if (!updated) return res.status(404).json({ message: 'utilisateur introuvable' });
        res.json(updated);
    } catch (err) { next(err); }
};

export default { getAll, getOne, create, update, changePassword, desactiver, activer };
