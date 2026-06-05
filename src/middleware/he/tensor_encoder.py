import numpy as np
class TensorEncoder: def encode(self, tensor): return [float(x) for x in tensor.flatten()]