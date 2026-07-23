import { useEffect, useMemo, useRef, useState } from "react";
import { Car, Search, Plus, X, RotateCcw, Trash2, Pencil, Loader2, AlertCircle, CheckCircle2, Upload, FileSpreadsheet } from "lucide-react";
import { vehiculesApi, etablissementsApi, importApi } from "../services/api";

// Couleurs de marque — mêmes tokens que SidebarLayout.jsx / DashboardPage.jsx
const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const USAGE_OPTIONS = [
  "Véhicule de tourisme",
  "Motocycle max 50 cm3",
  "Motocycle 50-125cm3",
  "Véhicule sanitaire",
  "Engins de chantier",
];

// Couleur d'accent selon le type d'usage, pour repérer visuellement les catégories dans la table
const USAGE_TAG = (usage = "") => {
  const u = usage.toLowerCase();
  if (u.includes("moto")) return { bg: "#EAF1FB", fg: "#2B6CB0" };
  if (u.includes("sanitaire")) return { bg: "#FBE7E7", fg: "#B3261E" };
  if (u.includes("engin")) return { bg: "#FDF1DE", fg: "#A15C00" };
  return { bg: "#EEF2F7", fg: NAVY }; // tourisme / défaut
};

const STATUT_STYLE = {
  actif: { bg: "#E7F5EC", fg: "#1E7B3A", label: "Actif" },
  retire: { bg: "#F1F2F4", fg: "#6B7684", label: "Retiré" },
};

const EMPTY_FORM = {
  etablissement_id: "",
  immatriculation: "",
  usage: USAGE_OPTIONS[0],
  marque: "",
  numero_serie: "",
  puissance: "",
  nb_places: "",
};

function StatusBadge({ statut }) {
  const s = STATUT_STYLE[statut] || STATUT_STYLE.retire;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20, backgroundColor: s.bg, color: s.fg, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

// Modale unique pour ajout ET modification — le mode change juste le titre,
// le libellé du bouton, et si les champs sont préremplis.
// En mode création, la modale reste ouverte après un ajout réussi (le formulaire
// se vide pour en saisir un autre) — seul le X ferme la modale dans ce cas.
function VehiculeModal({ mode = "create", initialData, etablissements, onClose, onSubmit, submitting, justCreated }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (justCreated) {
      setForm(EMPTY_FORM);
      setErrors({});
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [justCreated]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    const nextErrors = {};
    if (!form.etablissement_id) nextErrors.etablissement_id = "Champ requis";
    if (!form.immatriculation.trim()) nextErrors.immatriculation = "Champ requis";
    if (!form.nb_places) nextErrors.nb_places = "Champ requis";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(form);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.35)", zIndex: 50 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 p-4 modal-pop" style={{ width: 420, maxWidth: "92vw" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>
            {mode === "edit" ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}>
            <X size={18} color={MUTED} />
          </button>
        </div>

        {showSuccess && (
          <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style={{ background: "#E7F5EC", color: "#1E7B3A", fontSize: 12.5 }}>
            <CheckCircle2 size={15} /> Véhicule ajouté — vous pouvez en saisir un autre.
          </div>
        )}

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "10px 0 4px" }}>Établissement *</label>
        <select
          className="form-select"
          style={{ fontSize: 13, borderColor: errors.etablissement_id ? "#B3261E" : BORDER }}
          value={form.etablissement_id}
          onChange={update("etablissement_id")}
        >
          <option value="">Sélectionner...</option>
          {etablissements.map((e) => (
            <option key={e.id} value={e.id}>{e.nom}</option>
          ))}
        </select>
        {errors.etablissement_id && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.etablissement_id}</p>}

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "10px 0 4px" }}>Immatriculation *</label>
            <input
              className="form-control"
              style={{ fontSize: 13, borderColor: errors.immatriculation ? "#B3261E" : BORDER }}
              placeholder="123 TUN 0000"
              value={form.immatriculation}
              onChange={update("immatriculation")}
            />
            {errors.immatriculation && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.immatriculation}</p>}
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "10px 0 4px" }}>Marque</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} placeholder="Renault" value={form.marque} onChange={update("marque")} />
          </div>
        </div>

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "10px 0 4px" }}>Usage *</label>
        <select className="form-select" style={{ fontSize: 13, borderColor: BORDER }} value={form.usage} onChange={update("usage")}>
          {USAGE_OPTIONS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <div className="row g-2">
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "10px 0 4px" }}>N° série</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.numero_serie} onChange={update("numero_serie")} />
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "10px 0 4px" }}>Puissance</label>
            <input className="form-control" type="number" style={{ fontSize: 13, borderColor: BORDER }} value={form.puissance} onChange={update("puissance")} />
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "10px 0 4px" }}>Places *</label>
            <input
              className="form-control"
              type="number"
              style={{ fontSize: 13, borderColor: errors.nb_places ? "#B3261E" : BORDER }}
              value={form.nb_places}
              onChange={update("nb_places")}
            />
            {errors.nb_places && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.nb_places}</p>}
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button className="btn flex-grow-1" style={{ fontSize: 13, borderColor: BORDER, color: MUTED }} onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button
            className="btn flex-grow-1 text-white d-flex align-items-center justify-content-center gap-2"
            style={{ fontSize: 13, backgroundColor: NAVY, borderColor: NAVY }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 size={14} className="spin" />}
            {mode === "edit" ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Import en masse — dry-run (aperçu + erreurs) puis confirmation.
// Aucune donnée n'est écrite tant que l'utilisateur n'a pas validé l'aperçu.
// ---------------------------------------------------------------
function ImportVehiculesModal({ onClose, onImported }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload"); // "upload" | "checking" | "preview" | "committing" | "done"
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const resetFile = () => {
    setFile(null);
    setSummary(null);
    setError(null);
    setStep("upload");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setStep("checking");
    try {
      const result = await importApi.dryRunVehicules(f);
      setSummary(result);
      setStep("preview");
    } catch (err) {
      setError(err.message);
      setStep("upload");
    }
  };

  const handleConfirm = async () => {
    setStep("committing");
    setError(null);
    try {
      const result = await importApi.commitVehicules(file);
      setSummary(result);
      setStep("done");
      onImported?.();
    } catch (err) {
      setError(err.message);
      setStep("preview");
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.35)", zIndex: 60 }}
      onClick={(e) => e.target === e.currentTarget && step !== "committing" && onClose()}
    >
      <div className="bg-white rounded-4 p-4" style={{ width: 480, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div className="d-flex align-items-center justify-content-between mb-1">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>Import en masse — Véhicules</p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose} disabled={step === "committing"}>
            <X size={18} color={MUTED} />
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: MUTED, margin: "0 0 14px" }}>
          Colonnes attendues : N° Police, Immatriculation, Usage, Type, N° Série, Bonus Malus, Marque, Puissance, PVID, PTAC, Nb Places, Date Mise en Circulation.
        </p>

        {error && (
          <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 12.5 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {step === "upload" && (
          <label
            className="d-flex flex-column align-items-center justify-content-center gap-2 rounded-4"
            style={{ border: `2px dashed ${BORDER}`, backgroundColor: "#FAFBFC", padding: "36px 20px", cursor: "pointer" }}
          >
            <Upload size={24} color={MUTED} />
            <p className="mb-0" style={{ fontSize: 13, fontWeight: 500, color: "#161B22" }}>Clique pour choisir un fichier .xlsx</p>
            <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>Rien n'est importé avant confirmation</p>
            <input ref={fileRef} type="file" accept=".xlsx" className="d-none" onChange={handleFileChange} />
          </label>
        )}

        {step === "checking" && (
          <div className="d-flex flex-column align-items-center justify-content-center gap-2" style={{ padding: "36px 20px" }}>
            <Loader2 size={22} className="spin" color={NAVY} />
            <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>Analyse du fichier...</p>
          </div>
        )}

        {(step === "preview" || step === "committing" || step === "done") && summary && (
          <>
            <div className="d-flex align-items-center gap-2 mb-3">
              <FileSpreadsheet size={16} color={NAVY} />
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{file?.name}</span>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-4">
                <div className="rounded-3 p-2 text-center" style={{ backgroundColor: "#FAFBFC", border: `1px solid ${BORDER}` }}>
                  <p className="mb-0 fw-bold" style={{ fontSize: 19 }}>{summary.total}</p>
                  <p className="mb-0" style={{ fontSize: 10.5, color: MUTED }}>lignes</p>
                </div>
              </div>
              <div className="col-4">
                <div className="rounded-3 p-2 text-center" style={{ backgroundColor: "#E7F5EC", border: "1px solid #CBEAD6" }}>
                  <p className="mb-0 fw-bold" style={{ fontSize: 19, color: "#1E7B3A" }}>{summary.valides}</p>
                  <p className="mb-0" style={{ fontSize: 10.5, color: "#1E7B3A" }}>valides</p>
                </div>
              </div>
              <div className="col-4">
                <div className="rounded-3 p-2 text-center" style={{ backgroundColor: summary.erreurs ? "#FBE7E7" : "#FAFBFC", border: `1px solid ${summary.erreurs ? "#F0C9C9" : BORDER}` }}>
                  <p className="mb-0 fw-bold" style={{ fontSize: 19, color: summary.erreurs ? "#B3261E" : "#161B22" }}>{summary.erreurs}</p>
                  <p className="mb-0" style={{ fontSize: 10.5, color: summary.erreurs ? "#B3261E" : MUTED }}>erreurs</p>
                </div>
              </div>
            </div>

            {summary.detailErreurs?.length > 0 && (
              <div className="rounded-3 mb-3" style={{ border: `1px solid ${BORDER}`, maxHeight: 180, overflowY: "auto" }}>
                {summary.detailErreurs.map((e, i) => (
                  <div key={i} className="px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}`, fontSize: 11.5 }}>
                    <span style={{ fontWeight: 600, color: "#B3261E" }}>Ligne {e.ligne}</span>
                    <span style={{ color: MUTED }}> — {e.messages.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}

            {step === "done" ? (
              <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: "#E7F5EC", color: "#1E7B3A", fontSize: 12.5 }}>
                <CheckCircle2 size={15} /> {summary.inseres} véhicule{summary.inseres > 1 ? "s" : ""} importé{summary.inseres > 1 ? "s" : ""}.
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button className="btn flex-grow-1" style={{ fontSize: 13, borderColor: BORDER, color: MUTED }} onClick={resetFile} disabled={step === "committing"}>
                  Annuler
                </button>
                <button
                  className="btn flex-grow-1 text-white d-flex align-items-center justify-content-center gap-2"
                  style={{ fontSize: 13, backgroundColor: summary.valides === 0 ? "#B8BEC7" : NAVY, borderColor: summary.valides === 0 ? "#B8BEC7" : NAVY }}
                  onClick={handleConfirm}
                  disabled={step === "committing" || summary.valides === 0}
                >
                  {step === "committing" && <Loader2 size={14} className="spin" />}
                  Importer {summary.valides} véhicule{summary.valides > 1 ? "s" : ""}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VehiculesPage() {
  const [vehicules, setVehicules] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("actif");

  // Un seul state pilote la modale : null = fermée, "create" = ajout, "edit" = édition
  const [modalMode, setModalMode] = useState(null);
  const [editingVehicule, setEditingVehicule] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vehiculesData, etabData] = await Promise.all([
        statutFilter === "retire" ? vehiculesApi.getRetires() : vehiculesApi.getAll(),
        etablissementsApi.getAll(),
      ]);
      setVehicules(vehiculesData);
      setEtablissements(etabData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statutFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicules;
    const q = search.toLowerCase();
    return vehicules.filter((v) => {
      return (
        (v.immatriculation || "").toLowerCase().includes(q) ||
        (v.marque || "").toLowerCase().includes(q) ||
        (v.etablissement_nom || "").toLowerCase().includes(q)
      );
    });
  }, [vehicules, search]);

  const buildPayload = (form) => ({
    etablissement_id: Number(form.etablissement_id),
    immatriculation: form.immatriculation,
    usage: form.usage,
    marque: form.marque || null,
    numero_serie: form.numero_serie || null,
    puissance: form.puissance ? Number(form.puissance) : null,
    nb_places: Number(form.nb_places),
  });

  const openCreate = () => {
    setEditingVehicule(null);
    setJustCreated(false);
    setModalMode("create");
  };

  const openEdit = (v) => {
    setEditingVehicule(v);
    setJustCreated(false);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingVehicule(null);
    setJustCreated(false);
  };

  const handleSubmitModal = async (form) => {
    setSubmitting(true);
    try {
      if (modalMode === "edit") {
        await vehiculesApi.update(editingVehicule.id, buildPayload(form));
        closeModal();
      } else {
        await vehiculesApi.create(buildPayload(form));
        setJustCreated(true); // reste ouverte : reset du formulaire + bandeau de succès
      }
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatut = async (v) => {
    try {
      if (v.statut_retrait === "actif") {
        await vehiculesApi.retirer(v.id);
      } else {
        await vehiculesApi.restaurer(v.id);
      }
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalActifs = statutFilter === "actif" ? filtered.length : vehicules.filter((v) => v.statut_retrait === "actif").length;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <p className="mb-0 fw-semibold" style={{ fontSize: 18, color: "#161B22" }}>Véhicules</p>
          <p className="mb-0" style={{ fontSize: 13, color: MUTED }}>
            Gestion du parc automobile des établissements
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn d-flex align-items-center gap-2 rounded-3"
            style={{ fontSize: 13.5, padding: "9px 14px", borderColor: BORDER, color: NAVY }}
            onClick={() => setShowImport(true)}
          >
            <Upload size={15} /> Importer
          </button>
          <button
            className="btn d-flex align-items-center gap-2 text-white rounded-3"
            style={{ fontSize: 13.5, padding: "9px 16px", backgroundColor: NAVY, borderColor: NAVY, boxShadow: "0 2px 6px rgba(11,31,56,0.18)" }}
            onClick={openCreate}
          >
            <Plus size={15} /> Ajouter un véhicule
          </button>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative">
            <Search size={14} color={MUTED} style={{ position: "absolute", left: 12, top: 11 }} />
            <input
              className="form-control rounded-3"
              style={{ fontSize: 13, paddingLeft: 34, width: 280, borderColor: BORDER }}
              placeholder="Rechercher un véhicule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center rounded-3 p-1" style={{ backgroundColor: "#F1F2F4" }}>
            {[
              { key: "actif", label: "Actifs" },
              { key: "retire", label: "Retirés" },
            ].map((opt) => (
              <button
                key={opt.key}
                className="btn btn-sm border-0"
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  padding: "5px 14px",
                  borderRadius: 8,
                  backgroundColor: statutFilter === opt.key ? "#fff" : "transparent",
                  color: statutFilter === opt.key ? NAVY : MUTED,
                  boxShadow: statutFilter === opt.key ? "0 1px 3px rgba(11,31,56,0.12)" : "none",
                }}
                onClick={() => setStatutFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: 12.5, color: MUTED }}>
          {loading ? "Chargement..." : `${filtered.length} véhicule${filtered.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {error && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 13 }}>
          <AlertCircle size={16} /> {error}
          <button className="btn btn-sm ms-auto" style={{ fontSize: 12, color: "#B3261E", textDecoration: "underline" }} onClick={loadData}>
            Réessayer
          </button>
        </div>
      )}

      <div className="rounded-4 bg-white overflow-hidden" style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(11,31,56,0.04)" }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5" style={{ color: MUTED, fontSize: 13 }}>
            <Loader2 size={18} className="spin me-2" /> Chargement des véhicules...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-center" style={{ color: MUTED, fontSize: 13 }}>
            Aucun véhicule ne correspond à ces critères.
          </div>
        ) : (
          <table className="w-100" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#FAFBFC" }}>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 16px" }}>Véhicule</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Établissement</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Usage</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "center", padding: "12px 8px" }}>Puissance</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "center", padding: "12px 8px" }}>Places</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Statut</th>
                <th style={{ padding: "12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const tag = USAGE_TAG(v.usage);
                const isActif = v.statut_retrait === "actif";
                return (
                  <tr
                    key={v.id}
                    style={{ borderBottom: `1px solid ${BORDER}`, transition: "background-color 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 34, height: 34, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                          <Car size={15} color={NAVY} />
                        </span>
                        <div>
                          <p className="mb-0 fw-medium" style={{ fontSize: 13, fontFamily: "monospace" }}>{v.immatriculation || "—"}</p>
                          <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>{v.marque || "Marque inconnue"}{v.numero_serie ? ` · ${v.numero_serie}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 12.5, color: "#161B22" }}>
                      {v.etablissement_nom || "—"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 20, backgroundColor: tag.bg, color: tag.fg, whiteSpace: "nowrap" }}>
                        {v.usage || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 12.5, textAlign: "center", color: MUTED }}>
                      {v.puissance ? `${v.puissance} CV` : "—"}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 12.5, textAlign: "center", color: MUTED }}>
                      {v.nb_places ?? "—"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <StatusBadge statut={v.statut_retrait} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="d-flex align-items-center gap-2 justify-content-end">
                        <button
                          className="btn btn-sm d-flex align-items-center gap-1 border-0"
                          style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#EEF2F7", color: NAVY, borderRadius: 8 }}
                          onClick={() => openEdit(v)}
                        >
                          <Pencil size={13} /> Modifier
                        </button>
                        <button
                          className="btn btn-sm d-flex align-items-center gap-1 border-0"
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 8,
                            backgroundColor: isActif ? "#FBE7E7" : "#E7F5EC",
                            color: isActif ? "#B3261E" : "#1E7B3A",
                          }}
                          onClick={() => toggleStatut(v)}
                        >
                          {isActif ? (
                            <>
                              <Trash2 size={13} /> Retirer
                            </>
                          ) : (
                            <>
                              <RotateCcw size={13} /> Restaurer
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalMode && (
        <VehiculeModal
          mode={modalMode}
          initialData={
            modalMode === "edit" && editingVehicule
              ? {
                  etablissement_id: String(editingVehicule.etablissement_id),
                  immatriculation: editingVehicule.immatriculation || "",
                  usage: editingVehicule.usage || USAGE_OPTIONS[0],
                  marque: editingVehicule.marque || "",
                  numero_serie: editingVehicule.numero_serie || "",
                  puissance: editingVehicule.puissance || "",
                  nb_places: editingVehicule.nb_places || "",
                }
              : null
          }
          etablissements={etablissements}
          onClose={closeModal}
          onSubmit={handleSubmitModal}
          submitting={submitting}
          justCreated={justCreated}
        />
      )}

      {showImport && (
        <ImportVehiculesModal
          onClose={() => setShowImport(false)}
          onImported={loadData}
        />
      )}

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .form-control, .form-select {
          border-radius: 10px !important;
          transition: box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .form-control:focus, .form-select:focus {
          box-shadow: 0 0 0 3px rgba(11,31,56,0.10);
          outline: none;
        }
        .form-control::placeholder { color: #A9B2BE; }

        .btn { transition: transform 0.12s ease, box-shadow 0.18s ease, filter 0.15s ease; }
        .btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(0.98); }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>
    </div>
  );
}