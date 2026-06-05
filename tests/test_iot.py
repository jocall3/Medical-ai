import unittest
from src.iot.hl7_message_parser import HL7Parser

class TestIoT(unittest.TestCase):
    def test_parser(self):
        parser = HL7Parser()
        msg = "MSH|^~\\&|TEST"
        self.assertIn('MSH', parser.parse(msg))

if __name__ == '__main__':
    unittest.main()