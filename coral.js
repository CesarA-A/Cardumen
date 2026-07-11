import { randomBetween } from "./environment.js";

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

export const createCorals = (scene) => {
  const corals = [];
  const counts = {
    coral: 15,
    coralVariant: 15,
    orangeCoral: 20,
    anemone: 35
  };

  const staticCoralPositions = [];
  for (let i = 0; i < counts.coral; i++) {
    staticCoralPositions.push(
      new BABYLON.Vector3(randomBetween(-95, 95), -0.75, randomBetween(-85, 85))
    );
  }
  staticCoralPositions.forEach((pos) => {
    const scale = randomBetween(0.003, 0.009);
    const rot = new BABYLON.Vector3(0, randomBetween(0, Math.PI * 2), 0);
    corals.push(loadCoralModel(scene, "Coral.glb", pos, scale, rot, false));
  });

  const staticCoral2Positions = [];
  for (let i = 0; i < counts.coralVariant; i++) {
    staticCoral2Positions.push(
      new BABYLON.Vector3(randomBetween(-95, 95), -0.75, randomBetween(-85, 85))
    );
  }
  staticCoral2Positions.forEach((pos) => {
    const scale = randomBetween(0.004, 0.010);
    const rot = new BABYLON.Vector3(0, randomBetween(0, Math.PI * 2), 0);
    corals.push(loadCoralModel(scene, "Coral(1).glb", pos, scale, rot, false));
  });

  const orangeCoralPositions = [];
  for (let i = 0; i < counts.orangeCoral; i++) {
    orangeCoralPositions.push(
      new BABYLON.Vector3(randomBetween(-95, 95), -0.75, randomBetween(-85, 85))
    );
  }
  orangeCoralPositions.forEach((pos) => {
    const scale = randomBetween(0.005, 0.013);
    const rot = new BABYLON.Vector3(0, randomBetween(0, Math.PI * 2), 0);
    corals.push(loadCoralModel(scene, "Orange Coral.glb", pos, scale, rot, true));
  });

  const anemonePositions = [];
  for (let i = 0; i < counts.anemone; i++) {
    anemonePositions.push(
      new BABYLON.Vector3(randomBetween(-95, 95), -0.75, randomBetween(-85, 85))
    );
  }
  anemonePositions.forEach((pos) => {
    const scale = randomBetween(0.004, 0.011);
    const rot = new BABYLON.Vector3(0, randomBetween(0, Math.PI * 2), 0);
    const entry = loadCoralModel(scene, "Sea anemone.glb", pos, scale, rot, true);
    entry.swayAmount = randomBetween(0.06, 0.14);
    entry.swaySpeed = randomBetween(0.8, 1.6);
    corals.push(entry);
  });

  console.log(`🪸 ${corals.length} corales creados en la escena`);

  // FIX: separar corales animados al crearlos, para no iterar todos en cada frame
  const animatedCorals = corals.filter(c => c.animated);
  console.log(`🪸 ${animatedCorals.length} corales animados (de ${corals.length} totales)`);

  return { all: corals, animated: animatedCorals };
};

/**
 * FIX: ahora recibe solo el subset animado — sin chequeo condicional en cada iteración.
 */
export const updateCorals = (animatedCorals, time) => {
  for (let i = 0; i < animatedCorals.length; i++) {
    const { root, phase, swaySpeed, swayAmount } = animatedCorals[i];
    if (!root) continue;
    root.rotation.z = Math.sin(time * swaySpeed + phase) * swayAmount;
    root.rotation.x = Math.cos(time * swaySpeed * 0.7 + phase) * (swayAmount * 0.4);
  }
};