import React, { useState, useEffect, useRef } from 'react';
import {
  PlayerProfile, Vehicle, Weapon, Mission, Zone, GameHUDState
} from './types/game';
import {
  INITIAL_VEHICLES, INITIAL_WEAPONS, INITIAL_ZONES, MISSIONS_LIST,
  getXpRequiredForLevel, getVehicleUpgradeCost
} from './data/gameData';
import { RoadWarsEngine } from './game/RoadWarsEngine';
import { soundManager } from './audio/soundManager';
import { GameHUD } from './components/GameHUD';
import { GarageView } from './components/GarageView';
import { ArmoryView } from './components/ArmoryView';
import { MissionsView } from './components/MissionsView';
import { GDDStation } from './components/GDDStation';
import { MissionResultModal } from './components/MissionResultModal';
import {
  Car, Crosshair, Flag, FileText, Volume2, VolumeX,
  Sparkles, DollarSign, Award, PlusCircle
} from 'lucide-react';

const STORAGE_KEY = 'road_wars_3d_save_v1';

const DEFAULT_PROFILE: PlayerProfile = {
  level: 1,
  xp: 0,
  xpToNext: getXpRequiredForLevel(1),
  coins: 2500, // Generous starting funds for immediate upgrade delight
  selectedVehicleId: 'veh_viper',
  equippedPrimaryId: 'wpn_gatling',
  equippedSecondaryId: 'wpn_missile',
  vehicles: INITIAL_VEHICLES,
  weapons: INITIAL_WEAPONS,
  completedMissions: {},
  stats: {
    totalKills: 0,
    totalRaces: 0,
    victories: 0,
    totalCoinsEarned: 0,
    bossesDefeated: 0,
  },
};

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch {}
    return DEFAULT_PROFILE;
  });

  const [currentView, setCurrentView] = useState<'missions' | 'garage' | 'armory' | 'gdd' | 'game'>('missions');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Active game session states
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [hudState, setHudState] = useState<GameHUDState>({
    speed: 0,
    gear: 1,
    health: 200,
    maxHealth: 200,
    armor: 25,
    maxArmor: 25,
    nitro: 5,
    maxNitro: 5,
    fuel: 100,
    maxFuel: 100,
    isNitroActive: false,
    kills: 0,
    targetKills: 5,
    timeRemaining: 90,
    primaryAmmo: 60,
    maxPrimaryAmmo: 60,
    isPrimaryReloading: false,
    secondaryAmmo: 4,
    maxSecondaryAmmo: 4,
    secondaryCooldown: 0,
    comboCount: 0,
    comboTimer: 0,
  });

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [missionResult, setMissionResult] = useState<{
    victory: boolean;
    reason: string;
    coinsEarned: number;
    xpEarned: number;
    kills: number;
    timeTaken: number;
    stars: number;
  } | null>(null);

  // 3D Game Canvas Ref
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RoadWarsEngine | null>(null);

  // Save to LocalStorage on profile change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  // Launch a 3D race mission
  const handleLaunchMission = (mission: Mission, zone: Zone) => {
    setActiveMission(mission);
    setActiveZone(zone);
    setMissionResult(null);
    setIsPaused(false);
    setCurrentView('game');
  };

  // Instantiate 3D game engine when entering 'game' mode
  useEffect(() => {
    if (currentView !== 'game' || !activeMission || !activeZone || !gameContainerRef.current) return;

    const currentVeh = profile.vehicles.find((v) => v.id === profile.selectedVehicleId) || profile.vehicles[0];
    const currentPrimary = profile.weapons.find((w) => w.id === profile.equippedPrimaryId) || profile.weapons[0];
    const currentSecondary = profile.weapons.find((w) => w.id === profile.equippedSecondaryId) || profile.weapons[3];

    const engine = new RoadWarsEngine(
      gameContainerRef.current,
      currentVeh,
      currentPrimary,
      currentSecondary,
      activeMission,
      activeZone,
      {
        onHUDUpdate: (newState) => {
          setHudState(newState);
        },
        onTogglePause: () => {
          setIsPaused((prev) => !prev);
        },
        onMissionComplete: (res) => {
          setMissionResult(res);

          // Update player profile XP and Coins
          setProfile((prev) => {
            const newCoins = prev.coins + res.coinsEarned;
            let newXp = prev.xp + res.xpEarned;
            let newLevel = prev.level;
            let newXpToNext = prev.xpToNext;

            // Check level up
            while (newXp >= newXpToNext && newLevel < 20) {
              newXp -= newXpToNext;
              newLevel += 1;
              newXpToNext = getXpRequiredForLevel(newLevel);
            }

            const existingMission = prev.completedMissions[activeMission.id];
            const updatedCompleted = {
              ...prev.completedMissions,
              [activeMission.id]: {
                stars: Math.max(existingMission ? existingMission.stars : 0, res.stars),
                highKills: Math.max(existingMission ? existingMission.highKills : 0, res.kills),
                bestTime: Math.min(existingMission ? existingMission.bestTime : 9999, res.timeTaken),
              },
            };

            return {
              ...prev,
              level: newLevel,
              xp: newXp,
              xpToNext: newXpToNext,
              coins: newCoins,
              completedMissions: updatedCompleted,
              stats: {
                totalKills: prev.stats.totalKills + res.kills,
                totalRaces: prev.stats.totalRaces + 1,
                victories: prev.stats.victories + (res.victory ? 1 : 0),
                totalCoinsEarned: prev.stats.totalCoinsEarned + res.coinsEarned,
                bossesDefeated: prev.stats.bossesDefeated + (activeMission.type === 'boss_showdown' && res.victory ? 1 : 0),
              },
            };
          });
        },
      }
    );

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [currentView, activeMission, activeZone]);

  const handleRestartMission = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setMissionResult(null);
    setIsPaused(false);

    // Re-trigger game start
    if (activeMission && activeZone && gameContainerRef.current) {
      const currentVeh = profile.vehicles.find((v) => v.id === profile.selectedVehicleId) || profile.vehicles[0];
      const currentPrimary = profile.weapons.find((w) => w.id === profile.equippedPrimaryId) || profile.weapons[0];
      const currentSecondary = profile.weapons.find((w) => w.id === profile.equippedSecondaryId) || profile.weapons[3];

      engineRef.current = new RoadWarsEngine(
        gameContainerRef.current,
        currentVeh,
        currentPrimary,
        currentSecondary,
        activeMission,
        activeZone,
        {
          onHUDUpdate: (newState) => setHudState(newState),
          onTogglePause: () => setIsPaused((prev) => !prev),
          onMissionComplete: (res) => setMissionResult(res),
        }
      );
    }
  };

  const handleNextMission = () => {
    if (!activeMission) return;
    const currentIndex = MISSIONS_LIST.findIndex((m) => m.id === activeMission.id);
    if (currentIndex >= 0 && currentIndex < MISSIONS_LIST.length - 1) {
      const nextM = MISSIONS_LIST[currentIndex + 1];
      const nextZ = INITIAL_ZONES.find((z) => z.id === nextM.zoneId) || INITIAL_ZONES[0];
      handleLaunchMission(nextM, nextZ);
    } else {
      setCurrentView('missions');
    }
  };

  const handleReturnToGarage = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setMissionResult(null);
    setIsPaused(false);
    setCurrentView('garage');
  };

  // Upgrades & Purchasing
  const handleUpgradeVehicleStat = (vehicleId: string, statKey: keyof Vehicle['currentUpgrades']) => {
    const veh = profile.vehicles.find((v) => v.id === vehicleId);
    if (!veh) return;

    const currentLvl = veh.currentUpgrades[statKey];
    if (currentLvl >= 5) return;

    const cost = getVehicleUpgradeCost(statKey, currentLvl, veh.tier);
    if (profile.coins < cost) return;

    setProfile((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      vehicles: prev.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              currentUpgrades: {
                ...v.currentUpgrades,
                [statKey]: currentLvl + 1,
              },
            }
          : v
      ),
    }));
  };

  const handlePurchaseVehicle = (vehicleId: string) => {
    const veh = profile.vehicles.find((v) => v.id === vehicleId);
    if (!veh || profile.coins < veh.price) return;

    setProfile((prev) => ({
      ...prev,
      coins: prev.coins - veh.price,
      selectedVehicleId: veh.id,
    }));
  };

  const handleUpdateVehicleColors = (vehicleId: string, colors: { primary: string; accent: string; neon: string }) => {
    setProfile((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              paintColor: colors.primary,
              accentColor: colors.accent,
              neonColor: colors.neon,
            }
          : v
      ),
    }));
  };

  const handleEquipWeapon = (weaponId: string, type: 'primary' | 'secondary') => {
    setProfile((prev) => ({
      ...prev,
      equippedPrimaryId: type === 'primary' ? weaponId : prev.equippedPrimaryId,
      equippedSecondaryId: type === 'secondary' ? weaponId : prev.equippedSecondaryId,
    }));
  };

  const handleUpgradeWeapon = (weaponId: string) => {
    const wpn = profile.weapons.find((w) => w.id === weaponId);
    if (!wpn || wpn.level >= wpn.maxLevel) return;

    const cost = Math.floor((wpn.type === 'primary' ? 600 : 1200) * Math.pow(1.7, wpn.level));
    if (profile.coins < cost) return;

    setProfile((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      weapons: prev.weapons.map((w) =>
        w.id === weaponId ? { ...w, level: w.level + 1 } : w
      ),
    }));
  };

  const handleUnlockWeapon = (weaponId: string) => {
    const wpn = profile.weapons.find((w) => w.id === weaponId);
    if (!wpn || profile.coins < wpn.price) return;

    setProfile((prev) => ({
      ...prev,
      coins: prev.coins - wpn.price,
    }));
  };

  // Developer / Game Designer bonus coin trigger
  const handleGrantBonusCoins = () => {
    soundManager.playCoin();
    setProfile((prev) => ({ ...prev, coins: prev.coins + 5000 }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* TOP BAR CONTRACT: Zone 1 (Wordmark) - Zone 2 (4 Navigation Links) - Zone 3 (Profile coins + actions) */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-950 px-6 flex items-center justify-between shrink-0 z-30">
        {/* Zone 1: Single text element wordmark in display face */}
        <span className="text-lg font-bold tracking-tight text-white font-display">
          ROAD WARS 3D
        </span>

        {/* Zone 2: 4 Clean Navigation Text Links with subtle hover/active states */}
        <nav className="flex items-center gap-6 text-xs font-medium text-neutral-400">
          <button
            onClick={() => {
              soundManager.playHit();
              setCurrentView('missions');
            }}
            className={`transition-colors flex items-center gap-1.5 ${
              currentView === 'missions' ? 'text-white font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-orange-400" />
            <span>Chiến Dịch</span>
          </button>

          <button
            onClick={() => {
              soundManager.playHit();
              setCurrentView('garage');
            }}
            className={`transition-colors flex items-center gap-1.5 ${
              currentView === 'garage' ? 'text-white font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span>Gara Xe</span>
          </button>

          <button
            onClick={() => {
              soundManager.playHit();
              setCurrentView('armory');
            }}
            className={`transition-colors flex items-center gap-1.5 ${
              currentView === 'armory' ? 'text-white font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-red-400" />
            <span>Kho Súng</span>
          </button>

          <button
            onClick={() => {
              soundManager.playHit();
              setCurrentView('gdd');
            }}
            className={`transition-colors flex items-center gap-1.5 ${
              currentView === 'gdd' ? 'text-white font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bản Thiết Kế GDD</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions (Level, Coins & Audio Toggle) */}
        <div className="flex items-center gap-3">
          {/* Level Progress */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-cyan-400">LVL {profile.level}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-400 tabular-nums">{profile.xp}/{profile.xpToNext} XP</span>
          </div>

          {/* Coins Readout */}
          <div className="flex items-center gap-1.5 text-xs font-mono bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-400 tabular-nums">{profile.coins.toLocaleString()}</span>
            <button
              onClick={handleGrantBonusCoins}
              className="text-neutral-400 hover:text-amber-400 transition-colors ml-1"
              title="Nhận 5.000 Xu thử nghiệm xe nhanh"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 relative overflow-hidden">
        {/* 1. Missions Campaign View */}
        {currentView === 'missions' && (
          <MissionsView profile={profile} onLaunchMission={handleLaunchMission} />
        )}

        {/* 2. 3D Garage Workshop */}
        {currentView === 'garage' && (
          <GarageView
            profile={profile}
            onSelectVehicle={(id) => setProfile((p) => ({ ...p, selectedVehicleId: id }))}
            onUpgradeStat={handleUpgradeVehicleStat}
            onPurchaseVehicle={handlePurchaseVehicle}
            onUpdateColors={handleUpdateVehicleColors}
          />
        )}

        {/* 3. Armory & Weapon Workbench */}
        {currentView === 'armory' && (
          <ArmoryView
            profile={profile}
            onEquipWeapon={handleEquipWeapon}
            onUpgradeWeapon={handleUpgradeWeapon}
            onUnlockWeapon={handleUnlockWeapon}
          />
        )}

        {/* 4. Complete GDD Station */}
        {currentView === 'gdd' && <GDDStation />}

        {/* 5. 3D In-Game Racing View */}
        {currentView === 'game' && activeMission && (
          <div className="relative w-full h-full">
            {/* Three.js 3D WebGL Canvas */}
            <div ref={gameContainerRef} className="w-full h-full bg-black cursor-crosshair" />

            {/* In-game Overlay HUD */}
            <GameHUD
              state={hudState}
              mission={activeMission}
              isPaused={isPaused}
              onPauseToggle={() => setIsPaused(!isPaused)}
              onRestart={handleRestartMission}
              onQuit={handleReturnToGarage}
              onVirtualInput={(code, pressed) => {
                if (engineRef.current) {
                  engineRef.current.setInputKey(code, pressed);
                }
              }}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />

            {/* Mission Result Modal */}
            {missionResult && (
              <MissionResultModal
                result={missionResult}
                onPlayAgain={handleRestartMission}
                onNextMission={handleNextMission}
                onReturnToGarage={handleReturnToGarage}
                isNextAvailable={
                  MISSIONS_LIST.findIndex((m) => m.id === activeMission.id) < MISSIONS_LIST.length - 1
                }
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
