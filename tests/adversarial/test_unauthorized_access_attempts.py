import unittest
import json
import base64
import hmac
import hashlib
import time

class MockJWT:
    @staticmethod
    def encode(payload, secret_key):
        header = {'alg': 'HS256', 'typ': 'JWT'}
        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().strip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().strip('=')
        signature = hmac.new(secret_key.encode(), f'{header_b64}.{payload_b64}'.encode(), hashlib.sha256).digest()
        sig_b64 = base64.urlsafe_b64encode(signature).decode().strip('=')
        return f'{header_b64}.{payload_b64}.{sig_b64}'

    @staticmethod
    def decode(token, secret_key):
        try:
            parts = token.split('.')
            if len(parts) != 3:
                raise ValueError('Invalid token format')
            header_b64, payload_b64, sig_b64 = parts
            expected_sig = hmac.new(secret_key.encode(), f'{header_b64}.{payload_b64}'.encode(), hashlib.sha256).digest()
            expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode().strip('=')
            if not hmac.compare_digest(sig_b64.encode(), expected_sig_b64.encode()):
                raise ValueError('Signature verification failed')
            
            payload_b64 += '=' * ((4 - len(payload_b64) % 4) % 4)
            payload_json = base64.urlsafe_b64decode(payload_b64.encode()).decode()
            return json.loads(payload_json)
        except Exception as e:
            raise ValueError(f'Token decoding failed: {str(e)}')

class RBACSystem:
    """
    Role-Based Access Control (RBAC) System with rate limiting
    and token validation to prevent privilege escalation and brute-force attacks.
    """
    def __init__(self, secret_key='super-secret-key'):
        self.secret_key = secret_key
        self.failed_attempts = {}

    def generate_token(self, username: str, role: str) -> str:
        payload = {
            'sub': username,
            'role': role,
            'exp': time.time() + 3600
        }
        return MockJWT.encode(payload, self.secret_key)

    def verify_access(self, token: str, required_role: str, client_ip: str) -> tuple[bool, str]:
        if self.failed_attempts.get(client_ip, 0) >= 5:
            return False, 'IP Blocked: Too many failed access attempts.'

        try:
            payload = MockJWT.decode(token, self.secret_key)
            user_role = payload.get('role')
            
            roles_hierarchy = {'admin': 3, 'surgeon': 2, 'nurse': 1, 'guest': 0}
            if roles_hierarchy.get(user_role, 0) >= roles_hierarchy.get(required_role, 0):
                return True, 'Access Granted'
            else:
                self.failed_attempts[client_ip] = self.failed_attempts.get(client_ip, 0) + 1
                return False, 'Access Denied: Insufficient privileges.'
        except Exception:
            self.failed_attempts[client_ip] = self.failed_attempts.get(client_ip, 0) + 1
            return False, 'Access Denied: Invalid token.'

class TestUnauthorizedAccessAttempts(unittest.TestCase):
    def setUp(self):
        self.rbac = RBACSystem()
        self.nurse_token = self.rbac.generate_token('nurse_joy', 'nurse')
        self.surgeon_token = self.rbac.generate_token('dr_strange', 'surgeon')

    def test_authorized_access(self):
        allowed, msg = self.rbac.verify_access(self.nurse_token, 'nurse', '192.168.1.10')
        self.assertTrue(allowed)

    def test_privilege_escalation_attempt(self):
        allowed, msg = self.rbac.verify_access(self.nurse_token, 'surgeon', '192.168.1.10')
        self.assertFalse(allowed)
        self.assertEqual(msg, 'Access Denied: Insufficient privileges.')

    def test_brute_force_ip_blocking(self):
        ip = '192.168.1.50'
        for _ in range(5):
            allowed, msg = self.rbac.verify_access('invalid-token-xyz', 'surgeon', ip)
            self.assertFalse(allowed)

        allowed, msg = self.rbac.verify_access(self.surgeon_token, 'surgeon', ip)
        self.assertFalse(allowed)
        self.assertEqual(msg, 'IP Blocked: Too many failed access attempts.')

if __name__ == '__main__':
    unittest.main()