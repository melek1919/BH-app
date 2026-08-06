import express from "express";
import cors from "cors";
import etablissementRoutes from "./routes/etablissement.routes.js";
import vehiculeRoutes from "./routes/vehicule.routes.js";
import contratRoutes from './routes/contrat.routes.js';
import importRoutes from './routes/import.routes.js';
import contratInjectionRoutes from './routes/Contratinjection.routes.js';
import authRoutes from './routes/auth.routes.js';
import tarificationRoutes from './routes/tarification.routes.js';
import utilisateurRoutes from './routes/utilisateur.routes.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost")
  .split(",").map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json());

// Public : healthcheck (avant les routes protégées pour rester accessible)
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// Public : uniquement le login
app.use('/api/auth', authRoutes);

// Protégées (authentification + rôles gérés dans chaque fichier de routes)
app.use('/api/tarification', tarificationRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/etablissements', etablissementRoutes);
app.use('/api/vehicules', vehiculeRoutes);
app.use('/api', contratRoutes);
app.use('/api/import', importRoutes);
app.use('/api/contrats-injection', contratInjectionRoutes);

app.get("/", (req, res) => {
    res.json({ message: "BH Assurance API running" });
});

export default app;
