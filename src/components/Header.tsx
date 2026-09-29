import React from 'react';
import { ShieldAlert, Cpu, Radio, Zap, Camera, Terminal, Sliders } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: 'online' | 'analyzing' | 'idle';
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, systemStatus }) => {
  const navItems = [
    { id: 'overview', label: '개요 & 전력 분석', icon: Zap },
    { id: 'radar-led', label: '레이더 & 188 LED', icon: Radio },
    { id: 'strobe-ap', label: '경광등 & SoftAP 포털', icon: Sliders },
    { id: 'camera-ai', label: 'AR0234 & Gemini AI', icon: Camera },
    { id: 'simulator', label: '현장 단속 시뮬레이터', icon: ShieldAlert, highlight: true },
    { id: 'wiring', label: 'RPi 5 핀맵 & 배선', icon: Cpu },
    { id: 'code', label: '파이썬 소스코드', icon: Terminal },
  ];

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-rose-900/40 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  스마트 과속 단속 시스템
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  RPi 5 + GenAI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono-tech flex items-center gap-1.5">
                <span className="text-emerald-400">● 24GHz Millimeter Radar</span>
                <span className="text-slate-600">|</span>
                <span className="text-indigo-400">AR0234 Global Shutter</span>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    item.highlight
                      ? isActive
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-semibold ring-2 ring-rose-400'
                        : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 font-semibold'
                      : isActive
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">시스템 모드:</span>
              <span className={`font-semibold ${
                systemStatus === 'analyzing'
                  ? 'text-amber-400 animate-pulse'
                  : 'text-emerald-400'
              }`}>
                {systemStatus === 'analyzing' ? 'AI 비전 판독 중' : '실시간 레이더 감시'}
              </span>
            </div>

            <button
              onClick={() => setActiveTab('simulator')}
              className="xl:hidden flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              시뮬레이터
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="xl:hidden flex overflow-x-auto py-2 gap-1.5 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
