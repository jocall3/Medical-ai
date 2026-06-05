import abc
class SimulationEngine(abc.ABC):
    def __init__(self, population):
        self.population = population
    @abc.abstractmethod
    def run_scenario(self, scenario):
        pass
class ClinicalSimulationEngine(SimulationEngine):
    def run_scenario(self, scenario):
        results = []
        for patient in self.population:
            results.append(scenario.execute(patient))
        return results