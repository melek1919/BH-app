import { LayoutDashboard, Building2, Car, FileStack, ChevronRight, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/bh-logo.png"; // ajuste le chemin selon l'emplacement réel

const NAV_ITEMS = (role) => {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "etablissements", label: "Établissements", icon: Building2 },
    { key: "vehicules", label: "Véhicules", icon: Car },
    { key: "contrats-injection", label: "Contrats", icon: FileStack },
  ];
  if (role === "admin") {
    items.push({ key: "utilisateurs", label: "Utilisateurs", icon: UserCircle });
  }
  return items;
};

const TITLES = {
  dashboard: "Dashboard",
  etablissements: "Établissements",
  vehicules: "Véhicules",
  "contrats-injection": "Contrats",
  utilisateurs: "Utilisateurs",
};

const SUBTITLES = {
  dashboard: "Vue d'ensemble du portefeuille",
  etablissements: "Gestion des établissements publics",
  vehicules: "Parc automobile des établissements",
  "contrats-injection": "Sélection et injection des contrats dans le SI",
  utilisateurs: "Gestion des comptes agents",
};

// Couleurs de marque (Bootstrap n'a pas ces teintes par défaut)
const NAVY = "#0B1F38";
const GOLD = "#B8912E";
const SIDEBAR_BG = "#F3F5F8";
const SIDEBAR_BORDER = "#E4E8EE";
const ACTIVE_BG = "#FFFFFF";
const HOVER_BG = "#E9ECF1";
const MUTED = "#6B7684";

const ROLE_LABELS = {
  guest: "Invité",
  admin: "Administrateur",
  gestion_etablissement: "Gestion établissements",
  gestion_vehicule: "Gestion véhicules",
  gestion_globale: "Gestion globale",
};

export default function SidebarLayout({ active, onNavigate, children }) {
  const { user, logout } = useAuth();

  const initiales = user
    ? `${(user.prenom || "").charAt(0)}${(user.nom || "").charAt(0)}`.toUpperCase() || "?"
    : "?";
  const nomComplet = user ? `${user.prenom || ""} ${user.nom || ""}`.trim() : "";
  const roleLabel = user ? ROLE_LABELS[user.role] || user.role : "";

  return (
    <div className="d-flex vh-100 w-100" style={{ backgroundColor: "#FAFBFC" }}>
      {/* SIDEBAR */}
      <aside
        className="d-flex flex-column flex-shrink-0 px-3 py-4"
        style={{ width: "260px", backgroundColor: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <div className="d-flex align-items-center justify-content-center mb-4 px-2 py-2">
          <img
            src={logo}
            alt="BH Assurance"
            style={{ width: "100%", maxWidth: 190, height: "auto", objectFit: "contain" }}
          />
        </div>

        <nav className="flex-grow-1 d-flex flex-column gap-1">
          {NAV_ITEMS(user?.role).map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className="btn d-flex align-items-center gap-2 text-start border-0 rounded"
                style={{
                  fontSize: 13,
                  padding: "10px 12px",
                  backgroundColor: isActive ? ACTIVE_BG : "transparent",
                  color: isActive ? NAVY : MUTED,
                  fontWeight: isActive ? 600 : 400,
                  boxShadow: isActive ? "0 1px 3px rgba(15,31,56,0.12)" : "none",
                  transition: "background-color .15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = HOVER_BG;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon size={16} strokeWidth={2} color={isActive ? GOLD : MUTED} />
                {label}
                {isActive && (
                  <ChevronRight size={14} color={GOLD} className="ms-auto" />
                )}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* MAIN */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        {/* HEADER */}
        <header
          className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-white"
          style={{ minHeight: 76 }}
        >
          <div>
            <h1 className="mb-0 fw-semibold" style={{ fontSize: 17, color: "#161B22" }}>
              {TITLES[active]}
            </h1>
            <p className="mb-0" style={{ fontSize: 12.5, color: "#8A97A6" }}>
              {SUBTITLES[active]}
            </p>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-flex align-items-center justify-content-center rounded-circle text-white"
                style={{ width: 32, height: 32, fontSize: 12, backgroundColor: NAVY, flexShrink: 0 }}
              >
                {initiales}
              </span>
              <div>
                <p className="mb-0 fw-medium" style={{ fontSize: 12.5, color: "#161B22" }}>
                  {nomComplet || "Agent"}
                </p>
                <p className="mb-0" style={{ fontSize: 10.5, color: "#8A97A6" }}>
                  {roleLabel}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Se déconnecter"
              className="btn btn-sm border-0 d-flex align-items-center justify-content-center rounded-3"
              style={{ width: 34, height: 34, color: MUTED, transition: "background-color .15s, color .15s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FBE7E7";
                e.currentTarget.style.color = "#B3261E";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = MUTED;
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-grow-1 overflow-auto p-4">
          {children ?? (
            <div
              className="d-flex align-items-center justify-content-center h-100 rounded-4 border border-dashed"
              style={{ color: "#A3ADB8", fontSize: 14 }}
            >
              Contenu de « {TITLES[active]} »
            </div>
          )}
        </main>
      </div>
    </div>
  );
}