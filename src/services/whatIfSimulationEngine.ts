import { DayRiskPoint } from '../components/WorkforceRiskTrend7DaysChart';

export interface WhatIfParameters {
  vaccinationRatePct: number; // 0% to 100%, baseline 82%
  seasonalHumidityPct: number; // 20% to 95%, baseline 55%
  ambientHeatC: number; // 20°C to 50°C, baseline 34°C
  shiftDurationHours: number; // 6h to 14h, baseline 8.5h
  ppeCoolingMitigationPct: number; // 40% to 100%, baseline 85%
  restHydrationFrequencyMin: number; // 5 to 30 min/h, baseline 15m
  isSimulationActive: boolean;
}

export const DEFAULT_WHAT_IF_PARAMETERS: WhatIfParameters = {
  vaccinationRatePct: 82,
  seasonalHumidityPct: 55,
  ambientHeatC: 34.0,
  shiftDurationHours: 8.5,
  ppeCoolingMitigationPct: 85,
  restHydrationFrequencyMin: 15,
  isSimulationActive: false
};

export interface WhatIfImpactSummary {
  netRiskDelta: number; // Net percentage change in risk score (+ / -)
  vaxImpact: number;
  humidityImpact: number;
  heatImpact: number;
  shiftImpact: number;
  mitigationImpact: number;
  herdImmunityAchieved: boolean;
  herdImmunityGap: number;
  evaporativeEfficiencyPct: number;
  heatIndexC: number;
  heatCategory: 'EXTREME_DANGER' | 'DANGER' | 'EXTREME_CAUTION' | 'CAUTION' | 'NORMAL';
  riskTier: 'CRITICAL_SURGE' | 'ELEVATED' | 'NOMINAL' | 'OPTIMAL_SAFE';
  projectedSpikesDelta: number;
}

export type WhatIfPresetKey =
  | 'BASELINE'
  | 'SUMMER_HEATWAVE'
  | 'OUTBREAK_LOW_VAX'
  | 'OPTIMAL_PROTECTION'
  | 'EXTREME_COMPOUND';

export interface WhatIfPreset {
  id: WhatIfPresetKey;
  label: string;
  badge: string;
  description: string;
  params: Omit<WhatIfParameters, 'isSimulationActive'>;
}

export const WHAT_IF_PRESETS: WhatIfPreset[] = [
  {
    id: 'BASELINE',
    label: 'Current Facility Baseline',
    badge: 'Nominal',
    description: 'Current real-time operational baseline parameters (82% vaccination, 55% seasonal humidity, 34°C heat).',
    params: {
      vaccinationRatePct: 82,
      seasonalHumidityPct: 55,
      ambientHeatC: 34.0,
      shiftDurationHours: 8.5,
      ppeCoolingMitigationPct: 85,
      restHydrationFrequencyMin: 15
    }
  },
  {
    id: 'SUMMER_HEATWAVE',
    label: 'Summer Heatwave & Humidity Surge',
    badge: '+18% Risk Surge',
    description: 'Simulates tropical seasonal monsoonal humidity (85%) combined with high solar radiation (43°C) impairing evaporative cooling.',
    params: {
      vaccinationRatePct: 80,
      seasonalHumidityPct: 85,
      ambientHeatC: 43.0,
      shiftDurationHours: 9.5,
      ppeCoolingMitigationPct: 70,
      restHydrationFrequencyMin: 10
    }
  },
  {
    id: 'OUTBREAK_LOW_VAX',
    label: 'Viral Surge & Low Vaccine Uptake',
    badge: 'Infection Spike',
    description: 'Workforce vaccination coverage drops to 45% during viral respiratory season, heightening autonomic strain and sick leave.',
    params: {
      vaccinationRatePct: 45,
      seasonalHumidityPct: 65,
      ambientHeatC: 32.0,
      shiftDurationHours: 8.5,
      ppeCoolingMitigationPct: 65,
      restHydrationFrequencyMin: 15
    }
  },
  {
    id: 'OPTIMAL_PROTECTION',
    label: 'Proactive Mitigation & High Vax',
    badge: '-14% Protective Shift',
    description: 'Targeted compliance: 98% vaccination, strict 8-hour shifts, active cooling vests (98%), and 25-minute recovery intervals.',
    params: {
      vaccinationRatePct: 98,
      seasonalHumidityPct: 45,
      ambientHeatC: 28.0,
      shiftDurationHours: 8.0,
      ppeCoolingMitigationPct: 98,
      restHydrationFrequencyMin: 25
    }
  },
  {
    id: 'EXTREME_COMPOUND',
    label: 'Severe Compound Stressor Surge',
    badge: 'Critical Multi-Failure',
    description: 'Worst-case multi-signal scenario: 50% vaccine rate, 90% humidity, 46°C heatwave, 12-hour overtime shifts, depleted cooling.',
    params: {
      vaccinationRatePct: 50,
      seasonalHumidityPct: 90,
      ambientHeatC: 46.0,
      shiftDurationHours: 12.0,
      ppeCoolingMitigationPct: 50,
      restHydrationFrequencyMin: 5
    }
  }
];

// Calculate Heat Index from ambient temperature and relative humidity
export function calculateHeatIndex(tempC: number, humidityPct: number): number {
  const tempF = tempC * 1.8 + 32;
  const rh = humidityPct;

  // Simplified Steadman/Rothfusz heat index formula
  let hiF =
    0.5 *
    (tempF +
      61.0 +
      (tempF - 68.0) * 1.2 +
      rh * 0.094);

  if (hiF >= 80) {
    hiF =
      -42.379 +
      2.04901523 * tempF +
      10.14333127 * rh -
      0.22475541 * tempF * rh -
      0.00683783 * tempF * tempF -
      0.05481717 * rh * rh +
      0.00122874 * tempF * tempF * rh +
      0.00085282 * tempF * rh * rh -
      0.00000199 * tempF * tempF * rh * rh;
  }

  const hiC = (hiF - 32) / 1.8;
  return Number(hiC.toFixed(1));
}

// Compute comprehensive What-If impact summary
export function calculateWhatIfImpact(params: WhatIfParameters): WhatIfImpactSummary {
  // 1. Vaccination Rate Impact:
  // Baseline is 82%. Falling below 80% breaks herd immunity threshold.
  // Each 10% change below 82% yields approx +3.5% increased risk.
  const vaxDelta = (82 - params.vaccinationRatePct) * 0.35;

  // 2. Seasonal Humidity Impact:
  // Baseline is 55%. High humidity (>70%) severely impairs sweat evaporation.
  const humidityDelta = (params.seasonalHumidityPct - 55) * 0.30;

  // 3. Ambient Heat Impact:
  // Baseline is 34°C.
  const heatDelta = (params.ambientHeatC - 34) * 0.85;

  // 4. Shift Duration Impact:
  // Baseline is 8.5h. Overtime (>8h) increases cumulative fatigue exponent.
  const shiftDelta = (params.shiftDurationHours - 8.5) * 2.4;

  // 5. PPE & Active Cooling Mitigation Impact:
  // Baseline is 85%. Higher cooling compliance protects against thermal shock.
  const mitigationDelta = (85 - params.ppeCoolingMitigationPct) * 0.32;

  // 6. Rest & Hydration Frequency Impact:
  // Baseline is 15 min.
  const restDelta = (15 - params.restHydrationFrequencyMin) * 0.40;

  const netRiskDelta = Number(
    (vaxDelta + humidityDelta + heatDelta + shiftDelta + mitigationDelta + restDelta).toFixed(1)
  );

  const heatIndexC = calculateHeatIndex(params.ambientHeatC, params.seasonalHumidityPct);

  // Evaporative cooling efficiency is inversely related to humidity
  const evaporativeEfficiencyPct = Math.max(
    8,
    Math.min(100, Math.round(100 - (params.seasonalHumidityPct - 20) * 1.15))
  );

  let heatCategory: WhatIfImpactSummary['heatCategory'] = 'NORMAL';
  if (heatIndexC >= 45) heatCategory = 'EXTREME_DANGER';
  else if (heatIndexC >= 39) heatCategory = 'DANGER';
  else if (heatIndexC >= 32) heatCategory = 'EXTREME_CAUTION';
  else if (heatIndexC >= 27) heatCategory = 'CAUTION';

  let riskTier: WhatIfImpactSummary['riskTier'] = 'NOMINAL';
  if (netRiskDelta >= 15) riskTier = 'CRITICAL_SURGE';
  else if (netRiskDelta >= 5) riskTier = 'ELEVATED';
  else if (netRiskDelta <= -6) riskTier = 'OPTIMAL_SAFE';

  const herdImmunityAchieved = params.vaccinationRatePct >= 80;
  const herdImmunityGap = params.vaccinationRatePct - 80;

  // Rough projection of spike count change
  const projectedSpikesDelta = Math.round(netRiskDelta / 6);

  return {
    netRiskDelta,
    vaxImpact: Number(vaxDelta.toFixed(1)),
    humidityImpact: Number(humidityDelta.toFixed(1)),
    heatImpact: Number(heatDelta.toFixed(1)),
    shiftImpact: Number(shiftDelta.toFixed(1)),
    mitigationImpact: Number((mitigationDelta + restDelta).toFixed(1)),
    herdImmunityAchieved,
    herdImmunityGap,
    evaporativeEfficiencyPct,
    heatIndexC,
    heatCategory,
    riskTier,
    projectedSpikesDelta
  };
}

// Re-computes chart data points applying real-time What-If parameter adjustments
export function recalculateTrendWithWhatIf(
  baseData: DayRiskPoint[],
  params: WhatIfParameters,
  confidenceLevel: 90 | 95 | 99 = 95,
  showForecastHorizon: boolean = true
) {
  const zMultiplier = confidenceLevel === 99 ? 2.576 : confidenceLevel === 90 ? 1.645 : 1.960;
  const baseStdError = 4.2;
  const impact = calculateWhatIfImpact(params);
  const netDelta = params.isSimulationActive ? impact.netRiskDelta : 0;

  // Dynamic variance scaling: higher risk and extreme conditions increase prediction uncertainty
  const uncertaintyScale = params.isSimulationActive
    ? Math.max(0.65, Math.min(2.2, 1 + netDelta / 45))
    : 1.0;

  const enriched = baseData.map((d) => {
    // Base values
    const margin = Number((baseStdError * (zMultiplier / 1.96)).toFixed(1));
    const baseUpper = Number(Math.min(100, d.peakRiskScore + margin).toFixed(1));
    const baseLower = Number(Math.max(0, d.peakRiskScore - margin).toFixed(1));

    // Simulated values
    const simulatedPeak = Number(Math.min(100, Math.max(4, d.peakRiskScore + netDelta)).toFixed(1));
    const simulatedAvg = Number(Math.min(100, Math.max(3, d.avgRiskScore + netDelta * 0.72)).toFixed(1));

    const simulatedMargin = Number((margin * uncertaintyScale).toFixed(1));
    const simulatedUpper = Number(Math.min(100, simulatedPeak + simulatedMargin).toFixed(1));
    const simulatedLower = Number(Math.max(0, simulatedPeak - simulatedMargin).toFixed(1));

    const simulatedIsSpike = simulatedPeak >= 65;
    const simulatedAnomalies = Math.max(
      0,
      Math.round(d.anomalyCount * (1 + netDelta / 55))
    );
    const simulatedCritical = Math.max(
      0,
      Math.round(d.criticalCount * (1 + netDelta / 45))
    );

    return {
      ...d,
      isForecast: false,
      forecastUpper: baseUpper,
      forecastLower: baseLower,
      uncertaintyMargin: margin,
      // What-If simulated properties
      simulatedPeakRiskScore: simulatedPeak,
      simulatedAvgRiskScore: simulatedAvg,
      simulatedForecastUpper: simulatedUpper,
      simulatedForecastLower: simulatedLower,
      simulatedUncertaintyMargin: simulatedMargin,
      simulatedIsSpike,
      simulatedAnomalyCount: simulatedAnomalies,
      simulatedCriticalCount: simulatedCritical,
      riskDelta: Number((simulatedPeak - d.peakRiskScore).toFixed(1))
    };
  });

  if (showForecastHorizon) {
    const projectedPoints = [
      {
        isoDate: '2026-11-07',
        date: 'Sat 11/07 (+24h)',
        dayName: 'Saturday (Projected)',
        fullDate: 'November 7, 2026 (Forward Model)',
        avgRiskScore: 32.5,
        peakRiskScore: 56.4,
        anomalyCount: 6,
        criticalCount: 1,
        isSpike: false,
        primaryZone: 'Outdoor Construction Sector 4',
        peakTime: '13:45',
        isForecast: true,
        uncertaintyMargin: Number((baseStdError * 1.35 * (zMultiplier / 1.96)).toFixed(1)),
        forecastUpper: Number(Math.min(100, 56.4 + baseStdError * 1.35 * (zMultiplier / 1.96)).toFixed(1)),
        forecastLower: Number(Math.max(0, 56.4 - baseStdError * 1.35 * (zMultiplier / 1.96)).toFixed(1)),
        spikeReason: 'Projected diurnal solar escalation (+24h Kalman forecast)'
      },
      {
        isoDate: '2026-11-08',
        date: 'Sun 11/08 (+48h)',
        dayName: 'Sunday (Projected)',
        fullDate: 'November 8, 2026 (Forward Model)',
        avgRiskScore: 29.8,
        peakRiskScore: 51.2,
        anomalyCount: 5,
        criticalCount: 1,
        isSpike: false,
        primaryZone: 'Warehouse Logistics Hub North',
        peakTime: '14:10',
        isForecast: true,
        uncertaintyMargin: Number((baseStdError * 1.75 * (zMultiplier / 1.96)).toFixed(1)),
        forecastUpper: Number(Math.min(100, 51.2 + baseStdError * 1.75 * (zMultiplier / 1.96)).toFixed(1)),
        forecastLower: Number(Math.max(0, 51.2 - baseStdError * 1.75 * (zMultiplier / 1.96)).toFixed(1)),
        spikeReason: 'Weekend baseline shift with rotational maintenance crew'
      },
      {
        isoDate: '2026-11-09',
        date: 'Mon 11/09 (+72h)',
        dayName: 'Monday (Projected)',
        fullDate: 'November 9, 2026 (Forward Model)',
        avgRiskScore: 42.6,
        peakRiskScore: 74.8,
        anomalyCount: 11,
        criticalCount: 3,
        isSpike: true,
        primaryZone: 'Outdoor Construction Sector 4',
        peakTime: '15:15',
        isForecast: true,
        uncertaintyMargin: Number((baseStdError * 2.3 * (zMultiplier / 1.96)).toFixed(1)),
        forecastUpper: Number(Math.min(100, 74.8 + baseStdError * 2.3 * (zMultiplier / 1.96)).toFixed(1)),
        forecastLower: Number(Math.max(0, 74.8 - baseStdError * 2.3 * (zMultiplier / 1.96)).toFixed(1)),
        spikeReason: 'Predicted mid-month thermal surge: 43.5°C WBGT inflection (+72h model)'
      }
    ].map((proj) => {
      // Apply forward compounding What-If multiplier
      const projNetDelta = Number((netDelta * 1.15).toFixed(1));
      const simulatedPeak = Number(Math.min(100, Math.max(6, proj.peakRiskScore + projNetDelta)).toFixed(1));
      const simulatedAvg = Number(Math.min(100, Math.max(4, proj.avgRiskScore + projNetDelta * 0.75)).toFixed(1));

      const simulatedMargin = Number((proj.uncertaintyMargin * uncertaintyScale).toFixed(1));
      const simulatedUpper = Number(Math.min(100, simulatedPeak + simulatedMargin).toFixed(1));
      const simulatedLower = Number(Math.max(0, simulatedPeak - simulatedMargin).toFixed(1));

      return {
        ...proj,
        simulatedPeakRiskScore: simulatedPeak,
        simulatedAvgRiskScore: simulatedAvg,
        simulatedForecastUpper: simulatedUpper,
        simulatedForecastLower: simulatedLower,
        simulatedUncertaintyMargin: simulatedMargin,
        simulatedIsSpike: simulatedPeak >= 65,
        simulatedAnomalyCount: Math.max(0, Math.round(proj.anomalyCount * (1 + projNetDelta / 50))),
        simulatedCriticalCount: Math.max(0, Math.round(proj.criticalCount * (1 + projNetDelta / 40))),
        riskDelta: Number((simulatedPeak - proj.peakRiskScore).toFixed(1))
      };
    });

    return [...enriched, ...projectedPoints];
  }

  return enriched;
}
