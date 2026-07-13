import { useEffect, useState } from "react";
import {
  Building2,
  Car,
  AlertTriangle,
  Archive,
  ArrowUpRight,
} from "lucide-react";
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

// Couleurs de marque — mêmes tokens que SidebarLayout.jsx
const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const CODE_COLORS = {
  A: "#1E7B3A",
  B: "#2B6CB0",
  C: "#C98A1A",
  D: "#B3261E",
  M: "#9AA3AF",
};

// ---------------------------------------------------------------
// Données de démonstration — remplace par de vrais appels API :
//   GET /api/etablissements     -> KPI + répartition codes
//   GET /api/vehicules          -> véhicules actifs + répartition usage
//   GET /api/vehicules/retires  -> véhicules retirés
// L'évolution mensuelle nécessite soit un endpoint dédié
// (COUNT(*) GROUP BY DATE_TRUNC('month', created_at)), soit un calcul
// côté front à partir de vehicule.created_at.
// ---------------------------------------------------------------
const MOCK = {
  totalEtablissements: 184,
  vehiculesActifs: 1042,
  vehiculesRetires: 63,
  contratsAEcheance: 27,
  repartitionCodes: { A: 96, B: 41, C: 22, D: 9, M: 16 },
  evolutionParc: [
    { mois: "Fév", vehicules: 860 },
    { mois: "Mar", vehicules: 902 },
    { mois: "Avr", vehicules: 941 },
    { mois: "Mai", vehicules: 978 },
    { mois: "Juin", vehicules: 1011 },
    { mois: "Juil", vehicules: 1042 },
  ],
  repartitionUsage: [
    { usage: "Tourisme", total: 412 },
    { usage: "Motocycle", total: 268 },
    { usage: "Sanitaire", total: 154 },
    { usage: "Engins", total: 121 },
    { usage: "Autre", total: 87 },
  ],
  contratsProches: [
    { nom: "Ministère de la Santé", police: "POL-2026-001", jours: 12 },
    { nom: "Lycée Bab Saadoun", police: "POL-2026-014", jours: 24 },
    { nom: "Municipalité de l'Ariana", police: "POL-2026-009", jours: 27 },
  ],
  vehiculesRecents: [
    { immat: "123 TUN 4567", etab: "Ministère de la Santé", marque: "Renault", date: "07/07/2026" },
    { immat: "187 TUN 8890", etab: "Hôpital Charles Nicolle", marque: "Toyota", date: "05/07/2026" },
    { immat: "212 TUN 3341", etab: "Municipalité de l'Ariana", marque: "Isuzu", date: "02/07/2026" },
  ],
};

function Panel({ title, action, children }) {
  return (
    <div className="p-3 rounded-4 bg-white h-100" style={{ border: `1px solid ${BORDER}` }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <p className="mb-0 fw-semibold" style={{ fontSize: 14 }}>
          {title}
        </p>
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
      <div
        className="d-flex align-items-center justify-content-center rounded-3"
        style={{ width: 36, height: 36, backgroundColor: c.bg }}
      >
        <Icon size={18} color={c.fg} strokeWidth={2} />
      </div>
      <div>
        <p className="mb-0 fw-semibold" style={{ fontSize: 24, color: "#161B22" }}>
          {value}
        </p>
        <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>
          {label}
        </p>
      </div>
      {sub && (
        <span
          className="align-self-start"
          style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, backgroundColor: c.bg, color: c.fg }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 12,
        boxShadow: "0 2px 8px rgba(15,31,56,0.08)",
      }}
    >
      <p className="mb-0" style={{ color: MUTED }}>{label}</p>
      <p className="mb-0 fw-semibold" style={{ color: NAVY }}>{payload[0].value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data] = useState(MOCK);

  useEffect(() => {
    // Branchement réel — voir commentaire au-dessus de MOCK pour les endpoints.
  }, []);

  const donutData = ["A", "B", "C", "D", "M"].map((code) => ({
    name: code,
    value: data.repartitionCodes[code] || 0,
  }));
  const totalCodes = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      {/* KPI ROW */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <KpiCard icon={Building2} label="Établissements" value={data.totalEtablissements} tone="navy" sub="+6 ce mois" />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={Car} label="Véhicules actifs" value={data.vehiculesActifs.toLocaleString("fr-FR")} tone="ok" sub="+31 ce mois" />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={AlertTriangle} label="Contrats à renouveler (30j)" value={data.contratsAEcheance} tone="warn" sub="à traiter" />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={Archive} label="Véhicules retirés" value={data.vehiculesRetires} tone="muted" sub="historique" />
        </div>
      </div>

      <div className="row g-3">
        {/* EVOLUTION DU PARC */}
        <div className="col-lg-7">
          <Panel title="Évolution du parc véhicules" action={<span style={{ fontSize: 11.5, color: MUTED }}>6 derniers mois</span>}>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={data.evolutionParc} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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

        {/* REPARTITION CODES - DONUT */}
        <div className="col-lg-5">
          <Panel title="Fiabilisation des établissements">
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={38}
                      outerRadius={62}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donutData.map((d) => (
                        <Cell key={d.name} fill={CODE_COLORS[d.name]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-grow-1">
                {donutData.map((d) => {
                  const pct = totalCodes ? Math.round((d.value / totalCodes) * 100) : 0;
                  return (
                    <div key={d.name} className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: CODE_COLORS[d.name], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#161B22", width: 16 }}>{d.name}</span>
                      <span style={{ fontSize: 12, color: MUTED }}>{d.value} · {pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        </div>

        {/* REPARTITION PAR USAGE */}
        <div className="col-lg-7">
          <Panel title="Véhicules par type d'usage">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={data.repartitionUsage} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={BORDER} />
                <XAxis dataKey="usage" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F3F5F8" }} />
                <Bar dataKey="total" fill={NAVY} radius={[6, 6, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* CONTRATS A ECHEANCE */}
        <div className="col-lg-5">
          <Panel title="Contrats à échéance" action={<span style={{ fontSize: 11.5, color: MUTED }}>30 jours</span>}>
            {data.contratsProches.map((c, i) => (
              <div
                key={i}
                className="d-flex align-items-center justify-content-between py-2"
                style={{ borderBottom: i < data.contratsProches.length - 1 ? `1px solid ${BORDER}` : "none" }}
              >
                <div>
                  <p className="mb-0" style={{ fontSize: 13, fontWeight: 500 }}>{c.nom}</p>
                  <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>{c.police}</p>
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: 20,
                    backgroundColor: c.jours <= 15 ? "#FBE7E7" : "#FDF1DE",
                    color: c.jours <= 15 ? "#B3261E" : "#A15C00",
                  }}
                >
                  {c.jours} jours
                </span>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      {/* ACTIVITE RECENTE */}
      <div className="mt-3">
        <Panel
          title="Derniers véhicules ajoutés"
          action={
            <a href="#" className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: NAVY, textDecoration: "none" }}>
              Voir tout <ArrowUpRight size={13} />
            </a>
          }
        >
          {data.vehiculesRecents.map((v, i) => (
            <div
              key={i}
              className="d-flex align-items-center justify-content-between py-2"
              style={{ borderBottom: i < data.vehiculesRecents.length - 1 ? `1px solid ${BORDER}` : "none" }}
            >
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
          ))}
        </Panel>
      </div>
    </div>
  );
}