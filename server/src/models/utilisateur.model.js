import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const SALT_ROUNDS = 12;

// Colonnes renvoyées au client : jamais mot_de_passe_hash
const SAFE_COLUMNS = 'id, nom, prenom, email, tel, role, actif, created_at, updated_at';

const findAll = async () => {
    const { rows } = await pool.query(`SELECT ${SAFE_COLUMNS} FROM utilisateur ORDER BY id`);
    return rows;
};

const findById = async (id) => {
    const { rows } = await pool.query(`SELECT ${SAFE_COLUMNS} FROM utilisateur WHERE id = $1`, [id]);
    return rows[0];
};

// Utilisée uniquement en interne pour le login (a besoin du hash)
const findByEmailWithHash = async (email) => {
    const { rows } = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
    return rows[0];
};

const create = async ({ nom, prenom, email, tel, mot_de_passe, role }) => {
    const mot_de_passe_hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);
    const { rows } = await pool.query(
        `INSERT INTO utilisateur (nom, prenom, email, tel, mot_de_passe_hash, role)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING ${SAFE_COLUMNS}`,
        [nom, prenom, email, tel, mot_de_passe_hash, role]
    );
    return rows[0];
};

const update = async (id, { nom, prenom, email, tel, role }) => {
    const { rows } = await pool.query(
        `UPDATE utilisateur SET nom=$1, prenom=$2, email=$3, tel=$4, role=$5, updated_at = NOW()
         WHERE id=$6 RETURNING ${SAFE_COLUMNS}`,
        [nom, prenom, email, tel, role, id]
    );
    return rows[0];
};

const updatePassword = async (id, nouveauMotDePasse) => {
    const mot_de_passe_hash = await bcrypt.hash(nouveauMotDePasse, SALT_ROUNDS);
    const { rows } = await pool.query(
        `UPDATE utilisateur SET mot_de_passe_hash=$1, updated_at = NOW() WHERE id=$2 RETURNING ${SAFE_COLUMNS}`,
        [mot_de_passe_hash, id]
    );
    return rows[0];
};

// Désactivation plutôt que suppression (on garde la trace de qui a saisi quoi)
const setActif = async (id, actif) => {
    const { rows } = await pool.query(
        `UPDATE utilisateur SET actif=$1, updated_at = NOW() WHERE id=$2 RETURNING ${SAFE_COLUMNS}`,
        [actif, id]
    );
    return rows[0];
};

const verifyPassword = (motDePasse, hash) => bcrypt.compare(motDePasse, hash);

export default {
    findAll,
    findById,
    findByEmailWithHash,
    create,
    update,
    updatePassword,
    setActif,
    verifyPassword,
};
