# Testing Hierarchy Strategy

## The Testing Pyramid for Medical AI
Traditional software testing is insufficient for probabilistic AI. We employ a five-tier hierarchy to ensure clinical safety.

### Tier 1: Unit & Mathematical Validation
- **Focus**: Pure functions, tensor shapes, and loss function convergence.
- **Goal**: Ensure the math is correct.

### Tier 2: Adversarial Robustness Testing
- **Focus**: Edge cases, noise injection, and "out-of-distribution" (OOD) inputs.
- **Goal**: Ensure the model doesn't hallucinate or crash when faced with corrupted medical data.

### Tier 3: Clinical Scenario Testing (Deterministic)
- **Focus**: Gold-standard clinical cases (e.g., a textbook case of myocardial infarction).
- **Goal**: Ensure the AI reaches the correct diagnosis for known benchmarks.

### Tier 4: Population-Scale Simulation (Probabilistic)
- **Focus**: Running the AI against 100,000+ synthetic patients with varying comorbidities.
- **Goal**: Measure the "Population Risk" (e.g., what is the probability of a false negative in patients over 80 with renal failure?).

### Tier 5: Human-in-the-Loop (HITL) Validation
- **Focus**: Shadow deployments where AI recommendations are compared against real clinician decisions in real-time (without affecting patient care).
- **Goal**: Validate the AI's utility and trust-factor in a real clinical workflow.

## Success Metrics
- **Clinical Sensitivity**: $\text{TP} / (\text{TP} + \text{FN})$ must exceed 99.9% for critical ailments.
- **Safety Buffer**: The AI must flag "Uncertainty" for any case where confidence is below a predefined clinical threshold.