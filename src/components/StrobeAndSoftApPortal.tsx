import React, { useState } from 'react';
import { Sliders, Wifi, Smartphone, Save, Check, RefreshCw, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { SoftApConfig } from '../types';

interface StrobeAndSoftApPortalProps {
  config: SoftApConfig;
  setConfig: React.Dispatch<React.SetStateAction<SoftApConfig>>;
}

export const StrobeAndSoftApPortal: React.FC<StrobeAndSoftApPortalProps> = ({ config, setConfig }) => {
  // Test controls for live strobe state
  const [testSpeed, setTestSpeed] = useState<number>(38);
  const [testDist, setTestDist] = useState<number>(12);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Evaluate current state
  let strobeState: 'IDLE' | 'WARNING' | 'DANGER' = 'IDLE';
  if (testSpeed >= config.v_limit) {
    if (testDist > config.d_danger) {
      strobeState = 'WARNING';
    } else {
      strobeState = 'DANGER';
    }
  }

  const handleConfigChange = <K extends keyof SoftApConfig>(key: K, value: SoftApConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <section id="strobe-ap" className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-12">
      <div className="border-b border-slate-800 pb-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              능동형 경보 알고리즘 & 현장 무선 관리 포털
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              3. 거리·속도 연동 능동 경광등 상태 머신 & Wi-Fi SoftAP 포털
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              과속 차량의 접근 거리에 따른 차등 경보 및 현장 유지보수 기사가 스마트폰으로 간편하게 단속 기준을 조정하는 SoftAP 구조입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Strobe Light Active State Machine (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>3단계 능동 경보 상태 머신 (Active Strobe FSM)</span>
              </h3>
              <span className="font-mono text-xs text-slate-400">GPIO 23 (Relay / MOSFET)</span>
            </div>

            {/* Test Sliders for live state machine */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
              <div className="text-slate-300 font-bold flex items-center justify-between">
                <span>상태 머신 인터랙티브 테스트 입력:</span>
                <span className="font-mono text-slate-400">단속 기준: {config.v_limit}km/h | 위험 거리: {config.d_danger}m</span>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>차량 속도:</span>
                  <span className="font-mono font-bold text-amber-400">{testSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="80"
                  value={testSpeed}
                  onChange={(e) => setTestSpeed(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>접근 거리:</span>
                  <span className="font-mono font-bold text-cyan-400">{testDist} m</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={testDist}
                  onChange={(e) => setTestDist(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Live Strobe Beacon Simulation Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="flex items-center gap-4">
                {/* Physical Beacon Visualizer */}
                <div className="relative">
                  <div className="w-20 h-24 rounded-2xl bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center p-2 shadow-inner">
                    {/* Strobe bulb */}
                    <div
                      className={`w-14 h-14 rounded-full transition-all duration-150 flex items-center justify-center ${
                        strobeState === 'DANGER'
                          ? 'bg-rose-600 flashing-danger-beacon'
                          : strobeState === 'WARNING'
                          ? 'bg-amber-500 flashing-warning-beacon'
                          : 'bg-slate-800'
                      }`}
                    >
                      <span className="text-xl">
                        {strobeState === 'DANGER' ? '🚨' : strobeState === 'WARNING' ? '⚠️' : '⚪'}
                      </span>
                    </div>
                    {/* Beacon base */}
                    <div className="w-16 h-2 bg-slate-700 rounded-b mt-2" />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-1">현재 경광등 출력 상태:</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-extrabold ${
                      strobeState === 'DANGER'
                        ? 'text-rose-400'
                        : strobeState === 'WARNING'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}>
                      {strobeState === 'DANGER' && '위험 고속 점멸 (100ms 펄스)'}
                      {strobeState === 'WARNING' && '주의 완만 점멸 (500ms 펄스)'}
                      {strobeState === 'IDLE' && '소등 상태 (OFF / 0V 대기)'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    GPIO 23 출력: <span className="font-bold text-white">{strobeState === 'IDLE' ? 'LOW (0V)' : 'PWM Toggling (3.3V)'}</span>
                  </div>
                </div>
              </div>

              {/* State Indicator Pills */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 border ${
                  strobeState === 'IDLE'
                    ? 'bg-slate-800 text-slate-200 border-slate-600 shadow-sm'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800/80'
                }`}>
                  <span>1. 정상 주행 (v &lt; {config.v_limit})</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700">소등</span>
                </div>

                <div className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 border ${
                  strobeState === 'WARNING'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500 shadow-lg shadow-amber-900/30'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800/80'
                }`}>
                  <span>2. 원거리 과속 (d &gt; {config.d_danger}m)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900 text-amber-300">500ms</span>
                </div>

                <div className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 border ${
                  strobeState === 'DANGER'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-lg shadow-rose-900/40'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800/80'
                }`}>
                  <span>3. 근접 위험 (d ≤ {config.d_danger}m)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900 text-rose-300">100ms + 캡처</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Smartphone SoftAP Web Portal Mockup (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-slate-950 rounded-3xl p-5 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-10 h-1.5 bg-slate-900 rounded-full" />
            </div>

            {/* Mobile Web Browser Top Bar */}
            <div className="bg-slate-900 rounded-xl p-2.5 mb-4 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                <span className="font-bold">Traffic_Radar_AP</span>
              </div>
              <span className="font-mono text-slate-400 text-[10px]">http://192.168.4.1</span>
            </div>

            {/* In-Phone App Title */}
            <div className="border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  단속 장비 무선 설정 포털
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono">
                  FastAPI v0.110
                </span>
              </div>
            </div>

            {/* Interactive Form Fields inside Phone */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">단속 구역 명칭:</label>
                <input
                  type="text"
                  value={config.road_name}
                  onChange={(e) => handleConfigChange('road_name', e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-medium text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">단속 기준 속도:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={config.v_limit}
                      onChange={(e) => handleConfigChange('v_limit', parseInt(e.target.value) || 30)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-center"
                    />
                    <span className="text-slate-400 text-[10px]">km/h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">위험 임계 거리:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={config.d_danger}
                      onChange={(e) => handleConfigChange('d_danger', parseInt(e.target.value) || 15)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-400 font-mono font-bold text-center"
                    />
                    <span className="text-slate-400 text-[10px]">m</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">주의 점멸 주기:</label>
                  <input
                    type="number"
                    step="50"
                    value={config.t_on_warning}
                    onChange={(e) => handleConfigChange('t_on_warning', parseInt(e.target.value) || 500)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">위험 점멸 주기:</label>
                  <input
                    type="number"
                    step="20"
                    value={config.t_on_danger}
                    onChange={(e) => handleConfigChange('t_on_danger', parseInt(e.target.value) || 100)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-medium">구글 AI Studio 자동 분석:</span>
                <input
                  type="checkbox"
                  checked={config.auto_gemini_upload}
                  onChange={(e) => handleConfigChange('auto_gemini_upload', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                />
              </div>

              {/* JSON Live Preview */}
              <div className="mt-2">
                <div className="text-[10px] text-slate-500 font-mono mb-1">/etc/speed_cam/config.json:</div>
                <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto">
{JSON.stringify({
  v_limit: config.v_limit,
  d_danger: config.d_danger,
  t_on_warning: config.t_on_warning,
  t_on_danger: config.t_on_danger,
  road_name: config.road_name,
  auto_gemini_upload: config.auto_gemini_upload,
}, null, 2)}
                </pre>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveConfig}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>설정 저장 완료 (Daemon Reloaded)</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>라즈베리파이 설정 저장 및 적용</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
