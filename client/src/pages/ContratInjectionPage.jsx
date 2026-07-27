import { useEffect, useMemo, useState } from "react";
import { FileText, Search, Download, Loader2, AlertCircle, CheckCircle2, RefreshCw, Building2, Clock, X, Layers, Car } from "lucide-react";
import { contratInjectionApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const STATUT_STYLE = {
  a_injecter: { bg: "#F1F2F4", fg: "#6B7684", label: "À injecter" },
  injecte: { bg: "#E7F5EC", fg: "#1E7B3A", label: "Injecté" },
  a_reinjecter: { bg: "#FDF1DE", fg: "#A15C00", label: "À réinjecter" },
};

// Petite palette d'accent pour l'icône établissement — casse la monotonie
// visuelle de la liste, comme sur EtablissementsPage.
const ACCENT_PALETTE = [
  { bg: "#EAF1FB", fg: "#2B6CB0" },
  { bg: "#E7F5EC", fg: "#1E7B3A" },
  { bg: "#FDF1DE", fg: "#A15C00" },
  { bg: "#F3E8FD", fg: "#6B3FA0" },
  { bg: "#E4F4F5", fg: "#1B7A80" },
];
const accentFor = (key = "") => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
};

function StatutBadge({ statut }) {
  const s = STATUT_STYLE[statut] || STATUT_STYLE.a_injecter;
  return (
    <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20, backgroundColor: s.bg, color: s.fg, whiteSpace: "nowrap" }}>
      {statut === "a_reinjecter" && <RefreshCw size={11} />}
      {s.label}
    </span>
  );
}

function LotBadge({ numero }) {
  if (!numero) return <span style={{ fontSize: 12, color: MUTED }}>—</span>;
  return (
    <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20, backgroundColor: "#F3E8FD", color: "#6B3FA0", whiteSpace: "nowrap" }}>
      <Layers size={11} /> Lot injection {numero}
    </span>
  );
}

export default function ContratsInjectionPage() {
  const { user } = useAuth();
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("tous");
  const [selected, setSelected] = useState(new Set());
  const [injecting, setInjecting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setContrats(await contratInjectionApi.liste());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    let list = contrats;
    if (statutFilter !== "tous") list = list.filter((c) => c.statut_injection === statutFilter);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) => (c.numero_police || "").toLowerCase().includes(q) || (c.etablissement_nom || "").toLowerCase().includes(q)
    );
  }, [contrats, search, statutFilter]);

  // Seuls les contrats pas encore "injecte" peuvent être (ré)injectés —
  // un contrat déjà injecté ne peut pas être sélectionné à nouveau tant
  // qu'il n'est pas repassé en "a_reinjecter" (modification détectée).
  const isEligible = (c) => c.statut_injection !== "injecte";
  const eligibleFiltered = useMemo(() => filtered.filter(isEligible), [filtered]);

  const counts = useMemo(() => ({
    a_injecter: contrats.filter((c) => c.statut_injection === "a_injecter").length,
    injecte: contrats.filter((c) => c.statut_injection === "injecte").length,
    a_reinjecter: contrats.filter((c) => c.statut_injection === "a_reinjecter").length,
  }), [contrats]);

  const allEligibleSelected = eligibleFiltered.length > 0 && eligibleFiltered.every((c) => selected.has(c.id));

  const toggleOne = (c) => {
    if (!isEligible(c)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(c.id) ? next.delete(c.id) : next.add(c.id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allEligibleSelected) eligibleFiltered.forEach((c) => next.delete(c.id));
      else eligibleFiltered.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleInjecter = async () => {
    setInjecting(true);
    try {
      const { lotLabel, injecteCount, ignoreCount } = await contratInjectionApi.injecter([...selected]);
      setToast(
        `${lotLabel} — ${injecteCount} contrat${injecteCount > 1 ? "s" : ""} injecté${injecteCount > 1 ? "s" : ""}` +
        (ignoreCount > 0 ? ` (${ignoreCount} déjà injecté${ignoreCount > 1 ? "s" : ""}, ignoré${ignoreCount > 1 ? "s" : ""})` : "")
      );
      setSelected(new Set());
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setInjecting(false);
    }
  };

  const STAT_CARDS = [
    { key: "a_injecter", label: "À injecter", value: counts.a_injecter, icon: Clock, iconBg: "#F1F2F4", iconFg: MUTED },
    { key: "a_reinjecter", label: "À réinjecter", value: counts.a_reinjecter, icon: RefreshCw, iconBg: "#FDF1DE", iconFg: "#A15C00" },
    { key: "injecte", label: "Injectés", value: counts.injecte, icon: CheckCircle2, iconBg: "#E7F5EC", iconFg: "#1E7B3A" },
  ];

  return (
    <div style={{ paddingBottom: selected.size > 0 ? 76 : 0 }}>
      {/* En-tête avec liseré dégradé, cohérent avec ContratPage */}
      <div className="rounded-4 p-4 mb-4 position-relative overflow-hidden" style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(11,31,56,0.04)" }}>
        <div className="position-absolute top-0 start-0 w-100" style={{ height: 3, background: "linear-gradient(90deg, #0B1F38 0%, #2B6CB0 50%, #B8912E 100%)" }} />

        <div className="d-flex align-items-center gap-3 mb-3">
          <span className="d-flex align-items-center justify-content-center rounded-4" style={{ width: 44, height: 44, background: "linear-gradient(135deg, #EAF1FB 0%, #EEF2F7 100%)" }}>
            <FileText size={20} color="#2B6CB0" />
          </span>
          <div>
            <p className="mb-0 fw-semibold" style={{ fontSize: 16, color: "#161B22" }}>Contrats</p>
            <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>Sélectionne les contrats à injecter dans le système d'information</p>
          </div>
        </div>

        <div className="row g-3">
          {STAT_CARDS.map((s) => (
            <div className="col-4" key={s.key}>
              <button
                className="rounded-3 p-3 w-100 text-start border-0 h-100"
                style={{ backgroundColor: statutFilter === s.key ? "#FAFBFC" : "#fff", border: `1px solid ${statutFilter === s.key ? NAVY : BORDER}`, transition: "border-color .15s" }}
                onClick={() => setStatutFilter(statutFilter === s.key ? "tous" : s.key)}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 26, height: 26, backgroundColor: s.iconBg }}>
                    <s.icon size={13} color={s.iconFg} />
                  </span>
                  <span style={{ fontSize: 11, color: MUTED }}>{s.label}</span>
                </div>
                <p className="mb-0 fw-bold" style={{ fontSize: 24, color: "#161B22" }}>{s.value}</p>
              </button>
            </div>
          ))}
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
            <input
              className="form-control rounded-3"
              style={{ fontSize: 13, paddingLeft: 34, width: 280, borderColor: BORDER }}
              placeholder="N° police ou établissement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {statutFilter !== "tous" && (
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ fontSize: 12, borderColor: BORDER, color: MUTED }}
              onClick={() => setStatutFilter("tous")}
            >
              <X size={12} /> Filtre : {STATUT_STYLE[statutFilter]?.label}
            </button>
          )}
        </div>

        <span style={{ fontSize: 12.5, color: MUTED }}>
          {loading ? "Chargement..." : `${filtered.length} contrat${filtered.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {error && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 13 }}>
          <AlertCircle size={16} /> {error}
          <button className="btn btn-sm ms-auto" style={{ fontSize: 12, color: "#B3261E", textDecoration: "underline" }} onClick={loadData}>Réessayer</button>
        </div>
      )}

      <div className="rounded-4 bg-white overflow-hidden" style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(11,31,56,0.05)" }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5" style={{ color: MUTED, fontSize: 13 }}>
            <Loader2 size={18} className="spin me-2" /> Chargement des contrats...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-center" style={{ color: MUTED, fontSize: 13 }}>Aucun contrat ne correspond à ces critères.</div>
        ) : (
          <table className="w-100" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#FAFBFC" }}>
                <th style={{ padding: "14px 16px", width: 40 }}>
                  <input type="checkbox" checked={allEligibleSelected} onChange={toggleAll} disabled={eligibleFiltered.length === 0} />
                </th>
                <th style={{ fontSize: 11, fontWeight: 600, color: MUTED, textAlign: "left", padding: "14px 8px", textTransform: "uppercase", letterSpacing: 0.3 }}>Établissement</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: MUTED, textAlign: "left", padding: "14px 8px", textTransform: "uppercase", letterSpacing: 0.3 }}>N° Police</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: MUTED, textAlign: "left", padding: "14px 8px", textTransform: "uppercase", letterSpacing: 0.3 }}>Validité</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: MUTED, textAlign: "center", padding: "14px 8px", textTransform: "uppercase", letterSpacing: 0.3 }}>Véhicules</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: MUTED, textAlign: "left", padding: "14px 8px", textTransform: "uppercase", letterSpacing: 0.3 }}>Statut</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: MUTED, textAlign: "left", padding: "14px 16px", textTransform: "uppercase", letterSpacing: 0.3 }}>Lot</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const eligible = isEligible(c);
                const isSelected = selected.has(c.id);
                const accent = accentFor(c.etablissement_nom);
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: `1px solid ${BORDER}`,
                      cursor: eligible ? "pointer" : "default",
                      backgroundColor: isSelected ? "#EAF1FB" : "transparent",
                      opacity: eligible ? 1 : 0.6,
                      transition: "background-color .12s",
                    }}
                    onClick={() => toggleOne(c)}
                    onMouseEnter={(e) => { if (!isSelected && eligible) e.currentTarget.style.backgroundColor = "#FAFBFC"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={{ padding: "13px 16px" }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(c)} disabled={!eligible} title={!eligible ? "Déjà injecté" : undefined} />
                    </td>
                    <td style={{ padding: "13px 8px" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 30, height: 30, backgroundColor: accent.bg, flexShrink: 0 }}>
                          <Building2 size={14} color={accent.fg} />
                        </span>
                        <span style={{ fontSize: 12.5, color: "#161B22", fontWeight: 500 }}>{c.etablissement_nom}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 8px" }}>
                      <span style={{ fontSize: 12.5, fontFamily: "monospace", fontWeight: 500, padding: "3px 8px", borderRadius: 6, backgroundColor: "#F5F6F8", color: "#161B22" }}>
                        {c.numero_police}
                      </span>
                    </td>
                    <td style={{ padding: "13px 8px", fontSize: 12, color: MUTED }}>
                      {c.validite_du && c.validite_au
                        ? `${new Date(c.validite_du).toLocaleDateString("fr-FR")} → ${new Date(c.validite_au).toLocaleDateString("fr-FR")}`
                        : "—"}
                    </td>
                    <td style={{ padding: "13px 8px", textAlign: "center" }}>
                      <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: 12, color: MUTED }}>
                        <Car size={12} /> {c.nb_vehicules}
                      </span>
                    </td>
                    <td style={{ padding: "13px 8px" }}><StatutBadge statut={c.statut_injection} /></td>
                    <td style={{ padding: "13px 16px" }}><LotBadge numero={c.numero_lot} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Barre d'action flottante — apparaît dès qu'au moins un contrat est sélectionné */}
      {selected.size > 0 && user?.role !== 'guest' && (
        <div
          className="position-fixed d-flex align-items-center gap-3 rounded-4 px-4 py-3"
          style={{
            bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 40,
            backgroundColor: NAVY, boxShadow: "0 8px 24px rgba(11,31,56,0.35)",
          }}
        >
          <span className="text-white" style={{ fontSize: 13, fontWeight: 500 }}>
            {selected.size} contrat{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <button
            className="btn btn-sm border-0"
            style={{ fontSize: 12.5, color: "#B8C2CF" }}
            onClick={() => setSelected(new Set())}
            disabled={injecting}
          >
            Désélectionner
          </button>
          <button
            className="btn btn-sm d-flex align-items-center gap-2 text-white rounded-3"
            style={{ fontSize: 13, padding: "8px 16px", backgroundColor: "#B8912E", borderColor: "#B8912E" }}
            onClick={handleInjecter}
            disabled={injecting}
          >
            {injecting ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
            Injecter
          </button>
        </div>
      )}

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}