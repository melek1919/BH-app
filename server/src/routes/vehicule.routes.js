import express from "express";
const router = express.Router();
import controller from "../controllers/vehicule.controller.js";

router.get("/", controller.getAll);
router.get("/retire", controller.getRetires);
router.get("/contrat/:contratId", controller.getByContrat);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.put("/retirer/:id", controller.retirer);
router.put("/restaurer/:id", controller.restaurer);

export default router;