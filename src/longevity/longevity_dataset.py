import torch
from torch.utils.data import Dataset

class LongevityDataset(Dataset):
    def __init__(self, data_path):
        self.data = []

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]