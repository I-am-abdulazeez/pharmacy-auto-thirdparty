import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import LeadwayLoginPage from "@/pages/leadway-login";
import ProviderLoginPage from "@/pages/provider-login";
import PharmacyPage from "@/pages/pharmacy";
import EnrolleesPage from "@/pages/enrollees";
import DeliveriesPage from "@/pages/deliveries";
import PayAutoLinePage from "@/pages/providers/pay-autoline";
import PendingCollections from "@/pages/providers/pending-collections";
import ProtectedLeadwayRoute from "@/components/shared/protected-leadway";
import ProtectedProviderRoute from "@/components/shared/protected-provider";
import PendingDeliveriesPage from "@/pages/providers/pending-deliveries";
import ReassignOrClaimPage from "@/pages/providers/reassign-claim";

function App() {
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
        <Route element={<PayAutoLinePage />} path="pay-autoline" />
        <Route element={<PendingCollections />} path="pending-collections" />
        <Route element={<PendingDeliveriesPage />} path="pending-deliveries" />
        <Route element={<ReassignOrClaimPage />} path="reassign-or-claim" />
      </Route>
    </Routes>
  );
}

export default App;
