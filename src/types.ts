export type SensorType =
  | 'accelerometer'
  | 'imu'
  | 'tilt'
  | 'pressure'
  | 'ultrasonic'
  | 'geophone'
  | 'infrasound'
  | 'thermal'
  | 'optical';

export type SensorCategory =
  | 'kinematic'
  | 'hydrological'
  | 'acoustic'
  | 'visual';

export type SensorStatus = 'online' | 'degraded' | 'offline';

export type ThreatStage = 0 | 1 | 2 | 3;

export interface SensorReading {
  timestamp: number;
  value: number;
}

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  category: SensorCategory;
  status: SensorStatus;
  unit: string;
  minValue: number;
  maxValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  currentValue: number;
  x: number;
  y: number;
  elevation: number;
  battery: number;
  signalStrength: number;
  lastPing: number;
  history: SensorReading[];
  description: string;
}

export interface AlertEvent {
  id: string;
  sensorId: string;
  sensorName: string;
  stage: ThreatStage;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface ResponseAction {
  id: string;
  stage: ThreatStage;
  title: string;
  description: string;
  target: string;
  triggered: boolean;
  triggeredAt: number | null;
}

export const SENSOR_TYPE_META: Record<SensorType, { label: string; category: SensorCategory; unit: string; icon: string }> = {
  accelerometer: { label: 'MEMS Accelerometer', category: 'kinematic', unit: 'g', icon: 'Activity' },
  imu: { label: '6-Axis IMU', category: 'kinematic', unit: '°/s', icon: 'Move3d' },
  tilt: { label: 'Tilt Sensor', category: 'kinematic', unit: '°', icon: 'TrendingUp' },
  pressure: { label: 'Sub-glacial Pressure', category: 'hydrological', unit: 'kPa', icon: 'Gauge' },
  ultrasonic: { label: 'Water Level Ultrasonic', category: 'hydrological', unit: 'cm', icon: 'Waves' },
  geophone: { label: 'Geophone Array', category: 'acoustic', unit: 'Hz', icon: 'Radio' },
  infrasound: { label: 'Infrasound Array', category: 'acoustic', unit: 'Hz', icon: 'AudioLines' },
  thermal: { label: 'Thermal Camera', category: 'visual', unit: '°C', icon: 'Thermometer' },
  optical: { label: 'Optical Camera', category: 'visual', unit: 'mm', icon: 'Camera' },
};

export const CATEGORY_META: Record<SensorCategory, { label: string; color: string; accent: string }> = {
  kinematic: { label: 'Kinematic & Structural', color: 'sky', accent: '#38bdf8' },
  hydrological: { label: 'Hydrological', color: 'cyan', accent: '#22d3ee' },
  acoustic: { label: 'Acoustic & Infrasound', color: 'violet', accent: '#a78bfa' },
  visual: { label: 'Visual Telemetry', color: 'amber', accent: '#fbbf24' },
};

export const THREAT_STAGE_META: Record<ThreatStage, { label: string; color: string; bg: string; border: string; glow: string }> = {
  0: { label: 'Nominal', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'glow-ice' },
  1: { label: 'Stage 1: Watch', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'glow-warning' },
  2: { label: 'Stage 2: Advisory', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'glow-warning' },
  3: { label: 'Stage 3: Evacuate', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'glow-danger' },
};
