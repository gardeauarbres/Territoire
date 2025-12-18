
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Profile as ProfileType, Badge, MissionCompletion, ImpactStats, Spot } from '../types';
import { ICONS } from '../constants';
import * as RouterDOM from 'react-router-dom';

const { Link } = RouterDOM;

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completions, setCompletions] = useState<MissionCompletion[]>([]);
  const [impact, setImpact] = useState<ImpactStats>({ carbon: 0, water: 0, biodiversity: 0 });
  const [mySpots, setMySpots] = useState<Spot[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, b, c, i, allSpots] = await Promise.all([
        db.getProfile(),
        db.getBadges(),
        db.getCompletions(),
        db.getImpactStats(),
        db.getSpots()
      ]);
      setProfile(p);
      setBadges(b);
      setCompletions(c);
      setImpact(i);
      setMySpots(allSpots.filter(s => s.owner_id === p.id));
    };
    load();
  }, []);

  if (!profile) return null;

  const xpProgress = (profile.xp % 500) / 5;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full border-2 border-green-500/50 p-1 group-hover:neon-glow transition-all overflow-hidden bg-green-950/20">
            <img src={profile.avatar_url} className="w-full h-full rounded-full grayscale hover:grayscale-0 transition-all object-cover scale-110" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-black font-bold text-xs w-8 h-8 flex items-center justify-center rounded-full border-4 border-[#050801] shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            {profile.level}
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-widest text-white uppercase">{profile.username}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="h-px w-4 bg-green-900"></span>
            <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">
              {profile.level >= 10 ? 'Maître Protecteur Titulaire' : 'Gardien de Territoire l-04'}
            </p>
            <span className="h-px w-4 bg-green-900"></span>
          </div>
        </div>
      </div>

      {/* Sanctuaires Gardés Section */}
      {mySpots.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-500 px-1 border-l-2 border-yellow-500/50 ml-1">Sanctuaires Sous Votre Garde</h3>
          <div className="grid grid-cols-1 gap-2">
            {mySpots.map(spot => (
              <Link key={spot.id} to={`/spot/${spot.id}`} className="glass-panel p-3 rounded-xl flex items-center justify-between border-yellow-500/20 hover:border-yellow-500/50 transition-all">
                <div className="flex items-center gap-3">
                   <div className="text-yellow-500">{ICONS[spot.type as keyof typeof ICONS]}</div>
                   <span className="text-xs font-bold text-white uppercase">{spot.name}</span>
                </div>
                <i className="fas fa-chevron-right text-[8px] text-yellow-900"></i>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Progression XP */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-green-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl transform rotate-12">{ICONS.XP}</div>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Réserve d'Expérience</span>
              <div className="text-3xl font-bold text-white leading-none mt-1">
                {profile.xp} <span className="text-xs text-green-500 font-mono font-normal">XP</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Prochain Grade</span>
              <div className="text-sm font-mono text-green-400 mt-1">{(profile.level) * 500} XP</div>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-900/50 rounded-full overflow-hidden border border-green-950">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-1000 ease-out" 
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Impact Ecosystem Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 px-1 border-l-2 border-green-500/50 ml-1">Bilan d'Impact Écologique</h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-blue-500 bg-blue-950/5">
             <div className="flex items-center gap-4">
                <div className="text-2xl text-blue-400">{ICONS.WATER}</div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Eau Préservée</div>
                  <div className="text-xl font-bold text-white">{impact.water.toFixed(0)} <span className="text-[10px] font-normal text-blue-400">Litres</span></div>
                </div>
             </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-green-600 bg-green-950/5">
             <div className="flex items-center gap-4">
                <div className="text-2xl text-green-600"><i className="fas fa-cloud-download-alt"></i></div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">CO2 Capturé</div>
                  <div className="text-xl font-bold text-white">{impact.carbon.toFixed(1)} <span className="text-[10px] font-normal text-green-600">kg</span></div>
                </div>
             </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-lime-500 bg-lime-950/5">
             <div className="flex items-center gap-4">
                <div className="text-2xl text-lime-400">{ICONS.ZONE}</div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Biodiversité Soutenue</div>
                  <div className="text-xl font-bold text-white">{impact.biodiversity.toFixed(0)} <span className="text-[10px] font-normal text-lime-400">Unités</span></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 px-1 border-l-2 border-green-500/50 ml-1">Distinctions du Territoire</h3>
        <div className="grid grid-cols-3 gap-3">
          {badges.map(badge => {
             const isUnlocked = completions.length >= badge.requirement_value || profile.level >= badge.requirement_value;
             return (
              <div key={badge.id} className={`glass-panel p-3 rounded-xl flex flex-col items-center gap-2 group transition-all border ${
                isUnlocked ? 'border-green-500/20 bg-green-950/10' : 'opacity-30 border-slate-800'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                  isUnlocked ? 'text-green-500 bg-green-950/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'text-slate-600 bg-slate-900'
                }`}>
                  <i className={isUnlocked ? badge.icon : 'fas fa-lock'}></i>
                </div>
                <span className={`text-[9px] font-bold text-center leading-tight uppercase tracking-tighter ${
                  isUnlocked ? 'text-slate-300' : 'text-slate-600'
                }`}>{isUnlocked ? badge.name : 'Vérrouillé'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Profile;
