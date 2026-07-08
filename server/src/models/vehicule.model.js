import pool from '../config/database.js';

const findAll = async() => {
    const { rows } = await pool.query('SELECT *FROM VEHICULE ORDER BY id');
    return rows;
};

const findById = async(id) => {
    const { rows } = await pool.query('SELECT * FROM VEHICULE WHERE id = $1', [id]);
    return rows[0];
};

const findRetires = async() => {
    const { rows }= await pool.query("SELECT * FROM vehicule WHERE statut = 'retire' ORDER BY id ");
    return rows;
};

const findByContrat = async (contratId) => {
    const { rows } = await pool.query(
        "SELECT * FROM vehicule WHERE contrat_id = $1 AND statut = 'actif' ORDER BY id",
        [contratId]
    );
    return rows;
};

const create = async(vehicule) => {
    const {
        contrat_id, immatriculation, usage, type_vehicule, numero_serie,
        bonus_malus, marque, puissance, pvid, ptac, nb_places_assises, dmc
    } = data;  

    const { rows } = await pool.query(
        `INSERT INTO VEHICULE
         (contrat_id, immatriculation, usage, type_vehicule, numero_serie, bonus_malus, marque, puissance, pvid, ptac, nb_places_assises, dmc)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [contrat_id, immatriculation, usage, type_vehicule, numero_serie, bonus_malus, marque, puissance, pvid, ptac, nb_places_assises, dmc]
    );
    return rows[0];
};

const update = async (id, vehicule) => {
    const {
        contrat_id, immatriculation, usage, type_vehicule, numero_serie,
        bonus_malus, marque, puissance, pvid, ptac, nb_places_assises, dmc
    } = vehicule;

    const { rows } = await pool.query(
        `UPDATE VEHICULE
         SET contrat_id = $2, immatriculation = $3, usage = $4, type_vehicule = $5, numero_serie = $6,
             bonus_malus = $7, marque = $8, puissance = $9, pvid = $10, ptac = $11, nb_places_assises = $12, dmc = $13
         WHERE id = $1 RETURNING *`,
        [id, contrat_id, immatriculation, usage, type_vehicule, numero_serie, bonus_malus, marque, puissance, pvid, ptac, nb_places_assises, dmc]
    );
    return rows[0];
};

const retirer = async (id, motif) => {
    const { rows } = await pool.query(
        `UPDATE vehicule
         SET statut = 'retire', date_retrait = now(), motif_retrait = $1
         WHERE id = $2 AND statut = 'actif'
         RETURNING *`,
        [motif || null, id]
    );
    return rows[0];
};

const restaurer = async (id) => {
    const { rows } = await pool.query(
        `UPDATE vehicule
         SET statut = 'actif', date_retrait = NULL, motif_retrait = NULL
         WHERE id = $1 AND statut = 'retire'
         RETURNING *`,
        [id]
    );
    return rows[0];
};

export default {findAll, findById, findRetires, findByContrat, create, update, retirer, restaurer};