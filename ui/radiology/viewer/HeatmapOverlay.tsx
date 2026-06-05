import React, { useEffect, useRef } from 'react';
import { useRadiology } from '../context/RadiologyContext';

interface HeatmapOverlayProps {
  width: number;
  height: number;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({ width, height }) => {
  const { state } = useRadiology();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!state.showHeatmap || !state.selectedAnomalyId) return;

    const activeAnomaly = state.anomalies.find(a => a.id === state.selectedAnomalyId);
    if (!activeAnomaly || !activeAnomaly.heatmapGrid) return;

    const grid = activeAnomaly.heatmapGrid;
    const rows = grid.length;
    const cols = grid[0].length;

    const offscreen = document.createElement('canvas');
    offscreen.width = cols;
    offscreen.height = rows;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    const imgData = oCtx.createImageData(cols, rows);

    const getJetColor = (v: number) => {
      const val = Math.max(0, Math.min(1, v));
      const r = Math.max(0, Math.min(255, Math.round(255 * Math.min(4 * val - 1.5, -4 * val + 4.5))));
      const g = Math.max(0, Math.min(255, Math.round(255 * Math.min(4 * val - 0.5, -4 * val + 3.5))));
      const b = Math.max(0, Math.min(255, Math.round(255 * Math.min(4 * val + 0.5, -4 * val + 2.5))));
      return { r, g, b };
    };

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const val = grid[y][x];
        const color = getJetColor(val);
        const idx = (y * cols + x) * 4;
        imgData.data[idx] = color.r;
        imgData.data[idx + 1] = color.g;
        imgData.data[idx + 2] = color.b;
        imgData.data[idx + 3] = Math.round(val * 255 * state.heatmapOpacity);
      }
    }

    oCtx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, 0, 0, width, height);

  }, [state.showHeatmap, state.selectedAnomalyId, state.heatmapOpacity, state.anomalies, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none mix-blend-screen"
      style={{ opacity: state.heatmapOpacity }}
    />
  );
};