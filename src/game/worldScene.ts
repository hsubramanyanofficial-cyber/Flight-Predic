/**
 * Procedural 3D Flight Corridor World & Game Scene
 * - Studio PBR Lighting, ACESFilmicToneMapping, RoomEnvironment
 * - Software-WebGL detection guard
 * - Collectible Fare-Saver Rings, ML Prediction Orbs, Turbulence Hazards
 * - Destination Airport Runway with Approach Lighting System
 * - Zero external 404 texture dependencies
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface GameItem {
  id: string;
  type: 'ring' | 'prediction' | 'hazard';
  group: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  value: number;
  collected: boolean;
  label?: string;
}

export interface WorldConfig {
  corridorLength: number; // e.g. 3500
  corridorWidth: number;  // e.g. 300
  fogColor: number;
  skyColor: number;
}

export const DEFAULT_WORLD_CONFIG: WorldConfig = {
  corridorLength: 3500,
  corridorWidth: 320,
  fogColor: 0x091428,
  skyColor: 0x050c18,
};

/**
 * Detects software WebGL renderer (SwiftShader, llvmpipe)
 */
export function checkIsSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * Procedural Runway Markings Texture
 */
function createRunwayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 1024);

  // Runway threshold stripes (piano keys)
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(80 + i * 45, 40, 25, 140);
  }

  // Runway number e.g. "27R"
  ctx.font = 'bold 72px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('27R', 256, 260);

  // Centerline dashed stripes
  for (let y = 320; y < 1024; y += 120) {
    ctx.fillRect(246, y, 20, 60);
  }

  // Touchdown aiming point bars
  ctx.fillRect(100, 480, 50, 160);
  ctx.fillRect(362, 480, 50, 160);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  return tex;
}

export class WorldScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public isSoftwareGl: boolean;
  public items: GameItem[] = [];
  public clouds: THREE.InstancedMesh | null = null;
  public runwayMesh: THREE.Mesh | null = null;
  public destinationZ: number;

  private keyLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;

  constructor(container: HTMLElement, config: WorldConfig = DEFAULT_WORLD_CONFIG) {
    this.isSoftwareGl = checkIsSoftwareGl();

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.skyColor);
    this.scene.fog = new THREE.FogExp2(config.fogColor, 0.0012);

    // 2. Camera Setup (Perspective Flight Camera)
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.5, 4000);
    this.camera.position.set(0, 8, 18);
    this.camera.lookAt(0, 0, -40);

    // 3. Renderer with PBR Pipeline
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Reflection via RoomEnvironment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {}

    // 5. Studio Lighting Rig (Warm Key + Cool Hemisphere Fill)
    this.setupLighting();

    // 6. Build World Elements (Terrain, Clouds, Runway, Corridors)
    this.destinationZ = -config.corridorLength;
    this.buildTerrain(config);
    this.buildClouds();
    this.buildRunway(this.destinationZ);
    this.spawnCorridorItems(config);
  }

  private setupLighting() {
    // Cool Hemisphere fill light (sky vs ground)
    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 1.2);
    this.scene.add(this.hemiLight);

    // Warm Directional Sun Key light
    this.keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    this.keyLight.position.set(120, 250, 180);
    this.keyLight.castShadow = !this.isSoftwareGl;

    if (!this.isSoftwareGl) {
      this.keyLight.shadow.mapSize.width = 2048;
      this.keyLight.shadow.mapSize.height = 2048;
      this.keyLight.shadow.camera.near = 10;
      this.keyLight.shadow.camera.far = 800;
      const d = 40;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);
  }

  private buildTerrain(config: WorldConfig) {
    // Endless ocean / low ground plane
    const terrainGeom = new THREE.PlaneGeometry(1600, config.corridorLength + 1000, 32, 64);
    terrainGeom.rotateX(-Math.PI / 2);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x0b192c,
      roughness: 0.6,
      metalness: 0.2,
    });

    const terrain = new THREE.Mesh(terrainGeom, terrainMat);
    terrain.position.set(0, -60, -config.corridorLength / 2);
    terrain.receiveShadow = !this.isSoftwareGl;
    this.scene.add(terrain);

    // Mountain ridges on perimeter for natural outdoor boundaries (no boxing void)
    const ridgeGeom = new THREE.ConeGeometry(180, 240, 5);
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x0f2942,
      roughness: 0.85,
      metalness: 0.1,
    });

    for (let z = 200; z > -config.corridorLength - 400; z -= 300) {
      // Left mountain ridge
      const leftMtn = new THREE.Mesh(ridgeGeom, ridgeMat);
      leftMtn.position.set(-config.corridorWidth - 140 - Math.random() * 80, 40, z);
      leftMtn.scale.set(1 + Math.random() * 0.4, 0.8 + Math.random() * 0.5, 1 + Math.random() * 0.4);
      this.scene.add(leftMtn);

      // Right mountain ridge
      const rightMtn = new THREE.Mesh(ridgeGeom, ridgeMat);
      rightMtn.position.set(config.corridorWidth + 140 + Math.random() * 80, 40, z);
      rightMtn.scale.set(1 + Math.random() * 0.4, 0.8 + Math.random() * 0.5, 1 + Math.random() * 0.4);
      this.scene.add(rightMtn);
    }
  }

  private buildClouds() {
    // InstancedMesh for soft atmospheric cloud billows
    const cloudGeom = new THREE.DodecahedronGeometry(18, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.75,
    });

    const cloudCount = 60;
    this.clouds = new THREE.InstancedMesh(cloudGeom, cloudMat, cloudCount);
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const rot = new THREE.Euler();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < cloudCount; i++) {
      pos.set(
        (Math.random() - 0.5) * 550,
        -15 + (Math.random() - 0.5) * 50,
        -Math.random() * 3200
      );
      rot.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      quat.setFromEuler(rot);
      scale.set(1 + Math.random() * 2, 0.6 + Math.random() * 0.8, 1 + Math.random() * 2.5);

      matrix.compose(pos, quat, scale);
      this.clouds.setMatrixAt(i, matrix);
    }

    this.clouds.instanceMatrix.needsUpdate = true;
    this.clouds.computeBoundingSphere();
    this.scene.add(this.clouds);
  }

  private buildRunway(targetZ: number) {
    const runwayWidth = 45;
    const runwayLength = 500;

    const runwayGeom = new THREE.PlaneGeometry(runwayWidth, runwayLength);
    runwayGeom.rotateX(-Math.PI / 2);

    const runwayMat = new THREE.MeshStandardMaterial({
      map: createRunwayTexture(),
      roughness: 0.4,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.runwayMesh = new THREE.Mesh(runwayGeom, runwayMat);
    this.runwayMesh.position.set(0, -35, targetZ + runwayLength / 2);
    this.runwayMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(this.runwayMesh);

    // Runway Approach Rabbit Strobe Lights
    const lightGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let z = 0; z < runwayLength; z += 40) {
      // Left edge light
      const lLight = new THREE.Mesh(lightGeom, whiteMat);
      lLight.position.set(-runwayWidth / 2 - 2, -34.5, targetZ + z);
      this.scene.add(lLight);

      // Right edge light
      const rLight = new THREE.Mesh(lightGeom, whiteMat);
      rLight.position.set(runwayWidth / 2 + 2, -34.5, targetZ + z);
      this.scene.add(rLight);
    }

    // Threshold green bar lights
    for (let x = -runwayWidth / 2; x <= runwayWidth / 2; x += 6) {
      const tLight = new THREE.Mesh(lightGeom, greenMat);
      tLight.position.set(x, -34.5, targetZ + runwayLength);
      this.scene.add(tLight);
    }
  }

  private spawnCorridorItems(config: WorldConfig) {
    // Materials
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
    });

    const orbCoreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
    });

    const orbRingMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });

    const stormMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.95,
      metalness: 0.1,
      emissive: 0xe11d48,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85,
    });

    const ringGeom = new THREE.TorusGeometry(5.2, 0.45, 12, 32);
    const orbCoreGeom = new THREE.OctahedronGeometry(2.2, 1);
    const orbRingGeom = new THREE.TorusGeometry(3.6, 0.15, 8, 24);
    const stormGeom = new THREE.DodecahedronGeometry(8.5, 1);

    // Procedural layout along flight corridor
    let currentZ = -120;
    const endZ = -config.corridorLength + 400;

    let idCounter = 0;

    while (currentZ > endZ) {
      const step = 65 + Math.random() * 45;
      currentZ -= step;

      const laneX = (Math.random() - 0.5) * 140;
      const laneY = 5 + (Math.random() - 0.5) * 35;
      const roll = Math.random();

      if (roll < 0.65) {
        // 1. Fare-Saver Gold Ring (+₹1,500 - ₹3,500)
        const group = new THREE.Group();
        const mesh = new THREE.Mesh(ringGeom, goldRingMat);
        group.add(mesh);
        group.position.set(laneX, laneY, currentZ);
        this.scene.add(group);

        this.items.push({
          id: `ring-${idCounter++}`,
          type: 'ring',
          group,
          position: group.position,
          radius: 5.5,
          value: Math.round(1500 + Math.random() * 2000),
          collected: false,
          label: 'Fare Saver',
        });
      } else if (roll < 0.85) {
        // 2. ML Price Prediction Orb (2x / 4x Multiplier & Jet Stream Boost)
        const group = new THREE.Group();
        const core = new THREE.Mesh(orbCoreGeom, orbCoreMat);
        const ring = new THREE.Mesh(orbRingGeom, orbRingMat);
        ring.rotation.x = Math.PI / 3;
        group.add(core);
        group.add(ring);
        group.position.set(laneX, laneY, currentZ);
        this.scene.add(group);

        const labels = ['BUY NOW', 'WAIT', 'FAIR PRICE'];
        const chosenLabel = labels[Math.floor(Math.random() * labels.length)];

        this.items.push({
          id: `pred-${idCounter++}`,
          type: 'prediction',
          group,
          position: group.position,
          radius: 4.0,
          value: 2,
          collected: false,
          label: chosenLabel,
        });
      } else {
        // 3. Severe Storm Hazard (Airspeed penalty & Shake)
        const group = new THREE.Group();
        const storm = new THREE.Mesh(stormGeom, stormMat);
        group.add(storm);
        group.position.set(laneX, laneY, currentZ);
        this.scene.add(group);

        this.items.push({
          id: `storm-${idCounter++}`,
          type: 'hazard',
          group,
          position: group.position,
          radius: 8.0,
          value: -1,
          collected: false,
          label: 'Turbulence Storm',
        });
      }
    }
  }

  /**
   * Animates items (spin rings, rotate orbs, pulse hazard lights)
   */
  public updateItems(delta: number) {
    this.items.forEach(item => {
      if (item.collected) return;
      if (item.type === 'ring') {
        item.group.rotation.z += delta * 1.5;
        item.group.rotation.y += delta * 0.4;
      } else if (item.type === 'prediction') {
        item.group.rotation.y += delta * 2.2;
        item.group.rotation.x += delta * 1.2;
      } else if (item.type === 'hazard') {
        item.group.rotation.z -= delta * 0.8;
      }
    });
  }

  public handleResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.renderer.dispose();
  }
}
