import React from 'react';
import { useDashboard } from '../context/DashboardContext';

export const PatientVitalsWidget: React.FC = () => {
  const { activePatient } = useDashboard();

  if (!activePatient) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center h-96">
        <p className="text-slate-400 text-sm">No active patient selected.</p>
      </div>
    );
  }

  const { vitals } = activePatient;

  const getStatusColor = (type: string, val: number) => {
    if (type === 'hr') {
      if (val > 100 || val < 50) return 'text-rose-500 border-rose-100 bg-rose-50';
      if (val > 90 || val < 60) return 'text-amber-500 border-amber-100 bg-amber-50';
      return 'text-emerald-500 border-emerald-100 bg-emerald-50';
    }
    if (type === 'spo2') {
      if (val < 92) return 'text-rose-500 border-rose-100 bg-rose-50';
      if (val < 95) return 'text-amber-500 border-amber-100 bg-amber-50';
      return 'text-emerald-500 border-emerald-100 bg-emerald-50';
    }
    if (type === 'temp') {
      if (val > 38.5 || val < 35.5) return 'text-rose-500 border-rose-100 bg-rose-50';
      if (val > 37.5 || val < 36.0) return 'text-amber-500 border-amber-100 bg-amber-50';
      return 'text-emerald-500 border-emerald-100 bg-emerald-50';
    }
    return 'text-emerald-500 border-emerald-100 bg-emerald-50';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Real-Time Patient Vitals</h3>
          <p className="text-xs text-slate-400">Continuous telemetry stream via AegisLink™</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Stream
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border transition-all ${getStatusColor('hr', vitals.heartRate)}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Heart Rate</span>
            <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{vitals.heartRate}</span>
            <span className="text-xs font-medium opacity-80">bpm</span>
          </div>
          <div className="mt-2 text-[10px] opacity-70">Normal range: 60-100 bpm</div>
        </div>

        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-700">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Blood Pressure</span>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">
              {vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}
            </span>
            <span className="text-xs font-medium text-slate-500">mmHg</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">Normal range: 120/80 mmHg</div>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${getStatusColor('spo2', vitals.spO2)}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Oxygen Saturation</span>
            <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{vitals.spO2}</span>
            <span className="text-xs font-medium opacity-80">%</span>
          </div>
          <div className="mt-2 text-[10px] opacity-70">Normal range: 95-100%</div>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${getStatusColor('temp', vitals.temperature)}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Temperature</span>
            <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{vitals.temperature}</span>
            <span className="text-xs font-medium opacity-80">°C</span>
          </div>
          <div className="mt-2 text-[10px] opacity-70">Normal range: 36.5-37.5 °C</div>
        </div>

        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-700">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Respiratory Rate</span>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{vitals.respiratoryRate}</span>
            <span className="text-xs font-medium text-slate-500">bpm</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">Normal range: 12-20 bpm</div>
        </div>
      </div>
    </div>
  );
};
