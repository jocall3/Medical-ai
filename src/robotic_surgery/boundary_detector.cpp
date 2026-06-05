#include <iostream>
#include <vector>
#include <chrono>
#include <immintrin.h> // AVX2
#include <opencv2/opencv.hpp>

struct Point2D {
    float x;
    float y;
};

class BoundaryDetector {
public:
    BoundaryDetector(int width, int height) : width_(width), height_(height) {
        aligned_width_ = (width + 31) & ~31;
    }

    std::vector<Point2D> detect_critical_boundaries(const uint8_t* mask_data, uint8_t critical_label) {
        std::vector<Point2D> boundaries;
        boundaries.reserve(1000);

        __m256i critical_vec = _mm256_set1_epi8(static_cast<char>(critical_label));

        for (int y = 1; y < height_ - 1; ++y) {
            const uint8_t* prev_row = mask_data + (y - 1) * width_;
            const uint8_t* curr_row = mask_data + y * width_;
            const uint8_t* next_row = mask_data + (y + 1) * width_;

            int x = 1;
            for (; x <= width_ - 33; x += 32) {
                __m256i curr = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(curr_row + x));
                __m256i is_critical = _mm256_cmpeq_epi8(curr, critical_vec);
                
                if (_mm256_testz_si256(is_critical, is_critical)) {
                    continue;
                }

                __m256i left = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(curr_row + x - 1));
                __m256i right = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(curr_row + x + 1));
                __m256i top = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(prev_row + x));
                __m256i bottom = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(next_row + x));

                __m256i left_not_crit = _mm256_andnot_si256(_mm256_cmpeq_epi8(left, critical_vec), _mm256_set1_epi8(0xFF));
                __m256i right_not_crit = _mm256_andnot_si256(_mm256_cmpeq_epi8(right, critical_vec), _mm256_set1_epi8(0xFF));
                __m256i top_not_crit = _mm256_andnot_si256(_mm256_cmpeq_epi8(top, critical_vec), _mm256_set1_epi8(0xFF));
                __m256i bottom_not_crit = _mm256_andnot_si256(_mm256_cmpeq_epi8(bottom, critical_vec), _mm256_set1_epi8(0xFF));

                __m256i neighbor_not_crit = _mm256_or_si256(
                    _mm256_or_si256(left_not_crit, right_not_crit),
                    _mm256_or_si256(top_not_crit, bottom_not_crit)
                );

                __m256i boundary_mask = _mm256_and_si256(is_critical, neighbor_not_crit);

                uint32_t mask_bits = _mm256_movemask_epi8(boundary_mask);
                while (mask_bits > 0) {
                    int index = __builtin_ctz(mask_bits);
                    boundaries.push_back({static_cast<float>(x + index), static_cast<float>(y)});
                    mask_bits &= (mask_bits - 1);
                }
            }

            for (; x < width_ - 1; ++x) {
                if (curr_row[x] == critical_label) {
                    if (curr_row[x - 1] != critical_label || curr_row[x + 1] != critical_label ||
                        prev_row[x] != critical_label || next_row[x] != critical_label) {
                        boundaries.push_back({static_cast<float>(x), static_cast<float>(y)});
                    }
                }
            }
        }
        return boundaries;
    }

private:
    int width_;
    int height_;
    int aligned_width_;
};

extern "C" {
    BoundaryDetector* create_detector(int width, int height) {
        return new BoundaryDetector(width, height);
    }

    void destroy_detector(BoundaryDetector* detector) {
        delete detector;
    }

    int detect_boundaries(BoundaryDetector* detector, const uint8_t* mask_data, uint8_t critical_label, float* out_x, float* out_y, int max_points) {
        auto boundaries = detector->detect_critical_boundaries(mask_data, critical_label);
        int count = std::min(static_cast<int>(boundaries.size()), max_points);
        for (int i = 0; i < count; ++i) {
            out_x[i] = boundaries[i].x;
            out_y[i] = boundaries[i].y;
        }
        return count;
    }
}
