class SignatureMatcher:
    def __init__(self):
        self.signatures = {"malware_pattern_01": "0xDEADBEEF", "sql_injection": "SELECT * FROM"}

    def match(self, payload):
        for name, sig in self.signatures.items():
            if sig in payload:
                return True, name
        return False, None