import * as THREE from 'three';

export interface VehicleColors {
  primary: string;
  accent: string;
  neon: string;
}

export function createWheelMesh(): THREE.Group {
  const wheelGroup = new THREE.Group();
  const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1f242d,
    roughness: 0.9,
    metalness: 0.1,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Rim
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 8);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.3,
    metalness: 0.8,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  return wheelGroup;
}

export function buildPlayerVehicleMesh(
  modelType: string,
  colors: VehicleColors
): { root: THREE.Group; wheels: THREE.Group[]; frontTurret?: THREE.Group; exhaustPipes: THREE.Vector3[] } {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const exhaustPipes: THREE.Vector3[] = [];

  const primMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.primary),
    roughness: 0.35,
    metalness: 0.65,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.accent),
    roughness: 0.5,
    metalness: 0.5,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colors.neon),
  });

  let frontTurret: THREE.Group | undefined;

  switch (modelType) {
    case 'buggy': {
      // Chassis cage
      const baseGeo = new THREE.BoxGeometry(1.6, 0.3, 3.2);
      const base = new THREE.Mesh(baseGeo, accentMat);
      base.position.y = 0.45;
      root.add(base);

      // Cage tubes
      const cageGeo = new THREE.BoxGeometry(1.4, 0.9, 1.8);
      const cage = new THREE.Mesh(cageGeo, primMat);
      cage.position.set(0, 0.95, -0.2);
      root.add(cage);

      // Large offroad wheels
      const wheelPositions = [
        [-0.95, 0.42, 1.1],
        [0.95, 0.42, 1.1],
        [-1.0, 0.48, -1.2],
        [1.0, 0.48, -1.2],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.scale.set(1.2, 1.2, 1.2);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      // Roof spotlights
      const spotBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), accentMat);
      spotBar.position.set(0, 1.45, 0.5);
      root.add(spotBar);

      // Dual side missile tubes
      const podGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8);
      podGeo.rotateX(Math.PI / 2);
      const leftPod = new THREE.Mesh(podGeo, glowMat);
      leftPod.position.set(-0.8, 0.95, 0);
      const rightPod = new THREE.Mesh(podGeo, glowMat);
      rightPod.position.set(0.8, 0.95, 0);
      root.add(leftPod);
      root.add(rightPod);

      exhaustPipes.push(new THREE.Vector3(-0.3, 0.6, -1.6), new THREE.Vector3(0.3, 0.6, -1.6));
      break;
    }

    case 'truck': {
      // Marauder heavy truck
      const cabGeo = new THREE.BoxGeometry(2.0, 1.1, 1.8);
      const cab = new THREE.Mesh(cabGeo, primMat);
      cab.position.set(0, 1.0, 0.4);
      root.add(cab);

      // Armored flatbed
      const bedGeo = new THREE.BoxGeometry(2.0, 0.7, 1.8);
      const bed = new THREE.Mesh(bedGeo, accentMat);
      bed.position.set(0, 0.7, -1.3);
      root.add(bed);

      // Heavy ramming plow
      const plowGeo = new THREE.BoxGeometry(2.2, 0.6, 0.4);
      const plow = new THREE.Mesh(plowGeo, accentMat);
      plow.position.set(0, 0.45, 1.5);
      plow.rotation.x = -0.2;
      root.add(plow);

      // Armored slit windshield
      const windGeo = new THREE.BoxGeometry(1.8, 0.35, 0.05);
      const windshield = new THREE.Mesh(windGeo, glassMat);
      windshield.position.set(0, 1.15, 1.31);
      root.add(windshield);

      // Dual vertical exhaust smokestacks
      const stackGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
      const leftStack = new THREE.Mesh(stackGeo, accentMat);
      leftStack.position.set(-0.9, 1.4, -0.4);
      const rightStack = new THREE.Mesh(stackGeo, accentMat);
      rightStack.position.set(0.9, 1.4, -0.4);
      root.add(leftStack);
      root.add(rightStack);

      // Wheels
      const wheelPositions = [
        [-1.1, 0.45, 1.0],
        [1.1, 0.45, 1.0],
        [-1.1, 0.45, -1.4],
        [1.1, 0.45, -1.4],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.scale.set(1.25, 1.25, 1.25);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      exhaustPipes.push(new THREE.Vector3(-0.9, 2.0, -0.4), new THREE.Vector3(0.9, 2.0, -0.4));
      break;
    }

    case 'cyber': {
      // Neon Phantom sleek supercar
      const bodyGeo = new THREE.BoxGeometry(1.9, 0.45, 3.8);
      const body = new THREE.Mesh(bodyGeo, primMat);
      body.position.y = 0.38;
      root.add(body);

      // Cockpit canopy
      const roofGeo = new THREE.BoxGeometry(1.3, 0.4, 1.8);
      const roof = new THREE.Mesh(roofGeo, glassMat);
      roof.position.set(0, 0.72, -0.1);
      root.add(roof);

      // Rear wing
      const wingGeo = new THREE.BoxGeometry(2.0, 0.08, 0.45);
      const wing = new THREE.Mesh(wingGeo, accentMat);
      wing.position.set(0, 0.9, -1.8);
      root.add(wing);

      // Neon side strips
      const stripGeo = new THREE.BoxGeometry(0.05, 0.08, 3.6);
      const leftStrip = new THREE.Mesh(stripGeo, glowMat);
      leftStrip.position.set(-0.96, 0.28, 0);
      const rightStrip = new THREE.Mesh(stripGeo, glowMat);
      rightStrip.position.set(0.96, 0.28, 0);
      root.add(leftStrip);
      root.add(rightStrip);

      // Wheels
      const wheelPositions = [
        [-0.98, 0.36, 1.2],
        [0.98, 0.36, 1.2],
        [-1.02, 0.38, -1.2],
        [1.02, 0.38, -1.2],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      exhaustPipes.push(new THREE.Vector3(-0.4, 0.35, -1.9), new THREE.Vector3(0.4, 0.35, -1.9));
      break;
    }

    case 'juggernaut': {
      // 6-wheeled Titan Juggernaut
      const hullGeo = new THREE.BoxGeometry(2.3, 0.9, 4.4);
      const hull = new THREE.Mesh(hullGeo, primMat);
      hull.position.y = 0.75;
      root.add(hull);

      // Armor skirts
      const skirtGeo = new THREE.BoxGeometry(0.15, 0.6, 4.2);
      const leftSkirt = new THREE.Mesh(skirtGeo, accentMat);
      leftSkirt.position.set(-1.22, 0.65, 0);
      const rightSkirt = new THREE.Mesh(skirtGeo, accentMat);
      rightSkirt.position.set(1.22, 0.65, 0);
      root.add(leftSkirt);
      root.add(rightSkirt);

      // Turret dome
      const domeGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.45, 8);
      const dome = new THREE.Mesh(domeGeo, accentMat);
      dome.position.set(0, 1.35, 0.2);
      root.add(dome);

      // 6 Wheels (3 axles)
      const wheelPositions = [
        [-1.25, 0.45, 1.4],
        [1.25, 0.45, 1.4],
        [-1.25, 0.45, 0.0],
        [1.25, 0.45, 0.0],
        [-1.25, 0.45, -1.4],
        [1.25, 0.45, -1.4],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.scale.set(1.2, 1.2, 1.2);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      exhaustPipes.push(new THREE.Vector3(-0.8, 0.7, -2.2), new THREE.Vector3(0.8, 0.7, -2.2));
      break;
    }

    case 'doomsday': {
      // Apex Doomsday dreadnought
      const hullGeo = new THREE.BoxGeometry(2.4, 0.6, 4.5);
      const hull = new THREE.Mesh(hullGeo, primMat);
      hull.position.y = 0.6;
      root.add(hull);

      // Swept wings
      const wingLGeo = new THREE.BoxGeometry(0.6, 0.2, 2.2);
      const wingL = new THREE.Mesh(wingLGeo, accentMat);
      wingL.position.set(-1.45, 0.65, -0.6);
      const wingR = new THREE.Mesh(wingLGeo, accentMat);
      wingR.position.set(1.45, 0.65, -0.6);
      root.add(wingL);
      root.add(wingR);

      // Dual Plasma Turbines on shoulders
      const turbGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.4, 12);
      turbGeo.rotateX(Math.PI / 2);
      const turbL = new THREE.Mesh(turbGeo, glowMat);
      turbL.position.set(-1.1, 0.95, -0.5);
      const turbR = new THREE.Mesh(turbGeo, glowMat);
      turbR.position.set(1.1, 0.95, -0.5);
      root.add(turbL);
      root.add(turbR);

      // Wheels
      const wheelPositions = [
        [-1.3, 0.42, 1.3],
        [1.3, 0.42, 1.3],
        [-1.3, 0.42, -1.4],
        [1.3, 0.42, -1.4],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.scale.set(1.25, 1.25, 1.25);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      exhaustPipes.push(new THREE.Vector3(-0.6, 0.55, -2.3), new THREE.Vector3(0.6, 0.55, -2.3));
      break;
    }

    case 'interceptor':
    default: {
      // Default: Viper Interceptor combat sports car
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.5, 3.6);
      const body = new THREE.Mesh(bodyGeo, primMat);
      body.position.y = 0.42;
      root.add(body);

      // Cabin
      const cabinGeo = new THREE.BoxGeometry(1.3, 0.45, 1.6);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 0.8, -0.2);
      root.add(cabin);

      // Front splitter & headlights
      const splitterGeo = new THREE.BoxGeometry(1.82, 0.1, 0.3);
      const splitter = new THREE.Mesh(splitterGeo, accentMat);
      splitter.position.set(0, 0.22, 1.8);
      root.add(splitter);

      // Headlight glow
      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), glowMat);
      headL.position.set(-0.65, 0.45, 1.81);
      const headR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), glowMat);
      headR.position.set(0.65, 0.45, 1.81);
      root.add(headL);
      root.add(headR);

      // Rear Spoiler
      const spoilerGeo = new THREE.BoxGeometry(1.7, 0.08, 0.35);
      const spoiler = new THREE.Mesh(spoilerGeo, accentMat);
      spoiler.position.set(0, 0.95, -1.65);
      root.add(spoiler);

      // Wheels
      const wheelPositions = [
        [-0.95, 0.38, 1.1],
        [0.95, 0.38, 1.1],
        [-0.95, 0.38, -1.1],
        [0.95, 0.38, -1.1],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      exhaustPipes.push(new THREE.Vector3(-0.4, 0.35, -1.8), new THREE.Vector3(0.4, 0.35, -1.8));
      break;
    }
  }

  // Mounted Roof Turret (Primary weapon visible on vehicle)
  frontTurret = new THREE.Group();
  const turretBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.25, 0.15, 8),
    new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.3 })
  );
  frontTurret.add(turretBase);

  // Twin barrels pointing forward
  const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
  barrelGeo.rotateX(Math.PI / 2);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });

  const b1 = new THREE.Mesh(barrelGeo, barrelMat);
  b1.position.set(-0.09, 0.08, 0.35);
  const b2 = new THREE.Mesh(barrelGeo, barrelMat);
  b2.position.set(0.09, 0.08, 0.35);
  frontTurret.add(b1);
  frontTurret.add(b2);

  frontTurret.position.set(0, 1.05, 0.2);
  root.add(frontTurret);

  return { root, wheels, frontTurret, exhaustPipes };
}

// Build Enemy Vehicles
export function buildEnemyVehicleMesh(type: 'patrol' | 'buggy' | 'heavy' | 'kamikaze' | 'vip' | 'convoy_unit'): { root: THREE.Group; wheels: THREE.Group[] } {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];

  switch (type) {
    case 'kamikaze': {
      // Small agile red spiked drone buggy
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 1.8, 4),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6 })
      );
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.4;
      root.add(body);

      // Warning pulsating light
      const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redLight.position.set(0, 0.7, 0);
      root.add(redLight);

      // 4 small wheels
      [[-0.6, 0.3, 0.6], [0.6, 0.3, 0.6], [-0.6, 0.3, -0.6], [0.6, 0.3, -0.6]].forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.scale.set(0.8, 0.8, 0.8);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });
      break;
    }

    case 'vip':
    case 'convoy_unit':
    case 'heavy': {
      // Olive drab / metallic armored truck
      const bodyColor = type === 'vip' ? 0xd97706 : type === 'convoy_unit' ? 0x0284c7 : 0x3f6212;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 1.2, 3.8),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7, metalness: 0.4 })
      );
      body.position.y = 0.9;
      root.add(body);

      // Rear turret
      const turret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.45, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 })
      );
      turret.position.set(0, 1.6, -0.6);
      root.add(turret);

      [[-1.15, 0.45, 1.1], [1.15, 0.45, 1.1], [-1.15, 0.45, -1.1], [1.15, 0.45, -1.1]].forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.scale.set(1.2, 1.2, 1.2);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });
      break;
    }

    case 'patrol':
    default: {
      // Black & white enforcer cruiser
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.5, 3.4),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.6 })
      );
      body.position.y = 0.45;
      root.add(body);

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.4, 1.5),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 })
      );
      roof.position.set(0, 0.8, -0.1);
      root.add(roof);

      // Flashing police lightbar
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.15), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      bar.position.set(0, 1.05, -0.1);
      root.add(bar);

      [[-0.95, 0.38, 1.0], [0.95, 0.38, 1.0], [-0.95, 0.38, -1.0], [0.95, 0.38, -1.0]].forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });
      break;
    }
  }

  return { root, wheels };
}

// Build 4 Unique Epic Boss Meshes
export function buildBossMesh(bossType: 'tank_truck' | 'cyber_racer' | 'armored_convoy' | 'heavy_war_machine'): THREE.Group {
  const boss = new THREE.Group();

  switch (bossType) {
    case 'tank_truck': {
      // Zone 1 Boss: Tank Truck (18-wheel fuel-armored rig)
      // Front cab
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.6, 2.8),
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6, metalness: 0.5 })
      );
      cab.position.set(0, 1.3, 2.5);
      boss.add(cab);

      // Heavy barbed ramming bumper
      const ram = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.8, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9 })
      );
      ram.position.set(0, 0.6, 4.0);
      boss.add(ram);

      // Massive Dual Tanker Cylinders (Rear trailer)
      const tankGeo = new THREE.CylinderGeometry(1.1, 1.1, 5.5, 16);
      tankGeo.rotateX(Math.PI / 2);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });
      const tanker = new THREE.Mesh(tankGeo, tankMat);
      tanker.position.set(0, 1.5, -1.6);
      boss.add(tanker);

      // Flamethrower turrets on back
      const flameNozzleL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      flameNozzleL.rotation.x = Math.PI / 2;
      flameNozzleL.position.set(-0.8, 1.2, -4.5);
      const flameNozzleR = flameNozzleL.clone();
      flameNozzleR.position.x = 0.8;
      boss.add(flameNozzleL);
      boss.add(flameNozzleR);

      // Wheels along the rig (10 visible wheel assemblies)
      const zPositions = [3.2, 1.8, -0.2, -2.4, -3.8];
      zPositions.forEach((z) => {
        [-1.3, 1.3].forEach((x) => {
          const w = createWheelMesh();
          w.scale.set(1.4, 1.4, 1.4);
          w.position.set(x, 0.5, z);
          boss.add(w);
        });
      });
      break;
    }

    case 'cyber_racer': {
      // Zone 2 Boss: Cyber Racer (Supersonic laser hovercar)
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.55, 4.8),
        new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.2, metalness: 0.9 })
      );
      body.position.y = 0.6;
      boss.add(body);

      // Holographic glowing laser fins
      const finGeo = new THREE.BoxGeometry(0.1, 0.8, 2.6);
      const finMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const finL = new THREE.Mesh(finGeo, finMat);
      finL.position.set(-1.3, 0.9, -0.6);
      const finR = finL.clone();
      finR.position.x = 1.3;
      boss.add(finL);
      boss.add(finR);

      // Energy Shield Sphere
      const shield = new THREE.Mesh(
        new THREE.SphereGeometry(3.0, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.35 })
      );
      shield.name = 'boss_shield';
      boss.add(shield);

      // 4 aggressive wide wheels with cyan glow
      [[-1.25, 0.45, 1.5], [1.25, 0.45, 1.5], [-1.25, 0.45, -1.5], [1.25, 0.45, -1.5]].forEach(([x, y, z]) => {
        const w = createWheelMesh();
        w.scale.set(1.3, 1.3, 1.3);
        w.position.set(x, y, z);
        boss.add(w);
      });
      break;
    }

    case 'armored_convoy': {
      // Zone 3 Boss: Armored Convoy (Industrial Fortress)
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 1.4, 6.2),
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9, metalness: 0.4 })
      );
      base.position.y = 1.1;
      boss.add(base);

      // Dual heavy rotating artillery turrets
      const t1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.9, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 })
      );
      t1.position.set(0, 2.0, 1.2);
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x111827 }));
      b1.rotation.x = Math.PI / 2;
      b1.position.set(0, 0.2, 0.9);
      t1.add(b1);
      boss.add(t1);

      const t2 = t1.clone();
      t2.position.set(0, 2.0, -1.6);
      boss.add(t2);

      // Heavy 8-wheel base
      [2.2, 0.7, -0.8, -2.3].forEach((z) => {
        [-1.65, 1.65].forEach((x) => {
          const w = createWheelMesh();
          w.scale.set(1.4, 1.4, 1.4);
          w.position.set(x, 0.55, z);
          boss.add(w);
        });
      });
      break;
    }

    case 'heavy_war_machine':
    default: {
      // Zone 4 Final Boss: Heavy War Machine (Massive Dreadnought)
      const hull = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 1.6, 7.5),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.85 })
      );
      hull.position.y = 1.3;
      boss.add(hull);

      // Glowing power reactor in center
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      core.position.set(0, 2.2, 0);
      boss.add(core);

      // Side missile pods
      const podL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 2.2), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
      podL.position.set(-2.0, 1.8, -1.0);
      const podR = podL.clone();
      podR.position.x = 2.0;
      boss.add(podL);
      boss.add(podR);

      // Dual forward plasma cannons
      const canL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.5, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      canL.rotation.x = Math.PI / 2;
      canL.position.set(-1.0, 1.3, 4.0);
      const canR = canL.clone();
      canR.position.x = 1.0;
      boss.add(canL);
      boss.add(canR);

      // 10 giant armored combat wheels
      [2.8, 1.4, 0.0, -1.4, -2.8].forEach((z) => {
        [-1.9, 1.9].forEach((x) => {
          const w = createWheelMesh();
          w.scale.set(1.5, 1.5, 1.5);
          w.position.set(x, 0.65, z);
          boss.add(w);
        });
      });
      break;
    }
  }

  return boss;
}
