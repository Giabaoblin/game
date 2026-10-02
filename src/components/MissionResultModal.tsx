import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Trophy, RotateCcw, Home, ArrowRight, Skull, DollarSign, Award, Flame } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface MissionResultModalProps {
  result: {
    victory: boolean;
    reason: string;
    coinsEarned: number;
    xpEarned: number;
    kills: number;
    timeTaken: number;
    stars: number;
  };
  onPlayAgain: () => void;
  onNextMission: () => void;
  onReturnToGarage: () => void;
  isNextAvailable: boolean;
}

export const MissionResultModal: React.FC<MissionResultModalProps> = ({
  result,
  onPlayAgain,
  onNextMission,
  onReturnToGarage,
  isNextAvailable,
}) => {
  useEffect(() => {
    if (result.victory) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#ec4899'],
        });
      } catch {}
    }
  }, [result.victory]);

  const baseMissionCoins = Math.round(result.coinsEarned * 0.5);
  const killBonusCoins = result.kills * 40;
  const survivalBonus = result.coinsEarned - baseMissionCoins - killBonusCoins;

  return (
    <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-6 text-center">
        {/* Banner */}
        <div>
          <div className="text-xs font-mono tracking-widest uppercase mb-1">
            {result.victory ? (
              <span className="text-emerald-400 font-bold">CHIẾN DỊCH HOÀN THÀNH</span>
            ) : (
              <span className="text-red-400 font-bold">CHIẾN DỊCH THẤT BẠI</span>
            )}
          </div>
          <h2
            className={`text-3xl md:text-4xl font-display font-black uppercase tracking-tight ${
              result.victory ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500' : 'text-red-500'
            }`}
          >
            {result.victory ? 'VICTORY' : 'DEFEATED'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">{result.reason}</p>
        </div>

        {/* Stars */}
        {result.victory && (
          <div className="flex justify-center items-center gap-3">
            {[1, 2, 3].map((starIdx) => (
              <div
                key={starIdx}
                className={`p-3 rounded-2xl border transition-all ${
                  result.stars >= starIdx
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20 scale-110'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-700'
                }`}
              >
                <Star className={`w-7 h-7 ${result.stars >= starIdx ? 'fill-amber-400' : ''}`} />
              </div>
            ))}
          </div>
        )}

        {/* Rewards Breakdown (Exact format requested by user) */}
        <div className="bg-neutral-950/80 rounded-2xl p-4 border border-neutral-800/80 flex flex-col gap-2.5 text-xs text-neutral-300 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Hoàn thành nhiệm vụ</span>
            <span className="font-bold text-neutral-100">+{baseMissionCoins} Xu</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Tiêu diệt {result.kills} xe địch</span>
            <span className="font-bold text-neutral-100">+{killBonusCoins} Xu</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Thưởng sống sót & thời gian</span>
            <span className="font-bold text-neutral-100">+{Math.max(0, survivalBonus)} Xu</span>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-sm font-bold">
            <span className="text-amber-400 flex items-center gap-1.5 font-display">
              <DollarSign className="w-4 h-4 text-amber-400" /> TỔNG THƯỞNG XU
            </span>
            <span className="text-amber-400 text-base tabular-nums">+{result.coinsEarned.toLocaleString()} Xu</span>
          </div>

          <div className="flex justify-between items-center text-xs text-cyan-400 pt-1 font-bold">
            <span className="flex items-center gap-1.5 font-display">
              <Award className="w-4 h-4 text-cyan-400" /> KINH NGHIỆM CHIẾN ĐẤU
            </span>
            <span className="tabular-nums">+{result.xpEarned} XP</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              soundManager.playCoin();
              onPlayAgain();
            }}
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase font-display"
          >
            <RotateCcw className="w-4 h-4" /> Chơi Lại
          </button>

          <button
            onClick={() => {
              soundManager.playCoin();
              onReturnToGarage();
            }}
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase font-display"
          >
            <Home className="w-4 h-4" /> Gara Nâng Cấp
          </button>

          {result.victory && isNextAvailable && (
            <button
              onClick={() => {
                soundManager.playCoin();
                onNextMission();
              }}
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase font-display shadow-lg shadow-orange-600/30"
            >
              Màn Kế Tiếp <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
