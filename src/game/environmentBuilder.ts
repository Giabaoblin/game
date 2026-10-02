import * as THREE from 'three';
import { ZoneTheme } from '../types/game';

export interface WorldPickup {
  mesh: THREE.Group;
  type: 'coin' | 'health' | 'fuel' | 'nitro';
  active: boolean;
  position: THREE.Vector3;
}

interface AnimatedProp {
  type: 'flame' | 'beacon' | 'searchlight' | 'smoke';
  mesh: THREE.Object3D;
  speed: number;
  initialRotation?: number;
  light?: THREE.PointLight;
}

export class EnvironmentManager {
  public scene: THREE.Scene;
  public theme: ZoneTheme;
  private roadChunks: THREE.Group[] = [];
  public pickups: WorldPickup[] = [];
  private animatedProps: AnimatedProp[] = [];

  private roadWidth = 24;
  private chunkLength = 120;
  private numChunks = 7; // 840m total draw distance
  private globalTime = 0;

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
    let fogColor = 0xb45309;
    let fogDensity = 0.0055;

    switch (this.theme) {
      case 'neon':
        hemiSky = 0x38bdf8;
        hemiGround = 0x090d16;
        dirColor = 0xc084fc;
        fogColor = 0x060913;
        fogDensity = 0.0065;
        break;
      case 'industrial':
        hemiSky = 0xf97316;
        hemiGround = 0x1c1917;
        dirColor = 0xfb923c;
        fogColor = 0x24140b;
        fogDensity = 0.007;
        break;
      case 'military':
        hemiSky = 0x86efac;
        hemiGround = 0x022c22;
        dirColor = 0x4ade80;
        fogColor = 0x051a14;
        fogDensity = 0.006;
        break;
      case 'desert':
      default:
        hemiSky = 0xfde68a;
        hemiGround = 0x451a03;
        dirColor = 0xfbbf24;
        fogColor = 0x854d0e;
        break;
    }

    const hemiLight = new THREE.HemisphereLight(hemiSky, hemiGround, 0.75);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(dirColor, 1.4);
    dirLight.position.set(50, 80, 40);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    this.scene.fog = new THREE.FogExp2(fogColor, fogDensity);
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

    // --- 1. TARMAC HIGHWAY SURFACE ---
    let roadMatColor = 0x1e242b;
    if (this.theme === 'neon') roadMatColor = 0x0f141c;
    if (this.theme === 'industrial') roadMatColor = 0x1c1917;
    if (this.theme === 'military') roadMatColor = 0x131f24;

    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: roadMatColor,
      roughness: 0.85,
      metalness: 0.25,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.receiveShadow = true;
    chunk.add(road);

    // Weathered Tire Skid Marks (Burnout tire marks on the road)
    for (let k = 0; k < 6; k++) {
      const skidLength = 8 + Math.random() * 15;
      const skidGeo = new THREE.PlaneGeometry(0.35, skidLength);
      skidGeo.rotateX(-Math.PI / 2);
      const skidMat = new THREE.MeshBasicMaterial({
        color: 0x0a0a0a,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3,
      });
      const skid = new THREE.Mesh(skidGeo, skidMat);
      const laneOffsets = [-6.5, -2.5, 2.5, 6.5];
      const laneX = laneOffsets[k % laneOffsets.length] + (Math.random() - 0.5) * 0.8;
      const skidZ = (Math.random() - 0.5) * (this.chunkLength - 20);
      skid.position.set(laneX, 0.005, skidZ);
      skid.rotation.y = (Math.random() - 0.5) * 0.08;
      chunk.add(skid);
    }

    // Lane Dashes (Weathered highway paint)
    const laneWidth = this.roadWidth / 4;
    [-laneWidth, 0, laneWidth].forEach((x) => {
      // Dashed lane marks every 6m
      const dashCount = Math.floor(this.chunkLength / 7);
      for (let d = 0; d < dashCount; d++) {
        const dashGeo = new THREE.PlaneGeometry(0.25, 3.8);
        dashGeo.rotateX(-Math.PI / 2);
        const dashMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set(x, 0.008, -this.chunkLength / 2 + d * 7 + 3.5);
        chunk.add(dash);
      }
    });

    // Red & White Racing Rumble Curbs along highway edges
    [-this.roadWidth / 2, this.roadWidth / 2].forEach((xEdge, edgeIdx) => {
      const curbSegments = Math.floor(this.chunkLength / 3);
      for (let c = 0; c < curbSegments; c++) {
        const curbColor = c % 2 === 0 ? 0xdc2626 : 0xf8fafc;
        const curbGeo = new THREE.BoxGeometry(0.6, 0.12, 2.9);
        const curbMat = new THREE.MeshStandardMaterial({ color: curbColor, roughness: 0.5 });
        const curb = new THREE.Mesh(curbGeo, curbMat);
        curb.position.set(xEdge, 0.06, -this.chunkLength / 2 + c * 3 + 1.5);
        chunk.add(curb);
      }
    });

    // Concrete Reinforced Jersey Barriers with Hazard Stripes
    const barrierGeo = new THREE.BoxGeometry(0.7, 0.95, this.chunkLength);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
      metalness: 0.2,
    });

    const barrierL = new THREE.Mesh(barrierGeo, barrierMat);
    barrierL.position.set(-this.roadWidth / 2 - 0.65, 0.48, 0);
    const barrierR = new THREE.Mesh(barrierGeo, barrierMat);
    barrierR.position.set(this.roadWidth / 2 + 0.65, 0.48, 0);
    chunk.add(barrierL);
    chunk.add(barrierR);

    // Hazard warning reflectors on barriers
    const reflectorSpacing = 15;
    for (let zRef = -this.chunkLength / 2 + 5; zRef < this.chunkLength / 2; zRef += reflectorSpacing) {
      [-this.roadWidth / 2 - 0.28, this.roadWidth / 2 + 0.28].forEach((xRef) => {
        const refGeo = new THREE.BoxGeometry(0.08, 0.16, 0.35);
        const refMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const ref = new THREE.Mesh(refGeo, refMat);
        ref.position.set(xRef, 0.75, zRef);
        chunk.add(ref);
      });
    }

    // --- 2. SURROUNDING TERRAIN ---
    let terrainColor = 0x78350f;
    if (this.theme === 'neon') terrainColor = 0x030712;
    if (this.theme === 'industrial') terrainColor = 0x1c1917;
    if (this.theme === 'military') terrainColor = 0x064e3b;

    const terrainGeo = new THREE.PlaneGeometry(240, this.chunkLength);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({ color: terrainColor, roughness: 1.0 });

    const leftTerrain = new THREE.Mesh(terrainGeo, terrainMat);
    leftTerrain.position.set(-this.roadWidth / 2 - 120, -0.05, 0);
    const rightTerrain = new THREE.Mesh(terrainGeo, terrainMat);
    rightTerrain.position.set(this.roadWidth / 2 + 120, -0.05, 0);
    chunk.add(leftTerrain);
    chunk.add(rightTerrain);

    // --- 3. OVERHEAD COMBAT GANTRIES (Every chunk has an overhead structure) ---
    this.addOverheadGantry(chunk);

    // --- 4. WAR DEFENSES & BURNING WRECKS ---
    this.addWarzoneProps(chunk);

    // --- 5. THEME-SPECIFIC LANDMARKS ---
    this.addThemedScenery(chunk);

    return chunk;
  }

  /**
   * Adds massive steel highway gantry with electronic combat warning sign and strobes
   */
  private addOverheadGantry(chunk: THREE.Group) {
    const gantry = new THREE.Group();
    const gantryZ = (Math.random() - 0.5) * 40;
    gantry.position.set(0, 0, gantryZ);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x57534e, metalness: 0.6, roughness: 0.6 });

    // Side Support Towers
    const towerH = 7.5;
    [-this.roadWidth / 2 - 2.5, this.roadWidth / 2 + 2.5].forEach((xSide) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.8, towerH, 0.8), metalMat);
      tower.position.set(xSide, towerH / 2, 0);
      gantry.add(tower);

      // Angled brace
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.35, towerH * 0.9, 0.35), rustMat);
      brace.position.set(xSide > 0 ? xSide + 0.9 : xSide - 0.9, towerH * 0.45, 0);
      brace.rotation.z = xSide > 0 ? -0.22 : 0.22;
      gantry.add(brace);
    });

    // Overhead Truss Bridge
    const spanW = this.roadWidth + 6.0;
    const truss = new THREE.Mesh(new THREE.BoxGeometry(spanW, 1.2, 1.4), metalMat);
    truss.position.set(0, towerH - 0.4, 0);
    gantry.add(truss);

    // Large Combat Warning Signboard in center
    const signW = 12.0;
    const signH = 2.0;
    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(signW, signH, 0.2), metalMat);
    signFrame.position.set(0, towerH - 0.4, 0.8);
    gantry.add(signFrame);

    let signTextCol = 0xf59e0b;
    let signBgCol = 0x0f172a;
    if (this.theme === 'neon') {
      signTextCol = 0x06b6d4;
      signBgCol = 0x1e1b4b;
    } else if (this.theme === 'military') {
      signTextCol = 0xef4444;
      signBgCol = 0x052e16;
    }

    const signFace = new THREE.Mesh(
      new THREE.PlaneGeometry(signW - 0.4, signH - 0.4),
      new THREE.MeshBasicMaterial({ color: signBgCol })
    );
    signFace.position.set(0, towerH - 0.4, 0.92);
    gantry.add(signFace);

    // Illuminated Electronic Stencil / LED Matrix Bar
    const ledStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(signW - 1.2, 0.5),
      new THREE.MeshBasicMaterial({ color: signTextCol })
    );
    ledStripe.position.set(0, towerH - 0.4, 0.93);
    gantry.add(ledStripe);

    // Flashing Hazard Strobe Beacons on Gantry
    [-signW / 2 - 0.5, signW / 2 + 0.5].forEach((bx) => {
      const beaconGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(bx, towerH + 0.5, 0.8);
      gantry.add(beacon);

      this.animatedProps.push({
        type: 'beacon',
        mesh: beacon,
        speed: 6.0,
      });
    });

    chunk.add(gantry);
  }

  /**
   * Adds burning car wrecks, anti-tank hedgehogs, sandbags, and burning fuel drums
   */
  private addWarzoneProps(chunk: THREE.Group) {
    // 1. Burning Vehicle Wrecks (1 or 2 wrecks on roadside)
    const wreckCount = 1 + Math.floor(Math.random() * 2);
    for (let w = 0; w < wreckCount; w++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const wreckX = side * (this.roadWidth / 2 + 3.5 + Math.random() * 3);
      const wreckZ = (Math.random() - 0.5) * (this.chunkLength - 25);

      const wreckGroup = new THREE.Group();
      wreckGroup.position.set(wreckX, 0, wreckZ);
      wreckGroup.rotation.y = Math.random() * Math.PI * 2;
      wreckGroup.rotation.z = (Math.random() - 0.5) * 0.4; // flipped / tilted

      // Charred, rusted chassis
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.85, 3.8),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.2 })
      );
      body.position.y = 0.5;
      wreckGroup.add(body);

      // Crumpled cabin roof
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.6, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 })
      );
      roof.position.set(0, 1.1, -0.3);
      wreckGroup.add(roof);

      // Missing or bent wheels
      const wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 8), new THREE.MeshBasicMaterial({ color: 0x09090b }));
      wheel1.rotateZ(Math.PI / 2);
      wheel1.position.set(-1.1, 0.38, 1.0);
      wreckGroup.add(wheel1);

      // Burning Fire Core
      const flameCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.7, 1.8, 6),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      flameCore.position.set(0, 1.4, 0);
      wreckGroup.add(flameCore);

      const innerFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 1.2, 5),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      innerFlame.position.set(0, 1.4, 0);
      wreckGroup.add(innerFlame);

      // Flickering orange fire point light
      const fireLight = new THREE.PointLight(0xf97316, 2.5, 18);
      fireLight.position.set(0, 2.0, 0);
      wreckGroup.add(fireLight);

      this.animatedProps.push({
        type: 'flame',
        mesh: flameCore,
        speed: 8.0,
        light: fireLight,
      });

      // Rising black smoke column
      const smokePuffs = new THREE.Group();
      for (let s = 0; s < 4; s++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(0.5 + s * 0.35, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 1.0, transparent: true, opacity: 0.7 - s * 0.12 })
        );
        puff.position.set((Math.random() - 0.5) * 0.5, 2.4 + s * 1.2, (Math.random() - 0.5) * 0.5);
        smokePuffs.add(puff);
      }
      wreckGroup.add(smokePuffs);

      chunk.add(wreckGroup);
    }

    // 2. Czech Hedgehogs (Anti-tank X-shaped steel beams)
    for (let h = 0; h < 3; h++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const hX = side * (this.roadWidth / 2 + 1.8 + Math.random() * 2);
      const hZ = (Math.random() - 0.5) * (this.chunkLength - 15);

      const hedgehog = new THREE.Group();
      hedgehog.position.set(hX, 0.6, hZ);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8, roughness: 0.5 });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.2), beamMat);
      b1.rotation.x = Math.PI / 4;
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.2), beamMat);
      b2.rotation.x = -Math.PI / 4;
      const b3 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.2), beamMat);
      b3.rotation.z = Math.PI / 4;
      hedgehog.add(b1, b2, b3);
      chunk.add(hedgehog);
    }

    // 3. Sandbag Bunkers with Barbed Wire
    const sbSide = Math.random() > 0.5 ? 1 : -1;
    const sbX = sbSide * (this.roadWidth / 2 + 4.0);
    const sbZ = (Math.random() - 0.5) * 60;
    const bunker = new THREE.Group();
    bunker.position.set(sbX, 0, sbZ);

    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
    for (let layer = 0; layer < 3; layer++) {
      for (let block = -2; block <= 2; block++) {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 0.6), sandbagMat);
        bag.position.set(block * 1.15, layer * 0.28 + 0.15, 0);
        bunker.add(bag);
      }
    }
    chunk.add(bunker);

    // 4. Burning Oil Drums along the verge
    for (let b = 0; b < 2; b++) {
      const bSide = b === 0 ? -1 : 1;
      const drumX = bSide * (this.roadWidth / 2 + 2.2);
      const drumZ = (Math.random() - 0.5) * (this.chunkLength - 20);

      const barrelGroup = new THREE.Group();
      barrelGroup.position.set(drumX, 0, drumZ);

      const drumMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10),
        new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.6, roughness: 0.4 })
      );
      drumMesh.position.y = 0.45;
      barrelGroup.add(drumMesh);

      const drumFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.9, 5),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      drumFlame.position.set(0, 1.2, 0);
      barrelGroup.add(drumFlame);

      const drumLight = new THREE.PointLight(0xf97316, 1.8, 12);
      drumLight.position.set(0, 1.4, 0);
      barrelGroup.add(drumLight);

      this.animatedProps.push({
        type: 'flame',
        mesh: drumFlame,
        speed: 10.0,
        light: drumLight,
      });

      chunk.add(barrelGroup);
    }
  }

  /**
   * Adds detailed theme-specific battlefield scenery
   */
  private addThemedScenery(chunk: THREE.Group) {
    switch (this.theme) {
      case 'desert': {
        // Wasteland Desert Highway:
        // Sand-blasted mesas, oil pumpjacks, weathered radio towers, rusted tanker trailers
        for (let i = 0; i < 4; i++) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const rockX = side * (this.roadWidth / 2 + 16 + Math.random() * 35);
          const rockZ = (Math.random() - 0.5) * (this.chunkLength - 10);
          const rockH = 14 + Math.random() * 24;
          const rockW = 6 + Math.random() * 12;

          const mesa = new THREE.Mesh(
            new THREE.CylinderGeometry(rockW * 0.7, rockW, rockH, 6),
            new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.95 })
          );
          mesa.position.set(rockX, rockH / 2, rockZ);
          chunk.add(mesa);
        }

        // Watchtower with searchlight
        const towerX = (Math.random() > 0.5 ? 1 : -1) * (this.roadWidth / 2 + 12);
        const towerZ = (Math.random() - 0.5) * 50;
        this.addWatchtower(chunk, towerX, towerZ);
        break;
      }

      case 'neon': {
        // Cyber City Siege:
        // Cyberpunk battlezone with towering skyscrapers, holographic ads, neon warning grids, broken skybridges
        for (let i = 0; i < 6; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const bldgX = side * (this.roadWidth / 2 + 14 + (i % 3) * 16);
          const bldgZ = -this.chunkLength / 2 + i * 20;
          const bldgH = 40 + Math.random() * 60;
          const bldgW = 14 + Math.random() * 8;

          const bldg = new THREE.Mesh(
            new THREE.BoxGeometry(bldgW, bldgH, bldgW),
            new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.85 })
          );
          bldg.position.set(bldgX, bldgH / 2, bldgZ);
          chunk.add(bldg);

          // Glowing holographic billboard
          const neonColors = [0x06b6d4, 0xec4899, 0xa855f7, 0xef4444];
          const bannerMat = new THREE.MeshBasicMaterial({ color: neonColors[i % neonColors.length] });
          const banner = new THREE.Mesh(new THREE.PlaneGeometry(8, 16), bannerMat);
          banner.position.set(side * (this.roadWidth / 2 + 6.5), 18, bldgZ);
          banner.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          chunk.add(banner);
        }

        // Overhead damaged skybridge
        const bridge = new THREE.Mesh(
          new THREE.BoxGeometry(this.roadWidth + 30, 2.5, 4.0),
          new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 })
        );
        bridge.position.set(0, 15, (Math.random() - 0.5) * 40);
        chunk.add(bridge);
        break;
      }

      case 'industrial': {
        // Refinery Sieges:
        // Massive chemical silos, flaming gas flues, acid pipelines crossing overhead
        for (let i = 0; i < 4; i++) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const tankX = side * (this.roadWidth / 2 + 14 + Math.random() * 18);
          const tankZ = (Math.random() - 0.5) * (this.chunkLength - 15);
          const tankH = 18;

          const silo = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, tankH, 12),
            new THREE.MeshStandardMaterial({ color: 0x44403c, metalness: 0.7, roughness: 0.4 })
          );
          silo.position.set(tankX, tankH / 2, tankZ);
          chunk.add(silo);

          // Chimney Flare Stack with billowing fire
          const stackH = 26;
          const stack = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1.2, stackH, 8),
            new THREE.MeshStandardMaterial({ color: 0x292524, metalness: 0.85 })
          );
          stack.position.set(tankX + 4, stackH / 2, tankZ + 3);
          chunk.add(stack);

          // Flaming Torch
          const flare = new THREE.Mesh(
            new THREE.ConeGeometry(1.8, 4.5, 6),
            new THREE.MeshBasicMaterial({ color: 0xf97316 })
          );
          flare.position.set(tankX + 4, stackH + 2.0, tankZ + 3);
          chunk.add(flare);

          const flareLight = new THREE.PointLight(0xf97316, 2.5, 30);
          flareLight.position.set(tankX + 4, stackH + 3.0, tankZ + 3);
          chunk.add(flareLight);

          this.animatedProps.push({
            type: 'flame',
            mesh: flare,
            speed: 7.0,
            light: flareLight,
          });
        }
        break;
      }

      case 'military': {
        // Military Base Redcon-1:
        // Concrete bunkers, missile silos with nuclear rockets, searchlight watchtowers, razor wire
        for (let i = 0; i < 3; i++) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const bunkerX = side * (this.roadWidth / 2 + 16);
          const bunkerZ = (Math.random() - 0.5) * (this.chunkLength - 20);

          // Heavy Concrete Pillbox
          const pillbox = new THREE.Mesh(
            new THREE.BoxGeometry(10, 4.5, 9),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
          );
          pillbox.position.set(bunkerX, 2.25, bunkerZ);
          chunk.add(pillbox);

          // Slit window with red interior glow
          const slit = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.4, 0.2), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
          slit.position.set(bunkerX, 3.2, bunkerZ + (side > 0 ? -4.51 : 4.51));
          chunk.add(slit);

          // Vertical ICBM Silo Tube with Rocket Tip
          const siloTube = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
          siloTube.position.set(bunkerX + (side > 0 ? 8 : -8), 1.5, bunkerZ);
          chunk.add(siloTube);

          const rocketNose = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.5, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
          rocketNose.position.set(bunkerX + (side > 0 ? 8 : -8), 4.5, bunkerZ);
          chunk.add(rocketNose);
        }

        // Military Searchlight Tower
        const tSide = Math.random() > 0.5 ? 1 : -1;
        this.addWatchtower(chunk, tSide * (this.roadWidth / 2 + 14), 0);
        break;
      }
    }
  }

  /**
   * Builds watchtower with sweeping searchlight beam
   */
  private addWatchtower(chunk: THREE.Group, x: number, z: number) {
    const tower = new THREE.Group();
    tower.position.set(x, 0, z);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });

    // 4 Corner Legs
    const legH = 14;
    [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, legH, 6), steelMat);
      leg.position.set(lx, legH / 2, lz);
      tower.add(leg);
    });

    // Cabin Platform
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 4.2), steelMat);
    cabin.position.set(0, legH + 1.3, 0);
    tower.add(cabin);

    // Searchlight projector with glowing beam
    const projector = new THREE.Group();
    projector.position.set(0, legH + 2.8, 0);

    const lightHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.55, 0.9, 10),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    lightHousing.rotateX(Math.PI / 3);
    projector.add(lightHousing);

    // Glowing beam cone
    const beamGeo = new THREE.ConeGeometry(6.0, 32, 12, 1, true);
    beamGeo.rotateX(Math.PI / 3);
    const beamMat = new THREE.MeshBasicMaterial({
      color: this.theme === 'neon' ? 0x06b6d4 : 0xfef08a,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, -12, 16);
    projector.add(beam);

    tower.add(projector);
    chunk.add(tower);

    this.animatedProps.push({
      type: 'searchlight',
      mesh: projector,
      speed: 1.2,
      initialRotation: Math.random() * Math.PI,
    });
  }

  /**
   * Recycles road chunks seamlessly and animates environmental props (fires, beacons, searchlights)
   */
  public update(playerZ: number, dt: number = 0.016) {
    this.globalTime += dt;

    // 1. Recycle road chunks when player drives forward
    for (const chunk of this.roadChunks) {
      if (chunk.position.z < playerZ - this.chunkLength * 1.5) {
        let maxZ = -Infinity;
        for (const c of this.roadChunks) {
          if (c.position.z > maxZ) maxZ = c.position.z;
        }
        chunk.position.z = maxZ + this.chunkLength;
      }
    }

    // 2. Animate Dynamic Warzone Props
    for (const prop of this.animatedProps) {
      if (prop.type === 'flame') {
        const flicker = 0.85 + Math.sin(this.globalTime * prop.speed + Math.random() * 0.5) * 0.25;
        prop.mesh.scale.set(flicker, 0.8 + flicker * 0.4, flicker);
        if (prop.light) {
          prop.light.intensity = 2.0 * flicker;
        }
      } else if (prop.type === 'beacon') {
        // Strobe flash
        const flash = Math.sin(this.globalTime * prop.speed);
        (prop.mesh as THREE.Mesh).visible = flash > 0;
      } else if (prop.type === 'searchlight') {
        // Sweeping spotlight
        const sweepAngle = Math.sin(this.globalTime * prop.speed + (prop.initialRotation || 0)) * 0.65;
        prop.mesh.rotation.y = sweepAngle;
      }
    }

    // 3. Spin Pickups with hover bobbing
    for (const p of this.pickups) {
      if (p.active) {
        p.mesh.rotation.y += dt * 3.0;
        p.mesh.position.y = 1.0 + Math.sin(this.globalTime * 3.5) * 0.22;
      }
    }
  }

  public spawnPickup(type: 'coin' | 'health' | 'fuel' | 'nitro', pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    let matColor = 0xf59e0b;
    let geo: THREE.BufferGeometry = new THREE.CylinderGeometry(0.65, 0.65, 0.18, 14);
    geo.rotateX(Math.PI / 2);

    if (type === 'health') {
      matColor = 0x22c55e;
      geo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    } else if (type === 'fuel') {
      matColor = 0xef4444;
      geo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 10);
    } else if (type === 'nitro') {
      matColor = 0x06b6d4;
      geo = new THREE.CylinderGeometry(0.38, 0.38, 1.2, 10);
    }

    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: matColor, wireframe: false }));
    group.add(mesh);

    // Glowing halo
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.2, 16),
      new THREE.MeshBasicMaterial({ color: matColor, side: THREE.DoubleSide })
    );
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
    this.animatedProps = [];
  }
}
