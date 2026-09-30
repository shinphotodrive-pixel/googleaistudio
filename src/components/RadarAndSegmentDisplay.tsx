import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Cpu,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  BarChart3,
  Flame,
  CheckCircle2,
  Clock,
  Gauge,
  Wifi,
  Moon,
  Sun,
  BatteryCharging,
  ShieldCheck,
  Power,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';

export type PowerMode = 'ACTIVE' | 'STANDBY' | 'DEEP_SLEEP';

const SEGMENT_MAP: Record<string, { hex: string; bin: string; segs: boolean[] }> = {
  // Segments: [A, B, C, D, E, F, G]
  '0': { hex: '0x3F', bin: '00111111', segs: [true, true, true, true, true, true, false] },
  '1': { hex: '0x06', bin: '00000110', segs: [false, true, true, false, false, false, false] },
  '2': { hex: '0x5B', bin: '01011011', segs: [true, true, false, true, true, false, true] },
  '3': { hex: '0x4F', bin: '01001111', segs: [true, true, true, true, false, false, true] },
  '4': { hex: '0x66', bin: '01100110', segs: [false, true, true, false, false, true, true] },
  '5': { hex: '0x6D', bin: '01101101', segs: [true, false, true, true, false, true, true] },
  '6': { hex: '0x7D', bin: '01111101', segs: [true, false, true, true, true, true, true] },
  '7': { hex: '0x07', bin: '00000111', segs: [true, true, true, false, false, false, false] },
  '8': { hex: '0x7F', bin: '01111111', segs: [true, true, true, true, true, true, true] },
  '9': { hex: '0x6F', bin: '01101111', segs: [true, true, true, true, false, true, true] },
};

export interface TelemetryPoint {
  second: number; // -59 to 0
  timeLabel: string; // e.g. "-45s", "0s(현재)"
  timestamp: string; // "10:33:15"
  speed: number; // Raw detected speed in km/h
  compensatedSpeed: number; // Angle-compensated speed in km/h
  dopplerFreqHz: number; // Calculated Doppler frequency in Hz
  speedLimit: number; // Reference speed limit
  isViolation: boolean; // speed > speedLimit
  vehicleType?: string; // e.g. "승용차", "SUV", etc.
  powerMode: PowerMode; // 'ACTIVE' | 'STANDBY' | 'DEEP_SLEEP'
  systemPowerWatts: number; // Power draw in watts
}

// Generate realistic initial 60-second telemetry data
const generateInitialTelemetry = (
  limit: number,
  radarAngleDeg: number,
  carrierGhz: number
): TelemetryPoint[] => {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const c = 299792458;
  const f0 = carrierGhz * 1e9;
  const thetaRad = (radarAngleDeg * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);

  for (let i = 59; i >= 0; i--) {
    const timeMs = now - i * 1000;
    const date = new Date(timeMs);
    const timestamp = date.toTimeString().split(' ')[0];
    const timeLabel = i === 0 ? '0s(현재)' : `-${i}s`;

    let baseSpeed = 0;
    let vehicleType: string | undefined = undefined;
    let pointPowerMode: PowerMode = 'ACTIVE';
    let systemWatts = 18.5;

    // Realistic vehicle wave simulation across the past 60 seconds
    if (i >= 46 && i <= 51) {
      const bell = Math.sin(((51 - i) / 5) * Math.PI);
      baseSpeed = Math.round(44 + bell * 8 + (Math.sin(i * 1.5) * 1.5));
      vehicleType = '승용차 (아반떼)';
      pointPowerMode = 'ACTIVE';
      systemWatts = 18.5;
    } else if (i >= 30 && i <= 36) {
      // Speeding vehicle
      const bell = Math.sin(((36 - i) / 6) * Math.PI);
      baseSpeed = Math.round(62 + bell * 16 + (Math.sin(i * 2) * 2));
      vehicleType = 'SUV (과속 위반)';
      pointPowerMode = 'ACTIVE';
      systemWatts = 19.8;
    } else if (i >= 16 && i <= 21) {
      const bell = Math.sin(((21 - i) / 5) * Math.PI);
      baseSpeed = Math.round(48 + bell * 5 + (Math.cos(i) * 1.5));
      vehicleType = '택시 (쏘나타)';
      pointPowerMode = 'ACTIVE';
      systemWatts = 18.2;
    } else if (i <= 4) {
      // Current approaching vehicle
      const bell = Math.sin(((4 - i) / 5) * (Math.PI / 2));
      baseSpeed = Math.round(52 + bell * 6);
      vehicleType = '승용차 (접근 중)';
      pointPowerMode = 'ACTIVE';
      systemWatts = 18.5;
    } else {
      // No vehicle detected: simulate Standby or Deep Sleep
      baseSpeed = 0;
      if (i > 36 && i < 46) {
        pointPowerMode = 'DEEP_SLEEP';
        systemWatts = 2.4;
      } else if (i > 21 && i < 30) {
        pointPowerMode = 'DEEP_SLEEP';
        systemWatts = 2.4;
      } else {
        pointPowerMode = 'STANDBY';
        systemWatts = 7.8;
      }
    }

    const v_ms = baseSpeed / 3.6;
    const doppler = (2 * v_ms * f0 * cosTheta) / c;
    const compSpeed = cosTheta > 0.05 && baseSpeed > 0 ? Math.round(baseSpeed / cosTheta) : baseSpeed;

    points.push({
      second: -i,
      timeLabel,
      timestamp,
      speed: baseSpeed,
      compensatedSpeed: compSpeed,
      dopplerFreqHz: Math.round(doppler),
      speedLimit: limit,
      isViolation: baseSpeed > limit,
      vehicleType,
      powerMode: pointPowerMode,
      systemPowerWatts: systemWatts,
    });
  }
  return points;
};

export const RadarAndSegmentDisplay: React.FC = () => {
  // Radar state
  const [speedKmh, setSpeedKmh] = useState<number>(55);
  const [radarAngle, setRadarAngle] = useState<number>(15);
  const [carrierFreqGhz, setCarrierFreqGhz] = useState<number>(24.125);

  // 188 LED state
  const [displaySpeed, setDisplaySpeed] = useState<number>(55);
  const [animatingShift, setAnimatingShift] = useState<boolean>(false);
  const [clockStep, setClockStep] = useState<number>(16);

  // Telemetry state
  const [telemetryLimit, setTelemetryLimit] = useState<number>(50);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [simMode, setSimMode] = useState<'traffic' | 'manual'>('traffic');
  const [syncTo188, setSyncTo188] = useState<boolean>(true);
  const [injectedSpikeRemaining, setInjectedSpikeRemaining] = useState<number>(0);
  const [injectedVehicleSpeed, setInjectedVehicleSpeed] = useState<number>(82);

  // Deep Sleep & Power Management State
  const [deepSleepEnabled, setDeepSleepEnabled] = useState<boolean>(true);
  const [powerMode, setPowerMode] = useState<PowerMode>('ACTIVE');
  const [inactivitySeconds, setInactivitySeconds] = useState<number>(0);
  const [sleepTimeoutSec, setSleepTimeoutSec] = useState<number>(8); // Configurable: 5s, 8s, 15s
  const [savedEnergyWh, setSavedEnergyWh] = useState<number>(4.28); // Accumulated saved Wh
  const [forceSleepActive, setForceSleepActive] = useState<boolean>(false);

  // Doppler Calculation: fd = (2 * v * f0 * cos(theta)) / c
  const v_ms = speedKmh / 3.6;
  const f0 = carrierFreqGhz * 1e9;
  const c = 299792458; // m/s
  const thetaRad = (radarAngle * Math.PI) / 180;
  const dopplerFreqHz = (2 * v_ms * f0 * Math.cos(thetaRad)) / c;
  const trueSpeedCompensated = speedKmh / Math.cos(thetaRad);

  // 60-Second Telemetry Dataset
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(() =>
    generateInitialTelemetry(telemetryLimit, radarAngle, carrierFreqGhz)
  );

  // Traffic wave generation state machine
  const trafficWaveRef = useRef<{
    active: boolean;
    duration: number;
    step: number;
    peakSpeed: number;
    vehicleType: string;
    gapCountdown: number;
  }>({
    active: false,
    duration: 5,
    step: 0,
    peakSpeed: 54,
    vehicleType: '승용차',
    gapCountdown: 2,
  });

  // Calculate current system power watts based on mode
  const currentSystemWatts =
    powerMode === 'DEEP_SLEEP'
      ? 2.4 // Pi5 low-freq + Radar 0.33Hz pulse + 188 LED OFF (OE HIGH)
      : powerMode === 'STANDBY'
      ? 7.8 // Pi5 mid-freq + Radar 2Hz + 188 LED dimmed 30%
      : 18.5; // Full active: Pi5 2.4GHz + Radar 10Hz + 188 LED 100%

  // Hardware OE pin state (74HC595 Output Enable, Active Low)
  const isOePinHigh = powerMode === 'DEEP_SLEEP'; // When OE is HIGH, all outputs are blanked

  // Handle live 1Hz telemetry updates with Deep Sleep State Machine
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0];
      const cosTheta = Math.cos((radarAngle * Math.PI) / 180);
      const rf0 = carrierFreqGhz * 1e9;

      let nextSpeed = 0;
      let vehicleType: string | undefined = undefined;

      // Check if forced sleep is overriding
      if (forceSleepActive) {
        nextSpeed = 0;
        vehicleType = undefined;
      } else if (injectedSpikeRemaining > 0) {
        setInjectedSpikeRemaining((prev) => prev - 1);
        const progress = (4 - injectedSpikeRemaining) / 4;
        const bell = Math.sin(progress * Math.PI);
        nextSpeed = Math.round(injectedVehicleSpeed - (1 - bell) * 12 + (Math.random() * 2 - 1));
        vehicleType = '스포츠카 (과속 감지 즉각 웨이크업)';
      } else if (simMode === 'manual') {
        const noise = Math.random() * 2 - 1;
        nextSpeed = Math.max(0, Math.round(speedKmh + noise));
        vehicleType = '수동 슬라이더 연동';
      } else {
        // Realistic traffic stream simulation
        const tw = trafficWaveRef.current;
        if (tw.active) {
          tw.step++;
          const progress = tw.step / tw.duration;
          const curve = Math.sin(progress * Math.PI);
          nextSpeed = Math.max(0, Math.round(tw.peakSpeed * (0.65 + curve * 0.35) + (Math.random() * 2 - 1)));
          vehicleType = tw.vehicleType;

          if (tw.step >= tw.duration) {
            tw.active = false;
            tw.step = 0;
            // Gap between vehicles (may induce Deep Sleep if gap is long enough)
            tw.gapCountdown = Math.floor(Math.random() * 8) + 4;
          }
        } else {
          tw.gapCountdown--;
          nextSpeed = 0;
          if (tw.gapCountdown <= 0) {
            tw.active = true;
            tw.step = 0;
            tw.duration = Math.floor(Math.random() * 3) + 4;
            const isSpeeding = Math.random() < 0.35;
            if (isSpeeding) {
              tw.peakSpeed = Math.floor(Math.random() * 25) + (telemetryLimit + 8);
              tw.vehicleType = Math.random() > 0.5 ? '수입 SUV (과속)' : '고성능 세단 (과속)';
            } else {
              tw.peakSpeed = Math.floor(Math.random() * 15) + (telemetryLimit - 12);
              const carTypes = ['승용차 (아반떼)', '소형 SUV (코나)', '화물 1톤 트럭', '승합차 (카니발)', '택시'];
              tw.vehicleType = carTypes[Math.floor(Math.random() * carTypes.length)];
            }
          }
        }
      }

      // ── DEEP SLEEP STATE MACHINE TRANSITIONS ──
      let newPowerMode: PowerMode = powerMode;
      let newInactivity = inactivitySeconds;

      if (forceSleepActive) {
        newPowerMode = 'DEEP_SLEEP';
        newInactivity = sleepTimeoutSec;
      } else if (nextSpeed > 0) {
        // Instant Wake-On-Doppler Interrupt (< 20ms)
        newPowerMode = 'ACTIVE';
        newInactivity = 0;
      } else {
        // Vehicle not detected (0 km/h)
        newInactivity = inactivitySeconds + 1;
        if (deepSleepEnabled) {
          if (newInactivity >= sleepTimeoutSec) {
            newPowerMode = 'DEEP_SLEEP';
          } else if (newInactivity >= 3) {
            newPowerMode = 'STANDBY';
          } else {
            newPowerMode = 'ACTIVE';
          }
        } else {
          newPowerMode = 'ACTIVE';
        }
      }

      setPowerMode(newPowerMode);
      setInactivitySeconds(newInactivity);

      // Accumulate energy savings (Base active is 18.5W)
      const currentWatts =
        newPowerMode === 'DEEP_SLEEP' ? 2.4 : newPowerMode === 'STANDBY' ? 7.8 : 18.5;
      const wattSavedPerSec = (18.5 - currentWatts) / 3600;
      setSavedEnergyWh((prev) => parseFloat((prev + wattSavedPerSec).toFixed(3)));

      const v_next_ms = nextSpeed / 3.6;
      const nextDoppler = (2 * v_next_ms * rf0 * cosTheta) / c;
      const nextCompensated = cosTheta > 0.05 && nextSpeed > 0 ? Math.round(nextSpeed / cosTheta) : nextSpeed;

      setTelemetry((prev) => {
        const shifted = prev.slice(1).map((pt, idx) => {
          const second = -(59 - idx);
          return {
            ...pt,
            second,
            timeLabel: `-${59 - idx}s`,
          };
        });

        const newPoint: TelemetryPoint = {
          second: 0,
          timeLabel: '0s(현재)',
          timestamp,
          speed: nextSpeed,
          compensatedSpeed: nextCompensated,
          dopplerFreqHz: Math.round(nextDoppler),
          speedLimit: telemetryLimit,
          isViolation: nextSpeed > telemetryLimit,
          vehicleType,
          powerMode: newPowerMode,
          systemPowerWatts: currentWatts,
        };

        return [...shifted, newPoint];
      });

      // Synchronize 188 LED Segment Display if enabled and not in Deep Sleep
      if (syncTo188) {
        if (newPowerMode === 'DEEP_SLEEP') {
          setDisplaySpeed(0);
        } else if (nextSpeed > 0) {
          setDisplaySpeed(nextSpeed);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isLive,
    simMode,
    speedKmh,
    radarAngle,
    carrierFreqGhz,
    telemetryLimit,
    injectedSpikeRemaining,
    injectedVehicleSpeed,
    syncTo188,
    deepSleepEnabled,
    powerMode,
    inactivitySeconds,
    sleepTimeoutSec,
    forceSleepActive,
  ]);

  // Extract digits for 188 display
  const is100Lit = displaySpeed >= 100 && powerMode !== 'DEEP_SLEEP';
  const tensDigit = Math.floor((displaySpeed % 100) / 10).toString();
  const onesDigit = (displaySpeed % 10).toString();

  const tensData = SEGMENT_MAP[tensDigit] || SEGMENT_MAP['0'];
  const onesData = SEGMENT_MAP[onesDigit] || SEGMENT_MAP['0'];

  // Start bit-bang animation
  const runBitBangAnimation = () => {
    if (powerMode === 'DEEP_SLEEP') {
      handleWakeUp();
    }
    setAnimatingShift(true);
    setClockStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setClockStep(step);
      if (step >= 16) {
        clearInterval(interval);
        setAnimatingShift(false);
      }
    }, 120);
  };

  // Instant wake up trigger (Wake on Doppler Radar Interrupt)
  const handleWakeUp = () => {
    setForceSleepActive(false);
    setPowerMode('ACTIVE');
    setInactivitySeconds(0);
    setInjectedVehicleSpeed(58);
    setInjectedSpikeRemaining(3);
    if (!isLive) setIsLive(true);
  };

  // Force deep sleep toggle
  const handleToggleForceSleep = () => {
    if (powerMode === 'DEEP_SLEEP') {
      handleWakeUp();
    } else {
      setForceSleepActive(true);
      setPowerMode('DEEP_SLEEP');
      setInactivitySeconds(sleepTimeoutSec);
      setDisplaySpeed(0);
    }
  };

  // Telemetry metrics calculation across the last 60 seconds
  const currentTelemetryPoint = telemetry[telemetry.length - 1] || {
    speed: 0,
    compensatedSpeed: 0,
    dopplerFreqHz: 0,
    isViolation: false,
    speedLimit: telemetryLimit,
    powerMode: 'ACTIVE',
    systemPowerWatts: 18.5,
  };

  const activeTelemetryPoints = telemetry.filter((p) => p.speed > 0);
  const peakSpeed60s = Math.max(0, ...telemetry.map((p) => p.speed));
  const avgSpeed60s =
    activeTelemetryPoints.length > 0
      ? (
          activeTelemetryPoints.reduce((acc, p) => acc + p.speed, 0) /
          activeTelemetryPoints.length
        ).toFixed(1)
      : '0.0';
  const violationsIn60s = telemetry.filter((p) => p.isViolation).length;
  const violationRate60s =
    activeTelemetryPoints.length > 0
      ? Math.round((violationsIn60s / activeTelemetryPoints.length) * 100)
      : 0;

  // Percentage of time in Deep Sleep over last 60s
  const deepSleepCount60s = telemetry.filter((p) => p.powerMode === 'DEEP_SLEEP').length;
  const deepSleepPercentage60s = Math.round((deepSleepCount60s / telemetry.length) * 100);

  // Trigger high-speed vehicle injection
  const handleInjectViolation = () => {
    setForceSleepActive(false);
    const spikeSpeed = Math.floor(Math.random() * 15) + (telemetryLimit + 22);
    setInjectedVehicleSpeed(spikeSpeed);
    setInjectedSpikeRemaining(4);
    if (!isLive) setIsLive(true);
  };

  // Reset telemetry buffer
  const handleResetTelemetry = () => {
    setTelemetry(generateInitialTelemetry(telemetryLimit, radarAngle, carrierFreqGhz));
    setSavedEnergyWh(0);
    setInactivitySeconds(0);
    setPowerMode('ACTIVE');
    setForceSleepActive(false);
  };

  return (
    <section id="radar-led" className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-12">
      {/* Section Header */}
      <div className="border-b border-slate-800 pb-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              <Radio className="w-3.5 h-3.5" />
              레이더 물리학 & 디지털 로직 & 초저전력 절전
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>2. 24GHz 도플러 레이더 & 188 LED 디스플레이 (Deep Sleep 절전 모드 탑재)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              밀리미터파 도플러 주파수 편이(fd) 물리 연산, 74HC595 188 세그먼트 데이지체인 제어, 60초 레이더 텔레메트리 스트림 및 무차량 시 87% 전력을 절감하는 <strong>Deep Sleep 모드</strong>입니다.
            </p>
          </div>
        </div>
      </div>

      {/* ── SMART POWER MANAGEMENT & DEEP SLEEP HERO BANNER ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 mb-8 ${
        powerMode === 'DEEP_SLEEP'
          ? 'bg-purple-950/40 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
          : powerMode === 'STANDBY'
          ? 'bg-amber-950/30 border-amber-500/40'
          : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3.5 w-3.5">
                  {powerMode === 'DEEP_SLEEP' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-500"></span>
                    </>
                  ) : powerMode === 'STANDBY' ? (
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </>
                  )}
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  시스템 전력 상태:
                </span>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black flex items-center gap-1.5 ${
                powerMode === 'DEEP_SLEEP'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : powerMode === 'STANDBY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {powerMode === 'DEEP_SLEEP' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-purple-400" />
                    <span>DEEP SLEEP (초저전력 절전 2.4W • -87%)</span>
                  </>
                ) : powerMode === 'STANDBY' ? (
                  <>
                    <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                    <span>STANDBY (대기 7.8W • 디밍 30%)</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ACTIVE (정상 가동 18.5W • 100%)</span>
                  </>
                )}
              </span>

              {/* Hardware OE status pill */}
              <span className="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                74HC595 OE: <strong className={isOePinHigh ? 'text-purple-400' : 'text-emerald-400'}>{isOePinHigh ? 'HIGH (소등 차단)' : 'LOW (정상 점등)'}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                무차량 지속: <strong className="text-amber-400">{inactivitySeconds}초</strong> / 절전 임계: {sleepTimeoutSec}초
              </span>
              <span>•</span>
              <span>레이더 펄스 주기: <strong className={powerMode === 'DEEP_SLEEP' ? 'text-purple-400' : 'text-indigo-400'}>{powerMode === 'DEEP_SLEEP' ? '3,000ms (0.33Hz 저전력 감시)' : powerMode === 'STANDBY' ? '500ms (2.0Hz)' : '100ms / 1.0Hz'}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                절감 누적 전력: {savedEnergyWh} Wh
              </span>
            </div>

            {/* Inactivity progress bar */}
            {deepSleepEnabled && powerMode !== 'DEEP_SLEEP' && (
              <div className="w-full max-w-md bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (inactivitySeconds / sleepTimeoutSec) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Deep Sleep Control Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto Deep Sleep Toggle */}
            <button
              onClick={() => setDeepSleepEnabled(!deepSleepEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                deepSleepEnabled
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="차량 미감지 시 Deep Sleep 모드로 자동 전환"
            >
              <Power className="w-3.5 h-3.5" />
              <span>자동 절전: {deepSleepEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Timeout Selector */}
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
              <span className="text-slate-500 px-2 font-mono text-[11px]">진입시간:</span>
              {[5, 8, 15].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSleepTimeoutSec(sec)}
                  className={`px-2 py-0.5 rounded font-mono font-bold text-xs transition ${
                    sleepTimeoutSec === sec
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec}초
                </button>
              ))}
            </div>

            {/* Force Sleep or Wake Button */}
            {powerMode === 'DEEP_SLEEP' ? (
              <button
                onClick={handleWakeUp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition active:scale-95 shadow-lg shadow-emerald-500/20"
                title="레이더 도플러 인터럽트를 시뮬레이션하여 즉시 정상 모드로 복귀"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>레이더 웨이크업 인터럽트</span>
              </button>
            ) : (
              <button
                onClick={handleToggleForceSleep}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/40 transition active:scale-95"
                title="즉시 Deep Sleep 초저전력 모드로 강제 전환"
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>강제 절전 진입</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: 24GHz Doppler Physics Calculator */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              <span>24GHz 레이더 도플러 주파수 연산기</span>
            </h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              UART 115200bps
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono text-indigo-400 text-sm font-bold shadow-inner">
            fd = (2 · v · f0 · cos θ) / c
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 font-medium">차량 실제 주행 속도 (v):</label>
                <span className="font-mono font-bold text-amber-400 text-sm">{speedKmh} km/h ({(v_ms).toFixed(1)} m/s)</span>
              </div>
              <input
                type="range"
                min="0"
                max="160"
                value={speedKmh}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSpeedKmh(val);
                  if (syncTo188 && powerMode !== 'DEEP_SLEEP') setDisplaySpeed(val);
                  if (val > 0 && powerMode === 'DEEP_SLEEP') {
                    handleWakeUp();
                  }
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">레이더 지주 입사각 (θ):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="45"
                    value={radarAngle}
                    onChange={(e) => setRadarAngle(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-center font-bold"
                  />
                  <span className="text-slate-400">도(°)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">송신 반송파 주파수 (f0):</label>
                <select
                  value={carrierFreqGhz}
                  onChange={(e) => setCarrierFreqGhz(parseFloat(e.target.value))}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono font-bold"
                >
                  <option value={24.125}>24.125 GHz (K-Band)</option>
                  <option value={24.150}>24.150 GHz (산업용)</option>
                  <option value={24.200}>24.200 GHz (고주파수)</option>
                </select>
              </div>
            </div>

            {/* Doppler Output Results */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>계산된 도플러 비트 주파수 (fd):</span>
                <span className="text-indigo-400 font-bold text-sm">
                  {speedKmh > 0 ? `${Math.round(dopplerFreqHz).toLocaleString()} Hz` : '0 Hz (신호 없음)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>각도 보정 계수 (1 / cos θ):</span>
                <span className="text-slate-400">{(1 / Math.cos(thetaRad)).toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-2">
                <span>레이더 측정 보정 속도:</span>
                <span className="text-emerald-400 font-bold text-sm">{Math.round(trueSpeedCompensated)} km/h</span>
              </div>
            </div>

            {/* Raw UART Packet Inspector with Deep Sleep command */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
              <div className="text-slate-500 mb-1 flex items-center justify-between">
                <span>/dev/ttyAMA0 실시간 시리얼 패킷 프레임:</span>
                <span className={`text-[10px] ${powerMode === 'DEEP_SLEEP' ? 'text-purple-400 font-bold' : 'text-emerald-400'}`}>
                  {powerMode === 'DEEP_SLEEP' ? 'SLEEP DUTY PULSE (0.33Hz)' : 'UART CRC OK'}
                </span>
              </div>
              <div className="text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto">
                {powerMode === 'DEEP_SLEEP' ? (
                  <span className="text-purple-300 font-bold">
                    0x55 0x50 0x57 0x00 0x00 0x00 0xAA [K-BAND LOW DUTY CYCLE SLEEP CMD]
                  </span>
                ) : (
                  <span>
                    0xFF 0xAA 0x04 0x00 0x{speedKmh.toString(16).toUpperCase().padStart(2, '0')} 0x01 0x{((0xFF + 0xAA + 0x04 + speedKmh + 0x01) % 256).toString(16).toUpperCase().padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                {powerMode === 'DEEP_SLEEP' ? (
                  <span className="text-purple-400">[절전 모드: RF 출력 듀티비 10%로 감쇄 • 센서 소비전류 1.2mA]</span>
                ) : (
                  <>
                    <span>[헤더: FF AA]</span>
                    <span>[길이: 04]</span>
                    <span>[속도: {speedKmh} km/h]</span>
                    <span>[방향: 접근 01]</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: 74HC595 Shift Register & 188 LED Simulator */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>74HC595 쉬프트 레지스터 & 188 LED 디스플레이</span>
            </h3>
            <span className="text-[11px] font-mono text-amber-400">GPIO 17/27/22/25(OE)</span>
          </div>

          {/* Interactive Speed Controller for 188 Display */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-medium">188 LED 표시 속도 제어:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="199"
                  value={displaySpeed}
                  disabled={powerMode === 'DEEP_SLEEP'}
                  onChange={(e) => setDisplaySpeed(Math.max(0, Math.min(199, parseInt(e.target.value) || 0)))}
                  className="w-20 p-1 bg-slate-900 border border-slate-700 rounded text-center font-mono font-bold text-amber-400 text-sm disabled:opacity-40"
                />
                <span className="font-mono text-slate-400">km/h</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={runBitBangAnimation}
                disabled={animatingShift}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>16비트 SPI 시프트 클럭 애니메이션</span>
              </button>

              <button
                onClick={() => {
                  if (powerMode === 'DEEP_SLEEP') handleWakeUp();
                  setDisplaySpeed(30);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-800 transition"
                title="스쿨존 30km/h 리셋"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              <button
                onClick={() => setSyncTo188(!syncTo188)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  syncTo188
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>텔레메트리 연동 {syncTo188 ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Authentic 188 LED PCB Board Visualizer with Deep Sleep Blanking Overlay */}
          <div className="led-box p-6 rounded-2xl flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden">
            {/* PCB silk screen text */}
            <div className="absolute top-2 left-4 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              SPEED ENFORCEMENT DISPLAY PCB REV 2.4
            </div>
            <div className="absolute top-2 right-4 text-[9px] font-mono text-slate-600">
              74HC595 × 2 CATHODE (OE: {isOePinHigh ? 'HIGH' : 'LOW'})
            </div>

            {/* Deep Sleep Blanking Overlay */}
            {powerMode === 'DEEP_SLEEP' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center border-2 border-purple-500/30 rounded-2xl animate-in fade-in duration-300">
                <div className="relative mb-2">
                  <Moon className="w-8 h-8 text-purple-400 animate-pulse" />
                  <span className="animate-ping absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-400 opacity-75"></span>
                </div>
                <div className="font-tech text-base sm:text-lg font-black text-purple-300 tracking-wider">
                  DEEP SLEEP (절전 소등 중)
                </div>
                <p className="text-[11px] font-mono text-slate-400 max-w-xs mt-1">
                  74HC595 <strong className="text-purple-300">OE=HIGH</strong>로 모든 LED 출력을 하드웨어 차단하여 전력 소모를 0W로 억제 중입니다.
                </p>
                <button
                  onClick={handleWakeUp}
                  className="mt-3 px-3 py-1 rounded-lg bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 text-xs font-mono font-bold border border-purple-500/50 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-300" />
                  <span>웨이크업 인터럽트 발생</span>
                </button>
              </div>
            )}

            {/* 100's place ('1' single stroke) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 mb-1">백의 자리</span>
              <div className="w-8 h-28 bg-slate-950/80 rounded-lg p-1.5 flex items-center justify-center border border-slate-900">
                <div
                  className={`w-3.5 h-24 rounded-full transition-all duration-200 ${
                    is100Lit
                      ? 'bg-rose-500 shadow-[0_0_15px_#ef4444,0_0_30px_#ef4444]'
                      : 'bg-slate-900 opacity-20'
                  }`}
                />
              </div>
              <span className={`text-[10px] font-mono mt-1 ${is100Lit ? 'text-rose-400 font-bold' : 'text-slate-600'}`}>
                {is100Lit ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* 10's place (7-Segment SVG Graphic) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 mb-1">십의 자리</span>
              <SevenSegmentSVG segs={tensData.segs} isDimmed={powerMode === 'STANDBY'} />
              <span className="text-[11px] font-mono text-amber-400 font-bold mt-1">
                '{tensDigit}' ({tensData.hex})
              </span>
            </div>

            {/* 1's place (7-Segment SVG Graphic) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 mb-1">일의 자리</span>
              <SevenSegmentSVG segs={onesData.segs} isDimmed={powerMode === 'STANDBY'} />
              <span className="text-[11px] font-mono text-amber-400 font-bold mt-1">
                '{onesDigit}' ({onesData.hex})
              </span>
            </div>

            <div className="flex flex-col justify-end h-28 pb-4">
              <span className="font-tech text-base font-bold text-rose-500/80 tracking-wider">km/h</span>
            </div>
          </div>

          {/* 74HC595 Register Bit Mapping Table */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>74HC595 데이지체인 16비트 레지스터:</span>
              <span className="text-amber-400">
                {animatingShift ? `시프트 진행: ${clockStep}/16 Clocks` : '래치 완료 (RCLK High)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">U1 (십의 자리):</div>
                <div className="text-amber-400 font-bold">{tensData.hex}</div>
                <div className="text-slate-500 tracking-widest">{tensData.bin}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">U2 (일의 자리):</div>
                <div className="text-amber-400 font-bold">{onesData.hex}</div>
                <div className="text-slate-500 tracking-widest">{onesData.bin}</div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              * <strong>SER</strong> (GPIO 17): 최상위 비트(MSB)부터 1비트씩 전송 &nbsp;•&nbsp;
              <strong>SRCLK</strong> (GPIO 27): 쉬프트 클럭 &nbsp;•&nbsp;
              <strong>RCLK</strong> (GPIO 22): 출력 래치 펄스 &nbsp;•&nbsp;
              <strong>OE (GPIO 25)</strong>: <span className="text-purple-300 font-bold">{isOePinHigh ? 'HIGH (Deep Sleep 소등)' : 'LOW (정상 점등)'}</span>.
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH RECHARTS LIVE TELEMETRY LINE CHART SECTION */}
      <div className="mt-8 bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-6">
        {/* Telemetry Header with Status and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                {isLive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
              </div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <span>24GHz 레이더 실시간 속도 텔레메트리 모니터 (최근 60초)</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono font-medium">
                Recharts Live Stream (1.0 Hz)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              최근 60초간 K-Band 레이더가 감지한 차량 주행속도 시계열 데이터와 단속 임계값(Threshold) 및 실시간 전력 상태 비교 분석 차트입니다.
            </p>
          </div>

          {/* Interactive Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Speed Limit Presets */}
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
              <span className="text-[11px] text-slate-400 px-2 font-medium">제한속도:</span>
              {[30, 50, 60, 80].map((limit) => (
                <button
                  key={limit}
                  onClick={() => setTelemetryLimit(limit)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                    telemetryLimit === limit
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>

            {/* Sim Mode Switcher */}
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
              <button
                onClick={() => {
                  setSimMode('traffic');
                  setForceSleepActive(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  simMode === 'traffic'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="자율 교통류 시뮬레이션: 차량이 자연스럽게 출현/통과하며, 무차량 구간에서 Deep Sleep 모드로 자동 진입합니다"
              >
                교통류 자동
              </button>
              <button
                onClick={() => {
                  setSimMode('manual');
                  setForceSleepActive(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  simMode === 'manual'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="상단 슬라이더 연동 모드: 슬라이더 조절 속도를 실시간 추종합니다"
              >
                슬라이더 연동
              </button>
            </div>

            {/* Inject Speed Spike Button */}
            <button
              onClick={handleInjectViolation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition active:scale-95 shadow-sm"
              title="80+ km/h 과속 차량을 실시간 텔레메트리 스트림에 즉시 진입시키고 Deep Sleep을 즉각 해제합니다"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>과속 차량 진입</span>
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isLive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLive ? '일시정지' : '스트리밍 시작'}</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetTelemetry}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="60초 버퍼 및 통계 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Telemetry Metrics Cards (Including Deep Sleep & Power) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Current Speed & Sleep State */}
          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                현재 감지 속도
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  powerMode === 'DEEP_SLEEP'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : currentTelemetryPoint.speed === 0
                    ? 'bg-slate-800 text-slate-400'
                    : currentTelemetryPoint.isViolation
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {powerMode === 'DEEP_SLEEP'
                  ? '절전 소등'
                  : currentTelemetryPoint.speed === 0
                  ? '대기 중'
                  : currentTelemetryPoint.isViolation
                  ? '과속 감지!'
                  : '정상 주행'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-mono text-2xl sm:text-3xl font-black ${powerMode === 'DEEP_SLEEP' ? 'text-purple-300' : 'text-white'}`}>
                {currentTelemetryPoint.speed}
              </span>
              <span className="text-xs font-mono text-slate-400">km/h</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
              <span>보정: {currentTelemetryPoint.compensatedSpeed} km/h</span>
              <span className="text-amber-400">{currentTelemetryPoint.dopplerFreqHz} Hz</span>
            </div>
          </div>

          {/* Card 2: Peak Speed in 60s */}
          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                60초 최고 속도
              </span>
              <span className="text-[10px] font-mono text-slate-500">최대치</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-rose-400">
                {peakSpeed60s}
              </span>
              <span className="text-xs font-mono text-slate-400">km/h</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              단속 기준 대비{' '}
              <span className={peakSpeed60s > telemetryLimit ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {peakSpeed60s > telemetryLimit ? `+${peakSpeed60s - telemetryLimit} km/h 초과` : '준수'}
              </span>
            </div>
          </div>

          {/* Card 3: 60s Average Speed */}
          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                60초 평균 주행속도
              </span>
              <span className="text-[10px] font-mono text-slate-500">{activeTelemetryPoints.length}대 통과</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-cyan-400">
                {avgSpeed60s}
              </span>
              <span className="text-xs font-mono text-slate-400">km/h</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              상태:{' '}
              <span className="text-slate-300">
                {parseFloat(avgSpeed60s) > telemetryLimit ? '과속 우려 구간' : '원활한 안전 흐름'}
              </span>
            </div>
          </div>

          {/* Card 4: Deep Sleep Ratio */}
          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                절전 모드 유지율
              </span>
              <span className="text-[10px] font-mono text-purple-300 font-bold">{deepSleepCount60s}초 절전</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-purple-400">
                {deepSleepPercentage60s}%
              </span>
              <span className="text-xs font-mono text-slate-400">60초 중</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
              <span>누적 절감:</span>
              <span className="text-emerald-400 font-bold">{savedEnergyWh} Wh</span>
            </div>
          </div>

          {/* Card 5: Current Power Draw (Watts) */}
          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                실시간 소비전력
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                powerMode === 'DEEP_SLEEP'
                  ? 'bg-purple-500/20 text-purple-300'
                  : powerMode === 'STANDBY'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {powerMode === 'DEEP_SLEEP' ? '-87% 절전' : powerMode === 'STANDBY' ? '-58% 절감' : '100% 가동'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-mono text-2xl sm:text-3xl font-black ${
                powerMode === 'DEEP_SLEEP' ? 'text-purple-300' : powerMode === 'STANDBY' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {currentSystemWatts}
              </span>
              <span className="text-xs font-mono text-slate-400">Watts</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
              <span>최대: 18.5W</span>
              <span className="text-purple-400 font-semibold">최소: 2.4W</span>
            </div>
          </div>
        </div>

        {/* RECHARTS LINE CHART CONTAINER */}
        <div className="bg-slate-900/70 rounded-2xl p-4 sm:p-5 border border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mb-3 px-1 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-indigo-400 font-medium">
                <span className="w-3 h-0.5 bg-indigo-500 rounded"></span>
                실측 속도 (Raw Radar)
              </span>
              <span className="inline-flex items-center gap-1.5 text-cyan-400 font-medium">
                <span className="w-3 h-0.5 bg-cyan-400 border-t border-dashed border-cyan-400"></span>
                각도 보정 속도 (1/cos θ)
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-3 h-0.5 bg-rose-500 border-t border-dashed border-rose-500"></span>
                단속 기준선 ({telemetryLimit} km/h)
              </span>
              <span className="inline-flex items-center gap-1.5 text-purple-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                Deep Sleep 절전 구간 (2.4W)
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-500">
              <Clock className="w-3 h-3" />
              <span>왼쪽: 60초 전 (-59s) ───▶ 오른쪽: 현재 (0s)</span>
            </div>
          </div>

          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#475569"
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  interval={5}
                />
                <YAxis
                  stroke="#475569"
                  domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]}
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  unit=" km/h"
                />
                <Tooltip content={<CustomTelemetryTooltip />} />

                {/* Speed Limit Reference Line */}
                <ReferenceLine
                  y={telemetryLimit}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `단속 기준 (${telemetryLimit} km/h)`,
                    fill: '#ef4444',
                    position: 'insideTopRight',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />

                {/* Moderate Speeding Reference Line (+10 km/h) */}
                <ReferenceLine
                  y={telemetryLimit + 10}
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: `경고선 (+10 km/h)`,
                    fill: '#f59e0b',
                    position: 'insideTopLeft',
                    fontSize: 10,
                  }}
                />

                {/* Primary Vehicle Speed Line */}
                <Line
                  type="monotone"
                  dataKey="speed"
                  name="레이더 실측 속도"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={<CustomTelemetryDot />}
                  activeDot={{ r: 6, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />

                {/* Compensated Speed Line (Geometric cosine correction) */}
                <Line
                  type="monotone"
                  dataKey="compensatedSpeed"
                  name="각도 보정 속도"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Telemetry Footer Explanations & Power State Architecture */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                빨간색 마커: 제한속도 초과 감지 시점
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                보라색 마커: Deep Sleep 절전 구간 (소등 & 샘플링 다운)
              </span>
              <span className="text-slate-400">
                • 절전 복귀: Wake-on-Doppler (&lt; 20ms 인터럽트)
              </span>
            </div>
            <div className="text-slate-400">
              최종 패킷 수신: {currentTelemetryPoint.timestamp || '대기'}
            </div>
          </div>
        </div>

        {/* Technical Deep Sleep Architecture Guide Box */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>라즈베리파이 5 & 24GHz 도플러 레이더 Deep Sleep 저전력 아키텍처 명세</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono pt-1">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <div className="text-purple-300 font-bold mb-1">1. 74HC595 OE 하드웨어 소등</div>
              <p className="text-slate-400 leading-relaxed">
                차량 미감지 시 GPIO 25 (OE Output Enable)을 HIGH로 올려 188 LED 전광판의 고휘도 소모전류(약 12W)를 즉시 물리적으로 0W로 차단합니다.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <div className="text-indigo-300 font-bold mb-1">2. 레이더 RF 펄스 듀티비 다운</div>
              <p className="text-slate-400 leading-relaxed">
                상시 100ms 연속 송출 대신 3,000ms 간격의 마이크로파 탐색 펄스(0.33Hz) 모드로 전환하여 K-Band 발진기 발열과 전력(45mA에서 1.2mA로 감쇄)을 억제합니다.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <div className="text-emerald-300 font-bold mb-1">3. Wake-on-Doppler 인터럽트</div>
              <p className="text-slate-400 leading-relaxed">
                다가오는 차량의 반사파 도플러 주파수가 감지되면 하드웨어 EXTI 인터럽트가 발생하여 20ms 이내에 라즈베리파이 5와 디스플레이를 즉시 깨웁니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Custom Tooltip component for Recharts
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTelemetryTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data: TelemetryPoint = payload[0].payload;
    const isOver = data.speed > data.speedLimit;
    const diff = data.speed - data.speedLimit;
    const isDeepSleep = data.powerMode === 'DEEP_SLEEP';

    return (
      <div className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs font-mono space-y-2 z-50 min-w-[240px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
          <span className="font-bold text-slate-300">
            {data.timestamp} ({data.timeLabel})
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isDeepSleep
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : data.speed === 0
                ? 'bg-slate-800 text-slate-400'
                : isOver
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isDeepSleep
              ? 'DEEP SLEEP (절전)'
              : data.speed === 0
              ? '차량 없음'
              : isOver
              ? `과속 +${diff} km/h`
              : '규정 속도 준수'}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-slate-200">
            <span className="text-slate-400">레이더 감지 속도:</span>
            <span className={`font-bold text-sm ${isOver ? 'text-rose-400' : isDeepSleep ? 'text-purple-300' : 'text-indigo-300'}`}>
              {data.speed} km/h
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">각도 보정 속도:</span>
            <span className="text-cyan-400 font-bold">{data.compensatedSpeed} km/h</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">도플러 비트 주파수:</span>
            <span className="text-amber-400">{data.dopplerFreqHz.toLocaleString()} Hz</span>
          </div>

          <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1">
            <span className="text-slate-400">전력 모드 / 소비전력:</span>
            <span className={`font-bold ${isDeepSleep ? 'text-purple-300' : 'text-emerald-400'}`}>
              {data.powerMode} ({data.systemPowerWatts}W)
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">74HC595 OE 핀 상태:</span>
            <span className={isDeepSleep ? 'text-purple-300' : 'text-emerald-300'}>
              {isDeepSleep ? 'HIGH (출력 소등)' : 'LOW (정상 점등)'}
            </span>
          </div>
        </div>

        {data.vehicleType && (
          <div className="text-[11px] text-indigo-400 pt-1.5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">감지 차종:</span>
            <span className="font-sans font-medium text-slate-200">{data.vehicleType}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Dot to highlight violations and deep sleep points on the line
interface DotProps {
  cx?: number;
  cy?: number;
  payload?: TelemetryPoint;
}

const CustomTelemetryDot: React.FC<DotProps> = ({ cx, cy, payload }) => {
  if (cx === undefined || cy === undefined || !payload) return null;

  if (payload.isViolation && payload.speed > 0) {
    return (
      <g key={`dot-violation-${payload.second}`}>
        <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
      </g>
    );
  }

  if (payload.powerMode === 'DEEP_SLEEP') {
    return (
      <circle key={`dot-sleep-${payload.second}`} cx={cx} cy={cy} r={3} fill="#a855f7" stroke="#7e22ce" strokeWidth={1} />
    );
  }

  if (payload.speed > 0) {
    return (
      <circle key={`dot-normal-${payload.second}`} cx={cx} cy={cy} r={2} fill="#818cf8" opacity={0.6} />
    );
  }

  return null;
};

// Clean 7-Segment HTML Component with dimming support
function SevenSegmentSVG({ segs, isDimmed }: { segs: boolean[]; isDimmed?: boolean }) {
  // [A, B, C, D, E, F, G]
  const [a, b, c, d, e, f, g] = segs;

  const litClass = isDimmed
    ? 'bg-rose-500/40 shadow-[0_0_6px_rgba(239,68,68,0.3)]'
    : 'bg-rose-500 shadow-[0_0_12px_#ef4444,0_0_24px_rgba(239,68,68,0.6)]';
  const dimClass = 'bg-slate-900 opacity-20';

  return (
    <div className="w-16 h-28 bg-slate-950/80 rounded-xl p-2.5 flex flex-col justify-between items-center border border-slate-900 relative">
      {/* Top segment A */}
      <div className={`w-11 h-2 rounded-full transition-all duration-150 ${a ? litClass : dimClass}`} />

      {/* Middle-upper: F (left) and B (right) */}
      <div className="w-full flex justify-between px-0.5">
        <div className={`w-2 h-9 rounded-full transition-all duration-150 ${f ? litClass : dimClass}`} />
        <div className={`w-2 h-9 rounded-full transition-all duration-150 ${b ? litClass : dimClass}`} />
      </div>

      {/* Middle segment G */}
      <div className={`w-11 h-2 rounded-full transition-all duration-150 ${g ? litClass : dimClass}`} />

      {/* Middle-lower: E (left) and C (right) */}
      <div className="w-full flex justify-between px-0.5">
        <div className={`w-2 h-9 rounded-full transition-all duration-150 ${e ? litClass : dimClass}`} />
        <div className={`w-2 h-9 rounded-full transition-all duration-150 ${c ? litClass : dimClass}`} />
      </div>

      {/* Bottom segment D */}
      <div className={`w-11 h-2 rounded-full transition-all duration-150 ${d ? litClass : dimClass}`} />
    </div>
  );
}
