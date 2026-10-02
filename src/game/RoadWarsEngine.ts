import * as THREE from 'three';
import { Vehicle, Weapon, Mission, Zone, GameHUDState } from '../types/game';
import { calculateVehicleActualStats, calculateWeaponActualStats } from '../data/gameData';
import { buildPlayerVehicleMesh, buildEnemyVehicleMesh, buildBossMesh } from './vehicleMeshBuilder';
import { EnvironmentManager, WorldPickup } from './environmentBuilder';
import { soundManager } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onHUDUpdate: (state: GameHUDState) => void;
  onMissionComplete: (result: {
    victory: boolean;
    reason: string;
    coinsEarned: number;
    xpEarned: number;
    kills: number;
    timeTaken: number;
    stars: number;
  }) => void;
  onTogglePause?: () => void;
}

export interface Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  isPlayer: boolean;
  lifetime: number;
  maxLifetime: number;
  homingTarget?: AIEnemy;
  isPiercing?: boolean;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  fade: boolean;
}

export interface AIEnemy {
  mesh: THREE.Group;
  wheels: THREE.Group[];
  type: 'patrol' | 'buggy' | 'heavy' | 'kamikaze' | 'vip' | 'convoy_unit';
  health: number;
  maxHealth: number;
  speed: number;
  targetLaneX: number;
  shootCooldown: number;
  active: boolean;
}

export class RoadWarsEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private envManager: EnvironmentManager;

  // Game setup
  public vehicle: Vehicle;
  public primaryWeapon: Weapon;
  public secondaryWeapon: Weapon;
  public mission: Mission;
  public zone: Zone;
  public callbacks: GameEngineCallbacks;

  // Player state
  private playerGroup: THREE.Group;
  private playerWheels: THREE.Group[] = [];
  private playerTurret?: THREE.Group;
  private turretBarrels?: THREE.Group;
  private playerStats: ReturnType<typeof calculateVehicleActualStats>;
  private primaryStats: ReturnType<typeof calculateWeaponActualStats>;
  private secondaryStats: ReturnType<typeof calculateWeaponActualStats>;

  private currentSpeed: number = 0; // km/h
  private maxSpeed: number = 180;
  private playerX: number = 0;
  private playerZ: number = 0;
  private playerYaw: number = 0;
  private currentSteer: number = 0;
  private playerHealth: number = 200;
  private maxHealth: number = 200;
  private playerArmor: number = 25;
  private maxArmor: number = 25;
  private nitroAmount: number = 5.0;
  private maxNitro: number = 5.0;
  private isBoosting: boolean = false;
  private isDrifting: boolean = false;
  private fuelAmount: number = 100;
  private maxFuel: number = 100;

  // Weapons state
  private primaryAmmo: number = 60;
  private isPrimaryReloading: boolean = false;
  private primaryReloadTimer: number = 0;
  private primaryShootCooldown: number = 0;
  private secondaryCooldownTimer: number = 0;
  private secondaryAmmo: number = 4;

  // Entities & pools
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private enemies: AIEnemy[] = [];
  private bossGroup?: THREE.Group;
  private bossHealth: number = 0;
  private bossMaxHealth: number = 0;
  private bossActive: boolean = false;
  private bossAttackCooldown: number = 0;
  private escortMesh?: THREE.Group;
  private escortHealth: number = 300;

  // Objectives & score
  private kills: number = 0;
  private elapsedTime: number = 0;
  private timeLimit: number = 90;
  private comboStreak: number = 0;
  private comboTimer: number = 0;
  private isGameOver: boolean = false;
  private cameraShakeIntensity: number = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  private animationFrameId: number = 0;
  private lastTime: number = 0;

  constructor(
    container: HTMLElement,
    vehicle: Vehicle,
    primaryWeapon: Weapon,
    secondaryWeapon: Weapon,
    mission: Mission,
    zone: Zone,
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.vehicle = vehicle;
    this.primaryWeapon = primaryWeapon;
    this.secondaryWeapon = secondaryWeapon;
    this.mission = mission;
    this.zone = zone;
    this.callbacks = callbacks;

    this.playerStats = calculateVehicleActualStats(vehicle);
    this.primaryStats = calculateWeaponActualStats(primaryWeapon);
    this.secondaryStats = calculateWeaponActualStats(secondaryWeapon);

    this.maxSpeed = this.playerStats.topSpeed;
    this.playerHealth = this.playerStats.health;
    this.maxHealth = this.playerStats.health;
    this.playerArmor = this.playerStats.armor;
    this.maxArmor = this.playerStats.armor;
    this.nitroAmount = this.playerStats.nitro;
    this.maxNitro = this.playerStats.nitro;
    this.primaryAmmo = this.primaryStats.ammoCapacity;
    this.secondaryAmmo = this.secondaryStats.ammoCapacity;
    this.timeLimit = mission.timeLimit;

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
    this.camera.position.set(0, 4.5, -9);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 4. Environment
    this.envManager = new EnvironmentManager(this.scene, zone.theme);

    // 5. Build player vehicle mesh with visually mounted weapon arsenal
    const pMesh = buildPlayerVehicleMesh(
      vehicle.modelType,
      {
        primary: vehicle.paintColor,
        accent: vehicle.accentColor,
        neon: vehicle.neonColor,
      },
      primaryWeapon.category,
      secondaryWeapon.category
    );
    this.playerGroup = pMesh.root;
    this.playerWheels = pMesh.wheels;
    this.playerTurret = pMesh.frontTurret;
    this.turretBarrels = pMesh.turretBarrels;
    this.scene.add(this.playerGroup);

    // 6. Spawn boss or escort if mission requires
    if (this.mission.type === 'boss_showdown' && this.mission.bossType) {
      this.initBoss(this.mission.bossType);
    } else if (this.mission.type === 'escort') {
      this.initEscort();
    }

    // 7. Initial enemies spawn
    for (let i = 0; i < 4; i++) {
      this.spawnEnemy(60 + i * 25);
    }

    // 8. Event listeners
    this.setupInputs();

    // 9. Sound start
    soundManager.startEngine();

    // 10. Start loop
    this.lastTime = performance.now();
    this.loop();
  }

  private initBoss(bossType: 'tank_truck' | 'cyber_racer' | 'armored_convoy' | 'heavy_war_machine') {
    this.bossGroup = buildBossMesh(bossType);
    this.bossGroup.position.set(0, 0, 110);
    this.scene.add(this.bossGroup);
    this.bossActive = true;

    // Set boss HP scaling with zone
    const baseHPs = {
      tank_truck: 1800,
      cyber_racer: 2400,
      armored_convoy: 3200,
      heavy_war_machine: 4500,
    };
    this.bossMaxHealth = baseHPs[bossType] || 2000;
    this.bossHealth = this.bossMaxHealth;
  }

  private initEscort() {
    const { root } = buildEnemyVehicleMesh('heavy');
    // Color it green for allied escort
    this.escortMesh = root;
    this.escortMesh.position.set(-3.5, 0, 15);
    this.scene.add(this.escortMesh);
    this.escortHealth = 350;
  }

  private onKeyDownBound = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    // Manual Reload on R
    if (e.code === 'KeyR' && !this.isPrimaryReloading && this.primaryAmmo < this.primaryStats.ammoCapacity) {
      this.isPrimaryReloading = true;
      this.primaryReloadTimer = this.primaryStats.cooldown;
      soundManager.playCoin();
    }
    // Toggle pause on Escape or P
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.callbacks.onTogglePause) {
        this.callbacks.onTogglePause();
      }
    }
  };

  private onKeyUpBound = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onMouseDownBound = (e: MouseEvent) => {
    if (e.button === 0) this.keys['MouseButton0'] = true;
    if (e.button === 2) this.keys['MouseButton2'] = true;
  };

  private onMouseUpBound = (e: MouseEvent) => {
    if (e.button === 0) this.keys['MouseButton0'] = false;
    if (e.button === 2) this.keys['MouseButton2'] = false;
  };

  private onContextMenuBound = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onResizeBound = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private setupInputs() {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('resize', this.onResizeBound);

    // Mouse buttons directly on window & container
    window.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    this.container.addEventListener('contextmenu', this.onContextMenuBound);
  }

  public setInputKey(code: string, pressed: boolean) {
    this.keys[code] = pressed;
  }

  private loop = () => {
    if (this.isGameOver) return;
    this.animationFrameId = requestAnimationFrame(this.loop);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();
  };

  private update(dt: number) {
    this.elapsedTime += dt;

    // Fuel countdown in fuel rush
    if (this.mission.type === 'fuel_rush') {
      this.fuelAmount -= dt * 3.5;
      if (this.fuelAmount <= 0) {
        this.fuelAmount = 0;
        this.triggerDefeat('Hết nhiên liệu giữa đường đua!');
        return;
      }
    }

    // Time limit countdown
    const timeRemaining = Math.max(0, this.timeLimit - this.elapsedTime);
    if (timeRemaining <= 0) {
      this.triggerDefeat('Hết thời gian quy định!');
      return;
    }

    // Combo streak decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboStreak = 0;
      }
    }

    // 1. Vehicle Physics: Acceleration / Steering
    const accelInput = (this.keys['KeyW'] || this.keys['ArrowUp']) ? 1 : (this.keys['KeyS'] || this.keys['ArrowDown']) ? -0.85 : 0;
    
    // Steering: A / ArrowLeft steers LEFT on screen (+X); D / ArrowRight steers RIGHT on screen (-X)
    const isLeft = !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
    const isRight = !!(this.keys['KeyD'] || this.keys['ArrowRight']);
    const steerInput = (isLeft && !isRight) ? 1 : (isRight && !isLeft) ? -1 : 0;

    const handbrake = this.keys['Space'] || this.keys['KeyX'] || this.keys['ControlLeft'] || this.keys['ControlRight'] || false;
    const boostPressed = (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyC'] || this.keys['Numpad0']) && this.nitroAmount > 0;

    // Boosting
    this.isBoosting = boostPressed && this.currentSpeed > 25;
    if (this.isBoosting) {
      this.nitroAmount = Math.max(0, this.nitroAmount - dt);
      soundManager.playNitro();
    } else {
      // Slow passive nitro regeneration
      this.nitroAmount = Math.min(this.maxNitro, this.nitroAmount + dt * 0.2);
    }

    // Target top speed
    const effectiveTopSpeed = this.isBoosting ? this.maxSpeed * 1.35 : this.maxSpeed;

    // Acceleration math
    if (accelInput > 0) {
      const accelRate = 48 * this.playerStats.acceleration * (this.isBoosting ? 1.6 : 1.0);
      this.currentSpeed = Math.min(effectiveTopSpeed, this.currentSpeed + accelRate * dt);
    } else if (accelInput < 0) {
      // Braking / reverse
      this.currentSpeed = Math.max(-35, this.currentSpeed - 110 * dt);
    } else {
      // Coasting friction
      if (this.currentSpeed > 0) {
        this.currentSpeed = Math.max(0, this.currentSpeed - 24 * dt);
      } else if (this.currentSpeed < 0) {
        this.currentSpeed = Math.min(0, this.currentSpeed + 35 * dt);
      }
    }

    // Drifting
    this.isDrifting = handbrake && Math.abs(steerInput) > 0.1 && this.currentSpeed > 50;
    if (this.isDrifting) {
      soundManager.playDrift();
      this.spawnDriftParticles();
    }

    // Smooth steering input damping (gentle, moderate response without twitchiness)
    const steerInterpolateSpeed = steerInput === 0 ? 8.5 : 7.0;
    this.currentSteer += (steerInput - this.currentSteer) * Math.min(1, dt * steerInterpolateSpeed);

    // Balanced lateral speed (lane change is smooth, controllable, and responsive)
    const handlingMultiplier = Math.max(0.75, Math.min(1.35, this.playerStats.handling / 7.0));
    const speedScale = Math.min(1.0, Math.max(0.2, Math.abs(this.currentSpeed) / 45));
    const maxLateralSpeed = 15.0 * (this.isDrifting ? 1.35 : 1.0) * handlingMultiplier * speedScale;
    const lateralSpeed = this.currentSteer * maxLateralSpeed;
    this.playerX += lateralSpeed * dt;

    // Road barrier bounds (width = 24 -> limit = 10.5)
    if (this.playerX < -10.5) {
      this.playerX = -10.5;
      this.currentSpeed *= 0.90;
      this.cameraShakeIntensity = 0.25;
      soundManager.playHit();
    } else if (this.playerX > 10.5) {
      this.playerX = 10.5;
      this.currentSpeed *= 0.90;
      this.cameraShakeIntensity = 0.25;
      soundManager.playHit();
    }

    // Forward motion (km/h to m/s: 1 km/h = 1/3.6 m/s)
    const forwardVelocity = (this.currentSpeed / 3.6);
    this.playerZ += forwardVelocity * dt;

    // Player yaw angle (tilt while steering) & auto-centering
    const targetYaw = this.currentSteer * (this.isDrifting ? 0.36 : 0.18);
    this.playerYaw += (targetYaw - this.playerYaw) * Math.min(1, dt * 10);

    // Update Player Mesh transform
    this.playerGroup.position.set(this.playerX, 0, this.playerZ);
    this.playerGroup.rotation.y = this.playerYaw;
    this.playerGroup.rotation.z = -this.currentSteer * 0.035; // subtle bank

    // Spin wheels
    const wheelSpin = (forwardVelocity / 0.42) * dt;
    this.playerWheels.forEach((w) => {
      w.rotation.x += wheelSpin;
      // Front wheels turn smoothly
      if (w.position.z > 0) {
        w.rotation.y = this.currentSteer * 0.28;
      }
    });

    // Exhaust nitro flames
    if (this.isBoosting) {
      this.spawnNitroParticles();
    }

    // Update Engine Sound pitch
    soundManager.updateEnginePitch(Math.abs(this.currentSpeed) / this.maxSpeed, accelInput > 0);

    // 2. Camera Chase Logic
    const targetCamFOV = this.isBoosting ? 78 : 65;
    this.camera.fov += (targetCamFOV - this.camera.fov) * dt * 5;
    this.camera.updateProjectionMatrix();

    const speedRatio = Math.abs(this.currentSpeed) / this.maxSpeed;
    const camDistance = 8.5 + speedRatio * 1.5;
    const camHeight = 4.2;
    const desiredCamPos = new THREE.Vector3(
      this.playerX * 0.7,
      camHeight,
      this.playerZ - camDistance
    );

    // Camera shake
    if (this.cameraShakeIntensity > 0) {
      desiredCamPos.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      desiredCamPos.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2);
    }

    this.camera.position.lerp(desiredCamPos, dt * 8);
    this.camera.lookAt(new THREE.Vector3(this.playerX * 0.3, 1.2, this.playerZ + 12));

    // 3. Environment Update
    this.envManager.update(this.playerZ, dt);

    // 4. Weapons & Combat Handling
    this.handleWeapons(dt);

    // 5. Bullets Update
    this.updateBullets(dt);

    // 6. Particles Update
    this.updateParticles(dt);

    // 7. AI Enemies Update & Spawning
    this.updateEnemies(dt);

    // 8. Boss Update
    if (this.bossActive && this.bossGroup) {
      this.updateBoss(dt);
    }

    // 9. Pickups Collision
    this.updatePickups();

    // 10. Check Mission Objective Victory
    this.checkVictoryConditions();

    // 11. Notify React HUD
    this.callbacks.onHUDUpdate({
      speed: Math.round(Math.abs(this.currentSpeed)),
      gear: this.currentSpeed < 5 ? 1 : Math.min(6, Math.floor(this.currentSpeed / 45) + 1),
      health: Math.max(0, Math.round(this.playerHealth)),
      maxHealth: this.maxHealth,
      armor: Math.max(0, Math.round(this.playerArmor)),
      maxArmor: this.maxArmor,
      nitro: +this.nitroAmount.toFixed(1),
      maxNitro: this.maxNitro,
      fuel: Math.round(this.fuelAmount),
      maxFuel: this.maxFuel,
      isNitroActive: this.isBoosting,
      kills: this.kills,
      targetKills: this.mission.targetCount,
      timeRemaining: Math.round(timeRemaining),
      primaryAmmo: this.primaryAmmo,
      maxPrimaryAmmo: this.primaryStats.ammoCapacity,
      isPrimaryReloading: this.isPrimaryReloading,
      secondaryAmmo: this.secondaryAmmo,
      maxSecondaryAmmo: this.secondaryStats.ammoCapacity,
      secondaryCooldown: Math.max(0, this.secondaryCooldownTimer / this.secondaryStats.cooldown),
      comboCount: this.comboStreak,
      comboTimer: +this.comboTimer.toFixed(1),
      bossHealth: this.bossActive ? Math.max(0, Math.round(this.bossHealth)) : undefined,
      bossMaxHealth: this.bossActive ? this.bossMaxHealth : undefined,
      bossName: this.bossActive ? this.mission.bossName : undefined,
      escortHealth: this.escortMesh ? Math.round(this.escortHealth) : undefined,
    });
  }

  private handleWeapons(dt: number) {
    // Primary Weapon cooldown & reload
    if (this.isPrimaryReloading) {
      this.primaryReloadTimer -= dt;
      if (this.primaryReloadTimer <= 0) {
        this.isPrimaryReloading = false;
        this.primaryAmmo = this.primaryStats.ammoCapacity;
      }
    } else {
      if (this.primaryShootCooldown > 0) {
        this.primaryShootCooldown -= dt;
      }

      // Fire Primary (MouseButton0 / KeyE / KeyJ / Numpad1)
      const firePrimary = this.keys['MouseButton0'] || this.keys['KeyE'] || this.keys['KeyJ'] || this.keys['Numpad1'];
      if (firePrimary && this.primaryShootCooldown <= 0) {
        if (this.primaryAmmo > 0) {
          this.firePrimaryWeapon();
          this.primaryAmmo--;
          this.primaryShootCooldown = 1 / this.primaryStats.fireRate;
        } else {
          // Trigger Reload
          this.isPrimaryReloading = true;
          this.primaryReloadTimer = this.primaryStats.cooldown;
        }
      }
    }

    // Secondary Weapon cooldown
    if (this.secondaryCooldownTimer > 0) {
      this.secondaryCooldownTimer -= dt;
    }

    // Fire Secondary (MouseButton2 / KeyQ / KeyF / KeyK / Numpad2)
    const fireSecondary = this.keys['MouseButton2'] || this.keys['KeyQ'] || this.keys['KeyF'] || this.keys['KeyK'] || this.keys['Numpad2'];
    if (fireSecondary && this.secondaryCooldownTimer <= 0 && this.secondaryAmmo > 0) {
      this.fireSecondaryWeapon();
      this.secondaryAmmo--;
      this.secondaryCooldownTimer = this.secondaryStats.cooldown;
      if (this.secondaryAmmo <= 0) {
        // Refill ammo on full cooldown
        this.secondaryAmmo = this.secondaryStats.ammoCapacity;
      }
    }
  }

  private firePrimaryWeapon() {
    const muzzlePos = new THREE.Vector3(this.playerX, 1.25, this.playerZ + 2.2);

    // Spin minigun barrels if mounted
    if (this.turretBarrels) {
      this.turretBarrels.rotation.z += 1.4;
    }

    // Gun muzzle flash particle
    const flashColor = this.primaryWeapon.category === 'plasma' ? 0x06b6d4 : 0xfef08a;
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 6, 6),
      new THREE.MeshBasicMaterial({ color: flashColor })
    );
    flash.position.copy(muzzlePos);
    this.scene.add(flash);
    setTimeout(() => this.scene.remove(flash), 40);

    switch (this.primaryWeapon.category) {
      case 'shotgun': {
        soundManager.playShotgun();
        // 7 Pellets in a spread fan
        for (let i = -3; i <= 3; i++) {
          const spreadX = i * 0.12;
          const bulletGeo = new THREE.SphereGeometry(0.18, 6, 6);
          const bulletMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const bullet = new THREE.Mesh(bulletGeo, bulletMat);
          bullet.position.copy(muzzlePos);
          this.scene.add(bullet);

          this.bullets.push({
            mesh: bullet,
            velocity: new THREE.Vector3(spreadX * 60, 0, 160 + this.currentSpeed / 3.6),
            damage: Math.round(this.primaryStats.damage / 5),
            isPlayer: true,
            lifetime: 0,
            maxLifetime: 0.7,
          });
        }
        break;
      }

      case 'plasma': {
        soundManager.playPlasma();
        const bulletGeo = new THREE.SphereGeometry(0.45, 8, 8);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);
        bullet.position.copy(muzzlePos);
        this.scene.add(bullet);

        this.bullets.push({
          mesh: bullet,
          velocity: new THREE.Vector3(0, 0, 190 + this.currentSpeed / 3.6),
          damage: this.primaryStats.damage,
          isPlayer: true,
          lifetime: 0,
          maxLifetime: 1.1,
          isPiercing: true,
        });
        break;
      }

      case 'minigun':
      default: {
        soundManager.playMinigun();
        const bulletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6);
        bulletGeo.rotateX(Math.PI / 2);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);

        // Alternating left/right barrel
        const offset = Math.random() > 0.5 ? -0.2 : 0.2;
        bullet.position.set(muzzlePos.x + offset, muzzlePos.y, muzzlePos.z);
        this.scene.add(bullet);

        this.bullets.push({
          mesh: bullet,
          velocity: new THREE.Vector3(0, 0, 230 + this.currentSpeed / 3.6),
          damage: this.primaryStats.damage,
          isPlayer: true,
          lifetime: 0,
          maxLifetime: 1.0,
        });
        break;
      }
    }
  }

  private fireSecondaryWeapon() {
    const muzzlePos = new THREE.Vector3(this.playerX, 1.2, this.playerZ + 2.0);

    switch (this.secondaryWeapon.category) {
      case 'emp': {
        soundManager.playPlasma();
        this.cameraShakeIntensity = 0.5;

        // Big expanding energy ring
        const ringGeo = new THREE.RingGeometry(1, 1.5, 32);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(muzzlePos);
        this.scene.add(ring);

        // Damage all nearby enemies in 35m radius
        for (const enemy of this.enemies) {
          if (enemy.active && enemy.mesh.position.distanceTo(muzzlePos) < 45) {
            this.damageEnemy(enemy, this.secondaryStats.damage);
            enemy.speed *= 0.3; // Stun
          }
        }
        if (this.bossActive && this.bossGroup && this.bossGroup.position.distanceTo(muzzlePos) < 50) {
          this.damageBoss(this.secondaryStats.damage * 0.8);
        }

        // Particle effect
        setTimeout(() => this.scene.remove(ring), 400);
        break;
      }

      case 'bomb': {
        soundManager.playExplosion(false);
        // Cluster mortar: 3 bouncing grenades
        [-1.5, 0, 1.5].forEach((offset) => {
          const bombGeo = new THREE.SphereGeometry(0.35, 8, 8);
          const bombMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
          const bomb = new THREE.Mesh(bombGeo, bombMat);
          bomb.position.copy(muzzlePos);
          this.scene.add(bomb);

          this.bullets.push({
            mesh: bomb,
            velocity: new THREE.Vector3(offset * 12, 10, 110 + this.currentSpeed / 3.6),
            damage: this.secondaryStats.damage,
            isPlayer: true,
            lifetime: 0,
            maxLifetime: 1.2,
          });
        });
        break;
      }

      case 'missile':
      default: {
        soundManager.playMissileLaunch();
        // Launch 2 homing missiles
        [-0.8, 0.8].forEach((offsetX) => {
          const misGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.3, 8);
          misGeo.rotateX(Math.PI / 2);
          const misMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
          const missile = new THREE.Mesh(misGeo, misMat);
          missile.position.set(muzzlePos.x + offsetX, muzzlePos.y + 0.3, muzzlePos.z);
          this.scene.add(missile);

          // Find target enemy in front
          let target: AIEnemy | undefined;
          let minDistance = 200;
          for (const enemy of this.enemies) {
            if (enemy.active && enemy.mesh.position.z > this.playerZ) {
              const d = enemy.mesh.position.distanceTo(muzzlePos);
              if (d < minDistance) {
                minDistance = d;
                target = enemy;
              }
            }
          }

          this.bullets.push({
            mesh: missile,
            velocity: new THREE.Vector3(offsetX * 8, 2, 140 + this.currentSpeed / 3.6),
            damage: this.secondaryStats.damage,
            isPlayer: true,
            lifetime: 0,
            maxLifetime: 2.2,
            homingTarget: target,
          });
        });
        break;
      }
    }
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.lifetime += dt;

      // Homing logic for missiles
      if (b.homingTarget && b.homingTarget.active) {
        const toTarget = new THREE.Vector3().subVectors(b.homingTarget.mesh.position, b.mesh.position).normalize();
        b.velocity.lerp(toTarget.multiplyScalar(170), dt * 6);
        b.mesh.lookAt(b.homingTarget.mesh.position);
      }

      b.mesh.position.addScaledVector(b.velocity, dt);

      // Check collision
      let hit = false;
      if (b.isPlayer) {
        // Hit regular enemies
        for (const enemy of this.enemies) {
          if (enemy.active && enemy.mesh.position.distanceTo(b.mesh.position) < 2.5) {
            this.damageEnemy(enemy, b.damage);
            hit = true;
            if (!b.isPiercing) break;
          }
        }

        // Hit Boss
        if (this.bossActive && this.bossGroup && this.bossGroup.position.distanceTo(b.mesh.position) < 5.0) {
          this.damageBoss(b.damage);
          hit = true;
        }
      } else {
        // Enemy bullet hit player
        if (this.playerGroup.position.distanceTo(b.mesh.position) < 2.2) {
          this.damagePlayer(b.damage);
          hit = true;
        }
      }

      if (hit && !b.isPiercing) {
        this.spawnExplosion(b.mesh.position, false);
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.lifetime >= b.maxLifetime) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }

  private damageEnemy(enemy: AIEnemy, damage: number) {
    enemy.health -= damage;
    soundManager.playHit();

    // Damage flash
    this.spawnSparks(enemy.mesh.position);

    if (enemy.health <= 0) {
      enemy.active = false;
      this.kills++;
      this.comboStreak++;
      this.comboTimer = 3.5;

      soundManager.playExplosion(enemy.type === 'heavy' || enemy.type === 'vip');
      this.cameraShakeIntensity = 0.4;
      this.spawnExplosion(enemy.mesh.position, true);

      // Drop coins & pickups
      this.envManager.spawnPickup('coin', enemy.mesh.position.clone());
      if (Math.random() > 0.65) {
        const bonusType = this.mission.type === 'fuel_rush' ? 'fuel' : Math.random() > 0.5 ? 'health' : 'nitro';
        this.envManager.spawnPickup(bonusType, new THREE.Vector3(enemy.mesh.position.x + (Math.random() - 0.5) * 2, 1, enemy.mesh.position.z));
      }

      this.scene.remove(enemy.mesh);
    }
  }

  private damageBoss(damage: number) {
    this.bossHealth -= damage;
    soundManager.playHit();
    this.spawnSparks(this.bossGroup!.position);

    if (this.bossHealth <= 0) {
      this.bossHealth = 0;
      this.bossActive = false;
      this.kills++;
      soundManager.playExplosion(true);
      this.cameraShakeIntensity = 1.0;
      this.spawnExplosion(this.bossGroup!.position, true);
      this.scene.remove(this.bossGroup!);
      this.triggerVictory('TRÙM BỊ TIÊU DIỆT HOÀN TOÀN!');
    }
  }

  private damagePlayer(amount: number) {
    soundManager.playHit();
    this.cameraShakeIntensity = 0.5;

    // Armor absorption
    const armorReduction = this.playerArmor / 100;
    const finalDamage = Math.max(2, amount * (1 - armorReduction));

    // Shield takes damage first
    if (this.playerArmor > 0) {
      this.playerArmor = Math.max(0, this.playerArmor - amount * 0.5);
    }

    this.playerHealth = Math.max(0, this.playerHealth - finalDamage);

    if (this.playerHealth <= 0) {
      this.playerHealth = 0;
      soundManager.playExplosion(true);
      this.spawnExplosion(this.playerGroup.position, true);
      this.triggerDefeat('Xe của bạn đã bị phá hủy!');
    }
  }

  private updateEnemies(dt: number) {
    // Spawning new enemies ahead of player if count low
    const activeCount = this.enemies.filter((e) => e.active).length;
    if (activeCount < 4 && !this.bossActive) {
      this.spawnEnemy(this.playerZ + 80 + Math.random() * 50);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.active) {
        this.enemies.splice(i, 1);
        continue;
      }

      // Enemy AI speed & movement
      const laneWidth = 5.5;
      const targetX = e.targetLaneX;
      e.mesh.position.x += (targetX - e.mesh.position.x) * dt * 2;

      // Kamikaze drone accelerates toward player
      if (e.type === 'kamikaze') {
        const toPlayerX = this.playerX - e.mesh.position.x;
        e.mesh.position.x += Math.sign(toPlayerX) * dt * 7;
        e.mesh.position.z -= (e.speed + 15) * dt;

        // Suicide Ram
        if (e.mesh.position.distanceTo(this.playerGroup.position) < 2.5) {
          this.damagePlayer(50);
          this.damageEnemy(e, 999);
        }
      } else {
        // Forward progression along highway
        e.mesh.position.z += (e.speed) * dt;

        // Enemy shooting
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0 && e.mesh.position.z > this.playerZ && e.mesh.position.z < this.playerZ + 60) {
          this.enemyShoot(e);
          e.shootCooldown = 2.0 + Math.random() * 2.5;
        }

        // Random lane change
        if (Math.random() < 0.008) {
          e.targetLaneX = (Math.floor(Math.random() * 4) - 1.5) * laneWidth;
        }
      }

      // Remove enemies far behind player
      if (e.mesh.position.z < this.playerZ - 40) {
        e.active = false;
        this.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
      }
    }
  }

  private spawnEnemy(zPos: number) {
    const laneWidth = 5.5;
    const laneIndex = Math.floor(Math.random() * 4) - 1.5;
    const xPos = laneIndex * laneWidth;

    const types: AIEnemy['type'][] = ['patrol', 'buggy', 'heavy'];
    if (this.mission.zoneIndex >= 1 && Math.random() > 0.7) {
      types.push('kamikaze');
    }
    const type = types[Math.floor(Math.random() * types.length)];

    const { root, wheels } = buildEnemyVehicleMesh(type);
    root.position.set(xPos, 0, zPos);
    this.scene.add(root);

    const hpMap = { patrol: 80, buggy: 60, heavy: 220, kamikaze: 45, vip: 350, convoy_unit: 400 };

    this.enemies.push({
      mesh: root,
      wheels,
      type,
      health: hpMap[type],
      maxHealth: hpMap[type],
      speed: 25 + Math.random() * 15,
      targetLaneX: xPos,
      shootCooldown: 1.5 + Math.random() * 2,
      active: true,
    });
  }

  private enemyShoot(enemy: AIEnemy) {
    const bulletGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    bullet.position.set(enemy.mesh.position.x, 0.8, enemy.mesh.position.z - 2.0);
    this.scene.add(bullet);

    this.bullets.push({
      mesh: bullet,
      velocity: new THREE.Vector3(0, 0, -95),
      damage: 18,
      isPlayer: false,
      lifetime: 0,
      maxLifetime: 1.5,
    });
  }

  private updateBoss(dt: number) {
    if (!this.bossGroup) return;

    // Boss maintains distance ahead of player
    const desiredZ = this.playerZ + 35;
    this.bossGroup.position.z += (desiredZ - this.bossGroup.position.z) * dt * 3;

    // Boss weaves across lanes
    this.bossGroup.position.x = Math.sin(this.elapsedTime * 0.8) * 7.5;

    // Boss attacks
    this.bossAttackCooldown -= dt;
    if (this.bossAttackCooldown <= 0) {
      this.executeBossAttack();
      this.bossAttackCooldown = 2.8;
    }
  }

  private executeBossAttack() {
    if (!this.bossGroup) return;
    const bPos = this.bossGroup.position;

    // Boss fires dual rear cannons or flame bursts
    [-1.2, 1.2].forEach((offsetX) => {
      const shot = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      shot.position.set(bPos.x + offsetX, 1.2, bPos.z - 3.0);
      this.scene.add(shot);

      this.bullets.push({
        mesh: shot,
        velocity: new THREE.Vector3((this.playerX - (bPos.x + offsetX)) * 1.5, 0, -110),
        damage: 32,
        isPlayer: false,
        lifetime: 0,
        maxLifetime: 1.6,
      });
    });
  }

  private updatePickups() {
    for (const p of this.envManager.pickups) {
      if (p.active && p.position.distanceTo(this.playerGroup.position) < 2.8) {
        this.envManager.removePickup(p);

        if (p.type === 'coin') {
          soundManager.playCoin();
          this.callbacks.onHUDUpdate({} as GameHUDState); // trigger HUD flash
        } else if (p.type === 'health') {
          soundManager.playCoin();
          this.playerHealth = Math.min(this.maxHealth, this.playerHealth + 65);
        } else if (p.type === 'fuel') {
          soundManager.playCoin();
          this.fuelAmount = Math.min(this.maxFuel, this.fuelAmount + 35);
        } else if (p.type === 'nitro') {
          soundManager.playCoin();
          this.nitroAmount = this.maxNitro;
        }
      }
    }
  }

  private checkVictoryConditions() {
    if (this.isGameOver) return;

    if (this.mission.type === 'kill_target' && this.kills >= this.mission.targetCount) {
      this.triggerVictory(`Đã tiêu diệt đủ ${this.mission.targetCount} mục tiêu!`);
    } else if (this.mission.type === 'time_trial' && this.playerZ > 2400) {
      this.triggerVictory('Đã cán đích thành công đúng giờ!');
    } else if (this.mission.type === 'vip_assassination' && this.kills >= this.mission.targetCount) {
      this.triggerVictory('Mục tiêu VIP đã bị hạ gục!');
    } else if (this.mission.type === 'convoy_raid' && this.kills >= this.mission.targetCount) {
      this.triggerVictory('Đoàn xe vận tải đã bị triệt phá hoàn toàn!');
    } else if (this.mission.type === 'pursuit_escape' && this.playerZ > 2800) {
      this.triggerVictory('Đã thoát khỏi vòng vây truy đuổi!');
    } else if (this.mission.type === 'fuel_rush' && this.playerZ > 2500) {
      this.triggerVictory('Đã hoàn thành đường đua trước khi cạn xăng!');
    } else if (this.mission.type === 'escort' && this.playerZ > 2600) {
      this.triggerVictory('Đã hộ tống xe đồng minh về căn cứ an toàn!');
    }
  }

  private triggerVictory(reason: string) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    soundManager.stopEngine();
    soundManager.playVictory();

    // Calculate stars
    let stars = 1;
    if (this.elapsedTime < this.timeLimit * 0.75) stars++;
    if (this.playerHealth >= this.maxHealth * 0.5) stars++;

    // Rewards
    const baseCoins = this.mission.rewardCoins;
    const killBonus = this.kills * 40;
    const healthBonus = Math.round((this.playerHealth / this.maxHealth) * 200);
    const totalCoins = baseCoins + killBonus + healthBonus;

    this.callbacks.onMissionComplete({
      victory: true,
      reason,
      coinsEarned: totalCoins,
      xpEarned: this.mission.rewardXp,
      kills: this.kills,
      timeTaken: Math.round(this.elapsedTime),
      stars,
    });
  }

  private triggerDefeat(reason: string) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    soundManager.stopEngine();
    soundManager.playDefeat();

    this.callbacks.onMissionComplete({
      victory: false,
      reason,
      coinsEarned: Math.round(this.kills * 20),
      xpEarned: 50,
      kills: this.kills,
      timeTaken: Math.round(this.elapsedTime),
      stars: 0,
    });
  }

  // Particle systems
  private spawnNitroParticles() {
    for (let i = 0; i < 2; i++) {
      const pGeo = new THREE.SphereGeometry(0.12, 4, 4);
      const pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x06b6d4 : 0x38bdf8 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(this.playerX + (Math.random() - 0.5) * 0.6, 0.4, this.playerZ - 1.8);
      this.scene.add(p);

      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1, -40),
        lifetime: 0,
        maxLifetime: 0.25,
        fade: true,
      });
    }
  }

  private spawnDriftParticles() {
    const pGeo = new THREE.SphereGeometry(0.2, 4, 4);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 });
    const p = new THREE.Mesh(pGeo, pMat);
    p.position.set(this.playerX + (Math.random() - 0.5) * 1.5, 0.2, this.playerZ - 1.2);
    this.scene.add(p);

    this.particles.push({
      mesh: p,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, -15),
      lifetime: 0,
      maxLifetime: 0.4,
      fade: true,
    });
  }

  private spawnSparks(pos: THREE.Vector3) {
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      p.position.copy(pos);
      this.scene.add(p);

      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 15, Math.random() * 10, (Math.random() - 0.5) * 15),
        lifetime: 0,
        maxLifetime: 0.3,
        fade: true,
      });
    }
  }

  private spawnExplosion(pos: THREE.Vector3, isLarge: boolean) {
    const count = isLarge ? 28 : 12;
    for (let i = 0; i < count; i++) {
      const colors = [0xef4444, 0xf97316, 0xf59e0b, 0x1f2937];
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(isLarge ? 0.35 : 0.18, 5, 5),
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
      );
      p.position.copy(pos);
      this.scene.add(p);

      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * (isLarge ? 28 : 16),
          Math.random() * (isLarge ? 22 : 12),
          (Math.random() - 0.5) * (isLarge ? 28 : 16)
        ),
        lifetime: 0,
        maxLifetime: isLarge ? 0.8 : 0.45,
        fade: true,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime += dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      if (p.lifetime >= p.maxLifetime) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    cancelAnimationFrame(this.animationFrameId);
    soundManager.stopEngine();

    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    this.container.removeEventListener('contextmenu', this.onContextMenuBound);

    for (const b of this.bullets) this.scene.remove(b.mesh);
    for (const p of this.particles) this.scene.remove(p.mesh);
    for (const e of this.enemies) this.scene.remove(e.mesh);
    if (this.bossGroup) this.scene.remove(this.bossGroup);
    if (this.escortMesh) this.scene.remove(this.escortMesh);

    this.envManager.cleanup();
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}
