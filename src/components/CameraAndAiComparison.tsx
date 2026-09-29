import React, { useState } from 'react';
import { Camera, Eye, Cpu, CheckCircle2, XCircle, Sparkles, Code2, ArrowRight } from 'lucide-react';

export const CameraAndAiComparison: React.FC = () => {
  const [vehicleSpeed, setVehicleSpeed] = useState<number>(75);

  // Calculate skew degree for rolling shutter simulation
  // At 80km/h (22.2 m/s), 1/60s rolling readout causes significant shear
  const skewDeg = Math.min(24, (vehicleSpeed / 120) * 22);
  const blurPx = Math.min(4, (vehicleSpeed / 120) * 3.5);

  return (
    <section id="camera-ai" className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-12">
      <div className="border-b border-slate-800 pb-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
              <Camera className="w-3.5 h-3.5" />
              글로벌 셔터 광학 기술 & 구글 GenAI 비전 파이프라인
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              4. AR0234 글로벌 셔터 vs 롤링 셔터 비교 & Gemini AI 멀티모달 분석
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              고속 주행 차량의 기하학적 왜곡(Jello effect)을 배제하는 센서 원리와 구글 AI 스튜디오 Gemini 모델의 구조화된 JSON 데이터 추출 과정입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: Shutter Technology Comparison & Interactive Speed Slider */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>셔터 방식별 고속 촬영 프레임 왜곡 비교</span>
            </h3>
            <span className="font-mono text-xs text-slate-400">1/2000s 동기화</span>
          </div>

          {/* Interactive Speed Slider for Shutter Distortion */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-medium">차량 주행 속도 시뮬레이션:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{vehicleSpeed} km/h</span>
            </div>
            <input
              type="range"
              min="20"
              max="120"
              value={vehicleSpeed}
              onChange={(e) => setVehicleSpeed(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>20 km/h (경미한 왜곡)</span>
              <span>60 km/h (일반 주행)</span>
              <span>100 km/h (고속 주행)</span>
              <span>120 km/h (심각한 블러)</span>
            </div>
          </div>

          {/* Visual Shutter Frame Compare */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rolling Shutter Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-rose-900/40 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    일반 롤링 셔터 (Rolling)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">행 순차 스캔</span>
                </div>
                
                {/* Simulated License Plate & Car Body with Skew */}
                <div className="h-32 bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  <div
                    style={{
                      transform: `skewX(-${skewDeg}deg)`,
                      filter: `blur(${blurPx}px)`,
                      transition: 'all 0.15s ease-out',
                    }}
                    className="w-full flex flex-col items-center gap-1.5"
                  >
                    <div className="w-24 h-8 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-center">
                      <div className="w-4 h-3 bg-amber-400/80 rounded-sm" />
                    </div>
                    {/* Skewed License Plate */}
                    <div className="px-3 py-1 bg-white text-slate-900 font-mono font-bold text-xs rounded border border-slate-400 shadow">
                      340나 8901
                    </div>
                  </div>

                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-rose-400/90">
                    기울어짐: -{skewDeg.toFixed(1)}°
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-3 space-y-1">
                <div className="text-rose-400 font-semibold">• 픽셀 라인별 순차 노출로 젤로 현상 발생</div>
                <div>• OCR 판독률: <span className="font-bold text-rose-400">42% (판독 실패 위험)</span></div>
              </div>
            </div>

            {/* Global Shutter Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/50 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-emerald-950/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    AR0234 글로벌 셔터
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">전체 동시 노출</span>
                </div>

                {/* Crystal Clear License Plate & Car Body */}
                <div className="h-32 bg-slate-950 rounded-lg border border-emerald-900/50 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="w-24 h-8 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-center">
                      <div className="w-4 h-3 bg-amber-400 rounded-sm" />
                    </div>
                    {/* Crisp License Plate */}
                    <div className="px-3 py-1 bg-white text-slate-950 font-mono font-black text-xs rounded border-2 border-emerald-500 shadow-md">
                      340나 8901
                    </div>
                  </div>

                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-emerald-400 font-bold">
                    기울어짐: 0.0° (완전 직선)
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 mt-3 space-y-1">
                <div className="text-emerald-400 font-semibold">• 모든 230만 픽셀 동시 전하 축적</div>
                <div>• OCR 판독률: <span className="font-bold text-emerald-400">99.4% (선명한 엣지 보존)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Gemini Multimodal Server Integration Details */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>구글 AI 스튜디오 Gemini 멀티모달 분석 파이프라인</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              gemini-3.8-flash
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            라즈베리파이 5의 V4L2로 캡처된 고화질 프레임과 도플러 레이더 텔레메트리는 구글 AI 스튜디오의 
            <strong className="text-indigo-300"> Gemini 3.8 Flash</strong> 멀티모달 모델에 전송되어 엄격한 구조화된 JSON 스키마로 즉시 파싱됩니다.
          </p>

          {/* GenAI Server SDK Code Block */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto shadow-inner">
            <div className="text-slate-500 mb-1 flex items-center justify-between">
              <span>// server.ts - @google/genai Node SDK</span>
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div><span className="text-purple-400">import</span> &#123; GoogleGenAI, Type &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">'@google/genai'</span>;</div>
            <br />
            <div><span className="text-blue-400">const</span> ai = <span className="text-purple-400">new</span> GoogleGenAI(&#123;</div>
            <div>&nbsp;&nbsp;apiKey: process.env.<span className="text-amber-300">GEMINI_API_KEY</span>,</div>
            <div>&nbsp;&nbsp;httpOptions: &#123; headers: &#123; <span className="text-emerald-300">'User-Agent'</span>: <span className="text-emerald-300">'aistudio-build'</span> &#125; &#125;</div>
            <div>&#125;);</div>
            <br />
            <div><span className="text-blue-400">const</span> response = <span className="text-purple-400">await</span> ai.models.generateContent(&#123;</div>
            <div>&nbsp;&nbsp;model: <span className="text-emerald-300">'gemini-3.8-flash'</span>,</div>
            <div>&nbsp;&nbsp;contents: [imagePart, promptText],</div>
            <div>&nbsp;&nbsp;config: &#123;</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;responseMimeType: <span className="text-emerald-300">'application/json'</span>,</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;responseSchema: &#123; <span className="text-slate-400">/* license_plate, vehicle_type, severity... */</span> &#125;</div>
            <div>&nbsp;&nbsp;&#125;</div>
            <div>&#125;);</div>
          </div>

          {/* JSON Field Highlights */}
          <div className="space-y-2 text-xs">
            <div className="text-slate-400 font-semibold text-[11px]">반환되는 핵심 JSON 필드 스키마:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-indigo-400 font-bold">license_plate_number</span>
                <p className="text-[10px] text-slate-400 mt-0.5">정밀 한글 번호판 (예: 340나 8901)</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-indigo-400 font-bold">vehicle_type</span>
                <p className="text-[10px] text-slate-400 mt-0.5">차종 분류 (세단, SUV, 화물 등)</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-rose-400 font-bold">violation_severity</span>
                <p className="text-[10px] text-slate-400 mt-0.5">초과폭에 따른 위험등급 (LOW~CRITICAL)</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold">fine_amount_krw</span>
                <p className="text-[10px] text-slate-400 mt-0.5">도로교통법 기준 과태료 금액 자동 산출</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
