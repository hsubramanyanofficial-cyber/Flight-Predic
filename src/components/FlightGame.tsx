import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CompositeAircraft, AirlineLivery, LIVERY_CONFIGS } from '../game/aircraftModel';
import { WorldScene, checkIsSoftwareGl } from '../game/worldScene';
import { flightAudio } from '../game/audioEngine';
import { formatCurrency } from '../utils/currency';
import { useApp } from '../context/AppContext';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  ArrowRight,
  Zap,
  Gauge,
  Compass,
  Layers,
  Sun,
  Moon,
  ChevronDown,
  X
} from 'lucide-react';

export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory' | 'showcase';

interface FlightGameProps {
  onExit: () => void;
}

export const FlightGame: React.FC<FlightGameProps> = ({ onExit }) => {
  const { currency } = useApp();

  // Container refs
  const mountRef = useRef<HTMLDivElement>(null);

  // High-level Game States
  const [gameState, setGameState] = useState<GameState>('title');
  const [isMuted, setIsMuted] = useState(false);
  const [activeLivery, setActiveLivery] = useState<AirlineLivery>('indigo');
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('fpps_skyway_highscore')) || 38500;
    } catch {
      return 38500;
    }
  });

  // Active Flight HUD status (state synced at low frequency or via direct DOM refs)
  const [hudAirspeed, setHudAirspeed] = useState(250);
  const [hudAltitude, setHudAltitude] = useState(28000);
  const [hudFareSavings, setHudFareSavings] = useState(0);
  const [hudMultiplier, setHudMultiplier] = useState(1);
  const [hudBoostPct, setHudBoostPct] = useState(100);
  const [hudDistanceToRunway, setHudDistanceToRunway] = useState(3500);

  // Showcase Mode states
  const [explodedRatio, setExplodedRatio] = useState(0);
  const [lightingPreset, setLightingPreset] = useState<'noon' | 'sunset' | 'midnight'>('sunset');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Internal Game Engine Mutable Refs (to avoid re-renders during 60fps tick)
  const engineRef = useRef<{
    worldScene: WorldScene | null;
    aircraft: CompositeAircraft | null;
    orbitControls: OrbitControls | null;
    animFrameId: number;
    clock: THREE.Clock;
    keysHeld: Record<string, boolean>;
    playerPos: THREE.Vector3;
    playerVel: THREE.Vector3;
    playerRot: THREE.Euler;
    airspeed: number;
    fareSavings: number;
    multiplier: number;
    multiplierTimer: number;
    boostFuel: number;
    isBoosting: boolean;
    cameraShake: number;
    hitstopTimer: number;
    distanceTravelled: number;
    showcaseRotationSpeed: number;
    hudUpdateAccumulator: number;
  }>({
    worldScene: null,
    aircraft: null,
    orbitControls: null,
    animFrameId: 0,
    clock: new THREE.Clock(),
    keysHeld: {},
    playerPos: new THREE.Vector3(0, 5, 0),
    playerVel: new THREE.Vector3(0, 0, 0),
    playerRot: new THREE.Euler(0, 0, 0),
    airspeed: 250,
    fareSavings: 0,
    multiplier: 1,
    multiplierTimer: 0,
    boostFuel: 100,
    isBoosting: false,
    cameraShake: 0,
    hitstopTimer: 0,
    distanceTravelled: 0,
    showcaseRotationSpeed: 0.005,
    hudUpdateAccumulator: 0,
  });

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = flightAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  // Initialize Three.js Scene and World
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Build WorldScene
    const worldScene = new WorldScene(container);
    const aircraft = new CompositeAircraft(activeLivery);
    worldScene.scene.add(aircraft.group);

    // Setup OrbitControls for 3D Showcase Mode
    const orbitControls = new OrbitControls(worldScene.camera, worldScene.renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.minDistance = 6;
    orbitControls.maxDistance = 65;
    orbitControls.enabled = false; // Enabled in showcase mode only

    engineRef.current.worldScene = worldScene;
    engineRef.current.aircraft = aircraft;
    engineRef.current.orbitControls = orbitControls;

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      worldScene.handleResize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard Input Listeners (with window blur safety)
    const handleKeyDown = (e: KeyboardEvent) => {
      engineRef.current.keysHeld[e.key.toLowerCase()] = true;

      // Handle pause via Esc or P
      if ((e.key === 'Escape' || e.key.toLowerCase() === 'p') && gameState === 'playing') {
        setGameState('paused');
      } else if (e.key === 'Escape' && gameState === 'paused') {
        setGameState('playing');
      }

      // Quick start on Space or Enter from title
      if ((e.key === 'Enter' || e.key === ' ') && gameState === 'title') {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keysHeld[e.key.toLowerCase()] = false;
    };

    const handleBlur = () => {
      engineRef.current.keysHeld = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Main 60fps Game Simulation Loop
    const isSoftwareGl = checkIsSoftwareGl();

    const tick = () => {
      const state = engineRef.current;
      const rawDt = state.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp frame delta time

      if (state.worldScene && state.aircraft) {
        // --- 1. TITLE SCREEN ANIMATION (Atmospheric live-world camera pan) ---
        if (gameState === 'title') {
          const time = state.clock.getElapsedTime();
          state.aircraft.group.position.set(0, Math.sin(time * 1.5) * 0.8, -10);
          state.aircraft.group.rotation.set(0.04 * Math.sin(time * 0.8), time * 0.2, 0.08 * Math.cos(time * 1.2));
          state.worldScene.camera.position.set(
            Math.sin(time * 0.25) * 16,
            6 + Math.sin(time * 0.5) * 2,
            Math.cos(time * 0.25) * 16
          );
          state.worldScene.camera.lookAt(0, 0, -10);
          state.worldScene.updateItems(dt);
        }

        // --- 2. 3D SHOWCASE / INSPECTION MODE ---
        else if (gameState === 'showcase') {
          if (state.orbitControls) {
            state.orbitControls.enabled = true;
            state.orbitControls.update();
          }
          state.worldScene.updateItems(dt);
        }

        // --- 3. ACTIVE PLAYING SIMULATION ---
        else if (gameState === 'playing') {
          if (state.orbitControls) state.orbitControls.enabled = false;

          // Check hitstop pause
          if (state.hitstopTimer > 0) {
            state.hitstopTimer -= dt;
          } else {
            // Read continuous inputs
            const keys = state.keysHeld;
            const pitchUp = keys['s'] || keys['arrowdown'];
            const pitchDown = keys['w'] || keys['arrowup'];
            const rollLeft = keys['a'] || keys['arrowleft'];
            const rollRight = keys['d'] || keys['arrowright'];
            const boost = keys['shift'] || keys[' '];

            // Boosting dynamics
            state.isBoosting = boost && state.boostFuel > 0;
            if (state.isBoosting) {
              state.boostFuel = Math.max(0, state.boostFuel - dt * 25);
              state.airspeed = THREE.MathUtils.damp(state.airspeed, 440, 4, dt);
              state.aircraft.setAfterburner(true, 1.4);
            } else {
              state.boostFuel = Math.min(100, state.boostFuel + dt * 10);
              state.airspeed = THREE.MathUtils.damp(state.airspeed, 260, 2, dt);
              state.aircraft.setAfterburner(false);
            }

            // Audio pitch update
            flightAudio.updateEnginePitch((state.airspeed - 200) / 240, state.isBoosting);

            // Flight attitude kinematics (Pitch, Roll, Yaw)
            const targetPitch = (pitchDown ? 0.35 : 0) - (pitchUp ? 0.35 : 0);
            const targetRoll = (rollLeft ? 0.65 : 0) - (rollRight ? 0.65 : 0);

            state.playerRot.x = THREE.MathUtils.damp(state.playerRot.x, targetPitch, 8, dt);
            state.playerRot.z = THREE.MathUtils.damp(state.playerRot.z, targetRoll, 8, dt);
            state.playerRot.y = -state.playerRot.z * 0.45; // Coordinated turn yaw

            // Lateral and vertical flight movement
            const lateralSpeed = 75;
            const verticalSpeed = 55;

            state.playerPos.x += (rollRight ? 1 : 0) * lateralSpeed * dt - (rollLeft ? 1 : 0) * lateralSpeed * dt;
            state.playerPos.y += (pitchUp ? 1 : 0) * verticalSpeed * dt - (pitchDown ? 1 : 0) * verticalSpeed * dt;

            // Boundaries
            state.playerPos.x = THREE.MathUtils.clamp(state.playerPos.x, -120, 120);
            state.playerPos.y = THREE.MathUtils.clamp(state.playerPos.y, -15, 60);

            // Forward flight movement along the corridor
            const forwardDelta = (state.airspeed / 2.5) * dt;
            state.playerPos.z -= forwardDelta;
            state.distanceTravelled += forwardDelta;

            // Multiplier timer
            if (state.multiplierTimer > 0) {
              state.multiplierTimer -= dt;
              if (state.multiplierTimer <= 0) {
                state.multiplier = 1;
              }
            }

            // Update aircraft mesh
            state.aircraft.group.position.copy(state.playerPos);
            state.aircraft.group.rotation.set(state.playerRot.x, state.playerRot.y, state.playerRot.z);

            // Decay camera shake
            if (state.cameraShake > 0) {
              state.cameraShake = Math.max(0, state.cameraShake - dt * 3.5);
            }

            // Third-person chase camera with exponential damping
            const shakeOffsetX = (Math.random() - 0.5) * state.cameraShake * 1.5;
            const shakeOffsetY = (Math.random() - 0.5) * state.cameraShake * 1.5;

            const targetCamPos = new THREE.Vector3(
              state.playerPos.x * 0.75 + shakeOffsetX,
              state.playerPos.y + 6.5 + shakeOffsetY,
              state.playerPos.z + 18
            );
            state.worldScene.camera.position.lerp(targetCamPos, 0.12);
            state.worldScene.camera.lookAt(
              state.playerPos.x * 0.35,
              state.playerPos.y + 1.5,
              state.playerPos.z - 40
            );

            // Animate items (rings, orbs, hazards)
            state.worldScene.updateItems(dt);

            // --- COLLISION DETECTION WITH GAME ITEMS ---
            const pBox = state.playerPos;

            state.worldScene.items.forEach(item => {
              if (item.collected) return;

              // Distance check
              const dist = pBox.distanceTo(item.position);
              if (dist < item.radius + 3.0) {
                item.collected = true;
                item.group.visible = false;

                if (item.type === 'ring') {
                  const gained = item.value * state.multiplier;
                  state.fareSavings += gained;
                  state.boostFuel = Math.min(100, state.boostFuel + 25);
                  flightAudio.playFareRingChime(state.multiplier);
                } else if (item.type === 'prediction') {
                  state.multiplier = item.value;
                  state.multiplierTimer = 10.0;
                  state.boostFuel = 100;
                  flightAudio.playPredictionChime();
                  state.cameraShake = 0.3;
                } else if (item.type === 'hazard') {
                  state.airspeed = Math.max(160, state.airspeed - 80);
                  state.cameraShake = 1.2;
                  state.hitstopTimer = 0.06; // 60ms tactile hitstop
                  flightAudio.playTurbulenceThump();
                }
              }
            });

            // Check Arrival Runway Landing
            if (state.playerPos.z <= state.worldScene.destinationZ + 400) {
              // Smooth descent onto runway
              state.playerPos.y = THREE.MathUtils.damp(state.playerPos.y, -34, 3, dt);
              state.playerPos.x = THREE.MathUtils.damp(state.playerPos.x, 0, 3, dt);

              if (state.playerPos.z <= state.worldScene.destinationZ + 80) {
                // Victory Landing Touchdown!
                flightAudio.playLandingFanfare();
                flightAudio.stopEngine();

                const finalScore = state.fareSavings + 10000;
                setHudFareSavings(finalScore);
                if (finalScore > highScore) {
                  setHighScore(finalScore);
                  try {
                    localStorage.setItem('fpps_skyway_highscore', String(finalScore));
                  } catch {}
                }
                setGameState('victory');
              }
            }

            // Sync React HUD (throttled to ~10Hz to preserve 60fps WebGL loop)
            state.hudUpdateAccumulator += dt;
            if (state.hudUpdateAccumulator >= 0.1) {
              state.hudUpdateAccumulator = 0;
              setHudAirspeed(Math.round(state.airspeed));
              setHudAltitude(Math.round(28000 + state.playerPos.y * 120));
              setHudFareSavings(state.fareSavings);
              setHudMultiplier(state.multiplier);
              setHudBoostPct(Math.round(state.boostFuel));
              const remaining = Math.max(0, Math.round(Math.abs(state.worldScene.destinationZ - state.playerPos.z)));
              setHudDistanceToRunway(remaining);
            }
          }
        }

        // Render Frame
        state.worldScene.renderer.render(state.worldScene.scene, state.worldScene.camera);
      }

      state.animFrameId = requestAnimationFrame(tick);
    };

    engineRef.current.animFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      cancelAnimationFrame(engineRef.current.animFrameId);
      flightAudio.stopEngine();
      worldScene.dispose();
      aircraft.dispose();
    };
  }, []);

  // Start Game Routine
  const startGame = () => {
    const state = engineRef.current;
    state.playerPos.set(0, 8, 0);
    state.playerVel.set(0, 0, 0);
    state.playerRot.set(0, 0, 0);
    state.airspeed = 250;
    state.fareSavings = 0;
    state.multiplier = 1;
    state.multiplierTimer = 0;
    state.boostFuel = 100;
    state.distanceTravelled = 0;

    // Reset items visibility
    if (state.worldScene) {
      state.worldScene.items.forEach(item => {
        item.collected = false;
        item.group.visible = true;
      });
    }

    setGameState('playing');
    flightAudio.startEngine();
  };

  // Switch to 3D Aircraft Showcase Mode
  const enterShowcaseMode = () => {
    const state = engineRef.current;
    if (state.aircraft && state.worldScene) {
      state.aircraft.group.position.set(0, 0, 0);
      state.aircraft.group.rotation.set(0, 0, 0);
      state.worldScene.camera.position.set(12, 6, 14);
      state.worldScene.camera.lookAt(0, 0, 0);
      if (state.orbitControls) {
        state.orbitControls.target.set(0, 0, 0);
        state.orbitControls.reset();
      }
    }
    flightAudio.stopEngine();
    setGameState('showcase');
  };

  // Change Livery
  const handleLiveryChange = (livery: AirlineLivery) => {
    setActiveLivery(livery);
    if (engineRef.current.aircraft) {
      engineRef.current.aircraft.setLivery(livery);
    }
  };

  // Change Exploded Slider Ratio
  const handleExplodedChange = (val: number) => {
    setExplodedRatio(val);
    if (engineRef.current.aircraft) {
      engineRef.current.aircraft.setExplodedRatio(val);
    }
  };

  // Lighting Preset Switcher
  const handleLightingPreset = (preset: 'noon' | 'sunset' | 'midnight') => {
    setLightingPreset(preset);
    const scene = engineRef.current.worldScene?.scene;
    if (!scene) return;

    if (preset === 'noon') {
      scene.background = new THREE.Color(0x38bdf8);
      scene.fog = new THREE.FogExp2(0x7dd3fc, 0.001);
    } else if (preset === 'sunset') {
      scene.background = new THREE.Color(0x0f172a);
      scene.fog = new THREE.FogExp2(0x1e1b4b, 0.0012);
    } else {
      scene.background = new THREE.Color(0x020617);
      scene.fog = new THREE.FogExp2(0x020617, 0.0015);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Viewport (100% full bleed) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* --- SCREEN 1: TITLE SCREEN --- */}
      {gameState === 'title' && (
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-12 pointer-events-none">
          {/* Top Bar with Bespoke Inline SVG Logo */}
          <div className="flex items-center justify-between w-full pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block">
                  SKYWAY ACE <span className="text-sky-400 font-light">· 3D</span>
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                  Global Flight Corridor Simulator
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleMute}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-300 hover:text-white transition"
                title="Toggle Web Audio"
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
              </button>
              <button
                onClick={onExit}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
              >
                <X className="h-3.5 w-3.5" />
                <span>Exit to FPPS</span>
              </button>
            </div>
          </div>

          {/* Center Callout with Primary Start CTA over 30-40% Negative Space */}
          <div className="max-w-xl mx-auto text-center space-y-6 pointer-events-auto my-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-400 font-mono">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Three.js PBR Studio Engine · 60 FPS</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
              FLY THE AIRWAY.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
                HARVEST FARES.
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              Pilot an international commercial jetliner through the high-altitude airway. Fly through Fare-Saver rings, grab ML price predictions, avoid storm turbulence, and execute a precision landing.
            </p>

            {/* Start CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={startGame}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm tracking-wide transition shadow-xl shadow-sky-500/25 active:scale-95"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>START FLIGHT RUN (SPACE)</span>
              </button>

              <button
                onClick={enterShowcaseMode}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm transition"
              >
                <Layers className="h-4 w-4 text-sky-400" />
                <span>3D Aircraft Showcase</span>
              </button>
            </div>

            {/* High Score Banner */}
            <div className="text-xs text-slate-400 font-mono">
              ALL-TIME FARE SAVINGS RECORD:{' '}
              <span className="text-amber-400 font-bold">{formatCurrency(highScore, currency)}</span>
            </div>
          </div>

          {/* Single Flat Control Hint Line */}
          <div className="text-center text-xs font-mono text-slate-400 tracking-wider">
            WASD / ARROWS FLY · SHIFT BOOST · SPACE FLARE / START · ESC PAUSE
          </div>
        </div>
      )}

      {/* --- SCREEN 2: ACTIVE FLIGHT HUD (Low-occlusion, <15% footprint) --- */}
      {gameState === 'playing' && (
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
          {/* Top Flight Clusters (Airspeed, Fare Savings, Distance to Destination) */}
          <div className="flex items-start justify-between w-full">
            {/* Left Cluster: Flight Telemetry */}
            <div className="bg-slate-950/85 border border-slate-800 rounded-xl p-3 min-w-[140px] pointer-events-auto shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Gauge className="h-3 w-3 text-sky-400" />
                <span>Airspeed</span>
              </div>
              <div className="text-2xl font-black font-mono text-white tabular-nums">
                {hudAirspeed} <span className="text-xs font-normal text-slate-400">kts</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                ALT: <span className="text-white font-bold tabular-nums">{hudAltitude.toLocaleString()}</span> ft
              </div>
            </div>

            {/* Center Cluster: Fare Savings & Multiplier Banner */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl px-5 py-2.5 text-center pointer-events-auto shadow-2xl flex flex-col items-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Airfare Savings Harvested
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tabular-nums">
                {formatCurrency(hudFareSavings, currency)}
              </div>
              {hudMultiplier > 1 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded bg-sky-500/20 text-[10px] font-bold text-sky-300 font-mono animate-bounce">
                  <Zap className="h-2.5 w-2.5" /> {hudMultiplier}x ML PREDICTION STREAM ACTIVE!
                </div>
              )}
            </div>

            {/* Right Cluster: Destination Distance & Mute */}
            <div className="flex items-start gap-2.5 pointer-events-auto">
              <div className="bg-slate-950/85 border border-slate-800 rounded-xl p-3 min-w-[140px] text-right shadow-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                  <Compass className="h-3 w-3 text-amber-400" />
                  <span>Runway Distance</span>
                </div>
                <div className="text-xl font-black font-mono text-white tabular-nums">
                  {hudDistanceToRunway} <span className="text-xs font-normal text-slate-400">m</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400">
                  Approach ILS 27R
                </div>
              </div>

              <button
                onClick={handleToggleMute}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white transition"
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Central Pitch/Roll Flight Crosshair Marker */}
          <div className="self-center flex items-center justify-center pointer-events-none opacity-40">
            <svg className="w-24 h-24 text-sky-400" viewBox="0 0 100 100">
              <line x1="20" y1="50" x2="38" y2="50" stroke="currentColor" strokeWidth="2" />
              <line x1="62" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="50" r="4" fill="currentColor" />
            </svg>
          </div>

          {/* Bottom Jet Turbine Boost / Afterburner Meter */}
          <div className="w-full max-w-md mx-auto pointer-events-auto">
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 shadow-xl flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold text-sky-400 uppercase flex items-center gap-1 shrink-0">
                <Zap className="h-3.5 w-3.5" />
                <span>Afterburner</span>
              </span>
              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-teal-400 transition-all duration-100"
                  style={{ width: `${hudBoostPct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-white tabular-nums">
                {hudBoostPct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- SCREEN 3: PAUSE MODAL --- */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">FLIGHT PAUSED</h2>
            <div className="text-xs font-mono text-slate-400 space-y-1">
              <div>Current Savings: <span className="text-emerald-400 font-bold">{formatCurrency(hudFareSavings, currency)}</span></div>
              <div>Remaining Distance: <span className="text-white font-bold">{hudDistanceToRunway}m</span></div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase transition"
              >
                Resume Flight
              </button>
              <button
                onClick={startGame}
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Restart Corridor Run
              </button>
              <button
                onClick={() => {
                  flightAudio.stopEngine();
                  setGameState('title');
                }}
                className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs transition"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SCREEN 4: VICTORY TOUCHDOWN MODAL --- */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-7 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto">
              <Award className="h-7 w-7" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                TOUCHDOWN VERIFIED · RUNWAY 27R
              </span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                FLIGHT COMPLETED!
              </h2>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Total Fares Saved:</span>
                <span className="text-emerald-400 font-bold text-sm font-mono">
                  {formatCurrency(hudFareSavings, currency)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Landing Touchdown Bonus:</span>
                <span className="text-sky-300 font-bold text-xs font-mono">+₹10,000</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono border-t border-slate-800 pt-2">
                <span>Personal High Score:</span>
                <span className="text-amber-400 font-bold text-sm font-mono">
                  {formatCurrency(highScore, currency)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase transition shadow-lg shadow-sky-500/20"
              >
                Fly Again
              </button>
              <button
                onClick={() => setGameState('title')}
                className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Title Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SCREEN 5: 3D AIRCRAFT SHOWCASE (Collapsible bottom dock <=15% footprint) --- */}
      {gameState === 'showcase' && (
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 pointer-events-none">
          {/* Top Bar */}
          <div className="flex items-center justify-between w-full pointer-events-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 backdrop-blur-md">
              <span className="text-sm font-bold text-white block">
                3D Aircraft Studio & Exploded Inspection
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Drag to orbit 360° · Scroll to zoom
              </span>
            </div>

            <button
              onClick={() => {
                if (engineRef.current.aircraft) {
                  engineRef.current.aircraft.setExplodedRatio(0);
                }
                setExplodedRatio(0);
                setGameState('title');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
            >
              <X className="h-3.5 w-3.5" />
              <span>Back to Menu</span>
            </button>
          </div>

          {/* Unified Collapsible Bottom Control Dock */}
          <div className="w-full max-w-4xl mx-auto pointer-events-auto flex flex-col items-center">
            {/* Collapse / Expand Toggle Button */}
            <button
              onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
              className="mb-2 px-3 py-1 rounded-t-lg bg-slate-900 border border-b-0 border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${isControlsCollapsed ? 'rotate-180' : ''}`} />
              <span>{isControlsCollapsed ? 'Show Studio Controls' : 'Hide Controls (Zen Mode)'}</span>
            </button>

            {!isControlsCollapsed && (
              <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Control 1: Exploded View Separation Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-sky-400" />
                        <span>Exploded Component View</span>
                      </span>
                      <span className="font-mono text-white font-bold">{Math.round(explodedRatio * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={explodedRatio}
                      onChange={e => handleExplodedChange(parseFloat(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Control 2: Airline Livery Swatches */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 font-mono block">Airline Livery Finish</span>
                    <div className="flex items-center gap-2">
                      {(Object.keys(LIVERY_CONFIGS) as AirlineLivery[]).map(lKey => {
                        const cfg = LIVERY_CONFIGS[lKey];
                        const isSelected = activeLivery === lKey;
                        return (
                          <button
                            key={lKey}
                            onClick={() => handleLiveryChange(lKey)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition border ${
                              isSelected
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title={cfg.name}
                          >
                            {lKey}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Control 3: Studio Lighting Rig */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 font-mono block">Studio Lighting Environment</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLightingPreset('noon')}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition border flex items-center justify-center gap-1 ${
                          lightingPreset === 'noon'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sun className="h-3 w-3" />
                        <span>Day</span>
                      </button>
                      <button
                        onClick={() => handleLightingPreset('sunset')}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition border flex items-center justify-center gap-1 ${
                          lightingPreset === 'sunset'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sun className="h-3 w-3 text-rose-400" />
                        <span>Sunset</span>
                      </button>
                      <button
                        onClick={() => handleLightingPreset('midnight')}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition border flex items-center justify-center gap-1 ${
                          lightingPreset === 'midnight'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Moon className="h-3 w-3 text-indigo-400" />
                        <span>Night</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
