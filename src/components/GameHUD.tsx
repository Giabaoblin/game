import React from 'react';
import { GameHUDState, Mission } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Home, Crosshair, Zap, Shield, Flame, Gauge } from 'lucide-react';

interface GameHUDProps {
  state: GameHUDState;
  mission: Mission;
  isPaused: boolean;
  onPauseToggle: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onVirtualInput: (code: string, pressed: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  mission,
  isPaused,
  onPauseToggle,
  onRestart,
  onQuit,
  onVirtualInput,
  isMuted,
  onToggleMute,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (state.health / state.maxHealth) * 100));
  const armorPercent = Math.max(0, Math.min(100, (state.armor / state.maxArmor) * 100));
  const nitroPercent = Math.max(0, Math.min(100, (state.nitro / state.maxNitro) * 100));
  const fuelPercent = Math.max(0, Math.min(100, (state.fuel / state.maxFuel) * 100));
  const bossPercent = state.bossHealth !== undefined && state.bossMaxHealth ? Math.max(0, Math.min(100, (state.bossHealth / state.bossMaxHealth) * 100)) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* 1. TOP BAR: Mission Tracker & Boss Health */}
      <div className="absolute top-4 left-0 right-0 px-4 md:px-8 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Boss HP Bar */}
        {state.bossName && (
          <div className="w-full max-w-xl bg-neutral-900/90 border border-red-500/40 rounded-xl p-2.5 backdrop-blur-md shadow-2xl animate-pulse">
            <div className="flex justify-between items-center text-xs font-display tracking-wider mb-1">
              <span className="text-red-400 font-bold uppercase flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-500" />
                TRÙM: {state.bossName}
              </span>
              <span className="text-neutral-400 font-mono tabular-nums">{state.bossHealth} / {state.bossMaxHealth} HP</span>
            </div>
            <div className="w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-red-950">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-all duration-150"
                style={{ width: `${bossPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Mission Objectives Ribbon */}
        <div className="flex items-center justify-between w-full max-w-3xl bg-neutral-950/80 border border-neutral-800/80 rounded-2xl px-5 py-2.5 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-widest font-mono">Mục tiêu nhiệm vụ</div>
              <div className="text-xs md:text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>{mission.vietnameseTitle}</span>
                <span className="text-neutral-500 font-mono">·</span>
                <span className="text-orange-400 font-mono tabular-nums">
                  {mission.type === 'kill_target' || mission.type === 'vip_assassination' || mission.type === 'convoy_raid'
                    ? `${state.kills} / ${mission.targetCount} Hạ Gục`
                    : mission.type === 'fuel_rush'
                    ? `${state.fuel}% Xăng`
                    : 'Đang Đua'}
                </span>
              </div>
            </div>
          </div>

          {/* Time Limit */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">Thời gian</div>
              <div className={`text-base md:text-lg font-display font-bold tabular-nums ${state.timeRemaining < 20 ? 'text-red-500 animate-bounce' : 'text-neutral-100'}`}>
                {Math.floor(state.timeRemaining / 60)}:{(state.timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Quick Pause / Audio button */}
            <div className="flex items-center gap-1 border-l border-neutral-800 pl-3">
              <button
                onClick={onToggleMute}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                title={isMuted ? 'Bật âm' : 'Tắt âm'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onPauseToggle}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                title="Tạm dừng"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop PC Controls Quick Guide */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1 rounded-full bg-neutral-950/70 border border-neutral-800/70 text-[11px] font-mono text-neutral-400 backdrop-blur-sm shadow-md">
          <span><kbd className="text-neutral-200 font-semibold bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-[10px]">W A S D</kbd> Lái & Phanh</span>
          <span className="text-neutral-600">·</span>
          <span><kbd className="text-amber-400 font-semibold bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-[10px]">Chuột Trái / E</kbd> Bắn</span>
          <span className="text-neutral-600">·</span>
          <span><kbd className="text-orange-400 font-semibold bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-[10px]">Chuột Phải / Q / F</kbd> Tên Lửa</span>
          <span className="text-neutral-600">·</span>
          <span><kbd className="text-cyan-400 font-semibold bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-[10px]">Shift</kbd> Nitro</span>
          <span className="text-neutral-600">·</span>
          <span><kbd className="text-neutral-300 font-semibold bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-[10px]">Space</kbd> Drift</span>
          <span className="text-neutral-600">·</span>
          <span><kbd className="text-neutral-300 font-semibold bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-[10px]">R</kbd> Nạp đạn</span>
        </div>
      </div>

      {/* 2. COMBO STREAK POPUP */}
      {state.comboCount > 1 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-bounce">
          <div className="text-xs uppercase tracking-widest font-mono text-orange-400 font-semibold">COMBO CHUỖI</div>
          <div className="text-2xl md:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 drop-shadow-lg">
            x{state.comboCount} {state.comboCount >= 4 ? 'ROAD RAGE!' : state.comboCount === 3 ? 'TRIPLE KILL!' : 'DOUBLE KILL!'}
          </div>
        </div>
      )}

      {/* 3. SPEEDOMETER & GEAR (Bottom Left) */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3 pointer-events-auto">
        <div className="bg-neutral-950/85 border border-neutral-800/80 rounded-2xl p-4 backdrop-blur-md shadow-2xl min-w-[170px]">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">Tốc Độ</span>
            <span className="text-[11px] font-mono font-bold text-orange-400">GEAR {state.gear}</span>
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl md:text-5xl font-display font-black text-white tabular-nums tracking-tighter">
              {state.speed}
            </span>
            <span className="text-xs font-mono font-semibold text-neutral-400">KM/H</span>
          </div>

          {/* Speed RPM Arc / Bar */}
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-75 ${state.isNitroActive ? 'bg-cyan-400' : 'bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500'}`}
              style={{ width: `${Math.min(100, (state.speed / 260) * 100)}%` }}
            />
          </div>

          {/* Nitro gauge */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" /> NITRO <span className="text-[9px] text-neutral-500">[Shift/C]</span>
              </span>
              <span className="text-cyan-400 tabular-nums">{state.nitro}s</span>
            </div>
            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-cyan-950">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-100"
                style={{ width: `${nitroPercent}%` }}
              />
            </div>
          </div>

          {/* Fuel gauge for Fuel Rush */}
          {mission.type === 'fuel_rush' && (
            <div className="space-y-1 mt-2.5 pt-2 border-t border-neutral-800">
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>NHIÊN LIỆU</span>
                <span className="text-amber-400 tabular-nums">{state.fuel}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-amber-950">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-100"
                  style={{ width: `${fuelPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. HEALTH & SHIELD (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 flex flex-col gap-1.5 pointer-events-auto">
        <div className="bg-neutral-950/85 border border-neutral-800/80 rounded-2xl p-3 backdrop-blur-md shadow-2xl flex flex-col gap-2">
          {/* Health Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                MÁU XE
              </span>
              <span className="text-emerald-400 font-bold tabular-nums">{state.health} / {state.maxHealth}</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-emerald-950">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-150"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>

          {/* Armor Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-400" />
                GIÁP THIẾT KẾ
              </span>
              <span className="text-blue-400 font-bold tabular-nums">{state.armor} / {state.maxArmor}</span>
            </div>
            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-blue-950">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-150"
                style={{ width: `${armorPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. WEAPONS STATUS (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto">
        <div className="bg-neutral-950/85 border border-neutral-800/80 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl flex flex-col gap-2.5 min-w-[190px]">
          {/* Primary Weapon */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                VŨ KHÍ CHÍNH
              </span>
              <span className="text-amber-400 font-semibold text-[9px]">[Chuột Trái / E / J]</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-neutral-200">
                {state.isPrimaryReloading ? (
                  <span className="text-amber-400 animate-pulse">ĐANG NẠP ĐẠN...</span>
                ) : (
                  <span className="text-neutral-300">SẴN SÀNG <span className="text-[9px] text-neutral-500 font-mono">[R: Nạp]</span></span>
                )}
              </span>
              <span className="text-sm font-display font-bold text-amber-400 tabular-nums">
                {state.primaryAmmo} / {state.maxPrimaryAmmo}
              </span>
            </div>
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${(state.primaryAmmo / state.maxPrimaryAmmo) * 100}%` }}
              />
            </div>
          </div>

          {/* Secondary Weapon */}
          <div className="space-y-1 pt-2 border-t border-neutral-800/80">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                VŨ KHÍ PHỤ
              </span>
              <span className="text-orange-400 font-semibold text-[9px]">[Chuột Phải / Q / F]</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-neutral-200">
                {state.secondaryCooldown > 0 ? (
                  <span className="text-orange-400 font-mono text-[11px]">HỒI CHIÊU</span>
                ) : (
                  <span className="text-emerald-400 font-mono text-[11px]">SẴN SÀNG PHÓNG</span>
                )}
              </span>
              <span className="text-sm font-display font-bold text-orange-400 tabular-nums">
                {state.secondaryAmmo} / {state.maxSecondaryAmmo}
              </span>
            </div>
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-100"
                style={{ width: `${(1 - state.secondaryCooldown) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. MOBILE ON-SCREEN TOUCH CONTROLS (Displayed on touch or toggleable) */}
      <div className="absolute inset-x-0 bottom-24 px-4 flex justify-between items-end md:hidden pointer-events-none">
        {/* Steering Left / Right */}
        <div className="flex gap-2 pointer-events-auto">
          <button
            onTouchStart={() => onVirtualInput('KeyA', true)}
            onTouchEnd={() => onVirtualInput('KeyA', false)}
            onMouseDown={() => onVirtualInput('KeyA', true)}
            onMouseUp={() => onVirtualInput('KeyA', false)}
            className="w-14 h-14 rounded-2xl bg-neutral-900/90 border border-neutral-700 active:bg-orange-500/30 flex items-center justify-center text-xl font-bold font-display text-white shadow-xl"
          >
            ◀
          </button>
          <button
            onTouchStart={() => onVirtualInput('KeyD', true)}
            onTouchEnd={() => onVirtualInput('KeyD', false)}
            onMouseDown={() => onVirtualInput('KeyD', true)}
            onMouseUp={() => onVirtualInput('KeyD', false)}
            className="w-14 h-14 rounded-2xl bg-neutral-900/90 border border-neutral-700 active:bg-orange-500/30 flex items-center justify-center text-xl font-bold font-display text-white shadow-xl"
          >
            ▶
          </button>
        </div>

        {/* Action Buttons: Gas, Brake, Shoot, Missile, Nitro */}
        <div className="flex flex-col gap-2 items-end pointer-events-auto">
          <div className="flex gap-2">
            <button
              onTouchStart={() => onVirtualInput('ShiftLeft', true)}
              onTouchEnd={() => onVirtualInput('ShiftLeft', false)}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-900/80 border border-cyan-500/50 active:bg-cyan-600 text-xs font-bold font-mono text-cyan-200 shadow-xl"
            >
              NITRO
            </button>
            <button
              onTouchStart={() => onVirtualInput('KeyK', true)}
              onTouchEnd={() => onVirtualInput('KeyK', false)}
              className="px-3.5 py-2.5 rounded-xl bg-orange-900/80 border border-orange-500/50 active:bg-orange-600 text-xs font-bold font-mono text-orange-200 shadow-xl"
            >
              TÊN LỬA
            </button>
            <button
              onTouchStart={() => onVirtualInput('KeyJ', true)}
              onTouchEnd={() => onVirtualInput('KeyJ', false)}
              className="px-4 py-2.5 rounded-xl bg-red-900/80 border border-red-500/50 active:bg-red-600 text-xs font-bold font-mono text-red-200 shadow-xl"
            >
              BẮN
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onTouchStart={() => onVirtualInput('KeyS', true)}
              onTouchEnd={() => onVirtualInput('KeyS', false)}
              className="w-14 h-12 rounded-xl bg-neutral-900/90 border border-neutral-700 active:bg-red-500/30 flex items-center justify-center text-xs font-bold font-mono text-neutral-300 shadow-xl"
            >
              PHANH
            </button>
            <button
              onTouchStart={() => onVirtualInput('KeyW', true)}
              onTouchEnd={() => onVirtualInput('KeyW', false)}
              className="w-16 h-12 rounded-xl bg-emerald-900/80 border border-emerald-500/50 active:bg-emerald-600 flex items-center justify-center text-xs font-bold font-mono text-emerald-200 shadow-xl"
            >
              GA ▲
            </button>
          </div>
        </div>
      </div>

      {/* 7. PAUSE MODAL */}
      {isPaused && (
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-5 text-center">
            <div>
              <h2 className="text-xl font-display font-black text-white uppercase tracking-wider mb-1">TRÒ CHƠI TẠM DỪNG</h2>
              <p className="text-xs text-neutral-400 font-mono">ROAD WARS 3D - NHIỆM VỤ ĐANG DIỄN RA</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={onPauseToggle}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Tiếp Tục Đua
              </button>
              <button
                onClick={onRestart}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Chơi Lại Màn Này
              </button>
              <button
                onClick={onQuit}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Về Gara Nâng Cấp
              </button>
            </div>

            <div className="text-[11px] text-neutral-500 font-mono border-t border-neutral-800 pt-3">
              Phím tắt: WASD/Mũi tên lái xe · J bắn chính · K bắn phụ · Shift tăng tốc nitro · Space drift
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
