export const randomBetween = (min, max) => min + Math.random() * (max - min);

export const createSeaFloor = (scene) => {
  const seaFloor = BABYLON.MeshBuilder.CreateGround(
    "seaFloor",
    { width: 180, height: 150, subdivisions: 44 },
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

  const material = new BABYLON.StandardMaterial("seaFloorMaterial", scene);
  const sandTexture = new BABYLON.DynamicTexture("seaFloorSandTexture", { width: 512, height: 512 }, scene);
  const context = sandTexture.getContext();
  const imageData = context.createImageData(512, 512);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % 512;
    const y = Math.floor(i / 4 / 512);
    const wave = Math.sin(x * 0.05 + Math.sin(y * 0.025) * 2.5) * 10;
    const grain = Math.random() * 22;
    const value = 170 + wave + grain;
    imageData.data[i] = value;
    imageData.data[i + 1] = value * 0.9;
    imageData.data[i + 2] = value * 0.68;
    imageData.data[i + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  sandTexture.update();
  sandTexture.uScale = 18;
  sandTexture.vScale = 15;

  material.diffuseColor = new BABYLON.Color3(0.75, 0.68, 0.55);
  material.diffuseTexture = sandTexture;
  material.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.1);
  material.specularColor = new BABYLON.Color3(0.3, 0.25, 0.2);
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
    speck.position.set(randomBetween(-32, 32), randomBetween(0.2, 6), randomBetween(-24, 24));
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
    bubble.position.set(randomBetween(-50, 50), randomBetween(-0.2, 6.5), randomBetween(-45, 45));
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

  for (let i = 0; i < 40; i++) {
    const baseX  = randomBetween(-50, 50);
    const baseZ  = randomBetween(-45, 45);
    const height = randomBetween(0.6, 2.5);
    const points = [
      new BABYLON.Vector3(baseX, -0.55, baseZ),
      new BABYLON.Vector3(baseX + randomBetween(-0.2, 0.2), -0.55 + height * 0.4, baseZ + randomBetween(-0.2, 0.2)),
      new BABYLON.Vector3(baseX + randomBetween(-0.3, 0.3), -0.55 + height,        baseZ + randomBetween(-0.3, 0.3))
    ];
    const blade = BABYLON.MeshBuilder.CreateTube(
      `seaweed-${i}`,
      { path: points, radius: randomBetween(0.02, 0.05), tessellation: 6 },
      scene
    );
    const seaweedMats = [seaweedMaterial, seaweedMaterial2, seaweedMaterial3];
    blade.material = seaweedMats[Math.floor(i % seaweedMats.length)];
    details.seaweed.push({ mesh: blade, phase: randomBetween(0, Math.PI * 2) });
  }

  for (let i = 0; i < 35; i++) {
    const rock = BABYLON.MeshBuilder.CreateSphere(
      `rock-${i}`,
      { diameter: randomBetween(0.2, 1.6), segments: 8 },
      scene
    );
    rock.position.set(randomBetween(-50, 50), -0.55, randomBetween(-45, 45));
    rock.scaling.y  = randomBetween(0.1, 0.5);
    rock.material   = rockMaterials[Math.floor(Math.random() * rockMaterials.length)];
    details.rocks.push(rock);
  }

  const reefCenters = [
    [-38, -30, 1.4], [6, -34, 1.1], [33, -28, 1.3],
    [-44, -8, 0.8], [-10, -16, 1.1], [35, -14, 0.9],
    [-36, 14, 1.2], [0, 0, 1.0], [40, 0, 1.1],
    [-18, 31, 1.0], [34, 33, 1.1], [12, 40, 0.9]
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

    if (mesh.position.y > 6.6 || Math.abs(mesh.position.x) > 34 || Math.abs(mesh.position.z) > 26) {
      mesh.position.y = randomBetween(0.1, 1.2);
      mesh.position.x = randomBetween(-28, 28);
      mesh.position.z = randomBetween(-22, 22);
    }
  }

  for (let i = 0; i < bubbles.length; i++) {
    const { mesh, speed, sway, phase } = bubbles[i];
    mesh.position.y += speed * deltaTime;
    mesh.position.x += Math.sin(time * 1.2 + phase) * sway * 0.003;
    mesh.position.z += Math.cos(time * 0.9 + phase) * sway * 0.002;

    if (mesh.position.y > 6.7) {
      mesh.position.y = randomBetween(-0.4, 0.3);
      mesh.position.x = randomBetween(-34, 34);
      mesh.position.z = randomBetween(-26, 26);
    }
  }
};
