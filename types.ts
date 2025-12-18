
export enum SpotType {
  TREE = 'TREE',
  WATER = 'WATER',
  ZONE = 'ZONE',
  PATH = 'PATH',
}

export type WeatherType = 'SUNNY' | 'RAINY' | 'CLOUDY' | 'STORM' | 'MISTY';

export interface WeatherData {
  type: WeatherType;
  temperature: number;
  advice: string;
  timestamp: string;
}

export type ImpactType = 'carbon' | 'water' | 'biodiversity';

export interface Territory {
  id: string;
  name: string;
  description: string;
  total_xp: number;
}

export interface Spot {
  id: string;
  territory_id: string;
  name: string;
  description: string;
  type: SpotType;
  latitude: number;
  longitude: number;
  short_code: string;
  owner_id?: string;
  owner_name?: string;
  spirit_personality?: string;
}

export interface Mission {
  id: string;
  spot_id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: 'observation' | 'action' | 'report';
  impact_type: ImpactType;
  impact_value: number;
}

export interface CollectiveMission {
  id: string;
  title: string;
  description: string;
  goal_value: number;
  current_value: number;
  unit: string;
  impact_type: ImpactType;
  is_completed: boolean;
  victory_chronicle?: string;
}

export interface Echo {
  id: string;
  spot_id: string;
  user_id: string;
  username: string;
  content: string;
  original_content: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  xp: number;
  level: number;
  avatar_url?: string;
}

export interface ImpactStats {
  carbon: number;      // en kg
  water: number;       // en litres
  biodiversity: number; // en unités de surface/qualité
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'mission_count' | 'territory_explorer' | 'level';
  requirement_value: number;
}

export interface MissionCompletion {
  id: string;
  user_id: string;
  mission_id: string;
  completed_at: string;
  xp_earned: number;
}

export interface BioScanResult {
  commonName: string;
  scientificName: string;
  ecologyFact: string;
  confidence: number;
}
