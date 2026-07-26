import xlsx from 'xlsx';

// Colonnes du template fourni (feuille "Etat des etablissements").
// Volontairement absentes du mapping : "code couleur " et "Statut - GIAS PROD"
// — même si elles sont présentes dans le fichier, on ne les lit jamais.
const REQUIRED_HEADERS = ['Etablissement', 'IDENTIFIANT UNIQUE'];

// Regex volontairement permissives — attraper les erreurs de saisie grossières,
// pas imposer un format qu'on ne connaît pas avec certitude.
const RE_ALPHA = /^[A-Za-zÀ-ÿ0-9\s'\-.]+$/;   // lettres/accents/chiffres légers/espaces/tirets
const RE_TEL = /^[0-9+\s.]{6,15}$/;           // chiffres, +, espaces, points — 6 à 15 caractères
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // --- Présence des champs obligatoires ---
    if (!row.nom) errors.push('Etablissement (nom) manquant');
    if (!row.identifiant_unique) errors.push('Identifiant unique manquant');

    // --- Nom : pas de symboles improbables (@, #, etc.) ---
    if (row.nom && !RE_ALPHA.test(row.nom)) {
        errors.push(`Nom d'établissement invalide, caractères non autorisés ("${row.nom}")`);
    }

    // --- Téléphone / mobile : uniquement des chiffres (+ espaces/points) ---
    if (row.telephone && !RE_TEL.test(row.telephone)) {
        errors.push(`Téléphone invalide, doit être numérique ("${row.telephone}")`);
    }
    if (row.mobile && !RE_TEL.test(row.mobile)) {
        errors.push(`Mobile invalide, doit être numérique ("${row.mobile}")`);
    }

    // --- Email : format standard ---
    if (row.email && !RE_EMAIL.test(row.email)) {
        errors.push(`Email invalide ("${row.email}")`);
    }

    return errors;
}

// Un même N. Police ne peut pas apparaître deux fois dans le fichier —
// contrairement à l'identifiant_unique (où la dernière ligne peut légitimement
// mettre à jour la précédente), deux établissements différents ne peuvent
// pas revendiquer le même contrat : toutes les lignes concernées sont rejetées.
function flagDuplicateNumeroPolice(rows) {
    const occurrences = new Map();
    for (const row of rows) {
        if (!row.valid || !row.data.numero_police) continue;
        const key = row.data.numero_police.trim();
        if (!occurrences.has(key)) occurrences.set(key, []);
        occurrences.get(key).push(row);
    }
    for (const group of occurrences.values()) {
        if (group.length > 1) {
            for (const row of group) {
                row.errors.push(`N. Police en double dans le fichier (lignes ${group.map((r) => r.lineNumber).join(', ')})`);
                row.valid = false;
            }
        }
    }
}

/**
 * Parse un buffer .xlsx et retourne chaque ligne normalisée + erreurs.
 * Cherche la ligne d'en-têtes dans les 20 premières lignes plutôt que de
 * supposer qu'elle est en ligne 1 — le template fourni a des lignes de
 * titre libres avant le vrai tableau (en-têtes en ligne 8 par exemple).
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
    const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    const headerRowIndex = raw.slice(0, 20).findIndex((row) =>
        REQUIRED_HEADERS.every((h) => row.some((cell) => String(cell || '').trim() === h))
    );

    if (headerRowIndex === -1) {
        return { headerError: `Colonnes manquantes dans le fichier : ${REQUIRED_HEADERS.join(', ')}`, rows: [] };
    }

    const headers = raw[headerRowIndex].map((h) => String(h || '').trim());
    const dataRows = raw
        .slice(headerRowIndex + 1)
        .filter((row) => row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''));

    if (dataRows.length === 0) {
        return { headerError: 'Le fichier ne contient aucune ligne de données', rows: [] };
    }

    const rows = dataRows.map((rowArr, i) => {
        const lineNumber = headerRowIndex + 2 + i; // +1 en-tête 1-based, +1 pour la ligne de données suivante
        const rawObj = {};
        headers.forEach((h, idx) => { rawObj[h] = rowArr[idx]; });
        const data = normalizeRow(rawObj);
        const errors = validateRow(data);
        return { lineNumber, data, errors, valid: errors.length === 0 };
    });

    flagDuplicateNumeroPolice(rows);

    return { headerError: null, rows };
}