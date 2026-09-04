import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Compass } from 'lucide-react';

interface CompassDialProps {
  value: number; // 0 - 360 degrees
  onChange: (deg: number) => void;
  disabled?: boolean;
}

const getCardinalLabel = (deg: number): string => {
  const normalized = (deg % 360 + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'E';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  return 'NW';
};

export const CompassDial: React.FC<CompassDialProps> = ({ value, onChange, disabled = false }) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current || disabled) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // In meteorological convention, 0° is North (top), 90° East (right), 180° South (bottom), 270° West (left)
    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    onChange(Math.round(deg));
  }, [disabled, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    calculateAngle(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        calculateAngle(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateAngle]);

  const cardinal = getCardinalLabel(value);

  return (
    <div className="flex flex-col items-center select-none space-y-2">
      <div className="flex items-center justify-between w-full text-xs font-mono">
        <span className="text-slate-400 flex items-center space-x-1">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>WIND DIRECTION:</span>
        </span>
        <span className="font-bold text-cyan-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
          {Math.round(value)}° ({cardinal})
        </span>
      </div>

      {/* Interactive Compass Dial Wheel */}
      <div
        ref={dialRef}
        onMouseDown={handleMouseDown}
        className={`relative w-40 h-40 rounded-full border-2 border-slate-700 bg-[#070B14] shadow-xl flex items-center justify-center cursor-pointer transition-all ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-cyan-500/70 hover:shadow-cyan-500/20'
        }`}
      >
        {/* Cardinal Markers */}
        <span className="absolute top-1.5 text-[10px] font-mono font-bold text-rose-400">N</span>
        <span className="absolute right-2 text-[10px] font-mono font-bold text-slate-400">E</span>
        <span className="absolute bottom-1.5 text-[10px] font-mono font-bold text-slate-400">S</span>
        <span className="absolute left-2 text-[10px] font-mono font-bold text-slate-400">W</span>

        {/* Secondary markers */}
        <span className="absolute top-6 right-6 text-[8px] font-mono text-slate-600">NE</span>
        <span className="absolute bottom-6 right-6 text-[8px] font-mono text-slate-600">SE</span>
        <span className="absolute bottom-6 left-6 text-[8px] font-mono text-slate-600">SW</span>
        <span className="absolute top-6 left-6 text-[8px] font-mono text-slate-600">NW</span>

        {/* Inner concentric ring */}
        <div className="w-28 h-28 rounded-full border border-dashed border-slate-800 flex items-center justify-center pointer-events-none">
          {/* Degree Center Display */}
          <div className="text-center">
            <span className="font-mono text-lg font-black text-slate-100 block leading-tight">
              {Math.round(value)}°
            </span>
            <span className="text-[10px] font-mono text-cyan-400 tracking-wider">
              {cardinal}
            </span>
          </div>
        </div>

        {/* Rotating Wind Vector Arrow */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: `rotate(${value}deg)` }}
        >
          {/* Arrow Head pointing in wind origin direction */}
          <div className="absolute top-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-cyan-400 filter drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"></div>
          {/* Tail */}
          <div className="w-0.5 h-16 bg-gradient-to-t from-transparent via-cyan-400 to-cyan-300"></div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-mono tracking-tight">
        Click or drag dial to rotate wind origin (0°–360°)
      </div>
    </div>
  );
};
