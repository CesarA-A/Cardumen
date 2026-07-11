export const randomBetween = (min, max) => min + Math.random() * (max - min);

export const createSeaFloor = (scene) => {
  const seaFloor = BABYLON.MeshBuilder.CreateGround(
    "seaFloor",
    { width: 340, height: 280, subdivisions: 60 },
    scene
  );
  seaFloor.position.y = -0.9;

  const positions = seaFloor.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    positions[i + 1] = Math.sin(x * 0.32) * 0.08 + Math.cos(z * 0.27) * 0.07;
  }
  seaFloor.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
  seaFloor.refreshBoundingInfo();

  // Shader propio (T4): piso marino con cáusticas animadas y rim de niebla
  const seaFloorShaderName = "seaFloorCaustics";
  if (!BABYLON.Effect.ShadersStore[`${seaFloorShaderName}VertexShader`]) {
    BABYLON.Effect.ShadersStore[`${seaFloorShaderName}VertexShader`] = `
      precision highp float;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      uniform mat4 worldViewProjection;
      uniform mat4 world;
      varying vec2 vUV;
      varying vec3 vNormalW;
      varying vec3 vPositionW;
      void main(void) {
        vec4 wp = world * vec4(position, 1.0);
        vPositionW = wp.xyz;
        vNormalW   = normalize(mat3(world) * normal);
        vUV        = uv;
        gl_Position = worldViewProjection * vec4(position, 1.0);
      }
    `;
    BABYLON.Effect.ShadersStore[`${seaFloorShaderName}FragmentShader`] = `
      precision highp float;
      varying vec2 vUV;
      varying vec3 vNormalW;
      varying vec3 vPositionW;
      uniform float time;
      uniform vec3 fogColor;
      void main(void) {
        // Textura de arena procedural
        float grain = fract(sin(dot(vUV * 80.0, vec2(127.1, 311.7))) * 43758.5);
        vec3 sandColor = vec3(0.76, 0.69, 0.56) + grain * 0.06;

        // Cáusticas animadas (ondas de luz que rebotan en la superficie)
        float cx  = vPositionW.x * 0.18 + time * 0.22;
        float cz  = vPositionW.z * 0.14 + time * 0.17;
        float c1  = sin(cx + sin(cz * 1.3)) * sin(cz + sin(cx * 0.9));
        float cx2 = vPositionW.x * 0.13 - time * 0.19;
        float cz2 = vPositionW.z * 0.21 + time * 0.12;
        float c2  = sin(cx2 * 1.1 + cz2) * sin(cz2 * 0.85 - cx2);
        float caustic = clamp((c1 * 0.5 + c2 * 0.5) * 0.5 + 0.5, 0.0, 1.0);
        caustic = pow(caustic, 2.5) * 0.35;

        // Iluminación Lambert básica
        vec3 L = normalize(vec3(-1.0, -2.0, -1.0));
        float NdotL = max(dot(vNormalW, -L), 0.0);
        float light  = mix(0.3, 1.0, NdotL);

        vec3 litColor = sandColor * light + vec3(0.5, 0.82, 0.95) * caustic;
        // Integración con niebla de la escena
        vec3 final = mix(litColor, fogColor, 0.08);
        gl_FragColor = vec4(final, 1.0);
      }
    `;
  }

  const material = new BABYLON.ShaderMaterial(seaFloorShaderName, scene, seaFloorShaderName, {
    attributes: ["position", "normal", "uv"],
    uniforms: ["worldViewProjection", "world", "time", "fogColor"],
    needAlphaBlending: false
  });
  material.fogEnabled = false;
  material.setColor3("fogColor", new BABYLON.Color3(0.05, 0.28, 0.42));
  scene.onBeforeRenderObservable.add(() => {
    material.setFloat("time", performance.now() * 0.001);
  });
  seaFloor.material = material;

  return seaFloor;
};

export const createWaterDust = (scene) => {
  const dust = [];
  const material = new BABYLON.StandardMaterial("waterDustMaterial", scene);
  material.diffuseColor = new BABYLON.Color3(0.65, 0.9, 0.95);
  material.emissiveColor = new BABYLON.Color3(0.08, 0.16, 0.18);
  material.alpha = 0.22;

  for (let i = 0; i < 35; i++) {
    const speck = BABYLON.MeshBuilder.CreateSphere(
      `water-dust-${i}`,
      { diameter: randomBetween(0.025, 0.09), segments: 6 },
      scene
    );
    speck.position.set(randomBetween(-60, 60), randomBetween(0.2, 11), randomBetween(-46, 46));
    speck.material = material;
    dust.push({
      mesh: speck,
      // FIX: guardar componentes escalares en vez del Vector3 para evitar .scale() cada frame
      driftX: randomBetween(-0.03, 0.03),
      driftY: randomBetween(0.015, 0.06),
      driftZ: randomBetween(-0.02, 0.02),
      phase: randomBetween(0, Math.PI * 2)
    });
  }

  return dust;
};

export const createBubbles = (scene) => {
  const bubbles = [];
  const material = new BABYLON.StandardMaterial("bubbleMaterial", scene);
  material.diffuseColor = new BABYLON.Color3(0.72, 0.94, 1);
  material.emissiveColor = new BABYLON.Color3(0.08, 0.2, 0.23);
  material.alpha = 0.42;
  material.specularColor = new BABYLON.Color3(0.45, 0.75, 0.8);

  for (let i = 0; i < 45; i++) {
    const bubble = BABYLON.MeshBuilder.CreateSphere(
      `bubble-${i}`,
      { diameter: randomBetween(0.05, 0.25), segments: 10 },
      scene
    );
    bubble.position.set(randomBetween(-95, 95), randomBetween(-0.2, 11.5), randomBetween(-85, 85));
    bubble.material = material;
    bubbles.push({
      mesh: bubble,
      speed: randomBetween(0.12, 0.55),
      sway: randomBetween(0.15, 1.0),
      phase: randomBetween(0, Math.PI * 2)
    });
  }

  return bubbles;
};

export const createSeaLifeDetails = (scene) => {
  const details = { seaweed: [], rocks: [], reefs: [] };

  const seaweedMaterial = new BABYLON.StandardMaterial("seaweedMaterial", scene);
  seaweedMaterial.diffuseColor = new BABYLON.Color3(0.08, 0.34, 0.22);
  seaweedMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

  const rockMaterials = [
    new BABYLON.StandardMaterial("rockMaterial1", scene),
    new BABYLON.StandardMaterial("rockMaterial2", scene),
    new BABYLON.StandardMaterial("rockMaterial3", scene),
    new BABYLON.StandardMaterial("rockMaterial4", scene),
  ];
  rockMaterials[0].diffuseColor = new BABYLON.Color3(0.08, 0.13, 0.14);
  rockMaterials[1].diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.12);
  rockMaterials[2].diffuseColor = new BABYLON.Color3(0.12, 0.18, 0.16);
  rockMaterials[3].diffuseColor = new BABYLON.Color3(0.18, 0.12, 0.08);
  rockMaterials.forEach((m) => (m.specularColor = new BABYLON.Color3(0, 0, 0)));

  const seaweedMaterial2 = new BABYLON.StandardMaterial("seaweedMaterial2", scene);
  seaweedMaterial2.diffuseColor = new BABYLON.Color3(0.1, 0.42, 0.18);
  seaweedMaterial2.specularColor = new BABYLON.Color3(0, 0, 0);

  const seaweedMaterial3 = new BABYLON.StandardMaterial("seaweedMaterial3", scene);
  seaweedMaterial3.diffuseColor = new BABYLON.Color3(0.05, 0.28, 0.15);
  seaweedMaterial3.specularColor = new BABYLON.Color3(0, 0, 0);

  const reefMaterials = [
    new BABYLON.StandardMaterial("reefCoralMuted", scene),
    new BABYLON.StandardMaterial("reefCoralGreen", scene),
    new BABYLON.StandardMaterial("reefCoralRose", scene)
  ];
  reefMaterials[0].diffuseColor = new BABYLON.Color3(0.22, 0.38, 0.34);
  reefMaterials[1].diffuseColor = new BABYLON.Color3(0.12, 0.32, 0.24);
  reefMaterials[2].diffuseColor = new BABYLON.Color3(0.42, 0.22, 0.25);
  reefMaterials.forEach((m) => (m.specularColor = new BABYLON.Color3(0.02, 0.03, 0.03)));

  const createReefCluster = (cluster, centerX, centerZ, reefScale) => {
    const rockCount  = Math.round(randomBetween(4, 8)  * reefScale);
    const coralCount = Math.round(randomBetween(5, 10) * reefScale);
    const spreadX    = randomBetween(1.4, 2.6) * reefScale;
    const spreadZ    = randomBetween(1.0, 2.3) * reefScale;

    for (let i = 0; i < rockCount; i++) {
      const reefRock = BABYLON.MeshBuilder.CreateSphere(
        `reef-rock-${cluster}-${i}`,
        { diameter: randomBetween(0.35, 1.25) * reefScale, segments: 9 },
        scene
      );
      reefRock.position.set(
        centerX + randomBetween(-spreadX, spreadX),
        -0.78,
        centerZ + randomBetween(-spreadZ, spreadZ)
      );
      reefRock.scaling.set(randomBetween(0.8, 1.6), randomBetween(0.18, 0.55), randomBetween(0.7, 1.4));
      reefRock.rotation.y = randomBetween(0, Math.PI);
      reefRock.material = rockMaterials[Math.floor(Math.random() * rockMaterials.length)];
      details.reefs.push(reefRock);
    }

    for (let i = 0; i < coralCount; i++) {
      const height = randomBetween(0.25, 1.05) * reefScale;
      const coral  = BABYLON.MeshBuilder.CreateCylinder(
        `reef-coral-${cluster}-${i}`,
        {
          height,
          diameterTop:    randomBetween(0.035, 0.16) * reefScale,
          diameterBottom: randomBetween(0.09,  0.3)  * reefScale,
          tessellation:   Math.round(randomBetween(5, 8))
        },
        scene
      );
      coral.position.set(
        centerX + randomBetween(-spreadX * 0.9, spreadX * 0.9),
        -0.77 + height * 0.5,
        centerZ + randomBetween(-spreadZ * 0.9, spreadZ * 0.9)
      );
      coral.rotation.z = randomBetween(-0.38, 0.38);
      coral.rotation.x = randomBetween(-0.28, 0.28);
      coral.scaling.x  = randomBetween(0.75, 1.35);
      coral.scaling.z  = randomBetween(0.7,  1.25);
      coral.material   = reefMaterials[Math.floor(randomBetween(0, reefMaterials.length))];
      details.reefs.push(coral);
    }
  };

  const plantMats = [
    seaweedMaterial, seaweedMaterial2, seaweedMaterial3,
    (() => { const m = new BABYLON.StandardMaterial("plantDark", scene); m.diffuseColor = new BABYLON.Color3(0.04, 0.20, 0.10); m.specularColor = new BABYLON.Color3(0,0,0); return m; })(),
    (() => { const m = new BABYLON.StandardMaterial("plantBright", scene); m.diffuseColor = new BABYLON.Color3(0.14, 0.52, 0.26); m.specularColor = new BABYLON.Color3(0,0,0); return m; })()
  ];

  const makePlant = (idx, hScale, rScale, tess) => {
    const bx = randomBetween(-90, 90), bz = randomBetween(-80, 80);
    const h  = randomBetween(0.4, 2.6) * hScale;
    const pts = [
      new BABYLON.Vector3(bx, -0.55, bz),
      new BABYLON.Vector3(bx + randomBetween(-0.3,0.3)*hScale, -0.55+h*0.35, bz + randomBetween(-0.3,0.3)*hScale),
      new BABYLON.Vector3(bx + randomBetween(-0.5,0.5)*hScale, -0.55+h*0.7,  bz + randomBetween(-0.5,0.5)*hScale),
      new BABYLON.Vector3(bx + randomBetween(-0.4,0.4)*hScale, -0.55+h,       bz + randomBetween(-0.4,0.4)*hScale)
    ];
    const blade = BABYLON.MeshBuilder.CreateTube(`plant-${idx}`,
      { path: pts, radius: randomBetween(0.015, 0.055)*rScale, tessellation: tess }, scene);
    blade.material = plantMats[Math.floor(Math.random() * plantMats.length)];
    details.seaweed.push({ mesh: blade, phase: randomBetween(0, Math.PI*2) });
  };

  for (let i = 0;   i < 70;  i++) makePlant(i,   0.45, 0.55, 5); // pequeñas y finas
  for (let i = 70;  i < 130; i++) makePlant(i,   0.95, 1.0,  6); // medianas
  for (let i = 130; i < 165; i++) makePlant(i,   1.8,  1.5,  7); // grandes
  for (let i = 165; i < 185; i++) makePlant(i,   3.0,  2.0,  8); // gigantes

  for (let i = 0; i < 35; i++) {
    const rock = BABYLON.MeshBuilder.CreateSphere(
      `rock-${i}`,
      { diameter: randomBetween(0.2, 1.6), segments: 8 },
      scene
    );
    rock.position.set(randomBetween(-95, 95), -0.55, randomBetween(-85, 85));
    rock.scaling.y  = randomBetween(0.1, 0.5);
    rock.material   = rockMaterials[Math.floor(Math.random() * rockMaterials.length)];
    details.rocks.push(rock);
  }

  const reefCenters = [
    [-72, -57, 1.4], [11, -65, 1.1], [63, -53, 1.3],
    [-84, -15, 0.8], [-19, -30, 1.1], [66, -27, 0.9],
    [-68, 27, 1.2], [0, 0, 1.0], [76, 0, 1.1],
    [-34, 59, 1.0], [65, 63, 1.1], [23, 76, 0.9]
  ];

  reefCenters.forEach(([centerX, centerZ, scale], cluster) => {
    createReefCluster(cluster, centerX, centerZ, scale * randomBetween(0.85, 1.25));
  });

  return details;
};

export const createUnderwaterEnvironment = (scene) => ({
  seaFloor:  createSeaFloor(scene),
  waterDust: createWaterDust(scene),
  bubbles:   createBubbles(scene)
});

export const updateUnderwaterEnvironment = ({ waterDust, bubbles }, scene, time, deltaTime) => {
  // FIX: usar componentes escalares directamente en vez de drift.scale(deltaTime) que crea un Vector3 nuevo
  for (let i = 0; i < waterDust.length; i++) {
    const { mesh, driftX, driftY, driftZ, phase } = waterDust[i];
    mesh.position.x += driftX * deltaTime + Math.sin(time * 0.7 + phase) * 0.004;
    mesh.position.y += driftY * deltaTime;
    mesh.position.z += driftZ * deltaTime + Math.cos(time * 0.6 + phase) * 0.003;

    if (mesh.position.y > 11.6 || Math.abs(mesh.position.x) > 64 || Math.abs(mesh.position.z) > 50) {
      mesh.position.y = randomBetween(0.1, 1.2);
      mesh.position.x = randomBetween(-56, 56);
      mesh.position.z = randomBetween(-42, 42);
    }
  }

  for (let i = 0; i < bubbles.length; i++) {
    const { mesh, speed, sway, phase } = bubbles[i];
    mesh.position.y += speed * deltaTime;
    mesh.position.x += Math.sin(time * 1.2 + phase) * sway * 0.003;
    mesh.position.z += Math.cos(time * 0.9 + phase) * sway * 0.002;

    if (mesh.position.y > 11.7) {
      mesh.position.y = randomBetween(-0.4, 0.3);
      mesh.position.x = randomBetween(-64, 64);
      mesh.position.z = randomBetween(-85, 85);
    }
  }
};