import { Request, Response } from 'express';
import { CardBuilder } from './card-builder';

export const orderSelectHook = (req: Request, res: Response) => {
  const { selections } = req.body.context;
  const cards = new CardBuilder()
    .addSuggestionCard('Interaction Check', 'Potential drug interaction detected.', 'Review Medications')
    .build();
  res.json({ cards });
};