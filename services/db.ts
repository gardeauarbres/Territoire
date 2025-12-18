
import { Spot, Mission, Profile, SpotType, MissionCompletion, Badge, ImpactStats, Echo, CollectiveMission, WeatherData, WeatherType } from '../types';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class DBService {
  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    if (!localStorage.getItem('tv_spots')) {
      const initialSpots: Spot[] = [
        { id: 's1', territory_id: 't1', name: 'Le Chêne Millénaire', description: 'Un ancêtre qui veille sur la vallée.', type: SpotType.TREE, latitude: 45.123, longitude: 5.456, short_code: 'OAK1' },
        { id: 's2', territory_id: 't1', name: 'Source de l\'Émeraude', description: 'Une eau pure filtrée par la roche.', type: SpotType.WATER, latitude: 45.125, longitude: 5.458, short_code: 'WTR1' },
        { id: 's3', territory_id: 't1', name: 'Clairière des Lucioles', description: 'Zone de haute biodiversité entomologique.', type: SpotType.ZONE, latitude: 45.120, longitude: 5.460, short_code: 'ZONE1' },
        { id: 's4', territory_id: 't1', name: 'Sentier du Lichen', description: 'Un passage riche en micro-écosystèmes.', type: SpotType.PATH, latitude: 45.122, longitude: 5.462, short_code: 'PATH1' }
      ];
      localStorage.setItem('tv_spots', JSON.stringify(initialSpots));
    }

    if (!localStorage.getItem('tv_collective_missions')) {
      const initialColMissions: CollectiveMission[] = [
        { 
          id: 'cm1', 
          title: 'Grande Résonance Aquatique', 
          description: 'Purifier 1000 litres d\'eau virtuelle sur le secteur Alpha.', 
          goal_value: 1000, 
          current_value: 650, 
          unit: 'Litres',
          impact_type: 'water',
          is_completed: false 
        }
      ];
      localStorage.setItem('tv_collective_missions', JSON.stringify(initialColMissions));
    }

    if (!localStorage.getItem('tv_missions')) {
      const initialMissions: Mission[] = [
        { id: 'm1', spot_id: 's1', title: 'Mesure de Croissance', description: 'Vérifier le tour du tronc.', xp_reward: 150, type: 'observation', impact_type: 'carbon', impact_value: 2.5 },
        { id: 'm2', spot_id: 's2', title: 'Nettoyage des Berges', description: 'Retirer les débris non naturels.', xp_reward: 200, type: 'action', impact_type: 'water', impact_value: 50 },
        { id: 'm3', spot_id: 's3', title: 'Inventaire Floral', description: 'Identifier 3 espèces de fleurs.', xp_reward: 180, type: 'observation', impact_type: 'biodiversity', impact_value: 5 },
        { id: 'm4', spot_id: 's4', title: 'Alerte Invasive', description: 'Signaler la présence de plantes invasives.', xp_reward: 120, type: 'report', impact_type: 'biodiversity', impact_value: 3 }
      ];
      localStorage.setItem('tv_missions', JSON.stringify(initialMissions));
    }

    if (!localStorage.getItem('tv_echos')) {
      const initialEchos: Echo[] = [
        { id: 'e1', spot_id: 's1', user_id: 'u0', username: 'L\'Ancien', content: 'Le vent porte le souvenir des racines profondes.', original_content: 'Message de test', created_at: new Date().toISOString() }
      ];
      localStorage.setItem('tv_echos', JSON.stringify(initialEchos));
    }
  }

  async getCurrentWeather(): Promise<WeatherData> {
    const stored = localStorage.getItem('tv_weather');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (new Date().getTime() - new Date(parsed.timestamp).getTime() < 3600000) {
        return parsed;
      }
    }
    
    const types: WeatherType[] = ['SUNNY', 'RAINY', 'CLOUDY', 'STORM', 'MISTY'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const weather: WeatherData = {
      type: randomType,
      temperature: Math.floor(Math.random() * 25) + 5,
      advice: "La nature respire, synchronisez vos actions.",
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('tv_weather', JSON.stringify(weather));
    return weather;
  }

  async setWeather(weather: WeatherData) {
    localStorage.setItem('tv_weather', JSON.stringify(weather));
  }

  async getSpots(): Promise<Spot[]> {
    await delay(200);
    return JSON.parse(localStorage.getItem('tv_spots') || '[]');
  }

  async adoptSpot(spotId: string): Promise<Spot> {
    const spots = await this.getSpots();
    const profile = await this.getProfile();
    const spotIndex = spots.findIndex(s => s.id === spotId);
    
    if (spotIndex === -1) throw new Error('Spot introuvable');
    if (profile.level < 10) throw new Error('Niveau 10 requis pour adopter un sanctuaire');
    if (spots[spotIndex].owner_id) throw new Error('Ce spot a déjà un protecteur');
    
    spots[spotIndex].owner_id = profile.id;
    spots[spotIndex].owner_name = profile.username;
    spots[spotIndex].spirit_personality = "Protecteur et mystérieux.";
    
    localStorage.setItem('tv_spots', JSON.stringify(spots));
    return spots[spotIndex];
  }

  async updateSpiritPersonality(spotId: string, personality: string): Promise<Spot> {
    const spots = await this.getSpots();
    const profile = await this.getProfile();
    const spotIndex = spots.findIndex(s => s.id === spotId);
    
    if (spotIndex === -1) throw new Error('Spot introuvable');
    if (spots[spotIndex].owner_id !== profile.id) throw new Error('Action non autorisée');
    
    spots[spotIndex].spirit_personality = personality;
    localStorage.setItem('tv_spots', JSON.stringify(spots));
    return spots[spotIndex];
  }

  async getCollectiveMissions(): Promise<CollectiveMission[]> {
    return JSON.parse(localStorage.getItem('tv_collective_missions') || '[]');
  }

  async updateCollectiveMission(id: string, value: number, chronicle?: string): Promise<CollectiveMission> {
    const missions = await this.getCollectiveMissions();
    const mission = missions.find(m => m.id === id);
    if (mission) {
      mission.current_value += value;
      if (mission.current_value >= mission.goal_value) {
        mission.is_completed = true;
        if (chronicle) mission.victory_chronicle = chronicle;
      }
      localStorage.setItem('tv_collective_missions', JSON.stringify(missions));
      return mission;
    }
    throw new Error('Collective mission not found');
  }

  async getRecommendedPath(): Promise<Spot[]> {
    const spots = await this.getSpots();
    return spots.slice(0, 3);
  }

  async getSpot(id: string): Promise<Spot | undefined> {
    const spots = await this.getSpots();
    return spots.find(s => s.id === id || s.short_code === id);
  }

  async getMissionsForSpot(spotId: string): Promise<Mission[]> {
    const missions = JSON.parse(localStorage.getItem('tv_missions') || '[]');
    return missions.filter((m: Mission) => m.spot_id === spotId);
  }

  async getEchos(spotId: string): Promise<Echo[]> {
    const echos = JSON.parse(localStorage.getItem('tv_echos') || '[]');
    return echos.filter((e: Echo) => e.spot_id === spotId).sort((a: Echo, b: Echo) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async addEcho(spotId: string, content: string, originalContent: string): Promise<Echo> {
    const profile = await this.getProfile();
    const echos = JSON.parse(localStorage.getItem('tv_echos') || '[]');
    const newEcho: Echo = {
      id: Math.random().toString(36).substr(2, 9),
      spot_id: spotId,
      user_id: profile.id,
      username: profile.username,
      content,
      original_content: originalContent,
      created_at: new Date().toISOString()
    };
    echos.push(newEcho);
    localStorage.setItem('tv_echos', JSON.stringify(echos));
    return newEcho;
  }

  async getProfile(): Promise<Profile> {
    const profile = await this.getLocalData<Profile>('tv_profile');
    if (!profile) {
      return { id: 'u1', username: 'Gardien_Alpha', xp: 0, level: 1, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Antigravity' };
    }
    return profile;
  }

  async getCompletions(): Promise<MissionCompletion[]> {
    return JSON.parse(localStorage.getItem('tv_completions') || '[]');
  }

  async getImpactStats(): Promise<ImpactStats> {
    const completions = await this.getCompletions();
    const missions = JSON.parse(localStorage.getItem('tv_missions') || '[]');
    const stats: ImpactStats = { carbon: 0, water: 0, biodiversity: 0 };
    completions.forEach(c => {
      const m = missions.find((mi: Mission) => mi.id === c.mission_id);
      if (m) stats[m.impact_type as keyof ImpactStats] += m.impact_value;
    });
    return stats;
  }

  async completeMission(missionId: string): Promise<MissionCompletion> {
    await delay(1000);
    const missions = JSON.parse(localStorage.getItem('tv_missions') || '[]');
    const mission = missions.find((m: Mission) => m.id === missionId);
    if (!mission) throw new Error('ERR_MISSION_NOT_FOUND');

    const profile = await this.getProfile();
    const completions = await this.getCompletions();
    const weather = await this.getCurrentWeather();

    let xpEarned = mission.xp_reward;
    if (weather.type === 'RAINY' && mission.impact_type === 'water') xpEarned *= 2;
    if (weather.type === 'SUNNY' && mission.impact_type === 'carbon') xpEarned *= 2;
    if (weather.type === 'CLOUDY' && mission.impact_type === 'biodiversity') xpEarned = Math.round(xpEarned * 1.5);

    const newCompletion: MissionCompletion = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: profile.id,
      mission_id: missionId,
      completed_at: new Date().toISOString(),
      xp_earned: xpEarned
    };

    completions.push(newCompletion);
    profile.xp += xpEarned;
    profile.level = Math.floor(profile.xp / 500) + 1;

    const colMissions = await this.getCollectiveMissions();
    const activeCol = colMissions.find(cm => cm.impact_type === mission.impact_type && !cm.is_completed);
    if (activeCol) {
      await this.updateCollectiveMission(activeCol.id, mission.impact_value);
    }

    localStorage.setItem('tv_completions', JSON.stringify(completions));
    localStorage.setItem('tv_profile', JSON.stringify(profile));
    return newCompletion;
  }

  async getBadges(): Promise<Badge[]> {
    return [
      { id: 'b1', name: 'Gardien Novice', description: 'Premiers pas dans le territoire.', icon: 'fas fa-seedling', requirement_type: 'mission_count', requirement_value: 1 },
      { id: 'b2', name: 'Esprit Symbiotique', description: 'A communiqué avec l\'Esprit.', icon: 'fas fa-ghost', requirement_type: 'level', requirement_value: 2 },
      { id: 'b3', name: 'Héros de l\'Eau', description: 'A sauvé plus de 100L d\'eau.', icon: 'fas fa-tint', requirement_type: 'mission_count', requirement_value: 5 },
      { id: 'b4', name: 'Maître Sanctuaire', description: 'A adopté son propre sanctuaire.', icon: 'fas fa-fort-awesome', requirement_type: 'level', requirement_value: 10 },
    ];
  }

  private async getLocalData<T>(key: string): Promise<T | null> {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}

export const db = new DBService();
