import express from 'express';
import controller from '../controllers/etablissement.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Lecture ouverte à tout utilisateur connecté
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);

// Écriture réservée aux rôles autorisés (voir config/roles.js)
router.post('/', authorize('etablissements'), controller.create);
router.put('/:id', authorize('etablissements'), controller.update);
router.post('/fusion', authorize('etablissements'), controller.fusion);
router.delete('/:id', authorize('etablissements'), controller.remove);

export default router;
