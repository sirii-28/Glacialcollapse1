import { LayoutDashboard, Radio, BarChart3, Siren, Snowflake } from 'lucide-react';

export type ViewKey = 'overview' | 'sensors' | 'analytics' | 'alerts';

interface SidebarProps {
  current: ViewKey;
  onNavigate: (view: ViewKey) => void;
  alertCount: number;
}

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Command center summary' },
  { key: 'sensors', label: 'Sensor Network', icon: Radio, description: 'Live sensor array status' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Data fusion & prediction' },
  { key: 'alerts', label: 'Alerts & Response', icon: Siren, description: 'Threat matrix & actions' },
];

export default function Sidebar({ current, onNavigate, alertCount }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ice-500 to-glacier-600 glow-ice">
          <Snowflake size={22} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide text-white">GlacierGuard</div>
          <div className="text-[10px] font-medium tracking-wider text-ice-400/70">EWS COMMAND CENTER</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                isActive
                  ? 'bg-ice-500/10 text-ice-300 border border-ice-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-ice-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-[10px] text-slate-600">{item.description}</div>
              </div>
              {item.key === 'alerts' && alertCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-400">
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System status footer */}
      <div className="border-t border-slate-800 px-4 py-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500">SYSTEM</span>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              OPERATIONAL
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Mesh Network</span>
              <span className="text-ice-300">LoRaWAN + SAT</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Edge Nodes</span>
              <span className="text-ice-300">ESP32 / ARM</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">ML Engine</span>
              <span className="text-ice-300">LSTM-GRU v2.4</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
