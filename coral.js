import { randomBetween } from "./environment.js";

/**
 * Carga un coral GLB en una posición dada y lo registra para animación opcional.
 * @param {BABYLON.Scene} scene
 * @param {string} modelFile - nombre del archivo GLB (ej. "Coral.glb")
 * @param {BABYLON.Vector3} position
 * @param {number} scale
 * @param {BABYLON.Vector3} rotation
 * @param {boolean} animated - si el coral oscila con el agua
 * @returns {{ root: BABYLON.TransformNode, animated: boolean, phase: number }}
 */
const loadCoralModel = (scene, modelFile, position, scale, rotation, animated = false) => {
  const root = new BABYLON.TransformNode(`coral-${modelFile}-${Math.random()}`, scene);
  root.position.copyFrom(position);
  root.scaling.setAll(scale);
  if (rotation) root.rotation.copyFrom(rotation);

  BABYLON.SceneLoader.ImportMesh("", "models/", modelFile, scene, (meshes) => {
    meshes.forEach((mesh) => {
      mesh.parent = root;
    });
  });

  return {
    root,
    animated,
    phase: randomBetween(0, Math.PI * 2),
    swaySpeed: randomBetween(0.6, 1.2),
    swayAmount: randomBetween(0.03, 0.08),
  };
};

/**
 * Crea grupos de corales GLB dispersos por el fondo marino.
 * Mezcla corales animados (anemone, orange coral) y estáticos (coral base).
 */
export const createCorals = (scene) => {
  const corals = [];

  // --- Posiciones para Coral.glb (estático, grande) - 160 corales ---
  const staticCoralPositions = [];
  for (let i = 0; i < 160; i++) {
    staticCoralPositions.push(
      new BABYLON.Vector3(
        randomBetween(-50, 50),
        -0.75,
        randomBetween(-45, 45)
      )
    );
  }

  staticCoralPositions.forEach((pos) => {
    const scale = randomBetween(0.003, 0.009);
    const rot = new BABYLON.Vector3(0, randomBetween(0, Math.PI * 2), 0);
    corals.push(loadCoralModel(scene, "Coral.glb", pos, scale, rot, false));
  });

  // --- Posiciones para Coral(1).glb (estático, variante) - 120 corales ---
  const staticCoral2Positions = [];
  for (let i = 0; i < 120; i++) {
    staticCoral2Positions.push(
      new BABYLON.Vector3(
        randomBetween(-50, 50),
        -0.75,
        randomBetween(-45, 45)
      )
    );
  }

  staticCoral2Positions.forEach((pos) => {
    const scale = randomBetween(0.004, 0.010);
    const rot = new BABYLON.Vector3(0, randomBetween(0, Math.PI * 2), 0);
    corals.push(loadCoralModel(scene, "Coral(1).glb", pos, scale, rot, false));
  });

  // --- Orange Coral (animado, se mece suavemente) - 150 corales ---
  const orangeCoralPositions = [];
  for (let i = 0; i < 150; i++) {
    orangeCoralPositions.push(
      new BABYLON.Vector3(
        randomBetween(-50, 50),
        -0.75,
        randomBetween(-45, 45)
      )
    );
  }

  orangeCoralPositions.forEach((pos) => {
    const scale = randomBetween(0.005, 0.013);
    const rot = new BABYLON.Vector3(0, randomBetween(0, Math.PI * 2), 0);
    corals.push(loadCoralModel(scene, "Orange Coral.glb", pos, scale, rot, true));
  });

  // --- Sea Anemone (animado, oscilación más pronunciada) - 170 corales ---
  const anemonePositions = [];
  for (let i = 0; i < 170; i++) {
    anemonePositions.push(
      new BABYLON.Vector3(
        randomBetween(-50, 50),
        -0.75,
        randomBetween(-45, 45)
      )
    );
  }

  anemonePositions.forEach((pos) => {
    const scale = randomBetween(0.004, 0.011);
    const rot = new BABYLON.Vector3(0, randomBetween(0, Math.PI * 2), 0);
    const entry = loadCoralModel(scene, "Sea anemone.glb", pos, scale, rot, true);
    // Las anémonas tienen una oscilación más amplia
    entry.swayAmount = randomBetween(0.06, 0.14);
    entry.swaySpeed = randomBetween(0.8, 1.6);
    corals.push(entry);
  });

  console.log(`🪸 ${corals.length} corales creados en la escena`);
  return corals;
};

/**
 * Actualiza la animación de los corales animados en cada frame.
 * @param {Array} corals - array devuelto por createCorals
 * @param {number} time - tiempo en segundos
 */
export const updateCorals = (corals, time) => {
  corals.forEach(({ root, animated, phase, swaySpeed, swayAmount }) => {
    if (!animated || !root) return;
    root.rotation.z = Math.sin(time * swaySpeed + phase) * swayAmount;
    root.rotation.x = Math.cos(time * swaySpeed * 0.7 + phase) * (swayAmount * 0.4);
  });
};
