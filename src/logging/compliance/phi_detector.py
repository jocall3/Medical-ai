import re
from typing import Dict, Any, Tuple, List

class PHIDetector:
    """
    Detects and redacts Protected Health Information (PHI) and Personally Identifiable Information (PII)
    within log streams, text, or structured payloads to prevent accidental leakage.
    """
    def __init__(self):
        self.patterns = {
            "SSN": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
            "EMAIL": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            "PHONE": re.compile(r'\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b'),
            "MRN": re.compile(r'\bMRN-?\d{6,10}\b', re.IGNORECASE),
            "IP_ADDRESS": re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'),
            "DATE_OF_BIRTH": re.compile(r'\b(0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])[-/](19|20)\d{2}\b')
        }

    def scan_text(self, text: str) -> Dict[str, List[Tuple[int, int]]]:
        findings = {}
        for phi_type, pattern in self.patterns.items():
            spans = []
            for match in pattern.finditer(text):
                spans.append(match.span())
            if spans:
                findings[phi_type] = spans
        return findings

    def redact_text(self, text: str, replacement: str = "[REDACTED]") -> str:
        redacted = text
        for phi_type, pattern in self.patterns.items():
            redacted = pattern.sub(f"{replacement}_{phi_type}", redacted)
        return redacted

    def scan_and_redact_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        redacted_dict = {}
        for k, v in data.items():
            if isinstance(v, str):
                redacted_dict[k] = self.redact_text(v)
            elif isinstance(v, dict):
                redacted_dict[k] = self.scan_and_redact_dict(v)
            elif isinstance(v, list):
                redacted_dict[k] = [
                    self.scan_and_redact_dict(item) if isinstance(item, dict)
                    else (self.redact_text(item) if isinstance(item, str) else item)
                    for item in v
                ]
            else:
                redacted_dict[k] = v
        return redacted_dict
