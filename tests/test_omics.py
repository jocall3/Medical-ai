import pytest
import numpy as np
import torch
from src.omics.omics_config import MultiOmicsConfig
from src.omics.omics_dataset import MultiOmicsDataset
from src.omics.transcriptomics_analyzer import TranscriptomicsVAE
from src.omics.proteomics_predictor import ProteomicsPredictor
from src.omics.metabolomics_mapper import MetabolomicsMapper
from src.omics.omics_integrator import MultiOmicsGNNIntegrator
from src.omics.omics_pipeline import MultiOmicsPipeline

def test_dataset_normalization():
    num_samples = 10
    rna = np.random.rand(num_samples, 2000) * 100
    prot = np.random.rand(num_samples, 100) * 10
    met = np.random.rand(num_samples, 500) * 5
    labels = np.random.randint(0, 2, size=num_samples)
    
    dataset = MultiOmicsDataset(rna, prot, met, labels)
    
    assert len(dataset) == num_samples
    assert dataset.transcriptomics.shape == (num_samples, 2000)
    assert dataset.proteomics.shape == (num_samples, 100)
    assert dataset.metabolomics.shape == (num_samples, 500)
    assert torch.all(dataset.metabolomics >= 0.0)
    assert torch.all(dataset.metabolomics <= 1.0)

def test_transcriptomics_vae():
    vae = TranscriptomicsVAE(input_dim=100, latent_dim=10, hidden_dims=[32])
    x = torch.randn(5, 100).abs()
    recon_mean, dropout_logits, mu, log_var = vae(x)
    
    assert recon_mean.shape == (5, 100)
    assert dropout_logits.shape == (5, 100)
    assert mu.shape == (5, 10)
    
    loss_dict = vae.loss_function(x, recon_mean, dropout_logits, mu, log_var)
    assert "loss" in loss_dict
    assert loss_dict["loss"] > 0

def test_proteomics_predictor():
    predictor = ProteomicsPredictor(vocab_size=21, embedding_dim=16, hidden_dim=32)
    seq = torch.randint(1, 21, (4, 100))
    abundance, ptm_logits = predictor.predict_abundance_and_ptm(seq)
    
    assert abundance.shape == (4, 1)
    assert ptm_logits.shape == (4, 5)

def test_metabolomics_mapper():
    mapper = MetabolomicsMapper(num_metabolites=50, num_reactions=30)
    metabolites = torch.randn(5, 50)
    fluxes = mapper(metabolites)
    
    assert fluxes.shape == (5, 30)
    violation = mapper.compute_steady_state_violation(fluxes)
    assert violation.shape == ()

def test_gnn_integrator():
    gnn = MultiOmicsGNNIntegrator(in_channels=16, hidden_channels=8, out_channels=4, num_classes=2)
    x = torch.randn(10, 16)
    adj = torch.eye(10) + torch.ones(10, 10) * 0.1
    
    embeddings, logits = gnn(x, adj)
    assert embeddings.shape == (10, 4)
    assert logits.shape == (10, 2)

def test_pipeline_end_to_end():
    config = MultiOmicsConfig()
    config.transcriptomics.input_dim = 100
    config.transcriptomics.latent_dim = 10
    config.transcriptomics.hidden_dims = [32]
    config.proteomics.embedding_dim = 16
    config.proteomics.hidden_dim = 32
    config.metabolomics.num_metabolites = 50
    config.metabolomics.num_reactions = 30
    config.gnn.in_channels = 16
    config.gnn.hidden_channels = 8
    config.gnn.out_channels = 4
    
    pipeline = MultiOmicsPipeline(config)
    
    num_samples = 5
    rna = np.random.rand(num_samples, 100)
    prot = np.random.rand(num_samples, 16)
    met = np.random.rand(num_samples, 50)
    labels = np.random.randint(0, 2, size=num_samples)
    
    dataset = MultiOmicsDataset(rna, prot, met, labels)
    adj_matrix = torch.eye(num_samples)
    
    metrics = pipeline.train_step(dataset, adj_matrix, epochs=2)
    assert "total_loss" in metrics
    
    embeddings, probabilities = pipeline.run_inference(dataset, adj_matrix)
    assert embeddings.shape == (num_samples, 4)
    assert probabilities.shape == (num_samples, 2)
