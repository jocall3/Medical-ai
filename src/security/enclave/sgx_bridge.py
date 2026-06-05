import os
class SGXBridge: def __init__(self): self.enclave_id = None
    def init_enclave(self, enclave_path): pass
    def ecall(self, function_name, data): return f'SGX_EXEC_{function_name}'