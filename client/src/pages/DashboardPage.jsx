import { useEffect, useMemo, useState } from "react";
import { Building2, Car, AlertTriangle, Archive, ArrowUpRight, Loader2, AlertCircle, FileText, BarChart3, TrendingUp, Trophy, DollarSign, Plus, MinusCircle, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { etablissementsApi, contratsApi, vehiculesApi, tarificationApi } from "../services/api";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

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

function KpiCard({ icon: Icon, label, value, bg, fg, sub }) {  return (
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
      <p className="mb-0 fw-semibold" style={{ color: NAVY }}>{Number(payload[0].value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT</p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, boxShadow: "0 2px 8px rgba(15,31,56,0.08)" }}>
      <p className="mb-0 fw-semibold" style={{ color: NAVY }}>{d.name}</p>
      <p className="mb-0" style={{ color: MUTED }}>{d.value} véhicules · {d.pct}%</p>
    </div>
  );
}

const fmtDT = (n) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DT";

function EvolutionTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, boxShadow: "0 2px 8px rgba(15,31,56,0.08)" }}>
      <p className="mb-0 fw-semibold" style={{ color: NAVY }}>{d.month}</p>
      <p className="mb-0" style={{ color: d.value === payload[0].payload.max ? "#B8912E" : "#1E7B3A" }}>{fmtDT(d.value)} · {pct}%</p>
      <p className="mb-0" style={{ color: MUTED }}>cumul {fmtDT(d.cumul)}</p>
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
  const [contratsAll, setContratsAll] = useState([]);
  const [vehiculesActifs, setVehiculesActifs] = useState([]);
  const [vehiculesRetires, setVehiculesRetires] = useState([]);
  const [topData, setTopData] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [etabs, actifs, retires, top] = await Promise.all([
        etablissementsApi.getAll(),
        vehiculesApi.getAll(),
        vehiculesApi.getRetires(),
        tarificationApi.getTop().catch(() => null),
      ]);
      setEtablissements(etabs);
      setVehiculesActifs(actifs);
      setVehiculesRetires(retires);
      setTopData(top);

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

    // --- Top 3 établissements par flotte assurée
    const contratById = Object.fromEntries(contratsAll.map((c) => [c.id, c]));
    const etabVehiculeCounts = vehiculesActifs.reduce((acc, v) => {
      const nom = contratById[v.contrat_id]?.etablissementNom || "Inconnu";
      acc[nom] = (acc[nom] || 0) + 1;
      return acc;
    }, {});
    const etabContratCounts = contratsAll.reduce((acc, c) => {
      const nom = c.etablissementNom || "Inconnu";
      acc[nom] = (acc[nom] || 0) + 1;
      return acc;
    }, {});
    const topEtablissementsFlotte = Object.entries(etabVehiculeCounts)
      .map(([nom, vehicules]) => ({ nom, vehicules, contrats: etabContratCounts[nom] || 0 }))
      .sort((a, b) => b.vehicules - a.vehicules)
      .slice(0, 3);

    // --- Latest Activity
    const latestActivity = [
      ...vehiculesActifs.filter((v) => v.created_at).map((v) => ({
        type: "vehicule_ajoute",
        label: `${v.immatriculation || "—"} — ${v.marque || "Marque inconnue"}`,
        detail: contratById[v.contrat_id]?.etablissementNom || "—",
        date: v.created_at,
      })),
      ...vehiculesRetires.filter((v) => v.created_at).map((v) => ({
        type: "vehicule_retire",
        label: `${v.immatriculation || "—"} — ${v.marque || "Marque inconnue"}`,
        detail: "Véhicule retiré",
        date: v.created_at,
      })),
      ...contratsAll.filter((c) => c.created_at).map((c) => ({
        type: "contrat_cree",
        label: `Contrat ${c.numero_police || "—"}`,
        detail: c.etablissementNom || "—",
        date: c.created_at,
      })),
      ...etablissements.filter((e) => e.created_at).map((e) => ({
        type: "etablissement_cree",
        label: e.nom,
        detail: e.gouvernorat || "",
        date: e.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    return {
      totalEtablissements, totalContrats, totalActifs, totalRetires,
      nouveauxEtabsMois, nouveauxVehiculesMois,
      topEtablissementsFlotte, latestActivity,
    };
  }, [etablissements, contratsAll, vehiculesActifs, vehiculesRetires]);

  const topVehicules = topData?.topVehicules || [];
  const topContrats = topData?.topContrats || [];
  const evolution = topData?.evolution || [];
  const brackets = topData?.brackets || [];
  const totalBrackets = brackets.reduce((s, d) => s + d.value, 0);

  const evolutionData = useMemo(() => {
    let acc = 0;
    const mapped = evolution.map((d) => {
      const value = Number(d.value) || 0;
      acc += value;
      return { month: d.month, value, cumul: acc };
    });
    const max = mapped.length ? Math.max(...mapped.map((d) => d.value)) : 0;
    return mapped.map((d) => ({ ...d, max }));
  }, [evolution]);

  const totalCA = evolutionData.reduce((s, d) => s + d.value, 0);
  const moyenneCA = evolutionData.length ? totalCA / evolutionData.length : 0;
  const bestMonth = evolutionData.length
    ? evolutionData.reduce((a, b) => (b.value > a.value ? b : a))
    : null;

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
        {/* TARIFICATION — BRACKETS */}
        <div className="col-lg-7">
          <Panel title="Marge de tarification des véhicules" action={<span style={{ fontSize: 11.5, color: MUTED }}>{totalBrackets} véhicules</span>}>
            {brackets.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <div className="d-flex align-items-center gap-3" style={{ height: 210 }}>
                <div style={{ width: 180, height: 180, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={brackets} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none">
                        {brackets.map((d) => (
                          <Cell key={d.name} fill={d.name === "<150" ? "#1E7B3A" : d.name === "150-350" ? "#2B6CB0" : d.name === "350-500" ? "#B8912E" : "#B3261E"} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-grow-1">
                  {brackets.map((d) => {
                    const pct = totalBrackets ? Math.round((d.value / totalBrackets) * 100) : 0;
                    const dotColor = d.name === "<150" ? "#1E7B3A" : d.name === "150-350" ? "#2B6CB0" : d.name === "350-500" ? "#B8912E" : "#B3261E";
                    return (
                      <div key={d.name} className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: dotColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: "#161B22" }}>{d.name} DT</span>
                        <span style={{ fontSize: 12, color: MUTED, marginLeft: "auto" }}>{d.value} · {pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* TOP CONTRATS PLUS CHERS */}
        <div className="col-lg-5">
          <Panel title="Top contrats les plus chers" action={<span style={{ fontSize: 11.5, color: MUTED }}>prime TTC</span>}>
            {topContrats.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={topContrats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid horizontal={false} stroke={BORDER} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " DT"} />
                  <YAxis dataKey="numeroPolice" type="category" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={80} />
                  <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "#F3F5F8" }} />
                  <Bar dataKey="primeTTC" fill="#B8912E" radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      </div>

      <div className="row g-3 mt-3">
        {/* ÉVOLUTION CHIFFRE D'AFFAIRES */}
        <div className="col-lg-7">
          <Panel title="Évolution du chiffre d'affaires" action={<span style={{ fontSize: 11.5, color: MUTED }}>par mois</span>}>
            {evolution.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <>
                <div className="d-flex align-items-center gap-4 mb-1 flex-wrap">
                  <div>
                    <p className="mb-0 fw-bold" style={{ fontSize: 19, color: "#161B22" }}>{fmtDT(totalCA)}</p>
                    <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>CA total ({evolutionData.length} mois)</p>
                  </div>
                  <div>
                    <p className="mb-0 fw-bold" style={{ fontSize: 19, color: "#1E7B3A" }}>{fmtDT(moyenneCA)}</p>
                    <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>Moyenne / mois</p>
                  </div>
                  {bestMonth && (
                    <div className="ms-auto">
                      <p className="mb-0 fw-bold" style={{ fontSize: 13, color: "#B8912E" }}>{fmtDT(bestMonth.value)}</p>
                      <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>Meilleur mois · {bestMonth.month}</p>
                    </div>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={178}>
                  <ComposedChart data={evolutionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="evolBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E7B3A" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1E7B3A" stopOpacity={0.45} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={BORDER} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="ca" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={55}
                      tickFormatter={(v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} />
                    <YAxis yAxisId="cumul" orientation="right" hide />
                    <RechartsTooltip content={<EvolutionTooltip total={totalCA} />} cursor={{ fill: "#F3F5F8" }} />
                    <Bar yAxisId="ca" dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {evolutionData.map((d) => (
                        <Cell key={d.month} fill={bestMonth && d.month === bestMonth.month ? "#B8912E" : "url(#evolBar)"} />
                      ))}
                    </Bar>
                    <Line yAxisId="cumul" type="monotone" dataKey="cumul" stroke="#0B1F38" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </>
            )}
          </Panel>
        </div>

        {/* TOP 3 ÉTABLISSEMENTS PAR FLOTTE ASSURÉE */}
        <div className="col-lg-5">
          <Panel title="Top 3 établissements par flotte assurée">
            {stats.topEtablissementsFlotte.length === 0 ? (
              <p style={{ fontSize: 12.5, color: MUTED }}>Aucune donnée</p>
            ) : (
              <div style={{ fontSize: 12.5 }}>
                <div className="d-flex align-items-center py-2" style={{ borderBottom: `1px solid ${BORDER}`, color: MUTED, fontWeight: 500 }}>
                  <span style={{ width: 40 }}>Rang</span>
                  <span className="flex-grow-1">Établissement</span>
                  <span style={{ width: 70, textAlign: "right" }}>Contrats</span>
                  <span style={{ width: 80, textAlign: "right" }}>Véhicules</span>
                </div>
                {stats.topEtablissementsFlotte.map((e, i) => (
                  <div key={e.nom} className="d-flex align-items-center py-2" style={{ borderBottom: i < stats.topEtablissementsFlotte.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <span className="d-flex align-items-center justify-content-center rounded-3 fw-bold" style={{ width: 40, height: 30, backgroundColor: i === 0 ? "#B8912E" : i === 1 ? "#A0A8B4" : i === 2 ? "#C05A2E" : "#EEF2F7", color: i < 3 ? "#fff" : MUTED, fontSize: 14 }}>
                      {i + 1}
                    </span>
                    <span className="flex-grow-1 fw-medium" style={{ paddingLeft: 10, color: "#161B22" }}>{e.nom.length > 28 ? e.nom.slice(0, 26) + "…" : e.nom}</span>
                    <span style={{ width: 70, textAlign: "right", color: MUTED }}>{e.contrats}</span>
                    <span style={{ width: 80, textAlign: "right", fontWeight: 600, color: NAVY }}>{e.vehicules}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* LATEST ACTIVITY */}
      <div className="mt-3">
        <div className="row g-3">
          <div className="col-12">
            <Panel title="Activité récente" action={<span style={{ fontSize: 11.5, color: MUTED }}><Clock size={12} style={{ marginRight: 4 }} />les plus récentes</span>}>
              {stats.latestActivity.length === 0 ? (
                <p style={{ fontSize: 12.5, color: MUTED }}>Aucune activité pour l'instant.</p>
              ) : (
                stats.latestActivity.map((a, i) => {
                  const iconMap = {
                    vehicule_ajoute: { icon: Car, bg: "#E7F5EC", fg: "#1E7B3A" },
                    vehicule_retire: { icon: Archive, bg: "#FBE7E7", fg: "#B3261E" },
                    contrat_cree: { icon: FileText, bg: "#FDF3E7", fg: "#B8912E" },
                    etablissement_cree: { icon: Building2, bg: "#EAF1FB", fg: "#0B1F38" },
                  };
                  const Icon = iconMap[a.type]?.icon || Car;
                  const { bg, fg } = iconMap[a.type] || {};
                  return (
                    <div key={i} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: i < stats.latestActivity.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 30, height: 30, backgroundColor: bg }}>
                          <Icon size={14} color={fg} />
                        </span>
                        <div>
                          <p className="mb-0" style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</p>
                          <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>{a.detail}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 11.5, color: MUTED }}>{new Date(a.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                  );
                })
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