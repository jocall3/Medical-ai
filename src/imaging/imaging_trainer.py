import torch

class ImagingTrainer:
    def train(self, model, dataloader):
        optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
        for batch in dataloader:
            optimizer.zero_grad()
            # Training logic with Dice Loss
            pass