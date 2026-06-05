import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface VitalSigns {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  spO2: number;
  temperature: number;
  respiratoryRate: number;
  timestamp: string;
}

export interface TriageScore {
  score: number;
  level: 'Emergent' | 'Urgent' | 'Non-Urgent';
  sepsisRisk: number;
  cardiacRisk: number;
  mortalityRisk: number;
  keyContributors: { feature: string; impact: number; description: string }[];
  recommendations: string[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bedNumber: string;
  mrn: string;
  admissionReason: string;
  vitals: VitalSigns;
  triage: TriageScore;
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  type: 'sepsis' | 'cardiac' | 'respiratory' | 'system';
}

interface DashboardContextType {
  patients: Patient[];
  activePatient: Patient | null;
  alerts: ClinicalAlert[];
  setActivePatientId: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  escalateAlert: (id: string) => void;
  isConnected: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const initialPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Eleanor Vance',
    age: 64,
    gender: 'Female',
    bedNumber: 'ICU-04',
    mrn: 'MRN-90821-A',
    admissionReason: 'Acute Respiratory Distress Syndrome (ARDS)',
    vitals: {
      heartRate: 98,
      bloodPressureSystolic: 112,
      bloodPressureDiastolic: 68,
      spO2: 93,
      temperature: 38.4,
      respiratoryRate: 24,
      timestamp: new Date().toISOString()
    },
    triage: {
      score: 84,
      level: 'Emergent',
      sepsisRisk: 72,
      cardiacRisk: 35,
      mortalityRisk: 18,
      keyContributors: [
        { feature: 'Respiratory Rate', impact: 28, description: 'Tachypnea (>22 bpm) indicating respiratory strain' },
        { feature: 'SpO2', impact: 24, description: 'Hypoxemia (<94%) on room air' },
        { feature: 'Temperature', impact: 15, description: 'Febrile state indicating active inflammatory response' }
      ],
      recommendations: [
        'Initiate high-flow nasal cannula (HFNC) oxygen therapy.',
        'Draw blood cultures and initiate broad-spectrum antibiotics within 1 hour.',
        'Order urgent chest X-ray and arterial blood gas (ABG) analysis.'
      ]
    }
  },
  {
    id: 'p2',
    name: 'Marcus Aurelius',
    age: 52,
    gender: 'Male',
    bedNumber: 'ICU-08',
    mrn: 'MRN-44102-B',
    admissionReason: 'Post-Myocardial Infarction Monitoring',
    vitals: {
      heartRate: 72,
      bloodPressureSystolic: 128,
      bloodPressureDiastolic: 82,
      spO2: 98,
      temperature: 36.8,
      respiratoryRate: 16,
      timestamp: new Date().toISOString()
    },
    triage: {
      score: 35,
      level: 'Non-Urgent',
      sepsisRisk: 8,
      cardiacRisk: 64,
      mortalityRisk: 5,
      keyContributors: [
        { feature: 'Troponin Levels', impact: 45, description: 'Elevated cardiac biomarkers post-PCI' },
        { feature: 'ECG ST-Segment', impact: 15, description: 'Mild residual ST elevation in anterior leads' }
      ],
      recommendations: [
        'Maintain continuous 12-lead ECG telemetry.',
        'Administer dual antiplatelet therapy (DAPT) as scheduled.',
        'Monitor serum potassium and magnesium levels.'
      ]
    }
  }
];

const initialAlerts: ClinicalAlert[] = [
  {
    id: 'a1',
    patientId: 'p1',
    patientName: 'Eleanor Vance',
    bedNumber: 'ICU-04',
    severity: 'critical',
    message: 'AI Sepsis Predictor: High probability of sepsis onset within 4 hours (72% confidence).',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    acknowledged: false,
    type: 'sepsis'
  },
  {
    id: 'a2',
    patientId: 'p2',
    patientName: 'Marcus Aurelius',
    bedNumber: 'ICU-08',
    severity: 'warning',
    message: 'Minor PVC run detected (3 consecutive beats). Telemetry monitoring advised.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    acknowledged: false,
    type: 'cardiac'
  }
];

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [activePatientId, setActivePatientId] = useState<string>('p1');
  const [alerts, setAlerts] = useState<ClinicalAlert[]>(initialAlerts);
  const [isConnected] = useState<boolean>(true);

  const activePatient = patients.find(p => p.id === activePatientId) || null;

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, acknowledged: true } : alert));
  };

  const escalateAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === id) {
        return { ...alert, severity: 'critical', message: `[ESCALATED] ${alert.message}` };
      }
      return alert;
    }));
  };

  return (
    <DashboardContext.Provider value={{
      patients,
      activePatient,
      alerts,
      setActivePatientId,
      acknowledgeAlert,
      escalateAlert,
      isConnected
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};