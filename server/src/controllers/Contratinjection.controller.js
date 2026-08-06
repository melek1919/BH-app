import pool from '../config/database.js';
import { buildInjectionWorkbook } from '../services/Injectionsi.service.js';

// -----------------------------------------------------------------
// GET /api/contrats-injection/liste
// Tous les contrats, tous établissements confondus, avec le nécessaire
// pour la page de gestion des injections SI (dont le numéro de lot).
// -----------------------------------------------------------------
const liste = async (req, res, next) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                c.id, c.numero_police, c.validite_du, c.validite_au,
                c.statut_injection, c.date_derniere_injection, c.numero_lot, c.created_at,
                e.id AS etablissement_id, e.nom AS etablissement_nom, e.gouvernorat,
                COUNT(v.id) FILTER (WHERE v.statut_retrait = 'actif') AS nb_vehicules
            FROM contrat c
            JOIN etablissement e ON e.id = c.etablissement_id
            LEFT JOIN vehicule v ON v.contrat_id = c.id
            GROUP BY c.id, c.created_at, e.id, e.nom, e.gouvernorat
            ORDER BY e.nom, c.numero_police
        `);
        res.json(rows);
    } catch (err) { next(err); }
};

// -----------------------------------------------------------------
// POST /api/contrats-injection/injecter   body: { contratIds: number[] }
// N'injecte que les contrats pas encore "injecte" (première injection ou
// "a_reinjecter"). Les contrats déjà injectés dans le lot sont ignorés
// silencieusement — l'injection ne se refait jamais pour un contrat qui
// n'a pas changé depuis.
// Le lot reçoit un numéro auto-incrémenté ("Lot injection N"), utilisé
// à la fois comme libellé affiché dans la liste et comme nom de fichier.
// -----------------------------------------------------------------
const injecter = async (req, res, next) => {
    const { contratIds } = req.body;
    if (!Array.isArray(contratIds) || contratIds.length === 0) {
        return res.status(400).json({ message: 'Aucun contrat sélectionné' });
    }

    const client = await pool.connect();
    try {
        // Ne retient que les contrats réellement injectables — exclut ceux
        // déjà au statut "injecte" (protection en plus du filtrage frontend).
        const { rows: eligibles } = await client.query(
            `SELECT id FROM contrat WHERE id = ANY($1) AND statut_injection <> 'injecte'`,
            [contratIds]
        );
        const eligibleIds = eligibles.map((r) => r.id);

        if (eligibleIds.length === 0) {
            return res.status(400).json({ message: 'Tous les contrats sélectionnés ont déjà été injectés' });
        }

        const { rows } = await client.query(`
            SELECT
                c.numero_police, c.validite_du, c.validite_au,
                e.identifiant_unique, e.nom, e.adresse, e.email, e.telephone,
                v.marque, v.type_vehicule, v.numero_serie, v.puissance,
                v.immatriculation, v.usage, v.nb_places, v.dmc, v.pvid, v.ptac
            FROM contrat c
            JOIN etablissement e ON e.id = c.etablissement_id
            JOIN vehicule v ON v.contrat_id = c.id AND v.statut_retrait = 'actif'
            WHERE c.id = ANY($1)
            ORDER BY c.numero_police, v.id
        `, [eligibleIds]);

        const workbook = await buildInjectionWorkbook(rows);

        await client.query('BEGIN');
        const { rows: lotRows } = await client.query(`SELECT nextval('lot_injection_seq') AS numero`);
        const numeroLot = Number(lotRows[0].numero);

        await client.query(
            `UPDATE contrat SET statut_injection = 'injecte', date_derniere_injection = now(), numero_lot = $2 WHERE id = ANY($1)`,
            [eligibleIds, numeroLot]
        );
        await client.query('COMMIT');

        const libelleLot = `Lot injection ${numeroLot}`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${libelleLot.replace(/\s+/g, '_')}.xlsx"`);
        res.setHeader('X-Lot-Injection', libelleLot);
        res.setHeader('X-Lot-Injecte-Count', String(eligibleIds.length));
        res.setHeader('X-Lot-Ignore-Count', String(contratIds.length - eligibleIds.length));
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Lot-Injection, X-Lot-Injecte-Count, X-Lot-Ignore-Count');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        next(err);
    } finally {
        client.release();
    }
};

export default { liste, injecter };