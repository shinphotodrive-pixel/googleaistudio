import React from 'react';
import { Terminal, Cpu, Camera, Sparkles, Wifi, ArrowRight } from 'lucide-react';

export const SoftwarePipeline: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'OS & 필수 라이브러리',
      icon: Terminal,
      color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10',
      desc: '라즈베리파이 OS (64-bit Debian Bookworm), UART `/dev/ttyAMA0` 활성화, `google-genai`, `opencv-python`, `fastapi`, `gpiod` 패키지 설치.',
      command: 'pip install google-genai opencv-python fastapi uvicorn gpiod',
    },
    {
      step: '02',
      title: '멀티스레드 하드웨어 제어',
      icon: Cpu,
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      desc: '24GHz 레이더 수신 UART 파서, 74HC595 188 LED 디스플레이, GPIO 23 스트로브 경광등 비차단(non-blocking) 데몬 동시 구동.',
      command: 'python -m speedcam.fsm_daemon',
    },
    {
      step: '03',
      title: '동기화 이벤트 캡처',
      icon: Camera,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      desc: 'v ≥ v_limit 및 d ≤ d_danger 임계 도달 시 AR0234 1/2000s 글로벌 셔터 스냅샷 트리거 & NVMe SSD 무손실 버퍼 저장.',
      command: 'v4l2-ctl -d /dev/video0 --set-ctrl=exposure_time_absolute=500',
    },
    {
      step: '04',
      title: '구글 GenAI 비전 파싱',
      icon: Sparkles,
      color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      desc: '`gemini-3.8-flash` 멀티모달 API 비동기 호출로 차량 번호판, 차종, 초과속도, 도로교통법 위반 등급 구조화된 JSON 응답 획득.',
      command: 'client.models.generate_content(model="gemini-3.8-flash", ...)',
    },
    {
      step: '05',
      title: 'SoftAP 유지보수 포털',
      icon: Wifi,
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      desc: '`hostapd` & `dnsmasq`로 로컬 와이파이 AP(Traffic_Radar_AP) 구성. 현장 스마트폰 접속 시 FastAPI 웹 UI로 기준 속도 간편 갱신.',
      command: 'systemctl enable --now hostapd speedcam.service',
    },
  ];

  return (
    <section className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-12">
      <div className="border-b border-slate-800 pb-5 mb-8">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🛠️</span> 6. 소프트웨어 파이프라인 구동 및 배포 절차 (5단계)
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          라즈베리파이 5 상에서 에지 AI 단속 시스템을 구축하고 무중단 시스템 서비스로 배포하는 전체 엔지니어링 프로세스입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((st, i) => {
          const Icon = st.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black text-indigo-400">STEP {st.step}</span>
                  <div className={`p-1.5 rounded-lg border ${st.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h4 className="font-extrabold text-white text-xs sm:text-sm mb-1.5">{st.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{st.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-900">
                <code className="text-[9px] font-mono text-slate-500 block truncate" title={st.command}>
                  $ {st.command}
                </code>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
