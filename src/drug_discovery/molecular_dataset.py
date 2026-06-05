import torch
from torch.utils.data import Dataset

class MolecularDataset(Dataset):
    def __init__(self, smiles_list):
        self.smiles = smiles_list

    def __len__(self):
        return len(self.smiles)

    def __getitem__(self, idx):
        return {'smiles': self.smiles[idx]}