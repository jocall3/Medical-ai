#include <iostream>
#include <vector>
#include <cmath>
#include <cassert>

// Simulated Surgical Robot Computer Vision Boundary Detector
class BoundaryDetector {
public:
    // Detects tissue boundary transition index in a 1D scanline of pixels
    // Normal tissue has low intensity (e.g., < 100), critical organ has high intensity (e.g., > 150)
    int detectBoundary(const std::vector<double>& scanline) {
        if (scanline.size() < 2) return -1;
        
        double max_gradient = 0.0;
        int boundary_idx = -1;
        
        // Apply a Sobel-like 1D gradient filter with noise suppression
        for (size_t i = 1; i < scanline.size() - 1; ++i) {
            double gradient = std::abs(scanline[i+1] - scanline[i-1]);
            
            // Robustness check: ignore high-frequency single-pixel spikes (noise)
            double local_variance = std::abs(scanline[i] - (scanline[i-1] + scanline[i+1]) / 2.0);
            
            if (gradient > max_gradient && local_variance < 30.0) {
                max_gradient = gradient;
                boundary_idx = i;
            }
        }
        return boundary_idx;
    }
};

void test_normal_boundary_detection() {
    BoundaryDetector detector;
    // Clear transition from 50 (tissue A) to 200 (tissue B) at index 5
    std::vector<double> scanline = {50, 52, 48, 55, 120, 200, 205, 198, 202};
    int boundary = detector.detectBoundary(scanline);
    assert(boundary == 4 || boundary == 5);
    std::cout << "[Surgical Boundary Test] Normal detection passed. Boundary at: " << boundary << std::endl;
}

void test_adversarial_noise_robustness() {
    BoundaryDetector detector;
    // Transition at index 5, but with high-frequency adversarial noise (spikes) injected at index 2
    // to trick naive gradient detectors into misidentifying the boundary.
    std::vector<double> scanline = {50, 52, 250, 55, 120, 200, 205, 198, 202}; // 250 is a noise spike
    int boundary = detector.detectBoundary(scanline);
    
    // The detector should ignore the single-pixel spike at index 2 due to local variance check
    // and correctly identify the boundary near index 4 or 5.
    assert(boundary == 4 || boundary == 5);
    std::cout << "[Surgical Boundary Test] Adversarial noise robustness passed. Boundary at: " << boundary << std::endl;
}

int main() {
    test_normal_boundary_detection();
    test_adversarial_noise_robustness();
    std::cout << "[Surgical Boundary Test] All tests passed successfully!" << std::endl;
    return 0;
}