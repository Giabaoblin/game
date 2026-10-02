import * as THREE from 'three';

export interface VehicleColors {
  primary: string;
  accent: string;
  neon: string;
}

/**
 * Creates high-detail wheel with tread, alloy rim, and visible red brake caliper
 */
export function createWheelMesh(isOffroad: boolean = false): THREE.Group {
  const wheelGroup = new THREE.Group();

  const radius = isOffroad ? 0.48 : 0.40;
  const width = isOffroad ? 0.42 : 0.34;

  // 1. Black Rubber Tire with Tread
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.15,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  // 2. Chrome Brake Rotor Disc
  const discGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width * 0.95, 16);
  discGeo.rotateZ(Math.PI / 2);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  wheelGroup.add(disc);

  // 3. Red Sports Brake Caliper
  const caliperGeo = new THREE.BoxGeometry(width * 0.98, radius * 0.35, radius * 0.25);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3,
    metalness: 0.5,
  });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0, radius * 0.45, 0);
  wheelGroup.add(caliper);

  // 4. Alloy Rim with 5 Spokes
  const rimOuterGeo = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width * 1.02, 16);
  rimOuterGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.2,
  });
  const rimOuter = new THREE.Mesh(rimOuterGeo, rimMat);
  wheelGroup.add(rimOuter);

  // Spokes
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const spokeGeo = new THREE.BoxGeometry(width * 1.03, radius * 0.6, 0.06);
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.x = angle;
    wheelGroup.add(spoke);
  }

  // Hub Center Cap
  const hubGeo = new THREE.CylinderGeometry(0.1, 0.1, width * 1.06, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  wheelGroup.add(hub);

  return wheelGroup;
}

/**
 * Builds visually mounted primary & secondary weapons on the vehicle
 */
export function buildMountedWeapons(
  primaryCategory: string = 'minigun',
  secondaryCategory: string = 'missile',
  colors: VehicleColors
): { primaryGroup: THREE.Group; secondaryGroup: THREE.Group; barrels?: THREE.Group } {
  const primaryGroup = new THREE.Group();
  const secondaryGroup = new THREE.Group();
  let barrels: THREE.Group | undefined;

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.85,
    roughness: 0.25,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.95,
    roughness: 0.15,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  });

  const neonCyanMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
  });

  const hazardMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  // --- 1. BUILD PRIMARY WEAPON ---
  switch (primaryCategory) {
    case 'shotgun': {
      // Heavy Flak Shotgun: massive dual heavy ribbed cannon barrels with blast shield
      const mountBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.18, 12), gunMetalMat);
      primaryGroup.add(mountBase);

      // Gun Breech Block
      const breech = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.7), gunMetalMat);
      breech.position.set(0, 0.22, 0);
      primaryGroup.add(breech);

      // Armored Gunner Shield Plate
      const shieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.08), gunMetalMat);
      shieldPlate.position.set(0, 0.32, 0.15);
      shieldPlate.rotation.x = -0.15;
      primaryGroup.add(shieldPlate);

      // Twin Heavy Flak Barrels
      [-0.14, 0.14].forEach((xOffset) => {
        const barrelGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.2, 12);
        barrelGeo.rotateX(Math.PI / 2);
        const barrel = new THREE.Mesh(barrelGeo, chromeMat);
        barrel.position.set(xOffset, 0.24, 0.85);

        // Flared Muzzle Brake
        const brakeGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.25, 8);
        brakeGeo.rotateX(Math.PI / 2);
        const brake = new THREE.Mesh(brakeGeo, gunMetalMat);
        brake.position.set(0, 0, 0.65);
        barrel.add(brake);

        primaryGroup.add(barrel);
      });
      break;
    }

    case 'plasma': {
      // Plasma Annihilator: futuristic quad-rail electromagnetic cannon with glowing plasma core
      const mountBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.15, 12), gunMetalMat);
      primaryGroup.add(mountBase);

      // Railgun Housing Body
      const bodyGeo = new THREE.BoxGeometry(0.45, 0.32, 1.1);
      const body = new THREE.Mesh(bodyGeo, gunMetalMat);
      body.position.set(0, 0.22, 0.2);
      primaryGroup.add(body);

      // Glowing Plasma Core Orb in center
      const coreGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const core = new THREE.Mesh(coreGeo, neonCyanMat);
      core.position.set(0, 0.24, -0.05);
      primaryGroup.add(core);

      // 4 Glowing Magnetic Accelerator Rails
      [[-0.12, 0.34], [0.12, 0.34], [-0.12, 0.12], [0.12, 0.12]].forEach(([rx, ry]) => {
        const railGeo = new THREE.BoxGeometry(0.04, 0.04, 1.4);
        const rail = new THREE.Mesh(railGeo, neonCyanMat);
        rail.position.set(rx, ry, 0.85);
        primaryGroup.add(rail);
      });
      break;
    }

    case 'minigun':
    default: {
      // Vulcan Minigun: 6-barrel rotating Gatling cannon with ammo drum and feed belt
      const mountBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.18, 12), gunMetalMat);
      primaryGroup.add(mountBase);

      // Rotor Housing
      const rotorBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.55), gunMetalMat);
      rotorBody.position.set(0, 0.22, 0);
      primaryGroup.add(rotorBody);

      // Side High-Capacity Ammo Drum
      const drumGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.22, 16);
      drumGeo.rotateZ(Math.PI / 2);
      const drum = new THREE.Mesh(drumGeo, gunMetalMat);
      drum.position.set(-0.35, 0.22, -0.05);
      primaryGroup.add(drum);

      // Gold Ammo Feed Belt
      const beltGeo = new THREE.BoxGeometry(0.25, 0.08, 0.12);
      const belt = new THREE.Mesh(beltGeo, goldMat);
      belt.position.set(-0.2, 0.24, -0.02);
      primaryGroup.add(belt);

      // 6 Rotating Barrels Assembly
      const barrelCluster = new THREE.Group();
      barrelCluster.position.set(0, 0.22, 0.28);
      barrels = barrelCluster;

      const barrelLength = 1.1;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const bRadius = 0.1;
        const bGeo = new THREE.CylinderGeometry(0.024, 0.024, barrelLength, 8);
        bGeo.rotateX(Math.PI / 2);
        const bMesh = new THREE.Mesh(bGeo, chromeMat);
        bMesh.position.set(Math.cos(angle) * bRadius, Math.sin(angle) * bRadius, barrelLength / 2);
        barrelCluster.add(bMesh);
      }

      // Reinforcing Collar Rings
      [0.3, 0.7, 1.05].forEach((zRing) => {
        const ringGeo = new THREE.TorusGeometry(0.11, 0.018, 8, 16);
        const ring = new THREE.Mesh(ringGeo, gunMetalMat);
        ring.position.set(0, 0, zRing);
        barrelCluster.add(ring);
      });

      primaryGroup.add(barrelCluster);

      // Laser Sight Pointer on top
      const laserBox = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.25), gunMetalMat);
      laserBox.position.set(0, 0.42, 0.1);
      const laserLens = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), hazardMat);
      laserLens.position.set(0, 0, 0.13);
      laserBox.add(laserLens);
      primaryGroup.add(laserBox);
      break;
    }
  }

  // --- 2. BUILD SECONDARY WEAPON ---
  switch (secondaryCategory) {
    case 'emp': {
      // Orbital EMP Shockwave: central roof parabolic emitter dish with tesla coil
      const empBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.12, 16), gunMetalMat);
      empBase.position.set(0, 0.1, -0.6);
      secondaryGroup.add(empBase);

      const dishGeo = new THREE.CylinderGeometry(0.45, 0.1, 0.2, 16);
      const dish = new THREE.Mesh(dishGeo, chromeMat);
      dish.position.set(0, 0.22, -0.6);
      secondaryGroup.add(dish);

      // Glowing Purple Plasma Toroid Core
      const toroidGeo = new THREE.TorusGeometry(0.25, 0.06, 8, 16);
      toroidGeo.rotateX(Math.PI / 2);
      const toroid = new THREE.Mesh(toroidGeo, new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
      toroid.position.set(0, 0.32, -0.6);
      secondaryGroup.add(toroid);
      break;
    }

    case 'bomb': {
      // Cluster Mortar Dispenser: triple angled launch tubes mounted on rear deck
      [-0.25, 0, 0.25].forEach((xOffset, idx) => {
        const tubeGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.65, 10);
        tubeGeo.rotateX(Math.PI / 3); // angled back/up
        const tube = new THREE.Mesh(tubeGeo, gunMetalMat);
        tube.position.set(xOffset, 0.35, -0.8 + Math.abs(xOffset) * 0.1);
        secondaryGroup.add(tube);

        // Visible canister in muzzle
        const shell = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), hazardMat);
        shell.position.set(xOffset, 0.52, -0.9 + Math.abs(xOffset) * 0.1);
        secondaryGroup.add(shell);
      });
      break;
    }

    case 'missile':
    default: {
      // Hellfire Missiles: twin shoulder-mounted 2-rack rocket pods with exposed red warheads
      [-0.85, 0.85].forEach((xSide) => {
        const podBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.95), gunMetalMat);
        podBox.position.set(xSide, 0.45, -0.3);
        secondaryGroup.add(podBox);

        // Yellow warning stripe
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.08, 0.12), new THREE.MeshBasicMaterial({ color: 0xeab308 }));
        stripe.position.set(xSide, 0.45, 0.1);
        secondaryGroup.add(stripe);

        // 2 Exposed Missile Warheads in front of each pod
        [[-0.08, 0.05], [0.08, 0.05]].forEach(([mx, my]) => {
          const missileBody = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), chromeMat);
          missileBody.rotateX(Math.PI / 2);
          missileBody.position.set(xSide + mx, 0.45 + my, 0.15);

          // Red Warhead Nosecone
          const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), hazardMat);
          nose.rotateX(Math.PI / 2);
          nose.position.set(0, 0, 0.45);
          missileBody.add(nose);

          secondaryGroup.add(missileBody);
        });
      });
      break;
    }
  }

  return { primaryGroup, secondaryGroup, barrels };
}

/**
 * Builds player vehicle with high aesthetic fidelity, aggressive styling, and equipped guns
 */
export function buildPlayerVehicleMesh(
  modelType: string,
  colors: VehicleColors,
  primaryCategory: string = 'minigun',
  secondaryCategory: string = 'missile'
): {
  root: THREE.Group;
  wheels: THREE.Group[];
  frontTurret?: THREE.Group;
  turretBarrels?: THREE.Group;
  exhaustPipes: THREE.Vector3[];
} {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const exhaustPipes: THREE.Vector3[] = [];

  const primMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.primary),
    roughness: 0.25,
    metalness: 0.75,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.accent),
    roughness: 0.4,
    metalness: 0.6,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.35,
    metalness: 0.8,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.88,
  });

  const neonGlowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colors.neon),
  });

  const headlightMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  let turretY = 0.95;
  let turretZ = 0.1;

  switch (modelType) {
    case 'buggy': {
      // --- 1. SANDSTORM BUGGY ---
      // Heavy tube frame base
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.28, 3.4), carbonMat);
      frame.position.y = 0.52;
      root.add(frame);

      // Angled roll cage structure
      const cage = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 1.9), primMat);
      cage.position.set(0, 1.05, -0.15);
      root.add(cage);

      // Pre-runner front bull-bar with skid plate
      const bullBar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.3), accentMat);
      bullBar.position.set(0, 0.55, 1.7);
      bullBar.rotation.x = -0.25;
      root.add(bullBar);

      // Dual front KC offroad spotlights
      [-0.45, 0.45].forEach((x) => {
        const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12), carbonMat);
        spot.rotateX(Math.PI / 2);
        spot.position.set(x, 0.75, 1.75);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        lens.position.set(0, 0, 0.07);
        spot.add(lens);
        root.add(spot);
      });

      // Roof 5-pod LED light bar
      const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.12), carbonMat);
      lightBar.position.set(0, 1.55, 0.5);
      for (let i = -2; i <= 2; i++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
        led.position.set(i * 0.22, 0, 0.07);
        lightBar.add(led);
      }
      root.add(lightBar);

      // Rear exposed V8 engine block
      const v8 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.8), carbonMat);
      v8.position.set(0, 0.8, -1.25);
      root.add(v8);

      // 4 Large Knobby Mud Wheels
      const wheelPositions = [
        [-1.02, 0.48, 1.15],
        [1.02, 0.48, 1.15],
        [-1.08, 0.52, -1.25],
        [1.08, 0.52, -1.25],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh(true);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      turretY = 1.58;
      turretZ = -0.2;
      exhaustPipes.push(new THREE.Vector3(-0.35, 0.8, -1.7), new THREE.Vector3(0.35, 0.8, -1.7));
      break;
    }

    case 'truck': {
      // --- 2. MARAUDER ARMORED TRUCK ---
      // Heavy Armored Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.25, 2.0), primMat);
      cab.position.set(0, 1.1, 0.45);
      root.add(cab);

      // Ballistic Slit Windshield
      const windShield = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.32, 0.06), glassMat);
      windShield.position.set(0, 1.35, 1.46);
      root.add(windShield);

      // Reinforced Rear Cargo Bed
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 1.9), accentMat);
      bed.position.set(0, 0.85, -1.35);
      root.add(bed);

      // Brutal Ramming Cowcatcher Plow with Hazard Stripes
      const plow = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.75, 0.45), carbonMat);
      plow.position.set(0, 0.55, 1.6);
      plow.rotation.x = -0.22;
      root.add(plow);

      // Yellow/Black Hazard Stripes on Plow
      const hazardStripe = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.15, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xeab308 })
      );
      hazardStripe.position.set(0, 0.55, 1.83);
      hazardStripe.rotation.x = -0.22;
      root.add(hazardStripe);

      // Dual Vertical Chrome Exhaust Stacks
      [-0.95, 0.95].forEach((x) => {
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 10), carbonMat);
        stack.position.set(x, 1.65, -0.45);
        root.add(stack);
        exhaustPipes.push(new THREE.Vector3(x, 2.35, -0.45));
      });

      // 4 Heavy Ballistic Wheels
      const wheelPositions = [
        [-1.15, 0.48, 1.1],
        [1.15, 0.48, 1.1],
        [-1.15, 0.48, -1.4],
        [1.15, 0.48, -1.4],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh(true);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      turretY = 1.78;
      turretZ = 0.35;
      break;
    }

    case 'cyber': {
      // --- 3. NEON PHANTOM SUPERCAR ---
      // Sculpted low-slung aerodynamic body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.48, 3.9), primMat);
      body.position.y = 0.42;
      root.add(body);

      // Jet-Fighter Cockpit Canopy
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 1.9), glassMat);
      canopy.position.set(0, 0.78, -0.15);
      root.add(canopy);

      // Carbon front canards & splitter
      const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.08, 0.45), carbonMat);
      splitter.position.set(0, 0.22, 1.95);
      root.add(splitter);

      // Twin Le Mans High-Downforce Rear Stabilizer Shark Fins
      [-0.85, 0.85].forEach((x) => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 1.4), accentMat);
        fin.position.set(x, 0.85, -1.4);
        root.add(fin);
      });

      // Active Aero GT Wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.07, 0.42), carbonMat);
      wing.position.set(0, 1.12, -1.85);
      root.add(wing);

      // Neon Underglow Light Strips along sides
      [-1.0, 1.0].forEach((x) => {
        const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 3.4), neonGlowMat);
        neonStrip.position.set(x, 0.22, 0);
        root.add(neonStrip);
      });

      // 4 Low-Profile Racing Wheels
      const wheelPositions = [
        [-1.02, 0.38, 1.25],
        [1.02, 0.38, 1.25],
        [-1.06, 0.40, -1.25],
        [1.06, 0.40, -1.25],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh(false);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      turretY = 1.05;
      turretZ = -0.1;
      exhaustPipes.push(new THREE.Vector3(-0.45, 0.4, -2.0), new THREE.Vector3(0.45, 0.4, -2.0));
      break;
    }

    case 'juggernaut': {
      // --- 4. TITAN JUGGERNAUT (6x6 COMBAT ASSAULT) ---
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.95, 4.5), primMat);
      hull.position.y = 0.82;
      root.add(hull);

      // Reactive armor side skirts
      [-1.25, 1.25].forEach((x) => {
        const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 4.3), carbonMat);
        skirt.position.set(x, 0.72, 0);
        root.add(skirt);
      });

      // Heavy Turret Ring Cupola
      const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.35, 12), accentMat);
      cupola.position.set(0, 1.4, 0.15);
      root.add(cupola);

      // 6 Heavy Armored Wheels (3 Axles)
      [1.4, 0.0, -1.4].forEach((z) => {
        [-1.28, 1.28].forEach((x) => {
          const w = createWheelMesh(true);
          w.position.set(x, 0.48, z);
          wheels.push(w);
          root.add(w);
        });
      });

      turretY = 1.62;
      turretZ = 0.15;
      exhaustPipes.push(new THREE.Vector3(-0.8, 0.85, -2.3), new THREE.Vector3(0.8, 0.85, -2.3));
      break;
    }

    case 'doomsday': {
      // --- 5. APEX DOOMSDAY DREADNOUGHT ---
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.65, 4.6), primMat);
      hull.position.y = 0.65;
      root.add(hull);

      // Forward swept stealth aero wings with hardpoints
      [-1.45, 1.45].forEach((x, idx) => {
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 2.2), carbonMat);
        wingL.position.set(x, 0.72, -0.6);
        root.add(wingL);

        // Glowing red plasma intake cowls
        const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.3, 10), neonGlowMat);
        cowl.rotateX(Math.PI / 2);
        cowl.position.set(x * 0.85, 0.98, -0.4);
        root.add(cowl);
      });

      // 4 Massive Widebody Track Wheels
      [[-1.35, 0.44, 1.35], [1.35, 0.44, 1.35], [-1.35, 0.44, -1.45], [1.35, 0.44, -1.45]].forEach(([x, y, z]) => {
        const w = createWheelMesh(false);
        w.scale.set(1.2, 1.2, 1.2);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      turretY = 1.05;
      turretZ = 0.2;
      exhaustPipes.push(new THREE.Vector3(-0.65, 0.6, -2.35), new THREE.Vector3(0.65, 0.6, -2.35));
      break;
    }

    case 'interceptor':
    default: {
      // --- 6. VIPER INTERCEPTOR (DEFAULT COMBAT COUPE) ---
      // Sculpted Muscular Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.52, 3.7), primMat);
      body.position.y = 0.46;
      root.add(body);

      // Sleek Fastback Cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.46, 1.7), glassMat);
      cabin.position.set(0, 0.86, -0.22);
      root.add(cabin);

      // Aggressive Front Carbon Splitter with Endplates
      const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.35), carbonMat);
      splitter.position.set(0, 0.25, 1.88);
      root.add(splitter);

      // Twin High-Intensity LED Headlights + Amber DRL
      [-0.65, 0.65].forEach((x) => {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.06), headlightMat);
        head.position.set(x, 0.5, 1.86);
        root.add(head);

        const drl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.07), neonGlowMat);
        drl.position.set(x, 0.42, 1.86);
        root.add(drl);
      });

      // Hood Power Bulge & Air Scoop
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.9), carbonMat);
      scoop.position.set(0, 0.72, 0.95);
      root.add(scoop);

      // Dual-Tier GT Rear Racing Spoiler
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.38), carbonMat);
      wing.position.set(0, 1.05, -1.72);
      root.add(wing);

      // Spoiler Stanchions
      [-0.6, 0.6].forEach((x) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.15), carbonMat);
        post.position.set(x, 0.88, -1.7);
        root.add(post);
      });

      // 4 Wheels
      const wheelPositions = [
        [-0.98, 0.4, 1.15],
        [0.98, 0.4, 1.15],
        [-0.98, 0.4, -1.15],
        [0.98, 0.4, -1.15],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = createWheelMesh(false);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });

      turretY = 1.12;
      turretZ = -0.15;
      exhaustPipes.push(new THREE.Vector3(-0.45, 0.38, -1.86), new THREE.Vector3(0.45, 0.38, -1.86));
      break;
    }
  }

  // --- MOUNT WEAPON ARSENAL ON VEHICLE ---
  const { primaryGroup, secondaryGroup, barrels } = buildMountedWeapons(
    primaryCategory,
    secondaryCategory,
    colors
  );

  // Position primary turret on roof
  primaryGroup.position.set(0, turretY, turretZ);
  root.add(primaryGroup);

  // Position secondary launcher
  secondaryGroup.position.set(0, turretY - 0.2, turretZ);
  root.add(secondaryGroup);

  return {
    root,
    wheels,
    frontTurret: primaryGroup,
    turretBarrels: barrels,
    exhaustPipes,
  };
}

// Build Enemy Vehicles with distinctive combat frames
export function buildEnemyVehicleMesh(
  type: 'patrol' | 'buggy' | 'heavy' | 'kamikaze' | 'vip' | 'convoy_unit'
): { root: THREE.Group; wheels: THREE.Group[] } {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];

  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.6 });

  switch (type) {
    case 'kamikaze': {
      // Small agile red spiked drone buggy
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.85, 2.0, 5),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6 })
      );
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.42;
      root.add(body);

      // Warning pulsating light
      const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redLight.position.set(0, 0.75, 0);
      root.add(redLight);

      // 4 wheels
      [[-0.65, 0.32, 0.65], [0.65, 0.32, 0.65], [-0.65, 0.32, -0.65], [0.65, 0.32, -0.65]].forEach(([x, y, z]) => {
        const w = createWheelMesh(false);
        w.scale.set(0.85, 0.85, 0.85);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });
      break;
    }

    case 'vip':
    case 'convoy_unit':
    case 'heavy': {
      // Heavy armored assault carrier
      const bodyColor = type === 'vip' ? 0xd97706 : type === 'convoy_unit' ? 0x0284c7 : 0x3f6212;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.25, 3.9),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7, metalness: 0.4 })
      );
      body.position.y = 0.92;
      root.add(body);

      // Rear Gun Turret
      const turret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.5, 0.45, 8),
        carbonMat
      );
      turret.position.set(0, 1.65, -0.6);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), carbonMat);
      barrel.rotateX(Math.PI / 2);
      barrel.position.set(0, 0.1, 0.7);
      turret.add(barrel);
      root.add(turret);

      [[-1.2, 0.48, 1.15], [1.2, 0.48, 1.15], [-1.2, 0.48, -1.15], [1.2, 0.48, -1.15]].forEach(([x, y, z]) => {
        const w = createWheelMesh(true);
        w.position.set(x, y, z);
        wheels.push(w);
        root.add(w);
      });
      break;
    }

    case 'patrol':
    default: {
      // Highway Enforcer Cruiser
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.52, 3.5),
        carbonMat
      );
      body.position.y = 0.46;
      root.add(body);

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.42, 1.6),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 })
      );
      roof.position.set(0, 0.85, -0.1);
      root.add(roof);

      // Flashing police lightbar
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.09, 0.16), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      bar.position.set(0, 1.1, -0.1);
      root.add(bar);

      [[-0.98, 0.4, 1.05], [0.98, 0.4, 1.05], [-0.98, 0.4, -1.05], [0.98, 0.4, -1.05]].forEach(([x, y, z]) => {
        const w = createWheelMesh(false);
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
          const w = createWheelMesh(true);
          w.scale.set(1.35, 1.35, 1.35);
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
        const w = createWheelMesh(false);
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
          const w = createWheelMesh(true);
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
          const w = createWheelMesh(true);
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
