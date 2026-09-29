import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Layers, FileSpreadsheet } from 'lucide-react';

interface PinInfo {
  pin: number;
  bcm: string;
  name: string;
  color: string;
  connectedTo: string;
  role: string;
}

export const HardwareWiringGuide: React.FC = () => {
  const [selectedPin, setSelectedPin] = useState<number | null>(11);

  const pins: PinInfo[] = [
    { pin: 1, bcm: '3V3', name: '3.3V Power', color: 'bg-amber-500', connectedTo: '74HC595 VCC / 레이더 보조', role: '3.3V 전원 버스' },
    { pin: 2, bcm: '5V', name: '5V Power', color: 'bg-rose-500', connectedTo: '24GHz 레이더 센서 VCC', role: '5V 센서 주전원' },
    { pin: 4, bcm: '5V', name: '5V Power', color: 'bg-rose-500', connectedTo: '쿨링 팬 / 보조 전원', role: '5V 보조 전원' },
    { pin: 6, bcm: 'GND', name: 'Ground', color: 'bg-slate-700', connectedTo: '레이더 공통 접지 (GND)', role: '공통 기준 접지' },
    { pin: 8, bcm: 'GPIO 14', name: 'UART0 TXD', color: 'bg-indigo-500', connectedTo: '24GHz 레이더 RXD', role: '레이더 설정/파라미터 전송' },
    { pin: 10, bcm: 'GPIO 15', name: 'UART0 RXD', color: 'bg-indigo-500', connectedTo: '24GHz 레이더 TXD', role: '도플러 속도 시리얼 데이터 수신' },
    { pin: 11, bcm: 'GPIO 17', name: 'SER (Data)', color: 'bg-emerald-500', connectedTo: '74HC595 U1 Pin 14 (SER)', role: '188 LED 16비트 직렬 데이터 전송' },
    { pin: 13, bcm: 'GPIO 27', name: 'SRCLK (Clock)', color: 'bg-emerald-500', connectedTo: '74HC595 U1/U2 Pin 11 (SRCLK)', role: '쉬프트 레지스터 1비트 이동 클럭' },
    { pin: 15, bcm: 'GPIO 22', name: 'RCLK (Latch)', color: 'bg-emerald-500', connectedTo: '74HC595 U1/U2 Pin 12 (RCLK)', role: '저장 레지스터 LED 일괄 출력 래치' },
    { pin: 16, bcm: 'GPIO 23', name: 'Strobe Gate', color: 'bg-yellow-500', connectedTo: 'MOSFET Gate / 12V 릴레이 모듈', role: '거리·속도 연동 경광등 펄스 제어' },
    { pin: 14, bcm: 'GND', name: 'Ground', color: 'bg-slate-700', connectedTo: '74HC595 공통 접지', role: '디스플레이 접지' },
    { pin: 20, bcm: 'GND', name: 'Ground', color: 'bg-slate-700', connectedTo: 'MOSFET 소스 접지', role: '경광등 드라이버 접지' },
  ];

  const bomList = [
    { part: '중앙 단속 제어기', model: 'Raspberry Pi 5 (8GB RAM)', spec: 'BCM2712 Quad 2.4GHz, 64-bit OS, PCIe 2.0', qty: 1, cost: '125,000원' },
    { part: '도플러 레이더 센서', model: '24GHz K-Band Millimeter-Wave', spec: '도플러 수신 연산, UART 115200bps, 15° 빔각', qty: 1, cost: '38,000원' },
    { part: '글로벌 셔터 카메라', model: 'Arducam AR0234 2.3MP M12', spec: '1/2.6" CMOS, 1920×1200 @ 60fps, 1/2000s', qty: 1, cost: '68,000원' },
    { part: '188 세그먼트 전광판', model: '74HC595 Daisy-Chain PCB', spec: '100단위 1획 + 십/일의자리 7세그먼트 고휘도 레드', qty: 1, cost: '22,000원' },
    { part: '능동형 경광등 & 드라이버', model: '12V 40W High-Intensity LED + MOSFET', spec: '적/황 듀얼 컬러 스트로브, Opto-isolator 안전 회로', qty: 1, cost: '28,000원' },
    { part: '독립형 태양광 전원계통', model: '12V 20Ah LiFePO4 + 60W Solar Panel', spec: 'MPPT 충전 컨트롤러 포함 (3일 무일조 백업)', qty: 1, cost: '145,000원' },
    { part: 'LTE 무선 모뎀', model: 'Cat.4 USB Dongle / Router', spec: '원격 VPN 및 SoftAP 로컬 점검 포털', qty: 1, cost: '42,000원' },
  ];

  const activePin = pins.find(p => p.pin === selectedPin) || pins[6];

  return (
    <section id="wiring" className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-12">
      <div className="border-b border-slate-800 pb-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              <Cpu className="w-3.5 h-3.5" />
              하드웨어 핀맵 & 자재 명세서 (BOM)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              6. 라즈베리파이 5 40핀 GPIO 배선도 및 부품 규격
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              센서, 디스플레이, 셔터 카메라, 전원 계통 간의 정확한 물리적 인터페이스 결선과 주요 사양표입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: 40-Pin Interactive GPIO Mapping (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-extrabold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>라즈베리파이 5 주요 핀 결선 맵 (클릭하여 상세 정보 확인)</span>
              </span>
              <span className="text-xs font-mono text-slate-400">J8 40-Pin Header</span>
            </div>

            {/* Pin Grid Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {pins.map((p) => (
                <button
                  key={p.pin}
                  onClick={() => setSelectedPin(p.pin)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                    selectedPin === p.pin
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${p.color} flex-shrink-0`} />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold font-mono">Pin {p.pin} ({p.bcm})</div>
                    <div className="text-[10px] text-slate-400 truncate">{p.name}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Pin Details Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-300 text-sm flex items-center gap-2">
                  <span>Pin {activePin.pin} · {activePin.bcm} ({activePin.name})</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  {activePin.role}
                </span>
              </div>
              <div className="text-slate-300">
                연결 대상: <strong className="text-amber-400 font-mono">{activePin.connectedTo}</strong>
              </div>
              <div className="text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-slate-800">
                라즈베리파이 5는 3.3V 로직 레벨을 사용하므로, 5V 신호를 수신하는 경우 전압 분배기(Voltage Divider) 또는 레벨 쉬프터를 거치도록 설계되었습니다.
              </div>
            </div>

            {/* Camera Interface Note */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>AR0234 글로벌 셔터 카메라 연결:</strong> 라즈베리파이 5의 온보드 22핀 FPC <strong>CAM/DISP 0 또는 1 (MIPI CSI-2 4-lane)</strong> 포트에 15핀-22핀 변환 플렉스 리본 케이블로 직접 직결합니다.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Bill of Materials (BOM) Table (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-extrabold text-sm text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>주요 자재 명세서 (BOM)</span>
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold">총 468,000원</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {bomList.map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-200">{item.part}</div>
                    <div className="text-[11px] text-slate-400">{item.model}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.spec}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="font-mono font-bold text-amber-400">{item.cost}</div>
                    <div className="text-[10px] text-slate-500">수량 {item.qty}EA</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
