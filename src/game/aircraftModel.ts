/**
 * Composite Procedural 3D Aircraft Model for FPPS Skyway Express
 * Follows Three.js craft guidelines:
 * - 3–12 Part procedural hierarchy using THREE.Group
 * - Physical PBR materials with varied roughness/metalness
 * - Exploded-view separation support
 * - Zero external 404 texture dependencies (procedural CanvasTextures)
 */

import * as THREE from 'three';

export type AirlineLivery = 'indigo' | 'airindia' | 'emirates' | 'british' | 'singapore';

export interface LiveryConfig {
  id: AirlineLivery;
  name: string;
  primaryColor: number;   // Main fuselage / wing base
  accentColor: number;    // Tail fin / cheatline stripe
  engineColor: number;    // Turbofan nacelle
  metalColor: number;     // Intake lips / leading edge
  cockpitTint: number;    // Glass canopy
}

export const LIVERY_CONFIGS: Record<AirlineLivery, LiveryConfig> = {
  indigo: {
    id: 'indigo',
    name: 'IndiGo Express (Sky & Indigo)',
    primaryColor: 0xffffff,
    accentColor: 0x0a3c94,
    engineColor: 0x0a3c94,
    metalColor: 0xd6e4ff,
    cockpitTint: 0x1e3a8a
  },
  airindia: {
    id: 'airindia',
    name: 'Air India (Maharajah Gold & Crimson)',
    primaryColor: 0xfdfdfd,
    accentColor: 0xbe123c,
    engineColor: 0xd97706,
    metalColor: 0xfde68a,
    cockpitTint: 0x451a03
  },
  emirates: {
    id: 'emirates',
    name: 'Emirates (Desert Gold & Falcon Red)',
    primaryColor: 0xf8fafc,
    accentColor: 0xd90429,
    engineColor: 0xf8fafc,
    metalColor: 0xd4af37,
    cockpitTint: 0x0f172a
  },
  british: {
    id: 'british',
    name: 'British Airways (Royal Navy & Crimson)',
    primaryColor: 0xffffff,
    accentColor: 0x1e3a8a,
    engineColor: 0x1e3a8a,
    metalColor: 0x93c5fd,
    cockpitTint: 0x172554
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore Star (Midnight Navy & Gold)',
    primaryColor: 0xf1f5f9,
    accentColor: 0x091428,
    engineColor: 0xc4973b,
    metalColor: 0xfcd34d,
    cockpitTint: 0x0c4a6e
  }
};

/**
 * Creates a procedural cheatline livery texture
 */
function createLiveryTexture(primaryHex: number, accentHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const prim = `#${primaryHex.toString(16).padStart(6, '0')}`;
  const acc = `#${accentHex.toString(16).padStart(6, '0')}`;

  ctx.fillStyle = prim;
  ctx.fillRect(0, 0, 512, 128);

  // Dynamic sweeping cheatline stripe along windows
  ctx.fillStyle = acc;
  ctx.beginPath();
  ctx.moveTo(0, 72);
  ctx.lineTo(512, 60);
  ctx.lineTo(512, 78);
  ctx.lineTo(0, 88);
  ctx.closePath();
  ctx.fill();

  // Fine airline metallic pinstripe
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 89, 512, 3);

  // Cabin passenger windows row
  ctx.fillStyle = '#1e293b';
  for (let x = 120; x < 480; x += 18) {
    ctx.beginPath();
    ctx.roundRect(x, 50, 10, 14, 3);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Contact Shadow Texture
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 115);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export interface AircraftParts {
  rootGroup: THREE.Group;
  fuselage: THREE.Mesh;
  wings: THREE.Mesh;
  wingletLeft: THREE.Mesh;
  wingletRight: THREE.Mesh;
  verticalFin: THREE.Mesh;
  horizontalStabilizers: THREE.Mesh;
  engineLeft: THREE.Group;
  engineRight: THREE.Group;
  cockpitGlass: THREE.Mesh;
  beaconRed: THREE.Mesh;
  beaconGreen: THREE.Mesh;
  beaconWhite: THREE.Mesh;
  contactShadow: THREE.Mesh;
  afterburnerGlowLeft: THREE.Mesh;
  afterburnerGlowRight: THREE.Mesh;
  materials: {
    fuselageMat: THREE.MeshStandardMaterial;
    accentMat: THREE.MeshStandardMaterial;
    wingMat: THREE.MeshStandardMaterial;
    engineMat: THREE.MeshStandardMaterial;
    metalMat: THREE.MeshStandardMaterial;
    glassMat: THREE.MeshPhysicalMaterial;
    beaconRedMat: THREE.MeshBasicMaterial;
    beaconGreenMat: THREE.MeshBasicMaterial;
    afterburnerMat: THREE.MeshBasicMaterial;
  };
}

export class CompositeAircraft {
  public group: THREE.Group;
  public parts: AircraftParts;
  public currentLivery: AirlineLivery = 'indigo';

  constructor(livery: AirlineLivery = 'indigo') {
    this.group = new THREE.Group();
    this.currentLivery = livery;
    this.parts = this.buildAircraft(livery);
    this.group.add(this.parts.rootGroup);
  }

  private buildAircraft(liveryKey: AirlineLivery): AircraftParts {
    const root = new THREE.Group();
    root.name = 'AircraftComposite';
    const cfg = LIVERY_CONFIGS[liveryKey];

    // --- Procedural Materials with Varied PBR Physical Properties ---
    const liveryTex = createLiveryTexture(cfg.primaryColor, cfg.accentColor);

    const fuselageMat = new THREE.MeshStandardMaterial({
      color: cfg.primaryColor,
      map: liveryTex,
      roughness: 0.32,
      metalness: 0.18,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: cfg.accentColor,
      roughness: 0.28,
      metalness: 0.35,
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      roughness: 0.45,
      metalness: 0.12,
    });

    const engineMat = new THREE.MeshStandardMaterial({
      color: cfg.engineColor,
      roughness: 0.25,
      metalness: 0.5,
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: cfg.metalColor,
      roughness: 0.15,
      metalness: 0.92, // Anisotropic high metal look
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: cfg.cockpitTint,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      ior: 1.52,
    });

    const beaconRedMat = new THREE.MeshBasicMaterial({ color: 0xff1e56 });
    const beaconGreenMat = new THREE.MeshBasicMaterial({ color: 0x00f59b });
    const beaconWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const afterburnerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
    });

    // 1. Primary Silhouette: Fuselage with Aerodynamic Tapering
    const fuselageCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -4.8), // Nose tip
      new THREE.Vector3(0, 0.1, -4.0), // Nose radome
      new THREE.Vector3(0, 0.25, -2.5), // Cockpit cabin
      new THREE.Vector3(0, 0.25, 0),    // Mid fuselage
      new THREE.Vector3(0, 0.22, 2.5),  // Rear passenger zone
      new THREE.Vector3(0, 0.35, 4.6),  // Tail cone apex
    ]);

    // Fuselage tube extrusion
    const fuselageGeom = new THREE.TubeGeometry(fuselageCurve, 32, 0.72, 16, false);
    const fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    fuselage.name = 'Fuselage';
    root.add(fuselage);

    // 2. Cockpit Canopy Glass Dome
    const cockpitGeom = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
    cockpitGeom.scale(1.0, 0.65, 1.8);
    const cockpitGlass = new THREE.Mesh(cockpitGeom, glassMat);
    cockpitGlass.position.set(0, 0.72, -2.4);
    cockpitGlass.rotation.x = -0.12;
    cockpitGlass.name = 'CockpitGlass';
    root.add(cockpitGlass);

    // 3. Swept Main Wings (High-aspect ratio with dihedral angle)
    const wingShape = new THREE.Shape();
    // Center root to tip swept wing profile
    wingShape.moveTo(0, -1.2);
    wingShape.lineTo(7.2, 1.6);   // Swept wing tip
    wingShape.lineTo(7.1, 2.3);   // Wing tip trailing edge
    wingShape.lineTo(0.5, 1.4);   // Trailing root
    wingShape.lineTo(-0.5, 1.4);  // Left trailing root
    wingShape.lineTo(-7.1, 2.3);  // Left wing tip trailing
    wingShape.lineTo(-7.2, 1.6);  // Left swept wing tip
    wingShape.closePath();

    const wingGeom = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.04,
    });
    // Align horizontally and rotate slightly upward for dihedral stability
    wingGeom.rotateX(Math.PI / 2);
    const wings = new THREE.Mesh(wingGeom, wingMat);
    wings.position.set(0, 0.12, 0.2);
    wings.castShadow = true;
    wings.receiveShadow = true;
    wings.name = 'Wings';
    root.add(wings);

    // 4 & 5. Winglet Aerodynamic Tips (Left & Right)
    const wingletGeom = new THREE.BoxGeometry(0.08, 0.75, 0.55);
    const wingletLeft = new THREE.Mesh(wingletGeom, accentMat);
    wingletLeft.position.set(-7.15, 0.45, 1.95);
    wingletLeft.rotation.z = -0.25;
    wingletLeft.castShadow = true;
    root.add(wingletLeft);

    const wingletRight = new THREE.Mesh(wingletGeom, accentMat);
    wingletRight.position.set(7.15, 0.45, 1.95);
    wingletRight.rotation.z = 0.25;
    wingletRight.castShadow = true;
    root.add(wingletRight);

    // 6. Vertical Tail Fin (Swept with Airline Livery Accent)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.1, 0);
    finShape.lineTo(0.8, 2.6);
    finShape.lineTo(2.0, 2.45);
    finShape.lineTo(2.3, 0);
    finShape.closePath();

    const finGeom = new THREE.ExtrudeGeometry(finShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
    const verticalFin = new THREE.Mesh(finGeom, accentMat);
    verticalFin.rotation.y = -Math.PI / 2;
    verticalFin.position.set(0.06, 0.5, 2.4);
    verticalFin.castShadow = true;
    verticalFin.name = 'VerticalTailFin';
    root.add(verticalFin);

    // 7. Horizontal Tailplanes (Stabilizers)
    const hTailShape = new THREE.Shape();
    hTailShape.moveTo(0, -0.4);
    hTailShape.lineTo(2.6, 0.7);
    hTailShape.lineTo(2.5, 1.1);
    hTailShape.lineTo(-2.5, 1.1);
    hTailShape.lineTo(-2.6, 0.7);
    hTailShape.closePath();

    const hTailGeom = new THREE.ExtrudeGeometry(hTailShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    hTailGeom.rotateX(Math.PI / 2);
    const horizontalStabilizers = new THREE.Mesh(hTailGeom, wingMat);
    horizontalStabilizers.position.set(0, 0.75, 4.2);
    horizontalStabilizers.castShadow = true;
    horizontalStabilizers.name = 'HorizontalStabilizers';
    root.add(horizontalStabilizers);

    // 8 & 9. Dual Underslung Jet Turbofan Engines (Left & Right)
    const buildEnginePod = (isLeft: boolean): THREE.Group => {
      const engineGroup = new THREE.Group();
      engineGroup.name = isLeft ? 'EngineLeft' : 'EngineRight';

      // Nacelle Outer Cowl
      const nacelleGeom = new THREE.CylinderGeometry(0.42, 0.38, 1.6, 16, 1, true);
      nacelleGeom.rotateX(Math.PI / 2);
      const nacelle = new THREE.Mesh(nacelleGeom, engineMat);
      nacelle.castShadow = true;
      engineGroup.add(nacelle);

      // Intake Chrome Ring Lip
      const lipGeom = new THREE.TorusGeometry(0.41, 0.06, 8, 24);
      const lip = new THREE.Mesh(lipGeom, metalMat);
      lip.position.set(0, 0, -0.8);
      engineGroup.add(lip);

      // Center Spinner Cone & Fan Hub
      const coneGeom = new THREE.ConeGeometry(0.18, 0.45, 12);
      coneGeom.rotateX(Math.PI / 2);
      const cone = new THREE.Mesh(coneGeom, metalMat);
      cone.position.set(0, 0, -0.65);
      engineGroup.add(cone);

      // Core Exhaust Nozzle Cone
      const exhaustGeom = new THREE.CylinderGeometry(0.24, 0.32, 0.4, 16);
      exhaustGeom.rotateX(Math.PI / 2);
      const exhaust = new THREE.Mesh(exhaustGeom, metalMat);
      exhaust.position.set(0, 0, 0.95);
      engineGroup.add(exhaust);

      // Pylon wing mount strut
      const pylonGeom = new THREE.BoxGeometry(0.1, 0.45, 0.9);
      const pylon = new THREE.Mesh(pylonGeom, wingMat);
      pylon.position.set(0, 0.35, 0);
      engineGroup.add(pylon);

      return engineGroup;
    };

    const engineLeft = buildEnginePod(true);
    engineLeft.position.set(-2.5, -0.4, 0.3);
    root.add(engineLeft);

    const engineRight = buildEnginePod(false);
    engineRight.position.set(2.5, -0.4, 0.3);
    root.add(engineRight);

    // 10 & 11. Navigation Strobe LED Beacons
    const beaconSphere = new THREE.SphereGeometry(0.08, 8, 8);

    const beaconRed = new THREE.Mesh(beaconSphere, beaconRedMat); // Port (Left = Red)
    beaconRed.position.set(-7.2, 0.75, 1.95);
    root.add(beaconRed);

    const beaconGreen = new THREE.Mesh(beaconSphere, beaconGreenMat); // Starboard (Right = Green)
    beaconGreen.position.set(7.2, 0.75, 1.95);
    root.add(beaconGreen);

    const beaconWhite = new THREE.Mesh(beaconSphere, beaconWhiteMat); // Tail strobe
    beaconWhite.position.set(0, 3.1, 4.6);
    root.add(beaconWhite);

    // 12. Dynamic Afterburner Exhaust Plumes
    const glowGeom = new THREE.ConeGeometry(0.22, 1.2, 12);
    glowGeom.rotateX(-Math.PI / 2);

    const afterburnerGlowLeft = new THREE.Mesh(glowGeom, afterburnerMat);
    afterburnerGlowLeft.position.set(0, 0, 1.7);
    afterburnerGlowLeft.scale.set(0.1, 0.1, 0.1); // hidden by default
    engineLeft.add(afterburnerGlowLeft);

    const afterburnerGlowRight = new THREE.Mesh(glowGeom, afterburnerMat);
    afterburnerGlowRight.position.set(0, 0, 1.7);
    afterburnerGlowRight.scale.set(0.1, 0.1, 0.1);
    engineRight.add(afterburnerGlowRight);

    // Contact Ground Shadow Plane beneath the aircraft
    const shadowGeom = new THREE.PlaneGeometry(9.5, 9.5);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeom, shadowMat);
    contactShadow.position.set(0, -0.85, 0);
    contactShadow.name = 'ContactShadow';
    root.add(contactShadow);

    return {
      rootGroup: root,
      fuselage,
      wings,
      wingletLeft,
      wingletRight,
      verticalFin,
      horizontalStabilizers,
      engineLeft,
      engineRight,
      cockpitGlass,
      beaconRed,
      beaconGreen,
      beaconWhite,
      contactShadow,
      afterburnerGlowLeft,
      afterburnerGlowRight,
      materials: {
        fuselageMat,
        accentMat,
        wingMat,
        engineMat,
        metalMat,
        glassMat,
        beaconRedMat,
        beaconGreenMat,
        afterburnerMat,
      },
    };
  }

  /**
   * Set airline livery on the fly
   */
  public setLivery(liveryKey: AirlineLivery) {
    this.currentLivery = liveryKey;
    const cfg = LIVERY_CONFIGS[liveryKey];

    this.parts.materials.fuselageMat.color.setHex(cfg.primaryColor);
    this.parts.materials.fuselageMat.map = createLiveryTexture(cfg.primaryColor, cfg.accentColor);
    this.parts.materials.fuselageMat.needsUpdate = true;

    this.parts.materials.accentMat.color.setHex(cfg.accentColor);
    this.parts.materials.engineMat.color.setHex(cfg.engineColor);
    this.parts.materials.metalMat.color.setHex(cfg.metalColor);
    this.parts.materials.glassMat.color.setHex(cfg.cockpitTint);
  }

  /**
   * Updates afterburner visual intensity based on boost state
   */
  public setAfterburner(active: boolean, intensity: number = 1.0) {
    const scale = active ? 0.8 + intensity * 0.4 : 0.05;
    this.parts.afterburnerGlowLeft.scale.set(scale, scale, scale * 1.5);
    this.parts.afterburnerGlowRight.scale.set(scale, scale, scale * 1.5);
    this.parts.materials.afterburnerMat.opacity = active ? 0.85 : 0;
  }

  /**
   * Applies exploded view separation factor (0 = assembled, 1 = fully exploded)
   */
  public setExplodedRatio(ratio: number) {
    const r = Math.max(0, Math.min(1, ratio));

    // Wings expand laterally
    this.parts.wings.position.y = 0.12 - r * 0.4;
    this.parts.wingletLeft.position.x = -7.15 - r * 1.2;
    this.parts.wingletRight.position.x = 7.15 + r * 1.2;

    // Engines expand downward and outward
    this.parts.engineLeft.position.set(-2.5 - r * 1.5, -0.4 - r * 0.8, 0.3);
    this.parts.engineRight.position.set(2.5 + r * 1.5, -0.4 - r * 0.8, 0.3);

    // Cockpit glass pops upward
    this.parts.cockpitGlass.position.y = 0.72 + r * 1.2;

    // Tail fin moves upward and aft
    this.parts.verticalFin.position.set(0.06, 0.5 + r * 1.5, 2.4 + r * 0.8);
    this.parts.horizontalStabilizers.position.set(0, 0.75 + r * 0.8, 4.2 + r * 1.2);

    // Fade contact shadow during exploded inspection
    this.parts.contactShadow.scale.setScalar(1 - r * 0.5);
    (this.parts.contactShadow.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - r);
  }

  public dispose() {
    Object.values(this.parts.materials).forEach(mat => mat.dispose());
  }
}
