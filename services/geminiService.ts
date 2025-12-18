
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type } from '@google/genai';
import { BioScanResult, WeatherType } from '../types';

// Implement decode and encode functions manually as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Custom audio decoding for raw PCM data
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to create PCM blobs for streaming
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export class SpiritOfForestSession {
  private inputAudioContext?: AudioContext;
  private outputAudioContext?: AudioContext;
  private outputNode?: GainNode;
  private sessionPromise?: Promise<any>;
  private stream?: MediaStream;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();

  constructor() {}

  async start(systemInstruction: string, callbacks: {
    onMessage?: (text: string) => void;
    onError?: (err: any) => void;
  }) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);
    
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          const source = this.inputAudioContext!.createMediaStreamSource(this.stream!);
          const scriptProcessor = this.inputAudioContext!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            this.sessionPromise?.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(this.inputAudioContext!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext && this.outputNode) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);
            source.addEventListener('ended', () => this.sources.delete(source));
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
          }

          if (message.serverContent?.outputTranscription) {
            callbacks.onMessage?.(message.serverContent.outputTranscription.text);
          }

          if (message.serverContent?.interrupted) {
            this.sources.forEach(s => {
                try { s.stop(); } catch(e) {}
            });
            this.sources.clear();
            this.nextStartTime = 0;
          }
        },
        onerror: (e) => callbacks.onError?.(e),
        onclose: () => console.log('Spirit session closed'),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        systemInstruction,
        outputAudioTranscription: {},
      }
    });
  }

  stop() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.sessionPromise?.then(s => s.close());
  }
}

export const identifySpecies = async (base64Image: string): Promise<BioScanResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Identify the plant or animal in this image. Provide its common name, scientific name, and a short ecological fun fact (max 15 words). Return as JSON." }
        ]
      }
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

  return JSON.parse(response.text);
};

export const poetizeEcho = async (rawMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tu es le Modérateur Poétique du Territoire Vivant. Un Gardien a laissé ce message : "${rawMessage}". 
    Réécris-le pour qu'il soit poétique, mystérieux et lié à la nature (max 25 mots). 
    Si le message est haineux ou inapproprié, réponds UNIQUEMENT : "INTERFÉRENCE ENTROPIQUE : SIGNAL CORROMPU".`,
  });
  return response.text || "Un écho silencieux parcourt le territoire.";
};

export const generateVictoryChronicle = async (missionTitle: string, goal: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Ecris une Chronique de Victoire épique pour le Territoire Vivant. 
    Les Gardiens ont réussi la mission collective : "${missionTitle}" (Objectif: ${goal}).
    Le ton doit être solennel, futuriste et profondément écologique. Max 50 mots.`,
  });
  return response.text || "Le territoire a trouvé son équilibre. La symbiose est accomplie.";
};

export const generateWeatherAdvice = async (weather: WeatherType, temp: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tu es l'Esprit du Territoire. La météo actuelle est : ${weather} avec ${temp}°C. 
    Donne un conseil poétique et court (max 15 mots) à un Gardien qui part en exploration.`,
  });
  return response.text || "Le ciel guide vos pas, restez à l'écoute des souffles de vie.";
};
