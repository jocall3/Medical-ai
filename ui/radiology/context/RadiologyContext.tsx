import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Annotation {
  id: string;
  type: 'box' | 'point' | 'ruler';
  coordinates: { x: number; y: number; w?: number; h?: number; x2?: number; y2?: number };
  label: string;
  createdAt: string;
}

export interface DICOMMetadata {
  patientName: string;
  patientId: string;
  patientBirthDate: string;
  patientSex: string;
  studyDate: string;
  studyDescription: string;
  modality: string;
  accessionNumber: string;
  manufacturer: string;
  sliceThickness: string;
  kvp: string;
  exposureTime: string;
}

export interface AIAnomaly {
  id: string;
  label: string;
  confidence: number;
  status: 'critical' | 'warning' | 'normal';
  heatmapGrid: number[][];
  description: string;
}

export interface RadiologyState {
  activeStudyId: string | null;
  activeSeriesId: string | null;
  activeFrameIndex: number;
  totalFrames: number;
  windowWidth: number;
  windowCenter: number;
  zoom: number;
  pan: { x: number; y: number };
  annotations: Annotation[];
  activeAnnotationType: 'box' | 'point' | 'ruler' | null;
  showHeatmap: boolean;
  heatmapOpacity: number;
  selectedAnomalyId: string | null;
  isComparisonMode: boolean;
  syncComparison: boolean;
  metadata: DICOMMetadata | null;
  anomalies: AIAnomaly[];
}

type RadiologyAction =
  | { type: 'SET_STUDY'; payload: { studyId: string; metadata: DICOMMetadata; anomalies: AIAnomaly[]; totalFrames: number } }
  | { type: 'SET_SERIES'; payload: string }
  | { type: 'SET_FRAME'; payload: number }
  | { type: 'SET_WINDOWING'; payload: { width: number; center: number } }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'ADD_ANNOTATION'; payload: Annotation }
  | { type: 'DELETE_ANNOTATION'; payload: string }
  | { type: 'SET_ANNOTATION_TYPE'; payload: 'box' | 'point' | 'ruler' | null }
  | { type: 'TOGGLE_HEATMAP'; payload?: boolean }
  | { type: 'SET_HEATMAP_OPACITY'; payload: number }
  | { type: 'SELECT_ANOMALY'; payload: string | null }
  | { type: 'TOGGLE_COMPARISON'; payload?: boolean }
  | { type: 'TOGGLE_SYNC'; payload?: boolean }
  | { type: 'RESET_VIEW' };

const initialState: RadiologyState = {
  activeStudyId: null,
  activeSeriesId: null,
  activeFrameIndex: 0,
  totalFrames: 1,
  windowWidth: 400,
  windowCenter: 40,
  zoom: 1,
  pan: { x: 0, y: 0 },
  annotations: [],
  activeAnnotationType: null,
  showHeatmap: false,
  heatmapOpacity: 0.6,
  selectedAnomalyId: null,
  isComparisonMode: false,
  syncComparison: true,
  metadata: null,
  anomalies: [],
};

function radiologyReducer(state: RadiologyState, action: RadiologyAction): RadiologyState {
  switch (action.type) {
    case 'SET_STUDY':
      return {
        ...state,
        activeStudyId: action.payload.studyId,
        metadata: action.payload.metadata,
        anomalies: action.payload.anomalies,
        totalFrames: action.payload.totalFrames,
        activeFrameIndex: 0,
        annotations: [],
        selectedAnomalyId: null,
      };
    case 'SET_SERIES':
      return { ...state, activeSeriesId: action.payload, activeFrameIndex: 0 };
    case 'SET_FRAME':
      return { ...state, activeFrameIndex: Math.max(0, Math.min(state.totalFrames - 1, action.payload)) };
    case 'SET_WINDOWING':
      return { ...state, windowWidth: action.payload.width, windowCenter: action.payload.center };
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.5, Math.min(5, action.payload)) };
    case 'SET_PAN':
      return { ...state, pan: action.payload };
    case 'ADD_ANNOTATION':
      return { ...state, annotations: [...state.annotations, action.payload] };
    case 'DELETE_ANNOTATION':
      return { ...state, annotations: state.annotations.filter(a => a.id !== action.payload) };
    case 'SET_ANNOTATION_TYPE':
      return { ...state, activeAnnotationType: action.payload };
    case 'TOGGLE_HEATMAP':
      return { ...state, showHeatmap: action.payload !== undefined ? action.payload : !state.showHeatmap };
    case 'SET_HEATMAP_OPACITY':
      return { ...state, heatmapOpacity: action.payload };
    case 'SELECT_ANOMALY':
      return { ...state, selectedAnomalyId: action.payload, showHeatmap: action.payload !== null };
    case 'TOGGLE_COMPARISON':
      return { ...state, isComparisonMode: action.payload !== undefined ? action.payload : !state.isComparisonMode };
    case 'TOGGLE_SYNC':
      return { ...state, syncComparison: action.payload !== undefined ? action.payload : !state.syncComparison };
    case 'RESET_VIEW':
      return {
        ...state,
        zoom: 1,
        pan: { x: 0, y: 0 },
        windowWidth: 400,
        windowCenter: 40,
      };
    default:
      return state;
  }
}

const RadiologyContext = createContext<{
  state: RadiologyState;
  dispatch: React.Dispatch<RadiologyAction>;
} | null>(null);

export const RadiologyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(radiologyReducer, initialState);
  return (
    <RadiologyContext.Provider value={{ state, dispatch }}>
      {children}
    </RadiologyContext.Provider>
  );
};

export const useRadiology = () => {
  const context = useContext(RadiologyContext);
  if (!context) {
    throw new Error('useRadiology must be used within a RadiologyProvider');
  }
  return context;
};