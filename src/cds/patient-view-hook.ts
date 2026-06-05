import { Request, Response } from 'express';
import { CardBuilder } from './card-builder';

export const patientViewHook = (req: Request, res: Response) => {
  const { patientId } = req.body.context;
  const cards = new CardBuilder()
    .addInfoCard('Patient Overview', `Analyzing health data for patient ${patientId}.`)
    .build();
  res.json({ cards });
};