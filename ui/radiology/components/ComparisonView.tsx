import React from 'react';
import { useRadiology } from '../context/RadiologyContext';
import { DICOMViewer } from '../viewer/DICOMViewer';

export const ComparisonView: React.FC = () => {
  const { state } = useRadiology();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full w-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Current Study (Active)
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {state.metadata?.studyDate || 'N/A'}
          </span>
        </div>
        <div className="flex-1 min-h-[400px]">
          <DICOMViewer />
        </div>
      </div>

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Prior Study (Comparison)
          </span>
          <span className="text-xs text-slate-500 font-mono">2024-11-12</span>
        </div>
        <div className="flex-1 min-h-[400px] relative opacity-80 hover:opacity-100 transition-opacity">
          <DICOMViewer />
          <div className="absolute top-3 left-3 bg-amber-950/80 border border-amber-800 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider">
            Prior Reference
          </div>
        </div>
      </div>
    </div>
  );
};