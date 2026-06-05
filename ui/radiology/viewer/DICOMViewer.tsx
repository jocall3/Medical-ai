import React, { useRef, useEffect, useState } from 'react';
import { useRadiology } from '../context/RadiologyContext';
import { HeatmapOverlay } from './HeatmapOverlay';
import { AnnotationTool } from './AnnotationTool';

export const DICOMViewer: React.FC = () => {
  const { state, dispatch } = useRadiology();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 512, height: 512 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height, 600);
        setDimensions({ width: size, height: size });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const imgData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x / width) * 2 - 1;
        const ny = (y / height) * 2 - 1;

        let intensity = 0.15;

        const leftLung = Math.pow(nx + 0.4, 2) / 0.15 + Math.pow(ny + 0.1, 2) / 0.5;
        const rightLung = Math.pow(nx - 0.4, 2) / 0.15 + Math.pow(ny + 0.1, 2) / 0.5;
        if (leftLung < 1.0) {
          intensity += (1.0 - leftLung) * 0.45;
        }
        if (rightLung < 1.0) {
          intensity += (1.0 - rightLung) * 0.45;
        }

        const heart = Math.pow(nx + 0.1, 2) / 0.08 + Math.pow(ny - 0.2, 2) / 0.12;
        if (heart < 1.0) {
          intensity -= (1.0 - heart) * 0.35;
        }

        const spine = Math.abs(nx) / 0.08;
        if (spine < 1.0) {
          intensity -= (1.0 - spine) * 0.25;
        }

        for (let r = -0.8; r < 0.8; r += 0.25) {
          const ribCurve = ny - (r + 0.05 * nx * nx);
          if (Math.abs(ribCurve) < 0.02) {
            intensity -= 0.08 * (1.0 - Math.abs(ribCurve) / 0.02);
          }
        }

        const leftClavicle = Math.abs(ny + 0.6 - 0.1 * nx);
        const rightClavicle = Math.abs(ny + 0.6 + 0.1 * nx);
        if (nx < 0 && leftClavicle < 0.03) {
          intensity -= 0.15 * (1.0 - leftClavicle / 0.03);
        }
        if (nx > 0 && rightClavicle < 0.03) {
          intensity -= 0.15 * (1.0 - rightClavicle / 0.03);
        }

        const hu = intensity * 1000;
        const minVisible = state.windowCenter - state.windowWidth / 2;

        let pixelVal = ((hu - minVisible) / state.windowWidth) * 255;
        pixelVal = Math.max(0, Math.min(255, pixelVal));

        const idx = (y * width + x) * 4;
        imgData.data[idx] = pixelVal;
        imgData.data[idx + 1] = pixelVal;
        imgData.data[idx + 2] = pixelVal;
        imgData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [dimensions, state.windowWidth, state.windowCenter]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.activeAnnotationType) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || state.activeAnnotationType) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const newWidth = Math.max(1, state.windowWidth + dx * 2);
    const newCenter = state.windowCenter + dy * 1.5;

    dispatch({
      type: 'SET_WINDOWING',
      payload: { width: newWidth, center: newCenter },
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full bg-black border border-slate-800 rounded-lg overflow-hidden select-none"
    >
      <div
        className="relative"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          transform: `scale(${state.zoom}) translate(${state.pan.x}px, ${state.pan.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="block w-full h-full"
        />
        <HeatmapOverlay width={dimensions.width} height={dimensions.height} />
        <AnnotationTool width={dimensions.width} height={dimensions.height} />
      </div>

      <div className="absolute top-3 left-3 text-xs text-emerald-400 font-mono pointer-events-none bg-black/60 p-1.5 rounded border border-emerald-500/20">
        <div>ID: {state.metadata?.patientId || 'N/A'}</div>
        <div>Name: {state.metadata?.patientName || 'N/A'}</div>
        <div>DOB: {state.metadata?.patientBirthDate || 'N/A'}</div>
      </div>

      <div className="absolute top-3 right-3 text-xs text-emerald-400 font-mono text-right pointer-events-none bg-black/60 p-1.5 rounded border border-emerald-500/20">
        <div>{state.metadata?.manufacturer || 'N/A'}</div>
        <div>{state.metadata?.studyDescription || 'N/A'}</div>
        <div>{state.metadata?.studyDate || 'N/A'}</div>
      </div>

      <div className="absolute bottom-3 left-3 text-xs text-emerald-400 font-mono pointer-events-none bg-black/60 p-1.5 rounded border border-emerald-500/20">
        <div>W: {Math.round(state.windowWidth)} C: {Math.round(state.windowCenter)}</div>
        <div>Zoom: {state.zoom.toFixed(1)}x</div>
      </div>

      <div className="absolute bottom-3 right-3 text-xs text-emerald-400 font-mono text-right pointer-events-none bg-black/60 p-1.5 rounded border border-emerald-500/20">
        <div>Modality: {state.metadata?.modality || 'N/A'}</div>
        <div>KVp: {state.metadata?.kvp || 'N/A'} kV</div>
        <div>Exp: {state.metadata?.exposureTime || 'N/A'} mA</div>
      </div>
    </div>
  );
};