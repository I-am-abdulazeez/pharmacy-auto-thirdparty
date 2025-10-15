import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import { setNavigateFunction } from "./lib/utils";

import IndexPage from "@/pages/index";
import LeadwayLoginPage from "@/pages/leadway-login";
import ProviderLoginPage from "@/pages/provider-login";
import PharmacyPage from "@/pages/pharmacy";
import EnrolleesPage from "@/pages/enrollees";
import DeliveriesPage from "@/pages/deliveries";
import ProtectedLeadwayRoute from "@/components/shared/protected-leadway";
import ProtectedProviderRoute from "@/components/shared/protected-provider";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigateFunction(navigate);
  }, [navigate]);

  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<LeadwayLoginPage />} path="/leadway-login" />
      <Route element={<ProviderLoginPage />} path="/provider-login" />

      <Route element={<ProtectedLeadwayRoute />} path="/leadway/">
        <Route element={<PharmacyPage />} path="pharmacy" />
        <Route element={<DeliveriesPage />} path="deliveries" />
        <Route element={<EnrolleesPage />} path="enrollees" />
      </Route>
      <Route element={<ProtectedProviderRoute />} path="/provider/">
        <Route element={<PharmacyPage />} path="deliveries" />
      </Route>
    </Routes>
  );
}

export default App;
