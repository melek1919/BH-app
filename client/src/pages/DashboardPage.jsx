import { useEffect, useMemo, useState } from "react";
import { Building2, Car, AlertTriangle, Archive, ArrowUpRight, Loader2, AlertCircle, FileText, BarChart3, PieChart as PieChartIcon, Hash, Tag } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
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
const BRAND_COLORS = ["#2B6CB0", "#1E7B3A", "#B8912E", "#A15C00", "#B3261E", "#6B7684", "#0B1F38", "#C05A2E"];

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

function KpiCard({ icon: Icon, label, value, bg, fg, sub }) {
  return (
    <div className="d-flex flex-column gap-2 p-3 rounded-4 bg-white" style={{ border: `1px solid ${BORDER}` }}>
      <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 36, height: 36, backgroundColor: bg }}>
        <Icon size={18} color={fg} strokeWidth={2} />
      </div>
      <div>
        <p className="mb-0 fw-bold" style={{ fontSize: 24, color: "#161B22" }}>{value}</p>
        <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>{label}</p>
      </div>
      {sub && (
        <span className="align-self-start" style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, backgroundColor: bg, color: fg }}>
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
    const totalContrats = contratsAll.length;
    const totalActifs = vehiculesActifs.length;
    const totalRetires = vehiculesRetires.length;

    const nouveauxEtabsMois = etablissements.filter((e) => isSameMonth(e.created_at, now)).length;
    const nouveauxVehiculesMois = vehiculesActifs.filter((v) => isSameMonth(v.created_at, now)).length;

    // --- Top établissements par nombre de véhicules
    const contratById = Object.fromEntries(contratsAll.map((c) => [c.id, c]));
    const etabVehiculeCounts = vehiculesActifs.reduce((acc, v) => {
      const nom = contratById[v.contrat_id]?.etablissementNom || "Inconnu";
      acc[nom] = (acc[nom] || 0) + 1;
      return acc;
    }, {});
    const topEtablissementsVehicules = Object.entries(etabVehiculeCounts)
      .map(([name, vehicules]) => ({ name, vehicules }))
      .sort((a, b) => b.vehicules - a.vehicules)
      .slice(0, 8);

    // --- Véhicules par marque
    const marqueCounts = vehiculesActifs.reduce((acc, v) => {
      const key = v.marque?.trim() || "Inconnue";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topMarques = Object.entries(marqueCounts)
      .map(([name, vehicules]) => ({ name, vehicules }))
      .sort((a, b) => b.vehicules - a.vehicules)
      .slice(0, 8);

    // --- Top établissements par nombre de contrats
    const etabContratCounts = contratsAll.reduce((acc, c) => {
      const nom = c.etablissementNom || "Inconnu";
      acc[nom] = (acc[nom] || 0) + 1;
      return acc;
    }, {});
    const topEtablissementsContrats = Object.entries(etabContratCounts)
      .map(([name, contrats]) => ({ name, contrats }))
      .sort((a, b) => b.contrats - a.contrats)
      .slice(0, 8);

    // --- Actifs vs Retirés
    const actifsVsRetires = [
      { name: "Actifs", value: totalActifs },
      { name: "Retirés", value: totalRetires },
    ];

    // --- Répartition par gouvernorat
    const gouvCounts = etablissements.reduce((acc, e) => {
      const key = e.gouvernorat?.trim() || "Non renseigné";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const repartitionGouvernorat = Object.entries(gouvCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);

    // --- Derniers véhicules ajoutés (les 3 plus récents)
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
      totalEtablissements, totalContrats, totalActifs, totalRetires,
      nouveauxEtabsMois, nouveauxVehiculesMois,
      topEtablissementsVehicules, topMarques, topEtablissementsContrats,
      actifsVsRetires, repartitionGouvernorat, vehiculesRecents,
    };
  }, [etablissements, contratsAll, vehiculesActifs, vehiculesRetires]);

  const totalGouv = stats.repartitionGouvernorat.reduce((s, d) => s + d.value, 0);
  const totalAvr = stats.actifsVsRetires.reduce((s, d) => s + d.value, 0);

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
      {/* KPI ROW — vibrant cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <KpiCard icon={Building2} label="Établissements" value={stats.totalEtablissements} bg="#0B1F38" fg="#fff" sub={`+${stats.nouveauxEtabsMois} ce mois`} />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={Car} label="Véhicules actifs" value={stats.totalActifs.toLocaleString("fr-FR")} bg="#1E7B3A" fg="#fff" sub={`+${stats.nouveauxVehiculesMois} ce mois`} />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={FileText} label="Contrats" value={stats.totalContrats} bg="#B8912E" fg="#fff" sub="tous statuts" />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={Archive} label="Véhicules retirés" value={stats.totalRetires} bg="#B3261E" fg="#fff" sub="historique" />
        </div>
      </div>

      <div className="row g-3">
        {/* TOP ÉTABLISSEMENTS (véhicules) */}
        <div className="col-lg-7">
          <Panel title="Top établissements (véhicules)" action={<span style={{ fontSize: 11.5, color: MUTED }}>parc client</span>}>
            {stats.topEtablissementsVehicules.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={stats.topEtablissementsVehicules} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid horizontal={false} stroke={BORDER} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F3F5F8" }} />
                  <Bar dataKey="vehicules" fill="#2B6CB0" radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* RÉPARTITION PAR GOUVERNORAT */}
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

        {/* VÉHICULES PAR MARQUE */}
        <div className="col-lg-7">
          <Panel title="Véhicules par marque" action={<span style={{ fontSize: 11.5, color: MUTED }}>{stats.topMarques.reduce((s, d) => s + d.vehicules, 0)} véhicules</span>}>
            {stats.topMarques.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={stats.topMarques} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={BORDER} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F3F5F8" }} />
                  <Bar dataKey="vehicules" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {stats.topMarques.map((d, i) => (
                      <Cell key={d.name} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* ACTIFS VS RETIRÉS */}
        <div className="col-lg-5">
          <Panel title="Parc véhicules">
            {totalAvr === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.actifsVsRetires} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2} stroke="none">
                        <Cell fill="#1E7B3A" />
                        <Cell fill="#F1F2F4" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-grow-1">
                  {stats.actifsVsRetires.map((d) => {
                    const pct = totalAvr ? Math.round((d.value / totalAvr) * 100) : 0;
                    return (
                      <div key={d.name} className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: d.name === "Actifs" ? "#1E7B3A" : "#D0D5DE", flexShrink: 0 }} />
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
      </div>

      {/* DEUXIÈME RANGÉE */}
      <div className="mt-3">
        <div className="row g-3">
          {/* TOP ÉTABLISSEMENTS (contrats) */}
          <div className="col-lg-7">
            <Panel title="Top établissements (contrats)" action={<span style={{ fontSize: 11.5, color: MUTED }}>portefeuille</span>}>
              {stats.topEtablissementsContrats.length === 0 ? (
                <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={stats.topEtablissementsContrats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid horizontal={false} stroke={BORDER} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F3F5F8" }} />
                    <Bar dataKey="contrats" fill="#B8912E" radius={[0, 6, 6, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>
          </div>

          {/* DERNIERS VÉHICULES AJOUTÉS */}
          <div className="col-lg-5">
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
        </div>
      </div>

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}