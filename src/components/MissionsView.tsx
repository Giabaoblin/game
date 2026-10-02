import React, { useState } from 'react';
import { Mission, Zone, PlayerProfile } from '../types/game';
import { INITIAL_ZONES, MISSIONS_LIST } from '../data/gameData';
import { soundManager } from '../audio/soundManager';
import { Flag, Star, Trophy, Clock, Target, Shield, Skull, Play, Lock, Sparkles, Flame } from 'lucide-react';

interface MissionsViewProps {
  profile: PlayerProfile;
  onLaunchMission: (mission: Mission, zone: Zone) => void;
}

export const MissionsView: React.FC<MissionsViewProps> = ({ profile, onLaunchMission }) => {
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number>(0);
  const [selectedMissionId, setSelectedMissionId] = useState<string>(MISSIONS_LIST[0].id);

  const currentZone = INITIAL_ZONES[selectedZoneIndex];
  const zoneMissions = MISSIONS_LIST.filter((m) => m.zoneId === currentZone.id);
  const selectedMission = MISSIONS_LIST.find((m) => m.id === selectedMissionId) || zoneMissions[0];

  const isZoneLocked = profile.level < currentZone.requiredPlayerLevel;
  const missionProgress = profile.completedMissions[selectedMission.id];

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* LEFT: Zone Selector & Missions List */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] font-mono text-orange-400 uppercase tracking-widest">Bản Đồ Chiến Dịch</div>
            <h1 className="text-2xl font-display font-black text-white uppercase">20 CHIẾN DỊCH KHẮC NGHIỆT</h1>
          </div>

          {/* Zone Selection Tabs */}
          <div className="flex gap-1.5 bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl overflow-x-auto">
            {INITIAL_ZONES.map((zone, idx) => {
              const isLocked = profile.level < zone.requiredPlayerLevel;
              const isSelected = idx === selectedZoneIndex;

              return (
                <button
                  key={zone.id}
                  onClick={() => {
                    soundManager.playHit();
                    setSelectedZoneIndex(idx);
                    const firstMis = MISSIONS_LIST.find((m) => m.zoneId === zone.id);
                    if (firstMis) setSelectedMissionId(firstMis.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {isLocked && <Lock className="w-3.5 h-3.5 text-neutral-500" />}
                  <span>{zone.vietnameseName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone Overview Banner */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-orange-400 uppercase">KHU VỰC {selectedZoneIndex + 1}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-xs text-neutral-400">Yêu cầu Level {currentZone.requiredPlayerLevel}</span>
            </div>
            <h2 className="text-lg font-display font-bold text-white uppercase">{currentZone.vietnameseName}</h2>
            <p className="text-xs text-neutral-400 max-w-xl">{currentZone.description}</p>
          </div>

          <div className="bg-neutral-950/70 border border-red-500/30 p-2.5 rounded-xl flex items-center gap-2.5 shrink-0">
            <Flame className="w-5 h-5 text-red-500" />
            <div className="text-left">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">TRÙM KHU VỰC</div>
              <div className="text-xs font-display font-bold text-red-400">{currentZone.bossName}</div>
            </div>
          </div>
        </div>

        {/* Missions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {zoneMissions.map((m) => {
            const isSelected = m.id === selectedMission.id;
            const prog = profile.completedMissions[m.id];
            const isBoss = m.type === 'boss_showdown';

            return (
              <div
                key={m.id}
                onClick={() => {
                  soundManager.playHit();
                  setSelectedMissionId(m.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-neutral-900 border-orange-500 shadow-xl ring-1 ring-orange-500/50'
                    : isBoss
                    ? 'bg-neutral-950/80 border-red-500/40 hover:border-red-500'
                    : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-500">#{m.level}</span>
                      <h3 className="font-display font-bold text-sm text-neutral-100 flex items-center gap-1.5">
                        {isBoss && <Skull className="w-4 h-4 text-red-500" />}
                        {m.vietnameseTitle}
                      </h3>
                    </div>

                    {/* Stars Earned */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            prog && prog.stars >= starIdx
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2">{m.vietnameseDesc}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs font-mono">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    {m.timeLimit}s
                  </span>
                  <span className="text-amber-400 font-bold">+{m.rewardCoins.toLocaleString()} Xu</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Selected Mission Operations Briefing */}
      <div className="w-full lg:w-[440px] bg-neutral-900/90 border-l border-neutral-800 p-6 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-orange-400 uppercase tracking-widest mb-1">
              <span>HỒ SƠ TÁC CHIẾN #{selectedMission.level}</span>
              <span>·</span>
              <span className="text-neutral-500">{currentZone.name}</span>
            </div>
            <h2 className="text-2xl font-display font-black text-white uppercase">{selectedMission.vietnameseTitle}</h2>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{selectedMission.vietnameseDesc}</p>
          </div>

          {/* Mission Objectives Breakdown */}
          <div className="flex flex-col gap-3 bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800">
            <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">Thông Số Nhiệm Vụ</h4>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-orange-400" /> Loại Nhiệm Vụ
              </span>
              <span className="font-mono font-bold text-neutral-200 uppercase">
                {selectedMission.type.replace('_', ' ')}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" /> Giới Hạn Thời Gian
              </span>
              <span className="font-mono font-bold text-neutral-200">{selectedMission.timeLimit} Giây</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-red-400" /> Mục Tiêu Cần Hạ
              </span>
              <span className="font-mono font-bold text-neutral-200">{selectedMission.targetCount} Chiếc</span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-800">
              <span className="text-neutral-400">Phần Thưởng Hoàn Thành</span>
              <span className="font-mono font-bold text-amber-400">
                +{selectedMission.rewardCoins} Xu · +{selectedMission.rewardXp} XP
              </span>
            </div>
          </div>

          {/* 3 Stars Condition Checklist */}
          <div className="flex flex-col gap-2.5 bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800">
            <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" /> Điều Kiện Đạt 3 Sao
            </h4>

            <div className="flex items-center gap-2 text-xs">
              <Star className={`w-4 h-4 ${missionProgress && missionProgress.stars >= 1 ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'}`} />
              <span className="text-neutral-300">{selectedMission.starRequirements.oneStar}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Star className={`w-4 h-4 ${missionProgress && missionProgress.stars >= 2 ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'}`} />
              <span className="text-neutral-300">{selectedMission.starRequirements.twoStar}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Star className={`w-4 h-4 ${missionProgress && missionProgress.stars >= 3 ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'}`} />
              <span className="text-neutral-300">{selectedMission.starRequirements.threeStar}</span>
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-6 border-t border-neutral-800">
          <button
            disabled={isZoneLocked}
            onClick={() => {
              soundManager.playCoin();
              onLaunchMission(selectedMission, currentZone);
            }}
            className={`w-full py-4 rounded-2xl font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-2xl ${
              isZoneLocked
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-orange-600/30'
            }`}
          >
            {isZoneLocked ? (
              <>
                <Lock className="w-4 h-4" /> Yêu cầu Level {currentZone.requiredPlayerLevel}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> XUẤT PHÁT CHIẾN ĐẤU
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
