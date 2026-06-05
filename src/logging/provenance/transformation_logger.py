import time
import sys
import platform
import functools
from typing import Dict, Any, List, Callable
from src.logging.provenance.lineage_tracker import LineageTracker

class TransformationLogger:
    """
    Logs specific data transformation events and registers them with the LineageTracker.
    """
    def __init__(self, tracker: LineageTracker):
        self.tracker = tracker

    def log_transformation(
        self, 
        activity_name: str, 
        inputs: List[Dict[str, Any]], 
        outputs: List[Dict[str, Any]], 
        parameters: Dict[str, Any],
        agent_name: str = "AI_Pipeline_Engine"
    ) -> None:
        """
        Logs a transformation activity, its inputs, outputs, and the agent responsible.
        """
        # Register Agent
        agent_id = f"agent:{agent_name.lower().replace(' ', '_')}"
        self.tracker.register_agent(agent_id, {
            "name": agent_name,
            "system_platform": platform.system(),
            "python_version": sys.version
        })

        # Register Activity
        activity_id = f"activity:{activity_name.lower().replace(' ', '_')}_{int(time.time())}"
        self.tracker.register_activity(activity_id, {
            "name": activity_name,
            "parameters": parameters,
            "timestamp": time.time()
        })
        self.tracker.was_associated_with(activity_id, agent_id)

        # Register Inputs and link to Activity
        for inp in inputs:
            inp_id = inp.get("id", f"entity:input_{int(time.time())}")
            self.tracker.register_entity(inp_id, inp.get("attributes", {}))
            self.tracker.used(activity_id, inp_id)

        # Register Outputs and link to Activity
        for out in outputs:
            out_id = out.get("id", f"entity:output_{int(time.time())}")
            self.tracker.register_entity(out_id, out.get("attributes", {}))
            self.tracker.was_generated_by(out_id, activity_id)

    def track_transformation(self, activity_name: str, agent_name: str = "AI_Pipeline_Engine"):
        """
        Decorator to automatically log function execution as a data transformation.
        """
        def decorator(func: Callable):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                
                # Capture inputs
                inputs = []
                for idx, arg in enumerate(args):
                    inputs.append({
                        "id": f"entity:arg_{idx}_{id(arg)}",
                        "attributes": {"type": type(arg).__name__}
                    })
                for k, v in kwargs.items():
                    inputs.append({
                        "id": f"entity:kwarg_{k}_{id(v)}",
                        "attributes": {"name": k, "type": type(v).__name__}
                    })

                result = func(*args, **kwargs)
                execution_time = time.time() - start_time

                # Capture outputs
                outputs = [{
                    "id": f"entity:result_{id(result)}",
                    "attributes": {"type": type(result).__name__, "execution_time_sec": execution_time}
                }]

                self.log_transformation(
                    activity_name=activity_name,
                    inputs=inputs,
                    outputs=outputs,
                    parameters={"function_name": func.__name__},
                    agent_name=agent_name
                )
                return result
            return wrapper
        return decorator
