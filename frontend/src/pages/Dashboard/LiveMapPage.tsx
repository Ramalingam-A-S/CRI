import React from 'react';
import { RiskMap } from '../../components/map/RiskMap';
import { RiskDetailsPanel } from '../../components/map/RiskDetailsPanel';
import { SensorDetailsPanel } from '../../components/map/SensorDetailsPanel';

export const LiveMapPage: React.FC = () => {
  return (
    <div className="flex w-full h-full relative overflow-hidden bg-[#070B14]">
      {/* Full-width interactive map view matching Image 1 */}
      <div className="flex-1 h-full relative">
        <RiskMap />
      </div>

      {/* Slide-out details drawer only when a zone or sensor is clicked */}
      <RiskDetailsPanel />
      <SensorDetailsPanel />
    </div>
  );
};
