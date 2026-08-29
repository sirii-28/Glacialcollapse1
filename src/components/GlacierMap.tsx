import { useState } from 'react';
import type { Sensor, ThreatStage } from '@/types';
import { CATEGORY_META, THREAT_STAGE_META } from '@/types';

interface GlacierMapProps {
  sensors: Sensor[];
  threatStage: ThreatStage;
  onSelectSensor: (id: string) => void;
  selectedId?: string;
}

function sensorSeverity(s: Sensor): number {
  if (s.status === 'offline') return -1;
  if (s.currentValue >= s.criticalThreshold) return 3;
  if (s.currentValue >= s.warningThreshold) return 1;
  return 0;
}

const SEVERITY_COLORS: Record<number, string> = {
  [-1]: '#64748b',
  0: '#22c55e',
  1: '#fbbf24',
  2: '#f97316',
  3: '#ef4444',
};

export default function GlacierMap({ sensors, threatStage, onSelectSensor, selectedId }: GlacierMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 grid-bg" style={{ aspectRatio: '4 / 3' }}>
      {/* Topographic contour lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 75" preserveAspectRatio="none">
        <defs>
          <radialGradient id="iceBody" cx="40%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#082f49" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="valley" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Ice body shape */}
        <path d="M 15,5 Q 30,2 50,8 Q 70,5 85,12 L 80,30 Q 65,38 45,35 Q 25,38 12,28 Z" fill="url(#iceBody)" />

        {/* Contour lines - elevation */}
        {[10, 20, 30, 40, 50, 60, 65].map((y, i) => (
          <path
            key={i}
            d={`M ${5 + i * 2},${y} Q ${30},${y - 3 + i} ${95 - i * 2},${y + 1}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.15"
            opacity={0.15 - i * 0.015}
          />
        ))}

        {/* Valley floor */}
        <rect x="0" y="55" width="100" height="20" fill="url(#valley)" />

        {/* Flow lines - water runoff paths */}
        <path d="M 33,45 Q 35,52 37,60 Q 38,68 40,72" fill="none" stroke="#22d3ee" strokeWidth="0.3" opacity="0.2" strokeDasharray="1,1" />
        <path d="M 50,48 Q 48,55 50,62 Q 52,68 51,72" fill="none" stroke="#22d3ee" strokeWidth="0.3" opacity="0.2" strokeDasharray="1,1" />

        {/* Hazard zone overlay when threat is high */}
        {threatStage >= 2 && (
          <path d="M 20,50 Q 40,48 60,52 Q 75,55 85,60 L 85,72 L 15,72 Z" fill="#ef4444" opacity={threatStage === 3 ? 0.08 : 0.04} />
        )}
      </svg>

      {/* Labels */}
      <div className="absolute left-3 top-2 text-xs font-medium text-ice-400/60">ICE FIELD — 3,800m</div>
      <div className="absolute left-3 bottom-12 text-xs font-medium text-slate-500/60">VALLEY FLOOR — 2,850m</div>

      {/* Threat zone label */}
      {threatStage >= 2 && (
        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium ${THREAT_STAGE_META[threatStage].bg} ${THREAT_STAGE_META[threatStage].border} ${THREAT_STAGE_META[threatStage].color} border`}>
          {threatStage === 3 ? 'EVACUATION ZONE ACTIVE' : 'ADVISORY ZONE'}
        </div>
      )}

      {/* Sensor nodes */}
      {sensors.map((s) => {
        const severity = sensorSeverity(s);
        const color = SEVERITY_COLORS[severity];
        const isSelected = selectedId === s.id;
        const isHovered = hovered === s.id;
        const showPulse = severity >= 1 && s.status !== 'offline';

        return (
          <button
            key={s.id}
            onClick={() => onSelectSensor(s.id)}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:z-20"
            style={{ left: `${s.x}%`, top: `${s.y}%`, zIndex: isSelected ? 30 : 10 }}
          >
            {/* Pulse rings for active alerts */}
            {showPulse && (
              <>
                <span
                  className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 animate-ping-slow rounded-full"
                  style={{ width: 24, height: 24, left: '50%', top: '50%', backgroundColor: color, opacity: 0.3 }}
                />
                {severity >= 3 && (
                  <span
                    className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full"
                    style={{ width: 18, height: 18, left: '50%', top: '50%', backgroundColor: color, opacity: 0.4 }}
                  />
                )}
              </>
            )}

            {/* Node dot */}
            <span
              className={`block rounded-full border-2 transition-all ${isSelected ? 'scale-150' : isHovered ? 'scale-125' : ''}`}
              style={{
                width: 10,
                height: 10,
                backgroundColor: color,
                borderColor: 'rgba(255,255,255,0.2)',
                boxShadow: `0 0 ${showPulse ? 12 : 4}px ${color}`,
              }}
            />

            {/* Tooltip on hover */}
            {(isHovered || isSelected) && (
              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-left shadow-xl backdrop-blur-sm">
                <div className="text-xs font-semibold text-slate-200">{s.id}</div>
                <div className="text-[10px] text-slate-400">{s.name}</div>
                <div className="mt-1 flex items-center gap-2 text-[10px]">
                  <span style={{ color }}>{s.currentValue} {s.unit}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-500">{CATEGORY_META[s.category].label}</span>
                </div>
              </div>
            )}
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute right-3 top-2 flex flex-col gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 backdrop-blur-sm">
        <div className="text-[10px] font-medium text-slate-500">SENSOR STATUS</div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[0] }} />
          <span className="text-slate-400">Nominal</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[1] }} />
          <span className="text-slate-400">Warning</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[3] }} />
          <span className="text-slate-400">Critical</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[-1] }} />
          <span className="text-slate-400">Offline</span>
        </div>
      </div>
    </div>
  );
}
