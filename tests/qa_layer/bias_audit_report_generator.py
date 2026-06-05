import pandas as pd

class BiasAuditGenerator:
    def generate_report(self, inference_df):
        # Group by demographic and calculate performance metrics
        return inference_df.groupby(['race', 'gender', 'age_group'])['accuracy'].mean()