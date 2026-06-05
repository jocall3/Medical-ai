import React, { useRef, useState, useEffect } from 'react';
import { useRadiology, Annotation } from '../context/RadiologyContext';

interface AnnotationToolProps {
  width: number;
  height: number;
}

export const AnnotationTool: React.FC<AnnotationToolProps> = ({ width, height }) => {
  const { state, dispatch } = useRadiology();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    state.annotations.forEach((ann) => {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.font = '12px sans-serif';

      if (ann.type === 'box') {
        const { x, y, w, h } = ann.coordinates;
        if (w !== undefined && h !== undefined) {
          ctx.strokeRect(x, y, w, h);
          ctx.fillText(ann.label, x, y - 5);
        }
      } else if (ann.type === 'point') {
        const { x, y } = ann.coordinates;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText(ann.label, x + 8, y + 4);
      } else if (ann.type === 'ruler') {
        const { x, y, x2, y2 } = ann.coordinates;
        if (x2 !== undefined && y2 !== undefined) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.arc(x2, y2, 3, 0, 2 * Math.PI);
          ctx.fill();
          const distPx = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
          const distMm = (distPx * 0.15).toFixed(1);
          ctx.fillText(`${distMm} mm`, (x + x2) / 2 + 10, (y + y2) / 2);
        }
      }
    });

    if (isDrawing && startPos && currentPos && state.activeAnnotationType) {
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 2;

      if (state.activeAnnotationType === 'box') {
        const w = currentPos.x - startPos.x;
        const h = currentPos.y - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, w, h);
      } else if (state.activeAnnotationType === 'point') {
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      } else if (state.activeAnnotationType === 'ruler') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      }
    }
  }, [state.annotations, isDrawing, startPos, currentPos, state.activeAnnotationType, width, height]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.activeAnnotationType) return;
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    setCurrentPos(pos);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPos || !currentPos || !state.activeAnnotationType) return;

    let coordinates: Annotation['coordinates'] = { x: startPos.x, y: startPos.y };
    let label = '';

    if (state.activeAnnotationType === 'box') {
      const w = currentPos.x - startPos.x;
      const h = currentPos.y - startPos.y;
      coordinates = { x: startPos.x, y: startPos.y, w, h };
      label = `ROI #${state.annotations.length + 1}`;
    } else if (state.activeAnnotationType === 'point') {
      coordinates = { x: currentPos.x, y: currentPos.y };
      label = `Marker #${state.annotations.length + 1}`;
    } else if (state.activeAnnotationType === 'ruler') {
      coordinates = { x: startPos.x, y: startPos.y, x2: currentPos.x, y2: currentPos.y };
      const distPx = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));
      label = `Measurement: ${(distPx * 0.15).toFixed(1)} mm`;
    }

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: state.activeAnnotationType,
      coordinates,
      label,
      createdAt: new Date().toLocaleTimeString(),
    };

    dispatch({ type: 'ADD_ANNOTATION', payload: newAnnotation });
    setIsDrawing(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`absolute top-0 left-0 z-10 ${
        state.activeAnnotationType ? 'cursor-crosshair' : 'cursor-default pointer-events-none'
      }`}
    />
  );
};