import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar, TabType } from './components/layout/Navbar';
import { LiveMapPage } from './pages/Dashboard/LiveMapPage';
import { SimulationPage } from './pages/Simulation/SimulationPage';
import { ResponsePage } from './pages/Response/ResponsePage';
import { SensorsPage } from './pages/Sensors/SensorsPage';
import { AdminPage } from './pages/Admin/AdminPage';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('map');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070B14] text-slate-100 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === 'map' && <LiveMapPage />}
        {activeTab === 'simulation' && <SimulationPage />}
        {activeTab === 'response' && <ResponsePage />}
        {activeTab === 'sensors' && <SensorsPage />}
        {activeTab === 'admin' && <AdminPage />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
