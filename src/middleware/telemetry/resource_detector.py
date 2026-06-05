import os
import socket
import logging
import subprocess
from opentelemetry.sdk.resources import Resource, ResourceDetector

logger = logging.getLogger(__name__)

class MedicalNodeResourceDetector(ResourceDetector):
    """
    A custom OpenTelemetry ResourceDetector that automatically gathers environment metadata
    specific to medical AI inference nodes, including Kubernetes pod details, host info,
    and GPU hardware specifications (e.g., NVIDIA CUDA version, GPU model).
    """
    
    def detect(self) -> Resource:
        attributes = {}

        # 1. Detect Hostname
        try:
            attributes["host.name"] = socket.gethostname()
        except Exception:
            attributes["host.name"] = "unknown-host"

        # 2. Detect Kubernetes Environment
        pod_name = os.getenv("POD_NAME")
        pod_namespace = os.getenv("POD_NAMESPACE")
        node_name = os.getenv("NODE_NAME")
        
        if pod_name:
            attributes["k8s.pod.name"] = pod_name
        if pod_namespace:
            attributes["k8s.namespace.name"] = pod_namespace
        if node_name:
            attributes["k8s.node.name"] = node_name

        # 3. Detect GPU Hardware (Crucial for AI Inference Nodes)
        try:
            # Try running nvidia-smi to get GPU details
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=gpu_name,driver_version", "--format=csv,noheader,nounits"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=2
            )
            if result.returncode == 0 and result.stdout:
                parts = result.stdout.strip().split(",")
                if len(parts) >= 2:
                    attributes["hardware.gpu.model"] = parts[0].strip()
                    attributes["hardware.gpu.driver_version"] = parts[1].strip()
                    attributes["hardware.gpu.available"] = "true"
            else:
                attributes["hardware.gpu.available"] = "false"
        except Exception:
            # nvidia-smi not available or failed
            attributes["hardware.gpu.available"] = "false"

        # 4. Detect Medical Node Specific Metadata
        attributes["medical.node.type"] = os.getenv("MEDICAL_NODE_TYPE", "inference-node")
        attributes["medical.node.id"] = os.getenv("MEDICAL_NODE_ID", f"node-{socket.gethostname()}")
        attributes["medical.compliance.hipaa"] = "true"

        # Return Resource directly (do not use Resource.create to avoid infinite loops in detectors)
        return Resource(attributes)
