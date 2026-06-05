import { Router } from 'express';
import { patientViewHook } from './patient-view-hook';
import { orderSelectHook } from './order-select-hook';

export const cdsRouter = Router();

cdsRouter.get('/cds-services', (req, res) => {
  res.json({
    services: [
      { hook: 'patient-view', title: 'Patient Context Analyzer', id: 'patient-view-service' },
      { hook: 'order-select', title: 'Drug Interaction Checker', id: 'order-select-service' }
    ]
  });
});

cdsRouter.post('/cds-services/patient-view-service', patientViewHook);
cdsRouter.post('/cds-services/order-select-service', orderSelectHook);