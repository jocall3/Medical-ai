import os
import torch
from torch.cuda.amp import autocast, GradScaler
from src.fusion.multimodal_fusion_engine import MultimodalFusionEngine
from src.fusion.fusion_loss_functions import MultimodalFusionLoss
from src.fusion.fusion_config import FusionConfig

class MultimodalFusionTrainer:
    def __init__(self, model: MultimodalFusionEngine, config: FusionConfig, train_loader, val_loader, rank: int = 0):
        self.model = model.to(rank)
        self.config = config
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.rank = rank

        self.optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=config.learning_rate,
            weight_decay=config.weight_decay
        )
        self.criterion = MultimodalFusionLoss(
            lambda_cls=config.lambda_classification,
            lambda_con=config.lambda_contrastive,
            lambda_align=config.lambda_alignment,
            temperature=config.contrastive_temperature
        )
        self.scaler = GradScaler(enabled=(config.mixed_precision in ["fp16", "bf16"]))

    def train_epoch(self, epoch: int):
        self.model.train()
        total_loss = 0.0
        self.optimizer.zero_grad()

        for step, batch in enumerate(self.train_loader):
            images = batch["image"].to(self.rank, non_blocking=True)
            genomics = batch["genomics"].to(self.rank, non_blocking=True)
            genomic_mask = batch["genomic_mask"].to(self.rank, non_blocking=True)
            text = batch["text"].to(self.rank, non_blocking=True)
            text_mask = batch["text_mask"].to(self.rank, non_blocking=True)
            targets = batch["labels"].to(self.rank, non_blocking=True)

            with autocast(enabled=(self.config.mixed_precision in ["fp16", "bf16"])):
                outputs = self.model(images, genomics, text, genomic_mask, text_mask)
                loss_dict = self.criterion(outputs, targets)
                loss = loss_dict["total_loss"] / self.config.gradient_accumulation_steps

            self.scaler.scale(loss).backward()

            if (step + 1) % self.config.gradient_accumulation_steps == 0:
                self.scaler.unscale_(self.optimizer)
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                self.scaler.step(self.optimizer)
                self.scaler.update()
                self.optimizer.zero_grad()

            total_loss += loss.item() * self.config.gradient_accumulation_steps

        avg_loss = total_loss / len(self.train_loader)
        if self.rank == 0:
            print(f"Epoch {epoch} | Train Loss: {avg_loss:.4f}")
        return avg_loss

    def validate(self):
        self.model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch in self.val_loader:
                images = batch["image"].to(self.rank, non_blocking=True)
                genomics = batch["genomics"].to(self.rank, non_blocking=True)
                genomic_mask = batch["genomic_mask"].to(self.rank, non_blocking=True)
                text = batch["text"].to(self.rank, non_blocking=True)
                text_mask = batch["text_mask"].to(self.rank, non_blocking=True)
                targets = batch["labels"].to(self.rank, non_blocking=True)

                outputs = self.model(images, genomics, text, genomic_mask, text_mask)
                loss_dict = self.criterion(outputs, targets)
                val_loss += loss_dict["total_loss"].item()

        avg_val_loss = val_loss / len(self.val_loader)
        if self.rank == 0:
            print(f"Validation Loss: {avg_val_loss:.4f}")
        return avg_val_loss

    def save_checkpoint(self, epoch: int, path: str):
        if self.rank == 0:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            torch.save({
                'epoch': epoch,
                'model_state_dict': self.model.state_dict(),
                'optimizer_state_dict': self.optimizer.state_dict(),
                'config': self.config
            }, path)
