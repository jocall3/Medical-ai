import torch
from torch_geometric.nn import GCNConv

class BindingAffinityGNN(torch.nn.Module):
    def __init__(self):
        super(BindingAffinityGNN, self).__init__()
        self.conv1 = GCNConv(64, 128)
        self.fc = torch.nn.Linear(128, 1)

    def forward(self, data):
        x, edge_index = data.x, data.edge_index
        x = self.conv1(x, edge_index).relu()
        return self.fc(x.mean(dim=0))