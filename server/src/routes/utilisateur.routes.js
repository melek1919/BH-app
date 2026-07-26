import express from 'express';
import controller from '../controllers/utilisateur.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('utilisateurs'), controller.getAll);
router.get('/:id', authorize('utilisateurs'), controller.getOne);
router.post('/', authorize('utilisateurs'), controller.create);
router.put('/:id', authorize('utilisateurs'), controller.update);
router.put('/:id/desactiver', authorize('utilisateurs'), controller.desactiver);
router.put('/:id/activer', authorize('utilisateurs'), controller.activer);

// Pas de authorize('utilisateurs') ici : un agent doit pouvoir changer son
// propre mot de passe. Le contrôleur vérifie lui-même self-service vs admin.
router.put('/:id/password', controller.changePassword);

export default router;
