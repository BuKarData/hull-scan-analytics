import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { VesselDetail } from "./pages/VesselDetail";
import { Compare } from "./pages/Compare";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vessels/:id" element={<VesselDetail />} />
        <Route path="/vessels/:id/compare" element={<Compare />} />
      </Routes>
    </AppShell>
  );
}
