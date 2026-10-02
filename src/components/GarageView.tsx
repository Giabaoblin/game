import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Vehicle, PlayerProfile } from '../types/game';
import { calculateVehicleActualStats, getVehicleUpgradeCost } from '../data/gameData';
import { buildPlayerVehicleMesh } from '../game/vehicleMeshBuilder';
import { soundManager } from '../audio/soundManager';
import { Shield, Zap, Gauge, Heart, ArrowUpRight, Palette, Check, Lock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface GarageViewProps {
  profile: PlayerProfile;
  onSelectVehicle: (id: string) => void;
  onUpgradeStat: (vehicleId: string, statKey: keyof Vehicle['currentUpgrades']) => void;
  onPurchaseVehicle: (vehicleId: string) => void;
  onUpdateColors: (vehicleId: string, colors: { primary: string; accent: string; neon: string }) => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f8fafc', '#18181b',
];

export const GarageView: React.FC<GarageViewProps> = ({
  profile,
  onSelectVehicle,
  onUpgradeStat,
  onPurchaseVehicle,
  onUpdateColors,
}) => {
  const selectedVehicle = profile.vehicles.find((v) => v.id === profile.selectedVehicleId) || profile.vehicles[0];
  const [activeTab, setActiveTab] = useState<'specs' | 'upgrades' | 'paint'>('upgrades');

  // 3D Showroom Canvas Ref
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseXRef = useRef<number>(0);

  // Initialize 3D Showroom
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Showroom Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    const spot = new THREE.SpotLight(0xffedd5, 2.5);
    spot.position.set(5, 10, 8);
    spot.castShadow = true;
    scene.add(spot);

    const rim = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rim.position.set(-6, 4, -6);
    scene.add(rim);

    // Circular Showroom Pedestal
    const stageGeo = new THREE.CylinderGeometry(4.2, 4.5, 0.35, 32);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -0.18;
    scene.add(stage);

    const ringGeo = new THREE.RingGeometry(3.6, 3.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(selectedVehicle.neonColor), side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.01;
    scene.add(ring);

    // Build Current Vehicle Mesh with mounted equipped guns
    const equippedPrimary = profile.weapons.find((w) => w.id === profile.equippedPrimaryId);
    const equippedSecondary = profile.weapons.find((w) => w.id === profile.equippedSecondaryId);

    const { root } = buildPlayerVehicleMesh(
      selectedVehicle.modelType,
      {
        primary: selectedVehicle.paintColor,
        accent: selectedVehicle.accentColor,
        neon: selectedVehicle.neonColor,
      },
      equippedPrimary?.category || 'minigun',
      equippedSecondary?.category || 'missile'
    );
    vehicleGroupRef.current = root;
    scene.add(root);

    // Animation Loop (Turntable rotation)
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (vehicleGroupRef.current && !isDraggingRef.current) {
        vehicleGroupRef.current.rotation.y += 0.007;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse drag rotation
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && vehicleGroupRef.current) {
        const delta = e.clientX - prevMouseXRef.current;
        vehicleGroupRef.current.rotation.y += delta * 0.01;
        prevMouseXRef.current = e.clientX;
      }
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [
    selectedVehicle.id,
    selectedVehicle.paintColor,
    selectedVehicle.accentColor,
    selectedVehicle.neonColor,
    profile.equippedPrimaryId,
    profile.equippedSecondaryId,
  ]);

  const currentStats = calculateVehicleActualStats(selectedVehicle);
  const isUnlocked = selectedVehicle.price === 0 || profile.level >= selectedVehicle.unlockLevel;
  const canAfford = profile.coins >= selectedVehicle.price;

  const upgradeStatsList: { key: keyof Vehicle['currentUpgrades']; label: string; icon: React.ReactNode; current: number }[] = [
    { key: 'topSpeed', label: 'Tốc Độ Tối Đa', icon: <Gauge className="w-4 h-4 text-orange-400" />, current: currentStats.topSpeed },
    { key: 'acceleration', label: 'Gia Tốc 0-100', icon: <Zap className="w-4 h-4 text-amber-400" />, current: currentStats.acceleration },
    { key: 'handling', label: 'Độ Bám & Drift', icon: <ArrowUpRight className="w-4 h-4 text-cyan-400" />, current: currentStats.handling },
    { key: 'armor', label: 'Giáp Chống Đạn', icon: <Shield className="w-4 h-4 text-blue-400" />, current: currentStats.armor },
    { key: 'health', label: 'Máu Tối Đa (HP)', icon: <Heart className="w-4 h-4 text-emerald-400" />, current: currentStats.health },
    { key: 'nitro', label: 'Bình Khí Nitro', icon: <Sparkles className="w-4 h-4 text-purple-400" />, current: currentStats.nitro },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* LEFT: 3D Turntable Showroom */}
      <div className="relative flex-1 min-h-[380px] lg:min-h-full flex flex-col bg-radial from-neutral-900 via-neutral-950 to-black p-4">
        {/* Vehicle Carousel Tabs at Top */}
        <div className="flex items-center justify-between z-10">
          <div>
            <div className="text-[11px] font-mono text-orange-400 uppercase tracking-widest">Gara Chiến Xa</div>
            <h1 className="text-xl md:text-2xl font-display font-black text-white uppercase">{selectedVehicle.vietnameseName}</h1>
            <p className="text-xs text-neutral-400 max-w-md hidden md:block">{selectedVehicle.vietnameseDesc}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Phân Hạng</span>
            <div className="text-sm font-display font-bold text-amber-400">TIER {selectedVehicle.tier}</div>
          </div>
        </div>

        {/* 3D Canvas Container */}
        <div ref={canvasContainerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

        <div className="absolute bottom-4 left-6 z-10 text-[11px] font-mono text-neutral-500">
          Kéo chuột để xoay 360° xe · Nhấn phím để thử nghiệm
        </div>

        {/* Bottom Vehicle Selector Pills */}
        <div className="z-10 flex gap-2 overflow-x-auto pb-2 pt-1 border-t border-neutral-800/80">
          {profile.vehicles.map((v) => {
            const isSelected = v.id === selectedVehicle.id;
            const isVehUnlocked = v.price === 0 || profile.level >= v.unlockLevel;

            return (
              <button
                key={v.id}
                onClick={() => {
                  soundManager.playCoin();
                  onSelectVehicle(v.id);
                }}
                className={`px-3 py-2 rounded-xl text-left whitespace-nowrap transition-all border shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-neutral-800 border-orange-500 text-white shadow-lg'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {!isVehUnlocked && <Lock className="w-3.5 h-3.5 text-neutral-500" />}
                <div>
                  <div className="text-xs font-semibold">{v.vietnameseName}</div>
                  <div className="text-[10px] font-mono text-neutral-500">Tier {v.tier}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Upgrade & Customization Console */}
      <div className="w-full lg:w-[480px] bg-neutral-900/90 border-l border-neutral-800 flex flex-col h-full overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 p-2 gap-1 bg-neutral-950/60 sticky top-0 z-20">
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'upgrades' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Nâng Cấp Thông Số
          </button>
          <button
            onClick={() => setActiveTab('paint')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'paint' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sơn Xe & Led Neon
          </button>
        </div>

        {/* Tab 1: Upgrades */}
        {activeTab === 'upgrades' && (
          <div className="p-5 flex flex-col gap-4">
            {!isUnlocked ? (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center flex flex-col items-center gap-2">
                <Lock className="w-8 h-8 text-amber-500" />
                <h3 className="font-display font-bold text-white text-base">XE NÀY ĐANG BỊ KHÓA</h3>
                <p className="text-xs text-neutral-400">
                  Yêu cầu người chơi đạt cấp độ <span className="text-amber-400 font-bold font-mono">Level {selectedVehicle.unlockLevel}</span>
                </p>
                <button
                  disabled={!canAfford || profile.level < selectedVehicle.unlockLevel}
                  onClick={() => onPurchaseVehicle(selectedVehicle.id)}
                  className={`mt-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider ${
                    canAfford && profile.level >= selectedVehicle.unlockLevel
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  Mở Khóa ({selectedVehicle.price.toLocaleString()} Xu)
                </button>
              </div>
            ) : null}

            <div className="flex flex-col gap-3">
              {upgradeStatsList.map((stat) => {
                const upgradeLvl = selectedVehicle.currentUpgrades[stat.key];
                const isMax = upgradeLvl >= 5;
                const cost = getVehicleUpgradeCost(stat.key, upgradeLvl, selectedVehicle.tier);
                const canUpgrade = profile.coins >= cost && !isMax;

                return (
                  <div
                    key={stat.key}
                    className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-2xl flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {stat.icon}
                        <span className="text-xs font-semibold text-neutral-200">{stat.label}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-orange-400 tabular-nums">
                        {stat.current}
                      </span>
                    </div>

                    {/* 5-Segment Level Bar */}
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-2 flex-1 rounded-sm transition-all ${
                            step < upgradeLvl ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-neutral-800'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-mono text-neutral-500 ml-1.5">{upgradeLvl}/5</span>
                    </div>

                    {/* Upgrade Action Button */}
                    <div className="flex justify-between items-center pt-1 border-t border-neutral-900">
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {isMax ? 'ĐÃ ĐẠT TỐI ĐA' : `Chi phí: ${cost.toLocaleString()} Xu`}
                      </span>
                      <button
                        disabled={!canUpgrade || isMax}
                        onClick={() => {
                          soundManager.playCoin();
                          onUpgradeStat(selectedVehicle.id, stat.key);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isMax
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : canUpgrade
                            ? 'bg-orange-600 hover:bg-orange-500 text-white'
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? 'MAX' : '+ Nâng Cấp'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Paint & Neon Underglow */}
        {activeTab === 'paint' && (
          <div className="p-5 flex flex-col gap-5">
            {/* Primary Paint */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-orange-400" />
                Màu Sơn Thân Xe
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      soundManager.playHit();
                      onUpdateColors(selectedVehicle.id, {
                        primary: col,
                        accent: selectedVehicle.accentColor,
                        neon: selectedVehicle.neonColor,
                      });
                    }}
                    className={`h-9 rounded-xl border transition-transform flex items-center justify-center ${
                      selectedVehicle.paintColor === col ? 'scale-110 border-white shadow-lg' : 'border-neutral-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  >
                    {selectedVehicle.paintColor === col && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Trim */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                Màu Chi Tiết Khung & Cản
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      soundManager.playHit();
                      onUpdateColors(selectedVehicle.id, {
                        primary: selectedVehicle.paintColor,
                        accent: col,
                        neon: selectedVehicle.neonColor,
                      });
                    }}
                    className={`h-9 rounded-xl border transition-transform flex items-center justify-center ${
                      selectedVehicle.accentColor === col ? 'scale-110 border-white shadow-lg' : 'border-neutral-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  >
                    {selectedVehicle.accentColor === col && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Neon Underglow */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Dải Đèn Led Neon Gầm Xe
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      soundManager.playHit();
                      onUpdateColors(selectedVehicle.id, {
                        primary: selectedVehicle.paintColor,
                        accent: selectedVehicle.accentColor,
                        neon: col,
                      });
                    }}
                    className={`h-9 rounded-xl border transition-transform flex items-center justify-center ${
                      selectedVehicle.neonColor === col ? 'scale-110 border-white shadow-lg' : 'border-neutral-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  >
                    {selectedVehicle.neonColor === col && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
