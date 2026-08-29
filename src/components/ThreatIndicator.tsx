import type { ThreatStage } from '@/types';
import { THREAT_STAGE_META } from '@/types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Siren } from 'lucide-react';

interface ThreatIndicatorProps {
  stage: ThreatStage;
  timeToFailure: number | null;
}

const STAGE_ICONS: Record<ThreatStage, typeof ShieldCheck> = {
  0: ShieldCheck,
  1: AlertTriangle,
  2: ShieldAlert,
  3: Siren,
};

const STAGE_DESCRIPTIONS: Record<ThreatStage, string> = {
  0: 'All sensor arrays within baseline parameters. No anomalous activity detected.',
  1: 'Baseline shifts detected in sub-glacial hydro-pressure or seismic acoustic emissions. System has raised polling frequency to real-time.',
  2: 'Continuous creep motion detected alongside expanding crevasses. Advisory notifications dispatched to emergency response teams.',
  3: 'High-g seismic signatures indicating structural shear detachment. Evacuation sirens and SMS broadcasts activated. Valley access restricted.',
};

export default function ThreatIndicator({ stage, timeToFailure }: ThreatIndicatorProps) {
  const meta = THREAT_STAGE_META[stage];
  const Icon = STAGE_ICONS[stage];
  const isAlert = stage >= 2;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${meta.border} ${meta.bg} p-6 ${isAlert ? meta.glow : ''} transition-all duration-500`}>
      {/* Animated sweep for high threat */}
      {stage >= 2 && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${stage === 3 ? '#ef4444' : '#f97316'} 20deg, transparent 40deg)`,
            animation: 'sweep 4s linear infinite',
          }}
        />
      )}

      <div className="relative flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.border} border ${meta.color} ${stage >= 2 ? 'animate-pulse-slow' : ''}`}>
          <Icon size={28} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className={`text-xl font-semibold ${meta.color}`}>{meta.label}</h2>
            {stage >= 2 && (
              <span className={`animate-alert-pulse rounded-full px-2 py-0.5 text-xs font-bold ${meta.color} ${meta.bg} border ${meta.border}`}>
                ACTIVE
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{STAGE_DESCRIPTIONS[stage]}</p>
        </div>
      </div>

      {/* Time to failure */}
      <div className="relative mt-4 flex items-center justify-between border-t border-slate-800/50 pt-4">
        <div>
          <div className="text-xs font-medium text-slate-500">PREDICTIVE TIME-TO-FAILURE</div>
          <div className="mt-1 flex items-baseline gap-2">
            {timeToFailure !== null ? (
              <>
                <span className={`font-mono text-2xl font-bold ${stage >= 2 ? 'text-red-400' : stage === 1 ? 'text-amber-400' : 'text-ice-300'}`}>
                  {timeToFailure < 1 ? `< 1` : timeToFailure}
                </span>
                <span className="text-sm text-slate-500">hours (est.)</span>
              </>
            ) : (
              <span className="font-mono text-lg text-emerald-400/80">No failure trajectory detected</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-slate-500">ML MODEL</div>
          <div className="mt-1 font-mono text-sm text-ice-300">LSTM-GRU v2.4</div>
        </div>
      </div>
    </div>
  );
}
