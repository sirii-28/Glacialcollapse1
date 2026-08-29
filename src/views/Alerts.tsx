import { useState, useCallback } from 'react';
import type { AlertEvent, ThreatStage, ResponseAction, Sensor } from '@/types';
import { THREAT_STAGE_META } from '@/types';
import { ShieldCheck, AlertTriangle, ShieldAlert, Siren, Check, Bell, Radio, Zap } from 'lucide-react';

interface AlertsViewProps {
  alerts: AlertEvent[];
  sensors: Sensor[];
  threatStage: ThreatStage;
  responseActions: ResponseAction[];
  onAcknowledge: (id: string) => void;
  onTriggerAction: (id: string) => void;
}

const STAGE_ICONS: Record<ThreatStage, typeof ShieldCheck> = {
  0: ShieldCheck,
  1: AlertTriangle,
  2: ShieldAlert,
  3: Siren,
};

const STAGE_MATRIX: { stage: ThreatStage; trigger: string; action: string; audience: string }[] = [
  {
    stage: 1,
    trigger: 'Baseline shifts in sub-glacial hydro-pressure or slight increase in seismic acoustic emissions',
    action: 'System raises polling frequency from hourly to real-time',
    audience: 'Glaciological teams & regional authorities',
  },
  {
    stage: 2,
    trigger: 'Continuous creep motion detected (> X cm/hr) alongside expanding crevasses',
    action: 'Automated notification dispatch via satellite/GSM',
    audience: 'Emergency response teams & valley infrastructure managers',
  },
  {
    stage: 3,
    trigger: 'High-g seismic signatures indicating structural shear detachment',
    action: 'Direct activation of downstream sirens, SMS broadcasts, and automated dam/road gate closures',
    audience: 'All valley personnel — full evacuation',
  },
];

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AlertsView({
  alerts,
  threatStage,
  responseActions,
  onAcknowledge,
  onTriggerAction,
}: AlertsViewProps) {
  const [filter, setFilter] = useState<'all' | 'unack' | 'stage3' | 'stage2' | 'stage1'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unack') return !a.acknowledged;
    if (filter === 'stage3') return a.stage === 3;
    if (filter === 'stage2') return a.stage === 2;
    if (filter === 'stage1') return a.stage === 1;
    return true;
  });

  const unackCount = alerts.filter((a) => !a.acknowledged).length;
  const ackAll = useCallback(() => {
    alerts.filter((a) => !a.acknowledged).forEach((a) => onAcknowledge(a.id));
  }, [alerts, onAcknowledge]);

  return (
    <div className="space-y-6">
      {/* Current threat status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {([0, 1, 2, 3] as ThreatStage[]).map((stage) => {
          const meta = THREAT_STAGE_META[stage];
          const Icon = STAGE_ICONS[stage];
          const isCurrent = threatStage === stage;
          const isPassed = threatStage > stage;
          return (
            <div
              key={stage}
              className={`relative rounded-xl border p-4 transition-all ${
                isCurrent ? `${meta.border} ${meta.bg} ${meta.glow}` : 'border-slate-800 bg-slate-900/30'
              }`}
            >
              {isCurrent && (
                <div className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute h-full w-full animate-ping rounded-full" style={{ backgroundColor: stage >= 2 ? '#ef4444' : '#fbbf24' }} />
                  <span className="h-full w-full rounded-full" style={{ backgroundColor: stage >= 2 ? '#ef4444' : '#fbbf24' }} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isCurrent ? meta.color : 'text-slate-600'} ${isCurrent ? meta.bg : 'bg-slate-800/40'}`}>
                  <Icon size={16} />
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? meta.color : isPassed ? 'text-slate-500' : 'text-slate-400'}`}>
                  {meta.label}
                </span>
              </div>
              {isCurrent && (
                <div className={`mt-2 text-[10px] font-bold ${meta.color} animate-pulse-slow`}>
                  CURRENT THREAT LEVEL
                </div>
              )}
              {isPassed && (
                <div className="mt-2 text-[10px] text-slate-600">Escalated beyond</div>
              )}
              {!isCurrent && !isPassed && stage > 0 && (
                <div className="mt-2 text-[10px] text-slate-600">Standby</div>
              )}
              {stage === 0 && !isCurrent && (
                <div className="mt-2 text-[10px] text-slate-600">All clear</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Threat matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <h3 className="text-sm font-semibold text-slate-300">Threat Level & Automated Response Matrix</h3>
        <p className="mt-1 text-xs text-slate-500">Automated escalation protocol based on multi-sensor trigger criteria</p>

        <div className="mt-4 space-y-3">
          {STAGE_MATRIX.map((entry) => {
            const meta = THREAT_STAGE_META[entry.stage];
            const Icon = STAGE_ICONS[entry.stage];
            const isAtOrBelow = threatStage >= entry.stage;

            return (
              <div
                key={entry.stage}
                className={`rounded-xl border p-4 transition-all ${
                  isAtOrBelow ? `${meta.border} ${meta.bg}` : 'border-slate-800 bg-slate-950/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isAtOrBelow ? meta.color : 'text-slate-600'} ${isAtOrBelow ? meta.bg : 'bg-slate-800/40'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isAtOrBelow ? meta.color : 'text-slate-400'}`}>
                        {meta.label}
                      </span>
                      {isAtOrBelow && entry.stage > 0 && (
                        <span className={`animate-pulse-slow rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color} ${meta.bg} border ${meta.border}`}>
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <div className="text-[10px] font-medium text-slate-500">TRIGGER CRITERIA</div>
                        <div className="mt-1 text-xs text-slate-400">{entry.trigger}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium text-slate-500">AUTOMATED ACTION</div>
                        <div className="mt-1 text-xs text-slate-400">{entry.action}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium text-slate-500">TARGET AUDIENCE</div>
                        <div className="mt-1 text-xs text-slate-400">{entry.audience}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response actions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-ice-400" />
          <h3 className="text-sm font-semibold text-slate-300">Automated Response Actions</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">System-activated responses. Manual override available for authorized operators.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {responseActions.map((action) => {
            const meta = THREAT_STAGE_META[action.stage];
            const shouldTrigger = threatStage >= action.stage;

            return (
              <div
                key={action.id}
                className={`rounded-xl border p-4 transition-all ${
                  action.triggered ? `${meta.border} ${meta.bg}` : shouldTrigger ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-800 bg-slate-950/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${meta.color}`}>STAGE {action.stage}</span>
                      {action.triggered && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <Check size={10} /> TRIGGERED
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-200">{action.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{action.description}</div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
                      <Bell size={10} /> {action.target}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {action.triggered ? (
                    <span className="text-[10px] text-slate-500">
                      Activated {action.triggeredAt ? timeAgo(action.triggeredAt) : ''}
                    </span>
                  ) : shouldTrigger ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400">
                      <Radio size={10} className="animate-pulse" /> Awaiting activation
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600">Armed — triggers at Stage {action.stage}</span>
                  )}

                  <button
                    onClick={() => !action.triggered && onTriggerAction(action.id)}
                    disabled={action.triggered}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      action.triggered
                        ? 'cursor-not-allowed bg-slate-800/50 text-slate-600'
                        : shouldTrigger
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {action.triggered ? 'Activated' : 'Trigger Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert log */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-ice-400" />
            <h3 className="text-sm font-semibold text-slate-300">Alert Log</h3>
            {unackCount > 0 && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                {unackCount} unacknowledged
              </span>
            )}
          </div>
          {unackCount > 0 && (
            <button
              onClick={ackAll}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Acknowledge All
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(['all', 'unack', 'stage1', 'stage2', 'stage3'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-ice-500/15 text-ice-300 border border-ice-500/30'
                  : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unack' ? 'Unacknowledged' : `Stage ${f.replace('stage', '')}`}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="mt-4 max-h-[500px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
          {filteredAlerts.map((alert) => {
            const meta = THREAT_STAGE_META[alert.stage];
            const Icon = alert.stage >= 2 ? Siren : alert.stage === 1 ? AlertTriangle : Bell;

            return (
              <div
                key={alert.id}
                className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-all ${
                  !alert.acknowledged && alert.stage > 0
                    ? `${meta.border} ${meta.bg}`
                    : 'border-slate-800 bg-slate-950/20'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    alert.stage === 3 ? 'bg-red-500/15 text-red-400'
                      : alert.stage === 2 ? 'bg-orange-500/15 text-orange-400'
                      : alert.stage === 1 ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-slate-700/20 text-slate-400'
                  }`}
                >
                  <Icon size={15} />
                </div>

                <div className="flex-1">
                  <div className={`text-sm ${alert.acknowledged ? 'text-slate-400' : 'text-slate-200'}`}>
                    {alert.message}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-600">
                    <span>{timeAgo(alert.timestamp)}</span>
                    <span>·</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC</span>
                    {alert.acknowledged && <><span>·</span><span className="text-emerald-500/60">Acknowledged</span></>}
                  </div>
                </div>

                {alert.stage > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color} ${meta.bg}`}>
                    {meta.label}
                  </span>
                )}

                {!alert.acknowledged && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                  >
                    <Check size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/20 p-8 text-center text-sm text-slate-500">
              No alerts match the current filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
