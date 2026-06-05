import torch
import numpy as np
from typing import Dict, Any, Tuple
from src.omics.omics_config import MultiOmicsConfig
from src.omics.omics_dataset import MultiOmicsDataset
from src.omics.transcriptomics_analyzer import TranscriptomicsVAE
from src.omics.proteomics_predictor import ProteomicsPredictor
from src.omics.metabolomics_mapper import MetabolomicsMapper
from src.omics.omics_integrator import MultiOmicsGNNIntegrator

class MultiOmicsPipeline:
    def __init__(self, config: MultiOmicsConfig):
        self.config = config
        self.device = torch.device(config.device)
        
        self.rna_vae = TranscriptomicsVAE(
            input_dim=config.transcriptomics.input_dim,
            latent_dim=config.transcriptomics.latent_dim,
            hidden_dims=config.transcriptomics.hidden_dims,
            dropout=config.transcriptomics.dropout
        ).to(self.device)
        
        self.protein_predictor = ProteomicsPredictor(
            vocab_size=config.proteomics.sequence_vocab_size,
            embedding_dim=config.proteomics.embedding_dim,
            hidden_dim=config.proteomics.hidden_dim,
            num_ptm_classes=config.proteomics.num_ptm_classes,
            max_seq_len=config.proteomics.max_sequence_length
        ).to(self.device)
        
        self.metabolite_mapper = MetabolomicsMapper(
            num_metabolites=config.metabolomics.num_metabolites,
            num_reactions=config.metabolomics.num_reactions
        ).to(self.device)
        
        self.gnn_integrator = MultiOmicsGNNIntegrator(
            in_channels=config.gnn.in_channels,
            hidden_channels=config.gnn.hidden_channels,
            out_channels=config.gnn.out_channels,
            num_classes=2,
            dropout=config.gnn.dropout
        ).to(self.device)

    def train_step(
        self,
        dataset: MultiOmicsDataset,
        adj_matrix: torch.Tensor,
        epochs: int = 5
    ) -> Dict[str, float]:
        self.rna_vae.train()
        self.protein_predictor.train()
        self.metabolite_mapper.train()
        self.gnn_integrator.train()
        
        optimizer = torch.optim.Adam(
            list(self.rna_vae.parameters()) +
            list(self.protein_predictor.parameters()) +
            list(self.metabolite_mapper.parameters()) +
            list(self.gnn_integrator.parameters()),
            lr=self.config.gnn.learning_rate
        )
        
        adj_norm = MultiOmicsGNNIntegrator.normalize_adjacency(adj_matrix).to(self.device)
        metrics = {}
        
        for epoch in range(epochs):
            optimizer.zero_grad()
            
            rna_data = dataset.transcriptomics.to(self.device)
            protein_data = dataset.proteomics.to(self.device)
            metabolite_data = dataset.metabolomics.to(self.device)
            labels = dataset.labels.to(self.device)
            
            recon_mean, dropout_logits, mu, log_var = self.rna_vae(rna_data)
            vae_loss_dict = self.rna_vae.loss_function(rna_data, recon_mean, dropout_logits, mu, log_var)
            
            protein_features = torch.nn.functional.linear(
                protein_data, 
                torch.randn(self.config.gnn.in_channels, protein_data.shape[1], device=self.device)
            )
            
            predicted_fluxes = self.metabolite_mapper(metabolite_data)
            metabolite_features = torch.nn.functional.linear(
                metabolite_data,
                torch.randn(self.config.gnn.in_channels, metabolite_data.shape[1], device=self.device)
            )
            
            rna_features = torch.nn.functional.linear(
                mu,
                torch.randn(self.config.gnn.in_channels, mu.shape[1], device=self.device)
            )
            
            node_features = (
                self.config.integration_weights["transcriptomics"] * rna_features +
                self.config.integration_weights["proteomics"] * protein_features +
                self.config.integration_weights["metabolomics"] * metabolite_features
            )
            
            embeddings, logits = self.gnn_integrator(node_features, adj_norm)
            classification_loss = torch.nn.functional.cross_entropy(logits, labels)
            total_loss = classification_loss + vae_loss_dict["loss"]
            
            total_loss.backward()
            optimizer.step()
            
            metrics = {
                "epoch": epoch + 1,
                "total_loss": total_loss.item(),
                "classification_loss": classification_loss.item(),
                "vae_loss": vae_loss_dict["loss"].item()
            }
            
        return metrics

    @torch.no_grad()
    def run_inference(
        self,
        dataset: MultiOmicsDataset,
        adj_matrix: torch.Tensor
    ) -> Tuple[np.ndarray, np.ndarray]:
        self.rna_vae.eval()
        self.gnn_integrator.eval()
        
        rna_data = dataset.transcriptomics.to(self.device)
        protein_data = dataset.proteomics.to(self.device)
        metabolite_data = dataset.metabolomics.to(self.device)
        adj_norm = MultiOmicsGNNIntegrator.normalize_adjacency(adj_matrix).to(self.device)
        
        mu, _ = self.rna_vae.encode(rna_data)
        
        rna_features = torch.nn.functional.linear(
            mu,
            torch.randn(self.config.gnn.in_channels, mu.shape[1], device=self.device)
        )
        protein_features = torch.nn.functional.linear(
            protein_data, 
            torch.randn(self.config.gnn.in_channels, protein_data.shape[1], device=self.device)
        )
        metabolite_features = torch.nn.functional.linear(
            metabolite_data,
            torch.randn(self.config.gnn.in_channels, metabolite_data.shape[1], device=self.device)
        )
        
        node_features = (
            self.config.integration_weights["transcriptomics"] * rna_features +
            self.config.integration_weights["proteomics"] * protein_features +
            self.config.integration_weights["metabolomics"] * metabolite_features
            )
        
        embeddings, logits = self.gnn_integrator(node_features, adj_norm)
        probabilities = torch.softmax(logits, dim=-1)
        
        return embeddings.cpu().numpy(), probabilities.cpu().numpy()
