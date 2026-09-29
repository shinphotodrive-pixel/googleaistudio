import React, { useState } from 'react';
import { Radio, Cpu, Sliders, Play, RotateCcw, ArrowRight } from 'lucide-react';

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

export const RadarAndSegmentDisplay: React.FC = () => {
  // Radar state
  const [speedKmh, setSpeedKmh] = useState<number>(55);
  const [radarAngle, setRadarAngle] = useState<number>(15);
  const [carrierFreqGhz, setCarrierFreqGhz] = useState<number>(24.125);

  // 188 LED state
  const [displaySpeed, setDisplaySpeed] = useState<number>(55);
  const [animatingShift, setAnimatingShift] = useState<boolean>(false);
  const [clockStep, setClockStep] = useState<number>(16);

  // Doppler Calculation
  // fd = (2 * v * f0 * cos(theta)) / c
  const v_ms = speedKmh / 3.6;
  const f0 = carrierFreqGhz * 1e9;
  const c = 299792458; // m/s
  const thetaRad = (radarAngle * Math.PI) / 180;
  const dopplerFreqHz = (2 * v_ms * f0 * Math.cos(thetaRad)) / c;
  const trueSpeedCompensated = speedKmh / Math.cos(thetaRad);

  // Extract digits for 188 display
  const is100Lit = displaySpeed >= 100;
  const tensDigit = Math.floor((displaySpeed % 100) / 10).toString();
  const onesDigit = (displaySpeed % 10).toString();

  const tensData = SEGMENT_MAP[tensDigit] || SEGMENT_MAP['0'];
  const onesData = SEGMENT_MAP[onesDigit] || SEGMENT_MAP['0'];

  // Start bit-bang animation
  const runBitBangAnimation = () => {
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

  return (
    <section id="radar-led" className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-12">
      <div className="border-b border-slate-800 pb-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              <Radio className="w-3.5 h-3.5" />
              레이더 물리학 & 디지털 로직 제어
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              2. 24GHz 도플러 레이더 수신 및 74HC595 188 LED 디스플레이
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              밀리미터파 도플러 주파수 편이($f_d$) 물리 연산과 라즈베리파이 5의 3개 GPIO만으로 데이지체인 제어하는 188 세그먼트 메커니즘입니다.
            </p>
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
            f<sub>d</sub> = (2 · v · f<sub>0</sub> · cos θ) / c
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 font-medium">차량 실제 주행 속도 (v):</label>
                <span className="font-mono font-bold text-amber-400 text-sm">{speedKmh} km/h ({(v_ms).toFixed(1)} m/s)</span>
              </div>
              <input
                type="range"
                min="10"
                max="160"
                value={speedKmh}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSpeedKmh(val);
                  setDisplaySpeed(val);
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
                <label className="block text-slate-400 mb-1">송신 반송파 주파수 (f<sub>0</sub>):</label>
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
                <span>계산된 도플러 비트 주파수 (f<sub>d</sub>):</span>
                <span className="text-indigo-400 font-bold text-sm">{Math.round(dopplerFreqHz).toLocaleString()} Hz</span>
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

            {/* Raw UART Packet Inspector */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
              <div className="text-slate-500 mb-1 flex items-center justify-between">
                <span>/dev/ttyAMA0 실시간 시리얼 패킷 프레임:</span>
                <span className="text-emerald-400 text-[10px]">CRC 검증 OK</span>
              </div>
              <div className="text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto">
                0xFF 0xAA 0x04 0x00 0x{speedKmh.toString(16).toUpperCase().padStart(2, '0')} 0x01 0x{((0xFF + 0xAA + 0x04 + speedKmh + 0x01) % 256).toString(16).toUpperCase().padStart(2, '0')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                <span>[헤더: FF AA]</span>
                <span>[길이: 04]</span>
                <span>[속도: {speedKmh} km/h]</span>
                <span>[방향: 접근 01]</span>
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
            <span className="text-[11px] font-mono text-amber-400">GPIO 17/27/22</span>
          </div>

          {/* Interactive Speed Controller for 188 Display */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-medium">188 LED 표시 속도 테스트:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="199"
                  value={displaySpeed}
                  onChange={(e) => setDisplaySpeed(Math.max(0, Math.min(199, parseInt(e.target.value) || 0)))}
                  className="w-20 p-1 bg-slate-900 border border-slate-700 rounded text-center font-mono font-bold text-amber-400 text-sm"
                />
                <span className="font-mono text-slate-400">km/h</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={runBitBangAnimation}
                disabled={animatingShift}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>16비트 SPI 시프트 클럭 애니메이션 실행</span>
              </button>

              <button
                onClick={() => setDisplaySpeed(30)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-800 transition"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Authentic 188 LED PCB Board Visualizer */}
          <div className="led-box p-6 rounded-2xl flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden">
            {/* PCB silk screen text */}
            <div className="absolute top-2 left-4 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              SPEED ENFORCEMENT DISPLAY PCB REV 2.4
            </div>
            <div className="absolute top-2 right-4 text-[9px] font-mono text-slate-600">
              74HC595 × 2 CATHODE
            </div>

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
              <SevenSegmentSVG segs={tensData.segs} />
              <span className="text-[11px] font-mono text-amber-400 font-bold mt-1">
                '{tensDigit}' ({tensData.hex})
              </span>
            </div>

            {/* 1's place (7-Segment SVG Graphic) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 mb-1">일의 자리</span>
              <SevenSegmentSVG segs={onesData.segs} />
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
              <strong>SRCLK</strong> (GPIO 27): 상승 에지(Rising Edge) 시 쉬프트 레지스터 1비트 이동 &nbsp;•&nbsp;
              <strong>RCLK</strong> (GPIO 22): 16비트 완료 후 래치 펄스(Rising Edge) 인가 시 LED 일괄 출력.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Clean 7-Segment HTML Component without complex SVG
function SevenSegmentSVG({ segs }: { segs: boolean[] }) {
  // [A, B, C, D, E, F, G]
  const [a, b, c, d, e, f, g] = segs;

  const litClass = "bg-rose-500 shadow-[0_0_12px_#ef4444,0_0_24px_rgba(239,68,68,0.6)]";
  const dimClass = "bg-slate-900 opacity-20";

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
