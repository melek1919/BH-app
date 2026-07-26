import xlsx from 'xlsx';

// Template fixe — colonnes attendues dans le fichier Excel (ligne 1 = en-têtes)
const REQUIRED_HEADERS = ['N° Police', 'Immatriculation', 'Usage', 'Nb Places'];
const NUMERIC_FIELDS = ['puissance', 'pvid', 'ptac', 'nb_places', 'bonus_malus'];

// Regex volontairement permissives — l'objectif est d'attraper les erreurs
// de saisie grossières (chiffres dans un nom, symboles improbables), pas
// d'imposer un format strict qu'on ne connaît pas avec certitude.
const RE_ALPHA = /^[A-Za-zÀ-ÿ\s'\-.]+$/;             // lettres/accents/espaces/tirets uniquement
const RE_IMMATRICULATION = /^[A-Za-z0-9\s\/\-]{3,20}$/; // alphanumérique, ponctuation légère, 3-20 car.

// "-" , "" , "N/A" deviennent null plutôt que des chaînes fantômes
function clean(value) {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    if (s === '' || s === '-' || s.toUpperCase() === 'N/A') return null;
    return s;
}

function normalizeRow(raw) {
    return {
        numero_police: clean(raw['N° Police']),
        immatriculation: clean(raw['Immatriculation']),
        usage: clean(raw['Usage']),
        type_vehicule: clean(raw['Type']),
        numero_serie: clean(raw['N° Série']),
        bonus_malus: clean(raw['Bonus Malus']),
        marque: clean(raw['Marque']),
        puissance: clean(raw['Puissance']),
        pvid: clean(raw['PVID']),
        ptac: clean(raw['PTAC']),
        nb_places: clean(raw['Nb Places']),
        dmc: clean(raw['Date Mise en Circulation']),
    };
}

function validateRow(row) {
    const errors = [];

    // --- Présence des champs obligatoires ---
    if (!row.numero_police) errors.push('N° Police manquant');
    if (!row.immatriculation) errors.push('Immatriculation manquante');
    if (!row.nb_places) errors.push('Nb Places manquant');
    if (!row.usage) errors.push('Usage manquant');

    // --- Format immatriculation ---
    if (row.immatriculation && !RE_IMMATRICULATION.test(row.immatriculation)) {
        errors.push(`Immatriculation au format invalide ("${row.immatriculation}")`);
    }

    // --- Champs texte qui doivent être alphabétiques (pas de chiffres/symboles) ---
    if (row.marque && !RE_ALPHA.test(row.marque)) {
        errors.push(`Marque invalide, doit être alphabétique ("${row.marque}")`);
    }
    if (row.usage && !RE_ALPHA.test(row.usage)) {
        errors.push(`Usage invalide, doit être alphabétique ("${row.usage}")`);
    }

    // --- Champs numériques : doivent être des nombres, et positifs ---
    for (const field of NUMERIC_FIELDS) {
        if (row[field] == null) continue;
        const n = Number(row[field]);
        if (Number.isNaN(n)) {
            errors.push(`${field} n'est pas un nombre valide ("${row[field]}")`);
        } else if (n < 0) {
            errors.push(`${field} ne peut pas être négatif ("${row[field]}")`);
        } else if (field === 'nb_places' && n === 0) {
            errors.push('nb_places ne peut pas être égal à 0');
        }
    }

    // --- Date de mise en circulation : valide et pas dans le futur ---
    if (row.dmc) {
        const parsed = Date.parse(row.dmc);
        if (Number.isNaN(parsed)) {
            errors.push(`Date de mise en circulation invalide ("${row.dmc}")`);
        } else if (parsed > Date.now()) {
            errors.push(`Date de mise en circulation dans le futur ("${row.dmc}")`);
        }
    }

    return errors;
}

// Une immatriculation ne peut apparaître qu'une seule fois dans le fichier —
// si elle apparaît plusieurs fois, TOUTES les occurrences sont rejetées
// (plutôt que d'en garder une au hasard) pour forcer une correction manuelle.
function flagDuplicatesInFile(rows) {
    const occurrences = new Map();
    for (const row of rows) {
        if (!row.data.immatriculation) continue;
        const key = row.data.immatriculation.trim().toUpperCase();
        if (!occurrences.has(key)) occurrences.set(key, []);
        occurrences.get(key).push(row);
    }
    for (const group of occurrences.values()) {
        if (group.length > 1) {
            for (const row of group) {
                row.errors.push(`Immatriculation en double dans le fichier (lignes ${group.map((r) => r.lineNumber).join(', ')})`);
                row.valid = false;
            }
        }
    }
}

/**
 * Parse un buffer .xlsx et retourne chaque ligne normalisée + ses erreurs.
 * N'écrit rien en base — utilisé aussi bien pour le dry-run que juste avant le commit.
 */
export function parseVehiculesFile(buffer) {
    let workbook;
    try {
        workbook = xlsx.read(buffer, { type: 'buffer' });
    } catch {
        return { headerError: 'Fichier illisible — vérifie que c\'est bien un .xlsx valide', rows: [] };
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (rawRows.length === 0) {
        return { headerError: 'Le fichier ne contient aucune ligne de données', rows: [] };
    }

    const headers = Object.keys(rawRows[0]);
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length) {
        return { headerError: `Colonnes manquantes dans le fichier : ${missing.join(', ')}`, rows: [] };
    }

    const rows = rawRows.map((raw, i) => {
        const lineNumber = i + 2; // ligne 1 = en-têtes, tableau 0-indexé
        const data = normalizeRow(raw);
        const errors = validateRow(data);
        return { lineNumber, data, errors, valid: errors.length === 0 };
    });

    flagDuplicatesInFile(rows);

    return { headerError: null, rows };
}