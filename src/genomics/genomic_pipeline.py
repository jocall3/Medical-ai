from .genomic_data_loader import GenomicDataLoader
from .variant_caller import VariantCNN

class GenomicPipeline:
    def run(self, input_file):
        loader = GenomicDataLoader()
        # Orchestration logic here
        return 'Pipeline Complete'