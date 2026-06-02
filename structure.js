/**
 * Carga un modelo GLB como nodo raíz con posición, rotación y escala.
 * @param {BABYLON.Scene} scene
 * @param {string} fileName
 * @param {BABYLON.Vector3} position
 * @param {BABYLON.Vector3} rotation
 * @param {number} scale
 * @returns {BABYLON.TransformNode}
 */
const loadStructureModel = (scene, fileName, position, rotation, scale) => {
  const root = new BABYLON.TransformNode(fileName.replace(".glb", ""), scene);
  root.position.copyFrom(position);
  root.rotation.copyFrom(rotation);
  root.scaling.setAll(scale);

  BABYLON.SceneLoader.ImportMesh("", "models/", fileName, scene, (meshes) => {
    meshes.forEach((mesh) => {
      mesh.parent = root;
    });
  });

  return root;
};

/**
 * Carga todas las estructuras del escenario:
 * - Portal submarino
 * - Pared de coral
 * - Tres pasajes de arrecife (grande, mediano, pequeño)
 *
 * @param {BABYLON.Scene} scene
 * @returns {{ portal, wall, arrecifeGrande, arrecifeMediano, arrecifePequeno }}
 */
export const createStructures = (scene) => {
  const portal = loadStructureModel(
    scene,
    "pixellabs-underwater-portal-3d-model-2691.glb",
    new BABYLON.Vector3(-12, 2.0, -10),
    new BABYLON.Vector3(0, Math.PI * 0.18, 0),
    8
  );

  const wall = loadStructureModel(
    scene,
    "mastertux-wall-2127.glb",
    new BABYLON.Vector3(28, -0.75, 15),
    new BABYLON.Vector3(0, Math.PI * 0.72, 0),
    1.05
  );

  const arrecifePequeno = loadStructureModel(
    scene,
    "arrecife_pasaje_pequeno.glb",
    new BABYLON.Vector3(38, -0.35, 27),
    new BABYLON.Vector3(0, Math.PI * 0.85, 0),
    1.0
  );

  const arrecifeMediano = loadStructureModel(
    scene,
    "arrecife_pasaje_mediano.glb",
    new BABYLON.Vector3(-35, -0.35, 20),
    new BABYLON.Vector3(0, Math.PI * 0.3, 0),
    1.0
  );

  const arrecifeGrande = loadStructureModel(
    scene,
    "arrecife_pasaje_grande.glb",
    new BABYLON.Vector3(0, -0.35, -35),
    new BABYLON.Vector3(0, Math.PI * 1.1, 0),
    1.0
  );

  return { portal, wall, arrecifePequeno, arrecifeMediano, arrecifeGrande };
};
