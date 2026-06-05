import torch
from torch.utils.data import Dataset
from typing import List, Dict, Any
from transformers import PreTrainedTokenizer

class ClinicalTranslationDataset(Dataset):
    """
    PyTorch Dataset loader for parallel clinical corpora,
    handling translation pairs and simplification pairs.
    """
    def __init__(
        self,
        data: List[Dict[str, str]],
        tokenizer: PreTrainedTokenizer,
        max_length: int = 512,
        source_key: str = "source_text",
        target_key: str = "target_text"
    ):
        self.data = data
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.source_key = source_key
        self.target_key = target_key

    def __len__(self) -> int:
        return len(self.data)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        item = self.data[idx]
        source_text = item[self.source_key]
        target_text = item[self.target_key]

        source_encoding = self.tokenizer(
            source_text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )

        with self.tokenizer.as_target_tokenizer():
            target_encoding = self.tokenizer(
                target_text,
                max_length=self.max_length,
                padding="max_length",
                truncation=True,
                return_tensors="pt"
            )

        labels = target_encoding["input_ids"].squeeze(0)
        labels[labels == self.tokenizer.pad_token_id] = -100

        return {
            "input_ids": source_encoding["input_ids"].squeeze(0),
            "attention_mask": source_encoding["attention_mask"].squeeze(0),
            "labels": labels
        }
