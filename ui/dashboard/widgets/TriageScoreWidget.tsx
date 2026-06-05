import React from 'react';
import { useDashboard } from '../context/DashboardContext';

export const TriageScoreWidget: React.FC = () => {
  const { activePatient } = useDashboard();

  if (!activePatient) {
    return null;
  }

  const { triage } = activePatient;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Emergent':
        return 'bg-rose-500 text-white';
      case 'Urgent':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">AI Triage & Risk Analysis</h3>
          <p className="text-xs text-slate-400">Explainable AI (XAI) clinical risk attribution</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getLevelColor(triage.level)}`}>
          {triage.level}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex flex-col items-center justify-center border-r border-slate-100 py-4">
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#f1f5f9"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={triage.level === 'Emergent' ? '#f43f5e' : '#f59e0b'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={351.8}
                strokeDashoffset={351.8 - (351.8 * triage.score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-800">{triage.score}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">AI Index</span>
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Sepsis Risk (SIRS/SOFA AI)</span>
              <span className={triage.sepsisRisk > 50 ? 'text-rose-500' : 'text-slate-500'}>{triage.sepsisRisk}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${triage.sepsisRisk > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${triage.sepsisRisk}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Cardiac Event Risk</span>
              <span className={triage.cardiacRisk > 50 ? 'text-rose-500' : 'text-slate-500'}>{triage.cardiacRisk}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${triage.cardiacRisk > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${triage.cardiacRisk}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>30-Day Mortality Risk</span>
              <span className={triage.mortalityRisk > 20 ? 'text-rose-500' : 'text-slate-500'}>{triage.mortalityRisk}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${triage.mortalityRisk > 20 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${triage.mortalityRisk}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key AI Feature Attributions</h4>
        <div className="space-y-2">
          {triage.keyContributors.map((contrib, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-bold text-rose-500">+{contrib.impact}%</span>
              <div>
                <span className="font-semibold text-slate-700">{contrib.feature}: </span>
                <span className="text-slate-500">{contrib.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 bg-emerald-50/30 -mx-6 -mb-6 p-6 rounded-b-2xl">
        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          AI-Generated Clinical Recommendations
        </h4>
        <ul className="space-y-2">
          {triage.recommendations.map((rec, idx) => (
            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
              <span className="text-emerald-600 font-bold">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
