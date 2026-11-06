import { FacilityZone, HealthSignalNotificationThresholds } from '../types';

export interface WorkforceHealth30DayDataPoint {
  dayIndex: number;
  date: string;
  fullDate: string;
  dayOfWeek: string;
  avgHeartRate: number;
  peakHeartRate: number;
  avgHrv: number;
  minHrv: number;
  avgSkinTemp: number;
  thermalWorkLimit: number;
  healthSafetyScore: number; // Physiological Homeostasis Score (0-100%)
  riskScore: number; // Composite Anomaly Risk (0-100%)
  ambientTemp: number;
  acousticNoise: number;
  isWeekend: boolean;
  isHeatwave: boolean;
  hasThresholdDrop: boolean;
  thresholdDropReason?: string;
}

export interface WorkforceHealth30DaySummary {
  meanHrvMs: number;
  minHrvRecordedMs: number;
  meanHeartRateBpm: number;
  peakHeartRateBpm: number;
  meanSkinTempC: number;
  meanThermalWorkLimit: number;
  meanHealthSafetyScore: number;
  daysWithThresholdDrops: number;
  hrvBreachDaysCount: number;
  twlBreachDaysCount: number;
  healthSafetyBreachDaysCount: number;
  mostStrainedDay: {
    date: string;
    reason: string;
    hrv: number;
    twl: number;
    risk: number;
  };
}

/**
 * 30-Day Base Daily Health Signatures (Day 29 = 30 days ago, Day 0 = Today)
 */
const BASE_30D_HEALTH_PATTERNS = [
  // Days 0-5 (Early period: Nominal temperate baseline)
  { dayOffset: 29, hr: 73, peakHr: 92, hrv: 68, minHrv: 55, skin: 36.4, twl: 165, temp: 29.5, noise: 72, risk: 22 },
  { dayOffset: 28, hr: 74, peakHr: 95, hrv: 67, minHrv: 54, skin: 36.5, twl: 160, temp: 30.2, noise: 74, risk: 24 },
  { dayOffset: 27, hr: 72, peakHr: 89, hrv: 70, minHrv: 58, skin: 36.3, twl: 172, temp: 28.8, noise: 71, risk: 20 },
  { dayOffset: 26, hr: 71, peakHr: 88, hrv: 72, minHrv: 60, skin: 36.2, twl: 175, temp: 28.0, noise: 70, risk: 18 },
  { dayOffset: 25, hr: 68, peakHr: 82, hrv: 74, minHrv: 64, skin: 36.0, twl: 180, temp: 27.5, noise: 65, risk: 15 }, // Weekend
  { dayOffset: 24, hr: 69, peakHr: 84, hrv: 73, minHrv: 62, skin: 36.1, twl: 178, temp: 28.0, noise: 66, risk: 16 }, // Weekend

  // Days 6-12 (Gradual thermal accumulation & autonomic strain)
  { dayOffset: 23, hr: 76, peakHr: 98, hrv: 64, minHrv: 49, skin: 36.7, twl: 152, temp: 33.2, noise: 76, risk: 31 },
  { dayOffset: 22, hr: 78, peakHr: 104, hrv: 61, minHrv: 46, skin: 36.9, twl: 144, temp: 35.0, noise: 78, risk: 38 },
  { dayOffset: 21, hr: 81, peakHr: 108, hrv: 57, minHrv: 43, skin: 37.1, twl: 136, temp: 36.8, noise: 79, risk: 44 },
  { dayOffset: 20, hr: 83, peakHr: 112, hrv: 54, minHrv: 39, skin: 37.3, twl: 128, temp: 38.4, noise: 81, risk: 52 }, // Threshold Drop: HRV < 40ms
  { dayOffset: 19, hr: 84, peakHr: 114, hrv: 52, minHrv: 38, skin: 37.4, twl: 122, temp: 39.2, noise: 82, risk: 56 }, // Threshold Drop: HRV < 40ms
  { dayOffset: 18, hr: 74, peakHr: 94, hrv: 62, minHrv: 50, skin: 36.6, twl: 150, temp: 35.5, noise: 69, risk: 28 }, // Weekend
  { dayOffset: 17, hr: 75, peakHr: 96, hrv: 60, minHrv: 48, skin: 36.8, twl: 146, temp: 36.2, noise: 71, risk: 32 }, // Weekend

  // Days 13-19 (Severe Heatwave Peak: Significant Health Metric Drops)
  { dayOffset: 16, hr: 88, peakHr: 119, hrv: 48, minHrv: 35, skin: 37.7, twl: 112, temp: 41.5, noise: 83, risk: 68 }, // Breach: TWL < 115, HRV < 40
  { dayOffset: 15, hr: 92, peakHr: 126, hrv: 44, minHrv: 31, skin: 38.1, twl: 104, temp: 43.2, noise: 84, risk: 78 }, // Peak Acute Strain: TWL & HRV drop
  { dayOffset: 14, hr: 89, peakHr: 122, hrv: 46, minHrv: 33, skin: 37.9, twl: 108, temp: 42.4, noise: 83, risk: 72 }, // Breach: TWL < 115, HRV < 40
  { dayOffset: 13, hr: 86, peakHr: 117, hrv: 50, minHrv: 37, skin: 37.6, twl: 114, temp: 40.5, noise: 82, risk: 62 }, // Breach: TWL < 115
  { dayOffset: 12, hr: 83, peakHr: 110, hrv: 54, minHrv: 41, skin: 37.2, twl: 126, temp: 38.6, noise: 80, risk: 49 },
  { dayOffset: 11, hr: 74, peakHr: 92, hrv: 63, minHrv: 51, skin: 36.5, twl: 154, temp: 35.0, noise: 68, risk: 27 }, // Weekend
  { dayOffset: 10, hr: 75, peakHr: 94, hrv: 62, minHrv: 49, skin: 36.6, twl: 150, temp: 35.8, noise: 70, risk: 30 }, // Weekend

  // Days 20-25 (Post-Intervention: Active Misting & Hydration Recovery)
  { dayOffset: 9, hr: 79, peakHr: 105, hrv: 59, minHrv: 45, skin: 37.0, twl: 138, temp: 37.2, noise: 78, risk: 41 },
  { dayOffset: 8, hr: 77, peakHr: 102, hrv: 62, minHrv: 48, skin: 36.8, twl: 145, temp: 35.8, noise: 77, risk: 35 },
  { dayOffset: 7, hr: 75, peakHr: 98, hrv: 64, minHrv: 51, skin: 36.6, twl: 152, temp: 34.5, noise: 75, risk: 30 },
  { dayOffset: 6, hr: 74, peakHr: 96, hrv: 66, minHrv: 53, skin: 36.4, twl: 158, temp: 33.6, noise: 74, risk: 26 },
  { dayOffset: 5, hr: 73, peakHr: 93, hrv: 67, minHrv: 54, skin: 36.3, twl: 162, temp: 32.8, noise: 73, risk: 24 },
  { dayOffset: 4, hr: 70, peakHr: 86, hrv: 71, minHrv: 60, skin: 36.1, twl: 174, temp: 30.5, noise: 67, risk: 18 }, // Weekend
  { dayOffset: 3, hr: 70, peakHr: 87, hrv: 70, minHrv: 59, skin: 36.2, twl: 172, temp: 31.0, noise: 68, risk: 19 }, // Weekend

  // Days 26-29 (Recent 4 Days including today)
  { dayOffset: 2, hr: 76, peakHr: 101, hrv: 63, minHrv: 47, skin: 36.7, twl: 148, temp: 34.8, noise: 76, risk: 33 },
  { dayOffset: 1, hr: 78, peakHr: 105, hrv: 60, minHrv: 44, skin: 36.9, twl: 140, temp: 36.0, noise: 77, risk: 39 },
  { dayOffset: 0, hr: 80, peakHr: 109, hrv: 57, minHrv: 41, skin: 37.1, twl: 135, temp: 37.5, noise: 78, risk: 45 } // Today
];

/**
 * Generates 30 days of workforce health metrics trend data for the line chart
 */
export function generate30DayWorkforceHealthMetrics(
  selectedZone?: FacilityZone,
  thresholds?: HealthSignalNotificationThresholds
): {
  data: WorkforceHealth30DayDataPoint[];
  summary: WorkforceHealth30DaySummary;
} {
  const minHrvThreshold = thresholds?.minHrvMs ?? 40;
  const minTwlThreshold = thresholds?.minTwlIndex ?? 115;
  const maxHrThreshold = thresholds?.maxHeartRateBpm ?? 115;
  const maxSkinThreshold = thresholds?.maxSkinTempC ?? 37.8;
  const minHealthScoreThreshold = 65;

  const baseDate = new Date();
  const zoneMultiplier = selectedZone?.id === 'Outdoor-Construction-Sector-4' ? 1.08 : selectedZone?.id === 'Warehouse-Logistics-Hub-North' ? 0.96 : 1.0;

  let sumHrv = 0;
  let minHrvOverall = Infinity;
  let sumHr = 0;
  let peakHrOverall = 0;
  let sumSkin = 0;
  let sumTwl = 0;
  let sumHealthScore = 0;
  let daysWithDrops = 0;
  let hrvBreachCount = 0;
  let twlBreachCount = 0;
  let healthScoreBreachCount = 0;

  let mostStrained = {
    date: '',
    reason: '',
    hrv: 100,
    twl: 200,
    risk: 0
  };

  const data: WorkforceHealth30DayDataPoint[] = BASE_30D_HEALTH_PATTERNS.map((entry, idx) => {
    const dayDate = new Date(baseDate.getTime() - entry.dayOffset * 86400000);
    const dateFormatted = dayDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const fullDateIso = dayDate.toISOString().slice(0, 10);
    const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
    const isHeatwave = entry.dayOffset >= 13 && entry.dayOffset <= 16;

    // Apply zone microclimate modifier
    const avgHr = Math.round(entry.hr * (isWeekend ? 0.95 : zoneMultiplier));
    const peakHr = Math.round(entry.peakHr * (isWeekend ? 0.94 : zoneMultiplier));
    const avgHrv = Number((entry.hrv * (zoneMultiplier > 1 ? 0.94 : 1.02)).toFixed(1));
    const minHrv = Number((entry.minHrv * (zoneMultiplier > 1 ? 0.92 : 1.0)).toFixed(1));
    const avgSkin = Number((entry.skin + (zoneMultiplier > 1 ? 0.2 : 0)).toFixed(1));
    const twl = Math.round(entry.twl * (zoneMultiplier > 1 ? 0.94 : 1.04));
    const risk = Number(Math.min(100, entry.risk * zoneMultiplier).toFixed(1));

    // Physiological Homeostasis / Health Safety Index Score (0-100%)
    // Drops when HRV is depleted, TWL is low, or risk is elevated
    const healthSafetyScore = Math.round(
      Math.max(
        35,
        Math.min(
          98,
          100 -
            risk * 0.45 -
            Math.max(0, 65 - avgHrv) * 0.7 -
            Math.max(0, 130 - twl) * 0.2 -
            (avgSkin > 37.2 ? (avgSkin - 37.2) * 18 : 0)
        )
      )
    );

    // Identify threshold drops
    const hrvDrop = minHrv < minHrvThreshold || avgHrv < minHrvThreshold + 8;
    const twlDrop = twl < minTwlThreshold;
    const healthScoreDrop = healthSafetyScore < minHealthScoreThreshold;
    const hrCeilingBreach = peakHr >= maxHrThreshold;
    const skinCeilingBreach = avgSkin >= maxSkinThreshold;

    const hasThresholdDrop = hrvDrop || twlDrop || healthScoreDrop || hrCeilingBreach || skinCeilingBreach;

    let thresholdDropReason: string | undefined;
    if (hrvDrop && twlDrop) {
      thresholdDropReason = `Severe Drop: HRV fell to ${minHrv}ms (<${minHrvThreshold}ms floor) & TWL dropped to ${twl} W/m² (<${minTwlThreshold})`;
    } else if (hrvDrop) {
      thresholdDropReason = `Autonomic Fatigue: Min HRV collapsed to ${minHrv}ms (Below ${minHrvThreshold}ms safety threshold)`;
    } else if (twlDrop) {
      thresholdDropReason = `Thermal Hazard: TWL dropped to ${twl} W/m² (Below ${minTwlThreshold} W/m² work limit)`;
    } else if (healthScoreDrop) {
      thresholdDropReason = `Workforce Health Index dropped to ${healthSafetyScore}% (Below ${minHealthScoreThreshold}% safe homeostasis)`;
    } else if (hrCeilingBreach) {
      thresholdDropReason = `Peak Heart Rate reached ${peakHr} BPM (Exceeded ${maxHrThreshold} BPM safety ceiling)`;
    }

    if (hasThresholdDrop) {
      daysWithDrops++;
      if (hrvDrop) hrvBreachCount++;
      if (twlDrop) twlBreachCount++;
      if (healthScoreDrop) healthScoreBreachCount++;
    }

    sumHrv += avgHrv;
    if (minHrv < minHrvOverall) minHrvOverall = minHrv;
    sumHr += avgHr;
    if (peakHr > peakHrOverall) peakHrOverall = peakHr;
    sumSkin += avgSkin;
    sumTwl += twl;
    sumHealthScore += healthSafetyScore;

    if (risk > mostStrained.risk) {
      mostStrained = {
        date: `${dateFormatted} (${dayOfWeek})`,
        reason: thresholdDropReason || 'Peak Composite Anomaly Risk',
        hrv: avgHrv,
        twl,
        risk
      };
    }

    return {
      dayIndex: idx,
      date: dateFormatted,
      fullDate: fullDateIso,
      dayOfWeek,
      avgHeartRate: avgHr,
      peakHeartRate: peakHr,
      avgHrv,
      minHrv,
      avgSkinTemp: avgSkin,
      thermalWorkLimit: twl,
      healthSafetyScore,
      riskScore: risk,
      ambientTemp: entry.temp,
      acousticNoise: entry.noise,
      isWeekend,
      isHeatwave,
      hasThresholdDrop,
      thresholdDropReason
    };
  });

  const count = data.length || 1;
  const summary: WorkforceHealth30DaySummary = {
    meanHrvMs: Number((sumHrv / count).toFixed(1)),
    minHrvRecordedMs: minHrvOverall,
    meanHeartRateBpm: Number((sumHr / count).toFixed(0)),
    peakHeartRateBpm: peakHrOverall,
    meanSkinTempC: Number((sumSkin / count).toFixed(1)),
    meanThermalWorkLimit: Number((sumTwl / count).toFixed(0)),
    meanHealthSafetyScore: Number((sumHealthScore / count).toFixed(0)),
    daysWithThresholdDrops: daysWithDrops,
    hrvBreachDaysCount: hrvBreachCount,
    twlBreachDaysCount: twlBreachCount,
    healthSafetyBreachDaysCount: healthScoreBreachCount,
    mostStrainedDay: mostStrained
  };

  return { data, summary };
}

/**
 * Generates workforce health metrics trend data for any given timeframe or date range
 */
export function generateWorkforceHealthMetricsForRange(
  selectedZone?: FacilityZone,
  thresholds?: HealthSignalNotificationThresholds,
  daysSpan: number = 30,
  startDateStr?: string,
  endDateStr?: string
): {
  data: WorkforceHealth30DayDataPoint[];
  summary: WorkforceHealth30DaySummary;
} {
  const minHrvThreshold = thresholds?.minHrvMs ?? 40;
  const minTwlThreshold = thresholds?.minTwlIndex ?? 115;
  const maxHrThreshold = thresholds?.maxHeartRateBpm ?? 115;
  const maxSkinThreshold = thresholds?.maxSkinTempC ?? 37.8;
  const minHealthScoreThreshold = 65;

  const baseDate = endDateStr ? new Date(endDateStr + 'T23:59:59') : new Date();
  const zoneMultiplier =
    selectedZone?.id === 'Outdoor-Construction-Sector-4'
      ? 1.08
      : selectedZone?.id === 'Warehouse-Logistics-Hub-North'
      ? 0.96
      : 1.0;

  let totalDays = Math.max(1, daysSpan);
  if (startDateStr && endDateStr) {
    const s = new Date(startDateStr + 'T00:00:00');
    const e = new Date(endDateStr + 'T00:00:00');
    const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    if (diff > 0 && diff <= 180) totalDays = diff;
  }

  // Construct daily patterns for totalDays
  const patterns = [];
  for (let offset = totalDays - 1; offset >= 0; offset--) {
    const baseIndex = offset % 30;
    const baseEntry = BASE_30D_HEALTH_PATTERNS[baseIndex] || BASE_30D_HEALTH_PATTERNS[0];
    const cycleWave = Math.sin((offset / 14) * Math.PI) * 2;
    patterns.push({
      dayOffset: offset,
      hr: Math.round(baseEntry.hr + cycleWave),
      peakHr: Math.round(baseEntry.peakHr + cycleWave * 1.2),
      hrv: Number((baseEntry.hrv - cycleWave * 0.8).toFixed(1)),
      minHrv: Number((baseEntry.minHrv - cycleWave * 0.9).toFixed(1)),
      skin: Number((baseEntry.skin + cycleWave * 0.05).toFixed(1)),
      twl: Math.round(baseEntry.twl - cycleWave * 2),
      temp: Number((baseEntry.temp + cycleWave * 0.4).toFixed(1)),
      noise: baseEntry.noise,
      risk: Math.max(10, Math.min(95, Math.round(baseEntry.risk + cycleWave * 1.5)))
    });
  }

  let sumHrv = 0;
  let minHrvOverall = Infinity;
  let sumHr = 0;
  let peakHrOverall = 0;
  let sumSkin = 0;
  let sumTwl = 0;
  let sumHealthScore = 0;
  let daysWithDrops = 0;
  let hrvBreachCount = 0;
  let twlBreachCount = 0;
  let healthScoreBreachCount = 0;

  let mostStrained = {
    date: '',
    reason: '',
    hrv: 100,
    twl: 200,
    risk: 0
  };

  const data: WorkforceHealth30DayDataPoint[] = patterns.map((entry, idx) => {
    const dayDate = new Date(baseDate.getTime() - entry.dayOffset * 86400000);
    const dateFormatted = dayDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const fullDateIso = dayDate.toISOString().slice(0, 10);
    const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
    const isHeatwave = entry.dayOffset >= 13 && entry.dayOffset <= 16;

    const avgHr = Math.round(entry.hr * (isWeekend ? 0.95 : zoneMultiplier));
    const peakHr = Math.round(entry.peakHr * (isWeekend ? 0.94 : zoneMultiplier));
    const avgHrv = Number((entry.hrv * (zoneMultiplier > 1 ? 0.94 : 1.02)).toFixed(1));
    const minHrv = Number((entry.minHrv * (zoneMultiplier > 1 ? 0.92 : 1.0)).toFixed(1));
    const avgSkin = Number((entry.skin + (zoneMultiplier > 1 ? 0.2 : 0)).toFixed(1));
    const twl = Math.round(entry.twl * (zoneMultiplier > 1 ? 0.94 : 1.04));
    const risk = Number(Math.min(100, entry.risk * zoneMultiplier).toFixed(1));

    const healthSafetyScore = Math.round(
      Math.max(
        35,
        Math.min(
          98,
          100 -
            risk * 0.45 -
            Math.max(0, 65 - avgHrv) * 0.7 -
            Math.max(0, 130 - twl) * 0.2 -
            (avgSkin > 37.2 ? (avgSkin - 37.2) * 18 : 0)
        )
      )
    );

    const hrvDrop = minHrv < minHrvThreshold || avgHrv < minHrvThreshold + 8;
    const twlDrop = twl < minTwlThreshold;
    const healthScoreDrop = healthSafetyScore < minHealthScoreThreshold;
    const hrCeilingBreach = peakHr >= maxHrThreshold;
    const skinCeilingBreach = avgSkin >= maxSkinThreshold;

    const hasThresholdDrop = hrvDrop || twlDrop || healthScoreDrop || hrCeilingBreach || skinCeilingBreach;

    let thresholdDropReason: string | undefined;
    if (hrvDrop && twlDrop) {
      thresholdDropReason = `Severe Drop: HRV fell to ${minHrv}ms (<${minHrvThreshold}ms floor) & TWL dropped to ${twl} W/m² (<${minTwlThreshold})`;
    } else if (hrvDrop) {
      thresholdDropReason = `Autonomic Fatigue: Min HRV collapsed to ${minHrv}ms (Below ${minHrvThreshold}ms safety threshold)`;
    } else if (twlDrop) {
      thresholdDropReason = `Thermal Hazard: TWL dropped to ${twl} W/m² (Below ${minTwlThreshold} W/m² work limit)`;
    } else if (healthScoreDrop) {
      thresholdDropReason = `Workforce Health Index dropped to ${healthSafetyScore}% (Below ${minHealthScoreThreshold}% safe homeostasis)`;
    } else if (hrCeilingBreach) {
      thresholdDropReason = `Peak Heart Rate reached ${peakHr} BPM (Exceeded ${maxHrThreshold} BPM safety ceiling)`;
    }

    if (hasThresholdDrop) {
      daysWithDrops++;
      if (hrvDrop) hrvBreachCount++;
      if (twlDrop) twlBreachCount++;
      if (healthScoreDrop) healthScoreBreachCount++;
    }

    sumHrv += avgHrv;
    if (minHrv < minHrvOverall) minHrvOverall = minHrv;
    sumHr += avgHr;
    if (peakHr > peakHrOverall) peakHrOverall = peakHr;
    sumSkin += avgSkin;
    sumTwl += twl;
    sumHealthScore += healthSafetyScore;

    if (risk > mostStrained.risk) {
      mostStrained = {
        date: `${dateFormatted} (${dayOfWeek})`,
        reason: thresholdDropReason || 'Peak Composite Anomaly Risk',
        hrv: avgHrv,
        twl,
        risk
      };
    }

    return {
      dayIndex: idx,
      date: dateFormatted,
      fullDate: fullDateIso,
      dayOfWeek,
      avgHeartRate: avgHr,
      peakHeartRate: peakHr,
      avgHrv,
      minHrv,
      avgSkinTemp: avgSkin,
      thermalWorkLimit: twl,
      healthSafetyScore,
      riskScore: risk,
      ambientTemp: entry.temp,
      acousticNoise: entry.noise,
      isWeekend,
      isHeatwave,
      hasThresholdDrop,
      thresholdDropReason
    };
  });

  const count = data.length || 1;
  const summary: WorkforceHealth30DaySummary = {
    meanHrvMs: Number((sumHrv / count).toFixed(1)),
    minHrvRecordedMs: minHrvOverall === Infinity ? 40 : minHrvOverall,
    meanHeartRateBpm: Number((sumHr / count).toFixed(0)),
    peakHeartRateBpm: peakHrOverall,
    meanSkinTempC: Number((sumSkin / count).toFixed(1)),
    meanThermalWorkLimit: Number((sumTwl / count).toFixed(0)),
    meanHealthSafetyScore: Number((sumHealthScore / count).toFixed(0)),
    daysWithThresholdDrops: daysWithDrops,
    hrvBreachDaysCount: hrvBreachCount,
    twlBreachDaysCount: twlBreachCount,
    healthSafetyBreachDaysCount: healthScoreBreachCount,
    mostStrainedDay: mostStrained
  };

  return { data, summary };
}

