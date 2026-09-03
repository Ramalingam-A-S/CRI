import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { AlertBanner } from './components/layout/AlertBanner';
import { LiveMapPage } from './pages/Dashboard/LiveMapPage';
import { SimulationPage } from './pages/Simulation/SimulationPage';
import { ResponsePage } from './pages/Response/ResponsePage';
import { SensorsPage } from './pages/Sensors/SensorsPage';
import { AdminPage } from './pages/Admin/AdminPage';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('map');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050810] text-slate-200 font-sans">
      <Navbar />
      <AlertBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {activeTab === 'map' && <LiveMapPage />}
          {activeTab === 'simulation' && <SimulationPage />}
          {activeTab === 'response' && <ResponsePage />}
          {activeTab === 'sensors' && <SensorsPage />}
          {activeTab === 'admin' && <AdminPage />}
        </main>
      </div>
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
