import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from src.monitoring.monitoring_config import MonitoringConfig
from src.monitoring.deterioration_predictor import DeteriorationLSTM

class FocalLoss(nn.Module):
    """
    Focal Loss to address extreme class imbalance in clinical deterioration datasets.
    FL(p_t) = -alpha * (1 - p_t)^gamma * log(p_t)
    """
    def __init__(self, alpha: float = 0.25, gamma: float = 2.0, reduction: str = 'mean'):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        # inputs: model predictions (probabilities, after sigmoid)
        # targets: ground truth binary labels
        inputs = torch.clamp(inputs, min=1e-7, max=1.0 - 1e-7)
        
        loss_pos = -self.alpha * ((1.0 - inputs) ** self.gamma) * torch.log(inputs) * targets
        loss_neg = -(1.0 - self.alpha) * (inputs ** self.gamma) * torch.log(1.0 - inputs) * (1.0 - targets)
        
        loss = loss_pos + loss_neg
        
        if self.reduction == 'mean':
            return torch.mean(loss)
        elif self.reduction == 'sum':
            return torch.sum(loss)
        return loss

class MonitoringTrainer:
    def __init__(self, config: MonitoringConfig, lr: float = 0.001, alpha: float = 0.25, gamma: float = 2.0):
        self.config = config
        self.model = DeteriorationLSTM(config)
        self.criterion = FocalLoss(alpha=alpha, gamma=gamma)
        self.optimizer = optim.Adam(self.model.parameters(), lr=lr)

    def train_epoch(self, dataloader: DataLoader) -> float:
        self.model.train()
        total_loss = 0.0
        for batch_x, batch_y in dataloader:
            self.optimizer.zero_grad()
            predictions = self.model(batch_x)
            loss = self.criterion(predictions, batch_y)
            loss.backward()
            self.optimizer.step()
            total_loss += loss.item() * batch_x.size(0)
        return total_loss / len(dataloader.dataset)

    def evaluate(self, dataloader: DataLoader) -> float:
        self.model.eval()
        total_loss = 0.0
        with torch.no_grad():
            for batch_x, batch_y in dataloader:
                predictions = self.model(batch_x)
                loss = self.criterion(predictions, batch_y)
                total_loss += loss.item() * batch_x.size(0)
        return total_loss / len(dataloader.dataset)

    def save_model(self, path: str):
        torch.save(self.model.state_dict(), path)
