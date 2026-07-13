import { useEffect, useMemo, useState } from "react";
import { Car, Search, Plus, X, RotateCcw, Trash2, Loader2, AlertCircle } from "lucide-react";

// Couleurs de marque — mêmes tokens que SidebarLayout.jsx / DashboardPage.jsx
const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

// Ajuste selon l'URL réelle de ton backend (ou utilise une variable d'env Vite : import.meta.env.VITE_API_URL)
const API_BASE = "http://localhost:5000/api";

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

function StatusBadge({ statut }) {
  const s = STATUT_STYLE[statut] || STATUT_STYLE.retire;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20, backgroundColor: s.bg, color: s.fg, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function AddVehiculeModal({ etablissements, onClose, onCreate, submitting }) {
  const [form, setForm] = useState({
    etablissement_id: "",
    immatriculation: "",
    usage: USAGE_OPTIONS[0],
    marque: "",
    numero_serie: "",
    puissance: "",
    nb_places: "",
  });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    const nextErrors = {};
    if (!form.etablissement_id) nextErrors.etablissement_id = "Champ requis";
    if (!form.immatriculation.trim()) nextErrors.immatriculation = "Champ requis";
    if (!form.nb_places) nextErrors.nb_places = "Champ requis";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onCreate(form);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.35)", zIndex: 50 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 p-4" style={{ width: 420, maxWidth: "92vw" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>Ajouter un véhicule</p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}>
            <X size={18} color={MUTED} />
          </button>
        </div>

        <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Établissement *</label>
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
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Immatriculation *</label>
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
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Marque</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} placeholder="Renault" value={form.marque} onChange={update("marque")} />
          </div>
        </div>

        <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Usage *</label>
        <select className="form-select" style={{ fontSize: 13, borderColor: BORDER }} value={form.usage} onChange={update("usage")}>
          {USAGE_OPTIONS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <div className="row g-2">
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>N° série</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.numero_serie} onChange={update("numero_serie")} />
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Puissance</label>
            <input className="form-control" type="number" style={{ fontSize: 13, borderColor: BORDER }} value={form.puissance} onChange={update("puissance")} />
          </div>
          <div className="col-4">
            <label style={{ fontSize: 12, color: MUTED, display: "block", margin: "10px 0 4px" }}>Places *</label>
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
            Ajouter
          </button>
        </div>
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
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const etabById = useMemo(() => {
    const map = {};
    etablissements.forEach((e) => (map[e.id] = e.nom));
    return map;
  }, [etablissements]);

  const loadData = () => {
    setLoading(true);
    setError(null);

    const vehiculesUrl = statutFilter === "retire" ? `${API_BASE}/vehicules/retires` : `${API_BASE}/vehicules`;

    Promise.all([
      fetch(vehiculesUrl).then((r) => {
        if (!r.ok) throw new Error("Impossible de charger les véhicules");
        return r.json();
      }),
      fetch(`${API_BASE}/etablissements`).then((r) => {
        if (!r.ok) throw new Error("Impossible de charger les établissements");
        return r.json();
      }),
    ])
      .then(([vehiculesData, etabData]) => {
        setVehicules(vehiculesData);
        setEtablissements(etabData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statutFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicules;
    const q = search.toLowerCase();
    return vehicules.filter((v) => {
      const etabNom = etabById[v.etablissement_id] || "";
      return (
        (v.immatriculation || "").toLowerCase().includes(q) ||
        (v.marque || "").toLowerCase().includes(q) ||
        etabNom.toLowerCase().includes(q)
      );
    });
  }, [vehicules, search, etabById]);

  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/vehicules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etablissement_id: Number(form.etablissement_id),
          immatriculation: form.immatriculation,
          usage: form.usage,
          marque: form.marque || null,
          numero_serie: form.numero_serie || null,
          puissance: form.puissance ? Number(form.puissance) : null,
          nb_places: Number(form.nb_places),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Erreur lors de la création");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatut = async (v) => {
    const isActif = v.statut_retrait === "actif";
    const url = `${API_BASE}/vehicules/${v.id}/${isActif ? "retirer" : "restaurer"}`;
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: isActif ? JSON.stringify({ motif_retrait: "" }) : undefined,
      });
      if (!res.ok) throw new Error("Action impossible");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <p className="mb-0 fw-semibold" style={{ fontSize: 16 }}>Véhicules</p>
          <p className="mb-0" style={{ fontSize: 13, color: MUTED }}>
            {loading ? "Chargement..." : `${filtered.length} véhicule${filtered.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-1 text-white"
          style={{ fontSize: 13, backgroundColor: NAVY, borderColor: NAVY }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={15} /> Ajouter un véhicule
        </button>
      </div>

      <div className="d-flex gap-2 mb-3">
        <div className="position-relative flex-grow-1" style={{ maxWidth: 320 }}>
          <Search size={14} color={MUTED} style={{ position: "absolute", left: 10, top: 10 }} />
          <input
            className="form-control"
            style={{ fontSize: 13, paddingLeft: 32, borderColor: BORDER }}
            placeholder="Immatriculation, marque, établissement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ fontSize: 13, width: 160, borderColor: BORDER }}
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
        >
          <option value="actif">Actifs</option>
          <option value="retire">Retirés</option>
        </select>
      </div>

      {error && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 13 }}>
          <AlertCircle size={16} /> {error}
          <button className="btn btn-sm ms-auto" style={{ fontSize: 12, color: "#B3261E", textDecoration: "underline" }} onClick={loadData}>
            Réessayer
          </button>
        </div>
      )}

      <div className="rounded-4 bg-white overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
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
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
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
                    style={{ borderBottom: `1px solid ${BORDER}` }}
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
                      {etabById[v.etablissement_id] || "—"}
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
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        className="btn btn-sm d-flex align-items-center gap-1 ms-auto"
                        style={{ fontSize: 12, borderColor: isActif ? "#F0C9C9" : BORDER, color: isActif ? "#B3261E" : NAVY }}
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddVehiculeModal
          etablissements={etablissements}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          submitting={submitting}
        />
      )}

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}