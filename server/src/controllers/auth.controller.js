import jwt from 'jsonwebtoken';
import model from '../models/utilisateur.model.js';
import { loginSchema } from '../validators/utilisateur.validator.js';

const login = async (req, res, next) => {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: 'données invalides', details: error.details.map((d) => d.message) });
    }

    try {
        const utilisateur = await model.findByEmailWithHash(value.email);
        // Message volontairement identique dans les deux cas (email inconnu / mot de passe faux)
        // pour ne pas révéler si un email existe dans la base.
        if (!utilisateur) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
        if (!utilisateur.actif) {
            return res.status(403).json({ message: 'Ce compte a été désactivé' });
        }

        const motDePasseValide = await model.verifyPassword(value.mot_de_passe, utilisateur.mot_de_passe_hash);
        if (!motDePasseValide) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const payload = {
            id: utilisateur.id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        });

        res.json({ token, utilisateur: payload });
    } catch (err) { next(err); }
};

// Retourne l'utilisateur courant à partir du token — utile au frontend au
// chargement de l'app pour savoir qui est connecté et quel rôle il a.
const me = (req, res) => {
    res.json(req.user);
};

export default { login, me };
