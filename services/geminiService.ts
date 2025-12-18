
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { SpeciesOccurrence } from './ecologyService';
import { Mission, ImpactType, WeatherType, BioScanResult, Territory, ImpactStats, Swarm, Profile, Chronicle } from '../types';

/**
 * Generates a poetic exploration mission based on real INPN species data.
 */
export const generateMissionFromSpecies = async (spotId: string, species: SpeciesOccurrence): Promise<Omit<Mission, 'id'>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Tu es l'Intelligence du Territoire Vivant. 
  Une donnée réelle de l'INPN indique la présence de "${species.vernacularName || species.scientificName}" (${species.scientificName}) dans ce secteur.
  Crée une mission d'exploration poétique pour un Gardien.
  La mission doit consister à essayer d'observer ou de trouver des indices de cette espèce.
  
  Renvoie un JSON avec :
  - title: Nom de la mission (max 5 mots)
  - description: Instruction poétique (max 20 mots)
  - xp_reward: entre 100 et 300
  - impact_type: 'carbon', 'water' ou 'biodiversity'
  - impact_value: entre 5 et 20`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    config: { 
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                xp_reward: { type: Type.NUMBER },
                impact_type: { type: Type.STRING },
                impact_value: { type: Type.NUMBER }
            },
            required: ['title', 'description', 'xp_reward', 'impact_type', 'impact_value']
        }
    },
    contents: prompt,
  });

  const data = JSON.parse(response.text || '{}');
  
  return {
    spot_id: spotId,
    title: data.title || 'Exploration Secrète',
    description: data.description || 'Cherchez les signes de la vie environnante.',
    xp_reward: data.xp_reward || 150,
    type: 'observation',
    impact_type: (data.impact_type as ImpactType) || 'biodiversity',
    impact_value: data.impact_value || 10,
    required_proof: 'IMAGE'
  };
};

/**
 * Generates audio welcome from the Spot's Spirit.
 */
export const generateSpiritVoice = async (spotName: string, personality: string): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Tu es l'Esprit du lieu nommé "${spotName}". Ta personnalité est: ${personality}. Accueille brièvement le Gardien qui vient de se connecter à ton nœud (max 15 mots).`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateWeatherAdvice = async (type: WeatherType, temperature: number): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `En tant qu'Intelligence du Territoire, donne un conseil poétique et court (max 10 mots) pour les Gardiens sachant qu'il fait ${temperature}°C et que le temps est ${type}.`,
    });
    return response.text || "La nature respire.";
};

export const identifySpecies = async (base64Image: string): Promise<BioScanResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: "Identifie cette espèce (plante ou animal). Renvoie un JSON avec: commonName, scientificName, ecologyFact (un fait poétique sur son rôle écologique), confidence (0-1)." }
        ],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    commonName: { type: Type.STRING },
                    scientificName: { type: Type.STRING },
                    ecologyFact: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                },
                required: ['commonName', 'scientificName', 'ecologyFact', 'confidence']
            }
        }
    });
    const res = JSON.parse(response.text || '{}');
    return {
        commonName: res.commonName || "Espèce Inconnue",
        scientificName: res.scientificName || "Inconnu",
        ecologyFact: res.ecologyFact || "Une partie du grand tout.",
        confidence: res.confidence || 0.5
    };
};

export const generateVictoryChronicle = async (title: string, goal: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Rédige une courte chronique de victoire (max 40 mots) pour avoir accompli l'objectif collectif : "${title}" (${goal}). Style prophétique.`,
    });
    return response.text || "L'équilibre est restauré.";
};

export const generatePredictiveAnalysis = async (territory: Territory, impact: ImpactStats, speciesCount: number): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyse l'état du Nexus : Stabilité ${territory.stability_score}%, XP Totale ${territory.total_xp}, ${speciesCount} espèces scannées. Impact global : ${impact.carbon}kg carbone, ${impact.water}L eau. Prédis l'avenir du territoire sous forme de prophétie bio-technologique (max 60 mots).`,
    });
    return response.text || "Le futur est incertain.";
};

// Fix: Added suggestSwarm export for SwarmManager view
/**
 * Suggests a swarm to join based on user profile and impact.
 */
export const suggestSwarm = async (profile: Profile, impact: ImpactStats, swarms: Swarm[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const swarmsList = swarms.map(s => `${s.name}: ${s.description}`).join('\n');
    const prompt = `En tant qu'Oracle du Nexus, analyse ce profil de Gardien :
    Nom: ${profile.username}, Niveau: ${profile.level}.
    Impact: Carbone ${impact.carbon}kg, Eau ${impact.water}L, Biodiversité ${impact.biodiversity}.
    
    Voici les essaims disponibles dans ce secteur :
    ${swarmsList}
    
    Suggère poétiquement (max 30 mots) quel essaim ce Gardien devrait rejoindre et pourquoi.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    return response.text || "Suivez votre instinct, Gardien.";
};

// Fix: Added generateChronicle export for Chronicles view
/**
 * Generates a new chronicle entry based on the territory state.
 */
export const generateChronicle = async (territory: Territory, swarms: Swarm[], species: BioScanResult[]): Promise<Omit<Chronicle, 'id' | 'date'>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const swarmsSummary = swarms.map(s => s.name).join(', ');
    const speciesSummary = species.slice(0, 5).map(s => s.commonName).join(', ');
    
    const prompt = `Rédige une nouvelle chronique pour le territoire "${territory.name}".
    État du Nexus : Santé ${territory.health_score}%, Stabilité ${territory.stability_score}%.
    Essaims en présence : ${swarmsSummary}.
    Bio-découvertes récentes : ${speciesSummary}.
    
    Renvoie un JSON avec :
    - title: Titre de la chronique (max 6 mots)
    - content: Récit prophétique et poétique des événements (max 50 mots)
    - highlighted_swarm_name: Nom d'un essaim à mettre en avant
    - threat_level: 'LOW', 'MEDIUM' ou 'CRITICAL'`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    highlighted_swarm_name: { type: Type.STRING },
                    threat_level: { type: Type.STRING }
                },
                required: ['title', 'content', 'highlighted_swarm_name', 'threat_level']
            }
        },
        contents: prompt,
    });

    try {
        const data = JSON.parse(response.text || '{}');
        return {
            title: data.title || "Murmures du Territoire",
            content: data.content || "Le Mycélium tisse ses liens dans l'ombre.",
            highlighted_swarm_name: data.highlighted_swarm_name || (swarms.length > 0 ? swarms[0].name : "Les Gardiens"),
            threat_level: (['LOW', 'MEDIUM', 'CRITICAL'].includes(data.threat_level) ? data.threat_level : 'LOW') as 'LOW' | 'MEDIUM' | 'CRITICAL'
        };
    } catch (e) {
        return {
            title: "Murmures du Territoire",
            content: "La connexion avec l'Oracle a été brève mais intense.",
            highlighted_swarm_name: "Gardiens",
            threat_level: 'LOW'
        };
    }
};
