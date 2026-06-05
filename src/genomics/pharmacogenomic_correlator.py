from transformers import AutoModel, AutoTokenizer

class PharmacogenomicTransformer:
    def __init__(self, model_name='dna-bert-base'):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)

    def correlate(self, variant_sequence):
        inputs = self.tokenizer(variant_sequence, return_tensors='pt')
        outputs = self.model(**inputs)
        return outputs.last_hidden_state