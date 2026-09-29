import React, { useState } from 'react';
import { Zap, BatteryCharging, Sun, Clock, Info, CheckCircle2 } from 'lucide-react';
import { PowerComponent } from '../types';

export const PowerBudgetCalculator: React.FC = () => {
  const [operatingHours, setOperatingHours] = useState<number>(24);
  const [batteryType, setBatteryType] = useState<'lifepo4' | 'agm'>('lifepo4');
  const [systemVoltage, setSystemVoltage] = useState<number>(12);
  const [peakSunHours, setPeakSunHours] = useState<number>(3.5);
  const [includeStrobePeak, setIncludeStrobePeak] = useState<boolean>(true);

  const components: PowerComponent[] = [
    { name: '라즈베리파이 5 (중앙 제어기)', desc: 'BCM2712 Quad-core, UART/GPIO 통신 및 V4L2 프레임 수신', watts: 2.8, color: 'bg-indigo-500', voltage: '5V/3A DC' },
    { name: 'LTE Cat.4 무선 통신 모뎀', desc: 'VPN 원격 접속, 클라우드 전송 및 SoftAP 관리', watts: 2.5, color: 'bg-violet-500', voltage: '12V->5V 레귤레이터' },
    { name: 'AR0234 글로벌 셔터 카메라', desc: 'MIPI CSI-2 2-Lane, 고속 프레임 동시 노출', watts: 1.0, color: 'bg-emerald-500', voltage: '3.3V 내부 공급' },
    { name: '74HC595 188 LED 속도 표출보드', desc: '직렬 쉬프트 레지스터 2개 데이지체인 구동', watts: 0.6, color: 'bg-amber-500', voltage: '12V 정전류 구동' },
    { name: 'MPPT 태양광 충전 컨트롤러 & 센서', desc: '자체 소비 전력 및 24GHz 레이더 대기', watts: 0.5, color: 'bg-slate-400', voltage: '12V 배터리 버스' },
    ...(includeStrobePeak
      ? [{ name: '능동형 고휘도 경광등 (가중 평균)', desc: '과속 감지 시 100ms/500ms 스트로브 점멸 소비 전력', watts: 0.8, color: 'bg-rose-500', voltage: '12V MOSFET 직접 구동' }]
      : []),
  ];

  const totalBaseWatts = components.reduce((acc, c) => acc + c.watts, 0);
  const dailyWattHours = totalBaseWatts * operatingHours;
  
  // Depth of Discharge: LiFePO4 80%, AGM 50%
  const dod = batteryType === 'lifepo4' ? 0.8 : 0.5;
  const safetyMargin = 1.25; // 25% safety buffer for cloudy days
  const requiredAh = (dailyWattHours / systemVoltage / dod) * safetyMargin;
  
  // Solar panel sizing: dailyWh / peakSunHours / efficiency(0.75)
  const recommendedSolarPanelWatt = (dailyWattHours / peakSunHours) / 0.75;

  return (
    <section id="overview" className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-12">
      <div className="border-b border-slate-800 pb-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" />
              하드웨어 전력 분석 & 태양광 전원 설계
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              1. 시스템 구성품별 소모 전력 및 독립형 배터리 용량 산출
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              상시 상용전원이 없는 도심 외곽이나 어린이보호구역 지주형 단속 장비의 24시간 연속 운용을 위한 전력 예산(Power Budget)입니다.
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400">총 기본 소비전력: </span>
            <span className="text-amber-400 font-bold text-sm">{totalBaseWatts.toFixed(1)} W</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Component Breakdown & Visual Bar */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-between">
              <span>구성품별 전력 비중 (총 {totalBaseWatts.toFixed(1)}W)</span>
              <label className="flex items-center gap-2 text-xs font-normal text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStrobePeak}
                  onChange={(e) => setIncludeStrobePeak(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 w-3.5 h-3.5"
                />
                <span>경광등 동작 부하 포함 (+0.8W)</span>
              </label>
            </h3>

            {/* Stacked Percentage Bar */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-900 mb-5 p-0.5 border border-slate-800">
              {components.map((c, i) => {
                const pct = (c.watts / totalBaseWatts) * 100;
                return (
                  <div
                    key={i}
                    style={{ width: `${pct}%` }}
                    className={`${c.color} h-full transition-all duration-300 relative group`}
                    title={`${c.name}: ${c.watts}W (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Component Detail Rows */}
            <div className="space-y-3">
              {components.map((c, idx) => {
                const pct = ((c.watts / totalBaseWatts) * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${c.color}`} />
                      <div>
                        <div className="font-bold text-slate-200">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.desc} · <span className="font-mono text-slate-500">{c.voltage}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-200">{c.watts.toFixed(1)} W</div>
                      <div className="text-[10px] font-mono text-slate-500">{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              라즈베리파이 5(2.8W)와 무선 LTE 라우터(2.5W)가 총 전력의 약 65% 이상을 차지합니다. 
              야간이나 조도 부족 시 구동되는 적외선(IR) 플래시의 경우 단속 셔터 순간에만 20ms 펄스로 구동되므로 일일 누적 에너지 영향은 미미합니다.
            </p>
          </div>
        </div>

        {/* Right: Interactive Battery & Solar Panel Calculator */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3">
              <BatteryCharging className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-white">독립형 태양광 & 배터리 용량 시뮬레이터</h3>
            </div>

            {/* Inputs */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-medium text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    연속 운용 목표 시간:
                  </label>
                  <span className="font-mono font-bold text-amber-400 text-sm">{operatingHours} 시간</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="72"
                  step="6"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>6시간 (주간 단속)</span>
                  <span>24시간 (1일)</span>
                  <span>48시간 (2일 흐림)</span>
                  <span>72시간 (3일 백업)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">배터리 종류 (DOD):</label>
                  <select
                    value={batteryType}
                    onChange={(e) => setBatteryType(e.target.value as any)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="lifepo4">인산철 LiFePO4 (80% DOD)</option>
                    <option value="agm">산업용 AGM (50% DOD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">시스템 버스 전압:</label>
                  <select
                    value={systemVoltage}
                    onChange={(e) => setSystemVoltage(parseInt(e.target.value))}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value={12}>12V DC 표준</option>
                    <option value={24}>24V DC 고효율</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">일평균 유효 일조시간 (PSH):</label>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="2"
                    max="6"
                    value={peakSunHours}
                    onChange={(e) => setPeakSunHours(parseFloat(e.target.value) || 3.5)}
                    className="w-24 p-1.5 bg-slate-900 border border-slate-700 rounded-md font-mono text-center font-bold text-slate-200"
                  />
                  <span className="text-slate-400">시간/일 (한국 평균 3.2~3.8시간)</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-900/60 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>총 일일 소비 전력량:</span>
                <span className="text-indigo-300 font-bold text-sm">{dailyWattHours.toFixed(1)} Wh</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>권장 {systemVoltage}V 배터리 용량:</span>
                <div className="text-right">
                  <span className="text-emerald-400 font-extrabold text-base">{requiredAh.toFixed(1)} Ah</span>
                  <div className="text-[10px] text-slate-400">안전율 125% & 방전율 {dod * 100}% 고려</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-2">
                <span>권장 태양광 패널 출력:</span>
                <div className="text-right">
                  <span className="text-amber-400 font-extrabold text-base">{recommendedSolarPanelWatt.toFixed(0)} Wp</span>
                  <div className="text-[10px] text-slate-400">MPPT 75% 시스템 효율 기준</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                현장 추천 스펙: <strong>{systemVoltage}V {Math.ceil(requiredAh / 5) * 5}Ah 인산철 배터리</strong> + <strong>{Math.ceil(recommendedSolarPanelWatt / 20) * 20}W 고효율 모노 솔라 패널</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
