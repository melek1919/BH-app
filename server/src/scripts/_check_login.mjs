import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import model from '../models/utilisateur.model.js';

async function run() {
  try {
    console.log('JWT_SECRET défini ?', !!process.env.JWT_SECRET);
    const utilisateur = await model.findByEmailWithHash('admin@bh.tn');
    console.log('Utilisateur trouvé ?', !!utilisateur);
    if (!utilisateur) {
      const count = await import('../config/database.js').then(async (m) => {
        const { rows } = await m.default.query('SELECT email, role, actif FROM utilisateur ORDER BY id LIMIT 10');
        return rows;
      });
      console.log('Comptes existants :', JSON.stringify(count));
    } else {
      const ok = await model.verifyPassword('password', utilisateur.mot_de_passe_hash);
      console.log('Mot de passe valide ?', ok);
      const payload = { id: utilisateur.id, nom: utilisateur.nom, role: utilisateur.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4h' });
      console.log('Token signé OK, longueur :', token.length);
    }
  } catch (e) {
    console.error('ERREUR RÉELLE:', e.message);
  } finally {
    process.exit(0);
  }
}
run();