import { useState, useCallback } from 'react';
import { useRadiology, AIAnomaly, DICOMMetadata } from '../context/RadiologyContext';

export const useDICOM = () => {
  const { dispatch } = useRadiology();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudy = useCallback(async (studyId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const mockMetadata: DICOMMetadata = {
        patientName: 'DOE^JOHN^A',
        patientId: 'PT-90821-X',
        patientBirthDate: '1978-11-14',
        patientSex: 'M',
        studyDate: '2026-03-15',
        studyDescription: 'CHEST 2 VIEWS PA ERECT',
        modality: 'DX',
        accessionNumber: 'ACC-882910',
        manufacturer: 'SIEMENS Healthineers',
        sliceThickness: 'N/A (Projection)',
        kvp: '120',
        exposureTime: '12',
      };

      const mockAnomalies: AIAnomaly[] = [
        { 
          id: 'anom-1',
          label: 'Pneumothorax (Right Upper Lobe)',
          confidence: 0.942,
          status: 'critical',
          description: 'A large right-sided pneumothorax is noted with approximately 30% lung collapse. Trace mediastinal shift to the left.',
          heatmapGrid: [
            [0.1, 0.1, 0.2, 0.3, 0.1, 0.0, 0.0, 0.0],
            [0.1, 0.3, 0.7, 0.9, 0.4, 0.1, 0.0, 0.0],
            [0.2, 0.6, 0.9, 0.9, 0.5, 0.1, 0.0, 0.0],
            [0.1, 0.4, 0.8, 0.7, 0.3, 0.1, 0.0, 0.0],
            [0.0, 0.1, 0.3, 0.2, 0.1, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
          ],
        },
        { 
          id: 'anom-2',
          label: 'Cardiomegaly',
          confidence: 0.815,
          status: 'warning',
          description: 'The cardiothoracic ratio is increased (approx 0.58), suggesting moderate left ventricular enlargement.',
          heatmapGrid: [
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.1, 0.1, 0.1, 0.0, 0.0],
            [0.0, 0.0, 0.1, 0.3, 0.4, 0.3, 0.1, 0.0],
            [0.0, 0.0, 0.2, 0.6, 0.8, 0.7, 0.3, 0.0],
            [0.0, 0.0, 0.3, 0.7, 0.9, 0.8, 0.4, 0.1],
            [0.0, 0.0, 0.1, 0.4, 0.6, 0.5, 0.2, 0.0],
            [0.0, 0.0, 0.0, 0.1, 0.2, 0.1, 0.0, 0.0],
          ],
        }
      ];

      dispatch({
        type: 'SET_STUDY',
        payload: {
          studyId,
          metadata: mockMetadata,
          anomalies: mockAnomalies,
          totalFrames: 1,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load DICOM study');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return {
    isLoading,
    error,
    loadStudy,
  };
};