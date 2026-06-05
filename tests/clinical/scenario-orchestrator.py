import concurrent.futures
class ScenarioOrchestrator:
    def run_all(self, scenarios, engine):
        with concurrent.futures.ThreadPoolExecutor() as executor:
            return list(executor.map(engine.run_scenario, scenarios))