import os
from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class FusionConfig:
    # Modality Input Dimensions
    image_input_shape: tuple = (3, 224, 224)
    genomic_vocab_size: int = 64  # DNA tokens (codons/k-mers)
    genomic_max_length: int = 1024
    text_vocab_size: int = 30522  # RoBERTa/BERT standard
    text_max_length: int = 512

    # Projection Dimensions
    image_embed_dim: int = 768  # ViT-B/16 output
    genomic_embed_dim: int = 256
    text_embed_dim: int = 768  # RoBERTa-base output
    unified_latent_dim: int = 512

    # Cross-Attention Hyperparameters
    num_attention_heads: int = 8
    attention_dropout: float = 0.1
    num_fusion_layers: int = 4
    feedforward_dim: int = 2048

    # Classification Head
    num_classes: int = 15  # Multi-label diagnostic categories
    classifier_dropout: float = 0.3

    # Loss Weights
    lambda_classification: float = 1.0
    lambda_contrastive: float = 0.5
    lambda_alignment: float = 0.3
    contrastive_temperature: float = 0.07

    # Training Hyperparameters
    batch_size: int = 32
    learning_rate: float = 1e-4
    weight_decay: float = 1e-5
    num_epochs: int = 50
    gradient_accumulation_steps: int = 2
    mixed_precision: str = "fp16"  # "fp16", "bf16", or "fp32"

    # Paths
    checkpoint_dir: str = "./checkpoints"
    log_dir: str = "./logs"
    pretrained_vit_path: str = "google/vit-base-patch16-224"
    pretrained_roberta_path: str = "roberta-base"
