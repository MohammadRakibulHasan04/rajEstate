import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Property, RoomTourPoint } from '../types/property';
import { X, Maximize2, Minimize2, Eye, Compass, Info, Sparkles, Sun, Moon, Sunset, Layers } from 'lucide-react';

interface VirtualTour3DModalProps {
  property: Property;
  initialRoomId?: string;
  onClose: () => void;
  onBookViewing: (property: Property) => void;
}

export const VirtualTour3DModal: React.FC<VirtualTour3DModalProps> = ({
  property,
  initialRoomId,
  onClose,
  onBookViewing,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [lightPreset, setLightPreset] = useState<'dusk' | 'day' | 'night'>('dusk');
  const [selectedHotspot, setSelectedHotspot] = useState<{ title: string; description: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(true);

  const rooms = property.tourRooms || [];
  const currentRoom = rooms[activeRoomIndex] || rooms[0];

  useEffect(() => {
    if (initialRoomId) {
      const idx = rooms.findIndex((r) => r.id === initialRoomId);
      if (idx !== -1) setActiveRoomIndex(idx);
    }
  }, [initialRoomId, rooms]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(lightPreset === 'day' ? 0x0f172a : (lightPreset === 'night' ? 0x030712 : 0x080c18));

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(
      lightPreset === 'day' ? 0xffffff : (lightPreset === 'night' ? 0x38bdf8 : 0xfeb47b),
      lightPreset === 'day' ? 0.9 : (lightPreset === 'night' ? 0.35 : 0.6)
    );
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(
      lightPreset === 'day' ? 0xffffff : (lightPreset === 'night' ? 0x38bdf8 : 0xffaa5e),
      lightPreset === 'day' ? 1.5 : (lightPreset === 'night' ? 0.4 : 1.2)
    );
    keyLight.position.set(5, 8, 4);
    scene.add(keyLight);

    const pointLight = new THREE.PointLight(0xffedd5, 1.8, 15);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const roomWidth = 14;
    const roomHeight = 5.5;
    const roomDepth = 14;

    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.25,
      metalness: 0.1,
      wireframe: wireframeMode,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    roomGroup.add(floor);

    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      wireframe: wireframeMode,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    roomGroup.add(ceiling);

    const backWallGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.6,
      wireframe: wireframeMode,
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
    roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), backWallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    roomGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), backWallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    roomGroup.add(rightWall);

    const glassMullionMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.2,
      wireframe: wireframeMode,
    });
    const glassPlane = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), glassMullionMat);
    glassPlane.position.set(0, roomHeight / 2, roomDepth / 2);
    glassPlane.rotation.y = Math.PI;
    roomGroup.add(glassPlane);

    const fireplaceGeo = new THREE.BoxGeometry(2.5, roomHeight, 1.2);
    const fireplaceMat = new THREE.MeshStandardMaterial({
      color: 0x3f3b35,
      roughness: 0.7,
      wireframe: wireframeMode,
    });
    const fireplace = new THREE.Mesh(fireplaceGeo, fireplaceMat);
    fireplace.position.set(-3.5, roomHeight / 2, -roomDepth / 2 + 0.6);
    roomGroup.add(fireplace);

    const hearthGeo = new THREE.BoxGeometry(1.6, 0.4, 0.5);
    const hearthMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const hearth = new THREE.Mesh(hearthGeo, hearthMat);
    hearth.position.set(-3.5, 0.8, -roomDepth / 2 + 1.0);
    roomGroup.add(hearth);

    const sofaGeo = new THREE.BoxGeometry(3.6, 0.6, 1.6);
    const sofaMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      wireframe: wireframeMode,
    });
    const sofa = new THREE.Mesh(sofaGeo, sofaMat);
    sofa.position.set(0, 0.3, 0);
    roomGroup.add(sofa);

    const backrestGeo = new THREE.BoxGeometry(3.6, 0.5, 0.4);
    const backrest = new THREE.Mesh(backrestGeo, sofaMat);
    backrest.position.set(0, 0.8, -0.6);
    roomGroup.add(backrest);

    const tableGeo = new THREE.BoxGeometry(1.8, 0.25, 0.9);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.2,
      wireframe: wireframeMode,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.125, 1.6);
    roomGroup.add(table);

    const deckGeo = new THREE.BoxGeometry(roomWidth, 0.3, 4);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x241d18,
      roughness: 0.4,
      wireframe: wireframeMode,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, -0.15, roomDepth / 2 + 2);
    roomGroup.add(deck);

    const balustradeGeo = new THREE.BoxGeometry(roomWidth, 1.1, 0.1);
    const balustradeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      wireframe: wireframeMode,
    });
    const balustrade = new THREE.Mesh(balustradeGeo, balustradeMat);
    balustrade.position.set(0, 0.55, roomDepth / 2 + 3.9);
    roomGroup.add(balustrade);

    const hotspotMarkers: THREE.Mesh[] = [];
    currentRoom?.hotspots.forEach((hs, idx) => {
      const pinGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(hs.position[0], hs.position[1], hs.position[2]);
      pin.userData = { hotspot: hs, index: idx };
      scene.add(pin);
      hotspotMarkers.push(pin);

      const ringGeo = new THREE.RingGeometry(0.16, 0.22, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pin.position);
      scene.add(ring);
    });

    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let lon = 0;
    let lat = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      setIsRotating(false);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      lon += deltaX * 0.25;
      lat -= deltaY * 0.25;
      lat = Math.max(-65, Math.min(65, lat));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      camera.fov = Math.max(35, Math.min(85, camera.fov + e.deltaY * 0.05));
      camera.updateProjectionMatrix();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('wheel', onWheel, { passive: true });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onCanvasClick = (e: MouseEvent) => {
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspotMarkers);
      if (intersects.length > 0) {
        const hs = intersects[0].object.userData.hotspot;
        setSelectedHotspot(hs);
      }
    };

    domElement.addEventListener('click', onCanvasClick);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isRotating && !isDragging) {
        lon += 0.04;
      }

      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      const targetX = Math.sin(phi) * Math.cos(theta);
      const targetY = Math.cos(phi);
      const targetZ = Math.sin(phi) * Math.sin(theta);

      camera.lookAt(
        camera.position.x + targetX,
        camera.position.y + targetY,
        camera.position.z + targetZ
      );

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('click', onCanvasClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeRoomIndex, wireframeMode, lightPreset, isRotating, currentRoom]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-6 transition-all ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`relative w-full h-full max-w-7xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl ${
          isFullscreen ? 'max-w-none rounded-none border-none' : ''
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 z-20">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span>INTERACTIVE 3D VIRTUAL TOUR</span>
                <span className="text-slate-500">·</span>
                <span>WEBGL SPATIAL ENGINE</span>
              </div>
              <h2 className="text-base sm:text-lg font-display font-medium text-white truncate max-w-md">
                {property.title} — {currentRoom?.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWireframeMode(!wireframeMode)}
              className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                wireframeMode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Architectural Wireframe Mesh"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Wireframe</span>
            </button>

            <div className="flex items-center bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/60">
              <button
                onClick={() => setLightPreset('dusk')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  lightPreset === 'dusk' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dusk Twilight Illumination"
              >
                <Sunset className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLightPreset('day')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  lightPreset === 'day' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Direct Day Solar Study"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLightPreset('night')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  lightPreset === 'night' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Midnight Ambient Obsidian"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-2 cursor-pointer"
              title="Exit 3D Virtual Tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing">
          <div ref={mountRef} className="w-full h-full" />

          <div className="absolute top-4 left-6 pointer-events-none bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>DRAG TO ROTATE 360° · SCROLL TO ZOOM · CLICK HOTSPOTS</span>
          </div>

          {selectedHotspot && (
            <div className="absolute bottom-24 left-6 right-6 sm:right-auto sm:w-96 z-30 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-5 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ARCHITECTURAL MATERIAL SPEC</span>
                </div>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-base font-display font-medium text-white mb-1.5">
                {selectedHotspot.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedHotspot.description}
              </p>
            </div>
          )}

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl overflow-x-auto max-w-full">
              {rooms.map((room, idx) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setActiveRoomIndex(idx);
                    setSelectedHotspot(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeRoomIndex === idx
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={() => onBookViewing(property)}
                className="px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-lg hover:shadow-cyan-400/20 transition-all font-mono whitespace-nowrap cursor-pointer"
              >
                REQUEST PRIVATE VIEWING
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
