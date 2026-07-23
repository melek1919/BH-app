import express from "express";
const router = express.Router();
import controller from "../controllers/vehicule.controller.js";

router.get("/", controller.getAll);
router.get("/retires", controller.getRetires);
router.get("/contrat/:contratId", controller.getByContrat);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.put("/:id/retirer", controller.retirer);
router.put("/:id/restaurer", controller.restaurer);

export default router;