import pydicom
import numpy as np
import os

class DICOMParser:
    @staticmethod
    def parse_volume(directory):
        files = [pydicom.dcmread(os.path.join(directory, f)) for f in os.listdir(directory) if f.endswith('.dcm')]
        files.sort(key=lambda x: float(x.ImagePositionPatient[2]))
        pixel_array = np.stack([f.pixel_array for f in files])
        return pixel_array, files[0].PixelSpacing