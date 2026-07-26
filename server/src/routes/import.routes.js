import express from "express";
import multer from "multer";
import controller from "../controllers/import.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Fichier gardé en mémoire (buffer), jamais écrit sur disque — pas de dossier
// temporaire à nettoyer. Limite 20 Mo, largement suffisant pour un xlsx de ce type.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
});

router.use(authenticate);

router.post("/vehicules/dry-run", authorize("vehicules"), upload.single("fichier"), controller.dryRunVehicules);
router.post("/vehicules/commit", authorize("vehicules"), upload.single("fichier"), controller.commitVehicules);
router.post("/etablissements/dry-run", authorize("etablissements"), upload.single("fichier"), controller.dryRunEtablissements);
router.post("/etablissements/commit", authorize("etablissements"), upload.single("fichier"), controller.commitEtablissements);

export default router;
