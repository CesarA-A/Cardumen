import Fish from "./fish.js";
import { createStructures } from "./structure.js";
import { createCorals, updateCorals } from "./coral.js";
import {
  createUnderwaterEnvironment,
  updateUnderwaterEnvironment,
  createSeaLifeDetails,
} from "./environment.js";

// ─── Motor ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, undefined, true);

// ─── Escena ───────────────────────────────────────────────────────────────────
const createScene = () => {
  const scene = new BABYLON.Scene(engine);

  // Ambiente general
  scene.clearColor = new BABYLON.Color4(0.05, 0.3, 0.5, 1);
  scene.ambientColor = new BABYLON.Color3(0.2, 0.3, 0.4);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.05, 0.28, 0.42);
  scene.fogDensity = 0.018;

  // ── Cámara panorámica orbiting ──────────────────────────────────────────────
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 3,          // alpha: ángulo inicial
    Math.PI / 3.5,        // beta: desde arriba
    60,                   // radio: distancia
    new BABYLON.Vector3(0, 2, 0),  // centro en el centro del escenario
    scene
  );
  camera.lowerRadiusLimit  = 30;
  camera.upperRadiusLimit  = 120;
  camera.lowerBetaLimit    = Math.PI / 6;
  camera.upperBetaLimit    = Math.PI * 0.75;
  camera.wheelPrecision    = 40;
  camera.minZ = 0.1;
  camera.maxZ = 300;
  camera.attachControl(canvas, true);
  camera.inertia = 0.8;

  // ── Luces ──────────────────────────────────────────────────────────────────
  const hemiLight = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.8;
  hemiLight.groundColor = new BABYLON.Color3(0.15, 0.25, 0.3);

  const dirLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1, -2, -1), scene);
  dirLight.position = new BABYLON.Vector3(20, 30, 20);
  dirLight.intensity = 0.9;

  // ── Entorno (suelo, polvo, burbujas, algas, arrecifes primitivos) ──────────
  const environment   = createUnderwaterEnvironment(scene);
  const seaLifeDetails = createSeaLifeDetails(scene);

  // ── Estructuras GLB ────────────────────────────────────────────────────────
  createStructures(scene);

  // ── Corales densamente distribuidos ────────────────────────────────────────
  const corals = createCorals(scene);

  // ── Cardumen (15 peces payaso autónomos distribuidos) ────────────────────────────
  const fishInitialState = [
    { position: new BABYLON.Vector3(-10, 2,   -5), rotationY: 0.25, speed: 2.1 },
    { position: new BABYLON.Vector3( 10, 2.5,   0), rotationY: 1.4,  speed: 2.5 },
    { position: new BABYLON.Vector3(  0, 3,    8), rotationY: 2.6,  speed: 1.9 },
    { position: new BABYLON.Vector3(-12, 1.5,   5), rotationY: 3.8,  speed: 2.3 },
    { position: new BABYLON.Vector3( 12, 2,   -8), rotationY: 5.1,  speed: 2.0 },
    // Más peces para mayor movimiento
    { position: new BABYLON.Vector3(-20, 2.2,  -15), rotationY: 1.1,  speed: 2.2 },
    { position: new BABYLON.Vector3( 20, 2.8,   10), rotationY: 4.2,  speed: 1.8 },
    { position: new BABYLON.Vector3(  5, 1.8,  -20), rotationY: 0.5,  speed: 2.4 },
    { position: new BABYLON.Vector3(-15, 3.2,   15), rotationY: 2.9,  speed: 2.1 },
    { position: new BABYLON.Vector3( 25, 2.0,  -12), rotationY: 5.5,  speed: 1.95},
    { position: new BABYLON.Vector3(  8, 2.6,   -3), rotationY: 1.8,  speed: 2.3 },
    { position: new BABYLON.Vector3(-22, 1.9,    8), rotationY: 3.2,  speed: 2.0 },
    { position: new BABYLON.Vector3( 18, 3.1,   18), rotationY: 0.9,  speed: 2.2 },
    { position: new BABYLON.Vector3( -8, 2.4,   -18), rotationY: 4.5,  speed: 1.85},
    { position: new BABYLON.Vector3( 15, 1.7,    5), rotationY: 2.3,  speed: 2.4 },
  ];

  const fishes = fishInitialState.map(({ position, rotationY, speed }) =>
    new Fish(
      scene,
      "models/",
      "payaso.glb",
      position,
      new BABYLON.Vector3(0, rotationY, 0),
      speed
    )
  );

  // ── Loop de animación ──────────────────────────────────────────────────────
  scene.onBeforeRenderObservable.add(() => {
    const time      = performance.now() * 0.001;
    const deltaTime = engine.getDeltaTime() / 1000;

    // Entorno
    updateUnderwaterEnvironment(environment, scene, time, deltaTime);
    seaLifeDetails.seaweed.forEach(({ mesh, phase }) => {
      mesh.rotation.z = Math.sin(time * 0.9 + phase) * 0.08;
    });

    // Corales animados
    updateCorals(corals, time);

    // Cardumen autónomo
    fishes.forEach((fish) => fish.update());
  });

  return scene;
};

// ─── Arranque ─────────────────────────────────────────────────────────────────
const scene = createScene();

// Ocultar pantalla de carga cuando la escena esté lista
const loadingElement = document.getElementById('loading');
scene.executeWhenReady(() => {
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    loadingElement.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
      if (loadingElement) loadingElement.style.display = 'none';
    }, 500);
  }
});

engine.runRenderLoop(() => scene.render());

window.addEventListener("resize", () => engine.resize());
