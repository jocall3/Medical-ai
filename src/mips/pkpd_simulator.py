from scipy.integrate import solve_ivp

class PKPDSimulator:
    def simulate(self, model_deriv, y0, t_span, params):
        return solve_ivp(lambda t, y: model_deriv(t, y, params), t_span, y0, method='RK45')