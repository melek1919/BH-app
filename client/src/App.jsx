import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SidebarLayout from "./components/layout/SidebarLayout";
import DashboardPage from "./pages/DashboardPage";
import EtablissementsPage from "./pages/EtablissementsPage";
import ContratPage from "./pages/ContratPage";
import VehiculesPage from "./pages/VehiculesPage";
import ContratsInjectionPage from "./pages/ContratInjectionPage";
import UsersPage from "./pages/UsersPage";

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [active, setActive] = useState("dashboard");
  // { etablissement, contrat } quand on consulte la fiche d'un contrat, sinon null
  const [openContrat, setOpenContrat] = useState(null);
  // Établissement dont il faut rouvrir le popup au retour depuis ContratPage
  const [reopenEtab, setReopenEtab] = useState(null);

  // Vérification de la session (token existant) au tout premier chargement
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 w-100" style={{ backgroundColor: "#0B1F38" }}>
        <Loader2 size={26} color="#fff" className="bh-app-spin" />
        <style>{`
          @keyframes bh-app-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .bh-app-spin { animation: bh-app-spin 0.8s linear infinite; }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (key) => {
    setOpenContrat(null); // quitter la fiche contrat si on clique un menu sidebar
    setReopenEtab(null);
    setActive(key);
  };

  const handleBackFromContrat = () => {
    setReopenEtab(openContrat?.etablissement || null);
    setOpenContrat(null);
  };

  const renderPage = () => {
    if (active === "etablissements" && openContrat) {
      return (
        <ContratPage
          contrat={openContrat.contrat}
          etablissement={openContrat.etablissement}
          onBack={handleBackFromContrat}
        />
      );
    }
    switch (active) {
      case "dashboard": return <DashboardPage />;
      // Pas d'accès direct à une fiche : on n'arrive sur ContratPage que via
      // un clic sur un contrat dans la popup de l'établissement.
      case "etablissements":
        return (
          <EtablissementsPage
            onOpenContrat={(etablissement, contrat) => setOpenContrat({ etablissement, contrat })}
            reopenEtablissement={reopenEtab}
            onReopenConsumed={() => setReopenEtab(null)}
          />
        );
      case "vehicules": return <VehiculesPage />;
      case "contrats-injection": return <ContratsInjectionPage />;
      case "utilisateurs": return user?.role === "admin" ? <UsersPage /> : <DashboardPage />;
      default: return null;
    }
  };

  return (
    <SidebarLayout active={active} onNavigate={handleNavigate}>
      {renderPage()}
    </SidebarLayout>
  );
}

export default App;