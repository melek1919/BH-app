import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  FileText,
  Car,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Pencil,
  Clock,
  Users,
  CalendarPlus,
  Search,
  Building2,
  Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { vehiculesApi, tarificationApi } from "../services/api";
import { USAGE_OPTIONS, USAGE_TAG } from "../components/usageConfig";
import AutocompleteUsage from "../components/AutocompleteUsage";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const STATUT_STYLE = {
  actif: { bg: "#E7F5EC", fg: "#1E7B3A", label: "Actif" },
  retire: { bg: "#F1F2F4", fg: "#6B7684", label: "Retiré" },
};

function StatusBadge({ statut }) {
  const s = STATUT_STYLE[statut] || STATUT_STYLE.retire;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20, backgroundColor: s.bg, color: s.fg, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

const EMPTY_FORM = { immatriculation: "", usage: "", marque: "", type_vehicule: "", numero_serie: "", bonus_malus: "", puissance: "", nb_places: "", dmc: "", ptac: "", pvid: "" };

// Modale unique ajout/modification — pas de champ établissement (le contrat fixe déjà le contexte).
// Reste ouverte après un ajout réussi, comme sur VehiculesPage.
function VehiculeModal({ mode = "create", initialData, contrat, onClose, onSubmit, submitting, justCreated }) {
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
    if (!form.immatriculation.trim()) nextErrors.immatriculation = "Champ requis";
    if (!form.nb_places) nextErrors.nb_places = "Champ requis";
    else if (!/^[0-9]+$/.test(form.nb_places)) nextErrors.nb_places = "Doit être un nombre";
    if (form.puissance && !/^[0-9]+$/.test(form.puissance)) nextErrors.puissance = "Doit être un nombre";
    if (!form.usage) nextErrors.usage = "Champ requis";
    const ptacRequired = form.usage === "VEHICULES COMMERC. PLUS DE 3.5 T (U2)" || form.usage === "REMORQUES AGRICOLES PLUS DE 3.5 T";
    if (ptacRequired && !form.ptac) nextErrors.ptac = "PTAC requis pour cet usage";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(form);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.35)", zIndex: 60 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 p-4 modal-pop" style={{ width: 420, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div className="d-flex align-items-center justify-content-between mb-1">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>
            {mode === "edit" ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}><X size={18} color={MUTED} /></button>
        </div>
        <p style={{ fontSize: 12, color: MUTED, margin: "0 0 12px", fontFamily: "monospace" }}>Contrat {contrat.numero_police}</p>

        {showSuccess && (
          <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style={{ background: "#E7F5EC", color: "#1E7B3A", fontSize: 12.5 }}>
            <CheckCircle2 size={15} /> Véhicule ajouté — vous pouvez en saisir un autre.
          </div>
        )}

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Immatriculation *</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: errors.immatriculation ? "#B3261E" : BORDER }} value={form.immatriculation} onChange={update("immatriculation")} placeholder="123 TUN 0000" />
            {errors.immatriculation && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.immatriculation}</p>}
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Marque</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} placeholder="Renault" value={form.marque} onChange={update("marque")} />
          </div>
        </div>

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Usage *</label>
        <AutocompleteUsage value={form.usage} onChange={(val) => setForm({ ...form, usage: val })} error={errors.usage} />
        {errors.usage && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.usage}</p>}

        <div className="row g-2">
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>N° série</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.numero_serie} onChange={update("numero_serie")} />
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Puissance</label>
            <input className="form-control" type="number" style={{ fontSize: 13, borderColor: errors.puissance ? "#B3261E" : BORDER }} value={form.puissance} onChange={update("puissance")} />
            {errors.puissance && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.puissance}</p>}
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Places *</label>
            <input type="number" className="form-control" style={{ fontSize: 13, borderColor: errors.nb_places ? "#B3261E" : BORDER }} value={form.nb_places} onChange={update("nb_places")} />
            {errors.nb_places && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.nb_places}</p>}
          </div>
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Type véhicule</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.type_vehicule || ""} onChange={update("type_vehicule")} placeholder="Berline, SUV, Camion..." />
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Bonus Malus</label>
            <input className="form-control" type="number" step="0.01" style={{ fontSize: 13, borderColor: BORDER }} value={form.bonus_malus || ""} onChange={update("bonus_malus")} placeholder="0.00" />
          </div>
        </div>

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Mise en circulation</label>
        <input type="date" className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.dmc || ""} onChange={update("dmc")} />

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>
              PTAC {form.usage === "VEHICULES COMMERC. PLUS DE 3.5 T (U2)" || form.usage === "REMORQUES AGRICOLES PLUS DE 3.5 T" ? "*" : ""}
            </label>
            <input className="form-control" type="number" step="0.01" style={{ fontSize: 13, borderColor: errors.ptac ? "#B3261E" : BORDER }} value={form.ptac || ""} onChange={update("ptac")} placeholder="0.00" />
            {errors.ptac && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.ptac}</p>}
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>PVID</label>
            <input className="form-control" type="number" step="0.01" style={{ fontSize: 13, borderColor: BORDER }} value={form.pvid || ""} onChange={update("pvid")} placeholder="0.00" />
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button className="btn flex-grow-1" style={{ fontSize: 13, borderColor: BORDER, color: MUTED }} onClick={onClose} disabled={submitting}>Annuler</button>
          <button className="btn flex-grow-1 text-white d-flex align-items-center justify-content-center gap-2" style={{ fontSize: 13, backgroundColor: NAVY, borderColor: NAVY }} onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 size={14} className="spin" />}
            {mode === "edit" ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Modale détail tarification
// ---------------------------------------------------------------
function TarificationDetailModal({ data, onClose }) {
  const { vehicule, detail } = data;
  const tag = USAGE_TAG(vehicule.usage);
  const f = (n) => (n != null ? Number(n).toFixed(2) : "—");

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.4)", zIndex: 70, backdropFilter: "blur(2px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 modal-pop" style={{ width: 430, maxWidth: "92vw", padding: 0, boxShadow: "0 16px 48px rgba(11,31,56,0.25)" }}>
        {/* Header minimal */}
        <div className="d-flex align-items-center justify-content-between px-3" style={{ paddingTop: 14, paddingBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
          <div className="d-flex align-items-center gap-2">
            <span className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 30, height: 30, backgroundColor: "#F3E8FD" }}>
              <Car size={14} color="#6B3FA0" />
            </span>
            <span className="fw-semibold" style={{ fontSize: 14, color: "#161B22" }}>{vehicule.immatriculation || "Véhicule"}</span>
          </div>
          <button className="btn btn-sm border-0 p-0" onClick={onClose}><X size={16} color={MUTED} /></button>
        </div>

        {/* Infos véhicule — ligne compacte */}
        <div className="d-flex flex-wrap gap-1 px-3" style={{ paddingTop: 10, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
          <Chip label={vehicule.marque || "—"} />
          <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, backgroundColor: tag.bg, color: tag.fg }}>{vehicule.usage || "—"}</span>
          <Chip label={vehicule.puissance ? `${vehicule.puissance} CV` : "—"} />
          <Chip label={`${vehicule.nb_places ?? "—"} pl.`} />
          {vehicule.ptac ? <Chip label={`PTAC ${vehicule.ptac} t`} /> : null}
        </div>

        {/* Détail des primes — tout en une seule liste */}
        <div style={{ padding: "8px 12px 4px" }}>
          <div className="rounded-2" style={{ border: `1px solid ${BORDER}` }}>
            <Row label="Variable (RC base)" value={detail.variable} />
            <Row label="RC" value={detail.RC} />
            <Row label="FGA" value={detail.FGA} />
            <Row label="CFFGA" value={detail.CFFGA} />
            <Row label="FSSR" value={detail.FSSR} />
            <Row label="FPAC" value={detail.FPAC} />
            <Row label="Frais d'adhésion" value={detail.fraisAdhesion} />
            <Row label="Défense & Recours" value={detail.DR} />
            <Row label="TUA" value={detail.TUA} />
            <Row label="Total sans PTA" value={detail.totalSansPTA} bold />
          </div>

          {/* PTA */}
          <div className="rounded-2 mt-1" style={{ border: `1px solid ${BORDER}` }}>
            <Row label={`Prime PTA (2 × ${vehicule.nb_places || 0} pl.)`} value={detail.primePTA} />
            <Row label="TUA / PTA" value={detail.TUA_PTA} />
          </div>
        </div>

        {/* Prime nette totale — badge en bas */}
        <div className="px-3" style={{ paddingTop: 6, paddingBottom: 14 }}>
          <div className="rounded-2 text-center" style={{ padding: "6px 0", background: "linear-gradient(135deg, #F3E8FD 0%, #EDE4F7 100%)" }}>
            <span style={{ fontSize: 11, color: "#6B3FA0", fontWeight: 500 }}>Prime nette totale : </span>
            <span style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700, color: "#6B3FA0" }}>{f(detail.primeNetteTotale)} DT</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  const f = (n) => (n != null ? Number(n).toFixed(2) : "—");
  return (
    <div className="d-flex align-items-center justify-content-between px-2" style={{ paddingTop: 4, paddingBottom: 4, borderBottom: "1px solid #F0F2F5" }}>
      <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: bold ? 600 : 400, color: "#161B22" }}>{f(value)} DT</span>
    </div>
  );
}

function Chip({ label }) {
  return <span style={{ fontSize: 11, color: MUTED, padding: "2px 8px", borderRadius: 20, backgroundColor: "#F5F6F8" }}>{label}</span>;
}

// ---------------------------------------------------------------
// Fiche contrat — header simple + accent créatif, liste des véhicules
// alignée sur le style de VehiculesPage (table, tags usage, badges).
// Accès uniquement via clic sur un contrat dans la popup établissement.
// ---------------------------------------------------------------
export default function ContratPage({ contrat, etablissement, onBack }) {
  const { user } = useAuth();
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("actif");
  const [tarif, setTarif] = useState(null);

  const [modalMode, setModalMode] = useState(null); // "create" | "edit" | null
  const [editingVehicule, setEditingVehicule] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [toast, setToast] = useState(null);
  const [tarifVehicule, setTarifVehicule] = useState(null);

  const loadVehicules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vehiculesApi.getByContrat(contrat.id);
      setVehicules(data);
      tarificationApi.calcContrat(data).then(setTarif).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicules(); }, [contrat.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicules.filter((v) => {
      const matchesSearch = !q || (v.immatriculation || "").toLowerCase().includes(q) || (v.marque || "").toLowerCase().includes(q);
      const matchesStatut = !statutFilter || v.statut_retrait === statutFilter;
      return matchesSearch && matchesStatut;
    });
  }, [vehicules, search, statutFilter]);

  const stats = useMemo(() => {
    const actifs = vehicules.filter((v) => v.statut_retrait === "actif");
    const joursRestants = contrat.validite_au ? Math.ceil((new Date(contrat.validite_au) - new Date()) / 86400000) : null;

    const totalPlaces = actifs.reduce((sum, v) => sum + (Number(v.nb_places) || 0), 0);

    // Véhicules ajoutés plus d'un jour après la création du contrat = mise en circulation en cours d'année
    const ajoutesEnCoursAnnee = contrat.created_at
      ? vehicules.filter((v) => v.created_at && new Date(v.created_at) - new Date(contrat.created_at) > 86400000).length
      : 0;

    const repartitionUsage = Object.values(
      actifs.reduce((acc, v) => {
        const key = v.usage || "Non renseigné";
        if (!acc[key]) acc[key] = { name: key, value: 0, ...USAGE_TAG(key) };
        acc[key].value += 1;
        return acc;
      }, {})
    );

    return { joursRestants, totalPlaces, ajoutesEnCoursAnnee, repartitionUsage };
  }, [vehicules, contrat.validite_au, contrat.created_at]);

  const buildPayload = (form) => ({
    contrat_id: contrat.id,
    immatriculation: form.immatriculation,
    usage: form.usage,
    marque: form.marque || null,
    type_vehicule: form.type_vehicule || null,
    numero_serie: form.numero_serie || null,
    bonus_malus: form.bonus_malus ? Number(form.bonus_malus) : null,
    puissance: form.puissance ? Number(form.puissance) : null,
    nb_places: Number(form.nb_places),
    dmc: form.dmc || null,
    ptac: form.ptac ? Number(form.ptac) : null,
    pvid: form.pvid ? Number(form.pvid) : null,
  });

  const openCreate = () => { setEditingVehicule(null); setJustCreated(false); setModalMode("create"); };
  const openEdit = (v) => { setEditingVehicule(v); setJustCreated(false); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setEditingVehicule(null); setJustCreated(false); };

  const handleSubmitModal = async (form) => {
    setSubmitting(true);
    try {
      if (modalMode === "edit") {
        await vehiculesApi.update(editingVehicule.id, buildPayload(form));
        setToast("Véhicule mis à jour");
        closeModal();
      } else {
        await vehiculesApi.create(buildPayload(form));
        setToast("Véhicule ajouté");
        setJustCreated(true); // reste ouverte : reset du formulaire + bandeau de succès
      }
      loadVehicules();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatut = async (v) => {
    try {
      if (v.statut_retrait === "actif") await vehiculesApi.retirer(v.id);
      else await vehiculesApi.restaurer(v.id);
      loadVehicules();
    } catch (err) {
      alert(err.message);
    }
  };

  const echeanceProche = stats.joursRestants != null && stats.joursRestants <= 30;

  return (
    <div>
      <button className="btn d-flex align-items-center gap-2 mb-3" style={{ fontSize: 13, fontWeight: 600, backgroundColor: "#EEF2F7", color: NAVY, borderRadius: 8, padding: "8px 14px", border: "1px solid " + BORDER, boxShadow: "0 2px 6px rgba(11,31,56,0.08)" }} onClick={onBack}>
        <ArrowLeft size={15} /> Retour
      </button>

      {toast && (
        <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style={{ background: "#E7F5EC", color: "#1E7B3A", fontSize: 12.5, width: "fit-content" }}>
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      {/* Info contrat + Répartition par usage, sur la même ligne */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-5">
          <div className="rounded-4 p-3 h-100" style={{ backgroundColor: "#fff", border: "1px solid " + BORDER, boxShadow: "0 2px 8px rgba(11,31,56,0.08)" }}>
            <p className="mb-2" style={{ fontSize: 11.5, color: MUTED, fontWeight: 500 }}>Info contrat</p>

            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 28, height: 28, backgroundColor: "#EAF1FB", flexShrink: 0 }}>
                <FileText size={13} color="#2B6CB0" />
              </span>
              <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "#161B22" }}>{contrat.numero_police}</span>
            </div>

            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 28, height: 28, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                <Building2 size={13} color={NAVY} />
              </span>
              <span style={{ fontSize: 12.5, color: "#161B22" }}>{etablissement?.nom || "—"}</span>
            </div>

            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 28, height: 28, backgroundColor: "#F6EFDE", flexShrink: 0 }}>
                <Calendar size={13} color="#A15C00" />
              </span>
              <span style={{ fontSize: 12.5, color: "#161B22" }}>
                {contrat.validite_du && contrat.validite_au
                  ? `${new Date(contrat.validite_du).toLocaleDateString("fr-FR")} → ${new Date(contrat.validite_au).toLocaleDateString("fr-FR")}`
                  : "—"}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 28, height: 28, backgroundColor: echeanceProche ? "#FDF1DE" : "#E7F5EC", flexShrink: 0 }}>
                <Clock size={13} color={echeanceProche ? "#A15C00" : "#1E7B3A"} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: echeanceProche ? "#A15C00" : "#1E7B3A" }}>
                {stats.joursRestants == null ? "—" : stats.joursRestants < 0 ? "Contrat expiré" : echeanceProche ? `Échéance dans ${stats.joursRestants}j` : "En cours"}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 28, height: 28, backgroundColor: "#F3E8FD", flexShrink: 0 }}>
                <FileText size={13} color="#6B3FA0" />
              </span>
              <span style={{ fontSize: 12.5, color: "#161B22" }}>
                <span style={{ color: MUTED }}>Prime TTC : </span>
                <span className="fw-semibold">{tarif ? `${tarif.primeTTC.toFixed(2)} DT` : "..."}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-7">
          <div className="rounded-4 p-3 h-100" style={{ backgroundColor: "#fff", border: "1px solid " + BORDER, boxShadow: "0 2px 8px rgba(11,31,56,0.08)" }}>
            <p className="mb-2" style={{ fontSize: 11.5, color: MUTED, fontWeight: 500 }}>Répartition par usage</p>
            {stats.repartitionUsage.length === 0 ? (
              <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Aucun véhicule actif</p>
            ) : (
              <div className="d-flex align-items-center gap-4">
                <div className="position-relative" style={{ width: 132, height: 132, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.repartitionUsage} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={3} stroke="none" strokeWidth={0}>
                        {stats.repartitionUsage.map((d, i) => <Cell key={i} fill={d.fg} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} véhicule${v > 1 ? "s" : ""}`, n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid " + BORDER }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Total au centre du donut — actifs, différent du compteur total de la liste */}
                  <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ pointerEvents: "none" }}>
                    <p className="mb-0 fw-bold" style={{ fontSize: 22, color: "#161B22", lineHeight: 1 }}>
                      {stats.repartitionUsage.reduce((sum, d) => sum + d.value, 0)}
                    </p>
                    <p className="mb-0" style={{ fontSize: 9.5, color: MUTED }}>actifs</p>
                  </div>
                </div>
                <div className="flex-grow-1">
                  {stats.repartitionUsage.map((d, i) => (
                    <div key={i} className="d-flex align-items-center gap-2 mb-2">
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: d.fg, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: "#161B22" }}>{d.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginLeft: "auto" }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
        <div className="d-flex gap-2 flex-wrap">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>Véhicules ({vehicules.length})</p>
          <div className="position-relative">
            <Search size={13} color={MUTED} style={{ position: "absolute", left: 10, top: 9 }} />
            <input
              className="form-control rounded-3"
              style={{ fontSize: 12.5, paddingLeft: 30, width: 220, borderColor: BORDER, height: 32 }}
              placeholder="Rechercher..."
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
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: 6,
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
        {user?.role !== 'guest' && (
          <button className="btn d-flex align-items-center gap-2 text-white rounded-3" style={{ fontSize: 13, padding: "8px 14px", backgroundColor: NAVY, borderColor: NAVY, boxShadow: "0 2px 6px rgba(11,31,56,0.18)" }} onClick={openCreate}>
            <Plus size={14} /> Ajouter un véhicule
          </button>
        )}
      </div>

      {error && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 13 }}>
          <AlertCircle size={16} /> {error}
          <button className="btn btn-sm ms-auto" style={{ fontSize: 12, color: "#B3261E", textDecoration: "underline" }} onClick={loadVehicules}>Réessayer</button>
        </div>
      )}

      {/* Table alignée sur VehiculesPage.jsx */}
      <div className="rounded-4 bg-white overflow-hidden" style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(11,31,56,0.04)" }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5" style={{ color: MUTED, fontSize: 13 }}>
            <Loader2 size={18} className="spin me-2" /> Chargement des véhicules...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-center" style={{ color: MUTED, fontSize: 13 }}>
            {vehicules.length === 0 ? "Aucun véhicule sur ce contrat — commence par en ajouter un." : "Aucun véhicule ne correspond à cette recherche."}
          </div>
        ) : (
          <table className="w-100" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid " + BORDER, backgroundColor: "#FAFBFC" }}>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 16px" }}>Véhicule</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Usage</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "center", padding: "12px 8px" }}>Puissance</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "center", padding: "12px 8px" }}>Places</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "right", padding: "12px 16px" }}>Total</th>
                <th style={{ padding: "12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const tag = USAGE_TAG(v.usage);
                const isActif = v.statut_retrait === "actif";
                const detail = tarif?.details?.find((d) => d.immatriculation === v.immatriculation);
                return (
                  <tr
                    key={v.id}
                    style={{ borderBottom: "1px solid " + BORDER, transition: "background-color 0.15s ease", cursor: detail ? "pointer" : "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    onClick={() => detail && setTarifVehicule({ vehicule: v, detail })}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="d-flex align-items-center justify-content-center rounded-3"
                          style={{ width: 34, height: 34, backgroundColor: "#EEF2F7", flexShrink: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Car size={15} color={NAVY} />
                        </span>
                        <div>
                          <p className="mb-0 fw-medium" style={{ fontSize: 13, fontFamily: "monospace" }}>{v.immatriculation || "—"}</p>
                          <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>{v.marque || "Marque inconnue"}{v.numero_serie ? ` · ${v.numero_serie}` : ""}</p>
                        </div>
                      </div>
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
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {detail ? (
                        <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20, backgroundColor: "#F3E8FD", color: "#6B3FA0", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                          {detail.totalSansPTA.toFixed(2)} DT
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: MUTED }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="d-flex align-items-center gap-2 justify-content-end">
                        {user?.role !== 'guest' && (
                          <button
                            className="btn btn-sm d-flex align-items-center gap-1 border-0"
                            style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#EAF1FB", color: "#2B6CB0", borderRadius: 8 }}
                            onClick={(e) => { e.stopPropagation(); openEdit(v); }}
                          >
                            <Pencil size={13} /> Modifier
                          </button>
                        )}
                        {user?.role !== 'guest' && (
                          <button
                            className="btn btn-sm d-flex align-items-center gap-1 border-0"
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              borderRadius: 8,
                              backgroundColor: isActif ? "#FBE7E7" : "#E7F5EC",
                              color: isActif ? "#B3261E" : "#1E7B3A",
                            }}
                            onClick={(e) => { e.stopPropagation(); toggleStatut(v); }}
                          >
                            {isActif ? (<><Trash2 size={13} /> Retirer</>) : (<><RotateCcw size={13} /> Restaurer</>)}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {tarifVehicule && (
        <TarificationDetailModal
          data={tarifVehicule}
          onClose={() => setTarifVehicule(null)}
        />
      )}

      {modalMode && (
        <VehiculeModal
          mode={modalMode}
          contrat={contrat}
          initialData={
            modalMode === "edit" && editingVehicule
              ? {
                  immatriculation: editingVehicule.immatriculation || "",
                  usage: editingVehicule.usage || USAGE_OPTIONS[0],
                  marque: editingVehicule.marque || "",
                  numero_serie: editingVehicule.numero_serie || "",
                  puissance: editingVehicule.puissance || "",
                  nb_places: editingVehicule.nb_places || "",
                  dmc: editingVehicule.dmc ? String(editingVehicule.dmc).slice(0, 10) : "",
                }
              : null
          }
          onClose={closeModal}
          onSubmit={handleSubmitModal}
          submitting={submitting}
          justCreated={justCreated}
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