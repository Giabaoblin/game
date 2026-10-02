export type ZoneTheme = 'desert' | 'neon' | 'industrial' | 'military';

export type MissionType = 
  | 'time_trial' 
  | 'kill_target' 
  | 'vip_assassination' 
  | 'convoy_raid' 
  | 'pursuit_escape' 
  | 'boss_showdown' 
  | 'escort' 
  | 'fuel_rush';

export interface VehicleStats {
  topSpeed: number; // km/h (140 - 320)
  acceleration: number; // 0-100 scale (1-10)
  handling: number; // steer response & grip (1-10)
  armor: number; // damage reduction % (10% - 70%)
  health: number; // HP (100 - 450)
  nitro: number; // boost capacity seconds (3 - 10)
}

export interface Vehicle {
  id: string;
  name: string;
  tier: number;
  description: string;
  vietnameseName: string;
  vietnameseDesc: string;
  unlockLevel: number;
  price: number;
  baseStats: VehicleStats;
  currentUpgrades: {
    topSpeed: number; // 0 to 5
    acceleration: number;
    handling: number;
    armor: number;
    health: number;
    nitro: number;
  };
  paintColor: string;
  accentColor: string;
  neonColor: string;
  modelType: 'interceptor' | 'buggy' | 'truck' | 'cyber' | 'juggernaut' | 'doomsday';
}

export type WeaponType = 'primary' | 'secondary';
export type WeaponCategory = 'minigun' | 'shotgun' | 'plasma' | 'missile' | 'emp' | 'bomb';

export interface Weapon {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  type: WeaponType;
  category: WeaponCategory;
  unlockLevel: number;
  price: number;
  level: number;
  maxLevel: number;
  damage: number;
  fireRate: number; // shots per second
  range: number; // meters
  ammoCapacity: number; // max ammo before reload / cooldown
  cooldown: number; // seconds
  color: string;
}

export interface Mission {
  id: string;
  zoneId: string;
  zoneIndex: number;
  level: number;
  title: string;
  vietnameseTitle: string;
  description: string;
  vietnameseDesc: string;
  type: MissionType;
  targetCount: number;
  timeLimit: number; // seconds
  rewardCoins: number;
  rewardXp: number;
  bossName?: string;
  bossType?: 'tank_truck' | 'cyber_racer' | 'armored_convoy' | 'heavy_war_machine';
  starRequirements: {
    oneStar: string;
    twoStar: string;
    threeStar: string;
  };
}

export interface Zone {
  id: string;
  name: string;
  vietnameseName: string;
  theme: ZoneTheme;
  bossName: string;
  bossTitle: string;
  description: string;
  requiredPlayerLevel: number;
  skyColor: string;
  fogColor: string;
  groundColor: string;
  roadColor: string;
}

export interface PlayerProfile {
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  selectedVehicleId: string;
  equippedPrimaryId: string;
  equippedSecondaryId: string;
  vehicles: Vehicle[];
  weapons: Weapon[];
  completedMissions: Record<string, { stars: number; highKills: number; bestTime: number }>;
  stats: {
    totalKills: number;
    totalRaces: number;
    victories: number;
    totalCoinsEarned: number;
    bossesDefeated: number;
  };
}

export interface GameHUDState {
  speed: number;
  gear: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  nitro: number;
  maxNitro: number;
  fuel: number;
  maxFuel: number;
  isNitroActive: boolean;
  kills: number;
  targetKills: number;
  timeRemaining: number;
  primaryAmmo: number;
  maxPrimaryAmmo: number;
  isPrimaryReloading: boolean;
  secondaryAmmo: number;
  maxSecondaryAmmo: number;
  secondaryCooldown: number; // 0 to 1 ratio
  comboCount: number;
  comboTimer: number;
  bossHealth?: number;
  bossMaxHealth?: number;
  bossName?: string;
  escortHealth?: number;
  notification?: string;
}
