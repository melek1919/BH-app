import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Plus,
  X,
  Pencil,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Hash,
  Car,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { etablissementsApi, vehiculesApi } from "../services/api";

// Couleurs de marque — mêmes tokens que SidebarLayout.jsx / VehiculesPage.jsx
const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const GOUVERNORATS = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan",
  "Bizerte", "Béja", "Jendouba", "Le Kef", "Siliana", "Sousse",
  "Monastir", "Mahdia", "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid",
  "Gabès", "Médenine", "Tataouine", "Gafsa", "Tozeur", "Kébili",
];

const EMPTY_FORM = {
  nom: "",
  identifiant_unique: "",
  adresse: "",
  gouvernorat: GOUVERNORATS[0],
  responsable_parc_auto: "",
  telephone: "",
  mobile: "",
  email: "",
};

const EMPTY_CONTRAT_FORM = { numero_police: "", validite_du: "", validite_au: "" };

function ContratBadge({ etablissement }) {
  if (!etablissement.numero_police) {
    return (
      <span
        className="d-inline-flex align-items-center gap-1"
        style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20, backgroundColor: "#FDF1DE", color: "#A15C00" }}
      >
        <Hash size={12} /> Non affecté
      </span>
    );
  }
  return (
    <span
      style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20, backgroundColor: "#E7F5EC", color: "#1E7B3A", fontFamily: "monospace" }}
    >
      {etablissement.numero_police}
    </span>
  );
}

// Modale ajout / modification d'un établissement.
// Même comportement que VehiculeModal : en création, la modale reste ouverte
// après un ajout réussi et le formulaire se réinitialise.
function EtablissementModal({ mode = "create", initialData, onClose, onSubmit, submitting, justCreated }) {
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
    if (!form.nom.trim()) nextErrors.nom = "Champ requis";
    if (!form.identifiant_unique.trim()) nextErrors.identifiant_unique = "Champ requis";
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
      <div className="bg-white rounded-4 p-4" style={{ width: 460, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>
            {mode === "edit" ? "Modifier l'établissement" : "Ajouter un établissement"}
          </p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}>
            <X size={18} color={MUTED} />
          </button>
        </div>

        {showSuccess && (
          <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style={{ background: "#E7F5EC", color: "#1E7B3A", fontSize: 12.5 }}>
            <CheckCircle2 size={15} /> Établissement ajouté — vous pouvez en saisir un autre.
          </div>
        )}

        <div className="row g-2">
          <div className="col-8">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Nom de l'établissement *</label>
            <input
              className="form-control"
              style={{ fontSize: 13, borderColor: errors.nom ? "#B3261E" : BORDER }}
              placeholder="Ministère de l'Éducation"
              value={form.nom}
              onChange={update("nom")}
            />
            {errors.nom && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.nom}</p>}
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Identifiant *</label>
            <input
              className="form-control"
              style={{ fontSize: 13, borderColor: errors.identifiant_unique ? "#B3261E" : BORDER }}
              value={form.identifiant_unique}
              onChange={update("identifiant_unique")}
            />
            {errors.identifiant_unique && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.identifiant_unique}</p>}
          </div>
        </div>

        <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Adresse</label>
        <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.adresse} onChange={update("adresse")} />

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Gouvernorat</label>
            <select className="form-select" style={{ fontSize: 13, borderColor: BORDER }} value={form.gouvernorat} onChange={update("gouvernorat")}>
              {GOUVERNORATS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Responsable parc auto</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.responsable_parc_auto} onChange={update("responsable_parc_auto")} />
          </div>
        </div>

        <div className="row g-2">
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Téléphone</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.telephone} onChange={update("telephone")} />
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Mobile</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.mobile} onChange={update("mobile")} />
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Email</label>
            <input className="form-control" type="email" style={{ fontSize: 13, borderColor: BORDER }} value={form.email} onChange={update("email")} />
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

// Modale dédiée à l'affectation / modification du numéro de contrat (N° Police),
// séparée du formulaire établissement car elle correspond à un endpoint distinct
// (PUT /etablissements/:id/contrat).
function ContratModal({ etablissement, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    numero_police: etablissement.numero_police || "",
    validite_du: etablissement.validite_du || "",
    validite_au: etablissement.validite_au || "",
  });
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    if (!form.numero_police.trim()) {
      setError("Champ requis");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.35)", zIndex: 50 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 p-4" style={{ width: 400, maxWidth: "92vw" }}>
        <div className="d-flex align-items-center justify-content-between mb-1">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>Affecter un contrat</p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}>
            <X size={18} color={MUTED} />
          </button>
        </div>
        <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>{etablissement.nom}</p>

        <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "14px 0 4px" }}>N° Police *</label>
        <input
          className="form-control"
          style={{ fontSize: 13, fontFamily: "monospace", borderColor: error ? "#B3261E" : BORDER }}
          placeholder="2026301002966"
          value={form.numero_police}
          onChange={update("numero_police")}
        />
        {error && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{error}</p>}

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Validité du</label>
            <input className="form-control" type="date" style={{ fontSize: 13, borderColor: BORDER }} value={form.validite_du} onChange={update("validite_du")} />
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Validité au</label>
            <input className="form-control" type="date" style={{ fontSize: 13, borderColor: BORDER }} value={form.validite_au} onChange={update("validite_au")} />
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
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// Petite barre de répartition (sans lib de chart externe — juste du CSS)
// pour rester léger : usage, marque, etc.
function BarList({ data, color = "#0B1F38" }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="d-flex flex-column gap-2">
      {data.map((d) => (
        <div key={d.label} className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 12, color: "#161B22", width: 130, flexShrink: 0 }} className="text-truncate" title={d.label}>
            {d.label}
          </span>
          <div className="flex-grow-1 rounded-pill" style={{ backgroundColor: "#F1F2F4", height: 8, overflow: "hidden" }}>
            <div
              className="rounded-pill"
              style={{ height: "100%", width: `${(d.count / max) * 100}%`, backgroundColor: color, transition: "width 0.4s ease" }}
            />
          </div>
          <span style={{ fontSize: 12, color: MUTED, width: 34, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function groupCount(list, field, topN = 5) {
  const counts = {};
  for (const item of list) {
    const key = (item[field] || "").toString().trim() || "Non renseigné";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// Popup de statistiques : chargée à la demande quand on clique sur une ligne.
// Le lien "Voir la liste des véhicules" est volontairement non câblé pour l'instant.
function EtablissementStatsModal({ etablissement, onClose }) {
  const [vehicules, setVehicules] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setVehicules(null);
    setError(null);
    vehiculesApi
      .getByEtablissement(etablissement.id)
      .then((data) => !cancelled && setVehicules(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [etablissement.id]);

  const loading = vehicules === null && !error;
  const total = vehicules?.length || 0;
  const parUsage = useMemo(() => (vehicules ? groupCount(vehicules, "usage") : []), [vehicules]);
  const parMarque = useMemo(() => (vehicules ? groupCount(vehicules, "marque") : []), [vehicules]);

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.35)", zIndex: 50 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 p-4" style={{ width: 480, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div className="d-flex align-items-start justify-content-between mb-1">
          <div className="d-flex align-items-center gap-2">
            <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 34, height: 34, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
              <Building2 size={15} color={NAVY} />
            </span>
            <div>
              <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>{etablissement.nom}</p>
              <p className="mb-0" style={{ fontSize: 11.5, color: MUTED, fontFamily: "monospace" }}>{etablissement.identifiant_unique || "—"}</p>
            </div>
          </div>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}>
            <X size={18} color={MUTED} />
          </button>
        </div>

        {/* Infos rapides établissement */}
        <div className="d-flex gap-2 mt-3 flex-wrap">
          <span style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 20, backgroundColor: "#F1F2F4", color: "#161B22" }}>
            {etablissement.gouvernorat || "Gouvernorat —"}
          </span>
          <span
            style={{
              fontSize: 11.5,
              padding: "3px 10px",
              borderRadius: 20,
              backgroundColor: etablissement.numero_police ? "#E7F5EC" : "#FDF1DE",
              color: etablissement.numero_police ? "#1E7B3A" : "#A15C00",
              fontFamily: etablissement.numero_police ? "monospace" : "inherit",
            }}
          >
            {etablissement.numero_police || "Non affecté"}
          </span>
        </div>

        {error && (
          <div className="d-flex align-items-center gap-2 p-2 rounded-3 mt-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 12.5 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5" style={{ color: MUTED, fontSize: 13 }}>
            <Loader2 size={18} className="spin me-2" /> Chargement des statistiques...
          </div>
        ) : !error && (
          <>
            {/* Total véhicules, mis en avant */}
            <div className="d-flex align-items-center gap-3 rounded-4 p-3 mt-3" style={{ backgroundColor: "#F8F9FB", border: `1px solid ${BORDER}` }}>
              <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 42, height: 42, backgroundColor: NAVY, flexShrink: 0 }}>
                <Car size={19} color="#fff" />
              </span>
              <div>
                <p className="mb-0 fw-bold" style={{ fontSize: 22, lineHeight: 1, color: "#161B22" }}>{total}</p>
                <p className="mb-0" style={{ fontSize: 12, color: MUTED }}>véhicule{total > 1 ? "s" : ""} assuré{total > 1 ? "s" : ""}</p>
              </div>
            </div>

            {total === 0 ? (
              <p className="text-center mt-4" style={{ fontSize: 12.5, color: MUTED }}>
                Aucun véhicule enregistré pour cet établissement.
              </p>
            ) : (
              <>
                {parUsage.length > 1 && (
                  <div className="mt-4">
                    <div className="d-flex align-items-center gap-1 mb-2">
                      <BarChart3 size={13} color={MUTED} />
                      <p className="mb-0" style={{ fontSize: 12, fontWeight: 500, color: MUTED }}>Répartition par usage</p>
                    </div>
                    <BarList data={parUsage} color={NAVY} />
                  </div>
                )}

                {parMarque.length > 1 && (
                  <div className="mt-4">
                    <div className="d-flex align-items-center gap-1 mb-2">
                      <BarChart3 size={13} color={MUTED} />
                      <p className="mb-0" style={{ fontSize: 12, fontWeight: 500, color: MUTED }}>Top marques</p>
                    </div>
                    <BarList data={parMarque} color="#0D6EFD" />
                  </div>
                )}
              </>
            )}

            {/* Lien vers la liste filtrée des véhicules — non câblé pour le moment */}
            <button
              className="btn w-100 d-flex align-items-center justify-content-center gap-2 mt-4"
              style={{ fontSize: 13, borderColor: BORDER, color: NAVY }}
              disabled
              title="Navigation à venir"
            >
              Voir la liste des véhicules <ArrowUpRight size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function EtablissementsPage() {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [contratFilter, setContratFilter] = useState("tous");

  // Un state pilote chaque modale : null = fermée
  const [modalMode, setModalMode] = useState(null); // "create" | "edit" | null
  const [editingEtablissement, setEditingEtablissement] = useState(null);
  const [contratTarget, setContratTarget] = useState(null); // étab en cours d'affectation de contrat
  const [statsTarget, setStatsTarget] = useState(null); // étab dont on consulte les statistiques
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await etablissementsApi.getAll();
      setEtablissements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let list = etablissements;
    if (contratFilter === "avec") list = list.filter((e) => e.numero_police);
    if (contratFilter === "sans") list = list.filter((e) => !e.numero_police);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        (e.nom || "").toLowerCase().includes(q) ||
        (e.identifiant_unique || "").toLowerCase().includes(q) ||
        (e.numero_police || "").toLowerCase().includes(q) ||
        (e.gouvernorat || "").toLowerCase().includes(q)
    );
  }, [etablissements, search, contratFilter]);

  const openCreate = () => {
    setEditingEtablissement(null);
    setJustCreated(false);
    setModalMode("create");
  };

  const openEdit = (e) => {
    setEditingEtablissement(e);
    setJustCreated(false);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingEtablissement(null);
    setJustCreated(false);
  };

  const handleSubmitModal = async (form) => {
    setSubmitting(true);
    try {
      if (modalMode === "edit") {
        await etablissementsApi.update(editingEtablissement.id, form);
        closeModal();
      } else {
        await etablissementsApi.create(form);
        setJustCreated(true); // reste ouverte : reset du formulaire + bandeau de succès
      }
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitContrat = async (form) => {
    setSubmitting(true);
    try {
      await etablissementsApi.affecterContrat(contratTarget.id, form);
      setContratTarget(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const nbAvecContrat = etablissements.filter((e) => e.numero_police).length;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <p className="mb-0 fw-semibold" style={{ fontSize: 18, color: "#161B22" }}>Établissements</p>
          <p className="mb-0" style={{ fontSize: 13, color: MUTED }}>
            Établissements publics et contrats d'assurance véhicules
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2 text-white rounded-3"
          style={{ fontSize: 13.5, padding: "9px 16px", backgroundColor: NAVY, borderColor: NAVY, boxShadow: "0 2px 6px rgba(11,31,56,0.18)" }}
          onClick={openCreate}
        >
          <Plus size={15} /> Ajouter un établissement
        </button>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative">
            <Search size={14} color={MUTED} style={{ position: "absolute", left: 12, top: 11 }} />
            <input
              className="form-control rounded-3"
              style={{ fontSize: 13, paddingLeft: 34, width: 280, borderColor: BORDER }}
              placeholder="Rechercher un établissement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center rounded-3 p-1" style={{ backgroundColor: "#F1F2F4" }}>
            {[
              { key: "tous", label: "Tous" },
              { key: "avec", label: "Avec contrat" },
              { key: "sans", label: "Sans contrat" },
            ].map((opt) => (
              <button
                key={opt.key}
                className="btn btn-sm border-0"
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  padding: "5px 14px",
                  borderRadius: 8,
                  backgroundColor: contratFilter === opt.key ? "#fff" : "transparent",
                  color: contratFilter === opt.key ? NAVY : MUTED,
                  boxShadow: contratFilter === opt.key ? "0 1px 3px rgba(11,31,56,0.12)" : "none",
                }}
                onClick={() => setContratFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: 12.5, color: MUTED }}>
          {loading ? "Chargement..." : `${filtered.length} établissement${filtered.length > 1 ? "s" : ""} · ${nbAvecContrat} avec contrat`}
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
            <Loader2 size={18} className="spin me-2" /> Chargement des établissements...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-center" style={{ color: MUTED, fontSize: 13 }}>
            Aucun établissement ne correspond à ces critères.
          </div>
        ) : (
          <table className="w-100" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#FAFBFC" }}>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 16px" }}>Établissement</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Gouvernorat</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Contact</th>
                <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>N° Contrat</th>
                <th style={{ padding: "12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                  onClick={() => setStatsTarget(e)}
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
                        <p className="mb-0" style={{ fontSize: 11.5, color: MUTED, fontFamily: "monospace" }}>{e.identifiant_unique || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 12.5, color: "#161B22" }}>
                    {e.gouvernorat || "—"}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 12.5, color: MUTED }}>
                    <p className="mb-0">{e.telephone || e.mobile || "—"}</p>
                    <p className="mb-0" style={{ fontSize: 11.5 }}>{e.email || ""}</p>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <ContratBadge etablissement={e} />
                  </td>
                  <td style={{ padding: "12px 16px" }} onClick={(ev) => ev.stopPropagation()}>
                    <div className="d-flex align-items-center gap-2 justify-content-end">
                      <button
                        className="btn btn-sm d-flex align-items-center gap-1"
                        style={{ fontSize: 12, backgroundColor: "#FFFFFF", color: "#0D6EFD", borderColor: "#0D6EFD" }}
                        onClick={() => openEdit(e)}
                      >
                        <Pencil size={13} /> Modifier
                      </button>
                      <button
                        className="btn btn-sm d-flex align-items-center gap-1"
                        style={{ fontSize: 12, borderColor: BORDER, color: NAVY }}
                        onClick={() => setContratTarget(e)}
                      >
                        <FileText size={13} /> {e.numero_police ? "Modifier contrat" : "Affecter n° contrat"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode && (
        <EtablissementModal
          mode={modalMode}
          initialData={
            modalMode === "edit" && editingEtablissement
              ? {
                  nom: editingEtablissement.nom || "",
                  identifiant_unique: editingEtablissement.identifiant_unique || "",
                  adresse: editingEtablissement.adresse || "",
                  gouvernorat: editingEtablissement.gouvernorat || GOUVERNORATS[0],
                  responsable_parc_auto: editingEtablissement.responsable_parc_auto || "",
                  telephone: editingEtablissement.telephone || "",
                  mobile: editingEtablissement.mobile || "",
                  email: editingEtablissement.email || "",
                }
              : null
          }
          onClose={closeModal}
          onSubmit={handleSubmitModal}
          submitting={submitting}
          justCreated={justCreated}
        />
      )}

      {contratTarget && (
        <ContratModal
          etablissement={contratTarget}
          onClose={() => setContratTarget(null)}
          onSubmit={handleSubmitContrat}
          submitting={submitting}
        />
      )}

      {statsTarget && (
        <EtablissementStatsModal etablissement={statsTarget} onClose={() => setStatsTarget(null)} />
      )}

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}