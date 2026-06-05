import unittest
import math

class PhysiologicalParameterEstimator:
    """
    Physiological Parameter Estimator (PPE) using Runge-Kutta 4th Order (RK4)
    integrator to model blood pressure dynamics.
    """
    def __init__(self, compliance=1.2, resistance=0.8):
        self.C = compliance
        self.R = resistance

    def state_derivative(self, P, Q):
        """
        dP/dt = (Q - P/R) / C
        P: Pressure, Q: Blood Flow Rate
        """
        if self.R == 0 or self.C == 0:
            raise ValueError('Compliance and Resistance must be non-zero.')
        return (Q - (P / self.R)) / self.C

    def rk4_step(self, P, Q, dt):
        """
        Performs a single RK4 integration step with safety checks.
        """
        # Input sanitization to prevent NaN propagation and overflow
        if not (math.isfinite(P) and math.isfinite(Q) and math.isfinite(dt)):
            return float('nan')
        
        # Prevent extremely large step sizes that cause numerical instability
        if dt <= 0 or dt > 10.0:
            dt = 0.01 # Safe fallback step size

        try:
            k1 = self.state_derivative(P, Q)
            k2 = self.state_derivative(P + 0.5 * dt * k1, Q)
            k3 = self.state_derivative(P + 0.5 * dt * k2, Q)
            k4 = self.state_derivative(P + dt * k3, Q)
            
            next_P = P + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
            
            # Bound output to physiological limits to prevent overflow/underflow
            if next_P < 0:
                return 0.0
            if next_P > 500.0: # Max physiological blood pressure limit
                return 500.0
                
            return next_P
        except (OverflowError, ZeroDivisionError):
            return float('nan')

class TestParameterOverflowPPE(unittest.TestCase):
    def setUp(self):
        self.ppe = PhysiologicalParameterEstimator()

    def test_normal_rk4_step(self):
        next_P = self.ppe.rk4_step(P=100.0, Q=120.0, dt=0.01)
        self.assertTrue(math.isfinite(next_P))
        self.assertGreater(next_P, 0)

    def test_extreme_overflow_inputs(self):
        # Test with extremely large pressure value
        next_P = self.ppe.rk4_step(P=1e308, Q=120.0, dt=0.01)
        self.assertEqual(next_P, 500.0, 'Should clip to maximum physiological limit instead of overflowing.')

    def test_nan_and_inf_inputs(self):
        # Test with NaN and Infinity values
        next_P_nan = self.ppe.rk4_step(P=float('nan'), Q=120.0, dt=0.01)
        self.assertTrue(math.isnan(next_P_nan), 'Should return NaN gracefully without raising unhandled exceptions.')

        next_P_inf = self.ppe.rk4_step(P=float('inf'), Q=120.0, dt=0.01)
        self.assertTrue(math.isnan(next_P_inf), 'Should handle infinity safely.')

    def test_extreme_step_size(self):
        # Test with an extremely large step size (adversarial input)
        next_P = self.ppe.rk4_step(P=100.0, Q=120.0, dt=1e10)
        # Should fall back to safe step size and return a valid number
        self.assertTrue(math.isfinite(next_P))

if __name__ == '__main__':
    unittest.main()