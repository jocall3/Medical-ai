import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { PatientVitalsWidget } from '../widgets/PatientVitalsWidget';
import { TriageScoreWidget } from '../widgets/TriageScoreWidget';
import { AlertFeed } from '../widgets/AlertFeed';

export const MainDashboard: React.FC = () => {
  const { activePatient } = useDashboardData();

  return (
    <div className="space-y-6">
      {activePatient && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-800">{activePatient.name}</h2>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {activePatient.mrn}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Admitted for: <span className="text-slate-700 font-semibold">{activePatient.admissionReason}</span>
            </p>
          </div>

          <div className="flex gap-6 text-sm border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-slate-400 font-medium">Age / Gender</div>
              <div className="font-semibold text-slate-800">{activePatient.age} / {activePatient.gender}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Bed Location</div>
              <div className="font-semibold text-slate-800">{activePatient.bedNumber}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Attending Physician</div>
              <div className="font-semibold text-slate-800">Dr. Alex Mercer</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <PatientVitalsWidget />
          <TriageScoreWidget />
        </div>

        <div className="xl:col-span-1">
          <AlertFeed />
        </div>
      </div>
    </div>
  );
};
