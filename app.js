const { useState, useEffect, useRef, useCallback } = React;

// Sample model configurations
const SAMPLES = {
  torusKnot: { name: 'Nudo Toroidal (Muestra)', icon: 'activity' },
  sphere: { name: 'Esfera (Muestra)', icon: 'circle' },
  torus: { name: 'Toroide (Muestra)', icon: 'disc' },
  box: { name: 'Caja (Muestra)', icon: 'box' },
};

function App() {
  const [file, setFile] = useState(null);
  const [sampleType, setSampleType] = useState('torusKnot'); // Load Torus Knot by default
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Viewer Controls State
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(4);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [showBoxHelper, setShowBoxHelper] = useState(false);
  
  // Lighting & Customization State
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [lightColor, setLightColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#0b0d19');
  const [modelColor, setModelColor] = useState('#6366f1'); // Glowing Indigo by default
  
  // Responsive / Cinematic UI State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(window.innerWidth > 1024);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(window.innerWidth > 1024);
  const [cinematicMode, setCinematicMode] = useState(false);
  
  // Blender Guide Modal State
  const [showBlendGuide, setShowBlendGuide] = useState(false);
  const [blendFileName, setBlendFileName] = useState('');

  // Model Stats State
  const [stats, setStats] = useState({
    name: 'Nudo Toroidal',
    format: 'Procedural',
    size: 'N/A',
    vertices: 0,
    triangles: 0,
    bounds: '0 x 0 x 0'
  });

  const [screenshotTrigger, setScreenshotTrigger] = useState(0);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);

  // Sync sidebars on resize if window size crosses threshold
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        // Automatically open sidebars on large desktop screens
        setLeftSidebarOpen(true);
        setRightSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // File loading handler
  const handleFileChange = (uploadedFile) => {
    if (!uploadedFile) return;
    
    const validExtensions = ['.glb', '.gltf', '.obj', '.stl', '.ply', '.fbx', '.blend'];
    const fileName = uploadedFile.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExt) {
      showToast('Formato de archivo no soportado. Usa GLB, GLTF, OBJ, STL, PLY, FBX o BLEND.');
      return;
    }

    // Special Intercept for .blend files
    if (fileName.endsWith('.blend')) {
      setBlendFileName(uploadedFile.name);
      setShowBlendGuide(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSampleType(null);
    setFile(uploadedFile);
  };

  const handleSampleSelect = (type) => {
    setIsLoading(true);
    setError(null);
    setFile(null);
    setSampleType(type);
  };

  const showToast = (message) => {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 4000);
    }
  };

  return (
    <div className={`app-container ${cinematicMode ? 'cinematic-active' : ''}`} style={{ '--bg-primary': bgColor }}>
      
      {/* Immersive Cinematic Mode Exit Button */}
      {cinematicMode && (
        <button 
          className="cinematic-exit-btn" 
          id="btn-exit-cinematic"
          onClick={() => setCinematicMode(false)}
        >
          <i data-lucide="eye-off" style={{ width: 18, height: 18 }}></i>
          <span>Salir del Modo Cine</span>
        </button>
      )}

      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">B</div>
          <div>
            <div className="logo-title">Blender Web Preview</div>
            <div className="logo-subtitle">Studio 3D</div>
          </div>
        </div>

        <div className="header-status">
          <div className={`status-badge ${file || sampleType ? 'active' : ''}`} id="status-viewer-badge">
            <span className="status-dot"></span>
            <span id="status-viewer-text">{isLoading ? 'Cargando...' : file ? 'Modelo Cargado' : 'Muestra Procedural'}</span>
          </div>
          {(file || sampleType) && !isLoading && (
            <button 
              className="btn-secondary" 
              id="btn-close-model"
              onClick={() => { setFile(null); setSampleType(null); }}
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              Cerrar Modelo
            </button>
          )}
        </div>
      </header>

      <div className="main-workspace">
        {/* Toggle Sidebars floating buttons (only when a model is active) */}
        {(file || sampleType) && !cinematicMode && (
          <React.Fragment>
            <button 
              className={`sidebar-toggle-btn left-btn ${leftSidebarOpen ? 'active' : ''}`}
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              title={leftSidebarOpen ? "Ocultar Controles" : "Mostrar Controles"}
            >
              <i data-lucide={leftSidebarOpen ? "chevron-left" : "sliders"}></i>
            </button>
            <button 
              className={`sidebar-toggle-btn right-btn ${rightSidebarOpen ? 'active' : ''}`}
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              title={rightSidebarOpen ? "Ocultar Información" : "Mostrar Información"}
            >
              <i data-lucide={rightSidebarOpen ? "chevron-right" : "info"}></i>
            </button>
          </React.Fragment>
        )}

        {/* Left Control Sidebar */}
        <aside className={`sidebar left glass-panel ${leftSidebarOpen ? '' : 'collapsed'}`} aria-label="Controles del Visor">
          <div className="panel-section-title">
            <i data-lucide="sliders" style={{ width: 16, height: 16 }}></i> Controles de Cámara
          </div>
          
          <div className="control-group">
            <div className="control-row">
              <span className="control-label">
                <i data-lucide="rotate-cw" style={{ width: 14, height: 14 }}></i> Rotación Automática
              </span>
              <label className="switch-control">
                <input 
                  type="checkbox" 
                  id="toggle-rotation"
                  checked={rotationEnabled} 
                  onChange={(e) => setRotationEnabled(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
            
            {rotationEnabled && (
              <div className="control-group" style={{ marginTop: 4 }}>
                <div className="control-row">
                  <span className="control-label" style={{ fontSize: '0.75rem' }}>Velocidad de giro</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }} id="val-rotation-speed">{rotationSpeed}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  id="input-rotation-speed"
                  className="slider-input" 
                  value={rotationSpeed} 
                  onChange={(e) => setRotationSpeed(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="panel-section-title" style={{ marginTop: 12 }}>
            <i data-lucide="eye" style={{ width: 16, height: 16 }}></i> Visualización
          </div>

          <div className="control-group">
            <div className="control-row">
              <span className="control-label">Modo Malla (Wireframe)</span>
              <label className="switch-control">
                <input 
                  type="checkbox" 
                  id="toggle-wireframe"
                  checked={wireframe} 
                  onChange={(e) => setWireframe(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="control-row">
              <span className="control-label">Mostrar Cuadrícula</span>
              <label className="switch-control">
                <input 
                  type="checkbox" 
                  id="toggle-grid"
                  checked={showGrid} 
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="control-row">
              <span className="control-label">Mostrar Ejes (XYZ)</span>
              <label className="switch-control">
                <input 
                  type="checkbox" 
                  id="toggle-axes"
                  checked={showAxes} 
                  onChange={(e) => setShowAxes(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="control-row">
              <span className="control-label">Caja Delimitadora</span>
              <label className="switch-control">
                <input 
                  type="checkbox" 
                  id="toggle-boxhelper"
                  checked={showBoxHelper} 
                  onChange={(e) => setShowBoxHelper(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          <div className="panel-section-title" style={{ marginTop: 12 }}>
            <i data-lucide="sun" style={{ width: 16, height: 16 }}></i> Iluminación y Estilo
          </div>

          <div className="control-group">
            <div className="control-row">
              <span className="control-label">Brillo de Luz</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }} id="val-light-intensity">{lightIntensity.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.1" 
              id="input-light-intensity"
              className="slider-input" 
              value={lightIntensity} 
              onChange={(e) => setLightIntensity(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="control-row">
              <span className="control-label">Color de Fondo</span>
              <input 
                type="color" 
                id="input-bg-color"
                className="color-picker-input" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>

            <div className="control-row">
              <span className="control-label">Color de Luz</span>
              <input 
                type="color" 
                id="input-light-color"
                className="color-picker-input" 
                value={lightColor} 
                onChange={(e) => setLightColor(e.target.value)}
              />
            </div>

            {!file && (
              <div className="control-row">
                <span className="control-label">Color del Modelo</span>
                <input 
                  type="color" 
                  id="input-model-color"
                  className="color-picker-input" 
                  value={modelColor} 
                  onChange={(e) => setModelColor(e.target.value)}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Central 3D Canvas / Drag & Drop Workspace */}
        <main className="viewer-section" aria-label="Visor 3D">
          {(!file && !sampleType) ? (
            <UploadZone onFileSelect={handleFileChange} onSampleSelect={handleSampleSelect} />
          ) : (
            <React.Fragment>
              {isLoading && (
                <div className="loading-spinner-container" id="loading-spinner">
                  <div className="spinner"></div>
                  <div className="spinner-text">Cargando geometría 3D...</div>
                </div>
              )}
              {error && (
                <div className="upload-overlay" id="error-screen">
                  <div className="glass-panel upload-card" style={{ border: '1px solid var(--accent-rose)' }}>
                    <i data-lucide="alert-triangle" style={{ color: 'var(--accent-rose)', width: 48, height: 48 }}></i>
                    <h3 style={{ marginTop: 8 }}>Error al cargar el archivo</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
                    <button className="btn-primary" id="btn-error-back" onClick={() => { setFile(null); setSampleType('torusKnot'); setError(null); }}>
                      Volver
                    </button>
                  </div>
                </div>
              )}
              
              <ThreeViewer 
                file={file}
                sampleType={sampleType}
                rotationEnabled={rotationEnabled}
                rotationSpeed={rotationSpeed}
                wireframe={wireframe}
                showGrid={showGrid}
                showAxes={showAxes}
                showBoxHelper={showBoxHelper}
                lightIntensity={lightIntensity}
                lightColor={lightColor}
                bgColor={bgColor}
                modelColor={modelColor}
                screenshotTrigger={screenshotTrigger}
                cameraResetTrigger={cameraResetTrigger}
                cinematicMode={cinematicMode}
                onLoaded={(info) => {
                  setStats(info);
                  setIsLoading(false);
                  if (window.lucide) window.lucide.createIcons();
                }}
                onError={(err) => {
                  setError(err);
                  setIsLoading(false);
                }}
              />

              {/* Bottom Quick Tools */}
              {!isLoading && !error && (
                <div className="bottom-controls-bar glass-panel" id="viewport-actions-bar">
                  <button 
                    className="btn-icon-only" 
                    id="btn-reset-camera"
                    title="Centrar Cámara" 
                    onClick={() => setCameraResetTrigger(prev => prev + 1)}
                  >
                    <i data-lucide="focus" style={{ width: 18, height: 18 }}></i>
                  </button>
                  <button 
                    className="btn-icon-only" 
                    id="btn-screenshot"
                    title="Capturar Pantalla"
                    onClick={() => setScreenshotTrigger(prev => prev + 1)}
                  >
                    <i data-lucide="camera" style={{ width: 18, height: 18 }}></i>
                  </button>
                  <button 
                    className={`btn-icon-only ${rotationEnabled ? 'active' : ''}`} 
                    id="btn-toggle-rotation"
                    title={rotationEnabled ? 'Pausar Rotación' : 'Activar Rotación'} 
                    onClick={() => setRotationEnabled(!rotationEnabled)}
                  >
                    <i data-lucide="play" style={{ width: 18, height: 18 }}></i>
                  </button>
                  <button 
                    className="btn-icon-only" 
                    id="btn-enter-cinematic"
                    title="Modo Cine (Inmersivo)" 
                    onClick={() => setCinematicMode(true)}
                  >
                    <i data-lucide="expand" style={{ width: 18, height: 18 }}></i>
                  </button>
                </div>
              )}
            </React.Fragment>
          )}
        </main>

        {/* Right Info Sidebar */}
        {(file || sampleType) && (
          <aside className={`sidebar right glass-panel ${rightSidebarOpen ? '' : 'collapsed'}`} aria-label="Información del Modelo">
            <ModelInfo stats={stats} />
            
            <div className="panel-section-title" style={{ marginTop: 20 }}>
              <i data-lucide="info" style={{ width: 16, height: 16 }}></i> Atajos del Visor
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div className="control-row" style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                <span>Rotar Vista</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Click Izq + Arrastrar</span>
              </div>
              <div className="control-row" style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                <span>Mover Vista (Pan)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Click Der / Shift + Arrastrar</span>
              </div>
              <div className="control-row" style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                <span>Zoom</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rueda del Mouse</span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Blender .blend Guide Modal */}
      <BlenderGuideModal 
        isOpen={showBlendGuide} 
        onClose={() => setShowBlendGuide(false)} 
        fileName={blendFileName}
      />

      <div id="toast" className="toast-msg"></div>
    </div>
  );
}

/* Blender File Guide Modal Component */
function BlenderGuideModal({ isOpen, onClose, fileName }) {
  const [activeTab, setActiveTab] = useState('glb');
  
  useEffect(() => {
    if (isOpen && window.lucide) {
      window.lucide.createIcons();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="glass-panel modal-card glass-panel-glow" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Cerrar Guía">
          <i data-lucide="x" style={{ width: 18, height: 18 }}></i>
        </button>
        
        <div className="modal-title-sec">
          <div className="modal-title-icon">
            <i data-lucide="box" style={{ width: 22, height: 22 }}></i>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Archivo de Blender (.blend) Detectado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>{fileName}</p>
          </div>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'glb' ? 'active' : ''}`} 
            onClick={() => setActiveTab('glb')}
          >
            Exportar a GLB (Recomendado)
          </button>
          <button 
            className={`modal-tab ${activeTab === 'why' ? 'active' : ''}`} 
            onClick={() => setActiveTab('why')}
          >
            ¿Por qué no .blend directo?
          </button>
        </div>
        
        {activeTab === 'glb' ? (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Para ver tu modelo de Blender en la web, expórtalo en formato <strong>glTF 2.0 (.glb)</strong>. Es el estándar moderno, ligero e interactivo.
            </p>
            
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div>
                  <div className="step-title">Abre el archivo en Blender</div>
                  <div className="step-desc">Abre tu archivo <code>.blend</code> en Blender.</div>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-number">2</div>
                <div>
                  <div className="step-title">Ve a Exportar</div>
                  <div className="step-desc">En el menú superior ve a: <strong>Archivo (File) &gt; Exportar (Export) &gt; glTF 2.0 (.glb/.gltf)</strong>.</div>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-number">3</div>
                <div>
                  <div className="step-title">Guarda como Binario (.glb)</div>
                  <div className="step-desc">Elige la opción <strong>glTF Binario (.glb)</strong>. Esto empaqueta mallas, texturas e iluminación en un solo archivo compacto.</div>
                </div>
              </div>
            </div>
            
            <div className="guide-tip">
              💡 <strong>Consejo:</strong> Una vez guardado, simplemente arrastra el nuevo archivo <code>.glb</code> a esta página para visualizarlo con texturas y colores completos al instante.
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
              Los archivos nativos <code>.blend</code> son capturas de memoria directas de Blender. Contienen configuraciones de la interfaz, el historial de cambios del editor, la disposición de las ventanas de desarrollo y código Python interno.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
              Por razones de <strong>rendimiento y seguridad en los navegadores</strong>, no se pueden interpretar directamente en una página web.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Exportar a <strong>GLB</strong> extrae únicamente la geometría y los materiales de tu escena de Blender, empaquetándolos en un formato listo para la web que es hasta 20 veces más ligero y carga de forma instantánea.
            </p>
          </div>
        )}
        
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose}>Entendido</button>
          <button className="btn-primary" onClick={() => { onClose(); document.getElementById('btn-sample-torusknot').click(); }}>
            Probar con una Muestra
          </button>
        </div>
      </div>
    </div>
  );
}

/* Drag & Drop File Upload Component */
function UploadZone({ onFileSelect, onSampleSelect }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const onBtnClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, []);

  return (
    <div className="upload-overlay">
      <div className="glass-panel upload-card glass-panel-glow">
        <h1 style={{ background: 'linear-gradient(to right, #fff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: '2rem', marginBottom: '8px' }}>
          Visualiza tus modelos 3D
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '460px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
          Sube tus archivos de Blender exportados o cualquier archivo 3D común para verlos en rotación interactiva e inspeccionar sus detalles.
        </p>

        <div 
          className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
          id="drop-zone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={onBtnClick}
        >
          <div className="upload-icon">
            <i data-lucide="upload-cloud"></i>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Arrastra tu archivo 3D o .blend aquí</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>o haz clic para explorar tu ordenador</p>
          </div>
          <input 
            type="file" 
            id="file-uploader"
            ref={fileInputRef} 
            className="file-input" 
            onChange={handleFileChange}
            accept=".glb,.gltf,.obj,.stl,.ply,.fbx,.blend"
          />
        </div>

        <div className="format-badges" aria-label="Formatos Soportados">
          <span className="format-tag" style={{ borderColor: '#f97316', color: '#f97316' }}>.BLEND</span>
          <span className="format-tag" style={{ borderColor: 'var(--accent-indigo)', color: 'var(--text-primary)' }}>GLB / GLTF</span>
          <span className="format-tag" style={{ borderColor: 'var(--accent-cyan)' }}>OBJ</span>
          <span className="format-tag">FBX</span>
          <span className="format-tag">STL</span>
          <span className="format-tag">PLY</span>
        </div>

        <div style={{ width: '100%', borderTop: '1px solid var(--glass-border)', marginTop: 24, paddingTop: 16 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 12 }}>
            ¿No tienes un archivo? Prueba una muestra
          </p>
          
          <div className="sample-models-grid" id="samples-selector-grid">
            <div className="sample-card" id="btn-sample-torusknot" onClick={() => onSampleSelect('torusKnot')}>
              <i data-lucide="activity" style={{ width: 20, height: 20 }}></i>
              <span>Nudo Toroidal</span>
            </div>
            <div className="sample-card" id="btn-sample-sphere" onClick={() => onSampleSelect('sphere')}>
              <i data-lucide="circle" style={{ width: 20, height: 20 }}></i>
              <span>Esfera</span>
            </div>
            <div className="sample-card" id="btn-sample-torus" onClick={() => onSampleSelect('torus')}>
              <i data-lucide="disc" style={{ width: 20, height: 20 }}></i>
              <span>Toroide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Model Metadata Panel Component */
function ModelInfo({ stats }) {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [stats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel-section-title">
        <i data-lucide="file-text" style={{ width: 16, height: 16 }}></i> Información del Modelo
      </div>

      <div className="metadata-grid">
        <div className="meta-card">
          <span className="meta-label">Nombre del Archivo</span>
          <span className="meta-value" id="meta-name" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>{stats.name}</span>
        </div>

        <div className="meta-card">
          <span className="meta-label">Formato</span>
          <span className="meta-value" id="meta-format">{stats.format}</span>
        </div>

        <div className="meta-card">
          <span className="meta-label">Tamaño del Archivo</span>
          <span className="meta-value" id="meta-size">{stats.size}</span>
        </div>

        <div className="meta-card">
          <span className="meta-label">Vértices</span>
          <span className="meta-value" id="meta-vertices" style={{ color: 'var(--accent-cyan)' }}>{stats.vertices.toLocaleString()}</span>
        </div>

        <div className="meta-card">
          <span className="meta-label">Caras / Triángulos</span>
          <span className="meta-value" id="meta-triangles" style={{ color: 'var(--accent-purple)' }}>{stats.triangles.toLocaleString()}</span>
        </div>

        <div className="meta-card">
          <span className="meta-label">Dimensiones Reales</span>
          <span className="meta-value" id="meta-dimensions" style={{ fontSize: '0.8rem' }}>{stats.bounds}</span>
        </div>
      </div>
    </div>
  );
}

/* Three.js Viewer Component wrapping the 3D Canvas Lifecycle */
function ThreeViewer({ 
  file, 
  sampleType, 
  rotationEnabled, 
  rotationSpeed, 
  wireframe, 
  showGrid, 
  showAxes, 
  showBoxHelper, 
  lightIntensity, 
  lightColor,
  bgColor, 
  modelColor, 
  screenshotTrigger,
  cameraResetTrigger,
  cinematicMode,
  onLoaded, 
  onError 
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const currentModelRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Helper meshes refs
  const gridHelperRef = useRef(null);
  const axesHelperRef = useRef(null);
  const boxHelperRef = useRef(null);

  // Lights refs
  const ambientLightRef = useRef(null);
  const dirLight1Ref = useRef(null);
  const dirLight2Ref = useRef(null);
  const pointLightRef = useRef(null);

  // Refs to prevent stale closure in animate loop
  const rotationEnabledRef = useRef(rotationEnabled);
  const rotationSpeedRef = useRef(rotationSpeed);
  const cinematicModeRef = useRef(cinematicMode);

  useEffect(() => {
    rotationEnabledRef.current = rotationEnabled;
  }, [rotationEnabled]);

  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    cinematicModeRef.current = cinematicMode;
  }, [cinematicMode]);

  // Initialize ThreeJS environment
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    sceneRef.current = scene;

    // 2. Create Camera - adjusted parameters
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    // Position camera further back so the model sits comfortably in scene (doesn't look too close up)
    camera.position.set(14, 10, 14);
    cameraRef.current = camera;

    // 3. Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    
    // Clear old contents
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Create OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI; // Don't limit rotation
    controlsRef.current = controls;

    // 5. Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Primary bright light
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(15, 20, 15);
    scene.add(dirLight1);
    dirLight1Ref.current = dirLight1;

    // Secondary colored light for nice edge highlights (Indigo/Purple glow)
    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.5);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);
    dirLight2Ref.current = dirLight2;

    // Point light that orbits or highlights the front
    const pointLight = new THREE.PointLight(0x06b6d4, 0.5, 60);
    pointLight.position.set(0, 5, 10);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // 6. Add grid and axes helpers
    const gridHelper = new THREE.GridHelper(30, 30, 0x6366f1, 0x242844);
    gridHelper.position.y = -5; // default position below model
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // 7. Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation/Render Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Rotate model OR rotate camera in cinematic mode
      if (!cinematicModeRef.current && rotationEnabledRef.current && currentModelRef.current) {
        currentModelRef.current.rotation.y += rotationSpeedRef.current * 0.0015;
      }

      // Dynamic Orbit Light for cinematic touch
      if (pointLightRef.current) {
        const time = Date.now() * 0.001;
        pointLightRef.current.position.x = Math.sin(time) * 15;
        pointLightRef.current.position.z = Math.cos(time) * 15;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, []);

  // Update controls and camera behavior for Cinematic Mode
  useEffect(() => {
    if (!controlsRef.current) return;

    if (cinematicMode) {
      // Rotate the camera around the scene target dynamically using OrbitControls autoRotate
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 1.0; // Slow, immersive speed
      
      // Stop model local rotation during camera rotation to prevent speed collision
      if (currentModelRef.current) {
        currentModelRef.current.rotation.y = 0;
      }
    } else {
      controlsRef.current.autoRotate = false;
    }
  }, [cinematicMode]);

  // Update helper visibilities and light settings when properties change
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (axesHelperRef.current) axesHelperRef.current.visible = showAxes;
  }, [showAxes]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(bgColor);
    }
  }, [bgColor]);

  useEffect(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(lightColor);
      ambientLightRef.current.intensity = 0.4 * lightIntensity;
    }
    if (dirLight1Ref.current) {
      dirLight1Ref.current.color.set(lightColor);
      dirLight1Ref.current.intensity = 0.8 * lightIntensity;
    }
    if (dirLight2Ref.current) {
      dirLight2Ref.current.intensity = 0.5 * lightIntensity;
    }
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 0.5 * lightIntensity;
    }
  }, [lightIntensity, lightColor]);

  // Update wireframe property in children meshes
  useEffect(() => {
    if (!currentModelRef.current) return;
    currentModelRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.wireframe = wireframe);
        } else {
          child.material.wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  // Update model material color (procedural models only)
  useEffect(() => {
    if (!currentModelRef.current || file) return;
    currentModelRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            if (m.color) m.color.set(modelColor);
          });
        } else if (child.material.color) {
          child.material.color.set(modelColor);
        }
      }
    });
  }, [modelColor, file]);

  // Center/Reset camera command
  useEffect(() => {
    if (cameraResetTrigger === 0 || !cameraRef.current || !controlsRef.current) return;
    
    cameraRef.current.position.set(14, 10, 14);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [cameraResetTrigger]);

  // Screenshot capture functionality
  useEffect(() => {
    if (screenshotTrigger === 0 || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    // Hide helpers briefly for clean screenshot
    const gridVis = gridHelperRef.current ? gridHelperRef.current.visible : false;
    const axesVis = axesHelperRef.current ? axesHelperRef.current.visible : false;
    const boxVis = boxHelperRef.current ? boxHelperRef.current.visible : false;
    
    if (gridHelperRef.current) gridHelperRef.current.visible = false;
    if (axesHelperRef.current) axesHelperRef.current.visible = false;
    if (boxHelperRef.current) boxHelperRef.current.visible = false;

    // Render immediately
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Grab image data url
    try {
      const dataURL = rendererRef.current.domElement.toDataURL('image/png');
      
      // Download image
      const link = document.createElement('a');
      const filename = file ? `${file.name.substring(0, file.name.lastIndexOf('.'))}_preview.png` : '3d_preview.png';
      link.download = filename;
      link.href = dataURL;
      link.click();
    } catch (e) {
      console.error("Failed to take screenshot:", e);
    }

    // Restore helpers
    if (gridHelperRef.current) gridHelperRef.current.visible = gridVis;
    if (axesHelperRef.current) axesHelperRef.current.visible = axesVis;
    if (boxHelperRef.current) boxHelperRef.current.visible = boxVis;
  }, [screenshotTrigger]);

  // Box Helper setup when toggled
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove old box helper
    if (boxHelperRef.current) {
      sceneRef.current.remove(boxHelperRef.current);
      boxHelperRef.current = null;
    }
    
    if (showBoxHelper && currentModelRef.current) {
      const helper = new THREE.BoxHelper(currentModelRef.current, 0xa855f7); // Purple box helper
      sceneRef.current.add(helper);
      boxHelperRef.current = helper;
    }
  }, [showBoxHelper, currentModelRef.current]);

  // Model loading manager
  useEffect(() => {
    if (!sceneRef.current) return;

    // 1. Remove existing model from scene
    if (currentModelRef.current) {
      sceneRef.current.remove(currentModelRef.current);
      currentModelRef.current = null;
    }
    if (boxHelperRef.current) {
      sceneRef.current.remove(boxHelperRef.current);
      boxHelperRef.current = null;
    }

    // 2. Load Sample Procedural Model
    if (sampleType) {
      let geometry;
      let matColor = modelColor;
      
      switch(sampleType) {
        case 'sphere':
          geometry = new THREE.SphereGeometry(3.2, 64, 64);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(3.0, 1.0, 24, 100);
          break;
        case 'box':
          geometry = new THREE.BoxGeometry(4.0, 4.0, 4.0);
          break;
        case 'torusKnot':
        default:
          geometry = new THREE.TorusKnotGeometry(2.6, 0.8, 150, 20);
          break;
      }
      
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(matColor),
        roughness: 0.15,
        metalness: 0.85,
        wireframe: wireframe
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      const group = new THREE.Group();
      group.add(mesh);
      sceneRef.current.add(group);
      currentModelRef.current = group;

      // Adjust grid helper position
      const box = new THREE.Box3().setFromObject(group);
      if (gridHelperRef.current) {
        gridHelperRef.current.position.y = box.min.y - 0.05;
      }
      
      // Calculate Stats
      const vertexCount = geometry.attributes.position.count;
      const indexCount = geometry.index ? geometry.index.count : vertexCount;
      const sizeStr = `${(box.max.x - box.min.x).toFixed(1)}m x ${(box.max.y - box.min.y).toFixed(1)}m x ${(box.max.z - box.min.z).toFixed(1)}m`;
      
      onLoaded({
        name: SAMPLES[sampleType].name,
        format: 'Geometría Interna',
        size: 'N/A',
        vertices: vertexCount,
        triangles: indexCount / 3,
        bounds: sizeStr
      });
      
      return;
    }

    // 3. Load User Uploaded File
    if (file) {
      const fileName = file.name;
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
      const fileURL = URL.createObjectURL(file);
      const fileSizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";

      // Setup loading manager
      const manager = new THREE.LoadingManager();
      
      let loader;
      let formatName = '';

      switch(fileExtension) {
        case '.glb':
        case '.gltf':
          loader = new THREE.GLTFLoader(manager);
          formatName = 'glTF / GLB';
          break;
        case '.obj':
          loader = new THREE.OBJLoader(manager);
          formatName = 'Wavefront OBJ';
          break;
        case '.stl':
          loader = new THREE.STLLoader(manager);
          formatName = 'Stereolithography STL';
          break;
        case '.ply':
          loader = new THREE.PLYLoader(manager);
          formatName = 'Stanford PLY';
          break;
        case '.fbx':
          loader = new THREE.FBXLoader(manager);
          formatName = 'Filmbox FBX';
          break;
        default:
          onError(`Tipo de archivo (${fileExtension}) no compatible.`);
          return;
      }

      const parseLoadedObject = (loadedObj) => {
        let vertices = 0;
        let triangles = 0;
        let objectToCenter = loadedObj;

        if (loadedObj.isBufferGeometry) {
          const material = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.5,
            metalness: 0.5,
            wireframe: wireframe
          });
          const mesh = new THREE.Mesh(loadedObj, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          const group = new THREE.Group();
          group.add(mesh);
          objectToCenter = group;
          
          vertices = loadedObj.attributes.position.count;
          triangles = loadedObj.index ? loadedObj.index.count / 3 : vertices / 3;
        } else {
          // GLTF, OBJ, FBX
          if (fileExtension === '.glb' || fileExtension === '.gltf') {
            objectToCenter = loadedObj.scene;
          }

          objectToCenter.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.wireframe = wireframe);
                } else {
                  child.material.wireframe = wireframe;
                }
              }

              const geom = child.geometry;
              if (geom) {
                if (geom.index) {
                  triangles += geom.index.count / 3;
                } else if (geom.attributes.position) {
                  triangles += geom.attributes.position.count / 3;
                }
                if (geom.attributes.position) {
                  vertices += geom.attributes.position.count;
                }
              }
            }
          });
        }

        // Center and Scale Object
        const box = new THREE.Box3().setFromObject(objectToCenter);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Target bounds of 6.8 units (instead of 10) to prevent models looking too close up!
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scaleFactor = 6.8 / (maxDimension || 1);
        objectToCenter.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Recenter
        const boxCentered = new THREE.Box3().setFromObject(objectToCenter);
        const centerOffset = boxCentered.getCenter(new THREE.Vector3());
        objectToCenter.position.sub(centerOffset);

        // Position grid below the bounding box
        const finalBox = new THREE.Box3().setFromObject(objectToCenter);
        if (gridHelperRef.current) {
          gridHelperRef.current.position.y = finalBox.min.y - 0.05;
        }

        // Add to scene
        sceneRef.current.add(objectToCenter);
        currentModelRef.current = objectToCenter;

        // Bounding box size string
        const sizeStr = `${(size.x).toFixed(2)}m x ${(size.y).toFixed(2)}m x ${(size.z).toFixed(2)}m`;

        // Trigger Callback
        onLoaded({
          name: fileName,
          format: formatName,
          size: fileSizeStr,
          vertices: vertices,
          triangles: Math.round(triangles),
          bounds: sizeStr
        });

        // Revoke Object URL
        URL.revokeObjectURL(fileURL);
      };

      // Execute load
      try {
        loader.load(
          fileURL, 
          (result) => {
            parseLoadedObject(result);
          },
          // OnProgress
          undefined,
          // OnError
          (err) => {
            console.error("Loader Error: ", err);
            onError(`Error al decodificar el archivo 3D. Asegúrate de que el archivo no esté corrupto.`);
            URL.revokeObjectURL(fileURL);
          }
        );
      } catch (err) {
        console.error("Execution error: ", err);
        onError(`Fallo el parseador de archivos: ${err.message}`);
        URL.revokeObjectURL(fileURL);
      }
    }
  }, [file, sampleType]);

  return <div className="three-canvas-container" ref={containerRef}></div>;
}

// Mount React App - resolves race condition in browser CDN loaders
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
