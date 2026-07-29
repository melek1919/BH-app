import { calcVehicule, calcContrat } from '../services/tarification.service.js';
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

export default { calculerVehicule, calculerContrat, calculerContratById };
