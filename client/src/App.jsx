import { useState } from "react";
import SidebarLayout from "./components/layout/SidebarLayout";
import DashboardPage from "./pages/DashboardPage";
import EtablissementsPage from "./pages/EtablissementsPage";
import VehiculesPage from "./pages/VehiculesPage";

function App() {
  const [active, setActive] = useState("dashboard");

  const renderPage = () => {
    switch (active) {
      case "dashboard":
        return <DashboardPage />;
      case "etablissements":
        return <EtablissementsPage />;
      case "vehicules":
        return <VehiculesPage />;
      default:
        return null;
    }
  };

  return (
    <SidebarLayout active={active} onNavigate={setActive}>
      {renderPage()}
    </SidebarLayout>
  );
}

export default App;