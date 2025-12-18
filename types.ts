
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
export type ProofType = 'IMAGE' | 'AUDIO' | 'NONE';

export interface Swarm {
  id: string;
  name: string;
  description: string;
  reputation: number;
  avatar_url: string;
  creator_id: string;
  member_count: number;
  motto: string;
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  power_text: string;
  found_date: string;
}

export interface Chronicle {
  id: string;
  date: string;
  title: string;
  content: string;
  highlighted_swarm_name?: string;
  threat_level: 'LOW' | 'MEDIUM' | 'CRITICAL';
}

export interface Territory {
  id: string;
  name: string;
  description: string;
  total_xp: number;
  health_score: number;
  stability_score: number;
  active_nodes: number;
  is_under_threat: boolean;
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
  last_activity?: string;
  connected_spot_ids: string[];
}

export interface Mission {
  id: string;
  spot_id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: 'observation' | 'action' | 'report' | 'coop' | 'emergency';
  impact_type: ImpactType;
  impact_value: number;
  is_priority?: boolean;
  required_proof?: ProofType;
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
  type: 'STANDARD' | 'EMERGENCY';
  expires_at?: string;
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
  swarm_id?: string;
}

export interface ImpactStats {
  carbon: number;
  water: number;
  biodiversity: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'mission_count' | 'territory_explorer' | 'level' | 'coop_count';
  requirement_value: number;
}

export interface MissionCompletion {
  id: string;
  user_id: string;
  mission_id: string;
  completed_at: string;
  xp_earned: number;
  is_symbiosis?: boolean;
  proof_data?: string;
}

export interface BioScanResult {
  commonName: string;
  scientificName: string;
  ecologyFact: string;
  confidence: number;
}

export interface FeedItem {
  type: 'SCAN' | 'MISSION';
  activity_id: string;
  created_at: string;
  username: string;
  avatar_url?: string;
  title: string;
  subtitle: string;
  description: string;
  user_id: string;
  resonance_count?: number;
}

export interface ProofValidationResult {
  success: boolean;
  feedback: string;
  confidence: number;
}
