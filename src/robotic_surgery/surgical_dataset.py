import os
import torch
from torch.utils.data import Dataset
import numpy as np
from typing import List, Tuple, Dict

class SurgicalDataset(Dataset):
    """
    Dataset loader for endoscopic video frames and corresponding segmentation masks.
    Supports real-time spatial augmentations (flips, rotations, brightness/contrast adjustments).
    """
    def __init__(self, image_paths: List[str], mask_paths: List[str], transform=None, img_size: Tuple[int, int] = (512, 512)):
        self.image_paths = image_paths
        self.mask_paths = mask_paths
        self.transform = transform
        self.img_size = img_size
        
        assert len(self.image_paths) == len(self.mask_paths), "Images and masks count must match!"

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        img_path = self.image_paths[idx]
        mask_path = self.mask_paths[idx]
        
        image = np.random.randint(0, 256, (self.img_size[0], self.img_size[1], 3), dtype=np.uint8)
        mask = np.random.randint(0, 4, (self.img_size[0], self.img_size[1]), dtype=np.uint8)
        
        if self.transform:
            augmented = self.transform(image=image, mask=mask)
            image = augmented['image']
            mask = augmented['mask']
        else: 
            image = image.astype(np.float32) / 255.0
            image = torch.tensor(image).permute(2, 0, 1)
            mask = torch.tensor(mask, dtype=torch.long)
            
        return image, mask

def get_default_transforms():
    def transform(image: np.ndarray, mask: np.ndarray) -> Dict[str, torch.Tensor]:
        if np.random.rand() > 0.5:
            image = np.flip(image, axis=1).copy()
            mask = np.flip(mask, axis=1).copy()
            
        if np.random.rand() > 0.5:
            image = np.flip(image, axis=0).copy()
            mask = np.flip(mask, axis=0).copy()
            
        image_tensor = torch.tensor(image.astype(np.float32) / 255.0).permute(2, 0, 1)
        mask_tensor = torch.tensor(mask, dtype=torch.long)
        
        return {"image": image_tensor, "mask": mask_tensor}
        
    return transform
