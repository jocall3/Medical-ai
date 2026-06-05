import json
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from src.fusion.fusion_config import FusionConfig

class MultimodalFusionDataset(Dataset):
    def __init__(self, patient_records: list, config: FusionConfig, is_training: bool = True):
        self.records = patient_records
        self.config = config
        self.is_training = is_training
        self.dna_vocab = {'A': 1, 'T': 2, 'C': 3, 'G': 4, 'N': 5}

    def __len__(self):
        return len(self.records)

    def _process_image(self, record):
        if "pixel_array" in record:
            img = np.array(record["pixel_array"], dtype=np.float32)
        else:
            img = np.random.randn(*self.config.image_input_shape).astype(np.float32)
        
        if img.ndim == 2:
            img = np.stack([img] * 3, axis=0)
        elif img.shape[0] != 3:
            img = img.transpose(2, 0, 1)
        
        img = (img - img.mean()) / (img.std() + 1e-8)
        return torch.tensor(img, dtype=torch.float32)

    def _tokenize_genomics(self, sequence: str):
        tokens = [self.dna_vocab.get(char, 0) for char in sequence.upper()]
        if len(tokens) > self.config.genomic_max_length:
            tokens = tokens[:self.config.genomic_max_length]
            mask = [1] * self.config.genomic_max_length
        else:
            padding_len = self.config.genomic_max_length - len(tokens)
            mask = [1] * len(tokens) + [0] * padding_len
            tokens = tokens + [0] * padding_len
        
        return torch.tensor(tokens, dtype=torch.long), torch.tensor(mask, dtype=torch.float32)

    def _tokenize_text(self, text: str):
        words = text.lower().split()
        tokens = [hash(w) % self.config.text_vocab_size for w in words]
        if len(tokens) > self.config.text_max_length:
            tokens = tokens[:self.config.text_max_length]
            mask = [1] * self.config.text_max_length
        else:
            padding_len = self.config.text_max_length - len(tokens)
            mask = [1] * len(tokens) + [0] * padding_len
            tokens = tokens + [0] * padding_len
        
        return torch.tensor(tokens, dtype=torch.long), torch.tensor(mask, dtype=torch.float32)

    def __getitem__(self, idx):
        record = self.records[idx]
        image_tensor = self._process_image(record)
        genomic_seq = record.get("fastq_sequence", "ATG" * 100)
        genomic_tokens, genomic_mask = self._tokenize_genomics(genomic_seq)

        fhir_data = record.get("fhir_clinical_note", "Patient presents with acute symptoms.")
        if isinstance(fhir_data, dict):
            clinical_text = fhir_data.get("text", {}).get("div", str(fhir_data))
        else:
            clinical_text = str(fhir_data)
        text_tokens, text_mask = self._tokenize_text(clinical_text)

        labels = torch.tensor(record.get("labels", [0] * self.config.num_classes), dtype=torch.float32)

        return {
            "image": image_tensor,
            "genomics": genomic_tokens,
            "genomic_mask": genomic_mask,
            "text": text_tokens,
            "text_mask": text_mask,
            "labels": labels
        }

def get_multimodal_dataloader(patient_records: list, config: FusionConfig, is_training: bool = True, num_workers: int = 4):
    dataset = MultimodalFusionDataset(patient_records, config, is_training=is_training)
    return DataLoader(
        dataset,
        batch_size=config.batch_size,
        shuffle=is_training,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=is_training
    )
