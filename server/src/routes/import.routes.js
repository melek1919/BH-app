import express from "express";
import multer from "multer";
import controller from "../controllers/import.controller.js";

const router = express.Router();

// Fichier gardé en mémoire (buffer), jamais écrit sur disque — pas de dossier
// temporaire à nettoyer. Limite 20 Mo, largement suffisant pour un xlsx de ce type.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
});

router.post("/vehicules/dry-run", upload.single("fichier"), controller.dryRunVehicules);
router.post("/vehicules/commit", upload.single("fichier"), controller.commitVehicules);
router.post("/etablissements/dry-run", upload.single("fichier"), controller.dryRunEtablissements);
router.post("/etablissements/commit", upload.single("fichier"), controller.commitEtablissements);

export default router;