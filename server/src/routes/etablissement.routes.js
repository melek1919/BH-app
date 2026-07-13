import express from 'express';
import controller from '../controllers/etablissement.controller.js';

const router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.put('/:id/contrat', controller.affecterContrat);
router.post('/fusion', controller.fusion);
router.delete('/:id', controller.remove);

export default router;