import type { Sensor, AlertEvent, ThreatStage } from '@/types';
import { CATEGORY_META } from '@/types';
import ThreatIndicator from '@/components/ThreatIndicator';
import GlacierMap from '@/components/GlacierMap';
import Sparkline from '@/components/Sparkline';
import { Activity, Radio, Battery, AlertTriangle, TrendingUp, Gauge } from 'lucide-react';

interface OverviewProps {
  sensors: Sensor[];
  alerts: AlertEvent[];
  threatStage: ThreatStage;
  timeToFailure: number | null;
  onSelectSensor: (id: string) => void;
  selectedSensorId?: string;
  onNavigate: (view: 'overview' | 'sensors' | 'analytics' | 'alerts') => void;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  sublabel,
  color = '#38bdf8',
  sparkData,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  color?: string;
  sparkData?: { timestamp: number; value: number }[];
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon size={16} />
          </div>
          <span className="text-xs font-medium text-slate-500">{label}</span>
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-slate-100">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {sublabel && <div className="mt-1 text-[10px] text-slate-600">{sublabel}</div>}
      {sparkData && sparkData.length > 2 && (
        <div className="mt-2">
          <Sparkline data={sparkData} color={color} height={28} fill />
        </div>
      )}
    </div>
  );
}

export default function Overview({
  sensors,
  alerts,
  threatStage,
  timeToFailure,
  onSelectSensor,
  selectedSensorId,
  onNavigate,
}: OverviewProps) {
  const online = sensors.filter((s) => s.status === 'online').length;
  const degraded = sensors.filter((s) => s.status === 'degraded').length;
  const offline = sensors.filter((s) => s.status === 'offline').length;
  const unackAlerts = alerts.filter((a) => !a.acknowledged && a.stage > 0).length;

  // Aggregate metrics
  const avgBattery = (sensors.reduce((sum, s) => sum + s.battery, 0) / sensors.length).toFixed(0);
  const avgSignal = (sensors.reduce((sum, s) => sum + s.signalStrength, 0) / sensors.length).toFixed(0);

  const kinematic = sensors.filter((s) => s.category === 'kinematic');
  const hydrological = sensors.filter((s) => s.category === 'hydrological');
  const acoustic = sensors.filter((s) => s.category === 'acoustic');

  const avgKinematic = kinematic.reduce((sum, s) => sum + s.currentValue, 0) / kinematic.length;
  const avgHydro = hydrological.reduce((sum, s) => sum + s.currentValue, 0) / hydrological.length;
  const avgAcoustic = acoustic.reduce((sum, s) => sum + s.currentValue, 0) / acoustic.length;

  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Threat indicator */}
      <ThreatIndicator stage={threatStage} timeToFailure={timeToFailure} />

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Radio}
          label="Active Sensors"
          value={`${online + degraded}/${sensors.length}`}
          sublabel={`${degraded} degraded · ${offline} offline`}
          color="#38bdf8"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={unackAlerts}
          sublabel={unackAlerts > 0 ? 'Unacknowledged' : 'All clear'}
          color={unackAlerts > 0 ? '#ef4444' : '#22c55e'}
        />
        <MetricCard
          icon={Battery}
          label="Avg Battery"
          value={avgBattery}
          unit="%"
          sublabel="Network power reserve"
          color="#22c55e"
        />
        <MetricCard
          icon={Activity}
          label="Mesh Signal"
          value={avgSignal}
          unit="%"
          sublabel="LoRaWAN + SAT uplink"
          color="#22d3ee"
        />
      </div>

      {/* Map + category summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Glacier Sensor Network — Real-time Topology</h3>
            <button
              onClick={() => onNavigate('sensors')}
              className="text-xs font-medium text-ice-400 hover:text-ice-300"
            >
              View all sensors →
            </button>
          </div>
          <GlacierMap
            sensors={sensors}
            threatStage={threatStage}
            onSelectSensor={onSelectSensor}
            selectedId={selectedSensorId}
          />
        </div>

        {/* Data fusion category summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Multi-Modal Data Fusion</h3>
          {[
            { sensors: kinematic, avg: avgKinematic, label: 'Kinematic & Structural', icon: Activity, cat: 'kinematic' as const },
            { sensors: hydrological, avg: avgHydro, label: 'Hydrological', icon: Gauge, cat: 'hydrological' as const },
            { sensors: acoustic, avg: avgAcoustic, label: 'Acoustic & Infrasound', icon: TrendingUp, cat: 'acoustic' as const },
          ].map(({ sensors: catSensors, avg, label, icon: Icon, cat }) => {
            const catMeta = CATEGORY_META[cat];
            const last = catSensors[0];
            return (
              <div key={cat} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${catMeta.accent}15`, color: catMeta.accent }}
                  >
                    <Icon size={14} />
                  </div>
                  <span className="text-xs font-medium text-slate-400">{label}</span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-lg font-bold" style={{ color: catMeta.accent }}>
                      {avg.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-600">{catSensors.length} sensors · avg</div>
                  </div>
                  <div className="h-10 w-24">
                    {last && (
                      <Sparkline
                        data={catSensors.flatMap((s) => s.history.slice(-20)).sort((a, b) => a.timestamp - b.timestamp)}
                        color={catMeta.accent}
                        height={40}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent alerts feed */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Recent Activity</h3>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-xs font-medium text-ice-400 hover:text-ice-300"
          >
            View all alerts →
          </button>
        </div>
        <div className="space-y-2">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 ${
                !alert.acknowledged && alert.stage > 0 ? 'border-l-2 border-l-amber-500/50' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  alert.stage === 3
                    ? 'bg-red-500/15 text-red-400'
                    : alert.stage >= 1
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-slate-700/20 text-slate-400'
                }`}
              >
                <AlertTriangle size={14} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-300">{alert.message}</div>
                <div className="text-[10px] text-slate-600">
                  {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
                  {alert.acknowledged && ' · Acknowledged'}
                </div>
              </div>
              {alert.stage > 0 && !alert.acknowledged && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  STAGE {alert.stage}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
