import time
import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern

class HighDimBayesianOptimizer:
    def __init__(self, dimensions=20, bounds=(-5.0, 5.0)):
        self.dimensions = dimensions
        self.bounds = bounds
        self.X_sample = []
        self.y_sample = []
        self.gp = GaussianProcessRegressor(kernel=Matern(nu=2.5), alpha=1e-6, normalize_y=True)

    def objective_function(self, x):
        x = np.array(x)
        rosen = sum(100.0 * (x[1:] - x[:-1]**2.0)**2.0 + (1.0 - x[:-1])**2.0)
        rastrigin = 10 * len(x) + sum(x**2 - 10 * np.cos(2 * np.pi * x))
        return -(rosen + rastrigin)

    def sample_next_point(self):
        if len(self.X_sample) < 5:
            return np.random.uniform(self.bounds[0], self.bounds[1], self.dimensions)
        self.gp.fit(np.array(self.X_sample), np.array(self.y_sample))
        candidates = np.random.uniform(self.bounds[0], self.bounds[1], (1000, self.dimensions))
        mu, sigma = self.gp.predict(candidates, return_std=True)
        ucb = mu + 1.96 * sigma
        best_idx = np.argmax(ucb)
        return candidates[best_idx]

    def register_sample(self, x, y):
        self.X_sample.append(x)
        self.y_sample.append(y)

def run_stress_test():
    dimensions_to_test = [5, 10, 20, 35]
    iterations = 30
    print("======================================================================")
    print("STRESS TEST: Bayesian Optimizer Convergence in High-Dimensional Spaces")
    print("======================================================================")
    for dims in dimensions_to_test:
        print(f"\nTesting with {dims} Dimensions...")
        optimizer = HighDimBayesianOptimizer(dimensions=dims)
        start_time = time.perf_counter()
        best_value = -float('inf')
        for i in range(iterations):
            iter_start = time.perf_counter()
            next_x = optimizer.sample_next_point()
            score = optimizer.objective_function(next_x)
            optimizer.register_sample(next_x, score)
            if score > best_value:
                best_value = score
            iter_duration = time.perf_counter() - iter_start
            if (i + 1) % 10 == 0:
                print(f"  Iteration {i+1}/{iterations} | Best Score: {best_value:.4f} | Last Iter Time: {iter_duration:.4f}s")
        total_duration = time.perf_counter() - start_time
        print(f"--> Dimension {dims} completed in {total_duration:.2f} seconds. Avg time per step: {total_duration/iterations:.4f}s")
        if dims == 20:
            if total_duration < 15.0:
                print("  SLA Status: PASSED")
            else:
                print("  SLA Status: FAILED (Exceeded 15s threshold)")

if __name__ == "__main__":
    run_stress_test()
