/**
 * Kalman Filter Simulator
 * Smooths continuous sensor noise and imputes missing packet values / jitter
 * in remote and harsh industrial telemetry settings.
 */
export class KalmanFilterSimulator {
  processVariance: number;
  measurementVariance: number;

  constructor(processVariance = 0.01, measurementVariance = 0.1) {
    this.processVariance = processVariance;
    this.measurementVariance = measurementVariance;
  }

  /**
   * Smooth an array of noisy sensor readings
   */
  smooth(data: number[]): number[] {
    if (!data || data.length === 0) {
      return [];
    }

    const smoothed: number[] = [];
    let estimate = data[0];
    let errorCovariance = 1.0;

    for (const measurement of data) {
      // Prediction update: variance grows with process noise
      errorCovariance += this.processVariance;

      // Measurement update: compute optimal Kalman gain
      const kalmanGain = errorCovariance / (errorCovariance + this.measurementVariance);

      // Correct the current state estimate
      estimate += kalmanGain * (measurement - estimate);

      // Update posterior error covariance
      errorCovariance *= (1.0 - kalmanGain);

      smoothed.push(Number(estimate.toFixed(2)));
    }

    return smoothed;
  }

  /**
   * Smooth a single value given previous state
   */
  step(measurement: number, prevEstimate: number, prevCovariance: number): { estimate: number; covariance: number } {
    let covariance = prevCovariance + this.processVariance;
    const gain = covariance / (covariance + this.measurementVariance);
    const estimate = prevEstimate + gain * (measurement - prevEstimate);
    covariance *= (1.0 - gain);
    return { estimate, covariance };
  }
}

export const defaultKalman = new KalmanFilterSimulator();
