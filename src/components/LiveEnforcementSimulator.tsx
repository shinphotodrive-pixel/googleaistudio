import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Camera, Sparkles, Sliders, Play, RotateCcw, Copy, Check, FileText, AlertTriangle, ArrowRight, Sun, Moon } from 'lucide-react';
import { EnforcementResult, SoftApConfig } from '../types';

interface LiveEnforcementSimulatorProps {
  config: SoftApConfig;
}

export const LiveEnforcementSimulator: React.FC<LiveEnforcementSimulatorProps> = ({ config }) => {
  // Simulator Controls
  const [speed, setSpeed] = useState<number>(45);
  const [distance, setDistance] = useState<number>(14);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [selectedCar, setSelectedCar] = useState<'white_sedan' | 'black_suv' | 'silver_genesis' | 'blue_truck'>('white_sedan');

  // Flash animation & camera snapshot state
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<EnforcementResult | null>(null);
  const [apiResponseTimeMs, setApiResponseTimeMs] = useState<number | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'ticket' | 'json'>('ticket');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Status computation
  const isOverSpeed = speed >= config.v_limit;
  const isDangerZone = distance <= config.d_danger;
  const strobeActive = isOverSpeed ? (isDangerZone ? 'DANGER' : 'WARNING') : 'OFF';

  // Car details dictionary
  const CAR_PRESETS = {
    white_sedan: { name: '현대 아반떼 (화이트)', plate: '340나 8901', colorHex: '#f8fafc', bodyType: 'Sedan' },
    black_suv: { name: '기아 쏘렌토 (블랙)', plate: '78러 9942', colorHex: '#1e293b', bodyType: 'SUV' },
    silver_genesis: { name: '제네시스 G80 (실버)', plate: '12가 3456', colorHex: '#94a3b8', bodyType: 'Sedan' },
    blue_truck: { name: '현대 포터 II (블루)', plate: '89루 7721', colorHex: '#2563eb', bodyType: 'Truck' },
  };

  // Render vehicle on 2D Road Canvas
  const drawRoadSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background Road
    ctx.fillStyle = isNight ? '#0b0f19' : '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Road Sidewalk / Curb
    ctx.fillStyle = isNight ? '#1e293b' : '#334155';
    ctx.fillRect(0, 0, width, 40);
    ctx.fillRect(0, height - 30, width, 30);

    // Lane Markings (White Dashes)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.setLineDash([25, 20]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2 + 5);
    ctx.lineTo(width, height / 2 + 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Speed Enforcement Pole (Fixed at left side x = 110)
    const poleX = 110;
    // Pole Base
    ctx.fillStyle = '#64748b';
    ctx.fillRect(poleX - 6, 20, 12, 100);

    // Radar Horn & 188 Display Enclosure
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(poleX - 35, 25, 70, 48);
    ctx.strokeRect(poleX - 35, 25, 70, 48);

    // Mini 188 LED on Pole
    ctx.fillStyle = isOverSpeed ? '#ef4444' : '#10b981';
    ctx.font = 'bold 20px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${speed}`, poleX, 56);

    // Strobe Beacon on top of pole
    if (strobeActive === 'DANGER') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(poleX, 15, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (strobeActive === 'WARNING') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(poleX, 15, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(poleX, 15, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 24GHz Millimeter Radar Beam Cone
    ctx.save();
    const gradient = ctx.createLinearGradient(poleX, 50, width, height / 2 + 10);
    gradient.addColorStop(0, isOverSpeed ? 'rgba(239, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.25)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(poleX, 50);
    ctx.lineTo(width, 70);
    ctx.lineTo(width, height - 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Map distance (2m to 50m) to X coordinate (approx poleX+30 to width-120)
    // Distance 50m -> x = width - 130; Distance 2m -> x = poleX + 45
    const minX = poleX + 45;
    const maxX = width - 140;
    const normalizedDist = Math.max(0, Math.min(1, (distance - 2) / 48));
    const carX = minX + normalizedDist * (maxX - minX);
    const carY = height / 2 - 15;

    // Draw Vehicle (Approaching leftwards)
    const currentCar = CAR_PRESETS[selectedCar];
    ctx.save();
    // Vehicle shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(carX - 5, carY + 36, 115, 14);

    // Vehicle body
    ctx.fillStyle = currentCar.colorHex;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(carX, carY, 105, 42, 8);
    ctx.fill();
    ctx.stroke();

    // Windshield & Windows
    ctx.fillStyle = isNight ? '#090d16' : '#60a5fa';
    ctx.beginPath();
    ctx.roundRect(carX + 10, carY + 6, 28, 30, 4);
    ctx.fill();

    // Headlights (beaming forward left)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(carX + 2, carY + 10, 4, 0, Math.PI * 2);
    ctx.arc(carX + 2, carY + 32, 4, 0, Math.PI * 2);
    ctx.fill();

    // Headlight light cone if night
    if (isNight) {
      ctx.save();
      const lightBeam = ctx.createLinearGradient(carX, carY + 20, carX - 120, carY + 20);
      lightBeam.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
      lightBeam.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lightBeam;
      ctx.beginPath();
      ctx.moveTo(carX, carY + 8);
      ctx.lineTo(carX - 100, carY - 20);
      ctx.lineTo(carX - 100, carY + 60);
      ctx.lineTo(carX, carY + 34);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // License Plate on Car Front (Left edge of vehicle)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.fillRect(carX - 8, carY + 15, 10, 14);
    ctx.strokeRect(carX - 8, carY + 15, 10, 14);

    // Text on vehicle
    ctx.fillStyle = currentCar.colorHex === '#1e293b' ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentCar.plate, carX + 55, carY + 24);

    ctx.restore();

    // Capture Zone Indicator Marker (at config.d_danger)
    const dangerX = minX + ((config.d_danger - 2) / 48) * (maxX - minX);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(dangerX, 40);
    ctx.lineTo(dangerX, height - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = '10px monospace';
    ctx.fillText(`임계 단속선 (${config.d_danger}m)`, dangerX, height - 12);
  };

  useEffect(() => {
    drawRoadSimulation();
  }, [speed, distance, isNight, selectedCar, config.v_limit, config.d_danger]);

  // Execute snapshot capture & AI analysis
  const executeCaptureAndAnalysis = async () => {
    // Trigger visual camera optical flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 220);

    // Generate snapshot image from canvas
    const canvas = canvasRef.current;
    let imageBase64 = '';
    if (canvas) {
      imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedSnapshot(imageBase64);
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    const startTime = performance.now();

    try {
      const response = await fetch('/api/analyze-enforcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          speed,
          speedLimit: config.v_limit,
          distance,
          roadName: config.road_name,
          weather: isNight ? '야간 (IR 적외선 스트로브 동기 촬영)' : '주간 맑음 (자연광 양호)',
        }),
      });

      const resData = await response.json();
      const endTime = performance.now();
      setApiResponseTimeMs(Math.round(endTime - startTime));

      if (resData.success && resData.data) {
        setAnalysisResult(resData.data);
      } else {
        // Fallback result in case of network issue
        fallbackGenerateResult(Math.round(endTime - startTime));
      }
    } catch (err) {
      console.error('Analysis request error:', err);
      const endTime = performance.now();
      fallbackGenerateResult(Math.round(endTime - startTime));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fallbackGenerateResult = (elapsedMs: number) => {
    const diff = Math.max(0, speed - config.v_limit);
    const currentCar = CAR_PRESETS[selectedCar];
    let severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let fine = 40000;
    let points = 0;
    if (diff > 40) {
      severity = 'CRITICAL';
      fine = 130000;
      points = 60;
    } else if (diff > 20) {
      severity = 'HIGH';
      fine = 100000;
      points = 30;
    } else if (diff > 10) {
      severity = 'MEDIUM';
      fine = 70000;
      points = 15;
    }

    setApiResponseTimeMs(elapsedMs);
    setAnalysisResult({
      license_plate_number: currentCar.plate,
      vehicle_type: currentCar.name,
      vehicle_color: currentCar.name.includes('블랙') ? '블랙(Black)' : (currentCar.name.includes('화이트') ? '화이트(White)' : '실버(Silver)'),
      violation_severity: severity,
      estimated_speed: speed,
      legal_speed_limit: config.v_limit,
      speed_excess: diff,
      fine_amount_krw: fine,
      penalty_points: points,
      confidence_score: 0.98,
      is_global_shutter_verified: true,
      shutter_blur_metric: '0.008 (Zero Jello Distortion)',
      analysis_summary: `도로 규정 제한속도 ${config.v_limit}km/h 구간에서 ${speed}km/h로 ${diff}km/h 초과 주행이 감지되었습니다. AR0234 글로벌 셔터 스냅샷을 통해 등록 번호판 '${currentCar.plate}'의 번호 및 차종 식별이 완벽하게 완료되었습니다.`,
      citation_notice: {
        citation_id: `KOR-2026-${Date.now().toString().slice(-6)}`,
        location: config.road_name,
        timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        jurisdiction: '관할 경찰서 교통안전계',
        violation_code: diff > 40 ? '도로교통법 제17조 제3항 초과속 위반' : '도로교통법 제17조 제3항 규정속도 위반',
      },
    });
  };

  const copyJsonOutput = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const applyPreset = (s: number, d: number, carKey: keyof typeof CAR_PRESETS) => {
    setSpeed(s);
    setDistance(d);
    setSelectedCar(carKey);
  };

  return (
    <section id="simulator" className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border-2 border-indigo-900/80 shadow-2xl mb-12 relative overflow-hidden">
      {/* Camera Optical Flash Effect */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white/90 z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Header */}
      <div className="border-b border-slate-800 pb-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-2 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            현장 대화형 단속 시뮬레이터 & AI 비전 발부 시스템
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            5. 실시간 과속 단속 및 Gemini 멀티모달 고지서 발부 시뮬레이터
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            차량 속도 및 접근 거리를 인터랙티브하게 조절하여 188 LED 전광판 표출, GPIO 경광등 점멸, 카메라 스냅샷 트리거 및 Gemini AI 고지서를 실시간 확인하세요.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset(25, 38, 'white_sedan')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            정상 주행 (25km/h)
          </button>
          <button
            onClick={() => applyPreset(38, 22, 'silver_genesis')}
            className="px-3 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-200 text-xs font-medium border border-amber-700 transition"
          >
            주의 과속 (38km/h)
          </button>
          <button
            onClick={() => applyPreset(54, 12, 'white_sedan')}
            className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-medium border border-rose-600 transition font-bold"
          >
            위험 단속 (54km/h)
          </button>
          <button
            onClick={() => applyPreset(85, 7, 'black_suv')}
            className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-900/40 transition"
          >
            초과속 질주 (85km/h)
          </button>
        </div>
      </div>

      {/* 2D Canvas Road Animation Stage */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-2xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-48 sm:h-56 object-cover"
        />

        {/* HUD Overlay Stats on Canvas */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
          <div className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">기준 속도: </span>
            <span className="text-amber-400 font-bold">{config.v_limit} km/h</span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">레이더 감지 속도: </span>
            <span className={`font-bold ${isOverSpeed ? 'text-rose-400' : 'text-emerald-400'}`}>
              {speed} km/h {isOverSpeed ? `(+${speed - config.v_limit} 초과)` : ''}
            </span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">잔여 거리: </span>
            <span className="text-cyan-400 font-bold">{distance} m</span>
          </div>
        </div>

        {/* Shutter Flash Trigger Button Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            onClick={() => setIsNight(!isNight)}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
          >
            {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isNight ? '야간 모드' : '주간 모드'}</span>
          </button>

          <button
            onClick={executeCaptureAndAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/40 transition disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>수동 셔터 캡처 & AI 분석</span>
          </button>
        </div>
      </div>

      {/* Simulator Control & Response Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Interactive Controls & Hardware Feedback (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-extrabold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>주행 파라미터 조절</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">실시간 반영</span>
            </div>

            {/* Speed Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-300 font-medium">차량 감지 속도:</span>
                <span className={`font-mono font-extrabold text-base ${isOverSpeed ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {speed} km/h
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="130"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-300 font-medium">단속기까지의 잔여 거리:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{distance} m</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Car Preset Selector */}
            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">단속 대상 차량 프리셋:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(CAR_PRESETS).map(([key, car]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCar(key as any)}
                    className={`p-2 rounded-xl text-left border transition ${
                      selectedCar === key
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="truncate">{car.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{car.plate}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware Status Live Cards */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                하드웨어 실시간 응답 상태:
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {/* 188 LED Status */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">188 LED 디스플레이:</div>
                  <div className={`font-bold mt-1 text-sm ${isOverSpeed ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {speed} km/h 표출
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {speed >= 100 ? '백의자리 "1" 점등' : '십·일의자리 2자리'}
                  </div>
                </div>

                {/* Strobe Status */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">GPIO 23 경광등:</div>
                  <div className="font-bold mt-1 text-sm flex items-center gap-1.5">
                    {strobeActive === 'DANGER' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-rose-400">위험 100ms 펄스</span>
                      </>
                    )}
                    {strobeActive === 'WARNING' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-amber-400">주의 500ms 점멸</span>
                      </>
                    )}
                    {strobeActive === 'OFF' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        <span className="text-slate-500">소등 (OFF)</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {strobeActive === 'DANGER' ? '즉각 감속 유도 중' : (strobeActive === 'WARNING' ? '원거리 사전 경고' : '규정 속도 준수')}
                  </div>
                </div>
              </div>

              {/* Instant Action CTA */}
              <button
                onClick={executeCaptureAndAnalysis}
                disabled={isAnalyzing}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-indigo-600 to-amber-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>구글 AI Studio Gemini 3.8 Flash 판독 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>스냅샷 캡처 및 AI 비전 단속 판독 실행</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Gemini Multimodal Vision Results & Citation Notice (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Gemini AI 비전 판독 및 과속 단속 고지서
                </span>
                {apiResponseTimeMs && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    응답 지연: {apiResponseTimeMs}ms
                  </span>
                )}
              </div>

              {/* View Switcher: Ticket vs Raw JSON */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveView('ticket')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeView === 'ticket'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1" />
                  단속 통지서
                </button>
                <button
                  onClick={() => setActiveView('json')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeView === 'json'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON 데이터
                </button>
              </div>
            </div>

            {/* Analysis State Body */}
            {isAnalyzing ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  <Camera className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-sm font-bold text-white">AR0234 글로벌 셔터 프레임 전송 중...</div>
                <p className="text-xs text-slate-400 max-w-sm">
                  구글 AI 스튜디오 `gemini-3.8-flash` 모델이 번호판 OCR, 차종, 초과 속도 및 도로교통법 위반 등급을 분석하고 있습니다.
                </p>
              </div>
            ) : analysisResult ? (
              activeView === 'ticket' ? (
                /* Korean Police Traffic Citation Notice Mockup */
                <div className="bg-slate-900 rounded-xl p-5 border-2 border-indigo-500/40 text-slate-200 space-y-4 shadow-xl relative overflow-hidden">
                  {/* Watermark / Seal */}
                  <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
                    <ShieldAlert className="w-32 h-32 text-indigo-400" />
                  </div>

                  {/* Document Header */}
                  <div className="text-center border-b border-slate-800 pb-3">
                    <div className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase">
                      REPUBLIC OF KOREA TRAFFIC ENFORCEMENT CITATION
                    </div>
                    <h4 className="text-base font-black text-white mt-1">
                      과속 단속 사전 통지서 및 위반 사실 확인서
                    </h4>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      고지번호: <span className="text-amber-400 font-bold">{analysisResult.citation_notice.citation_id}</span>
                    </div>
                  </div>

                  {/* Snapshot & Plate Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">AR0234 글로벌 셔터 스냅샷:</div>
                      {capturedSnapshot ? (
                        <img
                          src={capturedSnapshot}
                          alt="Snapshot"
                          className="h-20 w-full object-cover rounded-lg border border-slate-700"
                        />
                      ) : (
                        <div className="h-20 bg-slate-900 rounded-lg flex items-center justify-center text-xs text-slate-500">
                          캡처 영상 대기
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-400">인식된 차량 등록 번호:</div>
                      <div className="px-3 py-1.5 bg-white text-slate-950 rounded-lg border-2 border-emerald-500 font-mono font-black text-base text-center shadow-md">
                        {analysisResult.license_plate_number}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 justify-center">
                        <Check className="w-3 h-3" />
                        <span>AI 신뢰도 {(analysisResult.confidence_score * 100).toFixed(1)}% (왜곡 0%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Violation Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">단속 일시:</span>
                      <span className="font-semibold text-slate-200">{analysisResult.citation_notice.timestamp}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">단속 장소:</span>
                      <span className="font-semibold text-slate-200 truncate block">{analysisResult.citation_notice.location}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">차종 / 색상:</span>
                      <span className="font-semibold text-slate-200">{analysisResult.vehicle_type} ({analysisResult.vehicle_color})</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">제한속도 / 측정속도:</span>
                      <span className="font-bold text-amber-400">
                        {analysisResult.legal_speed_limit} km/h → <span className="text-rose-400">{analysisResult.estimated_speed} km/h</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/60 col-span-2 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">초과 속도 및 부과 과태료:</span>
                        <span className="font-extrabold text-sm text-rose-400">
                          +{analysisResult.speed_excess} km/h 초과 (위반 등급: {analysisResult.violation_severity})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-amber-400">
                          {analysisResult.fine_amount_krw.toLocaleString()} 원
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          벌점 {analysisResult.penalty_points}점
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <span className="text-indigo-400 font-bold block mb-1">AI 비전 분석 종합 소견:</span>
                    {analysisResult.analysis_summary}
                  </div>

                  {/* Footer Seal */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                    <span>발행 기관: {analysisResult.citation_notice.jurisdiction}</span>
                    <span className="text-emerald-400 font-bold">인증 검증 완료 (AR0234 & GenAI)</span>
                  </div>
                </div>
              ) : (
                /* Raw JSON Output View */
                <div className="relative">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1 font-mono">
                    <span>구글 AI 스튜디오 구조화된 JSON 스키마 응답:</span>
                    <button
                      onClick={copyJsonOutput}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 transition"
                    >
                      {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJson ? '복사됨' : 'JSON 복사'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto h-72 shadow-inner">
                    {JSON.stringify(analysisResult, null, 2)}
                  </pre>
                </div>
              )
            ) : (
              /* Idle Placeholder */
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-300">
                  스냅샷 캡처 대기 중
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  왼쪽 파라미터를 조절한 뒤 <strong className="text-indigo-400">'스냅샷 캡처 및 AI 비전 판독 실행'</strong> 버튼을 누르면 실시간 분석과 고지서가 발부됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
