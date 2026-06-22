import FishSwarm from "./fishSwarm.js";
import Shark from "./shark.js";
import { createFpsDisplay } from "./fpsDisplay.js";
import { createStructures } from "./structure.js";
import { createCorals, updateCorals } from "./coral.js";
import {
  createUnderwaterEnvironment,
  updateUnderwaterEnvironment,
  createSeaLifeDetails
} from "./environment.js";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, undefined, true);
const fpsDisplay = createFpsDisplay(engine);

const configureSceneAtmosphere = (scene) => {
  scene.clearColor = new BABYLON.Color4(0.05, 0.3, 0.5, 1);
  scene.ambientColor = new BABYLON.Color3(0.2, 0.3, 0.4);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.05, 0.28, 0.42);
  scene.fogDensity = 0.018;
};

const createCamera = (scene) => {
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 3,
    Math.PI / 3.5,
    60,
    new BABYLON.Vector3(0, 2, 0),
    scene
  );

  camera.lowerRadiusLimit = 30;
  camera.upperRadiusLimit = 120;
  camera.lowerBetaLimit = Math.PI / 6;
  camera.upperBetaLimit = Math.PI * 0.75;
  camera.wheelPrecision = 40;
  camera.minZ = 0.1;
  camera.maxZ = 300;
  camera.inertia = 0.8;
  camera.attachControl(canvas, true);

  return camera;
};

const createLights = (scene) => {
  const hemiLight = new BABYLON.HemisphericLight(
    "hemi",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  hemiLight.intensity = 0.8;
  hemiLight.groundColor = new BABYLON.Color3(0.15, 0.25, 0.3);

  const dirLight = new BABYLON.DirectionalLight(
    "dir",
    new BABYLON.Vector3(-1, -2, -1),
    scene
  );
  dirLight.position = new BABYLON.Vector3(20, 30, 20);
  dirLight.intensity = 0.9;

  return { hemiLight, dirLight };
};

const createScene = () => {
  const scene = new BABYLON.Scene(engine);

  configureSceneAtmosphere(scene);
  createCamera(scene);
  createLights(scene);

  const environment = createUnderwaterEnvironment(scene);
  const seaLifeDetails = createSeaLifeDetails(scene);
  const fishSwarm = new FishSwarm(scene, 100);
  createStructures(scene, { loadHeavyModels: false });

  const shark = new Shark(scene, "models/", new BABYLON.Vector3(0, 2, 0));

  // FIX: createCorals ahora devuelve { all, animated }
  const corals = createCorals(scene);

  scene.onBeforeRenderObservable.add(() => {
    const time = performance.now() * 0.001;
    const deltaTime = engine.getDeltaTime() / 1000;

    fpsDisplay.update(deltaTime);
    updateUnderwaterEnvironment(environment, scene, time, deltaTime);

    // FIX: pasar solo el subset animado
    updateCorals(corals.animated, time);

    fishSwarm.update(time, deltaTime);
    shark.update();

    const seaweed = seaLifeDetails.seaweed;
    for (let i = 0; i < seaweed.length; i++) {
      seaweed[i].mesh.rotation.z = Math.sin(time * 0.9 + seaweed[i].phase) * 0.08;
    }
  });

  return scene;
};

const scene = createScene();
const loadingElement = document.getElementById("loading");

scene.executeWhenReady(() => {
  if (!loadingElement) return;

  loadingElement.style.opacity = "0";
  loadingElement.style.transition = "opacity 0.5s ease-out";
  setTimeout(() => {
    loadingElement.style.display = "none";
  }, 500);
});

engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
