import unittest
import torch
from src.fusion.fusion_config import FusionConfig
from src.fusion.multimodal_fusion_engine import MultimodalFusionEngine
from src.fusion.cross_attention_layers import MultiHeadCrossAttention, CoAttentionTransformerBlock
from src.fusion.fusion_loss_functions import MultimodalFusionLoss
from src.fusion.fusion_dataset_loader import MultimodalFusionDataset

class TestMultimodalFusionEngine(unittest.TestCase):
    def setUp(self):
        self.config = FusionConfig(
            image_input_shape=(3, 224, 224),
            genomic_vocab_size=64,
            genomic_max_length=128,
            text_vocab_size=1000,
            text_max_length=64,
            unified_latent_dim=128,
            num_attention_heads=4,
            num_classes=5,
            batch_size=2
        )
        self.model = MultimodalFusionEngine(self.config)

    def test_model_forward_pass(self):
        images = torch.randn(self.config.batch_size, *self.config.image_input_shape)
        genomics = torch.randint(0, self.config.genomic_vocab_size, (self.config.batch_size, self.config.genomic_max_length))
        text = torch.randint(0, self.config.text_vocab_size, (self.config.batch_size, self.config.text_max_length))

        outputs = self.model(images, genomics, text)

        self.assertEqual(outputs["logits"].shape, (self.config.batch_size, self.config.num_classes))
        self.assertEqual(outputs["img_global"].shape, (self.config.batch_size, self.config.unified_latent_dim))
        self.assertEqual(outputs["gen_global"].shape, (self.config.batch_size, self.config.unified_latent_dim))
        self.assertEqual(outputs["txt_global"].shape, (self.config.batch_size, self.config.unified_latent_dim))

    def test_cross_attention_shapes(self):
        block = CoAttentionTransformerBlock(
            dim_a=128,
            dim_b=128,
            embed_dim=128,
            num_heads=4,
            ff_dim=256
        )
        x_a = torch.randn(2, 10, 128)
        x_b = torch.randn(2, 20, 128)
        out_a, out_b, w_a, w_b = block(x_a, x_b)

        self.assertEqual(out_a.shape, (2, 10, 128))
        self.assertEqual(out_b.shape, (2, 20, 128))
        self.assertEqual(w_a.shape, (2, 4, 10, 20))
        self.assertEqual(w_b.shape, (2, 4, 20, 10))

    def test_loss_function(self):
        criterion = MultimodalFusionLoss(lambda_cls=1.0, lambda_con=0.5, lambda_align=0.3)
        outputs = {
            "logits": torch.randn(self.config.batch_size, self.config.num_classes),
            "img_global": torch.randn(self.config.batch_size, self.config.unified_latent_dim),
            "gen_global": torch.randn(self.config.batch_size, self.config.unified_latent_dim),
            "txt_global": torch.randn(self.config.batch_size, self.config.unified_latent_dim)
        }
        targets = torch.randint(0, 2, (self.config.batch_size, self.config.num_classes)).float()

        loss_dict = criterion(outputs, targets)
        self.assertIn("total_loss", loss_dict)
        self.assertGreater(loss_dict["total_loss"].item(), 0.0)

if __name__ == "__main__":
    unittest.main()
