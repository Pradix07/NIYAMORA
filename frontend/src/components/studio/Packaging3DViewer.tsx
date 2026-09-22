import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';

interface Packaging3DViewerProps {
  formatType?: string;
  panelDesigns?: Record<string, { preview_url?: string; file_path?: string }>;
  focusedPanel?: string | null;
  activeFindingTitle?: string | null;
  onPanelSelect?: (panel: string) => void;
}

export const Packaging3DViewer: React.FC<Packaging3DViewerProps> = ({
  formatType = 'STAND_UP_POUCH',
  panelDesigns = {},
  focusedPanel,
  activeFindingTitle,
  onPanelSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [currentView, setCurrentView] = useState<string>('FRONT');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!webglSupported || !containerRef.current || !canvasRef.current) return;

    let isCancelled = false;
    const createdObjectUrls: string[] = [];

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 4. Create Package Geometry & Textures
    const group = new THREE.Group();
    meshGroupRef.current = group;
    scene.add(group);

    // Helper: Build high-contrast fallback canvas texture
    const createFallbackTexture = (pType: string): THREE.Texture => {
      const canvas = document.createElement('canvas');
      const isNarrow = pType === 'LEFT' || pType === 'RIGHT';
      const isShort = pType === 'TOP' || pType === 'BOTTOM';
      canvas.width = isNarrow ? 256 : 512;
      canvas.height = isShort ? 256 : 768;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = pType === 'FRONT' ? '#1B4D3E' : '#FAF8F5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = pType === 'FRONT' ? '#D4AF37' : '#CCCCCC';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

        ctx.fillStyle = pType === 'FRONT' ? '#D4AF37' : '#1B4D3E';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${pType}`, canvas.width / 2, canvas.height / 2);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      return tex;
    };

    // Initialize standard material mapping for each panel
    // BoxGeometry material array order: [Right (+X), Left (-X), Top (+Y), Bottom (-Y), Front (+Z), Back (-Z)]
    const panelMaterials: Record<string, THREE.MeshStandardMaterial> = {
      RIGHT: new THREE.MeshStandardMaterial({ map: createFallbackTexture('RIGHT'), roughness: 0.35, metalness: 0.1 }),
      LEFT: new THREE.MeshStandardMaterial({ map: createFallbackTexture('LEFT'), roughness: 0.35, metalness: 0.1 }),
      TOP: new THREE.MeshStandardMaterial({ map: createFallbackTexture('TOP'), roughness: 0.4, metalness: 0.1 }),
      BOTTOM: new THREE.MeshStandardMaterial({ map: createFallbackTexture('BOTTOM'), roughness: 0.4, metalness: 0.1 }),
      FRONT: new THREE.MeshStandardMaterial({ map: createFallbackTexture('FRONT'), roughness: 0.3, metalness: 0.15 }),
      BACK: new THREE.MeshStandardMaterial({ map: createFallbackTexture('BACK'), roughness: 0.35, metalness: 0.1 }),
    };

    const textureLoader = new THREE.TextureLoader();

    // Securely fetch panel artwork with authentication and load as Three.js texture
    const loadPanelArtwork = async (pType: string) => {
      const pData = panelDesigns[pType];
      const endpoint = pData?.preview_url || (pData?.file_path && pData.file_path.startsWith('/api') ? pData.file_path : undefined);
      
      if (!endpoint) return;

      const url = api.getFileUrl(endpoint);
      if (!url) return;

      try {
        const token = localStorage.getItem('niyamora_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        }

        const blob = await res.blob();
        if (isCancelled) return;

        const blobUrl = URL.createObjectURL(blob);
        createdObjectUrls.push(blobUrl);

        textureLoader.load(
          blobUrl,
          (loadedTex) => {
            if (isCancelled) return;
            loadedTex.colorSpace = THREE.SRGBColorSpace;
            loadedTex.minFilter = THREE.LinearFilter;
            loadedTex.generateMipmaps = true;
            loadedTex.needsUpdate = true;

            const mat = panelMaterials[pType];
            if (mat) {
              if (mat.map && mat.map !== loadedTex) {
                mat.map.dispose();
              }
              mat.map = loadedTex;
              mat.needsUpdate = true;
            }
          },
          undefined,
          (err) => {
            console.warn(`[Packaging3DViewer] Error decoding texture for ${pType}:`, err);
          }
        );
      } catch (err) {
        console.warn(`[Packaging3DViewer] Failed to load artwork texture for ${pType} from ${url}:`, err);
      }
    };

    // Fetch and apply textures for all 6 panels
    ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'].forEach((p) => {
      loadPanelArtwork(p);
    });

    const materials = [
      panelMaterials.RIGHT,
      panelMaterials.LEFT,
      panelMaterials.TOP,
      panelMaterials.BOTTOM,
      panelMaterials.FRONT,
      panelMaterials.BACK,
    ];

    if (formatType === 'BOX_CARTON') {
      const boxGeo = new THREE.BoxGeometry(1.8, 2.7, 1.0);
      const boxMesh = new THREE.Mesh(boxGeo, materials);
      group.add(boxMesh);
    } else if (formatType === 'JAR' || formatType === 'BOTTLE' || formatType === 'CAN') {
      const cylGeo = new THREE.CylinderGeometry(0.9, 0.9, 2.6, 32);
      const cylMesh = new THREE.Mesh(cylGeo, panelMaterials.FRONT);
      group.add(cylMesh);

      // Gold / metallic cap
      const capGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.3, 32);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 1.45;
      group.add(capMesh);
    } else {
      // Default: STAND_UP_POUCH
      const pouchGeo = new THREE.BoxGeometry(1.9, 2.8, 0.65);
      const pouchMesh = new THREE.Mesh(pouchGeo, materials);
      group.add(pouchMesh);

      // Top sealed trim
      const sealGeo = new THREE.BoxGeometry(2.0, 0.15, 0.1);
      const sealMat = new THREE.MeshStandardMaterial({ color: 0x1B4D3E, metalness: 0.4, roughness: 0.3 });
      const sealMesh = new THREE.Mesh(sealGeo, sealMat);
      sealMesh.position.y = 1.45;
      group.add(sealMesh);
    }

    // 5. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (group) {
        if (isAutoRotate && !isDraggingRef.current) {
          group.rotation.y += 0.008;
        } else {
          // Smoothly interpolate to target rotation
          group.rotation.y += (targetRotationRef.current.y - group.rotation.y) * 0.1;
          group.rotation.x += (targetRotationRef.current.x - group.rotation.x) * 0.1;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      createdObjectUrls.forEach((url) => URL.revokeObjectURL(url));
      Object.values(panelMaterials).forEach((mat) => {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
      renderer.dispose();
    };
  }, [formatType, panelDesigns, webglSupported]);

  // Rotate smoothly to specific panel face
  const snapToPanel = (panel: string) => {
    setIsAutoRotate(false);
    setCurrentView(panel);
    onPanelSelect?.(panel);

    if (!meshGroupRef.current) return;

    let targetY = 0;
    let targetX = 0;

    switch (panel.toUpperCase()) {
      case 'FRONT':
        targetY = 0;
        targetX = 0;
        break;
      case 'BACK':
        targetY = Math.PI;
        targetX = 0;
        break;
      case 'LEFT':
        targetY = Math.PI / 2;
        targetX = 0;
        break;
      case 'RIGHT':
        targetY = -Math.PI / 2;
        targetX = 0;
        break;
      case 'TOP':
        targetY = 0;
        targetX = Math.PI / 2;
        break;
      case 'BOTTOM':
        targetY = 0;
        targetX = -Math.PI / 2;
        break;
    }

    targetRotationRef.current = { x: targetX, y: targetY };
  };

  // Sync focused panel from compliance findings
  useEffect(() => {
    if (focusedPanel) {
      snapToPanel(focusedPanel);
    }
  }, [focusedPanel]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsAutoRotate(false);
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !meshGroupRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    targetRotationRef.current.y += deltaX * 0.01;
    targetRotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotationRef.current.x + deltaY * 0.01));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleZoom = (direction: 'IN' | 'OUT' | 'RESET') => {
    if (!cameraRef.current) return;
    if (direction === 'IN') {
      cameraRef.current.position.z = Math.max(2.5, cameraRef.current.position.z - 0.5);
    } else if (direction === 'OUT') {
      cameraRef.current.position.z = Math.min(8.0, cameraRef.current.position.z + 0.5);
    } else {
      cameraRef.current.position.set(0, 0, 5);
      targetRotationRef.current = { x: 0, y: 0 };
    }
  };

  if (!webglSupported) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
        <AlertTriangle size={36} style={{ color: 'var(--status-review-text)', margin: '0 auto 1rem' }} />
        <h4 style={{ fontWeight: 700 }}>WebGL 3D Acceleration Not Available</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Your browser does not support WebGL. Please use the 2D Panels tab to inspect your packaging artwork.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : '560px',
        backgroundColor: '#0F172A',
        borderRadius: isFullscreen ? '0' : 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Active Compliance Finding Alert */}
      {activeFindingTitle && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            zIndex: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#FFFFFF',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <AlertTriangle size={16} />
          <span>Viewing Finding on {currentView} Panel: {activeFindingTitle}</span>
        </div>
      )}

      {/* 3D Canvas */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Camera Panel View Shortcuts */}
      <div
        style={{
          position: 'absolute',
          bottom: '4.5rem',
          display: 'flex',
          gap: '0.4rem',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: '0.35rem 0.5rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          zIndex: 5,
        }}
      >
        {['FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'].map((p) => (
          <button
            key={p}
            onClick={() => snapToPanel(p)}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: currentView === p ? 800 : 500,
              backgroundColor: currentView === p ? 'var(--brand-primary)' : 'transparent',
              color: currentView === p ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Bottom Utility Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          zIndex: 5,
        }}
      >
        <button
          onClick={() => handleZoom('IN')}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
          title="Zoom In"
        >
          <ZoomIn size={17} />
        </button>
        <button
          onClick={() => handleZoom('RESET')}
          style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
        >
          100%
        </button>
        <button
          onClick={() => handleZoom('OUT')}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
          title="Zoom Out"
        >
          <ZoomOut size={17} />
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          style={{
            background: 'none',
            border: 'none',
            color: isAutoRotate ? '#10B981' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title="Toggle Auto Rotate"
        >
          {isAutoRotate ? <Pause size={15} /> : <Play size={15} />}
          <span>{isAutoRotate ? 'Rotating' : 'Paused'}</span>
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

        <button
          onClick={() => handleZoom('RESET')}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
          title="Reset Camera"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
};
