import { useState, useEffect, useCallback, useRef } from 'react';
import type { Sensor, AlertEvent, ThreatStage, ResponseAction } from '@/types';
import {
  createInitialSensors,
  tickSensors,
  computeThreatStage,
  computeTimeToFailure,
  generateAlerts,
  createInitialAlerts,
  createResponseActions,
} from '@/simulation';
import Sidebar from '@/components/Sidebar';
import type { ViewKey } from '@/components/Sidebar';
import Clock from '@/components/Clock';
import Overview from '@/views/Overview';
import SensorNetwork from '@/views/SensorNetwork';
import Analytics from '@/views/Analytics';
import Alerts from '@/views/Alerts';
import { Mountain, Satellite, Cpu, Wind } from 'lucide-react';

const VIEW_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  overview: { title: 'Command Overview', subtitle: 'Real-time glacial collapse early warning summary' },
  sensors: { title: 'Sensor Network', subtitle: 'Multi-sensor perception layer — live telemetry' },
  analytics: { title: 'Analytics & Prediction', subtitle: 'Multi-modal data fusion & ML-driven time-to-failure' },
  alerts: { title: 'Alerts & Response Matrix', subtitle: 'Threat escalation protocol & automated response' },
};

function App() {
  const [view, setView] = useState<ViewKey>('overview');
  const [sensors, setSensors] = useState<Sensor[]>(() => createInitialSensors());
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [responseActions, setResponseActions] = useState<ResponseAction[]>(() => createResponseActions());
  const [selectedSensorId, setSelectedSensorId] = useState<string>('');
  const alertsRef = useRef(alerts);

  // Initialize alerts
  useEffect(() => {
    setAlerts(createInitialAlerts(createInitialSensors()));
  }, []);

  // Real-time sensor ticking
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) => tickSensors(prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Generate alerts from sensor readings
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  useEffect(() => {
    setAlerts((prev) => generateAlerts(sensors, prev));
  }, [sensors]);

  const threatStage: ThreatStage = computeThreatStage(sensors);
  const timeToFailure = computeTimeToFailure(sensors);
  const unackAlertCount = alerts.filter((a) => !a.acknowledged && a.stage > 0).length;

  const handleAcknowledge = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }, []);

  const handleTriggerAction = useCallback((id: string) => {
    setResponseActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, triggered: true, triggeredAt: Date.now() } : a)),
    );
  }, []);

  const { title, subtitle } = VIEW_TITLES[view];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <Sidebar current={view} onNavigate={setView} alertCount={unackAlertCount} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-sm">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Environment indicators */}
            <div className="hidden items-center gap-4 lg:flex">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mountain size={14} className="text-ice-400/60" />
                <span>Karakoram Sector 7</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Satellite size={14} className="text-ice-400/60" />
                <span>LoRaWAN + SAT</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Cpu size={14} className="text-ice-400/60" />
                <span>14 Edge Nodes</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Wind size={14} className="text-ice-400/60" />
                <span>-34°C</span>
              </div>
            </div>

            {/* Clock */}
            <Clock />
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto scrollbar-thin grid-bg">
          <div className="mx-auto max-w-7xl px-6 py-6">
            {view === 'overview' && (
              <Overview
                sensors={sensors}
                alerts={alerts}
                threatStage={threatStage}
                timeToFailure={timeToFailure}
                onSelectSensor={(id) => {
                  setSelectedSensorId(id);
                  if (id) setView('sensors');
                }}
                selectedSensorId={selectedSensorId}
                onNavigate={setView}
              />
            )}
            {view === 'sensors' && (
              <SensorNetwork
                sensors={sensors}
                threatStage={threatStage}
                selectedSensorId={selectedSensorId}
                onSelectSensor={setSelectedSensorId}
              />
            )}
            {view === 'analytics' && (
              <Analytics
                sensors={sensors}
                threatStage={threatStage}
                timeToFailure={timeToFailure}
              />
            )}
            {view === 'alerts' && (
              <Alerts
                alerts={alerts}
                sensors={sensors}
                threatStage={threatStage}
                responseActions={responseActions}
                onAcknowledge={handleAcknowledge}
                onTriggerAction={handleTriggerAction}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
