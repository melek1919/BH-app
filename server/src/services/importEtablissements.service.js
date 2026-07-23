import xlsx from 'xlsx';

// Colonnes du template fourni (feuille "Etat des etablissements").
// Volontairement absentes du mapping : "code couleur " et "Statut - GIAS PROD"
// — même si elles sont présentes dans le fichier, on ne les lit jamais.
const REQUIRED_HEADERS = ['Etablissement', 'IDENTIFIANT UNIQUE'];

function clean(value) {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    if (s === '' || s === '-' || s.toUpperCase() === 'N/A') return null;
    return s;
}

function normalizeRow(raw) {
    return {
        numero_police: clean(raw['N. Police']), // optionnel — sert à rattacher/créer un contrat
        nom: clean(raw['Etablissement']),
        adresse: clean(raw['ADRESSE']),
        gouvernorat: clean(raw['GOUVERNORAT']),
        identifiant_unique: clean(raw['IDENTIFIANT UNIQUE']),
        telephone: clean(raw['TEL']),
        responsable_parc_auto: clean(raw['Resp parc auto']),
        mobile: clean(raw['MOBILE']),
        email: clean(raw['E-MAIL']),
        // "code couleur " et "Statut - GIAS PROD" ignorés intentionnellement
    };
}

function validateRow(row) {
    const errors = [];
    if (!row.nom) errors.push('Etablissement (nom) manquant');
    if (!row.identifiant_unique) errors.push('Identifiant unique manquant');
    return errors;
}

/**
 * Parse un buffer .xlsx (feuille active) et retourne chaque ligne normalisée + erreurs.
 * N'écrit rien en base.
 */
export function parseEtablissementsFile(buffer) {
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
        const lineNumber = i + 2;
        const data = normalizeRow(raw);
        const errors = validateRow(data);
        return { lineNumber, data, errors, valid: errors.length === 0 };
    });

    return { headerError: null, rows };
}