import pandas as pd

class IoTDataset:
    def __init__(self, file_path):
        self.data = pd.read_csv(file_path)

    def get_stream(self, batch_size=32):
        for i in range(0, len(self.data), batch_size):
            yield self.data.iloc[i:i+batch_size]