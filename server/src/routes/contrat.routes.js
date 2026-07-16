import express from 'express';
import controller from '../controllers/contrat.controller.js';

const router = express.Router();

router.get('/etablissements/:etablissementId/contrats', controller.getByEtablissement);
router.post('/etablissements/:etablissementId/contrats', controller.create);
router.get('/contrats/:id', controller.getOne);
router.delete('/contrats/:id', controller.remove);

export default router;