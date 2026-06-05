import json
import os
class ConfigManager:
    def __init__(self, config_path='config.json'):
        self.path = config_path
    def get_config(self):
        if not os.path.exists(self.path): return {}
        with open(self.path, 'r') as f: return json.load(f)
    def save_config(self, data):
        with open(self.path, 'w') as f: json.dump(data, f, indent=4)