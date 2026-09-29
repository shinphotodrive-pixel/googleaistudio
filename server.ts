import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '20mb' }));

  // Initialize GoogleGenAI SDK on server side with User-Agent telemetry
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // System Health / Capability Endpoint
  app.get('/api/status', (_req, res) => {
    res.json({
      status: 'active',
      geminiConfigured: !!apiKey,
      targetDevice: 'Raspberry Pi 5 (Broadcom BCM2712)',
      sensorInterface: 'UART /dev/ttyAMA0 @ 115200bps',
      cameraSensor: 'AR0234 Global Shutter (2.3MP / MIPI CSI-2)',
      displayDriver: '74HC595 188 LED Segment Multiplexer',
      timestamp: new Date().toISOString(),
    });
  });

  // Multimodal Enforcement Analysis API
  app.post('/api/analyze-enforcement', async (req, res) => {
    try {
      const {
        imageBase64,
        speed = 52,
        speedLimit = 30,
        distance = 12,
        roadName = '서울 마포구 상암산로 48 (어린이보호구역)',
        weather = '맑음 (주간 조도 양호)',
      } = req.body;

      const diff = Math.max(0, speed - speedLimit);
      let severity = 'NONE';
      let fine = 0;
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
      } else if (diff > 0) {
        severity = 'LOW';
        fine = 40000;
        points = 0;
      }

      if (!ai) {
        // High fidelity simulated edge AI response when running without remote API key
        const plateNumbers = ['340나 8901', '12가 3456', '78러 9942', '24호 6178', '51두 4321'];
        const plate = plateNumbers[Math.floor(Math.random() * plateNumbers.length)];
        const carTypes = [
          '현대 아반떼 CN7 (준중형 세단)',
          '기아 쏘렌토 MQ4 (중형 SUV)',
          '제네시스 GV80 (준대형 SUV)',
          '현대 쏘나타 디 엣지 (중형 세단)',
          '기아 카니발 (미니밴)',
        ];
        const carType = carTypes[Math.floor(Math.random() * carTypes.length)];
        const colors = ['화이트(Pure White)', '스노우 펄(Pearl)', '오로라 블랙(Black)', '스틸 그레이(Gray)'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        return res.json({
          success: true,
          mode: 'edge_simulated',
          data: {
            license_plate_number: plate,
            vehicle_type: carType,
            vehicle_color: color,
            violation_severity: severity,
            estimated_speed: speed,
            legal_speed_limit: speedLimit,
            speed_excess: diff,
            fine_amount_krw: fine,
            penalty_points: points,
            confidence_score: 0.98,
            is_global_shutter_verified: true,
            shutter_blur_metric: '0.012 (Zero Motion Blur - Instant 1/2000s Sync)',
            analysis_summary: `단속 규정 속도(${speedLimit}km/h) 구간에서 ${speed}km/h로 ${diff}km/h를 초과한 ${carType} 차량이 감지되었습니다. AR0234 글로벌 셔터 스냅샷을 통해 젤로 왜곡 없이 등록 번호판 '${plate}' 인식이 98% 신뢰도로 완료되었습니다.`,
            citation_notice: {
              citation_id: `KOR-SPD-${Date.now().toString().slice(-6)}`,
              location: roadName,
              timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
              jurisdiction: '서울특별시경찰청 교통안전과',
              violation_code: diff > 40 ? '제17조 제3항 초과속 위반' : '제17조 제3항 일반과속 위반',
            },
          },
        });
      }

      // Live Gemini 3.8 Flash Multimodal Call
      const prompt = `당신은 대한민국 스마트 교통안전 단속 시스템의 AI 비전 정밀 판독관입니다.
라즈베리파이 5와 AR0234 글로벌 셔터 카메라로 과속 순간 캡처된 차량 이미지 및 레이더 텔레메트리를 분석하세요.

[단속 현장 텔레메트리 데이터]
- 레이더 측정 속도: ${speed} km/h
- 도로 규정 제한속도: ${speedLimit} km/h
- 초과 속도: ${diff} km/h
- 잔여 감지 거리: ${distance} m
- 단속 구역: ${roadName}
- 기상 환경: ${weather}

반드시 대한민국 표준 번호판 규격(예: 340나 8901), 차종 모델(예: 현대 쏘나타 세단), 외장 색상, 위반 심각도(NONE, LOW, MEDIUM, HIGH, CRITICAL), 범칙금(원화 KRW: 40000, 70000, 100000, 130000 중 해당), 벌점(0, 15, 30, 60 중 해당), 글로벌 셔터 잔상 배제 검증(is_global_shutter_verified: true), 분석 요약, 고지서 발부 데이터를 JSON 구조로 응답하세요.`;

      const contentsParts: any[] = [];
      if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.includes('base64,')) {
        const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';
        const data = imageBase64.split('base64,')[1];
        contentsParts.push({
          inlineData: { mimeType, data },
        });
      }
      contentsParts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: contentsParts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              license_plate_number: { type: Type.STRING, description: '대한민국 표준 자동차 번호판' },
              vehicle_type: { type: Type.STRING, description: '차종 구분 및 모델' },
              vehicle_color: { type: Type.STRING, description: '차량 색상' },
              violation_severity: { type: Type.STRING, description: '위반 심각도 NONE/LOW/MEDIUM/HIGH/CRITICAL' },
              estimated_speed: { type: Type.NUMBER, description: '측정 속도' },
              legal_speed_limit: { type: Type.NUMBER, description: '제한 속도' },
              speed_excess: { type: Type.NUMBER, description: '초과 속도' },
              fine_amount_krw: { type: Type.NUMBER, description: '과태료 금액 (KRW)' },
              penalty_points: { type: Type.NUMBER, description: '벌점' },
              confidence_score: { type: Type.NUMBER, description: '신뢰도 (0~1)' },
              is_global_shutter_verified: { type: Type.BOOLEAN, description: '글로벌 셔터 잔상 제거 검증' },
              shutter_blur_metric: { type: Type.STRING, description: '셔터 모션블러 지수' },
              analysis_summary: { type: Type.STRING, description: '종합 단속 판독 요약' },
              citation_notice: {
                type: Type.OBJECT,
                properties: {
                  citation_id: { type: Type.STRING },
                  location: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                  jurisdiction: { type: Type.STRING },
                  violation_code: { type: Type.STRING },
                },
                required: ['citation_id', 'location', 'timestamp', 'jurisdiction', 'violation_code'],
              },
            },
            required: [
              'license_plate_number',
              'vehicle_type',
              'vehicle_color',
              'violation_severity',
              'estimated_speed',
              'legal_speed_limit',
              'speed_excess',
              'fine_amount_krw',
              'penalty_points',
              'confidence_score',
              'is_global_shutter_verified',
              'shutter_blur_metric',
              'analysis_summary',
              'citation_notice',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        mode: 'gemini_api',
        data: parsed,
      });
    } catch (err: any) {
      console.error('Error analyzing enforcement with Gemini:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Gemini Multimodal API analysis failed',
      });
    }
  });

  // Serve static files or Vite middlewares
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Speed Enforcement Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
