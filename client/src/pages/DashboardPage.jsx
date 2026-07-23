import { useEffect, useMemo, useState } from "react";
import { Building2, Car, AlertTriangle, Archive, ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { etablissementsApi, contratsApi, vehiculesApi } from "../services/api";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const GOUV_COLORS = ["#0B1F38", "#2B6CB0", "#B8912E", "#1E7B3A", "#A15C00", "#B3261E", "#6B7684"];

function Panel({ title, action, children }) {
  return (
    <div className="p-3 rounded-4 bg-white h-100" style={{ border: `1px solid ${BORDER}` }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <p className="mb-0 fw-semibold" style={{ fontSize: 14 }}>{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone, sub }) {
  const tones = {
    navy: { bg: "#EEF2F7", fg: NAVY },
    warn: { bg: "#FDF1DE", fg: "#A15C00" },
    ok: { bg: "#E7F5EC", fg: "#1E7B3A" },
    muted: { bg: "#F1F2F4", fg: MUTED },
  };
  const c = tones[tone] || tones.navy;

  return (
    <div className="d-flex flex-column gap-2 p-3 rounded-4 bg-white" style={{ border: `1px solid ${BORDER}` }}>
      <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 36, height: 36, backgroundColor: c.bg }}>
        <Icon size={18} color={c.fg} strokeWidth={2} />
      </div>
      <div>
        <p className="mb-0 fw-semibold" style={{ fontSize: 24, color: "#161B22" }}>{value}</p>
        <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>{label}</p>
      </div>
      {sub && (
        <span className="align-self-start" style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, backgroundColor: c.bg, color: c.fg }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, boxShadow: "0 2px 8px rgba(15,31,56,0.08)" }}>
      <p className="mb-0" style={{ color: MUTED }}>{label}</p>
      <p className="mb-0 fw-semibold" style={{ color: NAVY }}>{payload[0].value}</p>
    </div>
  );
}

const isSameMonth = (dateStr, ref) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [etablissements, setEtablissements] = useState([]);
  const [contratsAll, setContratsAll] = useState([]); // { id, numero_police, validite_au, created_at, etablissementNom }
  const [vehiculesActifs, setVehiculesActifs] = useState([]);
  const [vehiculesRetires, setVehiculesRetires] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [etabs, actifs, retires] = await Promise.all([
        etablissementsApi.getAll(),
        vehiculesApi.getAll(),
        vehiculesApi.getRetires(),
      ]);
      setEtablissements(etabs);
      setVehiculesActifs(actifs);
      setVehiculesRetires(retires);

      // Pas de route GET /api/contrats global : on agrège établissement par établissement.
      const contratsParEtab = await Promise.all(
        etabs.map((e) =>
          contratsApi.getByEtablissement(e.id).then((list) =>
            list.map((c) => ({ ...c, etablissementNom: e.nom }))
          )
        )
      );
      setContratsAll(contratsParEtab.flat());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const stats = useMemo(() => {
    const now = new Date();

    // --- KPI de base
    const totalEtablissements = etablissements.length;
    const totalActifs = vehiculesActifs.length;
    const totalRetires = vehiculesRetires.length;

    const nouveauxEtabsMois = etablissements.filter((e) => isSameMonth(e.created_at, now)).length;
    const nouveauxVehiculesMois = vehiculesActifs.filter((v) => isSameMonth(v.created_at, now)).length;

    // --- Contrats à échéance (30 prochains jours)
    const contratsProches = contratsAll
      .filter((c) => c.validite_au)
      .map((c) => ({
        nom: c.etablissementNom,
        police: c.numero_police,
        jours: Math.ceil((new Date(c.validite_au) - now) / 86400000),
      }))
      .filter((c) => c.jours >= 0 && c.jours <= 30)
      .sort((a, b) => a.jours - b.jours);

    // --- Répartition par gouvernorat (remplace l'ancien code_fiabilisation, retiré du modèle)
    const gouvCounts = etablissements.reduce((acc, e) => {
      const key = e.gouvernorat?.trim() || "Non renseigné";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const repartitionGouvernorat = Object.entries(gouvCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);

    // --- Répartition des véhicules actifs par usage
    const usageCounts = vehiculesActifs.reduce((acc, v) => {
      const key = v.usage?.trim() || "Non renseigné";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const repartitionUsage = Object.entries(usageCounts).map(([usage, total]) => ({ usage, total }));

    // --- Évolution du parc (6 derniers mois, cumulatif, à partir de vehicule.created_at)
    // Inclut actifs + retirés : un véhicule retiré aujourd'hui a bien existé les mois précédents.
    const tousVehicules = [...vehiculesActifs, ...vehiculesRetires];
    const evolutionParc = [];
    for (let i = 5; i >= 0; i--) {
      const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const finMois = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59);
      const count = tousVehicules.filter((v) => v.created_at && new Date(v.created_at) <= finMois).length;
      evolutionParc.push({ mois: refDate.toLocaleDateString("fr-FR", { month: "short" }), vehicules: count });
    }

    // --- Derniers véhicules ajoutés (les 3 plus récents, tous établissements confondus)
    const contratById = Object.fromEntries(contratsAll.map((c) => [c.id, c]));
    const vehiculesRecents = [...vehiculesActifs]
      .filter((v) => v.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3)
      .map((v) => ({
        immat: v.immatriculation,
        marque: v.marque || "Marque inconnue",
        etab: contratById[v.contrat_id]?.etablissementNom || "—",
        date: new Date(v.created_at).toLocaleDateString("fr-FR"),
      }));

    return {
      totalEtablissements,
      totalActifs,
      totalRetires,
      nouveauxEtabsMois,
      nouveauxVehiculesMois,
      contratsProches,
      repartitionGouvernorat,
      repartitionUsage,
      evolutionParc,
      vehiculesRecents,
    };
  }, [etablissements, contratsAll, vehiculesActifs, vehiculesRetires]);

  const totalGouv = stats.repartitionGouvernorat.reduce((s, d) => s + d.value, 0);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5" style={{ color: MUTED, fontSize: 13 }}>
        <Loader2 size={20} className="spin me-2" /> Chargement du dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex align-items-center gap-2 p-3 rounded-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 13 }}>
        <AlertCircle size={16} /> {error}
        <button className="btn btn-sm ms-auto" style={{ fontSize: 12, color: "#B3261E", textDecoration: "underline" }} onClick={loadAll}>Réessayer</button>
      </div>
    );
  }

  return (
    <div>
      {/* KPI ROW */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <KpiCard icon={Building2} label="Établissements" value={stats.totalEtablissements} tone="navy" sub={`+${stats.nouveauxEtabsMois} ce mois`} />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={Car} label="Véhicules actifs" value={stats.totalActifs.toLocaleString("fr-FR")} tone="ok" sub={`+${stats.nouveauxVehiculesMois} ce mois`} />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={AlertTriangle} label="Contrats à renouveler (30j)" value={stats.contratsProches.length} tone="warn" sub="à traiter" />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={Archive} label="Véhicules retirés" value={stats.totalRetires} tone="muted" sub="historique" />
        </div>
      </div>

      <div className="row g-3">
        {/* EVOLUTION DU PARC */}
        <div className="col-lg-7">
          <Panel title="Évolution du parc véhicules" action={<span style={{ fontSize: 11.5, color: MUTED }}>6 derniers mois</span>}>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={stats.evolutionParc} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillParc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={BORDER} />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="vehicules" stroke={NAVY} strokeWidth={2} fill="url(#fillParc)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* REPARTITION PAR GOUVERNORAT */}
        <div className="col-lg-5">
          <Panel title="Établissements par gouvernorat">
            {stats.repartitionGouvernorat.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.repartitionGouvernorat} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2} stroke="none">
                        {stats.repartitionGouvernorat.map((d, i) => (
                          <Cell key={d.name} fill={GOUV_COLORS[i % GOUV_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-grow-1">
                  {stats.repartitionGouvernorat.map((d, i) => {
                    const pct = totalGouv ? Math.round((d.value / totalGouv) * 100) : 0;
                    return (
                      <div key={d.name} className="d-flex align-items-center gap-2 mb-1">
                        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: GOUV_COLORS[i % GOUV_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#161B22" }}>{d.name}</span>
                        <span style={{ fontSize: 11.5, color: MUTED, marginLeft: "auto" }}>{d.value} · {pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* REPARTITION PAR USAGE */}
        <div className="col-lg-7">
          <Panel title="Véhicules par type d'usage">
            {stats.repartitionUsage.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={stats.repartitionUsage} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={BORDER} />
                  <XAxis dataKey="usage" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F3F5F8" }} />
                  <Bar dataKey="total" fill={NAVY} radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* CONTRATS A ECHEANCE */}
        <div className="col-lg-5">
          <Panel title="Contrats à échéance" action={<span style={{ fontSize: 11.5, color: MUTED }}>30 jours</span>}>
            {stats.contratsProches.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucun contrat à échéance proche.</p>
            ) : (
              stats.contratsProches.map((c, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: i < stats.contratsProches.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <div>
                    <p className="mb-0" style={{ fontSize: 13, fontWeight: 500 }}>{c.nom}</p>
                    <p className="mb-0" style={{ fontSize: 11.5, color: MUTED, fontFamily: "monospace" }}>{c.police}</p>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20, backgroundColor: c.jours <= 15 ? "#FBE7E7" : "#FDF1DE", color: c.jours <= 15 ? "#B3261E" : "#A15C00" }}>
                    {c.jours} jours
                  </span>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>

      {/* ACTIVITE RECENTE */}
      <div className="mt-3">
        <Panel title="Derniers véhicules ajoutés">
          {stats.vehiculesRecents.length === 0 ? (
            <p style={{ fontSize: 12.5, color: MUTED }}>Aucun véhicule pour l'instant.</p>
          ) : (
            stats.vehiculesRecents.map((v, i) => (
              <div key={i} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: i < stats.vehiculesRecents.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 30, height: 30, backgroundColor: "#EEF2F7" }}>
                    <Car size={14} color={NAVY} />
                  </span>
                  <div>
                    <p className="mb-0" style={{ fontSize: 13, fontWeight: 500 }}>{v.immat} — {v.marque}</p>
                    <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>{v.etab}</p>
                  </div>
                </div>
                <span style={{ fontSize: 11.5, color: MUTED }}>{v.date}</span>
              </div>
            ))
          )}
        </Panel>
      </div>

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}