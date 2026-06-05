import random

class LoadBalancer:
    def __init__(self, nodes: list):
        self.nodes = nodes

    def get_next_node(self) -> str:
        # Simple round-robin or weighted selection based on health metrics
        return random.choice(self.nodes)