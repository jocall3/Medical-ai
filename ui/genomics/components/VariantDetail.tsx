import React from 'react';
import { Variant } from '../context/GenomicsContext';
import { PathogenicityScore } from './PathogenicityScore';
import { formatCoordinate, formatAlleleFrequency } from '../utils/formatters';
import { Dna, ShieldAlert, Activity, Award, ExternalLink } from 'lucide-react';

interface VariantDetailProps {
  variant: Variant | null;
}

export const VariantDetail: React.FC<VariantDetailProps> = ({ variant }) => {
  if (!variant) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <Dna className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
        <h3 className=