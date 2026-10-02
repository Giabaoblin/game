import React, { useState } from 'react';
import { soundManager } from '../audio/soundManager';
import {
  BookOpen, Calculator, Code, Layers, Shield, Zap, Flame, DollarSign,
  Trophy, Cpu, Music, Palette, CheckCircle, Copy, FileText, ChevronRight
} from 'lucide-react';

interface GDDSection {
  id: string;
  number: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const GDDStation: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('gdd_core');
  const [copied, setCopied] = useState<boolean>(false);

  // Economy Simulator State
  const [simRacesPerDay, setSimRacesPerDay] = useState<number>(10);
  const [simAvgWinRate, setSimAvgWinRate] = useState<number>(85); // %

  const handleCopyMarkdown = () => {
    soundManager.playCoin();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections: GDDSection[] = [
    {
      id: 'gdd_core',
      number: '01',
      title: 'Core Gameplay Loop & Cảm Giác Lái/Bắn',
      icon: <Layers className="w-4 h-4 text-orange-400" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm text-neutral-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <h4 className="font-display font-bold text-white text-base mb-2">Vòng Lặp Cốt Lõi (Core Gameplay Loop)</h4>
            <div className="p-3 bg-neutral-950 rounded-xl font-mono text-xs text-orange-400 border border-orange-500/20 mb-3">
              🚗 Chọn Xe → 🎯 Nhận Nhiệm Vụ → 🏁 Lái/Đua Cao Tốc → 🔫 Tiêu Diệt Mục Tiêu → 💰 Nhận Xu + XP → 🛠️ Nâng Cấp Xe/Súng → 🔓 Mở Xe/Vũ Khí Mới → 📈 Level Up
            </div>
            <p>
              Cảm giác điều khiển được thiết kế theo trường phái <strong>Arcade High-Octane Action</strong> kết hợp yếu tố vật lý giả lập:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-400">
              <li><strong>Trọng lượng xe (Chassis Weight):</strong> Xe nhẹ (Buggy) lướt gió nhanh nhưng dễ bị chao đảo khi va chạm; xe hạng nặng (Marauder, Titan) có độ đầm lớn, hấp thụ lực ram và càn quét chướng ngại vật.</li>
              <li><strong>Drift & Handbrake:</strong> Khi rẽ gấp kết hợp phanh tay, góc văng xe (Yaw angle) mở rộng đến 25°-35°, tạo vệt lốp khói và nạp năng lượng Drift Boost.</li>
              <li><strong>Dynamic FOV:</strong> Khi kích hoạt Nitro, góc nhìn camera mở rộng từ 65° lên 78°, tạo cảm giác xé gió giật lùi đầy hưng phấn.</li>
              <li><strong>Hit-Stop & Screen Shake:</strong> Khi viên đạn bắn trúng hoặc tiêu diệt xe địch, camera rung giật và xuất hiện tia lửa kim loại rực rỡ.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'gdd_vehicles',
      number: '02',
      title: 'Hệ Thống Xe & Phân Hạng Tier',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm text-neutral-300">
          <p>Hệ thống gồm 6 mẫu xe được thiết kế chuyên biệt theo 4 bậc Tier tiến trình:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-neutral-800 rounded-xl overflow-hidden">
              <thead className="bg-neutral-900 text-neutral-400 uppercase">
                <tr>
                  <th className="p-3">Tên Xe</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Tốc Độ Gốc</th>
                  <th className="p-3">Gia Tốc</th>
                  <th className="p-3">Giáp</th>
                  <th className="p-3">Máu (HP)</th>
                  <th className="p-3">Đặc Tính Chiến Đấu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-950/60">
                <tr>
                  <td className="p-3 font-bold text-white">Viper Interceptor</td>
                  <td className="p-3 text-orange-400">Tier 1</td>
                  <td className="p-3">175 km/h</td>
                  <td className="p-3">6.5</td>
                  <td className="p-3">25%</td>
                  <td className="p-3">200 HP</td>
                  <td className="p-3 text-neutral-400">Cân bằng, đánh chặn linh hoạt</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Sandstorm Buggy</td>
                  <td className="p-3 text-orange-400">Tier 1</td>
                  <td className="p-3">190 km/h</td>
                  <td className="p-3">8.5</td>
                  <td className="p-3">18%</td>
                  <td className="p-3">170 HP</td>
                  <td className="p-3 text-neutral-400">Drift đỉnh cao, bứt tốc nitro mạnh</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Marauder Armored</td>
                  <td className="p-3 text-amber-400">Tier 2</td>
                  <td className="p-3">160 km/h</td>
                  <td className="p-3">5.5</td>
                  <td className="p-3">55%</td>
                  <td className="p-3">350 HP</td>
                  <td className="p-3 text-neutral-400">Mũi cày phá giáp, húc bay xe địch</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Neon Phantom</td>
                  <td className="p-3 text-amber-400">Tier 2</td>
                  <td className="p-3">235 km/h</td>
                  <td className="p-3">9.2</td>
                  <td className="p-3">28%</td>
                  <td className="p-3">220 HP</td>
                  <td className="p-3 text-neutral-400">Tốc độ xé gió, vây khí động học</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Titan Juggernaut</td>
                  <td className="p-3 text-cyan-400">Tier 3</td>
                  <td className="p-3">180 km/h</td>
                  <td className="p-3">6.8</td>
                  <td className="p-3">68%</td>
                  <td className="p-3">440 HP</td>
                  <td className="p-3 text-neutral-400">6 bánh bọc thép, chống shock cực đại</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Apex Doomsday</td>
                  <td className="p-3 text-purple-400">Tier 4</td>
                  <td className="p-3">260 km/h</td>
                  <td className="p-3">9.8</td>
                  <td className="p-3">60%</td>
                  <td className="p-3">420 HP</td>
                  <td className="p-3 text-neutral-400">Nguyên mẫu quân sự tối thượng</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'gdd_weapons',
      number: '03',
      title: 'Kho Vũ Khí & Công Thức Sát Thương (DPS)',
      icon: <Flame className="w-4 h-4 text-red-500" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm text-neutral-300">
          <p>
            Vũ khí được chia thành 2 danh mục: <strong>Vũ khí chính (Primary)</strong> gắn trên nóc/mui xe bắn liên tục, và <strong>Vũ khí phụ (Secondary)</strong> gây sát thương diện rộng hoặc khống chế.
          </p>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <h4 className="font-display font-bold text-white text-base">Công Thức Sát Thương Thực Tế (Effective Damage Formula)</h4>
            <div className="p-3 bg-neutral-950 rounded-xl font-mono text-xs text-cyan-400 border border-neutral-800">
              Damage Thực Tế = (BaseDmg * (1 + (Level - 1) * 0.28)) * (1 - EnemyArmor% / 100) * ComboMultiplier
            </div>
            <p className="text-neutral-400 text-xs">
              Trong đó Combo Multiplier tăng thêm +10% sát thương cho mỗi bậc combo (x2 = +10%, x3 = +20%, Road Rage = +35%).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'gdd_economy',
      number: '07',
      title: 'Mô Hình Kinh Tế, Giá Nâng Cấp & Cày Cuốc (Levels 1 - 20)',
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-5 text-xs md:text-sm text-neutral-300">
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <h4 className="font-display font-bold text-white text-base mb-2">Đường Cong Chi Phí Nâng Cấp (Upgrade Cost Curve)</h4>
            <div className="p-3 bg-neutral-950 rounded-xl font-mono text-xs text-emerald-400 border border-neutral-800 mb-3">
              Cost(Stat, Level, Tier) = (400 * Tier) * (1.65 ^ Level)
            </div>
            <p className="text-neutral-400 text-xs">
              Đảm bảo người chơi không thể max-out chỉ sau vài màn chơi đầu, tạo động lực liên tục quay trở lại làm nhiệm vụ và thử thách các màn 3 sao.
            </p>
          </div>

          {/* Interactive Economy Simulator */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h4 className="font-display font-bold text-white text-sm uppercase">Công Cụ Giả Lập Cày Xu & Tỷ Lệ Tiêu Thụ</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1">Số Trận Đua Mỗi Ngày: {simRacesPerDay}</label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={simRacesPerDay}
                  onChange={(e) => setSimRacesPerDay(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1">Tỷ Lệ Thắng Dự Kiến: {simAvgWinRate}%</label>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={simAvgWinRate}
                  onChange={(e) => setSimAvgWinRate(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-900 rounded-xl text-center font-mono">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Xu / Ngày</div>
                <div className="text-sm font-bold text-amber-400">
                  {Math.round(simRacesPerDay * 2200 * (simAvgWinRate / 100)).toLocaleString()} Xu
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Thời Gian Mở Apex</div>
                <div className="text-sm font-bold text-emerald-400">
                  {Math.max(1, Math.round(50000 / (simRacesPerDay * 2200 * (simAvgWinRate / 100))))} Ngày
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Cấp Đạt Sau 7 Ngày</div>
                <div className="text-sm font-bold text-cyan-400">
                  Level {Math.min(20, Math.floor(Math.sqrt((simRacesPerDay * 7 * 650) / 250)))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'gdd_bosses',
      number: '10',
      title: 'Thiết Kế 4 Đại Trùm Khu Vực (Boss Design)',
      icon: <Flame className="w-4 h-4 text-red-500" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm text-neutral-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] font-mono text-orange-400 uppercase">Khu Vực 1 (Màn 5)</span>
              <h4 className="font-display font-bold text-white text-base mt-1">Tank Truck (1.800 HP)</h4>
              <p className="text-xs text-neutral-400 mt-2">
                Xe bồn 18 bánh khổng lồ. <strong>Giai đoạn 1:</strong> Rải mìn dầu trơn trượt trên các làn đường. <strong>Giai đoạn 2:</strong> Phun lửa napalm tầm gần khi xe người chơi tiếp cận sát đuôi.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] font-mono text-cyan-400 uppercase">Khu Vực 2 (Màn 10)</span>
              <h4 className="font-display font-bold text-white text-base mt-1">Cyber Racer (2.400 HP)</h4>
              <p className="text-xs text-neutral-400 mt-2">
                Siêu xe thể thao điều khiển laser. <strong>Kỹ năng đặc biệt:</strong> Kích hoạt khiên phản xạ năng lượng xanh ngắt trong 4 giây và đảo làn với vận tốc 280 km/h.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] font-mono text-amber-400 uppercase">Khu Vực 3 (Màn 15)</span>
              <h4 className="font-display font-bold text-white text-base mt-1">Armored Convoy (3.200 HP)</h4>
              <p className="text-xs text-neutral-400 mt-2">
                Đoàn xe pháo đài bánh xích hạng nặng. Bắn pháo nổ kép tạo các vùng cảnh báo đỏ trên mặt đường đòi hỏi người chơi lách làn chính xác.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] font-mono text-purple-400 uppercase">Khu Vực 4 (Màn 20 - Trùm Cuối)</span>
              <h4 className="font-display font-bold text-white text-base mt-1">Heavy War Machine (4.500 HP)</h4>
              <p className="text-xs text-neutral-400 mt-2">
                Pháo đài cơ động tối mật. 3 Giai đoạn chiến đấu: Pháo plasma đôi → Bão tên lửa hành trình quét góc 180° → Quá tải lò phản ứng hạt nhân.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'gdd_architecture',
      number: '18',
      title: 'Kiến Trúc Triển Khai Unity (C#) & Unreal Engine (C++)',
      icon: <Code className="w-4 h-4 text-cyan-400" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm text-neutral-300">
          <p>
            Tài liệu kiến trúc module hướng đối tượng giúp lập trình viên game có thể import trực tiếp sang Unity hoặc Unreal Engine 5:
          </p>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="flex justify-between items-center mb-2 font-mono text-xs">
              <span className="text-cyan-400 font-bold">Unity (C#) - RoadWarsVehicleController.cs</span>
              <span className="text-neutral-500">Rigidbody3D / WheelCollider</span>
            </div>
            <pre className="p-3 bg-neutral-900 rounded-xl font-mono text-[11px] text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800">
{`using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class RoadWarsVehicleController : MonoBehaviour {
    [Header("Vehicle Dynamics")]
    public float topSpeed = 220f;
    public float motorTorque = 1500f;
    public float steerAngle = 28f;
    public float brakeForce = 4000f;
    
    [Header("Combat & Nitro")]
    public float nitroMultiplier = 1.45f;
    public float currentNitro = 5.0f;
    public bool isDrifting;
    
    private Rigidbody rb;
    public WheelCollider[] wheels;

    void Awake() {
        rb = GetComponent<Rigidbody>();
        rb.centerOfMass = new Vector3(0, -0.4f, 0.1f); // Low center of gravity to prevent rollover
    }

    public void ApplyDrive(float throttle, float steer, bool handbrake, bool boost) {
        float speedKmh = rb.linearVelocity.magnitude * 3.6f;
        float currentTorque = throttle * motorTorque * (boost && currentNitro > 0 ? nitroMultiplier : 1f);
        
        foreach (var w in wheels) {
            w.motorTorque = currentTorque;
            if (handbrake) w.brakeTorque = brakeForce;
            else w.brakeTorque = 0;
        }
    }
}`}
            </pre>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="flex justify-between items-center mb-2 font-mono text-xs">
              <span className="text-orange-400 font-bold">Unreal Engine 5 (C++) - ARoadWarsCombatPawn.h</span>
              <span className="text-neutral-500">UWheeledVehiclePawn</span>
            </div>
            <pre className="p-3 bg-neutral-900 rounded-xl font-mono text-[11px] text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800">
{`#pragma once
#include "CoreMinimal.h"
#include "WheeledVehiclePawn.h"
#include "ARoadWarsCombatPawn.generated.h"

UCLASS()
class ROADWARS3D_API ARoadWarsCombatPawn : public AWheeledVehiclePawn {
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float MaxShieldArmor = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapons")
    TSubclassOf<class ARoadWarsProjectile> PrimaryBulletClass;

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void FirePrimaryWeapon();

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void LaunchSecondaryMissiles();
};`}
            </pre>
          </div>
        </div>
      ),
    },
  ];

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* LEFT: GDD Table of Contents Sidebar */}
      <div className="w-full lg:w-[360px] bg-neutral-900/90 border-r border-neutral-800 flex flex-col p-5 overflow-y-auto shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-[11px] font-mono text-orange-400 uppercase tracking-widest">Tài Liệu Game Designer</div>
            <h2 className="text-xl font-display font-black text-white uppercase">GDD STATION</h2>
          </div>
          <button
            onClick={handleCopyMarkdown}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
            title="Sao chép toàn bộ GDD"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
          Tài liệu đặc tả thiết kế hoàn chỉnh 18 chương từ cấp độ 1 đến 20, hệ thống cân bằng xe, vũ khí, trùm và kiến trúc mã nguồn game.
        </p>

        {/* Section Links */}
        <div className="flex flex-col gap-1.5">
          {sections.map((sec) => {
            const isSelected = sec.id === activeSection.id;

            return (
              <button
                key={sec.id}
                onClick={() => {
                  soundManager.playHit();
                  setActiveSectionId(sec.id);
                }}
                className={`p-3 rounded-xl text-left transition-all flex items-center justify-between border ${
                  isSelected
                    ? 'bg-neutral-800 border-orange-500 text-white shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-orange-400">{sec.number}</span>
                  <div className="text-xs font-semibold">{sec.title}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Document Section Content Display */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-neutral-950">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="border-b border-neutral-800 pb-4">
            <div className="text-xs font-mono text-orange-400 uppercase tracking-widest mb-1">
              CHƯƠNG {activeSection.number}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white uppercase">
              {activeSection.title}
            </h1>
          </div>

          <div>{activeSection.content}</div>
        </div>
      </div>
    </div>
  );
};
