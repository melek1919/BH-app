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

const getTop = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 50);

    const { rows: allVehicules } = await pool.query(`
      SELECT v.*, c.numero_police, c.created_at AS contrat_created_at,
             e.nom AS etablissement_nom, e.id AS etablissement_id
      FROM vehicule v
      JOIN contrat c ON c.id = v.contrat_id
      JOIN etablissement e ON e.id = c.etablissement_id
      WHERE v.statut_retrait = 'actif'
      ORDER BY v.contrat_id
    `);

    // Group vehicles by contrat_id
    const groups = new Map();
    for (const v of allVehicules) {
      if (!groups.has(v.contrat_id)) {
        groups.set(v.contrat_id, {
          contratId: v.contrat_id,
          contratCreatedAt: v.contrat_created_at,
          numeroPolice: v.numero_police,
          etablissementId: v.etablissement_id,
          etablissementNom: v.etablissement_nom,
          vehicules: [],
        });
      }
      groups.get(v.contrat_id).vehicules.push(v);
    }

    const allTopVehicules = [];
    const allTopContrats = [];

    for (const group of groups.values()) {
      const tarif = calcContrat(group.vehicules);
      allTopContrats.push({
        contratId: group.contratId,
        numeroPolice: group.numeroPolice,
        etablissementId: group.etablissementId,
        etablissementNom: group.etablissementNom,
        nbVehicules: group.vehicules.length,
        createdAt: group.contratCreatedAt,
        primeTTC: tarif.primeTTC,
        primeNetteContrat: tarif.primeNetteContrat,
      });
      for (const d of tarif.details) {
        allTopVehicules.push({
          contratId: group.contratId,
          etablissementNom: group.etablissementNom,
          numeroPolice: group.numeroPolice,
          immatriculation: d.immatriculation,
          marque: group.vehicules[d.index]?.marque || '',
          variable: d.variable,
          RC: d.RC,
          DR: d.DR,
          primeNetteTotale: d.primeNetteTotale,
          totalSansPTA: d.totalSansPTA,
          primePTA: d.primePTA,
          TUA_PTA: d.TUA_PTA,
          totalAvecPTA: d.totalAvecPTA,
        });
      }
    }

    // Sort and limit
    allTopContrats.sort((a, b) => b.primeTTC - a.primeTTC);
    allTopVehicules.sort((a, b) => b.totalAvecPTA - a.totalAvecPTA);

    // Monthly revenue evolution (by contrat creation month)
    const monthlyMap = new Map();
    for (const c of allTopContrats) {
      if (!c.createdAt) continue;
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + c.primeTTC);
    }
    const evolution = [...monthlyMap.entries()]
      .map(([month, value]) => ({ month, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Tariff margin brackets (from all vehicles)
    const brackets = { "<150": 0, "150-350": 0, "350-500": 0, "500+": 0 };
    for (const v of allTopVehicules) {
      const t = v.totalAvecPTA;
      if (t < 150) brackets["<150"]++;
      else if (t < 350) brackets["150-350"]++;
      else if (t < 500) brackets["350-500"]++;
      else brackets["500+"]++;
    }

    res.json({
      topVehicules: allTopVehicules.slice(0, limit),
      topContrats: allTopContrats.slice(0, limit),
      evolution,
      brackets: Object.entries(brackets).map(([name, value]) => ({ name, value })),
    });
  } catch (err) { next(err); }
};

export default { calculerVehicule, calculerContrat, calculerContratById, exporterContrat, getTop };