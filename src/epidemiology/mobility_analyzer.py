import networkx as nx

class MobilityAnalyzer:
    def __init__(self, graph_data):
        self.graph = nx.Graph(graph_data)

    def get_hotspots(self, threshold=0.8):
        centrality = nx.betweenness_centrality(self.graph)
        return [node for node, score in centrality.items() if score > threshold]