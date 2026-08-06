import pool from '../config/database.js';

const tables = ['utilisateur', 'etablissement', 'contrat', 'vehicule'];

async function run() {
  try {
    for (const t of tables) {
      const { rows } = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
        [t]
      );
      console.log('TABLE', t, '->', JSON.stringify(rows));
    }
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}
run();