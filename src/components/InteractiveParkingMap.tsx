import { useRef, useState, useEffect, useCallback } from 'react';
import { ParkingSpot } from '../lib/supabase';
import { ZoomIn, ZoomOut, Maximize, ImageOff } from 'lucide-react';

interface SpotPosition {
  spotNumber: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  latitude?: number;
  longitude?: number;
}

interface InteractiveParkingMapProps {
  spots: ParkingSpot[];
  spotPositions: SpotPosition[];
  onSpotClick: (spotId: string, currentStatus: boolean) => void;
  isEditing: boolean;
  rotation: number;
  onUpdatePosition: (spotNumber: string, x: number, y: number) => void;
  onUpdateRotation: (spotNumber: string, rotation: number) => void;
  onDeleteSpot: (spotNumber: string) => void;
  selectedSpot: string | null;
  onSelectSpot: (spotNumber: string | null) => void;
  globalWidth: number;
  globalHeight: number;
}

export function InteractiveParkingMap({
  spots,
  spotPositions,
  onSpotClick,
  isEditing,
  rotation,
  onUpdatePosition,
  onUpdateRotation,
  onDeleteSpot,
  selectedSpot,
  onSelectSpot,
  globalWidth,
  globalHeight,
}: InteractiveParkingMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hoveredSpot, setHoveredSpot] = useState<string | null>(null);
  const [draggingSpot, setDraggingSpot] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 1536, h: 1024 });
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(err => {
        console.error(`Erro ao entrar em tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const getActualSpotPositions = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return spotPositions;

    const scaleX = canvas.width / imgSize.w;
    const scaleY = canvas.height / imgSize.h;

    return spotPositions.map(pos => ({
      ...pos,
      x: pos.x * scaleX,
      y: pos.y * scaleY,
      width: globalWidth * scaleX,
      height: globalHeight * scaleY,
    }));
  };

  const getEventPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const updateScale = useCallback(() => {
    if (canvasRef.current && canvasRef.current.width > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      setScale(rect.width / canvasRef.current.width);
    }
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale, zoom]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isEditing) return;

    const position = getEventPosition(e.clientX, e.clientY);
    if (!position) return;

    const x = position.x / scale;
    const y = position.y / scale;

    const actualPositions = getActualSpotPositions();
    const clickedSpot = actualPositions.find(
      pos =>
        x >= pos.x &&
        x <= pos.x + pos.width &&
        y >= pos.y &&
        y <= pos.y + pos.height
    );

    if (clickedSpot) {
      const spot = spots.find(s => s.spot_number === clickedSpot.spotNumber);
      if (spot) {
        onSpotClick(spot.id, spot.is_occupied);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isEditing) return;

    const position = getEventPosition(e.clientX, e.clientY);
    if (!position) return;

    const x = position.x / scale;
    const y = position.y / scale;

    const actualPositions = getActualSpotPositions();
    const hoveredSpotPos = actualPositions.find(
      pos =>
        x >= pos.x &&
        x <= pos.x + pos.width &&
        y >= pos.y &&
        y <= pos.y + pos.height
    );

    setHoveredSpot(hoveredSpotPos?.spotNumber || null);
  };

  const handleMarkerMouseDown = (
    spotNumber: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!isEditing) return;

    const position = getEventPosition(e.clientX, e.clientY);
    if (!position) return;

    const actualPositions = getActualSpotPositions();
    const pos = actualPositions.find(item => item.spotNumber === spotNumber);
    if (!pos) return;

    e.preventDefault();
    setDraggingSpot(spotNumber);
    setDragOffset({
      x: position.x - pos.x * scale,
      y: position.y - pos.y * scale,
    });
  };

  useEffect(() => {
    if (!draggingSpot) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return;

      const position = getEventPosition(event.clientX, event.clientY);
      if (!position) return;

      const x = (position.x - dragOffset.x) / scale;
      const y = (position.y - dragOffset.y) / scale;

      const canvas = canvasRef.current;
      // Busca o tamanho real da vaga sendo arrastada para um limite preciso
      const draggingPos = spotPositions.find(p => p.spotNumber === draggingSpot);
      const spotW = globalWidth || 45.0;
      const spotH = globalHeight || 12.0;

      const maxX = canvas.width - spotW;
      const maxY = canvas.height - spotH;
      const clampedX = Math.max(0, Math.min(x, maxX));
      const clampedY = Math.max(0, Math.min(y, maxY));

      onUpdatePosition(draggingSpot, clampedX, clampedY);
    };

    const handleMouseUp = () => {
      setDraggingSpot(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingSpot, dragOffset, scale, onUpdatePosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = '/image.png';

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setImgSize({ w: img.width, h: img.height });

      updateScale();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    img.onerror = () => {
      console.error("Erro: Não foi possível encontrar a imagem em /public/image.png");
      setImageError(true);
    };
  }, [updateScale]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full bg-gray-200 rounded-xl shadow-inner overflow-hidden border-2 border-gray-300 flex flex-col">
      {/* Área de Visualização com Rolagem */}
      <div className="overflow-auto flex-grow custom-scrollbar rounded-lg">
        <div 
          ref={containerRef}
          className="relative inline-block min-w-full transition-all duration-300 ease-out"
          style={{ 
            width: `${100 * zoom}%`,
            cursor: isEditing ? 'move' : hoveredSpot ? 'pointer' : 'default'
          }}
        >
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-300 text-gray-500 z-10">
              <ImageOff className="w-12 h-12 mb-2" />
              <p className="font-bold">Imagem não encontrada!</p>
              <p className="text-xs">Certifique-se que o arquivo 'image.png' está na pasta 'public'.</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredSpot(null)}
            className="w-full h-auto block shadow-lg"
          />

          {spotPositions.map(pos => {
            const spot = spots.find(s => s.spot_number === pos.spotNumber);
            const occupied = spot?.is_occupied;

            return (
              <button
                key={pos.spotNumber}
                type="button"
                onMouseDown={e => handleMarkerMouseDown(pos.spotNumber, e)}
                onDoubleClick={() => onUpdateRotation(pos.spotNumber, (pos.rotation || 0) - 90)}
                onContextMenu={e => { e.preventDefault(); onDeleteSpot(pos.spotNumber); }}
                onClick={() => {
                  if (isEditing) {
                    onSelectSpot(pos.spotNumber);
                  } else if (spot) {
                    onSpotClick(spot.id, spot.is_occupied);
                  }
                }}
                className={`absolute flex items-center justify-center gap-0.5 rounded-sm border text-xs font-bold text-white shadow-md transition-all ${
                  selectedSpot === pos.spotNumber
                    ? 'ring-4 ring-blue-400 border-white scale-110 z-40'
                    : ''
                } ${
                  draggingSpot === pos.spotNumber
                    ? 'border-yellow-300 bg-yellow-600/90 z-30'
                    : occupied
                    ? 'border-red-300 bg-red-600/90'
                    : 'border-green-300 bg-green-600/90'
                }`}
                style={{
                  left: `${((pos.x + globalWidth / 2) / imgSize.w) * 100}%`,
                  top: `${((pos.y + globalHeight / 2) / imgSize.h) * 100}%`,
                  width: `${(globalWidth / imgSize.w) * 100}%`,
                  height: `${(globalHeight / imgSize.h) * 100}%`,
                  minWidth: '2px',
                  minHeight: '2px',
                  zIndex: isEditing ? 60 : (draggingSpot === pos.spotNumber ? 50 : 10),
                  transform: `translate(-50%, -50%) rotate(${(pos.rotation || 0) + rotation}deg)`,
                  transformOrigin: 'center center',
                }}
            >
              <span>{pos.spotNumber}</span>
            </button>
            );
          })}
        </div>
      </div>

      {/* Etiqueta de Vaga Flutuante */}
      {hoveredSpot && !isEditing && (
        <div className="absolute top-4 left-4 z-50 bg-blue-600/95 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="text-lg">Vaga: {hoveredSpot}</div>
          {spotPositions.find(p => p.spotNumber === hoveredSpot)?.latitude && (
            <div className="text-[10px] font-mono mt-1 opacity-90 border-t border-blue-400 pt-1">
              Lat: {spotPositions.find(p => p.spotNumber === hoveredSpot)?.latitude}<br/>
              Long: {spotPositions.find(p => p.spotNumber === hoveredSpot)?.longitude}
            </div>
          )}
        </div>
      )}

      {/* Controles de Zoom */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.25, 4))}
          className="p-3 bg-white/95 hover:bg-white rounded-full shadow-xl text-gray-800 transition-all hover:scale-110 active:scale-90 border border-gray-200"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-6 h-6" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.25, 1))}
          className="p-3 bg-white/95 hover:bg-white rounded-full shadow-xl text-gray-800 transition-all hover:scale-110 active:scale-90 border border-gray-200"
          title="Diminuir Zoom"
        >
          <ZoomOut className="w-6 h-6" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-white/95 hover:bg-white rounded-full shadow-xl text-gray-800 transition-all hover:scale-110 active:scale-90 border border-gray-200"
          title="Expandir / Tela Cheia"
        >
          <Maximize className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
 