import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { VesselDetail } from "./pages/VesselDetail";
import { Compare } from "./pages/Compare";
import { EconomicImpact } from "./pages/EconomicImpact";
import { HullSections } from "./pages/HullSections";
import { DefectDetail } from "./pages/DefectDetail";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vessels/:id" element={<VesselDetail />} />
        <Route path="/vessels/:id/compare" element={<Compare />} />
        <Route path="/vessels/:id/economics" element={<EconomicImpact />} />
        <Route path="/vessels/:id/sections" element={<HullSections />} />
        <Route path="/vessels/:id/defects/:defectId" element={<DefectDetail />} />
      </Routes>
    </AppShell>
  );
}
