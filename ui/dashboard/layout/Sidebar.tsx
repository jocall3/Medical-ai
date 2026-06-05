import React from 'react';
import { useDashboard } from '../context/DashboardContext';

export const Sidebar: React.FC = () => {
  const { patients, activePatient, setActivePatientId } = useDashboard();

  return (
    <aside className="w-80 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">AegisMed AI</h1>
          <p className="text-xs text-slate-400 font-medium">Clinical Decision Support</p>
        </div>
      </div>

      <nav className="p-4 space-y-1.5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Navigation</div>
        <a href="#dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800 text-white font-medium transition-all">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          Clinical Dashboard
        </a>
        <a href="#analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          Predictive Analytics
        </a>
        <a href="#trials" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Clinical Trials AI
        </a>
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-2 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Active Ward Patients</div>
        <div className="space-y-2">
          {patients.map((patient) => {
            const isActive = activePatient?.id === patient.id;
            const isEmergent = patient.triage.level === 'Emergent';
            return (
              <button
                key={patient.id}
                onClick={() => setActivePatientId(patient.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 border ${
                  isActive
                    ? 'bg-slate-800 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-900/50 border-transparent hover:bg-slate-800/30 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-slate-200">{patient.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isEmergent ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {patient.bedNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{patient.age} y/o • {patient.gender}</span>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isEmergent ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                    AI Score: {patient.triage.score}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>AI Engine Online</span>
        </div>
        <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono">v4.2.1-prod</span>
      </div>
    </aside>
  );
};
