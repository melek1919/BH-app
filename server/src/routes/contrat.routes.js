import express from 'express';
import controller from '../controllers/contrat.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/etablissements/:etablissementId/contrats', controller.getByEtablissement);
router.get('/contrats/:id', controller.getOne);

router.post('/etablissements/:etablissementId/contrats', authorize('contrats'), controller.create);
router.delete('/contrats/:id', authorize('contrats'), controller.remove);

export default router;
