import express from 'express';
const router = express.Router();
import controller from '../controllers/etablissement.controller.js';

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
