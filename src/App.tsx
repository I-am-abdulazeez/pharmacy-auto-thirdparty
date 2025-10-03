import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import LeadwayLoginPage from "@/pages/leadway-login";
import ProviderLoginPage from "@/pages/provider-login";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<LeadwayLoginPage />} path="/leadway-login" />
      <Route element={<ProviderLoginPage />} path="/provider-login" />
    </Routes>
  );
}

export default App;
