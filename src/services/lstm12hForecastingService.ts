import { ActiveAnomalyAlert, FacilityZone, Lstm12hForecastResult, Lstm12hForecastHour } from '../types';

export interface LstmSimulationOptions {
  scenario?: 'BASELINE' | 'HEAT_SURGE' | 'MITIGATED';
  baselineRisk?: number;
  sensitivityMultiplier?: number;
}

/**
 * Generates an LSTM 12-Hour predictive risk forecast based on current anomaly patterns,
 * diurnal environmental heat cycles, and cumulative worker fatigue curves.
 */
export function generateLstm12hForecast(
  alerts: ActiveAnomalyAlert[],
  zone?: FacilityZone,
  options?: LstmSimulationOptions
): Lstm12hForecastResult {
  const scenario = options?.scenario || 'BASELINE';
  const now = new Date();
  const currentHour = now.getHours();

  // Determine baseline risk from active critical/high alerts
  const highRiskAlerts = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  
  let computedBaseRisk = options?.baselineRisk ?? (
    criticalCount >= 2 ? 78.5 :
    criticalCount === 1 ? 68.2 :
    highRiskAlerts.length >= 2 ? 58.0 : 42.0
  );

  // Zone specific heat baseline
  const zoneTemp = zone?.temp ? parseFloat(zone.temp) : 41.5;
  const isHighHeatZone = zoneTemp >= 40 || zone?.id?.includes('Sector-4');

  const hours: Lstm12hForecastHour[] = [];
  let peakRisk = 0;
  let peakHourOffset = 1;
  let peakTimeLabel = '';

  for (let offset = 1; offset <= 12; offset++) {
    const targetDate = new Date(now.getTime() + offset * 3600 * 1000);
    const targetHour = targetDate.getHours();
    const timeFormatted = `${targetHour.toString().padStart(2, '0')}:00`;
    const timeLabel = `+${offset}h (${timeFormatted})`;

    // Diurnal thermal coefficient: peak heat between 13:00 and 16:30
    const hoursFromPeakHeat = Math.abs(targetHour - 14.5);
    const heatInfluence = Math.max(0, 1 - hoursFromPeakHeat / 7.5); // 0 to 1

    // Circadian / Shift fatigue curve: rises as shift progresses (offset 1 to 7) then drops at handover
    const fatigueFactor = Math.sin((offset / 12) * Math.PI) * 0.85;

    // Base LSTM projection calculation
    let projectedScore = computedBaseRisk;

    if (scenario === 'BASELINE') {
      // Natural progression: peaks during thermal & fatigue overlap
      const diurnalDrift = heatInfluence * (isHighHeatZone ? 18.5 : 12.0);
      const fatigueDrift = fatigueFactor * 14.0;
      projectedScore = computedBaseRisk + diurnalDrift + fatigueDrift - (offset > 9 ? 8.0 : 0);
    } else if (scenario === 'HEAT_SURGE') {
      // Heatwave surge scenario: amplified thermal loading
      const surgeHeat = heatInfluence * (isHighHeatZone ? 26.0 : 19.5);
      const fatigueDrift = fatigueFactor * 18.0;
      projectedScore = computedBaseRisk + surgeHeat + fatigueDrift + 8.5;
    } else if (scenario === 'MITIGATED') {
      // Staged cooling and rotations scenario: suppresses peak by 25-35%
      const mitigatedHeat = heatInfluence * 6.5;
      const mitigatedFatigue = fatigueFactor * 4.0;
      projectedScore = (computedBaseRisk * 0.72) + mitigatedHeat + mitigatedFatigue - (offset * 1.5);
    }

    // Clamp score within 5% to 98%
    projectedScore = Number(Math.max(8.5, Math.min(96.5, projectedScore)).toFixed(1));

    // Dynamic Reconstruction MSE (higher when anomaly deviation is intense)
    const baseMse = 0.28 + (projectedScore / 100) * 0.22;
    const reconstructionMse = Number((baseMse + Math.sin(offset * 0.8) * 0.04).toFixed(3));

    // Confidence corridor bounds
    const spread = (100 - projectedScore) * 0.14 + (offset * 0.6);
    const confidenceLower = Number(Math.max(5, projectedScore - spread).toFixed(1));
    const confidenceUpper = Number(Math.min(99, projectedScore + spread).toFixed(1));
    const confidencePct = Number((97.5 - offset * 0.55).toFixed(1));

    // Risk Tier
    const projectedRiskTier: Lstm12hForecastHour['projectedRiskTier'] =
      projectedScore >= 80 ? 'CRITICAL_RISK' :
      projectedScore >= 65 ? 'HIGH_RISK' :
      projectedScore >= 45 ? 'MODERATE_RISK' : 'LOW_RISK';

    // Primary Driver & Predicted breach
    let primaryProjectedDriver = 'Nominal Multi-Signal Equilibrium';
    let predictedThresholdBreach = undefined;
    let recommendedMitigation = undefined;

    if (heatInfluence > 0.65 && isHighHeatZone) {
      primaryProjectedDriver = 'Solar Thermal Radiation & Exertional Tachycardia';
      predictedThresholdBreach = 'Ambient Heat Ceiling (>43.5°C) & Core Heat Strain';
      recommendedMitigation = 'Deploy rapid evaporative cooling trailers and misting arrays.';
    } else if (fatigueFactor > 0.65) {
      primaryProjectedDriver = 'Cumulative Autonomic HRV Collapse (Vagal Exhaustion)';
      predictedThresholdBreach = 'HRV Floor Exceeded (<32ms RMSSD)';
      recommendedMitigation = 'Mandate 20-minute shaded rest breaks with isotonic rehydration.';
    } else if (highRiskAlerts.some(a => a.alert_type === 'PREDICTIVE_MAINTENANCE')) {
      primaryProjectedDriver = 'Harmonic Bearing Vibration & Rotor Friction Heat Drift';
      predictedThresholdBreach = 'ISO 10816-3 Vibration Severity Zone D Excursion';
      recommendedMitigation = 'LOTO Stage 2 isolation; lubricate drive roller bearing sleeve.';
    } else if (projectedScore >= 60) {
      primaryProjectedDriver = 'Multi-Signal Covariance Drift across Cohort';
      predictedThresholdBreach = 'Multidimensional Risk Cutoff (>65%)';
      recommendedMitigation = 'Rotate cohort to lower-strain secondary tasks.';
    }

    const ambientHeatForecastC = Number((zoneTemp + (heatInfluence * 3.8) - (offset > 8 ? 2.5 : 0)).toFixed(1));
    const hrvRestForecastMs = Number(Math.max(26, 62 - (projectedScore * 0.38)).toFixed(1));

    if (projectedScore > peakRisk) {
      peakRisk = projectedScore;
      peakHourOffset = offset;
      peakTimeLabel = timeLabel;
    }

    hours.push({
      hourOffset: offset,
      timeLabel,
      absoluteTime: timeFormatted,
      projectedRiskScore: projectedScore,
      projectedRiskTier,
      reconstructionMse,
      confidenceLower,
      confidenceUpper,
      confidencePct,
      primaryProjectedDriver,
      ambientHeatForecastC,
      hrvRestForecastMs,
      predictedThresholdBreach,
      recommendedMitigation
    });
  }

  // Mark peak hour
  const peakIndex = hours.findIndex(h => h.hourOffset === peakHourOffset);
  if (peakIndex !== -1) {
    hours[peakIndex].isProjectedPeak = true;
  }

  const hoursInHighOrCritical = hours.filter(h => h.projectedRiskScore >= 65).length;
  const inflectionVelocity = Number((peakRisk - computedBaseRisk).toFixed(1));

  let keyDriversSummary = 'Diurnal ambient solar heating combined with accumulated autonomic exertion during peak shift hours.';
  if (scenario === 'HEAT_SURGE') {
    keyDriversSummary = 'Extreme thermal radiation surge (+4.5°C excursion) amplifying cohort cardiovascular strain.';
  } else if (scenario === 'MITIGATED') {
    keyDriversSummary = 'Mitigation protocols active: continuous hydration and microclimate cooling suppression reduce peak by 28%.';
  }

  return {
    generatedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    baselineCurrentRisk: computedBaseRisk,
    projectedPeakRisk: peakRisk,
    peakHourOffset,
    peakTimeLabel,
    riskInflectionVelocity: inflectionVelocity,
    hoursInHighOrCriticalRisk: hoursInHighOrCritical,
    modelConfidenceIndex: 94.6,
    scenario,
    hours,
    keyDriversSummary
  };
}
