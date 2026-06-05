import unittest
import re

class PHIScanner:
    """
    Automated scanner to detect Protected Health Information (PHI) leakage
    in logs, error messages, and API responses.
    """
    def __init__(self):
        # Regex patterns for common PHI elements
        self.phi_patterns = {
            'Social Security Number (SSN)': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
            'Medical Record Number (MRN)': re.compile(r'\bMRN-\d{6,8}\b', re.IGNORECASE),
            'Date of Birth (DOB)': re.compile(r'\b(0[1-9]|1[0-2])/[0-3]\d/(19|20)\d{2}\b'),
            'Phone Number': re.compile(r'\b\d{3}-\d{3}-\d{4}\b'),
            'Email Address': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        }

    def scan_text(self, text: str) -> list[str]:
        leaks_found = []
        for label, pattern in self.phi_patterns.items():
            matches = pattern.findall(text)
            if matches:
                leaks_found.append(f'{label} (found: {matches})')
        return leaks_found

class TestPHILeakageScan(unittest.TestCase):
    def setUp(self):
        self.scanner = PHIScanner()

    def test_clean_log(self):
        clean_log = '[INFO] 2026-06-05 10:00:00 - Patient triage completed successfully. Priority level: 2.'
        leaks = self.scanner.scan_text(clean_log)
        self.assertEqual(len(leaks), 0, 'Clean logs should not trigger any PHI alerts.')

    def test_ssn_leakage_detection(self):
        dirty_log = '[ERROR] Failed to update record for patient with SSN 123-45-6789. Database connection timeout.'
        leaks = self.scanner.scan_text(dirty_log)
        self.assertGreater(len(leaks), 0)
        self.assertIn('Social Security Number (SSN)', leaks[0])

    def test_mrn_and_dob_leakage_detection(self):
        dirty_response = '{"status": "error", "message": "Patient MRN-987654 born on 05/12/1984 not found."}'
        leaks = self.scanner.scan_text(dirty_response)
        self.assertEqual(len(leaks), 2, 'Should detect both MRN and DOB leaks.')

    def test_email_leakage_detection(self):
        dirty_traceback = 'Traceback: User john.doe@hospital.com unauthorized to access resource.'
        leaks = self.scanner.scan_text(dirty_traceback)
        self.assertGreater(len(leaks), 0)
        self.assertIn('Email Address', leaks[0])

if __name__ == '__main__':
    unittest.main()