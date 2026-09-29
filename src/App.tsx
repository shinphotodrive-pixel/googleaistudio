import React, { useState } from 'react';
import { Header } from './components/Header';
import { SystemHero } from './components/SystemHero';
import { PowerBudgetCalculator } from './components/PowerBudgetCalculator';
import { RadarAndSegmentDisplay } from './components/RadarAndSegmentDisplay';
import { StrobeAndSoftApPortal } from './components/StrobeAndSoftApPortal';
import { CameraAndAiComparison } from './components/CameraAndAiComparison';
import { LiveEnforcementSimulator } from './components/LiveEnforcementSimulator';
import { SoftwarePipeline } from './components/SoftwarePipeline';
import { HardwareWiringGuide } from './components/HardwareWiringGuide';
import { PythonCodeCenter } from './components/PythonCodeCenter';
import { SoftApConfig } from './types';
import { ShieldAlert, Cpu, Heart, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('simulator');

  // Shared configuration state synced between SoftAP portal and Simulator
  const [config, setConfig] = useState<SoftApConfig>({
    v_limit: 30,
    d_danger: 15,
    t_on_warning: 500,
    t_on_danger: 100,
    radar_angle_deg: 15,
    camera_iso: 200,
    camera_shutter_us: 500, // 1/2000s
    auto_gemini_upload: true,
    road_name: '서울 마포구 상암산로 48 (어린이보호구역)',
  });

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Industrial Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavClick}
        systemStatus="online"
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* System Overview Hero */}
        <SystemHero onExploreSimulator={() => handleNavClick('simulator')} />

        {/* 1. Power Budget & Solar Battery Calculator */}
        <PowerBudgetCalculator />

        {/* 2. 24GHz Doppler Radar & 74HC595 188 LED Segment Display */}
        <RadarAndSegmentDisplay />

        {/* 3. GPIO Active Strobe State Machine & Wi-Fi SoftAP Portal */}
        <StrobeAndSoftApPortal config={config} setConfig={setConfig} />

        {/* 4. AR0234 Global Shutter vs Rolling Shutter & Gemini Multimodal Pipeline */}
        <CameraAndAiComparison />

        {/* 5. Live Interactive Enforcement Simulator */}
        <LiveEnforcementSimulator config={config} />

        {/* 6. Software Architecture & 5-Step Deployment Pipeline */}
        <SoftwarePipeline />

        {/* 7. Raspberry Pi 5 40-Pin GPIO Pinout & Bill of Materials */}
        <HardwareWiringGuide />

        {/* 8. Complete Production Python Source Code Center */}
        <PythonCodeCenter />
      </main>

      {/* Industrial Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-10 mt-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              RPi5
            </div>
            <div>
              <div className="font-bold text-slate-200">
                라즈베리파이 5 & 구글 AI 스튜디오 기반 지능형 과속 단속 시스템
              </div>
              <p className="text-[11px] text-slate-500">
                BCM2712 Quad 2.4GHz · 24GHz K-Band Radar · 74HC595 188 LED · AR0234 Global Shutter · Gemini 3.8 Flash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Gemini 3.8 Flash 연동 준비 완료</span>
            </div>
            <span className="text-slate-700">|</span>
            <span>시스템 무결성 검증 100%</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
