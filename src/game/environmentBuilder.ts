import * as THREE from 'three';
import { ZoneTheme } from '../types/game';

export interface WorldPickup {
  mesh: THREE.Group;
  type: 'coin' | 'health' | 'fuel' | 'nitro';
  active: boolean;
  position: THREE.Vector3;
}

export class EnvironmentManager {
  public scene: THREE.Scene;
  public theme: ZoneTheme;
  private roadChunks: THREE.Group[] = [];
  private sceneryProps: THREE.Group[] = [];
  public pickups: WorldPickup[] = [];
  private roadWidth = 24;
  private chunkLength = 100;
  private numChunks = 5;

  constructor(scene: THREE.Scene, theme: ZoneTheme) {
    this.scene = scene;
    this.theme = theme;
    this.setupLighting();
    this.createRoadChunks();
  }

  private setupLighting() {
    let hemiSky = 0xffedd5;
    let hemiGround = 0x78350f;
    let dirColor = 0xfef08a;

    switch (this.theme) {
      case 'neon':
        hemiSky = 0x38bdf8;
        hemiGround = 0x0f172a;
        dirColor = 0xa855f7;
        break;
      case 'industrial':
        hemiSky = 0xf97316;
        hemiGround = 0x292524;
        dirColor = 0xfb923c;
        break;
      case 'military':
        hemiSky = 0x86efac;
        hemiGround = 0x052e16;
        dirColor = 0x22c55e;
        break;
      case 'desert':
      default:
        break;
    }

    const hemiLight = new THREE.HemisphereLight(hemiSky, hemiGround, 0.7);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(dirColor, 1.2);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Subtle atmospheric fog
    let fogColor = 0xb45309;
    if (this.theme === 'neon') fogColor = 0x090d16;
    if (this.theme === 'industrial') fogColor = 0x2d170a;
    if (this.theme === 'military') fogColor = 0x071e16;

    this.scene.fog = new THREE.FogExp2(fogColor, 0.007);
    this.scene.background = new THREE.Color(fogColor);
  }

  private createRoadChunks() {
    for (let i = 0; i < this.numChunks; i++) {
      const chunk = this.createChunk(i * this.chunkLength);
      this.roadChunks.push(chunk);
      this.scene.add(chunk);
    }
  }

  private createChunk(zPos: number): THREE.Group {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    // Road surface
    let roadMatColor = 0x1f2937;
    if (this.theme === 'neon') roadMatColor = 0x111827;
    if (this.theme === 'industrial') roadMatColor = 0x27272a;

    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: roadMatColor,
      roughness: 0.8,
      metalness: 0.2,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.receiveShadow = true;
    chunk.add(road);

    // Lane dashes (3 divider lines for 4 lanes)
    const laneWidth = this.roadWidth / 4;
    [-laneWidth, 0, laneWidth].forEach((x) => {
      const dashGeo = new THREE.PlaneGeometry(0.3, this.chunkLength);
      dashGeo.rotateX(-Math.PI / 2);
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xf3f4f6 });
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(x, 0.01, 0);
      chunk.add(dash);
    });

    // Guardrails / barriers
    const railGeo = new THREE.BoxGeometry(0.6, 0.9, this.chunkLength);
    const railMat = new THREE.MeshStandardMaterial({
      color: this.theme === 'neon' ? 0x06b6d4 : 0x64748b,
      metalness: 0.6,
      roughness: 0.4,
    });

    const railLeft = new THREE.Mesh(railGeo, railMat);
    railLeft.position.set(-this.roadWidth / 2 - 0.3, 0.45, 0);
    const railRight = new THREE.Mesh(railGeo, railMat);
    railRight.position.set(this.roadWidth / 2 + 0.3, 0.45, 0);
    chunk.add(railLeft);
    chunk.add(railRight);

    // Outer terrain ground
    let terrainColor = 0x92400e;
    if (this.theme === 'neon') terrainColor = 0x030712;
    if (this.theme === 'industrial') terrainColor = 0x1c1917;
    if (this.theme === 'military') terrainColor = 0x14532d;

    const terrainGeo = new THREE.PlaneGeometry(160, this.chunkLength);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({ color: terrainColor, roughness: 1.0 });
    const leftTerrain = new THREE.Mesh(terrainGeo, terrainMat);
    leftTerrain.position.set(-this.roadWidth / 2 - 80, -0.05, 0);
    const rightTerrain = new THREE.Mesh(terrainGeo, terrainMat);
    rightTerrain.position.set(this.roadWidth / 2 + 80, -0.05, 0);
    chunk.add(leftTerrain);
    chunk.add(rightTerrain);

    // Theme-specific roadside scenery
    this.addThemedScenery(chunk);

    return chunk;
  }

  private addThemedScenery(chunk: THREE.Group) {
    switch (this.theme) {
      case 'desert': {
        // Red rock pillars and cacti
        for (let i = 0; i < 4; i++) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const rockX = side * (this.roadWidth / 2 + 12 + Math.random() * 25);
          const rockZ = (Math.random() - 0.5) * (this.chunkLength - 10);
          const rockH = 8 + Math.random() * 16;
          const rockGeo = new THREE.CylinderGeometry(2 + Math.random() * 4, 4 + Math.random() * 4, rockH, 6);
          const rockMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.position.set(rockX, rockH / 2, rockZ);
          chunk.add(rock);
        }
        break;
      }

      case 'neon': {
        // Futuristic skyscrapers with glowing windows
        for (let i = 0; i < 6; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const bldgX = side * (this.roadWidth / 2 + 10 + (i % 3) * 14);
          const bldgZ = -this.chunkLength / 2 + i * 16;
          const bldgH = 25 + Math.random() * 40;
          const bldgW = 10 + Math.random() * 8;
          const bldgGeo = new THREE.BoxGeometry(bldgW, bldgH, bldgW);
          const bldgMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.3, metalness: 0.8 });
          const bldg = new THREE.Mesh(bldgGeo, bldgMat);
          bldg.position.set(bldgX, bldgH / 2, bldgZ);
          chunk.add(bldg);

          // Neon holographic billboard strip
          const neonColors = [0x06b6d4, 0xec4899, 0xa855f7, 0x3b82f6];
          const bannerMat = new THREE.MeshBasicMaterial({ color: neonColors[i % neonColors.length] });
          const banner = new THREE.Mesh(new THREE.PlaneGeometry(6, 12), bannerMat);
          banner.position.set(side * (this.roadWidth / 2 + 4.5), 14, bldgZ);
          banner.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          chunk.add(banner);
        }
        break;
      }

      case 'industrial': {
        // Chemical refinery tanks & pipelines
        for (let i = 0; i < 4; i++) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const tankX = side * (this.roadWidth / 2 + 10 + Math.random() * 15);
          const tankZ = (Math.random() - 0.5) * (this.chunkLength - 15);
          const tankGeo = new THREE.CylinderGeometry(4, 4, 14, 12);
          const tankMat = new THREE.MeshStandardMaterial({ color: 0x57534e, metalness: 0.7, roughness: 0.4 });
          const tank = new THREE.Mesh(tankGeo, tankMat);
          tank.position.set(tankX, 7, tankZ);
          chunk.add(tank);

          // Chimney with fiery flare tip
          const flameGeo = new THREE.ConeGeometry(1.2, 3, 6);
          const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
          const flame = new THREE.Mesh(flameGeo, flameMat);
          flame.position.set(tankX, 15.5, tankZ);
          chunk.add(flame);
        }
        break;
      }

      case 'military': {
        // Concrete bunkers and radar towers
        for (let i = 0; i < 3; i++) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const bunkX = side * (this.roadWidth / 2 + 12);
          const bunkZ = (Math.random() - 0.5) * (this.chunkLength - 20);
          const bunkGeo = new THREE.BoxGeometry(8, 4, 8);
          const bunkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
          const bunk = new THREE.Mesh(bunkGeo, bunkMat);
          bunk.position.set(bunkX, 2, bunkZ);
          chunk.add(bunk);

          // Radar dish
          const dishGeo = new THREE.CylinderGeometry(2, 0.2, 0.4, 12);
          dishGeo.rotateZ(Math.PI / 4);
          const dish = new THREE.Mesh(dishGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }));
          dish.position.set(bunkX, 5, bunkZ);
          chunk.add(dish);
        }
        break;
      }
    }
  }

  public update(playerZ: number) {
    // Check if player moved forward past the earliest chunk
    const halfSpan = (this.numChunks * this.chunkLength) / 2;
    for (const chunk of this.roadChunks) {
      if (chunk.position.z < playerZ - this.chunkLength * 1.5) {
        // Move chunk forward to front of the chain
        let maxZ = -Infinity;
        for (const c of this.roadChunks) {
          if (c.position.z > maxZ) maxZ = c.position.z;
        }
        chunk.position.z = maxZ + this.chunkLength;
      }
    }

    // Spin pickups
    for (const p of this.pickups) {
      if (p.active) {
        p.mesh.rotation.y += 0.04;
        p.mesh.position.y = 1.0 + Math.sin(Date.now() * 0.005) * 0.2;
      }
    }
  }

  public spawnPickup(type: 'coin' | 'health' | 'fuel' | 'nitro', pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    let matColor = 0xf59e0b;
    let geo: THREE.BufferGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 12);
    geo.rotateX(Math.PI / 2);

    if (type === 'health') {
      matColor = 0x22c55e;
      geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    } else if (type === 'fuel') {
      matColor = 0xef4444;
      geo = new THREE.CylinderGeometry(0.4, 0.4, 1.0, 8);
    } else if (type === 'nitro') {
      matColor = 0x06b6d4;
      geo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 8);
    }

    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: matColor, wireframe: false }));
    group.add(mesh);

    // Glowing halo
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.1, 16), new THREE.MeshBasicMaterial({ color: matColor, side: THREE.DoubleSide }));
    halo.rotateX(Math.PI / 2);
    group.add(halo);

    this.scene.add(group);
    this.pickups.push({ mesh: group, type, active: true, position: group.position });
  }

  public removePickup(pickup: WorldPickup) {
    pickup.active = false;
    this.scene.remove(pickup.mesh);
  }

  public cleanup() {
    for (const chunk of this.roadChunks) {
      this.scene.remove(chunk);
    }
    for (const p of this.pickups) {
      this.scene.remove(p.mesh);
    }
    this.pickups = [];
    this.roadChunks = [];
  }
}
