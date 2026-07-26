import express from "express";
import controller from "../controllers/Contratinjection.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/liste", controller.liste);
router.post("/injecter", authorize("injections"), controller.injecter);

export default router;
