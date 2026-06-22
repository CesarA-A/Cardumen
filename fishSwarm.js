import { randomBetween } from "./environment.js";

const AGENT_COUNT = 100;
const MODEL_SCALE = 45;
const BOUNDS = { x: 45, z: 38, y: { min: 0.5, max: 6.0 } };

const createAgentState = (index) => {
  return {
    root: null,
    position: new BABYLON.Vector3(
      randomBetween(-BOUNDS.x, BOUNDS.x),
      randomBetween(BOUNDS.y.min, BOUNDS.y.max), // distribuidos en toda la columna de agua
      randomBetween(-BOUNDS.z, BOUNDS.z)
    ),
    rotationY: randomBetween(0, Math.PI * 2),
    speed: randomBetween(1.8, 3.6),
    turnSpeed: randomBetween(0.35, 0.9),
    phase: index * 0.37 + randomBetween(0, Math.PI * 2),
    _forward: new BABYLON.Vector3()
  };
};

export default class FishSwarm {
  constructor(scene, count = AGENT_COUNT) {
    this.scene = scene;
    this.count = count;
    this.agents = Array.from({ length: count }, (_, index) => createAgentState(index));
    this.ready = false;

    this._loadModel();
  }

  _loadModel() {
    BABYLON.SceneLoader.ImportMesh("", "models/", "payaso.glb", this.scene, (meshes) => {
      const sourceMeshes = meshes.filter((mesh) => mesh instanceof BABYLON.Mesh);

      if (sourceMeshes.length === 0) {
        console.warn("No se encontraron meshes para crear el cardumen instanciado.");
        return;
      }

      sourceMeshes.forEach((mesh) => {
        mesh.isVisible = false;
      });

      this.agents.forEach((agent, agentIndex) => {
        // Nodo de movimiento — SIN rotation.x para que Y funcione correctamente
        const agentRoot = new BABYLON.TransformNode(`fishAgent-${agentIndex}`, this.scene);
        agentRoot.position.copyFrom(agent.position);
        agentRoot.rotation.y = agent.rotationY;
        agent.root = agentRoot;

        // Nodo hijo que corrige la orientación del modelo sin afectar el movimiento
        const modelPivot = new BABYLON.TransformNode(`fishModel-${agentIndex}`, this.scene);
        modelPivot.parent = agentRoot;
        modelPivot.rotation.x = -Math.PI / 2;
        modelPivot.scaling.setAll(MODEL_SCALE);

        sourceMeshes.forEach((mesh, meshIndex) => {
          const instance = mesh.createInstance(`fish-${agentIndex}-${meshIndex}`);
          instance.parent = modelPivot;
          instance.position.copyFrom(mesh.position);
          instance.rotation.copyFrom(mesh.rotation);
          instance.scaling.copyFrom(mesh.scaling);
        });
      });

      this.ready = true;
    }, null, (_scene, message) => {
      console.error(`No se pudo cargar payaso.glb para instancing: ${message}`);
    });
  }

  update(time, deltaTime) {
    if (!this.ready) return;

    this.agents.forEach((agent) => {
      const wandering = Math.sin(time * agent.turnSpeed + agent.phase) * 0.45;
      agent.rotationY += wandering * deltaTime;

      agent._forward.set(
        Math.sin(agent.rotationY),
        0,
        Math.cos(agent.rotationY)
      );
      agent.position.addInPlace(agent._forward.scaleInPlace(agent.speed * deltaTime));

      // Movimiento vertical ondulante más amplio
      agent.position.y += Math.sin(time * 0.8 + agent.phase) * 0.4 * deltaTime;

      if (agent.position.x > BOUNDS.x || agent.position.x < -BOUNDS.x) {
        agent.position.x = BABYLON.Scalar.Clamp(agent.position.x, -BOUNDS.x, BOUNDS.x);
        agent.rotationY = -agent.rotationY;
      }

      if (agent.position.z > BOUNDS.z || agent.position.z < -BOUNDS.z) {
        agent.position.z = BABYLON.Scalar.Clamp(agent.position.z, -BOUNDS.z, BOUNDS.z);
        agent.rotationY = Math.PI - agent.rotationY;
      }

      agent.position.y = BABYLON.Scalar.Clamp(agent.position.y, BOUNDS.y.min, BOUNDS.y.max);

      agent.root.position.copyFrom(agent.position);
      agent.root.rotation.y = agent.rotationY;
      agent.root.rotation.z = Math.sin(time * 2 + agent.phase) * 0.04;
    });
  }
}