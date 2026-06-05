generate_mock_timestamps <- function(n = 1000, target_interval_ms = 100) {
  base_noise <- rnorm(n, mean = 0, sd = 2)
  spikes <- rbinom(n, 1, 0.02) * rexp(n, rate = 0.05)
  intervals <- target_interval_ms + base_noise + spikes
  timestamps <- cumsum(intervals)
  return(list(timestamps = timestamps, intervals = intervals))
}

analyze_jitter <- function() {
  cat("========================================================\n")
  cat("LSTM Monitoring Pipeline: Real-time Jitter Analysis\n")
  cat("========================================================\n")
  target_interval <- 100.0
  data <- generate_mock_timestamps(1000, target_interval)
  intervals <- data$intervals
  jitter <- abs(diff(intervals))
  mean_interval <- mean(intervals)
  sd_interval <- sd(intervals)
  max_interval <- max(intervals)
  min_interval <- min(intervals)
  mean_jitter <- mean(jitter)
  max_jitter <- max(jitter)
  p95_jitter <- quantile(jitter, 0.95)
  p99_jitter <- quantile(jitter, 0.99)
  cat(sprintf("Target Interval:      %.2f ms\n", target_interval))
  cat(sprintf("Mean Interval:        %.2f ms\n", mean_interval))
  cat(sprintf("Interval Std Dev:     %.2f ms\n", sd_interval))
  cat(sprintf("Min/Max Interval:     %.2f / %.2f ms\n", min_interval, max_interval))
  cat("\n--- Jitter Metrics ---\n")
  cat(sprintf("Mean Absolute Jitter: %.2f ms\n", mean_jitter))
  cat(sprintf("Max Jitter Spike:     %.2f ms\n", max_jitter))
  cat(sprintf("95th Percentile:      %.2f ms\n", p95_jitter))
  cat(sprintf("99th Percentile:      %.2f ms\n", p99_jitter))
  sla_threshold <- 15.0
  cat("\n--- SLA Verification ---\n")
  if (p99_jitter < sla_threshold) {
    cat(sprintf("STATUS: PASSED (p99 Jitter %.2f ms < %.2f ms SLA)\n", p99_jitter, sla_threshold))
  } else {
    cat(sprintf("STATUS: FAILED (p99 Jitter %.2f ms >= %.2f ms SLA)\n", p99_jitter, sla_threshold))
  }
  cat("========================================================\n")
  write.csv(data.frame(Intervals = intervals, Jitter = c(0, jitter)), "reports/jitter_analysis_results.csv", row.names = FALSE)
}

dir.create("reports", showWarnings = FALSE)
analyze_jitter()
