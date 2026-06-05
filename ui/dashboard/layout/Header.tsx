import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

export const Header: React.FC = () => {
  const { alerts, activePatient } = useDashboard();
  const [showNotifications, setShowNotifications] = useState(false);
  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 w-96">
        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search patients, MRNs, clinical trials, or AI insights..."
          className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-6">
        {activePatient && (
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500 font-medium">Active Context:</span>
            <span className="font-semibold text-slate-800">{activePatient.name}</span>
            <span className="text-slate-400">({activePatient.mrn})</span>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {activeAlertsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="font-semibold text-sm text-slate-800">AI Clinical Alerts</span>
                <span className="text-xs text-rose-500 font-medium">{activeAlertsCount} active</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">No active alerts</div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-all">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          alert.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mb-1">{alert.message}</p>
                      <div className="text-[10px] text-slate-400">Patient: {alert.patientName} ({alert.bedNumber})</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            AM
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-semibold text-slate-800">Dr. Alex Mercer, MD</div>
            <div className="text-xs text-slate-400">Chief of ICU Medicine</div>
          </div>
        </div>
      </div>
    </header>
  );
};
