import torch
import torch.nn as nn
import torch.nn.functional as F

class MultimodalContrastiveLoss(nn.Module):
    def __init__(self, temperature: float = 0.07):
        super().__init__()
        self.temperature = temperature

    def forward(self, embed_a: torch.Tensor, embed_b: torch.Tensor):
        embed_a = F.normalize(embed_a, dim=-1)
        embed_b = F.normalize(embed_b, dim=-1)

        logits = torch.matmul(embed_a, embed_b.T) / self.temperature
        labels = torch.arange(embed_a.size(0), device=embed_a.device)

        loss_a = F.cross_entropy(logits, labels)
        loss_b = F.cross_entropy(logits.T, labels)

        return (loss_a + loss_b) / 2.0

class MultimodalFusionLoss(nn.Module):
    def __init__(self, lambda_cls: float = 1.0, lambda_con: float = 0.5, lambda_align: float = 0.3, temperature: float = 0.07):
        super().__init__()
        self.lambda_cls = lambda_cls
        self.lambda_con = lambda_con
        self.lambda_align = lambda_align

        self.classification_loss = nn.BCEWithLogitsLoss()
        self.contrastive_loss = MultimodalContrastiveLoss(temperature)

    def forward(self, outputs: dict, targets: torch.Tensor):
        loss_cls = self.classification_loss(outputs["logits"], targets)

        img_emb = outputs["img_global"]
        gen_emb = outputs["gen_global"]
        txt_emb = outputs["txt_global"]

        loss_con_img_txt = self.contrastive_loss(img_emb, txt_emb)
        loss_con_gen_txt = self.contrastive_loss(gen_emb, txt_emb)
        loss_con_img_gen = self.contrastive_loss(img_emb, gen_emb)
        loss_con = (loss_con_img_txt + loss_con_gen_txt + loss_con_img_gen) / 3.0

        img_norm = F.normalize(img_emb, dim=-1)
        gen_norm = F.normalize(gen_emb, dim=-1)
        txt_norm = F.normalize(txt_emb, dim=-1)

        loss_align = (F.mse_loss(img_norm, txt_norm) + 
                      F.mse_loss(gen_norm, txt_norm) + 
                      F.mse_loss(img_norm, gen_norm)) / 3.0

        total_loss = (self.lambda_cls * loss_cls + 
                      self.lambda_con * loss_con + 
                      self.lambda_align * loss_align)

        return {
            "total_loss": total_loss,
            "classification_loss": loss_cls,
            "contrastive_loss": loss_con,
            "alignment_loss": loss_align
        }
