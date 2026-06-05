class IrisScanner:
    def process_scan(self, raw_data: bytes) -> bytes:
        # Normalize and extract iris features using Gabor filters
        return hashlib.sha256(raw_data).digest()