import Joi from 'joi';
import { ALL_ROLES } from '../config/roles.js';

const createUtilisateurSchema = Joi.object({
    nom: Joi.string().max(255).trim().required(),
    prenom: Joi.string().max(100).trim().allow('', null),
    email: Joi.string().email().trim().required(),
    tel: Joi.string().max(20).trim().allow('', null),
    mot_de_passe: Joi.string().min(8).max(72).required(),
    role: Joi.string().valid(...ALL_ROLES).required(),
});

// Pas de mot de passe ici : changement de mot de passe séparé (route dédiée)
const updateUtilisateurSchema = Joi.object({
    nom: Joi.string().max(255).trim().required(),
    prenom: Joi.string().max(100).trim().allow('', null),
    email: Joi.string().email().trim().required(),
    tel: Joi.string().max(20).trim().allow('', null),
    role: Joi.string().valid(...ALL_ROLES).required(),
});

const changePasswordSchema = Joi.object({
    ancien_mot_de_passe: Joi.string().required(),
    nouveau_mot_de_passe: Joi.string().min(8).max(72).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().trim().required(),
    mot_de_passe: Joi.string().required(),
});

export { createUtilisateurSchema, updateUtilisateurSchema, changePasswordSchema, loginSchema };
