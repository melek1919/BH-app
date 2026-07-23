import pool from '../config/database.js';
import { parseVehiculesFile } from '../services/importVehicules.service.js';
import { parseEtablissementsFile } from '../services/importEtablissements.service.js';
const CHUNK_SIZE = 500;
const COLS_PER_ROW = 12; // contrat_id + 11 champs véhicule
const ETAB_COLS_PER_ROW = 8;

function buildSummary(rows) {
    const invalides = rows.filter((r) => !r.valid);
    return {
        total: rows.length,
        valides: rows.length - invalides.length,
        erreurs: invalides.length,
        // Limité à 200 pour ne pas envoyer un payload énorme si le fichier est très mauvais
        detailErreurs: invalides.slice(0, 200).map((r) => ({ ligne: r.lineNumber, messages: r.errors })),
    };
}

// Résout les N° Police en id contrat en une seule requête (évite N allers-retours)
async function resolveContrats(client, rows) {
    const numeroPolices = [...new Set(rows.filter((r) => r.valid).map((r) => r.data.numero_police))];
    if (numeroPolices.length === 0) return new Map();
    const { rows: contrats } = await client.query(
        'SELECT id, numero_police FROM contrat WHERE numero_police = ANY($1)',
        [numeroPolices]
    );
    return new Map(contrats.map((c) => [c.numero_police, c.id]));
}

function rejectMissingContrats(rows, contratMap) {
    for (const row of rows) {
        if (!row.valid) continue;
        if (!contratMap.has(row.data.numero_police)) {
            row.errors.push(`Contrat introuvable pour le N° Police "${row.data.numero_police}"`);
            row.valid = false;
        }
    }
}

// -----------------------------------------------------------------
// DRY-RUN : parse + valide + vérifie les contrats, n'écrit rien.
// -----------------------------------------------------------------
const dryRunVehicules = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

        const { headerError, rows } = parseVehiculesFile(req.file.buffer);
        if (headerError) return res.status(400).json({ message: headerError });

        const contratMap = await resolveContrats(pool, rows);
        rejectMissingContrats(rows, contratMap);

        res.json(buildSummary(rows));
    } catch (err) { next(err); }
};

// -----------------------------------------------------------------
// COMMIT : réexécute la même validation, puis insère en transaction.
// Le frontend renvoie le même fichier qu'au dry-run (rien n'est
// gardé en mémoire côté serveur entre les deux appels).
// -----------------------------------------------------------------
const commitVehicules = async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const { headerError, rows } = parseVehiculesFile(req.file.buffer);
    if (headerError) return res.status(400).json({ message: headerError });

    const client = await pool.connect();
    try {
        const contratMap = await resolveContrats(client, rows);
        rejectMissingContrats(rows, contratMap);

        const toInsert = rows
            .filter((r) => r.valid)
            .map((r) => ({ ...r.data, contrat_id: contratMap.get(r.data.numero_police) }));

        await client.query('BEGIN');

        let inserted = 0;
        for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
            const chunk = toInsert.slice(i, i + CHUNK_SIZE);
            const values = [];
            const placeholders = chunk.map((v, idx) => {
                const base = idx * COLS_PER_ROW;
                values.push(
                    v.contrat_id, v.immatriculation, v.usage, v.type_vehicule, v.numero_serie,
                    v.bonus_malus, v.marque, v.puissance, v.pvid, v.ptac, v.nb_places, v.dmc
                );
                const ph = Array.from({ length: COLS_PER_ROW }, (_, c) => `$${base + c + 1}`).join(',');
                return `(${ph})`;
            }).join(',');

            await client.query(
                `INSERT INTO vehicule
                 (contrat_id, immatriculation, usage, type_vehicule, numero_serie, bonus_malus, marque, puissance, pvid, ptac, nb_places, dmc)
                 VALUES ${placeholders}`,
                values
            );
            inserted += chunk.length;
        }

        await client.query('COMMIT');

        res.json({ ...buildSummary(rows), inseres: inserted });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// -----------------------------------------------------------------
// ÉTABLISSEMENTS — upsert par identifiant_unique, contrat optionnel
// rattaché/créé via N. Police si la colonne est renseignée sur la ligne.
// code couleur / Statut GIAS PROD ne sont jamais lus (voir le service).
// -----------------------------------------------------------------

// À l'intérieur d'un même fichier, deux lignes peuvent partager le même
// identifiant_unique (doublon de saisie) — on ne garde que la dernière
// occurrence pour éviter "ON CONFLICT DO UPDATE command cannot affect
// row a second time" que Postgres refuse dans un seul batch.
function dedupeByIdentifiant(rows) {
    const seen = new Map();
    for (const row of rows) {
        if (!row.valid) continue;
        if (seen.has(row.data.identifiant_unique)) {
            const previous = seen.get(row.data.identifiant_unique);
            previous.errors.push(`Doublon dans le fichier — écrasé par la ligne ${row.lineNumber}`);
            previous.valid = false;
        }
        seen.set(row.data.identifiant_unique, row);
    }
    return rows;
}

async function upsertEtablissements(client, rows) {
    const valides = rows.filter((r) => r.valid);
    let traites = 0;

    for (let i = 0; i < valides.length; i += CHUNK_SIZE) {
        const chunk = valides.slice(i, i + CHUNK_SIZE);
        const values = [];
        const placeholders = chunk.map((r, idx) => {
            const base = idx * ETAB_COLS_PER_ROW;
            const d = r.data;
            values.push(d.identifiant_unique, d.nom, d.adresse, d.gouvernorat, d.telephone, d.responsable_parc_auto, d.mobile, d.email);
            const ph = Array.from({ length: ETAB_COLS_PER_ROW }, (_, c) => `$${base + c + 1}`).join(',');
            return `(${ph})`;
        }).join(',');

        await client.query(
            `INSERT INTO etablissement
             (identifiant_unique, nom, adresse, gouvernorat, telephone, responsable_parc_auto, mobile, email)
             VALUES ${placeholders}
             ON CONFLICT (identifiant_unique) DO UPDATE SET
               nom = EXCLUDED.nom,
               adresse = EXCLUDED.adresse,
               gouvernorat = EXCLUDED.gouvernorat,
               telephone = EXCLUDED.telephone,
               responsable_parc_auto = EXCLUDED.responsable_parc_auto,
               mobile = EXCLUDED.mobile,
               email = EXCLUDED.email`,
            values
        );
        traites += chunk.length;
    }
    return traites;
}

// Rattache/crée le contrat pour les lignes qui ont un N. Police renseigné.
// Les dates de validité ne sont fixées qu'à la création — un contrat déjà
// existant garde ses dates réelles, seul son etablissement_id est resynchronisé.
async function upsertContratsLies(client, rows) {
    const avecPolice = rows.filter((r) => r.valid && r.data.numero_police);
    if (avecPolice.length === 0) return 0;

    const identifiants = [...new Set(avecPolice.map((r) => r.data.identifiant_unique))];
    const { rows: etabs } = await client.query(
        'SELECT id, identifiant_unique FROM etablissement WHERE identifiant_unique = ANY($1)',
        [identifiants]
    );
    const etabIdByIdentifiant = new Map(etabs.map((e) => [e.identifiant_unique, e.id]));

    const annee = new Date().getFullYear();
    const validiteDu = `${annee}-01-01`;
    const validiteAu = `${annee}-12-31`;

    let traites = 0;
    for (let i = 0; i < avecPolice.length; i += CHUNK_SIZE) {
        const chunk = avecPolice.slice(i, i + CHUNK_SIZE);
        const values = [];
        const placeholders = chunk.map((r, idx) => {
            const base = idx * 4;
            values.push(r.data.numero_police, etabIdByIdentifiant.get(r.data.identifiant_unique), validiteDu, validiteAu);
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4})`;
        }).join(',');

        await client.query(
            `INSERT INTO contrat (numero_police, etablissement_id, validite_du, validite_au)
             VALUES ${placeholders}
             ON CONFLICT (numero_police) DO UPDATE SET etablissement_id = EXCLUDED.etablissement_id`,
            values
        );
        traites += chunk.length;
    }
    return traites;
}

const dryRunEtablissements = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

        const { headerError, rows } = parseEtablissementsFile(req.file.buffer);
        if (headerError) return res.status(400).json({ message: headerError });

        dedupeByIdentifiant(rows);
        res.json(buildSummary(rows));
    } catch (err) { next(err); }
};

const commitEtablissements = async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const { headerError, rows } = parseEtablissementsFile(req.file.buffer);
    if (headerError) return res.status(400).json({ message: headerError });

    dedupeByIdentifiant(rows);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const etablissementsTraites = await upsertEtablissements(client, rows);
        const contratsTraites = await upsertContratsLies(client, rows);

        await client.query('COMMIT');

        res.json({ ...buildSummary(rows), inseres: etablissementsTraites, contratsRattaches: contratsTraites });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export default { dryRunVehicules, commitVehicules, dryRunEtablissements, commitEtablissements };