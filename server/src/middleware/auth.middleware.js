import jwt from 'jsonwebtoken';
import { PERMISSIONS } from '../config/roles.js';

// Vérifie le token JWT envoyé dans le header "Authorization: Bearer <token>"
// et attache l'utilisateur décodé à req.user.
const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    const token = header.slice(7);
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { id, nom, prenom, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};

// Autorise l'accès uniquement si req.user.role fait partie des rôles autorisés
// pour la ressource donnée (voir config/roles.js).
// Usage : router.post('/', authenticate, authorize('etablissements'), controller.create);
const authorize = (resource) => (req, res, next) => {
    const allowedRoles = PERMISSIONS[resource];
    if (!allowedRoles) {
        return res.status(500).json({ message: `Ressource inconnue pour l'autorisation: ${resource}` });
    }
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Vous n'avez pas les droits pour effectuer cette action" });
    }
    next();
};

export { authenticate, authorize };
