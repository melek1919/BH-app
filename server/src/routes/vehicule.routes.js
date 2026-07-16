import express from "express";
const router = express.Router();
import controller from "../controllers/vehicule.controller.js";

router.get("/", controller.getAll);
router.get("/retire", controller.getRetires);
router.get('/etablissement/:etablissementId', controller.getByEtablissement);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.put("/:id/retirer", controller.retirer);
router.put("/:id/restaurer", controller.restaurer);

export default router;