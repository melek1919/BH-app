import xlsx from 'xlsx';

// Template fixe — colonnes attendues dans le fichier Excel (ligne 1 = en-têtes)
const REQUIRED_HEADERS = ['N° Police', 'Immatriculation', 'Usage', 'Nb Places'];
const NUMERIC_FIELDS = ['puissance', 'pvid', 'ptac', 'nb_places'];

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
    if (!row.numero_police) errors.push('N° Police manquant');
    if (!row.immatriculation) errors.push('Immatriculation manquante');
    if (!row.nb_places) errors.push('Nb Places manquant');

    for (const field of NUMERIC_FIELDS) {
        if (row[field] != null && Number.isNaN(Number(row[field]))) {
            errors.push(`${field} n'est pas un nombre valide ("${row[field]}")`);
        }
    }

    if (row.dmc && Number.isNaN(Date.parse(row.dmc))) {
        errors.push(`Date de mise en circulation invalide ("${row.dmc}")`);
    }

    return errors;
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

    return { headerError: null, rows };
}