import React from 'react';
import { useRadiology } from '../context/RadiologyContext';

export const AnomalyConfidence: React.FC = () => {
  const { state, dispatch } = useRadiology();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-400 bg-red-950/50 border-red-800/50';
      case 'warning':
        return 'text-amber-400 bg-amber-950/50 border-amber-800/50';
      default:
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-800/50';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          AI Anomaly Detection
        </h3>
        <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
          ResNet-3D v4.2
        </span>
      </div>

      <div className="space-y-4">
        {state.anomalies.map((anomaly) => {
          const isSelected = state.selectedAnomalyId === anomaly.id;
          return (
            <div
              key={anomaly.id}
              onClick={() => {
                dispatch({
                  type: 'SELECT_ANOMALY',
                  payload: isSelected ? null : anomaly.id,
                });
              }}
              className={`p-3.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/80 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-slate-100">{anomaly.label}</h4>
                  <p className=