import React, { useState } from 'react';
import { Weapon, PlayerProfile } from '../types/game';
import { calculateWeaponActualStats, getWeaponUpgradeCost } from '../data/gameData';
import { soundManager } from '../audio/soundManager';
import { Crosshair, Zap, ShieldAlert, Flame, Check, Lock, ArrowUpCircle } from 'lucide-react';

interface ArmoryViewProps {
  profile: PlayerProfile;
  onEquipWeapon: (weaponId: string, type: 'primary' | 'secondary') => void;
  onUpgradeWeapon: (weaponId: string) => void;
  onUnlockWeapon: (weaponId: string) => void;
}

export const ArmoryView: React.FC<ArmoryViewProps> = ({
  profile,
  onEquipWeapon,
  onUpgradeWeapon,
  onUnlockWeapon,
}) => {
  const [selectedType, setSelectedType] = useState<'primary' | 'secondary'>('primary');
  const [activeWeaponId, setActiveWeaponId] = useState<string>(
    selectedType === 'primary' ? profile.equippedPrimaryId : profile.equippedSecondaryId
  );

  const currentWeapons = profile.weapons.filter((w) => w.type === selectedType);
  const selectedWeapon = currentWeapons.find((w) => w.id === activeWeaponId) || currentWeapons[0];
  const actualStats = calculateWeaponActualStats(selectedWeapon);

  const isEquipped =
    selectedWeapon.id === (selectedType === 'primary' ? profile.equippedPrimaryId : profile.equippedSecondaryId);
  const isUnlocked = selectedWeapon.price === 0 || profile.level >= selectedWeapon.unlockLevel;
  const canAffordUnlock = profile.coins >= selectedWeapon.price;

  const upgradeCost = getWeaponUpgradeCost(selectedWeapon.level, selectedWeapon.type);
  const isMaxLevel = selectedWeapon.level >= selectedWeapon.maxLevel;
  const canAffordUpgrade = profile.coins >= upgradeCost && !isMaxLevel;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* LEFT: Weapons Grid & Filter Tabs */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[11px] font-mono text-orange-400 uppercase tracking-widest">Kho Vũ Khí Quân Sự</div>
            <h1 className="text-2xl font-display font-black text-white uppercase">VŨ KHÍ CHIẾN ĐẤU</h1>
          </div>

          {/* Segmented Type Filter */}
          <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setSelectedType('primary');
                setActiveWeaponId(profile.equippedPrimaryId);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === 'primary' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Vũ Khí Chính (Súng)
            </button>
            <button
              onClick={() => {
                setSelectedType('secondary');
                setActiveWeaponId(profile.equippedSecondaryId);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === 'secondary' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Vũ Khí Phụ (Tên Lửa / Bom)
            </button>
          </div>
        </div>

        {/* Weapons Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentWeapons.map((wpn) => {
            const isSelected = wpn.id === selectedWeapon.id;
            const isEquippedCard =
              wpn.id === (selectedType === 'primary' ? profile.equippedPrimaryId : profile.equippedSecondaryId);
            const isWpnUnlocked = wpn.price === 0 || profile.level >= wpn.unlockLevel;

            return (
              <div
                key={wpn.id}
                onClick={() => {
                  soundManager.playHit();
                  setActiveWeaponId(wpn.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-neutral-900 border-orange-500 shadow-xl ring-1 ring-orange-500/50'
                    : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: wpn.color }} />
                      <h3 className="font-display font-bold text-sm text-neutral-100">{wpn.vietnameseName}</h3>
                    </div>
                    {isEquippedCard && (
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        ĐANG TRANG BỊ
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 mb-3">{wpn.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs font-mono">
                  <span className="text-neutral-500">Cấp {wpn.level}/{wpn.maxLevel}</span>
                  {!isWpnUnlocked ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Mở khóa Lvl {wpn.unlockLevel}
                    </span>
                  ) : (
                    <span className="text-orange-400 font-bold">{wpn.damage} Sát thương</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Weapon Detail & Workbench */}
      <div className="w-full lg:w-[460px] bg-neutral-900/90 border-l border-neutral-800 p-6 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Chi Tiết Vũ Khí</span>
              <span className="text-xs font-mono text-orange-400 font-bold">CẤP {selectedWeapon.level} / {selectedWeapon.maxLevel}</span>
            </div>
            <h2 className="text-2xl font-display font-black text-white uppercase">{selectedWeapon.vietnameseName}</h2>
            <p className="text-xs text-neutral-400 mt-1">{selectedWeapon.description}</p>
          </div>

          {/* Stats Breakdown */}
          <div className="flex flex-col gap-3 bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-500" /> Sát Thương Cơ Bản
              </span>
              <span className="font-mono font-bold text-neutral-100">{actualStats.damage} Dmg</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Tốc Độ Bắn
              </span>
              <span className="font-mono font-bold text-neutral-100">{actualStats.fireRate} Viên/Giây</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-cyan-500" /> Tầm Bắn Tối Đa
              </span>
              <span className="font-mono font-bold text-neutral-100">{actualStats.range} Mét</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-500" /> Sức Chứa Băng Đạn
              </span>
              <span className="font-mono font-bold text-neutral-100">{actualStats.ammoCapacity} Viên</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <ArrowUpCircle className="w-4 h-4 text-blue-500" /> Thời Gian Hồi / Nạp
              </span>
              <span className="font-mono font-bold text-neutral-100">{actualStats.cooldown}s</span>
            </div>
          </div>

          {/* Upgrade progress bar */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-400">Tiến Trình Nâng Cấp</span>
              <span className="text-orange-400">{selectedWeapon.level} / {selectedWeapon.maxLevel}</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div
                  key={lvl}
                  className={`h-2.5 flex-1 rounded-sm ${
                    lvl <= selectedWeapon.level ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons: Equip / Upgrade / Unlock */}
        <div className="flex flex-col gap-3 pt-6 border-t border-neutral-800">
          {!isUnlocked ? (
            <button
              disabled={!canAffordUnlock || profile.level < selectedWeapon.unlockLevel}
              onClick={() => onUnlockWeapon(selectedWeapon.id)}
              className={`w-full py-3.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider ${
                canAffordUnlock && profile.level >= selectedWeapon.unlockLevel
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              Mở Khóa Vũ Khí ({selectedWeapon.price.toLocaleString()} Xu)
            </button>
          ) : (
            <>
              {/* Equip Button */}
              <button
                disabled={isEquipped}
                onClick={() => {
                  soundManager.playCoin();
                  onEquipWeapon(selectedWeapon.id, selectedWeapon.type);
                }}
                className={`w-full py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${
                  isEquipped
                    ? 'bg-neutral-800 text-emerald-400 cursor-default border border-emerald-500/30'
                    : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}
              >
                {isEquipped ? <><Check className="w-4 h-4" /> Đang Trang Bị</> : 'Trang Bị Vào Xe'}
              </button>

              {/* Upgrade Button */}
              <button
                disabled={!canAffordUpgrade || isMaxLevel}
                onClick={() => {
                  soundManager.playCoin();
                  onUpgradeWeapon(selectedWeapon.id);
                }}
                className={`w-full py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider border ${
                  isMaxLevel
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                    : canAffordUpgrade
                    ? 'bg-neutral-950 border-orange-500 hover:bg-orange-500/20 text-orange-400'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isMaxLevel ? 'ĐÃ ĐẠT CẤP TỐI ĐA' : `+ Nâng Cấp (+28% Dmg) - ${upgradeCost.toLocaleString()} Xu`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
