import express from "express";
const router = express.Router();
import controller from "../controllers/vehicule.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

router.use(authenticate);

// Lecture ouverte à tout utilisateur connecté
router.get("/", controller.getAll);
router.get("/retires", controller.getRetires);
router.get("/contrat/:contratId", controller.getByContrat);
router.get("/:id", controller.getOne);

// Écriture réservée aux rôles autorisés (voir config/roles.js)
router.post("/", authorize("vehicules"), controller.create);
router.put("/:id", authorize("vehicules"), controller.update);
router.put("/:id/retirer", authorize("vehicules"), controller.retirer);
router.put("/:id/restaurer", authorize("vehicules"), controller.restaurer);

export default router;
