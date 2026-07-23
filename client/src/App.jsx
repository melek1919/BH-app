import { useState } from "react";
import SidebarLayout from "./components/layout/SidebarLayout";
import DashboardPage from "./pages/DashboardPage";
import EtablissementsPage from "./pages/EtablissementsPage";
import ContratPage from "./pages/ContratPage";
import VehiculesPage from "./pages/VehiculesPage";

function App() {
  const [active, setActive] = useState("dashboard");
  // { etablissement, contrat } quand on consulte la fiche d'un contrat, sinon null
  const [openContrat, setOpenContrat] = useState(null);

  const handleNavigate = (key) => {
    setOpenContrat(null); // quitter la fiche contrat si on clique un menu sidebar
    setActive(key);
  };

  const renderPage = () => {
    if (active === "etablissements" && openContrat) {
      return (
        <ContratPage
          contrat={openContrat.contrat}
          etablissement={openContrat.etablissement}
          onBack={() => setOpenContrat(null)}
        />
      );
    }
    switch (active) {
      case "dashboard": return <DashboardPage />;
      // Pas d'accès direct à une fiche : on n'arrive sur ContratPage que via
      // un clic sur un contrat dans la popup de l'établissement.
      case "etablissements": return <EtablissementsPage onOpenContrat={(etablissement, contrat) => setOpenContrat({ etablissement, contrat })} />;
      case "vehicules": return <VehiculesPage />;
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