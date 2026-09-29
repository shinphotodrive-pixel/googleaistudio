export interface EnforcementResult {
  license_plate_number: string;
  vehicle_type: string;
  vehicle_color: string;
  violation_severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_speed: number;
  legal_speed_limit: number;
  speed_excess: number;
  fine_amount_krw: number;
  penalty_points: number;
  confidence_score: number;
  is_global_shutter_verified: boolean;
  shutter_blur_metric?: string;
  analysis_summary: string;
  citation_notice: {
    citation_id: string;
    location: string;
    timestamp: string;
    jurisdiction: string;
    violation_code: string;
  };
}

export interface SoftApConfig {
  v_limit: number;
  d_danger: number;
  t_on_warning: number;
  t_on_danger: number;
  radar_angle_deg: number;
  camera_iso: number;
  camera_shutter_us: number;
  auto_gemini_upload: boolean;
  road_name: string;
}

export interface PowerComponent {
  name: string;
  desc: string;
  watts: number;
  color: string;
  voltage: string;
}
