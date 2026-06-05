import unittest
import time

class FHIRApiGateway:
    """
    Simulated FHIR API Gateway with Rate Limiting and Load Shedding
    to maintain availability during mass-casualty events.
    """
    def __init__(self, rate_limit_per_sec=100, max_queue_size=50):
        self.rate_limit = rate_limit_per_sec
        self.max_queue_size = max_queue_size
        self.request_queue = []
        self.last_request_time = time.time()
        self.tokens = rate_limit_per_sec

    def refill_tokens(self):
        now = time.time()
        elapsed = now - self.last_request_time
        self.tokens = min(self.rate_limit, self.tokens + elapsed * self.rate_limit)
        self.last_request_time = now

    def handle_request(self, client_ip: str, priority: str) -> tuple[int, str]:
        self.refill_tokens()
        
        # Critical triage requests bypass standard rate limits during mass-casualty events
        if priority == 'CRITICAL':
            return 200, 'Critical FHIR Resource Processed'

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return 200, 'FHIR Resource Processed'
        else:
            # Load shedding: reject non-critical requests when rate limit is exceeded
            return 429, 'Too Many Requests - Load Shedding Active'

class TestDenialOfServiceFHIR(unittest.TestCase):
    def setUp(self):
        self.gateway = FHIRApiGateway(rate_limit_per_sec=10, max_queue_size=5)

    def test_normal_load(self):
        # Under normal load, requests should succeed
        for _ in range(5):
            status, msg = self.gateway.handle_request('192.168.1.1', 'NORMAL')
            self.assertEqual(status, 200)

    def test_denial_of_service_mitigation(self):
        # Simulate a massive flood of non-critical requests (DoS attack)
        success_count = 0
        blocked_count = 0
        
        for _ in range(50):
            status, msg = self.gateway.handle_request('192.168.1.99', 'NORMAL')
            if status == 200:
                success_count += 1
            elif status == 429:
                blocked_count += 1

        print(f'[DoS Test] Success: {success_count}, Blocked: {blocked_count}')
        self.assertGreater(blocked_count, 0, 'Gateway should have rate-limited/blocked excess requests.')

    def test_critical_triage_priority_during_dos(self):
        # Even under heavy load, critical triage requests must always be processed
        for _ in range(20):
            self.gateway.handle_request('192.168.1.99', 'NORMAL')

        # Now send a critical request
        status, msg = self.gateway.handle_request('192.168.1.100', 'CRITICAL')
        self.assertEqual(status, 200, 'Critical triage requests must bypass rate limits during emergencies.')

if __name__ == '__main__':
    unittest.main()