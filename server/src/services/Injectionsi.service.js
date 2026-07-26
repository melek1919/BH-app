import ExcelJS from 'exceljs';

// Ordre et libellés EXACTS du template_injection_SI.xlsx fourni.
// Colonnes sans équivalent dans notre schéma actuel (CODE_INTERMEDIAIRE,
// CLASSE, MF, CYLINDRE, remorque) sont laissées vides — voir la note
// dans la réponse pour l'origine de chaque colonne.
const HEADERS = [
    'CODE_INTERMEDIAIRE', 'NUM_CONTRAT', 'CLASSE', 'VALIDITE_DU', 'VALIDITE_AU',
    'REF_SOUSCRIPTEUR', 'MF', 'email', 'tel',
    'ASSURERectifié', 'MF', 'email', 'tel', 'Adresse',
    'MARQUE_VEHICULE', 'TYPE_VEHICULE', 'NUM_SERIE_TYPE', 'PUISSANCE', 'CYLINDRE',
    'IMMATRICULATION_VEHICULE', 'LIB_CATEGORIE_TARIFAIRE', 'remorque',
    'Nb_place_véhicule', 'datemiseencirculation', 'chargevide', 'chargetotale',
];

const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/**
 * rows attendu : résultat de la requête SQL jointe contrat+etablissement+vehicule
 * (voir buildInjectionRows dans le contrôleur) — une ligne par véhicule.
 */
export async function buildInjectionWorkbook(rows) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Injection');

    sheet.addRow(HEADERS);
    sheet.getRow(1).font = { bold: true };

    for (const r of rows) {
        sheet.addRow([
            '',                          // CODE_INTERMEDIAIRE — absent du schéma
            r.numero_police,
            '',                          // CLASSE — absent du schéma
            fmtDate(r.validite_du),
            fmtDate(r.validite_au),
            r.identifiant_unique,        // REF_SOUSCRIPTEUR
            '',                          // MF souscripteur — absent du schéma
            r.email || '',
            r.telephone || '',
            r.nom,                       // ASSURERectifié
            '',                          // MF assuré — absent du schéma
            r.email || '',
            r.telephone || '',
            r.adresse || '',
            r.marque || '',
            r.type_vehicule || '',
            r.numero_serie || '',
            r.puissance ?? '',
            '',                          // CYLINDRE — absent du schéma
            r.immatriculation || '',
            r.usage || '',               // LIB_CATEGORIE_TARIFAIRE
            '',                          // remorque — absent du schéma
            r.nb_places ?? '',
            fmtDate(r.dmc),
            r.pvid ?? '',                // chargevide
            r.ptac ?? '',                // chargetotale
        ]);
    }

    sheet.columns.forEach((col) => { col.width = 16; });

    return workbook;
}