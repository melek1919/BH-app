import pool from '../config/database.js';

const findAll = async () => {
    const { rows } = await pool.query('SELECT * FROM etablissement ORDER BY id');
    return rows;
};

const findById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM etablissement WHERE id = $1', [id]);
    return rows[0];
};

const create = async (etablissement) => {
    const {
        nom, adresse, gouvernorat, identifiant_unique,
        telephone, responsable_parc_auto, mobile, email,
        code_fiabilisation, statut_gias_prod
    } = etablissement;
    const { rows } = await pool.query(
        `INSERT INTO etablissement
         (nom, adresse, gouvernorat, identifiant_unique, telephone, responsable_parc_auto, mobile, email, code_fiabilisation, statut_gias_prod)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [nom, adresse, gouvernorat, identifiant_unique, telephone, responsable_parc_auto, mobile, email, code_fiabilisation, statut_gias_prod]
    );
    return rows[0];
};

const update = async (id, etablissement) => {
    const {
        nom, adresse, gouvernorat, identifiant_unique, telephone,
        responsable_parc_auto, mobile, email, code_fiabilisation, statut_gias_prod
    } = etablissement;
    const { rows } = await pool.query(
        `UPDATE etablissement SET nom=$1, adresse=$2, gouvernorat=$3, identifiant_unique=$4,
         telephone=$5, responsable_parc_auto=$6, mobile=$7, email=$8, code_fiabilisation=$9,
         statut_gias_prod=$10 WHERE id=$11 RETURNING *`,
        [nom, adresse, gouvernorat, identifiant_unique, telephone, responsable_parc_auto, mobile, email, code_fiabilisation, statut_gias_prod, id]
    );
    return rows[0];
};

// Action séparée : affecter/modifier le numéro de contrat
const affecterContrat = async (id, { numero_police, validite_du, validite_au }) => {
    const { rows } = await pool.query(
        `UPDATE etablissement
         SET numero_police = $1, validite_du = $2, validite_au = $3
         WHERE id = $4
         RETURNING *`,
        [numero_police, validite_du, validite_au, id]
    );
    return rows[0];
};

// Fusion : réaffecte les véhicules de source vers cible, supprime source
const fusionner = async (sourceId, cibleId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'UPDATE vehicule SET etablissement_id = $1 WHERE etablissement_id = $2',
            [cibleId, sourceId]
        );

        const { rows } = await client.query(
            'DELETE FROM etablissement WHERE id = $1 RETURNING *',
            [sourceId]
        );

        await client.query('COMMIT');
        return rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM etablissement WHERE id = $1', [id]);
    return rowCount > 0;
};

export default { findAll, findById, create, update, affecterContrat, fusionner, remove };