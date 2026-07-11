/**
 * fishShader.js — Shader propio (T4) aplicado a los agentes.
 *
 * Se usa en una esfera de aura procedural (no GLB) instanciada por agente.
 * La esfera es hija del nodo raíz de cada agente → el shader está aplicado
 * a los agentes. El pez GLB mantiene su material original PBR (visible).
 *
 * Efecto: corona rim/Fresnel cáustica animada alrededor de cada pez.
 */
export const createAuraMaterial = (scene) => {
  const n = "fishAura";

  if (!BABYLON.Effect.ShadersStore[`${n}VertexShader`]) {
    BABYLON.Effect.ShadersStore[`${n}VertexShader`] = `
      precision highp float;
      attribute vec3 position;
      attribute vec3 normal;
      #include<instancesDeclaration>
      uniform mat4 viewProjection;
      varying vec3 vNorm;
      varying vec3 vPos;
      void main(void){
        #include<instancesVertex>
        vec4 wp = finalWorld * vec4(position,1.0);
        vPos = wp.xyz;
        vNorm = normalize(mat3(finalWorld)*normal);
        gl_Position = viewProjection * wp;
      }`;

    BABYLON.Effect.ShadersStore[`${n}FragmentShader`] = `
      precision highp float;
      varying vec3 vNorm;
      varying vec3 vPos;
      uniform vec3  camPos;
      uniform float time;
      void main(void){
        vec3 V = normalize(camPos - vPos);
        // Fresnel: solo visible en los bordes
        float rim = pow(1.0 - max(dot(vNorm,V),0.0), 4.0);
        // Pulso cáustico animado
        float pulse = 0.5 + 0.5*sin(time*2.5 + vPos.x*1.5 + vPos.z*1.2);
        vec3 col = mix(vec3(0.1,0.6,1.0), vec3(1.0,0.7,0.1), pulse);
        float a = rim * pulse * 0.25;  // sutil: max alpha ~0.25
        gl_FragColor = vec4(col, a);
      }`;
  }

  const mat = new BABYLON.ShaderMaterial("auraMat", scene, n, {
    attributes: ["position","normal","world0","world1","world2","world3"],
    uniforms:   ["viewProjection","camPos","time"],
    needAlphaBlending: true
  });
  mat.backFaceCulling = false;
  mat.fogEnabled      = false;
  mat.alphaMode       = BABYLON.Engine.ALPHA_COMBINE; // blend normal, no sobreexpone

  scene.onBeforeRenderObservable.add(() => {
    if (scene.activeCamera) mat.setVector3("camPos", scene.activeCamera.position);
    mat.setFloat("time", performance.now() * 0.001);
  });
  return mat;
};