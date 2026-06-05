import React, { useEffect } from 'react';
import { useRadiology } from '../context/RadiologyContext';
import { useDICOM } from '../hooks/useDICOM';
import { DICOMViewer } from '../viewer/DICOMViewer';
import { ComparisonView } from '../components/ComparisonView';
import { AnomalyConfidence } from '../widgets/AnomalyConfidence';
import { StudyMetadata } from '../components/StudyMetadata';

export const RadiologyStudyView: React.FC = () => {
  const { state, dispatch } = useRadiology();
  const { isLoading, error, loadStudy } = useDICOM();

  useEffect(() => {
    loadStudy('study-99210');
  }, [loadStudy]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className=