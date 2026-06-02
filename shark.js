/**
 * Clase Shark — depredador controlado por el jugador.
 *
 * Controles:
 *  - Mover el cursor  → el tiburón gira suavemente hacia donde apunta el mouse
 *  - Click izquierdo  → sprint de ataque (velocidad x2.5 durante ~1 seg)
 *
 * La cámara en tercera persona se configura en main.js apuntando a shark.root.
 */
export default class Shark {
  /**
   * @param {BABYLON.Scene} scene
   * @param {string} modelPath   - ej. "models/"
   * @param {BABYLON.Vector3} startPos
   * @param {number} speed       - velocidad base (unidades/seg)
   */
  constructor(scene, modelPath, startPos, speed = 4.5) {
    this.scene  = scene;
    this.speed  = speed;
    this.baseSpeed = speed;

    // ── Nodo raíz ──────────────────────────────────────────────────────────
    this.root = new BABYLON.TransformNode("sharkRoot", scene);
    this.root.position.copyFrom(startPos);
    this.root.rotation.y = 0;

    // ── Estado de sprint ───────────────────────────────────────────────────
    this._sprinting    = false;
    this._sprintTimer  = 0;
    this._sprintDuration = 1.0; // segundos

    // ── Dirección objetivo (ángulo Y) ──────────────────────────────────────
    this._targetRotY = 0;

    // ── Plano de picking (Y variable, se actualiza cada frame) ─────────────
    this._pickPlane = BABYLON.MeshBuilder.CreatePlane(
      "sharkPickPlane",
      { size: 300 },
      scene
    );
    this._pickPlane.rotation.x = Math.PI / 2;
    this._pickPlane.position.y = startPos.y;
    this._pickPlane.isPickable  = true;
    this._pickPlane.isVisible   = false;

    // ── Límites del escenario ──────────────────────────────────────────────
    this.bounds = { x: 42, z: 36, y: { min: 0.5, max: 6.5 } };

    // ── Cargar modelo ──────────────────────────────────────────────────────
    BABYLON.SceneLoader.ImportMesh("", modelPath, "Shark.glb", scene, (meshes) => {
      const pivot = new BABYLON.TransformNode("sharkMesh", scene);
      meshes.forEach((m) => (m.parent = pivot));
      pivot.parent    = this.root;
      pivot.rotation.y = Math.PI; // corregir orientación del modelo
      pivot.scaling.setAll(0.018);
      this.sharkMesh = pivot;
    }, null, () => {
      // Fallback si no carga el modelo: crear un tiburón simple
      console.warn("Shark.glb no cargó, usando modelo simple");
      this._createFallbackShark();
    });

    // ── Eventos ────────────────────────────────────────────────────────────
    this._registerEvents();
  }

  _createFallbackShark() {
    // Crear un tiburón simple visible
    const pivot = new BABYLON.TransformNode("sharkMesh", this.scene);
    
    // Cuerpo principal (elipsoide)
    const body = BABYLON.MeshBuilder.CreateBox("sharkBody", { width: 1, height: 0.6, depth: 2 }, this.scene);
    const bodyMat = new BABYLON.StandardMaterial("sharkBodyMat", this.scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.35, 0.45, 0.5);
    bodyMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    body.material = bodyMat;
    body.parent = pivot;
    body.position.z = 0;
    
    // Cabeza (cilindro redondeado)
    const head = BABYLON.MeshBuilder.CreateSphere("sharkHead", { diameter: 0.8, segments: 16 }, this.scene);
    head.position.z = 1.2;
    head.material = bodyMat;
    head.parent = pivot;
    
    // Aleta dorsal
    const fin = BABYLON.MeshBuilder.CreateBox("sharkFin", { width: 0.15, height: 0.8, depth: 0.6 }, this.scene);
    fin.position.set(0, 0.6, 0.2);
    fin.material = bodyMat;
    fin.parent = pivot;
    
    // Ojos (pequeñas esferas)
    const eyeL = BABYLON.MeshBuilder.CreateSphere("eyeL", { diameter: 0.15, segments: 8 }, this.scene);
    const eyeR = BABYLON.MeshBuilder.CreateSphere("eyeR", { diameter: 0.15, segments: 8 }, this.scene);
    const eyeMat = new BABYLON.StandardMaterial("eyeMat", this.scene);
    eyeMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    eyeL.material = eyeMat;
    eyeR.material = eyeMat;
    eyeL.position.set(-0.25, 0.15, 1.3);
    eyeR.position.set(0.25, 0.15, 1.3);
    eyeL.parent = pivot;
    eyeR.parent = pivot;
    
    pivot.parent = this.root;
    pivot.scaling.setAll(3);
    pivot.rotation.z = 0;
    this.sharkMesh = pivot;
    console.log("Tiburón fallback creado exitosamente");
  }

  _registerEvents() {
    const canvas = this.scene.getEngine().getRenderingCanvas();

    // Movimiento del cursor → calcular ángulo objetivo
    this._onPointerMove = (evt) => {
      const pickResult = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY,
        (mesh) => mesh === this._pickPlane
      );
      if (pickResult.hit) {
        const dx = pickResult.pickedPoint.x - this.root.position.x;
        const dz = pickResult.pickedPoint.z - this.root.position.z;
        if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
          this._targetRotY = Math.atan2(dx, dz);
        }
      }
    };

    // Click → sprint / ataque
    this._onPointerDown = () => {
      if (!this._sprinting) {
        this._sprinting   = true;
        this._sprintTimer = 0;
        this.speed        = this.baseSpeed * 2.5;
      }
    };

    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        this._onPointerMove();
      }
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        this._onPointerDown();
      }
    });
  }

  update() {
    if (!this.root) return;

    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
    const time      = performance.now() * 0.001;

    // ── Sprint timer ───────────────────────────────────────────────────────
    if (this._sprinting) {
      this._sprintTimer += deltaTime;
      if (this._sprintTimer >= this._sprintDuration) {
        this._sprinting = false;
        this.speed      = this.baseSpeed;
      }
    }

    // ── Girar suavemente hacia el cursor ───────────────────────────────────
    // Interpolación angular (shortest path)
    let diff = this._targetRotY - this.root.rotation.y;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.root.rotation.y += diff * Math.min(deltaTime * 5, 1);

    // ── Avanzar en la dirección actual ─────────────────────────────────────
    const forward = new BABYLON.Vector3(
      Math.sin(this.root.rotation.y),
      0,
      Math.cos(this.root.rotation.y)
    );
    this.root.position.addInPlace(forward.scale(this.speed * deltaTime));

    // ── Mantener el plano de picking a la misma altura que el tiburón ──────
    this._pickPlane.position.y = this.root.position.y;

    // ── Límites ────────────────────────────────────────────────────────────
    this.root.position.x = BABYLON.Scalar.Clamp(this.root.position.x, -this.bounds.x, this.bounds.x);
    this.root.position.z = BABYLON.Scalar.Clamp(this.root.position.z, -this.bounds.z, this.bounds.z);
    this.root.position.y = BABYLON.Scalar.Clamp(this.root.position.y, this.bounds.y.min, this.bounds.y.max);

    // ── Balanceo corporal ──────────────────────────────────────────────────
    this.root.rotation.z = Math.sin(time * 1.8) * 0.04;
  }

  /** Posición actual del tiburón (para que la cámara lo siga) */
  get position() {
    return this.root.position;
  }

  /** Rotación Y actual (para orientar la cámara detrás) */
  get rotationY() {
    return this.root.rotation.y;
  }
}
