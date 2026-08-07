import dotenv from "dotenv";
import app from "./app.js";
import contratModel from "./models/contrat.model.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Renouvellement annuel des contrats expirés : prolonge leur validité à
// l'année civile en cours (01/01 → 31/12) sans changer le numero_police.
const renouvelerContrats = async () => {
  try {
    const renouveles = await contratModel.renouvelerContratsExpires();
    if (renouveles.length) {
      console.log(`[renouvellement] ${renouveles.length} contrat(s) prolongé(s) vers l'année en cours`);
    }
  } catch (err) {
    console.error("[renouvellement] erreur:", err.message);
  }
};

// Au démarrage puis une fois par jour, pour être sûrs de basculer dès le
// premier jour de la nouvelle année.
renouvelerContrats();
setInterval(renouvelerContrats, 24 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});