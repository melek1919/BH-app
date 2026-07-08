import express from "express";
import cors from "cors";
import etablissementRoutes from "./routes/etablissement.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/etablissements', etablissementRoutes);

app.get("/", (req, res) => {
    res.json({ message: "BH Assurance API running" });
});

export default app;