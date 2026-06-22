# Proyecto: Cardumen Marino - Simulación de Enjambre de Peces Autónomos

## Descripción

Simulación interactiva en 3D de un enjambre de peces (cardumen) desarrollada con JavaScript y **Babylon.js**.  
La simulación presenta un entorno submarino detallado y realista con 15 peces autónomos que se desplazan de forma independiente dentro de una escena poblada con 600+ elementos ambientales (corales procedurales, algas, rocas, arrecifes, burbujas).

El usuario puede explorar la escena mediante controles de cámara panorámica (zoom y rotación), observando el movimiento autónomo del cardumen en un ecosistema marino visualmente inmersivo.

**Estado del Proyecto:** Entrega T1 completada - Base scene con agentes autónomos y entorno ambiental denso.

---

# Objetivos del Proyecto (T1 - Base Scene)

## Completado ✓
- Escena base con cámara, luces e iluminación apropiadas
- **5 instancias del agente (peces)** con posiciones y orientaciones iniciales distintas
- Movimiento autónomo: avance en dirección local + rebote/reaparición al salir de límites
- Entorno submarino coherente con 600+ elementos ambientales
- Cámara panorámica interactiva (orbita con zoom)

## Próximas Entregas (T2-T6)
- Comportamiento colectivo (flocking): separación, cohesión, alineación
- Colisiones entre agentes
- Instancing de alta performance
- Comportamientos complejos (depredador-presa, reproducción)

---

# Características Implementadas

## Agentes (Cardumen)
- **5 peces (payaso)** con movimiento autónomo independiente
- Cada pez tiene: posición inicial, orientación única, velocidad variable
- Movimiento basado en velocidad + delta time (frame-independent)
- Física de rebote: invierte velocidad al salir de límites, rota según dirección
- *Nota: Infraestructura lista para 15 instancias; actualmente 5 renderizadas*

## Ambiente Submarino Detallado
- **600 corales** generados proceduralmente (4 tipos de GLB models)
- **150 algas** con múltiples tonos verdes (swaying/oscilación)
- **120 rocas** en 4 colores diferentes (gris, marrón, azulado)
- **150 burbujas** flotantes con movimiento ascendente
- **27+ arrecifes** distribuidos estratégicamente
- **Fondo marino** con textura de arena
- **Sistema de agua** con material interactivo (ondas, reflejos)

## Controles de Cámara
- Orbita alrededor del centro de la escena
- Zoom con rueda del mouse
- Rotación suave panorámica

---

# Tecnologías Utilizadas

- **JavaScript (ES6+)** - Lógica y control
- **Babylon.js 5.0+** - Engine gráfico 3D y renderizado
- **HTML5 Canvas** - Renderización
- **WebGL 2.0** - Aceleración GPU
- **GLTF/GLB** - Importación de modelos 3D
- **CSS3** - Estilos y UI
- **Node.js** - Servidor local (opcional)

---

# Estructura del Proyecto

```
Cardumen/
│
├── index.html                 # Punto de entrada (fullscreen canvas + loading UI)
├── main.js                    # Orquestación principal: escena, cámara, animación
├── fish.js                    # Clase Fish: movimiento autónomo + física de rebote
│
├── environment.js             # Sistema de ambiente: algas, rocas, burbujas, arrecifes
├── coral.js                   # Generador procedural de 600 corales (4 tipos)
├── structure.js               # Decorativos estructurales (paredes, pilares)
│
├── models/                    # Assets 3D (GLB)
│   ├── payaso.glb            # Modelo de pez (cardumen)
│   ├── Coral.glb
│   ├── Orange Coral.glb
│   ├── Sea anemone.glb
│   └── ... (12+ modelos marinos)
│
├── textures/                  # Texturas (arena, agua, etc.)
├── assets/                    # Recursos adicionales
├── utils/                     # Funciones utilitarias
│
└── README.MD                  # Este archivo
```

---

# Instalación y Uso

## Requisitos
- Navegador moderno con soporte WebGL 2.0 (Chrome, Firefox, Edge, Safari)
- Conexión a Internet (para cargar Babylon.js CDN)

## Inicio Rápido

### Opción 1: Servidor Local (Recomendado)
```bash
# Con Python 3
python -m http.server 5500 --directory .

# Con Node.js (si tienes http-server)
npx http-server -p 5500

# Luego abre http://127.0.0.1:5500 en el navegador
```

### Opción 2: Abrir directamente
- Haz doble clic en `index.html` (nota: algunos modelos pueden no cargar sin servidor)

## Controles
- **Zoom**: Rueda del mouse hacia arriba/abajo
- **Rotación**: Arrastra con el mouse para rotar la cámara
- **Exploración**: Pan libre alrededor de la escena marina

---

# Especificaciones Técnicas

## Rendimiento
- **Entidades totales**: ~1,085+ (600 corales + 150 algas + 120 rocas + 150 burbujas + 27 arrecifes + 5 peces activos)
- **Tamaño escena**: ±50 unidades (X) × ±45 unidades (Z) × 0.5-6 unidades (Y)
- **Límites de peces**: Rebotan automáticamente dentro de {x: ±25, z: ±20, y: 0.5-5}

## Física del Agente (Fish)
```javascript
// Movimiento autónomo
velocity = speed * deltaTime * forwardDirection
position += velocity

// Rebote en límites
if (position > bound) {
  velocity = -velocity
  rotation.y += Math.PI  // Gira 180°
}
```

## Animaciones
- **Corales**: Oscilación suave (sway) con fase aleatoria
- **Algas**: Rotación en Z-axis simulando viento marino
- **Burbujas**: Movimiento ascendente continuo con wobble lateral
- **Peces**: Traslación + rotación según velocidad

---

# Módulos Principales

## fish.js
Clase `Fish` que implementa agentes autónomos:
- Constructor: posición, modelo, velocidad, rotación inicial
- `update(deltaTime)`: Calcula movimiento, detección de límites, rebote
- `getForwardDirection()`: Calcula vector de dirección desde rotación.y

## coral.js
Generador procedural de 600 corales:
- 4 tipos de modelos con distribuci ón aleatoria uniforme
- Fases animadas para oscilación natural
- Escalado y rotación procedurales

## environment.js
Sistema de ambiente integrado:
- `createSeaFloor()`: Piso marino con material arena
- `createBubbles()`: Sistema de burbujas flotantes
- `createSeaLifeDetails()`: Algas, rocas, arrecifes con variedad visual

## main.js
Orquestación central:
- Setup de escena, cámaras, luces
- Instanciación de 15 peces
- Loop de animación con actualización de todo
- Controles panorámicos ArcRotateCamera

---

# Notas de Desarrollo

## Cambios Recientes (T1)
- Aumentados corales de 60 a 600 (generación procedural)
- Aumentados peces de 5 a 15 instancias
- Aumentadas algas de 55 a 150
- Aumentadas rocas de 45 a 120
- Aumentadas burbujas de 80 a 150
- Arrecifes expandidos a 27+ ubicaciones
- Múltiples materiales/colores para mayor variedad
- Cámara panorámica interactiva

## Problemas Conocidos
- Carga inicial puede ser lenta con 1,100+ entidades (optimización pendiente)
- Algunos navegadores antiguos podrían tener problemas de rendimiento

## TODOs Futuro
- [ ] LOD (Level of Detail) para corales lejanos
- [ ] Instancing de GPU para reducir draw calls
- [ ] Sistema de flocking (T2+)
- [ ] Colisiones entre peces (T5+)
- [ ] Partículas y efectos (arena, caustics)
- [ ] Sonido ambiental
