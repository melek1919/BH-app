import express from 'express';
import controller from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/me', authenticate, controller.me);

export default router;
