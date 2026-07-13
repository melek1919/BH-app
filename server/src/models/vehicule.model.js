import pool from '../config/database.js';

const findAll = async () => {
    const { rows } = await pool.query(
        "SELECT * FROM vehicule WHERE statut_retrait = 'actif' ORDER BY id"
    );
    return rows;
};

const findById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM vehicule WHERE id = $1', [id]);
    return rows[0];
};

const findRetires = async () => {
    const { rows } = await pool.query(
        "SELECT * FROM vehicule WHERE statut_retrait = 'retire' ORDER BY date_retrait DESC"
    );
    return rows;
};

const findByEtablissement = async (etablissementId) => {
    const { rows } = await pool.query(
        "SELECT * FROM vehicule WHERE etablissement_id = $1 AND statut_retrait = 'actif' ORDER BY id",
        [etablissementId]
    );
    return rows;
};

const create = async (vehicule) => {
    const {
        etablissement_id, immatriculation, usage, type_vehicule, numero_serie,
        bonus_malus, marque, puissance, pvid, ptac, nb_places, dmc
    } = vehicule; // <-- corrigé : "vehicule", pas "data"

    const { rows } = await pool.query(
        `INSERT INTO vehicule
         (etablissement_id, immatriculation, usage, type_vehicule, numero_serie, bonus_malus, marque, puissance, pvid, ptac, nb_places, dmc)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [etablissement_id, immatriculation, usage, type_vehicule, numero_serie, bonus_malus, marque, puissance, pvid, ptac, nb_places, dmc]
    );
    return rows[0];
};

const update = async (id, vehicule) => {
    const {
        immatriculation, usage, type_vehicule, numero_serie,
        bonus_malus, marque, puissance, pvid, ptac, nb_places, dmc
    } = vehicule;

    const { rows } = await pool.query(
        `UPDATE vehicule
         SET immatriculation=$1, usage=$2, type_vehicule=$3, numero_serie=$4,
             bonus_malus=$5, marque=$6, puissance=$7, pvid=$8, ptac=$9, nb_places=$10, dmc=$11
         WHERE id=$12 AND statut_retrait = 'actif'
         RETURNING *`,
        [immatriculation, usage, type_vehicule, numero_serie, bonus_malus, marque, puissance, pvid, ptac, nb_places, dmc, id]
    );
    return rows[0];
};

const retirer = async (id, motif) => {
    const { rows } = await pool.query(
        `UPDATE vehicule
         SET statut_retrait = 'retire', date_retrait = now(), motif_retrait = $1
         WHERE id = $2 AND statut_retrait = 'actif'
         RETURNING *`,
        [motif || null, id]
    );
    return rows[0];
};

const restaurer = async (id) => {
    const { rows } = await pool.query(
        `UPDATE vehicule
         SET statut_retrait = 'actif', date_retrait = NULL, motif_retrait = NULL
         WHERE id = $1 AND statut_retrait = 'retire'
         RETURNING *`,
        [id]
    );
    return rows[0];
};

export default { findAll, findById, findRetires, findByEtablissement, create, update, retirer, restaurer };