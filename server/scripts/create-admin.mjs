// Script à exécuter UNE SEULE FOIS pour créer le premier compte admin.
// Nécessaire car la route POST /api/utilisateurs est elle-même réservée
// aux admins : il faut donc créer le tout premier en direct, hors API.
//
// Usage :
//   cd server
//   node scripts/create-admin.mjs "Ben Ali" "Ahmed" "ahmed.benali@bh.tn" "motdepasse123"

import bcrypt from 'bcrypt';
import pool from '../src/config/database.js';

const [, , nom, prenom, email, motDePasse] = process.argv;

if (!nom || !prenom || !email || !motDePasse) {
    console.error('Usage: node scripts/create-admin.mjs <nom> <prenom> <email> <mot_de_passe>');
    process.exit(1);
}

const hash = await bcrypt.hash(motDePasse, 12);

const { rows } = await pool.query(
    `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, nom, prenom, email, role`,
    [nom, prenom, email, hash]
);

console.log('Admin créé :', rows[0]);
await pool.end();
