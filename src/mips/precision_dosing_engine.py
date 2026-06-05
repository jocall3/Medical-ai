import numpy as np
from scipy.optimize import minimize

class MAPEstimator:
    def __init__(self, population_prior):
        self.prior = population_prior

    def estimate(self, observed_data, model_func):
        def neg_log_posterior(params):
            likelihood = model_func(params, observed_data)
            prior_prob = -np.sum(((params - self.prior['mean'])**2) / (2 * self.prior['var']))
            return -(likelihood + prior_prob)
        
        result = minimize(neg_log_posterior, x0=self.prior['mean'], method='L-BFGS-B')
        return result.x