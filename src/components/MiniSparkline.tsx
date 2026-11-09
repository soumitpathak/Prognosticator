import React, { useId, useMemo, useState } from 'react';

export interface MiniSparklineProps {
  data: number[];
  color?: string; // hex or CSS color
  height?: number;
  width?: number | string;
  unit?: string;
  baselineValue?: number;
  showMinMax?: boolean;
  showCurrentDot?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
  className?: string;
  ariaLabel?: string;
  showForecast?: boolean; // 7-day predictive forecast using simple linear regression
  forecastDays?: number; // default: 7
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  forecastPoints: number[];
  deltaPct: number;
}

/**
 * Calculates a simple linear regression model (y = m*x + b) on historical series
 * and projects forward N steps (7-day predictive forecast).
 * Thoroughly handles edge cases: null/undefined, NaN, Infinity, single points, and flat lines.
 */
export function calculateLinearRegression(points: number[] | null | undefined, steps: number = 7): LinearRegressionResult {
  const safeSteps = Math.max(1, typeof steps === 'number' && !isNaN(steps) && isFinite(steps) ? Math.floor(steps) : 7);
  
  if (!points || !Array.isArray(points) || points.length === 0) {
    return {
      slope: 0,
      intercept: 0,
      r2: 1,
      forecastPoints: Array(safeSteps).fill(0),
      deltaPct: 0
    };
  }

  // Sanitize points to ensure pure finite numeric elements
  const cleanPoints = points.map((v) =>
    typeof v === 'number' && !isNaN(v) && isFinite(v) ? v : 0
  );

  const n = cleanPoints.length;
  if (n < 2) {
    const val = Number((cleanPoints[0] || 0).toFixed(1));
    return {
      slope: 0,
      intercept: val,
      r2: 1,
      forecastPoints: Array(safeSteps).fill(val),
      deltaPct: 0
    };
  }

  // Check if all values are identical (flat line)
  const firstVal = cleanPoints[0];
  const isFlat = cleanPoints.every((val) => Math.abs(val - firstVal) < 1e-9);
  if (isFlat) {
    const val = Number(firstVal.toFixed(1));
    return {
      slope: 0,
      intercept: val,
      r2: 1,
      forecastPoints: Array(safeSteps).fill(val),
      deltaPct: 0
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = cleanPoints[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Goodness of fit (R^2)
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const fit = slope * i + intercept;
    ssTot += Math.pow(cleanPoints[i] - meanY, 2);
    ssRes += Math.pow(cleanPoints[i] - fit, 2);
  }
  const r2 = ssTot > 1e-9 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 1;

  // Project future steps (Day +1 through Day +N)
  const lastVal = cleanPoints[n - 1];
  const allPositive = cleanPoints.every((p) => p >= 0);
  const forecastPoints: number[] = [];

  for (let s = 1; s <= safeSteps; s++) {
    const predX = n - 1 + s;
    let predY = slope * predX + intercept;
    if (allPositive) {
      predY = Math.max(0, predY);
    }
    forecastPoints.push(Number(predY.toFixed(1)));
  }

  const finalForecast = forecastPoints[forecastPoints.length - 1] ?? lastVal;
  let deltaPct = 0;
  if (Math.abs(lastVal) > 1e-6) {
    deltaPct = Number((((finalForecast - lastVal) / Math.abs(lastVal)) * 100).toFixed(1));
  } else if (finalForecast > 0) {
    deltaPct = 100;
  } else if (finalForecast < 0) {
    deltaPct = -100;
  }

  return {
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(2)),
    r2: Number(r2.toFixed(3)),
    forecastPoints,
    deltaPct
  };
}

/**
 * Compact, lightweight SVG Mini-Sparkline Component
 * Renders 24-hour time series trajectory for primary health signals with smooth
 * cubic bezier curves, gradient fills, and an extended 7-day predictive forecast
 * generated via an Ordinary Least Squares (OLS) linear regression model.
 */
export default function MiniSparkline({
  data,
  color = '#06b6d4',
  height = 36,
  width = '100%',
  unit = '',
  baselineValue,
  showMinMax = false,
  showCurrentDot = true,
  strokeWidth = 1.75,
  fillOpacity = 0.22,
  className = '',
  ariaLabel,
  showForecast = true,
  forecastDays = 7
}: MiniSparklineProps) {
  const gradientId = useId();
  const forecastGradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<{ type: 'historical' | 'forecast'; idx: number } | null>(
    null
  );
  const [isForecastToggled, setIsForecastToggled] = useState<boolean>(true);

  // Active forecast display state
  const activeForecast = showForecast && isForecastToggled;

  // Normalize historical data points with edge-case protection
  const points = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [0];
    const clean = data.map((v) => (typeof v === 'number' && !isNaN(v) && isFinite(v) ? v : 0));
    return clean.length > 0 ? clean : [0];
  }, [data]);

  // Compute 7-day linear regression forecast
  const regression = useMemo(() => {
    return calculateLinearRegression(points, forecastDays);
  }, [points, forecastDays]);

  // Unified min/max across historical and forecast points
  const combinedPoints = useMemo(() => {
    if (!activeForecast) return points;
    return [...points, ...regression.forecastPoints];
  }, [points, activeForecast, regression.forecastPoints]);

  const min = Math.min(...combinedPoints);
  const max = Math.max(...combinedPoints);
  const range = max - min || 1;

  const latestValue = points[points.length - 1];
  const firstValue = points[0];
  const trendDelta = Number((latestValue - firstValue).toFixed(1));
  const isRising = trendDelta > 0;

  // Viewbox coordinates
  // When forecast is active, we expand width to 140 to give 65% to historical and 35% to 7-day forecast
  const svgWidth = activeForecast ? 140 : 120;
  const svgHeight = 40;
  const padTop = 4;
  const padBottom = 4;
  const drawHeight = svgHeight - padTop - padBottom;

  // Historical segment width and forecast boundary
  const historicalWidth = activeForecast ? 92 : svgWidth;
  const forecastStartX = historicalWidth;
  const forecastEndX = svgWidth - 4;

  // Coordinates for historical SVG path
  const historicalCoords = useMemo(() => {
    const step = points.length > 1 ? historicalWidth / (points.length - 1) : historicalWidth;
    return points.map((val, idx) => {
      const x = idx * step;
      const normalized = (val - min) / range;
      const y = padTop + (1 - normalized) * drawHeight;
      return { x, y, val };
    });
  }, [points, min, range, drawHeight, padTop, historicalWidth]);

  // Coordinates for 7-day linear regression forecast path
  const forecastCoords = useMemo(() => {
    if (!activeForecast || regression.forecastPoints.length === 0) return [];
    const step = (forecastEndX - forecastStartX) / regression.forecastPoints.length;
    return regression.forecastPoints.map((val, idx) => {
      const x = forecastStartX + (idx + 1) * step;
      const normalized = (val - min) / range;
      const y = padTop + (1 - normalized) * drawHeight;
      return { x, y, val, day: idx + 1 };
    });
  }, [activeForecast, regression.forecastPoints, forecastStartX, forecastEndX, min, range, drawHeight, padTop]);

  // Historical cubic bezier SVG line path
  const linePath = useMemo(() => {
    if (historicalCoords.length === 0) return '';
    if (historicalCoords.length === 1) return `M 0,${historicalCoords[0].y} L ${historicalWidth},${historicalCoords[0].y}`;

    let path = `M ${historicalCoords[0].x.toFixed(1)},${historicalCoords[0].y.toFixed(1)}`;
    for (let i = 0; i < historicalCoords.length - 1; i++) {
      const curr = historicalCoords[i];
      const next = historicalCoords[i + 1];
      const cpX = (curr.x + next.x) / 2;
      path += ` C ${cpX.toFixed(1)},${curr.y.toFixed(1)} ${cpX.toFixed(1)},${next.y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
    }
    return path;
  }, [historicalCoords, historicalWidth]);

  // Closed area path for historical gradient fill
  const areaPath = useMemo(() => {
    if (!linePath || historicalCoords.length === 0) return '';
    const lastX = historicalCoords[historicalCoords.length - 1].x;
    return `${linePath} L ${lastX.toFixed(1)},${svgHeight} L 0,${svgHeight} Z`;
  }, [linePath, historicalCoords, svgHeight]);

  // 7-day forecast line path starting seamlessly from the last historical coordinate
  const forecastLinePath = useMemo(() => {
    if (!activeForecast || forecastCoords.length === 0 || historicalCoords.length === 0) return '';
    const lastHist = historicalCoords[historicalCoords.length - 1];
    let path = `M ${lastHist.x.toFixed(1)},${lastHist.y.toFixed(1)}`;

    for (let i = 0; i < forecastCoords.length; i++) {
      const pt = forecastCoords[i];
      path += ` L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }
    return path;
  }, [activeForecast, forecastCoords, historicalCoords]);

  // Baseline Y coordinate if provided
  const baselineY = useMemo(() => {
    if (baselineValue === undefined) return null;
    const normalized = Math.max(0, Math.min(1, (baselineValue - min) / range));
    return padTop + (1 - normalized) * drawHeight;
  }, [baselineValue, min, range, drawHeight, padTop]);

  const lastHistCoord = historicalCoords[historicalCoords.length - 1] || { x: historicalWidth, y: svgHeight / 2 };
  const lastForecastCoord = forecastCoords[forecastCoords.length - 1];

  // Current active hover point
  const activeHoverPoint = useMemo(() => {
    if (!hoverIndex) return null;
    if (hoverIndex.type === 'historical') {
      const pt = historicalCoords[hoverIndex.idx];
      return pt ? { ...pt, label: `${pt.val.toFixed(1)}${unit}`, sub: `${historicalCoords.length - 1 - hoverIndex.idx}h ago` } : null;
    } else {
      const pt = forecastCoords[hoverIndex.idx];
      return pt
        ? {
            ...pt,
            label: `Day +${pt.day}: ${pt.val.toFixed(1)}${unit}`,
            sub: `7D Linear Forecast (${regression.deltaPct >= 0 ? '+' : ''}${regression.deltaPct}%)`
          }
        : null;
    }
  }, [hoverIndex, historicalCoords, forecastCoords, unit, regression.deltaPct]);

  return (
    <div
      className={`relative inline-flex flex-col group select-none ${className}`}
      style={{ width }}
      role="img"
      aria-label={
        ariaLabel ||
        `24-hour trend sparkline with 7-day linear forecast: current ${latestValue}${unit}, 7d projected ${regression.forecastPoints[regression.forecastPoints.length - 1] || latestValue}${unit}`
      }
    >
      <div style={{ height }} className="w-full relative overflow-visible">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Historical Area Gradient */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
              <stop offset="90%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>

            {/* 7-Day Forecast Tint Gradient */}
            <linearGradient id={forecastGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Baseline reference line */}
          {baselineY !== null && (
            <line
              x1="0"
              y1={baselineY}
              x2={svgWidth}
              y2={baselineY}
              stroke="currentColor"
              strokeDasharray="2 2"
              className="text-slate-600 opacity-60"
              strokeWidth="0.8"
            />
          )}

          {/* Forecast zone background tint */}
          {activeForecast && (
            <rect
              x={forecastStartX}
              y={0}
              width={svgWidth - forecastStartX}
              height={svgHeight}
              fill="rgba(6, 182, 212, 0.03)"
              className="pointer-events-none"
            />
          )}

          {/* Historical Area fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Historical Line stroke (Solid) */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 7-Day Predictive Forecast Line (Dashed OLS Linear Regression) */}
          {activeForecast && forecastLinePath && (
            <path
              d={forecastLinePath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray="3 2"
              strokeOpacity={0.85}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Vertical Divider Line between Historical and 7-Day Forecast ("Now") */}
          {activeForecast && (
            <line
              x1={forecastStartX}
              y1={padTop}
              x2={forecastStartX}
              y2={svgHeight - padBottom}
              stroke="currentColor"
              strokeDasharray="1.5 1.5"
              className="text-slate-600 opacity-70"
              strokeWidth="0.75"
            />
          )}

          {/* End-point dot for latest reading */}
          {showCurrentDot && (
            <g>
              <circle
                cx={lastHistCoord.x}
                cy={lastHistCoord.y}
                r="2.5"
                fill={color}
                className="animate-pulse"
              />
              <circle
                cx={lastHistCoord.x}
                cy={lastHistCoord.y}
                r="1.2"
                fill="#ffffff"
              />
            </g>
          )}

          {/* 7-Day Forecast Endpoint Circle (Day +7 Target) */}
          {activeForecast && lastForecastCoord && (
            <g>
              <circle
                cx={lastForecastCoord.x}
                cy={lastForecastCoord.y}
                r="3"
                fill="none"
                stroke={color}
                strokeWidth="1.25"
                strokeDasharray="1.5 1.5"
              />
              <circle
                cx={lastForecastCoord.x}
                cy={lastForecastCoord.y}
                r="1.5"
                fill={color}
              />
            </g>
          )}

          {/* Hover indicator dot & guide line */}
          {activeHoverPoint && (
            <g>
              <line
                x1={activeHoverPoint.x}
                y1="0"
                x2={activeHoverPoint.x}
                y2={svgHeight}
                stroke="currentColor"
                strokeDasharray="1.5 1.5"
                className="text-slate-300 opacity-80"
                strokeWidth="0.8"
              />
              <circle
                cx={activeHoverPoint.x}
                cy={activeHoverPoint.y}
                r="3"
                fill={color}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </g>
          )}

          {/* Hover capture zones: Historical */}
          {historicalCoords.map((pt, i) => {
            const step = historicalCoords.length > 1 ? historicalWidth / (historicalCoords.length - 1) : historicalWidth;
            const leftX = Math.max(0, pt.x - step / 2);
            return (
              <rect
                key={`hist-${i}`}
                x={leftX}
                y={0}
                width={step}
                height={svgHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex({ type: 'historical', idx: i })}
              />
            );
          })}

          {/* Hover capture zones: 7-Day Forecast */}
          {activeForecast &&
            forecastCoords.map((pt, i) => {
              const step = (forecastEndX - forecastStartX) / forecastCoords.length;
              const leftX = pt.x - step / 2;
              return (
                <rect
                  key={`fc-${i}`}
                  x={leftX}
                  y={0}
                  width={step}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex({ type: 'forecast', idx: i })}
                />
              );
            })}
        </svg>

        {/* Hover Popover Value Badge */}
        {activeHoverPoint && (
          <div
            className="absolute top-0 transform -translate-y-full -translate-x-1/2 pointer-events-none z-30"
            style={{
              left: `${(activeHoverPoint.x / svgWidth) * 100}%`
            }}
          >
            <div className="bg-slate-950 text-slate-100 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded shadow-xl whitespace-nowrap flex flex-col items-center">
              <span className="font-bold text-cyan-300">{activeHoverPoint.label}</span>
              <span className="text-[8px] text-slate-400">{activeHoverPoint.sub}</span>
            </div>
          </div>
        )}
      </div>

      {/* Extended Min / Max / 7-Day Predictive Forecast Footer */}
      {showMinMax && (
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-0.5">
          <span>24h Min: {min.toFixed(1)}{unit}</span>
          {activeForecast ? (
            <span
              className={`font-semibold ${
                regression.deltaPct > 0 ? 'text-amber-400' : regression.deltaPct < 0 ? 'text-emerald-400' : 'text-slate-400'
              }`}
              title="7-Day Predictive Forecast calculated using Simple Linear Regression (OLS)"
            >
              7D: {regression.forecastPoints[regression.forecastPoints.length - 1]}{unit} ({regression.deltaPct >= 0 ? '+' : ''}{regression.deltaPct}%)
            </span>
          ) : (
            <span className={isRising ? 'text-amber-400' : 'text-emerald-400'}>
              {isRising ? '▲' : '▼'} {Math.abs(trendDelta).toFixed(1)}{unit}
            </span>
          )}
          <span>Max: {max.toFixed(1)}{unit}</span>
        </div>
      )}

      {/* Subtle indicator strip showing 7D linear regression status */}
      {activeForecast && !showMinMax && (
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 mt-0.5 px-0.5">
          <span>24h Base</span>
          <span className="text-cyan-400/90 font-medium">7D Linear Reg</span>
        </div>
      )}
    </div>
  );
}
