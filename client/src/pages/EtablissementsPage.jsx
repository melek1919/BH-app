import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  Search,
  Plus,
  X,
  Pencil,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  User,
  ChevronRight,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { etablissementsApi, contratsApi, importApi } from "../services/api";
import Pagination from "../components/Pagination";
import SortBar from "../components/SortBar";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const EMPTY_ETAB_FORM = {
  nom: "",
  adresse: "",
  gouvernorat: "",
  identifiant_unique: "",
  telephone: "",
  responsable_parc_auto: "",
  mobile: "",
  email: "",
  statut_gias_prod: "",
  code_fiabilisation: "",
};

function EtablissementModal({ mode, initialData, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(initialData || EMPTY_ETAB_FORM);
  const [errors, setErrors] = useState({});
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    const nextErrors = {};
    if (!form.nom.trim()) nextErrors.nom = "Champ requis";
    else if (!/^[a-zA-Z\sàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ'-]+$/.test(form.nom.trim())) nextErrors.nom = "Doit contenir uniquement des lettres";
    
    if (!form.identifiant_unique.trim()) nextErrors.identifiant_unique = "Champ requis";
    
    if (form.telephone && !/^[0-9+\s-]+$/.test(form.telephone)) nextErrors.telephone = "Doit contenir uniquement des chiffres";
    if (form.mobile && !/^[0-9+\s-]+$/.test(form.mobile)) nextErrors.mobile = "Doit contenir uniquement des chiffres";
    if (form.email && !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(form.email)) nextErrors.email = "Format email invalide";
    
    if (form.responsable_parc_auto && !/^[a-zA-Z\sàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ'-]+$/.test(form.responsable_parc_auto.trim())) nextErrors.responsable_parc_auto = "Doit contenir uniquement des lettres";
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    // Convert empty strings to null for optional fields
    const payload = {
      nom: form.nom,
      identifiant_unique: form.identifiant_unique,
      adresse: form.adresse || null,
      gouvernorat: form.gouvernorat || null,
      telephone: form.telephone || null,
      responsable_parc_auto: form.responsable_parc_auto || null,
      mobile: form.mobile || null,
      email: form.email || null,
      statut_gias_prod: form.statut_gias_prod || null,
    };
    // Only include code_fiabilisation if it has a valid value
    if (form.code_fiabilisation && ['A', 'B', 'C', 'D', 'M'].includes(form.code_fiabilisation)) {
      payload.code_fiabilisation = form.code_fiabilisation;
    }
    onSubmit(payload);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.35)", zIndex: 60 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 p-4 modal-pop" style={{ width: 460, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>
            {mode === "edit" ? "Modifier l'établissement" : "Nouvel établissement"}
          </p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}><X size={18} color={MUTED} /></button>
        </div>

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Nom *</label>
        <input className="form-control" style={{ fontSize: 13, borderColor: errors.nom ? "#B3261E" : BORDER }} value={form.nom} onChange={update("nom")} placeholder="Ministère de..." />
        {errors.nom && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.nom}</p>}

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Identifiant unique *</label>
        <input className="form-control" style={{ fontSize: 13, borderColor: errors.identifiant_unique ? "#B3261E" : BORDER }} value={form.identifiant_unique} onChange={update("identifiant_unique")} placeholder="MIN-SANTE-001" />
        {errors.identifiant_unique && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.identifiant_unique}</p>}

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Adresse</label>
        <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.adresse || ""} onChange={update("adresse")} />

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Gouvernorat</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.gouvernorat || ""} onChange={update("gouvernorat")} />
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Responsable parc auto</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: errors.responsable_parc_auto ? "#B3261E" : BORDER }} value={form.responsable_parc_auto || ""} onChange={update("responsable_parc_auto")} />
            {errors.responsable_parc_auto && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.responsable_parc_auto}</p>}
          </div>
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Téléphone</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: errors.telephone ? "#B3261E" : BORDER }} value={form.telephone || ""} onChange={update("telephone")} />
            {errors.telephone && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.telephone}</p>}
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Mobile</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: errors.mobile ? "#B3261E" : BORDER }} value={form.mobile || ""} onChange={update("mobile")} />
            {errors.mobile && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.mobile}</p>}
          </div>
        </div>

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Email</label>
        <input className="form-control" style={{ fontSize: 13, borderColor: errors.email ? "#B3261E" : BORDER }} value={form.email || ""} onChange={update("email")} />
        {errors.email && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.email}</p>}

        <div className="d-flex gap-2 mt-4">
          <button className="btn flex-grow-1" style={{ fontSize: 13, borderColor: BORDER, color: MUTED }} onClick={onClose} disabled={submitting}>Annuler</button>
          <button className="btn flex-grow-1 text-white d-flex align-items-center justify-content-center gap-2" style={{ fontSize: 13, backgroundColor: NAVY, borderColor: NAVY }} onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 size={14} className="spin" />}
            {mode === "edit" ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewContratModal({ onClose, onSubmit, submitting }) {
  const [numeroPolice, setNumeroPolice] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!numeroPolice.trim()) return setError("Champ requis");
    onSubmit({ numero_police: numeroPolice });
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.4)", zIndex: 70 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-4 p-4 modal-pop" style={{ width: 360, maxWidth: "92vw" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>Nouveau contrat</p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}><X size={18} color={MUTED} /></button>
        </div>

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "6px 0 4px" }}>N° police *</label>
        <input className="form-control" style={{ fontSize: 13, borderColor: error ? "#B3261E" : BORDER }} value={numeroPolice} onChange={(e) => { setNumeroPolice(e.target.value); setError(""); }} placeholder="POL-2026-013" />
        {error && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{error}</p>}

        <div className="d-flex gap-2 mt-4">
          <button className="btn flex-grow-1" style={{ fontSize: 13, borderColor: BORDER, color: MUTED }} onClick={onClose} disabled={submitting}>Annuler</button>
          <button className="btn flex-grow-1 text-white d-flex align-items-center justify-content-center gap-2" style={{ fontSize: 13, backgroundColor: NAVY, borderColor: NAVY }} onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 size={14} className="spin" />}
            Créer le contrat
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickViewModal({ etablissement, onClose, onOpenContrat }) {
  const { user } = useAuth();
  const [contrats, setContrats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewContrat, setShowNewContrat] = useState(false);
  const [submittingContrat, setSubmittingContrat] = useState(false);

  const loadContrats = () => {
    setLoading(true);
    contratsApi
      .getByEtablissement(etablissement.id)
      .then((data) => setContrats(data))
      .catch(() => setContrats([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadContrats(); }, [etablissement.id]);

  const nbContrats = contrats?.length ?? 0;

  const handleCreateContrat = async (form) => {
    setSubmittingContrat(true);
    try {
      await contratsApi.create(etablissement.id, form);
      setShowNewContrat(false);
      loadContrats();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingContrat(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.4)", zIndex: 60, backdropFilter: "blur(2px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 p-4 modal-pop" style={{ width: 440, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(11,31,56,0.25)" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="d-flex align-items-center justify-content-center rounded-4" style={{ width: 40, height: 40, backgroundColor: "#EEF2F7" }}>
              <Building2 size={18} color={NAVY} />
            </span>
            <div>
              <p className="mb-0 fw-semibold" style={{ fontSize: 15.5 }}>{etablissement.nom}</p>
              <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>{etablissement.identifiant_unique}</p>
            </div>
          </div>
          <button className="btn btn-sm border-0 p-1" style={{ backgroundColor: "#F1F2F4", borderRadius: 8 }} onClick={onClose}><X size={16} color={MUTED} /></button>
        </div>

        <div className="rounded-3 p-2 mb-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
          <div className="row g-2" style={{ fontSize: 12 }}>
            <div className="col-6 d-flex align-items-center gap-2">
              <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 20, height: 20, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                <User size={10} color={NAVY} />
              </span>
              <span style={{ fontSize: 11.5 }}>{etablissement.responsable_parc_auto || "—"}</span>
            </div>
            <div className="col-6 d-flex align-items-center gap-2">
              <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 20, height: 20, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                <Phone size={10} color={NAVY} />
              </span>
              <span style={{ fontSize: 11.5 }}>{etablissement.telephone || etablissement.mobile || "—"}</span>
            </div>
            <div className="col-12 d-flex align-items-center gap-2">
              <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 20, height: 20, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                <Mail size={10} color={NAVY} />
              </span>
              <span style={{ fontSize: 11.5 }}>{etablissement.email || "—"}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-3" style={{ color: MUTED, fontSize: 13 }}>
            <Loader2 size={16} className="spin me-2" /> Chargement des contrats...
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <p className="mb-0 fw-semibold" style={{ fontSize: 14, color: "#161B22" }}>Contrats ({nbContrats})</p>
              </div>
              {user?.role !== 'guest' && (
                <button
                  className="btn d-flex align-items-center gap-2 border-0"
                  style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#EAF1FB", color: "#2B6CB0", borderRadius: 8, padding: "7px 13px", boxShadow: "0 2px 6px rgba(43,108,176,0.15)" }}
                  onClick={() => setShowNewContrat(true)}
                >
                  <Plus size={13} /> Nouveau contrat
                </button>
              )}
            </div>
            {nbContrats === 0 ? (
              <div className="text-center py-4 rounded-3" style={{ backgroundColor: "#F8FAFC", border: "1px dashed " + BORDER, fontSize: 13, color: MUTED }}>
                <p className="mb-0">Aucun contrat affecté pour l'instant</p>
                <p className="mb-0" style={{ fontSize: 12, marginTop: 4 }}>Cliquez sur "Nouveau contrat" pour commencer</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {contrats.map((c) => (
                  <button
                    key={c.id}
                    className="d-flex align-items-center justify-content-between rounded-3 px-3 py-2 border-0 w-100 text-start"
                    style={{ 
                      backgroundColor: "#fff", 
                      border: "1px solid " + BORDER,
                      boxShadow: "0 1px 3px rgba(11,31,56,0.05)",
                      transition: "all 0.2s ease" 
                    }}
                    onClick={() => onOpenContrat(etablissement, c)}
                    onMouseEnter={(ev) => {
                      ev.currentTarget.style.backgroundColor = "#F8FAFC";
                      ev.currentTarget.style.borderColor = "#2B6CB0";
                      ev.currentTarget.style.transform = "translateY(-1px)";
                      ev.currentTarget.style.boxShadow = "0 4px 12px rgba(11,31,56,0.1)";
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.backgroundColor = "#fff";
                      ev.currentTarget.style.borderColor = BORDER;
                      ev.currentTarget.style.transform = "translateY(0)";
                      ev.currentTarget.style.boxShadow = "0 1px 3px rgba(11,31,56,0.05)";
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 32, height: 32, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                        <FileText size={14} color={NAVY} />
                      </span>
                      <span style={{ fontSize: 12.5, fontFamily: "monospace", fontWeight: 600, color: "#161B22" }}>{c.numero_police}</span>
                    </div>
                    <ChevronRight size={16} color={MUTED} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showNewContrat && (
        <NewContratModal onClose={() => setShowNewContrat(false)} onSubmit={handleCreateContrat} submitting={submittingContrat} />
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

// ---------------------------------------------------------------
// Import en masse — dry-run (aperçu + erreurs) puis confirmation.
// N'utilise ni "code couleur" (fiabilisation) ni "Statut - GIAS PROD",
// même si ces colonnes sont présentes dans le fichier source.
// ---------------------------------------------------------------
function ImportEtablissementsModal({ onClose, onImported }) {
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
      const result = await importApi.dryRunEtablissements(f);
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
      const result = await importApi.commitEtablissements(file);
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
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>Import en masse — Établissements</p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose} disabled={step === "committing"}>
            <X size={18} color={MUTED} />
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: MUTED, margin: "0 0 14px" }}>
          Colonnes utilisées : N. Police (optionnel), Etablissement, ADRESSE, GOUVERNORAT, IDENTIFIANT UNIQUE, TEL, Resp parc auto, MOBILE, E-MAIL.
          "code couleur" et "Statut - GIAS PROD" ne sont pas importés même si présents.
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
                <CheckCircle2 size={15} />
                {summary.inseres} établissement{summary.inseres > 1 ? "s" : ""} importé{summary.inseres > 1 ? "s" : ""}
                {summary.contratsRattaches ? ` · ${summary.contratsRattaches} contrat${summary.contratsRattaches > 1 ? "s" : ""} rattaché${summary.contratsRattaches > 1 ? "s" : ""}` : ""}.
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
                  Importer {summary.valides} établissement{summary.valides > 1 ? "s" : ""}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function EtablissementsPage({ onOpenContrat, reopenEtablissement, onReopenConsumed }) {
  const { user } = useAuth();
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [gouvernoratFilter, setGouvernoratFilter] = useState("");
  const [contratsFilter, setContratsFilter] = useState("");

  const [etabModalMode, setEtabModalMode] = useState(null);
  const [editingEtab, setEditingEtab] = useState(null);
  // Si on revient de ContratPage, rouvre directement le popup de l'établissement
  // d'origine — la valeur initiale suffit car ce composant est remonté à chaque retour.
  const [quickView, setQuickView] = useState(reopenEtablissement || null);

  useEffect(() => {
    if (reopenEtablissement) onReopenConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showImport, setShowImport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const PER_PAGE = 20;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setEtablissements(await etablissementsApi.getAll());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = etablissements.filter((e) => {
      const matchesSearch = !q || e.nom.toLowerCase().includes(q) || (e.identifiant_unique || "").toLowerCase().includes(q) || (e.gouvernorat || "").toLowerCase().includes(q);
      const matchesGouvernorat = !gouvernoratFilter || e.gouvernorat === gouvernoratFilter;
      const hasContrats = (e.nb_contrats || 0) > 0;
      const matchesContrats = !contratsFilter || (contratsFilter === "avec" ? hasContrats : !hasContrats);
      return matchesSearch && matchesGouvernorat && matchesContrats;
    });
    list.sort((a, b) => {
      let va = sortKey === "nom" ? (a.nom || "").toLowerCase() : new Date(a[sortKey] || 0).getTime();
      let vb = sortKey === "nom" ? (b.nom || "").toLowerCase() : new Date(b[sortKey] || 0).getTime();
      if (sortKey === "nom") return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return list;
  }, [etablissements, search, gouvernoratFilter, contratsFilter, sortKey, sortDir]);

  useEffect(() => { setPage(1); }, [filtered.length]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openCreate = () => { setEditingEtab(null); setEtabModalMode("create"); };
  const openEdit = (e) => { setEditingEtab(e); setEtabModalMode("edit"); };
  const closeEtabModal = () => { setEtabModalMode(null); setEditingEtab(null); };

  const handleSubmitEtab = async (form) => {
    setSubmitting(true);
    try {
      if (etabModalMode === "edit") {
        await etablissementsApi.update(editingEtab.id, form);
        setToast("Établissement mis à jour");
      } else {
        await etablissementsApi.create(form);
        setToast("Établissement créé");
      }
      closeEtabModal();
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-end mb-0">
        <div className="d-flex gap-2">
          {user?.role !== 'guest' && (
            <button className="btn d-flex align-items-center gap-2 rounded-3" style={{ fontSize: 13.5, padding: "9px 14px", borderColor: BORDER, color: NAVY }} onClick={() => setShowImport(true)}>
              <Upload size={15} /> Importer
            </button>
          )}
          {user?.role !== 'guest' && (
            <button className="btn d-flex align-items-center gap-2 text-white rounded-3" style={{ fontSize: 13.5, padding: "9px 16px", backgroundColor: NAVY, borderColor: NAVY }} onClick={openCreate}>
              <Plus size={15} /> Nouvel établissement
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style={{ background: "#E7F5EC", color: "#1E7B3A", fontSize: 12.5, width: "fit-content" }}>
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
        <div className="d-flex gap-2 flex-wrap">
          <div className="position-relative">
            <Search size={14} color={MUTED} style={{ position: "absolute", left: 12, top: 11 }} />
            <input className="form-control rounded-3" style={{ fontSize: 13, paddingLeft: 34, width: 280, borderColor: BORDER }} placeholder="Rechercher un établissement..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
         
          <select
            className="form-select rounded-3"
            style={{ fontSize: 13, borderColor: BORDER, width: 160 }}
            value={contratsFilter}
            onChange={(e) => setContratsFilter(e.target.value)}
          >
            <option value="">Contrats</option>
            <option value="avec">Avec contrats</option>
            <option value="sans">Sans contrats</option>
          </select>

          <SortBar
            options={[
              { key: "created_at", label: "Date" },
              { key: "nom", label: "Alphabétique" },
            ]}
            sortKey={sortKey}
            sortDir={sortDir}
            onChange={(k, d) => { setSortKey(k); setSortDir(d); }}
          />
        </div>
        <span style={{ fontSize: 12.5, color: MUTED }}>{loading ? "Chargement..." : `${filtered.length} établissement${filtered.length > 1 ? "s" : ""}`}</span>
      </div>

      {error && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 13 }}>
          <AlertCircle size={16} /> {error}
          <button className="btn btn-sm ms-auto" style={{ fontSize: 12, color: "#B3261E", textDecoration: "underline" }} onClick={loadData}>Réessayer</button>
        </div>
      )}

      <div className="rounded-4 bg-white overflow-hidden" style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(11,31,56,0.04)" }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5" style={{ color: MUTED, fontSize: 13 }}>
            <Loader2 size={18} className="spin me-2" /> Chargement des établissements...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-center" style={{ color: MUTED, fontSize: 13 }}>Aucun établissement ne correspond à ces critères.</div>
        ) : (
          <>
            <table className="w-100" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#FAFBFC" }}>
                  <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 16px" }}>Établissement</th>
                  <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Gouvernorat</th>
                  <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Responsable</th>
                  <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Contact</th>
                  <th style={{ padding: "12px 16px" }}></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((e) => (
                  <tr
                    key={e.id}
                    style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer", transition: "background-color 0.15s ease" }}
                    onClick={() => setQuickView(e)}
                    onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "#FAFBFC")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 34, height: 34, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                          <Building2 size={15} color={NAVY} />
                        </span>
                        <div>
                          <p className="mb-0 fw-medium" style={{ fontSize: 13 }}>{e.nom}</p>
                          <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>{e.identifiant_unique}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 12.5, color: "#161B22" }}>{e.gouvernorat || "—"}</td>
                    <td style={{ padding: "12px 8px", fontSize: 12.5, color: "#161B22" }}>{e.responsable_parc_auto || "—"}</td>
                    <td style={{ padding: "12px 8px", fontSize: 12, color: MUTED }}>
                      {e.telephone || e.mobile || e.email || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        className="btn btn-sm d-flex align-items-center gap-1 border-0 ms-auto"
                        style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#EAF1FB", color: "#2B6CB0", borderRadius: 8 }}
                        onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                      >
                        <Pencil size={13} /> Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {etabModalMode && (
        <EtablissementModal mode={etabModalMode} initialData={etabModalMode === "edit" ? editingEtab : null} onClose={closeEtabModal} onSubmit={handleSubmitEtab} submitting={submitting} />
      )}

      {quickView && (
        <QuickViewModal
          etablissement={quickView}
          onClose={() => setQuickView(null)}
          onOpenContrat={(etab, contrat) => { onOpenContrat?.(etab, contrat); setQuickView(null); }}
        />
      )}

      {showImport && (
        <ImportEtablissementsModal onClose={() => setShowImport(false)} onImported={loadData} />
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