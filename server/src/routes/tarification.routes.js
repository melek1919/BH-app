import express from "express";
const router = express.Router();
import controller from "../controllers/tarification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

router.use(authenticate);

router.post("/vehicule", controller.calculerVehicule);
router.post("/contrat", controller.calculerContrat);
router.get("/contrat/:id", controller.calculerContratById);
router.get("/contrat/:id/export", controller.exporterContrat);
router.get("/top", controller.getTop);

export default router;