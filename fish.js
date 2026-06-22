export default class Fish {
  constructor(scene, modelPath, modelFile, startPos, startRot, speed = 2.2) {
    this.scene = scene;
    this.root = new BABYLON.TransformNode("fishRoot", scene);
    this.root.position.copyFrom(startPos);
    this.root.rotation.copyFrom(startRot);
    this.speed = speed;

    // FIX: pre-alocar vector para evitar new BABYLON.Vector3 cada frame
    this._forward = new BABYLON.Vector3();

    BABYLON.SceneLoader.ImportMesh("", modelPath, modelFile, scene, (meshes) => {
      if (meshes.length === 0) {
        console.warn(`No meshes found in ${modelFile}`);
        return;
      }
      
      const fishMesh = new BABYLON.TransformNode("fishMesh", scene);
      meshes.forEach((mesh) => {
        mesh.parent = fishMesh;
      });
      fishMesh.parent = this.root;
      fishMesh.rotation.x = -Math.PI / 2;
      fishMesh.scaling = new BABYLON.Vector3(45, 45, 45);
      this.fishMesh = fishMesh;
    }, null, (scene, msg) => {
      console.error(`Error loading fish model: ${msg}`);
    });

    this.bounds = { x: 25, z: 20, y: { min: 0.5, max: 5 } };
  }

  update() {
    if (!this.root) return;

    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

    // FIX: reutilizar _forward en vez de crear un vector nuevo cada frame
    this._forward.set(
      Math.sin(this.root.rotation.y),
      0,
      Math.cos(this.root.rotation.y)
    );

    this.root.position.addInPlace(this._forward.scaleInPlace(this.speed * deltaTime));

    let bouncedX = false;
    let bouncedZ = false;

    if (this.root.position.x > this.bounds.x) {
      this.root.position.x = this.bounds.x;
      bouncedX = true;
    }
    if (this.root.position.x < -this.bounds.x) {
      this.root.position.x = -this.bounds.x;
      bouncedX = true;
    }

    if (this.root.position.z > this.bounds.z) {
      this.root.position.z = this.bounds.z;
      bouncedZ = true;
    }
    if (this.root.position.z < -this.bounds.z) {
      this.root.position.z = -this.bounds.z;
      bouncedZ = true;
    }

    this.root.position.y = BABYLON.Scalar.Clamp(
      this.root.position.y,
      this.bounds.y.min,
      this.bounds.y.max
    );

    if (bouncedX) {
      this.root.rotation.y = -this.root.rotation.y;
    }
    if (bouncedZ) {
      this.root.rotation.y = Math.PI - this.root.rotation.y;
    }
  }
}
