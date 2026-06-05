import unittest
import numpy as np

def michaelis_menten(v_max, km, substrate_concentration):
    return (v_max * substrate_concentration) / (km + substrate_concentration)

def bayesian_triage_update(prior, sensitivity, specificity, test_positive=True):
    if test_positive:
        numerator = sensitivity * prior
        denominator = (sensitivity * prior) + ((1 - specificity) * (1 - prior))
    else:
        numerator = (1 - sensitivity) * prior
        denominator = ((1 - sensitivity) * prior) + (specificity * (1 - prior))
    return numerator / (denominator + 1e-15)

def calculate_half_life(clearance, volume_of_distribution):
    if clearance <= 0:
        raise ZeroDivisionError("Clearance must be greater than zero.")
    kel = clearance / volume_of_distribution
    return np.log(2) / kel

class TestMathFunctions(unittest.TestCase):
    def test_michaelis_menten_kinetics(self):
        v_max = 10.0
        km = 2.0
        self.assertAlmostEqual(michaelis_menten(v_max, km, 2.0), 5.0)
        self.assertEqual(michaelis_menten(v_max, km, 0.0), 0.0)
        self.assertAlmostEqual(michaelis_menten(v_max, km, 10000.0), v_max, places=2)

    def test_bayesian_triage_update(self):
        prior = 0.10
        sens = 0.90
        spec = 0.80
        post_pos = bayesian_triage_update(prior, sens, spec, test_positive=True)
        self.assertGreater(post_pos, prior)
        self.assertAlmostEqual(post_pos, 0.3103448275862069)
        post_neg = bayesian_triage_update(prior, sens, spec, test_positive=False)
        self.assertLess(post_neg, prior)
        self.assertAlmostEqual(post_neg, 0.0136986301369863)

    def test_pharmacokinetic_half_life(self):
        cl = 2.0
        vd = 20.0
        expected_half_life = np.log(2) / (cl / vd)
        self.assertAlmostEqual(calculate_half_life(cl, vd), expected_half_life)
        with self.assertRaises(ZeroDivisionError):
            calculate_half_life(0.0, vd)

if __name__ == "__main__":
    unittest.main()