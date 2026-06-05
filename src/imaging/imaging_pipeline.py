from .dicom_parser import DICOMParser
from .image_registration import VoxelMorph
from .image_segmentation import UNet3D

class ImagingPipeline:
    def run(self, dicom_dir):
        data, spacing = DICOMParser.parse_volume(dicom_dir)
        # Orchestrate registration and segmentation
        return data