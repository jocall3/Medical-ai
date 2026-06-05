import numpy as np
import torch
from sklearn.metrics import roc_auc_score, f1_score
from src.fusion.multimodal_fusion_engine import MultimodalFusionEngine

class MultimodalFusionEvaluator:
    def __init__(self, model: MultimodalFusionEngine, device: str = "cuda"):
        self.model = model.to(device)
        self.device = device

    def evaluate(self, dataloader):
        self.model.eval()
        all_targets = []
        all_preds = []

        with torch.no_grad():
            for batch in dataloader:
                images = batch["image"].to(self.device)
                genomics = batch["genomics"].to(self.device)
                genomic_mask = batch["genomic_mask"].to(self.device)
                text = batch["text"].to(self.device)
                text_mask = batch["text_mask"].to(self.device)
                targets = batch["labels"].to(self.device)

                outputs = self.model(images, genomics, text, genomic_mask, text_mask)
                preds = torch.sigmoid(outputs["logits"])

                all_targets.append(targets.cpu().numpy())
                all_preds.append(preds.cpu().numpy())

        all_targets = np.concatenate(all_targets, axis=0)
        all_preds = np.concatenate(all_preds, axis=0)

        metrics = {}
        num_classes = all_targets.shape[1]

        try:
            metrics["auc_roc_macro"] = roc_auc_score(all_targets, all_preds, average="macro")
            metrics["auc_roc_micro"] = roc_auc_score(all_targets, all_preds, average="micro")
        except ValueError:
            metrics["auc_roc_macro"] = 0.0
            metrics["auc_roc_micro"] = 0.0

        binary_preds = (all_preds > 0.5).astype(int)
        metrics["f1_macro"] = f1_score(all_targets, binary_preds, average="macro")
        metrics["f1_micro"] = f1_score(all_targets, binary_preds, average="micro")

        class_auc = []
        for i in range(num_classes):
            try:
                class_auc.append(roc_auc_score(all_targets[:, i], all_preds[:, i]))
            except ValueError:
                class_auc.append(0.5)
        metrics["class_wise_auc"] = class_auc

        return metrics

    def compute_modality_attribution(self, batch):
        self.model.eval()
        with torch.no_grad():
            images = batch["image"].to(self.device)
            genomics = batch["genomics"].to(self.device)
            genomic_mask = batch["genomic_mask"].to(self.device)
            text = batch["text"].to(self.device)
            text_mask = batch["text_mask"].to(self.device)

            outputs = self.model(images, genomics, text, genomic_mask, text_mask)
            attn = outputs["attention_weights"]

            img_to_txt_attr = attn["img_txt"].mean(dim=(1, 2, 3)).cpu().numpy()
            gen_to_txt_attr = attn["gen_txt"].mean(dim=(1, 2, 3)).cpu().numpy()

            return {
                "image_to_text_attribution": img_to_txt_attr,
                "genomics_to_text_attribution": gen_to_txt_attr
            }
