import type { SensorReading } from '@/types';

interface SparklineProps {
  data: SensorReading[];
  color?: string;
  height?: number;
  strokeWidth?: number;
  fill?: boolean;
  threshold?: number;
}

export default function Sparkline({
  data,
  color = '#38bdf8',
  height = 40,
  strokeWidth = 1.5,
  fill = true,
  threshold,
}: SparklineProps) {
  if (data.length < 2) return <div style={{ height }} />;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100;
  const stepX = width / (data.length - 1);

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d.value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  let thresholdY: number | null = null;
  if (threshold !== undefined && threshold >= min && threshold <= max) {
    thresholdY = height - ((threshold - min) / range) * (height - 4) - 2;
  }

  const gradientId = `spark-${color.replace('#', '')}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={fillD} fill={`url(#${gradientId})`} />}
      {thresholdY !== null && (
        <line
          x1="0"
          y1={thresholdY}
          x2={width}
          y2={thresholdY}
          stroke={color}
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.4"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
