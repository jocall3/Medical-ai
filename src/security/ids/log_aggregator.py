import json

class LogAggregator:
    def log_event(self, event):
        with open("ids_logs.json", "a") as f:
            f.write(json.dumps(event) + "\n")