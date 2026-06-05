import React from 'react';
import { getPathogenicityColor } from '../utils/formatters';

interface PathogenicityScoreProps {
  clinVar: 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Likely Benign' | 'Benign';
  caddScore: number;
  revelScore: number;
}

export const PathogenicityScore: React.FC<PathogenicityScoreProps> = ({
  clinVar,
  caddScore,
  revelScore
}) => {
  const caddPercentage = Math.min(100, (caddScore / 40) * 100);
  const revelPercentage = revelScore * 100;

  const getScoreColor = (score: number, type: 'cadd' | 'revel') => {
    if (type === 'cadd') {
      if (score >= 25) return 'bg-red-500';
      if (score >= 15) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (score >= 0.75) return 'bg-red-500';
      if (score >= 0.5) return 'bg-yellow-500';
      return 'bg-green-500';
    } 
  };

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">ClinVar Status</span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getPathogenicityColor(clinVar)}`}>
          {clinVar}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">CADD Score</span>
          <span className="font-bold text-slate-900 dark:text-white">{caddScore} <span className="text-slate-400 font-normal">(Threshold: 20)</span></span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getScoreColor(caddScore, 'cadd')}`}
            style={{ width: `${caddPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">REVEL Score</span>
          <span className="font-bold text-slate-900 dark:text-white">{revelScore.toFixed(2)} <span className="text-slate-400 font-normal">(Threshold: 0.5)</span></span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getScoreColor(revelScore, 'revel')}`}
            style={{ width: `${revelPercentage}%` }}
          />
        </div>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
        * CADD (Combined Annotation Dependent Depletion) and REVEL (Rare Exome Variant Ensemble Learner) are computational tools used to predict the pathogenicity of genetic variants.
      </div>
    </div>
  );
};