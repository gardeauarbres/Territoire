import { supabase } from './supabase';
import { Spot, Mission, Profile, SpotType, MissionCompletion, Badge, ImpactStats, Echo, CollectiveMission, WeatherData, WeatherType, Territory, Swarm, Chronicle, Artifact, BioScanResult, FeedItem } from '../types';

class DBService {
  isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 21 || hour < 6;
  }

  // --- AUTH & PROFILE ---
  async getProfile(): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn("Profil non trouvé, tentative de création manuelle...");
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ id: user.id, username: user.user_metadata?.username || 'Gardien', xp: 0, level: 1 })
        .select()
        .single();
      
      if (createError) throw createError;
      return newProfile;
    }
    return data;
  }

  async addXp(amount: number, targetUserId?: string): Promise<Profile | null> {
    const targetId = targetUserId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetId) return null;

    const profile = await this.getProfile();
    const newXp = (profile.xp || 0) + amount;
    const newLevel = Math.floor(newXp / 500) + 1;

    const { data, error } = await supabase
      .from('profiles')
      .update({ xp: newXp, level: newLevel })
      .eq('id', targetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // --- SPOTS ---
  async getSpots(): Promise<Spot[]> {
    const { data, error } = await supabase.from('spots').select('*');
    if (error) throw error;
    return data || [];
  }

  async getSpot(idOrCode: string): Promise<Spot | undefined> {
    const isUuid = idOrCode.length > 20;
    const query = supabase.from('spots').select('*');
    if (isUuid) {
      query.eq('id', idOrCode);
    } else {
      query.eq('short_code', idOrCode);
    }
    const { data, error } = await query.single();
    if (error) return undefined;
    return data;
  }

  async createMission(mission: Omit<Mission, 'id'>): Promise<Mission> {
    const { data, error } = await supabase
      .from('missions')
      .insert(mission)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getMissionsForSpot(spotId: string): Promise<Mission[]> {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('spot_id', spotId);
    if (error) throw error;
    return data || [];
  }

  // --- MISSIONS & PROGRESSION ---
  async completeMission(missionId: string, isSymbiosis: boolean = false, proofData?: string): Promise<MissionCompletion> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: mission, error: mError } = await supabase.from('missions').select('*').eq('id', missionId).single();
    if (mError) throw mError;

    let xpEarned = mission.xp_reward;
    if (isSymbiosis) xpEarned *= 2;
    if (this.isNightTime()) xpEarned = Math.round(xpEarned * 1.5);

    const { data: completion, error: cError } = await supabase
      .from('mission_completions')
      .insert({
        user_id: user.id,
        mission_id: missionId,
        xp_earned: xpEarned,
        is_symbiosis: isSymbiosis,
        proof_data: proofData
      })
      .select()
      .single();
    if (cError) throw cError;

    await this.addXp(xpEarned, user.id);
    await this.checkAndAwardBadges(user.id);
    return completion;
  }

  async checkAndAwardBadges(userId: string): Promise<void> {
    const { count: missionCount } = await supabase
        .from('mission_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const { data: currentBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

    const badgeIds = new Set(currentBadges?.map(b => b.badge_id) || []);

    if (missionCount && missionCount >= 1 && !badgeIds.has('b1')) {
        // Fix: Removed .catch() from Supabase builder as it's not a standard Promise and handled error via result object if needed.
        await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'b1' });
    }
  }

  // --- BIO-ATLAS ---
  async getScannedSpecies(): Promise<BioScanResult[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
        .from('scanned_species')
        .select('common_name, scientific_name, ecology_fact, confidence')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(s => ({
        commonName: s.common_name,
        scientificName: s.scientific_name,
        ecologyFact: s.ecology_fact,
        confidence: s.confidence
    }));
  }

  async addScannedSpecies(species: BioScanResult): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase.from('scanned_species').insert({
        user_id: user.id,
        common_name: species.commonName,
        scientific_name: species.scientificName,
        ecology_fact: species.ecologyFact,
        confidence: species.confidence
    });
    if (error) throw error;
  }

  // --- STATS D'IMPACT ---
  async getImpactStats(): Promise<ImpactStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { carbon: 0, water: 0, biodiversity: 0 };
    
    const { data, error } = await supabase.rpc('get_user_impact', { user_uuid: user.id });
    if (error) return { carbon: 0, water: 0, biodiversity: 0 };
    
    if (!data || data.length === 0) return { carbon: 0, water: 0, biodiversity: 0 };
    
    return {
        carbon: Number(data[0].carbon) || 0,
        water: Number(data[0].water) || 0,
        biodiversity: Number(data[0].biodiversity) || 0
    };
  }

  // --- SYMBIOSIS FEED ---
  async getSymbiosisFeed(): Promise<FeedItem[]> {
    const [completions, species, resonances] = await Promise.all([
        supabase.from('mission_completions').select('id, completed_at, xp_earned, user_id, missions(title), profiles(username, avatar_url)').order('completed_at', { ascending: false }).limit(10),
        supabase.from('scanned_species').select('id, created_at, common_name, scientific_name, ecology_fact, user_id, profiles(username, avatar_url)').order('created_at', { ascending: false }).limit(10),
        supabase.from('resonances').select('*')
    ]);

    const feed: FeedItem[] = [];

    (completions.data || []).forEach((c: any) => {
        const resCount = (resonances.data || []).filter(r => r.activity_id === c.id).length;
        feed.push({
            type: 'MISSION',
            activity_id: c.id,
            created_at: c.completed_at,
            username: c.profiles?.username || 'Gardien',
            avatar_url: c.profiles?.avatar_url,
            title: c.missions?.title || 'Mission accomplie',
            subtitle: `Séquence XP: +${c.xp_earned}`,
            description: "Un nœud de résonance a été activé.",
            user_id: c.user_id,
            resonance_count: resCount
        });
    });

    (species.data || []).forEach((s: any) => {
        const resCount = (resonances.data || []).filter(r => r.activity_id === s.id).length;
        feed.push({
            type: 'SCAN',
            activity_id: s.id,
            created_at: s.created_at || new Date().toISOString(),
            username: s.profiles?.username || 'Gardien',
            avatar_url: s.profiles?.avatar_url,
            title: s.common_name,
            subtitle: s.scientific_name,
            description: s.ecology_fact || "Bio-data recueillie.",
            user_id: s.user_id,
            resonance_count: resCount
        });
    });

    return feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- TERRITORY & OTHERS ---
  async getTerritory(): Promise<Territory> {
    const { data, error } = await supabase.from('territories').select('*').single();
    if (error) {
        return {
            id: 'default',
            name: 'Territoire Inconnu',
            description: 'Liaison instable avec le Nexus.',
            total_xp: 0,
            health_score: 50,
            stability_score: 50,
            active_nodes: 0,
            is_under_threat: false
        };
    }
    return data;
  }

  async getArtifacts(): Promise<Artifact[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('artifacts').select('*').eq('user_id', user.id).order('found_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getSwarms(): Promise<Swarm[]> {
    const { data, error } = await supabase.from('swarms').select('*').order('reputation', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getCollectiveMissions(): Promise<CollectiveMission[]> {
    const { data, error } = await supabase.from('collective_missions').select('*');
    if (error) throw error;
    return data || [];
  }

  async getChronicles(): Promise<Chronicle[]> {
    const { data, error } = await supabase.from('chronicles').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getCurrentWeather(): Promise<WeatherData> {
    return { type: 'SUNNY', temperature: 22, advice: 'La nature respire.', timestamp: new Date().toISOString() };
  }

  async getCompletions(): Promise<MissionCompletion[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from('mission_completions').select('*').eq('user_id', user.id);
    return data || [];
  }

  async getBadges(): Promise<Badge[]> {
    return [
      { id: 'b1', name: 'Gardien Novice', description: 'Premiers pas.', icon: 'fas fa-seedling', requirement_type: 'mission_count', requirement_value: 1 }
    ];
  }

  async addArtifact(artifact: Omit<Artifact, 'id' | 'found_date'>): Promise<Artifact> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data, error } = await supabase.from('artifacts').insert({ ...artifact, user_id: user.id }).select().single();
    if (error) throw error;
    return data;
  }

  async addEcho(spotId: string, content: string, originalContent: string): Promise<Echo> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    const { data, error } = await supabase.from('echos').insert({ spot_id: spotId, user_id: user.id, content, original_content: originalContent }).select().single();
    if (error) throw error;
    return { ...data, username: profile?.username || 'Gardien' };
  }

  async getEchos(spotId: string): Promise<Echo[]> {
    const { data, error } = await supabase.from('echos').select('id, content, created_at, profiles(username)').eq('spot_id', spotId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((e: any) => ({ ...e, username: e.profiles?.username || 'Gardien' }));
  }

  async addChronicle(chronicle: Omit<Chronicle, 'id' | 'date'>): Promise<void> {
    await supabase.from('chronicles').insert({ ...chronicle, date: new Date().toISOString() });
  }

  async updateCollectiveMission(id: string, progress: number, victoryChronicle?: string): Promise<void> {
    const { data: mission } = await supabase.from('collective_missions').select('current_value, goal_value').eq('id', id).single();
    if (!mission) return;
    const newValue = (mission.current_value || 0) + progress;
    const isCompleted = newValue >= mission.goal_value;
    const updateData: any = { current_value: newValue, is_completed: isCompleted };
    if (victoryChronicle) updateData.victory_chronicle = victoryChronicle;
    await supabase.from('collective_missions').update(updateData).eq('id', id);
  }

  async joinSwarm(swarmId: string): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data: profile } = await supabase.from('profiles').update({ swarm_id: swarmId }).eq('id', user.id).select().single();
    return profile;
  }

  async createSwarm(name: string, description: string, motto: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: swarm } = await supabase.from('swarms').insert({ name, description, motto, creator_id: user.id, member_count: 1, reputation: 0, avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}` }).select().single();
    await supabase.from('profiles').update({ swarm_id: swarm.id }).eq('id', user.id);
  }

  async resonate(item: FeedItem): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from('resonances').insert({ user_id: user.id, activity_type: item.type, activity_id: item.activity_id });
    if (error) return false;
    await this.addXp(10, user.id);
    return true;
  }

  async getRecommendedPath(): Promise<Spot[]> {
    const spots = await this.getSpots();
    return spots.slice(0, 3);
  }
}

export const db = new DBService();