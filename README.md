# Blender Web Preview - Studio 3D

Una aplicación web interactiva de alto rendimiento y estética premium (glassmorphism en modo oscuro) construida con **React** y **Three.js** para visualizar modelos 3D y archivos exportados de Blender directamente en el navegador.

## Características

- **Zona de Arrastre Inteligente (Drag & Drop)**: Permite cargar archivos `.glb`, `.gltf`, `.obj`, `.stl`, `.ply` y `.fbx`.
- **Soporte de Interceptación `.blend`**: Si arrastras un archivo nativo `.blend`, la aplicación abre una guía interactiva que te explica paso a paso cómo exportarlo a **GLB Binario** (el estándar óptimo para la web) en 3 sencillos pasos.
- **Modo Cinematográfico (Showroom)**: Oculta la interfaz con un clic y activa un vuelo de cámara en 360° automático alrededor del modelo, creando reflejos y dinámicas de iluminación envolventes.
- **Adaptabilidad al Teléfono**: En pantallas móviles de menos de 1024px, los paneles de configuración y metadatos se colapsan por defecto. Puedes deslizarlos como cajones flotantes (drawers) para interactuar cómodamente en 3D con tus dedos.
- **Inspector de Metadatos**: Extrae y muestra el tamaño del archivo, nombre, extensión, número real de vértices, triángulos y dimensiones del cubo contenedor del objeto.
- **Ajustes en Tiempo Real**:
  - Encendido/Apagado de rotación automática y control de velocidad.
  - Modo estructura de alambre (*Wireframe*).
  - Ayudantes visuales (Cuadrícula, Ejes cartesianos XYZ, Caja delimitadora).
  - Intensidad del brillo lumínico.
  - Paleta de color para el fondo del visor, la luz y las mallas de muestra.
- **Captura de Pantalla Limpia**: Un botón para tomar fotos en formato `.png` ocultando los ayudantes de rejilla/ejes temporalmente.

## Estructura del Proyecto

```text
├── index.html        # Plantilla HTML5 e integración de librerías CDN
├── styles.css        # Hoja de estilos con Glassmorphism y diseño responsivo
├── app.js            # Lógica React e integración del motor Three.js
└── start_server.py   # Script servidor de desarrollo local en Python
```

## Ejecución Local

Para evitar restricciones CORS del navegador al cargar archivos locales, inicia el servidor de desarrollo utilizando Python:

```bash
python start_server.py
```

El script iniciará el servidor en `http://localhost:8000` y abrirá automáticamente tu navegador web predeterminado para que comiences a previsualizar tus creaciones de Blender.
