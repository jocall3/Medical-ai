import numpy as np
import torch
from torch.utils.data import Dataset
from typing import Dict, Tuple, Optional

class MultiOmicsDataset(Dataset):
    def __init__(
        self,
        transcriptomics_matrix: np.ndarray,
        proteomics_matrix: np.ndarray,
        metabolomics_matrix: np.ndarray,
        labels: np.ndarray,
        batch_ids: Optional[np.ndarray] = None
    ):
        assert transcriptomics_matrix.shape[0] == proteomics_matrix.shape[0] == metabolomics_matrix.shape[0] == labels.shape[0], \
            "All omics matrices and labels must have the same number of samples (rows)."
        
        self.labels = torch.tensor(labels, dtype=torch.long)
        self.transcriptomics = torch.tensor(self._normalize_rna(transcriptomics_matrix), dtype=torch.float32)
        self.proteomics = torch.tensor(self._normalize_protein(proteomics_matrix), dtype=torch.float32)
        self.metabolomics = torch.tensor(self._normalize_metabolite(metabolomics_matrix), dtype=torch.float32)
        
        if batch_ids is not None:
            self.batch_ids = torch.tensor(batch_ids, dtype=torch.long)
            self._apply_batch_correction()
        else:
            self.batch_ids = torch.zeros(len(labels), dtype=torch.long)

    def _normalize_rna(self, matrix: np.ndarray) -> np.ndarray:
        library_sizes = matrix.sum(axis=1, keepdims=True)
        library_sizes[library_sizes == 0] = 1.0
        normalized = (matrix / library_sizes) * 1e4
        return np.log1p(normalized)

    def _normalize_protein(self, matrix: np.ndarray) -> np.ndarray:
        mean = matrix.mean(axis=0, keepdims=True)
        std = matrix.std(axis=0, keepdims=True)
        std[std == 0] = 1.0
        return (matrix - mean) / std

    def _normalize_metabolite(self, matrix: np.ndarray) -> np.ndarray:
        min_val = matrix.min(axis=0, keepdims=True)
        max_val = matrix.max(axis=0, keepdims=True)
        range_val = max_val - min_val
        range_val[range_val == 0] = 1.0
        return (matrix - min_val) / range_val

    def _apply_batch_correction(self):
        unique_batches = torch.unique(self.batch_ids)
        for batch in unique_batches:
            mask = (self.batch_ids == batch)
            if mask.sum() > 1:
                self.transcriptomics[mask] -= self.transcriptomics[mask].mean(dim=0, keepdim=True)
                self.proteomics[mask] -= self.proteomics[mask].mean(dim=0, keepdim=True)
                self.metabolomics[mask] -= self.metabolomics[mask].mean(dim=0, keepdim=True)

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        return (
            self.transcriptomics[idx],
            self.proteomics[idx],
            self.metabolomics[idx],
            self.labels[idx],
            self.batch_ids[idx]
        )
