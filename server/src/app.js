import express from "express";
import cors from "cors";
import etablissementRoutes from "./routes/etablissement.routes.js";
import vehiculeRoutes from "./routes/vehicule.routes.js";
import contratRoutes from './routes/contrat.routes.js';
import importRoutes from './routes/import.routes.js';
import contratInjectionRoutes from './routes/Contratinjection.routes.js';
import authRoutes from './routes/auth.routes.js';
import utilisateurRoutes from './routes/utilisateur.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Public : uniquement le login
app.use('/api/auth', authRoutes);

// Protégées (authentification + rôles gérés dans chaque fichier de routes)
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
