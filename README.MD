# Proyecto: Enjambre de Peces con Depredador Controlado por Mouse

## Descripción

Este proyecto consiste en una simulación interactiva en 3D de un enjambre de peces desarrollada con JavaScript y la librería Three.js.  
La simulación representa el comportamiento colectivo de múltiples peces autónomos que se desplazan dentro de un entorno submarino utilizando principios de inteligencia de enjambre.

El usuario controla un depredador mediante el mouse, generando interacciones dinámicas con los peces, los cuales reaccionan escapando o modificando su trayectoria en tiempo real.

El objetivo principal es implementar comportamientos emergentes inspirados en algoritmos tipo *Boids*, integrando renderizado 3D, animación e interacción con el usuario.

---

# Objetivos del Proyecto

- Construir un entorno 3D interactivo.
- Simular movimiento autónomo de múltiples agentes.
- Implementar comportamiento colectivo en un enjambre.
- Integrar interacción mediante mouse.
- Aplicar técnicas básicas de simulación y gráficos computacionales.
- Utilizar modelos 3D y animaciones dentro de Three.js.

---

# Características

- Escena submarina renderizada en 3D.
- Peces con movimiento autónomo.
- Implementación de reglas de comportamiento colectivo:
  - Separación
  - Cohesión
  - Alineación
- Depredador controlado por el usuario.
- Reacciones dinámicas de huida.
- Soporte para modelos `.glb`.
- Sistema modular organizado por componentes.
- Ciclo de animación en tiempo real.

---

# Tecnologías Utilizadas

- JavaScript 
- Three.js
- HTML5
- CSS3
- GLTFLoader
- WebGL

---

# Estructura del Proyecto

```text
Proyecto-Enjambre-Peces/
│
├── index.html
├── style.css
├── main.js
├── SceneSetup.js
├── Fish.js
├── Predator.js
│
├── assets/
│   ├── icons/
│   ├── sounds/
│   └── images/
│
├── models/
│   ├── fish.glb
│   └── predator.glb
│
├── textures/
│
└── utils/
