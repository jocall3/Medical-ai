from torch.utils.data import Dataset
import nibabel as nib

class MedicalImagingDataset(Dataset):
    def __init__(self, file_list):
        self.files = file_list

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        img = nib.load(self.files[idx]).get_fdata()
        return torch.tensor(img).float().unsqueeze(0)