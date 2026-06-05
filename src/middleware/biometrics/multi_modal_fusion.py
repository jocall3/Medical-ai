class MultiModalFusion:
    def fuse(self, scores: list[float]) -> float:
        # Weighted average fusion of multiple biometric modalities
        return sum(scores) / len(scores)