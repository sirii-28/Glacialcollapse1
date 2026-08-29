import type { Sensor, SensorReading, AlertEvent, ThreatStage, ResponseAction } from './types';
import { SENSOR_TYPE_META } from './types';

const INITIAL_HISTORY = 60;

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function genHistory(
  count: number,
  base: number,
  variance: number,
  rng: () => number,
  trend = 0,
): SensorReading[] {
  const now = Date.now();
  const readings: SensorReading[] = [];
  let val = base;
  for (let i = count - 1; i >= 0; i--) {
    val += (rng() - 0.45) * variance + trend;
    val = clamp(val, 0, val * 1.5);
    readings.push({ timestamp: now - i * 2000, value: Number(val.toFixed(3)) });
  }
  return readings;
}

interface SensorConfig {
  id: string;
  name: string;
  type: Sensor['type'];
  x: number;
  y: number;
  elevation: number;
  base: number;
  variance: number;
  warning: number;
  critical: number;
  trend: number;
  status: Sensor['status'];
  battery: number;
  signal: number;
  description: string;
}

const SENSOR_CONFIGS: SensorConfig[] = [
  // Kinematic - upper glacier
  { id: 'ACC-01', name: 'Bedrock Accelerometer A1', type: 'accelerometer', x: 28, y: 22, elevation: 3850, base: 0.02, variance: 0.008, warning: 0.15, critical: 0.5, trend: 0.0001, status: 'online', battery: 87, signal: 92, description: 'High-frequency micro-tremor detection on bedrock anchor' },
  { id: 'ACC-02', name: 'Ice Sheet Accelerometer A2', type: 'accelerometer', x: 42, y: 18, elevation: 3720, base: 0.03, variance: 0.012, warning: 0.15, critical: 0.5, trend: 0.0002, status: 'online', battery: 73, signal: 88, description: 'Surface ice movement accelerometer' },
  { id: 'IMU-01', name: '6-Axis IMU Node I1', type: 'imu', x: 35, y: 30, elevation: 3680, base: 0.5, variance: 0.3, warning: 2.5, critical: 8, trend: 0.002, status: 'online', battery: 91, signal: 95, description: 'Multi-axis rotational and translational monitoring' },
  { id: 'IMU-02', name: '6-Axis IMU Node I2', type: 'imu', x: 52, y: 28, elevation: 3540, base: 0.6, variance: 0.4, warning: 2.5, critical: 8, trend: 0.003, status: 'degraded', battery: 42, signal: 61, description: 'Secondary IMU at ice-wall junction' },
  { id: 'TILT-01', name: 'Structural Tilt Sensor T1', type: 'tilt', x: 38, y: 38, elevation: 3490, base: 0.1, variance: 0.05, warning: 1.5, critical: 5, trend: 0.001, status: 'online', battery: 78, signal: 84, description: 'Structural tilt shift detection on ice column' },
  { id: 'TILT-02', name: 'Bedrock Tilt Sensor T2', type: 'tilt', x: 60, y: 35, elevation: 3410, base: 0.08, variance: 0.04, warning: 1.5, critical: 5, trend: 0.0005, status: 'online', battery: 85, signal: 79, description: 'Bedrock-anchored tilt reference station' },

  // Hydrological - sub-glacial
  { id: 'PRES-01', name: 'Basal Pressure Transducer P1', type: 'pressure', x: 33, y: 45, elevation: 3300, base: 320, variance: 15, warning: 420, critical: 550, trend: 0.5, status: 'online', battery: 68, signal: 87, description: 'Sub-glacial water pressure at basal layer' },
  { id: 'PRES-02', name: 'Basal Pressure Transducer P2', type: 'pressure', x: 50, y: 48, elevation: 3250, base: 340, variance: 20, warning: 420, critical: 550, trend: 0.8, status: 'online', battery: 55, signal: 73, description: 'Secondary basal water pressure monitoring point' },
  { id: 'ULTR-01', name: 'Water Level Ultrasonic U1', type: 'ultrasonic', x: 45, y: 55, elevation: 3150, base: 85, variance: 5, warning: 120, critical: 160, trend: 0.15, status: 'online', battery: 82, signal: 90, description: 'Sub-glacial water channel level monitoring' },

  // Acoustic - valley floor
  { id: 'GEO-01', name: 'Geophone Array G1', type: 'geophone', x: 30, y: 62, elevation: 2980, base: 5, variance: 2, warning: 18, critical: 45, trend: 0.08, status: 'online', battery: 94, signal: 97, description: 'Valley floor seismic acoustic emission array' },
  { id: 'GEO-02', name: 'Geophone Array G2', type: 'geophone', x: 55, y: 65, elevation: 2920, base: 6, variance: 3, warning: 18, critical: 45, trend: 0.12, status: 'online', battery: 88, signal: 93, description: 'Secondary geophone station along valley floor' },
  { id: 'INFRA-01', name: 'Infrasound Array IF1', type: 'infrasound', x: 42, y: 70, elevation: 2850, base: 2, variance: 1, warning: 8, critical: 18, trend: 0.05, status: 'online', battery: 76, signal: 85, description: '1-20 Hz subterranean ice-cracking detection' },

  // Visual - ice wall front
  { id: 'THRM-01', name: 'Thermal Camera TC1', type: 'thermal', x: 48, y: 42, elevation: 3350, base: -12, variance: 2, warning: -2, critical: 5, trend: 0.02, status: 'online', battery: 63, signal: 81, description: 'Edge-AI thermal imaging of crevasse field' },
  { id: 'OPT-01', name: 'Optical Camera OC1', type: 'optical', x: 58, y: 44, elevation: 3300, base: 0.5, variance: 0.3, warning: 3, critical: 8, trend: 0.01, status: 'offline', battery: 12, signal: 0, description: 'Crack widening speed optical monitoring' },
];

const rng = seedRandom(20260828);

function createSensor(cfg: SensorConfig): Sensor {
  const meta = SENSOR_TYPE_META[cfg.type];
  const history = genHistory(INITIAL_HISTORY, cfg.base, cfg.variance, rng, cfg.trend);
  const last = history[history.length - 1];

  return {
    id: cfg.id,
    name: cfg.name,
    type: cfg.type,
    category: meta.category,
    status: cfg.status,
    unit: meta.unit,
    minValue: 0,
    maxValue: cfg.critical * 1.5,
    warningThreshold: cfg.warning,
    criticalThreshold: cfg.critical,
    currentValue: last.value,
    x: cfg.x,
    y: cfg.y,
    elevation: cfg.elevation,
    battery: cfg.battery,
    signalStrength: cfg.signal,
    lastPing: Date.now(),
    history,
    description: cfg.description,
  };
}

export function createInitialSensors(): Sensor[] {
  return SENSOR_CONFIGS.map(createSensor);
}

export function tickSensors(sensors: Sensor[]): Sensor[] {
  const now = Date.now();
  return sensors.map((s) => {
    if (s.status === 'offline') {
      return { ...s, lastPing: now };
    }

    const lastVal = s.currentValue;
    const variance = (Math.random() - 0.45) * (s.warningThreshold * 0.015);
    const trendComponent = s.warningThreshold * 0.0008 * (s.category === 'hydrological' ? 1.2 : 1);
    let newVal = lastVal + variance + trendComponent + (Math.random() - 0.5) * (s.warningThreshold * 0.008);
    newVal = clamp(newVal, 0, s.maxValue);

    const newReading: SensorReading = { timestamp: now, value: Number(newVal.toFixed(3)) };
    const history = [...s.history.slice(-79), newReading];

    let battery = s.battery;
    if (Math.random() < 0.1) battery = clamp(battery - 0.05, 0, 100);

    let signal = s.signalStrength;
    if (s.status === 'degraded') {
      signal = clamp(signal + (Math.random() - 0.5) * 4, 40, 70);
    } else {
      signal = clamp(signal + (Math.random() - 0.5) * 2, 70, 100);
    }

    return {
      ...s,
      currentValue: Number(newVal.toFixed(3)),
      history,
      battery: Number(battery.toFixed(1)),
      signalStrength: Number(signal.toFixed(0)),
      lastPing: now,
    };
  });
}

export function computeThreatStage(sensors: Sensor[]): ThreatStage {
  let stage: ThreatStage = 0;
  let warnings = 0;
  let criticals = 0;

  for (const s of sensors) {
    if (s.status === 'offline') continue;
    if (s.currentValue >= s.criticalThreshold) criticals++;
    else if (s.currentValue >= s.warningThreshold) warnings++;
  }

  if (criticals >= 2) stage = 3;
  else if (criticals >= 1 || warnings >= 4) stage = 2;
  else if (warnings >= 1) stage = 1;

  return stage;
}

export function computeTimeToFailure(sensors: Sensor[]): number | null {
  const active = sensors.filter((s) => s.status !== 'offline' && s.history.length >= 10);
  if (active.length === 0) return null;

  let worstRatio = 0;
  for (const s of active) {
    const recent = s.history.slice(-10);
    const slope = (recent[recent.length - 1].value - recent[0].value) / recent.length;
    if (slope <= 0) continue;
    const remaining = s.criticalThreshold - s.currentValue;
    if (remaining <= 0) {
      worstRatio = Math.max(worstRatio, 1);
      continue;
    }
    const timeToCritical = remaining / slope;
    const ratio = 1 / (1 + timeToCritical / 50);
    worstRatio = Math.max(worstRatio, ratio);
  }

  if (worstRatio === 0) return null;
  const hours = (1 / worstRatio) * 2;
  return Number(hours.toFixed(1));
}

export function generateAlerts(sensors: Sensor[], existingAlerts: AlertEvent[]): AlertEvent[] {
  const now = Date.now();
  const existingIds = new Set(existingAlerts.map((a) => a.id));
  const newAlerts: AlertEvent[] = [];

  for (const s of sensors) {
    if (s.status === 'offline') continue;
    if (s.currentValue >= s.criticalThreshold) {
      const id = `${s.id}-crit-${Math.floor(now / 10000)}`;
      if (!existingIds.has(id)) {
        newAlerts.push({
          id,
          sensorId: s.id,
          sensorName: s.name,
          stage: 3,
          message: `${s.name} exceeded critical threshold (${s.currentValue}${s.unit} > ${s.criticalThreshold}${s.unit})`,
          timestamp: now,
          acknowledged: false,
        });
      }
    } else if (s.currentValue >= s.warningThreshold) {
      const id = `${s.id}-warn-${Math.floor(now / 10000)}`;
      if (!existingIds.has(id)) {
        newAlerts.push({
          id,
          sensorId: s.id,
          sensorName: s.name,
          stage: 1,
          message: `${s.name} crossed warning threshold (${s.currentValue}${s.unit} > ${s.warningThreshold}${s.unit})`,
          timestamp: now,
          acknowledged: false,
        });
      }
    }
  }

  return [...newAlerts, ...existingAlerts].slice(0, 50);
}

export function createInitialAlerts(sensors: Sensor[]): AlertEvent[] {
  const alerts: AlertEvent[] = [];
  const now = Date.now();

  if (sensors.find((s) => s.id === 'PRES-02' && s.currentValue >= s.warningThreshold)) {
    alerts.push({
      id: 'PRES-02-init-warn',
      sensorId: 'PRES-02',
      sensorName: 'Basal Pressure Transducer P2',
      stage: 1,
      message: 'Basal water pressure rising above baseline — increased polling to real-time',
      timestamp: now - 120000,
      acknowledged: false,
    });
  }

  alerts.push({
    id: 'IMU-02-degraded',
    sensorId: 'IMU-02',
    sensorName: '6-Axis IMU Node I2',
    stage: 0,
    message: 'IMU Node I2 signal degraded — intermittent mesh connectivity at ice-wall junction',
    timestamp: now - 300000,
    acknowledged: true,
  });

  alerts.push({
    id: 'OPT-01-offline',
    sensorId: 'OPT-01',
    sensorName: 'Optical Camera OC1',
    stage: 0,
    message: 'Optical Camera OC1 offline — battery exhausted, awaiting maintenance window',
    timestamp: now - 600000,
    acknowledged: true,
  });

  return alerts;
}

export function createResponseActions(): ResponseAction[] {
  return [
    { id: 'r1', stage: 1, title: 'Raise Polling Frequency', description: 'System automatically increases data collection from hourly to real-time streaming', target: 'Glaciological teams & regional authorities', triggered: false, triggeredAt: null },
    { id: 'r2', stage: 2, title: 'Dispatch Advisory Notification', description: 'Automated alert broadcast via satellite uplink and GSM fallback', target: 'Emergency response teams & valley infrastructure managers', triggered: false, triggeredAt: null },
    { id: 'r3', stage: 2, title: 'Activate Drone Reconnaissance', description: 'Edge-AI drones deployed for visual confirmation of crevasse expansion', target: 'Field reconnaissance teams', triggered: false, triggeredAt: null },
    { id: 'r4', stage: 3, title: 'Activate Downstream Sirens', description: 'Direct activation of all valley floor evacuation sirens', target: 'Valley residents & workers', triggered: false, triggeredAt: null },
    { id: 'r5', stage: 3, title: 'SMS Mass Broadcast', description: 'Automated SMS evacuation order to all registered contacts in hazard zone', target: 'All registered personnel in hazard zone', triggered: false, triggeredAt: null },
    { id: 'r6', stage: 3, title: 'Automated Gate Closures', description: 'Dam gates and road barriers automatically close to restrict valley access', target: 'Infrastructure control systems', triggered: false, triggeredAt: null },
  ];
}
