import React, { useState } from 'react';
import { Terminal, Copy, Check, Code, Download, FileCode } from 'lucide-react';

export const PythonCodeCenter: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('gemini_enforcer.py');
  const [copied, setCopied] = useState<boolean>(false);

  const pythonFiles: Record<string, { desc: string; code: string }> = {
    'gemini_enforcer.py': {
      desc: '구글 AI 스튜디오 Python SDK(google-genai) 기반 구조화된 JSON 스키마 비전 분석기',
      code: `"""
Google GenAI Multimodal Enforcement Vision Client
Model: gemini-3.8-flash (Structured Outputs JSON Schema)
"""
import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# 1. Define Strict Pydantic Schema for Response
class CitationNotice(BaseModel):
    citation_id: str
    location: str
    timestamp: str
    jurisdiction: str
    violation_code: str

class VehicleAnalysisResponse(BaseModel):
    license_plate_number: str = Field(description="대한민국 차량 번호판 (예: 340나 8901)")
    vehicle_type: str = Field(description="차종 구분 및 모델 (예: 현대 쏘나타 세단)")
    vehicle_color: str = Field(description="차량 외장 색상")
    violation_severity: str = Field(description="위반 등급: NONE, LOW, MEDIUM, HIGH, CRITICAL")
    estimated_speed: int = Field(description="레이더 감지 속도 km/h")
    legal_speed_limit: int = Field(description="구간 규정 속도 km/h")
    speed_excess: int = Field(description="초과 속도 km/h")
    fine_amount_krw: int = Field(description="도로교통법 기준 과태료 금액 (KRW)")
    penalty_points: int = Field(description="벌점")
    confidence_score: float = Field(description="인식 신뢰도 0.0 ~ 1.0")
    is_global_shutter_verified: bool = Field(description="AR0234 글로벌 셔터 모션블러 배제 여부")
    analysis_summary: str = Field(description="단속 종합 소견")
    citation_notice: CitationNotice

class GeminiEnforcer:
    def __init__(self, api_key: str = None):
        self.client = genai.Client(
            api_key=api_key or os.environ.get("GEMINI_API_KEY"),
            http_options={'headers': {'User-Agent': 'aistudio-build'}}
        )

    def analyze_violation(self, image_path: str, speed: int, speed_limit: int, dist: int, road: str):
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        prompt = f"""
        당신은 대한민국 무인 교통단속 장비의 고정밀 AI 판독 엔진입니다.
        AR0234 글로벌 셔터 카메라로 촬영된 차량 스냅샷과 레이더 데이터를 정밀 판독하세요.
        - 감지 속도: {speed} km/h
        - 규정 속도: {speed_limit} km/h
        - 잔여 거리: {dist} m
        - 단속 위치: {road}
        """

        response = self.client.models.generate_content(
            model="gemini-3.8-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=VehicleAnalysisResponse,
                temperature=0.1
            )
        )
        return json.loads(response.text)
`,
    },

    'radar_uart.py': {
      desc: '24GHz 도플러 레이더 시리얼 UART 패킷 수신 및 이동 평균 필터 스레드',
      code: `"""
24GHz K-Band Doppler Radar Reader via /dev/ttyAMA0
"""
import serial
import threading
import time

class RadarReader(threading.Thread):
    def __init__(self, port="/dev/ttyAMA0", baudrate=115200, callback=None):
        super().__init__(daemon=True)
        self.ser = serial.Serial(port, baudrate, timeout=0.1)
        self.callback = callback
        self.running = True
        self.last_speed = 0

    def run(self):
        while self.running:
            try:
                # Header sync: 0xFF 0xAA
                header = self.ser.read(2)
                if len(header) == 2 and header[0] == 0xFF and header[1] == 0xAA:
                    payload_len = self.ser.read(1)[0]
                    payload = self.ser.read(payload_len)
                    checksum = self.ser.read(1)[0]
                    
                    # Verify checksum
                    calc_sum = (0xFF + 0xAA + payload_len + sum(payload)) % 256
                    if calc_sum == checksum:
                        speed = payload[1] # Speed in km/h
                        direction = payload[2] # 0x01: Approaching
                        if direction == 0x01 and self.callback:
                            self.callback(speed)
            except Exception as e:
                time.sleep(0.01)

    def stop(self):
        self.running = False
        self.ser.close()
`,
    },

    'segment_188.py': {
      desc: '74HC595 쉬프트 레지스터 2개 데이지체인 기반 188 LED 전광판 제어기',
      code: `"""
74HC595 Shift Register Daisy-Chain Driver for 188 LED Display
Raspberry Pi 5 GPIO: SER(17), SRCLK(27), RCLK(22)
"""
import gpiod
import time

CHIP = gpiod.Chip('gpiochip4') # Pi 5 RP1 chip
PIN_SER = 17
PIN_SRCLK = 27
PIN_RCLK = 22

# 7-Segment Hex Map (Common Cathode)
HEX_MAP = {
    0: 0x3F, 1: 0x06, 2: 0x5B, 3: 0x4F, 4: 0x66,
    5: 0x6D, 6: 0x7D, 7: 0x07, 8: 0x7F, 9: 0x6F
}

class Segment188Display:
    def __init__(self):
        self.line_ser = CHIP.get_line(PIN_SER)
        self.line_srclk = CHIP.get_line(PIN_SRCLK)
        self.line_rclk = CHIP.get_line(PIN_RCLK)
        
        self.line_ser.request(consumer="seg", type=gpiod.LINE_REQ_DIR_OUT)
        self.line_srclk.request(consumer="seg", type=gpiod.LINE_REQ_DIR_OUT)
        self.line_rclk.request(consumer="seg", type=gpiod.LINE_REQ_DIR_OUT)

    def _shift_byte(self, byte_val):
        for i in range(7, -1, -1):
            bit = (byte_val >> i) & 1
            self.line_ser.set_value(bit)
            # Clock tick
            self.line_srclk.set_value(1)
            self.line_srclk.set_value(0)

    def display_speed(self, speed: int):
        speed = max(0, min(199, speed))
        is_100_on = speed >= 100
        tens = (speed % 100) // 10
        ones = speed % 10

        byte_u1 = HEX_MAP[tens]
        if is_100_on:
            byte_u1 |= 0x80 # DP or extra pin drives '1' stroke

        byte_u2 = HEX_MAP[ones]

        # Shift out 16 bits (U1 then U2)
        self._shift_byte(byte_u2)
        self._shift_byte(byte_u1)

        # Latch to outputs
        self.line_rclk.set_value(1)
        self.line_rclk.set_value(0)
`,
    },

    'strobe_gpio.py': {
      desc: '능동형 경광등 비동기 펄스 상태 머신 (GPIO 23 100ms / 500ms 제어)',
      code: `"""
Active Strobe Light Non-blocking FSM Controller (GPIO 23)
"""
import gpiod
import threading
import time

class StrobeController:
    def __init__(self, pin=23):
        chip = gpiod.Chip('gpiochip4')
        self.line = chip.get_line(pin)
        self.line.request(consumer="strobe", type=gpiod.LINE_REQ_DIR_OUT)
        self.mode = "OFF" # "OFF", "WARNING", "DANGER"
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def set_mode(self, mode: str):
        self.mode = mode

    def _loop(self):
        while self.running:
            if self.mode == "OFF":
                self.line.set_value(0)
                time.sleep(0.05)
            elif self.mode == "WARNING":
                self.line.set_value(1)
                time.sleep(0.5)
                self.line.set_value(0)
                time.sleep(0.5)
            elif self.mode == "DANGER":
                self.line.set_value(1)
                time.sleep(0.1)
                self.line.set_value(0)
                time.sleep(0.1)
`,
    },

    'ar0234_capture.py': {
      desc: 'AR0234 글로벌 셔터 카메라 1/2000s 동시 노출 스냅샷 캡처 루틴',
      code: `"""
AR0234 Global Shutter High-Speed Frame Capture
Using Picamera2 / V4L2 Hardware Shutter Trigger
"""
from picam2 import Picamera2
import time

class GlobalShutterCamera:
    def __init__(self):
        self.picam2 = Picamera2()
        config = self.picam2.create_still_configuration(main={"size": (1920, 1200)})
        self.picam2.configure(config)
        self.picam2.start()

        # Lock Global Shutter parameters
        # Exposure: 500 microseconds (1/2000 sec)
        self.picam2.set_controls({
            "ExposureTime": 500,
            "AnalogueGain": 2.0
        })

    def capture_snapshot(self, output_path: str):
        self.picam2.capture_file(output_path)
        return output_path
`,
    },

    'softap_portal.py': {
      desc: 'FastAPI 기반 스마트폰 유지보수 및 단속 기준 변경 SoftAP 웹 서버',
      code: `"""
Mobile SoftAP Configuration Portal (FastAPI)
Host: 192.168.4.1:8000
"""
from fastapi import FastAPI
from pydantic import BaseModel
import json
import subprocess

app = FastAPI(title="Traffic Radar SoftAP Config")
CONFIG_PATH = "/etc/speed_cam/config.json"

class SpeedCamConfig(BaseModel):
    v_limit: int
    d_danger: int
    t_on_warning: int
    t_on_danger: int
    road_name: str
    auto_gemini_upload: bool

@app.get("/api/config")
def get_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

@app.post("/api/config")
def update_config(cfg: SpeedCamConfig):
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg.dict(), f, indent=2)
    
    # Reload background service
    subprocess.run(["systemctl", "restart", "speedcam.service"])
    return {"status": "success", "message": "Config applied and daemon restarted."}
`,
    },
  };

  const currentFile = pythonFiles[activeFile];

  const copyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="code" className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-12">
      <div className="border-b border-slate-800 pb-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              <Terminal className="w-3.5 h-3.5" />
              라즈베리파이 5 현장 임베디드 소스코드
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              7. 라즈베리파이 5 하드웨어 구동 파이썬 모듈 코드
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              레이더 UART 수신, 74HC595 188 LED 제어, GPIO 23 스트로브, AR0234 글로벌 셔터 스냅샷 및 google-genai 비전 연동 코드입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* File Tabs List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          {Object.entries(pythonFiles).map(([fname, info]) => {
            const isActive = activeFile === fname;
            return (
              <button
                key={fname}
                onClick={() => setActiveFile(fname)}
                className={`w-full p-3.5 rounded-2xl text-left border transition flex items-start gap-3 ${
                  isActive
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <FileCode className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <div className="overflow-hidden">
                  <div className="font-mono text-xs font-bold text-white">{fname}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{info.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Code Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Code Viewer Top Bar */}
          <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-white">{activeFile}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentFile.desc}</p>
            </div>

            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료' : '전체 복사'}</span>
            </button>
          </div>

          {/* Code Block */}
          <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto h-[480px] bg-slate-950 leading-relaxed selection:bg-indigo-600 selection:text-white">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};
