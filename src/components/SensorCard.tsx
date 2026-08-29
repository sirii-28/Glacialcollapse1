import type { Sensor } from '@/types';
import { CATEGORY_META, SENSOR_TYPE_META } from '@/types';
import * as LucideIcons from 'lucide-react';
import Sparkline from './Sparkline';

interface SensorCardProps {
  sensor: Sensor;
  onClick: () => void;
}

function getIcon(name: string): React.ComponentType<{ size?: number; className?: string }> {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  return Icon || LucideIcons.Circle;
}

export default function SensorCard({ sensor, onClick }: SensorCardProps) {
  const meta = SENSOR_TYPE_META[sensor.type];
  const catMeta = CATEGORY_META[sensor.category];
  const Icon = getIcon(meta.icon);
  const isWarning = sensor.currentValue >= sensor.warningThreshold;
  const isCritical = sensor.currentValue >= sensor.criticalThreshold;
  const isOffline = sensor.status === 'offline';
  const isDegraded = sensor.status === 'degraded';

  const accentColor = isCritical ? '#ef4444' : isWarning ? '#fbbf24' : isOffline ? '#64748b' : catMeta.accent;

  const statusBadge = isOffline
    ? { text: 'OFFLINE', color: 'text-slate-500', bg: 'bg-slate-700/20' }
    : isDegraded
      ? { text: 'DEGRADED', color: 'text-amber-400', bg: 'bg-amber-500/10' }
      : { text: 'ONLINE', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };

  return (
    <button
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-left transition-all hover:border-slate-700 hover:bg-slate-900/70"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}10`, color: accentColor }}
          >
            <Icon size={16} />
          </div>
          <div>
            <div className="font-mono text-xs font-medium text-slate-400">{sensor.id}</div>
            <div className="text-sm font-medium text-slate-200">{sensor.name}</div>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge.color} ${statusBadge.bg}`}>
          {statusBadge.text}
        </span>
      </div>

      {/* Current value + sparkline */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium text-slate-500">CURRENT</div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold" style={{ color: accentColor }}>
              {isOffline ? '—' : sensor.currentValue}
            </span>
            {!isOffline && <span className="text-xs text-slate-500">{sensor.unit}</span>}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-600">
            warn: {sensor.warningThreshold} / crit: {sensor.criticalThreshold}
          </div>
        </div>
        <div className="h-12 flex-1">
          {!isOffline && (
            <Sparkline
              data={sensor.history.slice(-30)}
              color={accentColor}
              height={48}
              threshold={sensor.warningThreshold}
            />
          )}
        </div>
      </div>

      {/* Footer: battery + signal */}
      <div className="mt-3 flex items-center gap-4 border-t border-slate-800/50 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">BAT</span>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${sensor.battery < 20 ? 'bg-red-500' : sensor.battery < 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${sensor.battery}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-slate-400">{sensor.battery.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">SIG</span>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${sensor.signalStrength < 50 ? 'bg-red-500' : sensor.signalStrength < 70 ? 'bg-amber-500' : 'bg-ice-500'}`}
              style={{ width: `${sensor.signalStrength}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-slate-400">{sensor.signalStrength}%</span>
        </div>
        <div className="ml-auto text-[10px] text-slate-600">{sensor.elevation}m</div>
      </div>
    </button>
  );
}
