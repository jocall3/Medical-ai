import { useEffect, useRef } from 'react';
import { useDashboard, VitalSigns } from '../context/DashboardContext';

export const useDashboardData = () => {
  const { patients, activePatient, alerts, isConnected } = useDashboard();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    intervalRef.current = setInterval(() => {
      if (activePatient) {
        const fluctuate = (val: number, range: number) => {
          const change = (Math.random() - 0.5) * range;
          return Math.round((val + change) * 10) / 10;
        };

        const updatedVitals: VitalSigns = {
          heartRate: Math.round(fluctuate(activePatient.vitals.heartRate, 4)),
          bloodPressureSystolic: Math.round(fluctuate(activePatient.vitals.bloodPressureSystolic, 6)),
          bloodPressureDiastolic: Math.round(fluctuate(activePatient.vitals.bloodPressureDiastolic, 4)),
          spO2: Math.min(100, Math.max(70, Math.round(fluctuate(activePatient.vitals.spO2, 1.5)))),
          temperature: parseFloat(fluctuate(activePatient.vitals.temperature, 0.2).toFixed(1)),
          respiratoryRate: Math.round(fluctuate(activePatient.vitals.respiratoryRate, 2)),
          timestamp: new Date().toISOString()
        };

        activePatient.vitals = updatedVitals;
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activePatient, isConnected]);

  return {
    patients,
    activePatient,
    alerts: alerts.filter(a => !a.acknowledged),
    isConnected
  };
};