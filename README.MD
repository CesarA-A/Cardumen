# Proyecto: Cardumen Marino - Sistema Completo de Enjambre (Boids + Render + Shader)

## Descripción

Simulación 3D interactiva de un cardumen con comportamiento de enjambre (Boids) desarrollada con **Babylon.js**. Integra todos los entregables del semestre en un único sistema:

- Escena submarina base con entorno, iluminación y cámara panorámica (T1).
- 600+ elementos ambientales (corales, algas, rocas, arrecifes, burbujas).
- Tiburón jugable como depredador en tercera persona.
- **Flocking completo (Boids)** con 200 agentes simultáneos y parámetros ajustables en vivo.
- **Render eficiente** mediante instancing GPU (`createInstance`), manteniendo 30+ FPS con 200 agentes.
- **Shader propio** (rim/fresnel + difuso) aplicado a los agentes, coherente con la niebla y luz direccional de la escena base.
- Animación de nado independiente por agente (cada pez tiene su propia frecuencia y fase).

---

## Componentes del Sistema Final

### 1. Flocking completo — `fishSwarm.js` (30%)
- Implementa las **3 reglas de Reynolds**: separación, alineación y cohesión.
- **200 agentes** simultáneos, vecinos calculados con **spatial hashing** (evita el costo O(n²)).
- Parámetros ajustables en tiempo real vía **dat.GUI**: pesos de separación/alineación/cohesión, radio de percepción y velocidad máxima (`createFlockingGUI()` en `main.js`).

### 2. Render eficiente — `fishSwarm.js` (25%)
- Un único modelo fuente (`payaso.glb`) se carga una vez; cada agente es una **instancia GPU** (`mesh.createInstance`), no una copia de geometría.
- `fpsDisplay.js` muestra el FPS en pantalla en tiempo real (esquina superior derecha).
- Cada agente tiene su propio `TransformNode` pivote con fase y velocidad de nado distintas (`agent.swimSpeed`, `agent.phase`), por lo que **las animaciones se ven independientes** entre peces aunque compartan malla.

### 3. Iluminación avanzada — `fishShader.js` (20%)
- Shader propio escrito en GLSL (`BABYLON.ShaderMaterial`) aplicado al mesh fuente de los agentes (heredado automáticamente por todas sus instancias).
- Combina iluminación difusa (Lambert) usando la **misma dirección de luz direccional de la escena base**, rim light/Fresnel para resaltar contornos bajo el agua, y mezcla con el color de niebla de T1 para integrarse visualmente con el resto del entorno.

### 4. Calidad visual y presentación (15%)
- Escena con contexto completo: piso de arena, corales animados, algas, burbujas, arrecifes y tiburón jugable.
- Cámara orbital panorámica + controles del tiburón (mouse para dirigir, Q/E para subir/bajar, click para sprint).

---

## Estructura del Proyecto

```
Cardumen/
│
├── index.html              # Entrada: canvas, loading UI, CDN de Babylon.js + dat.GUI
├── main.js                  # Orquestación: escena, cámara, luces, loop de animación
│
├── fishSwarm.js              # Boids completo + instancing + GUI + animación independiente
├── fishShader.js              # Shader propio (GLSL) para iluminación de los agentes
├── shark.js                  # Tiburón jugable (depredador, control con mouse/teclado)
├── fish.js                    # Clase Fish individual (legado T1, base del movimiento autónomo)
│
├── environment.js             # Piso marino, burbujas, polvo de agua, algas/rocas/arrecifes
├── coral.js                   # Generador procedural de corales
├── structure.js                # Estructuras decorativas (portales, paredes, pasajes)
├── fpsDisplay.js                # Contador de FPS en pantalla
│
├── models/                      # Assets 3D (GLB): payaso.glb, Shark.glb, corales, etc.
└── README.MD
```

---

## Instalación y Uso

```bash
# Servidor local (recomendado para que carguen los modelos GLB)
python -m http.server 5500 --directory .
# Abrir http://127.0.0.1:5500
```

### Controles
- **Cámara**: arrastrar para rotar, scroll para zoom.
- **Tiburón**: mover el mouse para dirigir, `Q`/`E` para subir/bajar, click para sprint de ataque.
- **Panel dat.GUI** (arriba a la derecha): ajustar pesos de Reynolds, radio de percepción y velocidad máxima del cardumen en tiempo real.
- **FPS** (arriba a la derecha, debajo del panel): contador en vivo.

---

## Decisiones Técnicas Clave

- **Spatial hashing** en lugar de comparar cada agente contra todos los demás: con 200 agentes esto evita un cuello de botella de 40,000 comparaciones por frame.
- **Instancing en lugar de meshes duplicados**: un solo draw call comparte la geometría entre las 200 copias, lo cual es indispensable para sostener FPS estables.
- **Shader propio en el mesh fuente, no en cada instancia**: Babylon.js inyecta automáticamente la matriz de mundo por instancia (`instancesVertex`), así que el shader no necesita lógica adicional para funcionar con instancing.
- **Fase y velocidad de nado individuales** en vez de animaciones por hueso (bone/VAT) para mantener el costo de render bajo, mientras se logra variedad visual perceptible entre agentes.

---

## Próximas mejoras posibles
- [ ] LOD para corales lejanos.
- [ ] Colisiones físicas entre agentes (actualmente solo repulsión por boids).
- [ ] VAT real para animación de nado por hueso en lugar de wiggle procedural.
- [ ] Comportamiento depredador-presa entre el tiburón y el cardumen.
