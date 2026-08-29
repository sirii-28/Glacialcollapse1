import { useState, useMemo } from 'react';
import type { Sensor, SensorCategory } from '@/types';
import { CATEGORY_META, SENSOR_TYPE_META } from '@/types';
import SensorCard from '@/components/SensorCard';
import GlacierMap from '@/components/GlacierMap';
import Sparkline from '@/components/Sparkline';
import * as LucideIcons from 'lucide-react';
import { X, MapPin, Battery, Signal, Clock, Activity } from 'lucide-react';

interface SensorNetworkProps {
  sensors: Sensor[];
  threatStage: 0 | 1 | 2 | 3;
  selectedSensorId?: string;
  onSelectSensor: (id: string) => void;
}

const CATEGORIES: { key: SensorCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All Sensors' },
  { key: 'kinematic', label: 'Kinematic' },
  { key: 'hydrological', label: 'Hydrological' },
  { key: 'acoustic', label: 'Acoustic' },
  { key: 'visual', label: 'Visual' },
];

function getIcon(name: string): React.ComponentType<{ size?: number; className?: string }> {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  return Icon || LucideIcons.Circle;
}

function SensorDetail({ sensor, onClose }: { sensor: Sensor; onClose: () => void }) {
  const meta = SENSOR_TYPE_META[sensor.type];
  const catMeta = CATEGORY_META[sensor.category];
  const Icon = getIcon(meta.icon);
  const isWarning = sensor.currentValue >= sensor.warningThreshold;
  const isCritical = sensor.currentValue >= sensor.criticalThreshold;
  const accentColor = isCritical ? '#ef4444' : isWarning ? '#fbbf24' : catMeta.accent;

  // Compute rate of change
  const recent = sensor.history.slice(-10);
  const rateOfChange = recent.length >= 2
    ? ((recent[recent.length - 1].value - recent[0].value) / recent.length).toFixed(4)
    : '0';

  return (
    <div className="animate-slide-up rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl border"
            style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}10`, color: accentColor }}
          >
            <Icon size={20} />
          </div>
          <div>
            <div className="font-mono text-xs text-slate-500">{sensor.id}</div>
            <div className="text-base font-semibold text-slate-200">{sensor.name}</div>
            <div className="text-[11px] text-slate-500">{catMeta.label}</div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
          <X size={18} />
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-400">{sensor.description}</p>

      {/* Current value + trend */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-[10px] font-medium text-slate-500">CURRENT</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold" style={{ color: accentColor }}>
              {sensor.status === 'offline' ? '—' : sensor.currentValue}
            </span>
            <span className="text-xs text-slate-500">{sensor.unit}</span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-[10px] font-medium text-slate-500">RATE OF CHANGE</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-slate-300">
              {Number(rateOfChange) >= 0 ? '+' : ''}{rateOfChange}
            </span>
            <span className="text-xs text-slate-500">{sensor.unit}/s</span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-[10px] font-medium text-slate-500">STATUS</div>
          <div className="mt-1 flex items-center gap-1.5">
            {sensor.status === 'online' && <span className="text-sm font-medium text-emerald-400">Online</span>}
            {sensor.status === 'degraded' && <span className="text-sm font-medium text-amber-400">Degraded</span>}
            {sensor.status === 'offline' && <span className="text-sm font-medium text-slate-500">Offline</span>}
          </div>
        </div>
      </div>

      {/* Full history chart */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">TIME SERIES — LAST 80 READINGS</span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-amber-400/70">
              <span className="h-0.5 w-3 bg-amber-400/50" style={{ borderTop: '1px dashed' }} /> Warning
            </span>
            <span className="flex items-center gap-1 text-red-400/70">
              <span className="h-0.5 w-3 bg-red-400/50" style={{ borderTop: '1px dashed' }} /> Critical
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          {sensor.status !== 'offline' ? (
            <Sparkline
              data={sensor.history}
              color={accentColor}
              height={120}
              strokeWidth={2}
              threshold={sensor.warningThreshold}
            />
          ) : (
            <div className="flex h-[120px] items-center justify-center text-sm text-slate-600">
              Sensor offline — no data available
            </div>
          )}
        </div>
      </div>

      {/* Thresholds + telemetry */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="mb-2 text-[10px] font-medium text-slate-500">THRESHOLDS</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400">Warning</span>
              <span className="font-mono text-slate-300">{sensor.warningThreshold} {sensor.unit}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-400">Critical</span>
              <span className="font-mono text-slate-300">{sensor.criticalThreshold} {sensor.unit}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Max Range</span>
              <span className="font-mono text-slate-400">{sensor.maxValue} {sensor.unit}</span>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="mb-2 text-[10px] font-medium text-slate-500">TELEMETRY</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><MapPin size={12} /> Position</span>
              <span className="font-mono text-slate-300">{sensor.x}, {sensor.y}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><Activity size={12} /> Elevation</span>
              <span className="font-mono text-slate-300">{sensor.elevation}m</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><Battery size={12} /> Battery</span>
              <span className="font-mono text-slate-300">{sensor.battery.toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><Signal size={12} /> Signal</span>
              <span className="font-mono text-slate-300">{sensor.signalStrength}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edge processing info */}
      <div className="mt-4 rounded-lg border border-slate-800/50 bg-slate-950/30 p-3">
        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
          <Clock size={11} /> EDGE PROCESSING — ESP32 / ARM CORTEX
        </div>
        <div className="mt-1.5 text-xs text-slate-400">
          Running tinyML threshold filtering on-device. Data streamed via {sensor.signalStrength > 80 ? 'LoRaWAN mesh' : sensor.signalStrength > 40 ? 'LoRaWAN (degraded)' : 'SAT uplink'} at {sensor.status === 'online' ? 'real-time' : 'reduced'} polling frequency.
        </div>
      </div>
    </div>
  );
}

export default function SensorNetwork({ sensors, threatStage, selectedSensorId, onSelectSensor }: SensorNetworkProps) {
  const [filter, setFilter] = useState<SensorCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'online' | 'offline'>('all');

  const filtered = useMemo(() => {
    return sensors.filter((s) => {
      if (filter !== 'all' && s.category !== filter) return false;
      if (statusFilter === 'alert') return s.currentValue >= s.warningThreshold;
      if (statusFilter === 'online') return s.status === 'online';
      if (statusFilter === 'offline') return s.status !== 'online';
      return true;
    });
  }, [sensors, filter, statusFilter]);

  const selectedSensor = sensors.find((s) => s.id === selectedSensorId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: map + filters + sensor grid */}
        <div className="space-y-4 lg:col-span-2">
          <GlacierMap
            sensors={sensors}
            threatStage={threatStage}
            onSelectSensor={onSelectSensor}
            selectedId={selectedSensorId}
          />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setFilter(cat.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    filter === cat.key
                      ? 'bg-ice-500/15 text-ice-300 border border-ice-500/30'
                      : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-1.5">
              {(['all', 'alert', 'online', 'offline'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    statusFilter === s
                      ? 'bg-slate-700/50 text-slate-200 border border-slate-600'
                      : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {s === 'all' ? 'All Status' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Sensor grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((sensor) => (
              <SensorCard key={sensor.id} sensor={sensor} onClick={() => onSelectSensor(sensor.id)} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-sm text-slate-500">
                No sensors match the current filter
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="lg:col-span-1">
          {selectedSensor ? (
            <SensorDetail sensor={selectedSensor} onClose={() => onSelectSensor('')} />
          ) : (
            <div className="sticky top-6 rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/50">
                <Activity size={20} className="text-slate-600" />
              </div>
              <div className="text-sm font-medium text-slate-400">Select a sensor</div>
              <div className="mt-1 text-xs text-slate-600">
                Click any sensor on the map or in the list to view detailed telemetry, time series data, and edge processing info.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
