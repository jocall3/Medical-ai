export const generateMockTDM = (patientId: string) => ({
  patientId,
  drugId: 'vancomycin',
  concentration: Math.random() * 20,
  timestamp: new Date()
});