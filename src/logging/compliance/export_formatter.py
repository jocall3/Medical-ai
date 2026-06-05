import json
import csv
import io
from typing import List, Dict, Any

class ExportFormatter:
    """
    Formats and filters audit logs for external regulatory bodies (e.g., HHS, DPAs).
    Supports exporting to JSON, CSV, and applying redactions to non-target fields.
    """
    @staticmethod
    def to_json(logs: List[Dict[str, Any]], redact_fields: List[str] = None) -> str:
        processed_logs = []
        for log in logs:
            log_copy = json.loads(json.dumps(log))
            if redact_fields:
                for field in redact_fields:
                    if field in log_copy:
                        log_copy[field] = "[REDACTED_FOR_EXPORT]"
                    if "details" in log_copy and field in log_copy["details"]:
                        log_copy["details"][field] = "[REDACTED_FOR_EXPORT]"
            processed_logs.append(log_copy)
        return json.dumps(processed_logs, indent=2)

    @staticmethod
    def to_csv(logs: List[Dict[str, Any]], fields: List[str]) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        for log in logs:
            row = {}
            for field in fields:
                val = log.get(field)
                if isinstance(val, (dict, list)):
                    row[field] = json.dumps(val)
                else:
                    row[field] = val
            writer.writerow(row)
        return output.getvalue()
