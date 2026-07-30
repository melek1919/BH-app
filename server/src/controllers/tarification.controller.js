import { calcVehicule, calcContrat } from '../services/tarification.service.js';
import { buildContratWorkbook } from '../services/tarification.export.service.js';
import pool from '../config/database.js';

const calculerVehicule = async (req, res, next) => {
  try {
    const result = calcVehicule(req.body);
    res.json(result);
  } catch (err) { next(err); }
};

const calculerContrat = async (req, res, next) => {
  try {
    const { vehicules } = req.body;
    if (!Array.isArray(vehicules) || vehicules.length === 0) {
      return res.status(400).json({ message: 'La liste des véhicules est requise' });
    }
    const result = calcContrat(vehicules);
    res.json(result);
  } catch (err) { next(err); }
};

const calculerContratById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM vehicule WHERE contrat_id = $1 AND statut_retrait = 'actif'`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.json(calcContrat([]));
    }
    const result = calcContrat(rows);
    res.json(result);
  } catch (err) { next(err); }
};

// Génère et télécharge le fichier Excel de tarification pour un contrat
const exporterContrat = async (req, res, next) => {
  try {
    const { rows: vehicules } = await pool.query(
      `SELECT * FROM vehicule WHERE contrat_id = $1 AND statut_retrait = 'actif'`,
      [req.params.id]
    );
    if (vehicules.length === 0) {
      return res.status(400).json({ message: 'Aucun véhicule actif sur ce contrat — rien à exporter' });
    }

    const { rows: contratRows } = await pool.query(
      `SELECT c.*, e.nom AS etablissement_nom
       FROM contrat c
       JOIN etablissement e ON e.id = c.etablissement_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    const contrat = contratRows[0];
    if (!contrat) return res.status(404).json({ message: 'Contrat introuvable' });

    const tarif = calcContrat(vehicules);

    const wb = await buildContratWorkbook({ contrat, vehicules, tarif });

    const filename = `tarification_${contrat.numero_police || 'contrat'}.xlsx`
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

export default { calculerVehicule, calculerContrat, calculerContratById, exporterContrat };