import React from 'react';
import { Cpu, Radio, Camera, Zap, ShieldCheck, ArrowRight, Gauge, Activity, BellRing } from 'lucide-react';

interface SystemHeroProps {
  onExploreSimulator: () => void;
}

export const SystemHero: React.FC<SystemHeroProps> = ({ onExploreSimulator }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-10 mb-8">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          라즈베리파이 5 & 구글 AI 스튜디오 Gemini 멀티모달 아키텍처
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          지능형 엣지 과속 단속 시스템
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-400">
            하드웨어 통합 제어 & AI 비전 판독
          </span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-3xl">
          본 시스템은 <strong className="text-white">24GHz 도플러 레이더</strong>와 <strong className="text-amber-300">74HC595 쉬프트 레지스터 기반 188 LED 속도 표출기</strong>, 
          거리·속도 연동 <strong className="text-rose-400">능동형 GPIO 경광등</strong>, 고속 주행 차량의 롤링 왜곡을 원천 배제하는 <strong className="text-emerald-300">AR0234 글로벌 셔터 카메라</strong>, 
          그리고 <strong className="text-indigo-300">구글 AI 스튜디오의 Gemini 멀티모달 모델</strong>을 결합하여 독립형 고신뢰성 무인 과속 단속 및 지능형 고지서 생성을 지원합니다.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={onExploreSimulator}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Gauge className="w-4 h-4" />
            <span>실시간 현장 단속 시뮬레이터 가동</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>통합 루프 지연시간: &lt; 350ms</span>
          </div>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition">
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">메인 컨트롤러</span>
            </div>
            <div className="text-sm font-extrabold text-white">Raspberry Pi 5</div>
            <div className="text-[11px] text-slate-400 mt-0.5">BCM2712 Quad 2.4GHz / 64-bit</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">속도 감지 & LED</span>
            </div>
            <div className="text-sm font-extrabold text-white">24GHz & 188 LED</div>
            <div className="text-[11px] text-slate-400 mt-0.5">74HC595 3-Wire SPI 직렬 전송</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 transition">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Camera className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">비전 셔터 모듈</span>
            </div>
            <div className="text-sm font-extrabold text-white">AR0234 Global</div>
            <div className="text-[11px] text-slate-400 mt-0.5">1/2000s 동시 노출 (블러 0%)</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-rose-500/40 transition">
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <BellRing className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AI 인텔리전스</span>
            </div>
            <div className="text-sm font-extrabold text-white">Gemini 3.8 Flash</div>
            <div className="text-[11px] text-slate-400 mt-0.5">번호판 / 차종 / 위반 심각도 판독</div>
          </div>
        </div>
      </div>
    </div>
  );
};
