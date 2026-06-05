from torch.utils.data import Dataset

class EpidemiologyDataset(Dataset):
    def __init__(self, case_data, mobility_data, wastewater_data):
        self.data = (case_data, mobility_data, wastewater_data)

    def __len__(self):
        return len(self.data[0])

    def __getitem__(self, idx):
        return [d[idx] for d in self.data]