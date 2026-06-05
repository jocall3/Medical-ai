import React from 'react';
import { useDashboard } from '../context/DashboardContext';

export const AlertFeed: React.FC = () => {
  const { alerts, acknowledgeAlert, escalateAlert } = useDashboard();

  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Live AI Alert Feed</h3>
          <p className="text-xs text-slate-400">Real-time clinical anomaly detection</p>
        </div>
        <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">
          {activeAlerts.length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-1">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>All patient parameters within normal limits.</span>
          </div>
        ) : ( 
          activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                alert.severity === 'critical'
                  ? 'bg-rose-5/50 border-rose-100'
                  : 'bg-amber-5/50 border-amber-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    alert.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                  }`} />
                  <span className="font-bold text-xs text-slate-800">
                    {alert.patientName} ({alert.bedNumber})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {alert.message}
              </p>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                >
                  Acknowledge
                </button>
                {alert.severity !== 'critical' && (
                  <button
                    onClick={() => escalateAlert(alert.id)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    Escalate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
