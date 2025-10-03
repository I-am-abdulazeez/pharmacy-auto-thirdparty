import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import LeadwayLoginPage from "@/pages/leadway-login";
import ProviderLoginPage from "@/pages/provider-login";
import PharmacyPage from "@/pages/pharmacy";
import EnrolleesPage from "@/pages/enrollees";
import DeliveriesPage from "@/pages/deliveries";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<LeadwayLoginPage />} path="/leadway-login" />
      <Route element={<ProviderLoginPage />} path="/provider-login" />

      <Route element={<PharmacyPage />} path="/pharmacy" />
      <Route element={<DeliveriesPage />} path="/deliveries" />
      <Route element={<EnrolleesPage />} path="/enrollees" />
    </Routes>
  );
}

export default App;
