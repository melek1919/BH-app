import pool from '../config/database.js';

const findByEtablissement = async (etablissementId) => {
    const { rows } = await pool.query(
        'SELECT * FROM contrat WHERE etablissement_id = $1 ORDER BY numero_police',
        [etablissementId]
    );
    return rows;
};

const findById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM contrat WHERE id = $1', [id]);
    return rows[0];
};

const findByNumeroPolice = async (numero) => {
    const { rows } = await pool.query(
        `SELECT c.*, e.nom as etablissement_nom
         FROM contrat c
         LEFT JOIN etablissement e ON c.etablissement_id = e.id
         WHERE c.numero_police = $1`,
        [numero]
    );
    return rows[0];
};

const create = async (etablissementId, { numero_police }) => {
    const annee = new Date().getFullYear();
    const validite_du = `${annee}-01-01`;
    const validite_au = `${annee}-12-31`;

    const { rows } = await pool.query(
        `INSERT INTO contrat (etablissement_id, numero_police, validite_du, validite_au, statut)
         VALUES ($1, $2, $3, $4, 'actif')
         RETURNING *`,
        [etablissementId, numero_police, validite_du, validite_au]
    );
    return rows[0];
};

const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM contrat WHERE id = $1', [id]);
    return rowCount > 0;
};

// Utilisée par la tâche planifiée : prolonge tous les contrats expirés
// vers l'année en cours, SANS changer le numero_police ni créer de nouvelle ligne.
const renouvelerContratsExpires = async () => {
    const annee = new Date().getFullYear();
    const validite_du = `${annee}-01-01`;
    const validite_au = `${annee}-12-31`;

    const { rows } = await pool.query(
        `UPDATE contrat
         SET validite_du = $1, validite_au = $2
         WHERE statut = 'actif' AND validite_au < CURRENT_DATE
         RETURNING id, numero_police`,
        [validite_du, validite_au]
    );
    return rows; // liste des contrats qui viennent d'être prolongés, utile pour logguer
};

export default { findByEtablissement, findById, findByNumeroPolice, create, remove, renouvelerContratsExpires };