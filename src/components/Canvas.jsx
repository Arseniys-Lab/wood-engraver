const { useRef, useEffect, forwardRef } = React;
const { gridToBed } = window;

window.Canvas = forwardRef(({
  // Display state
  activeTab,
  bedWidth,
  bedHeight,
  nozzleDiameter,
  containerSize,
  canvasZoom,
  canvasPanX,
  canvasPanY,

  // Points and transforms
  points,
  gridOffsetX,
  gridOffsetY,
  gridRotation,

  // Image
  image,
  showImage,
  clipToBed,
  imageScale,
  imageOffsetX,
  imageOffsetY,
  imageRotation,

  // Tool state
  tool,
  brushSize,
  mousePos,
  mouseScreenPos,
  previewPoints,

  // Test grid
  testGrid,
  testGridOffsetX,
  testGridOffsetY,

  // File drag
  isDraggingFile,

  // Recalculation state
  needsRecalculation,
  autoRecalculate,

  // Event handlers
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onWheel,
  onDragOver,
  onDragLeave,
  onDrop
}, ref) => {
  const drawCanvas = () => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const baseScale = Math.min(containerSize.width / bedWidth, containerSize.height / bedHeight);
    const scale = baseScale * canvasZoom;

    const canvasWidth = containerSize.width;
    const canvasHeight = containerSize.height;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Fill background (black outside bed area)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Apply pan offset
    ctx.save();
    ctx.translate(canvasPanX, canvasPanY);

    // Draw bed area background (lighter)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, bedWidth * scale, bedHeight * scale);

    // Draw bed border
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, bedWidth * scale, bedHeight * scale);

    if (activeTab === 'test-grid') {
      drawTestGrid(ctx, scale);
    } else {
      drawEngraving(ctx, scale);
    }

    ctx.restore();

    // Draw brush/eraser cursor circle using direct screen coordinates
    if (mouseScreenPos && (tool === 'brush' || tool === 'eraser') && canvasWidth > 0 && canvasHeight > 0) {
      ctx.strokeStyle = tool === 'brush' ? '#4ade80' : '#ef4444';
      ctx.fillStyle = tool === 'brush' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouseScreenPos.x, mouseScreenPos.y, brushSize * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawTestGrid = (ctx, scale) => {
    ctx.beginPath();
    ctx.rect(0, 0, bedWidth * scale, bedHeight * scale);
    ctx.clip();
    
    const gridPoints = getTestGridPoints();
    const { timeStart, timeStep, timeCount, depthStart, depthStep, depthCount } = testGrid;
    
    // Draw grid lines
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    
    // Vertical lines (time columns)
    for (let col = 0; col < timeCount; col++) {
      const point = gridPoints[col];
      ctx.beginPath();
      ctx.moveTo(point.x * scale, 0);
      ctx.lineTo(point.x * scale, bedHeight * scale);
      ctx.stroke();
    }
    
    // Horizontal lines (depth rows)
    for (let row = 0; row < depthCount; row++) {
      const point = gridPoints[row * timeCount];
      ctx.beginPath();
      ctx.moveTo(0, (bedHeight - point.y) * scale);
      ctx.lineTo(bedWidth * scale, (bedHeight - point.y) * scale);
      ctx.stroke();
    }
    
    // Draw points
    gridPoints.forEach(point => {
      const screenX = point.x * scale;
      const screenY = (bedHeight - point.y) * scale;

      // Draw point
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(screenX, screenY, Math.max(3, nozzleDiameter * scale), 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw column labels (time values at top)
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#fbbf24'; // Yellow
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let col = 0; col < timeCount; col++) {
      const point = gridPoints[col];
      const time = timeStart + col * timeStep;
      ctx.fillText(`${time}s`, point.x * scale, 15);
    }

    // Draw row labels (depth values on left)
    ctx.fillStyle = '#60a5fa'; // Blue
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let row = 0; row < depthCount; row++) {
      const point = gridPoints[row * timeCount];
      const depth = depthStart + row * depthStep;
      ctx.fillText(`${depth.toFixed(2)}mm`, bedWidth * scale - 5, (bedHeight - point.y) * scale);
    }
    
    // Draw axis labels
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#4ade80';
    
    const firstPoint = gridPoints[0];
    const lastPointX = gridPoints[timeCount - 1];
    const midX = ((firstPoint.x + lastPointX.x) / 2) * scale;
    ctx.textAlign = 'center';
    ctx.fillText(
      `Time: ${timeStart}s → ${timeStart + (timeCount - 1) * timeStep}s`,
      midX,
      bedHeight * scale - 10
    );
    
    const lastPointY = gridPoints[gridPoints.length - 1];
    const midY = ((firstPoint.y + lastPointY.y) / 2);
    ctx.save();
    ctx.translate(10, (bedHeight - midY) * scale);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(
      `Depth: ${depthStart}mm → ${(depthStart + (depthCount - 1) * depthStep).toFixed(2)}mm`,
      0,
      0
    );
    ctx.restore();
  };

  const drawEngraving = (ctx, scale) => {
    // Clip to bed bounds (debug: can be disabled to see full canvas)
    if (clipToBed) {
      ctx.beginPath();
      ctx.rect(0, 0, bedWidth * scale, bedHeight * scale);
      ctx.clip();
    }

    // Draw grid lines
    drawGridLines(ctx, scale);
    
    // Draw coordinate system
    drawCoordinateSystem(ctx, scale);
    
    // Draw image if present
    if (image && showImage) {
      drawImageOverlay(ctx, scale);
    }
    
    // Draw points
    drawPoints(ctx, scale);
    
    // Draw preview points
    if (mousePos && (tool === 'brush' || tool === 'eraser')) {
      drawPreviewPoints(ctx, scale);
    }
  };

  const drawGridLines = (ctx, scale) => {
    ctx.save();
    ctx.translate((bedWidth / 2) * scale, (bedHeight / 2) * scale);
    ctx.translate(gridOffsetX * scale, -gridOffsetY * scale);
    ctx.rotate((gridRotation * Math.PI) / 180);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    const gridExtent = Math.max(bedWidth, bedHeight) * 3;
    
    // Vertical lines
    for (let i = -gridExtent; i <= gridExtent; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i * scale, -gridExtent * scale);
      ctx.lineTo(i * scale, gridExtent * scale);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = -gridExtent; i <= gridExtent; i += 10) {
      ctx.beginPath();
      ctx.moveTo(-gridExtent * scale, i * scale);
      ctx.lineTo(gridExtent * scale, i * scale);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawCoordinateSystem = (ctx, scale) => {
    // X axis
    ctx.strokeStyle = '#ff4444';
    ctx.fillStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, bedHeight * scale - 10);
    ctx.lineTo(50, bedHeight * scale - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, bedHeight * scale - 10);
    ctx.lineTo(45, bedHeight * scale - 15);
    ctx.lineTo(45, bedHeight * scale - 5);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 14px Arial';
    ctx.fillText('X', 55, bedHeight * scale - 5);
    
    // Y axis
    ctx.strokeStyle = '#44ff44';
    ctx.fillStyle = '#44ff44';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, bedHeight * scale - 10);
    ctx.lineTo(10, bedHeight * scale - 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, bedHeight * scale - 50);
    ctx.lineTo(5, bedHeight * scale - 45);
    ctx.lineTo(15, bedHeight * scale - 45);
    ctx.closePath();
    ctx.fill();
    ctx.fillText('Y', 5, bedHeight * scale - 55);
    
    // Origin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, bedHeight * scale - 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('0,0', 18, bedHeight * scale - 15);
  };

  const drawImageOverlay = (ctx, scale) => {
    ctx.globalAlpha = 0.3;
    
    ctx.save();
    
    const bedCenterTx = (bedWidth / 2) * scale;
    const bedCenterTy = (bedHeight / 2) * scale;
    ctx.translate(bedCenterTx, bedCenterTy);

    const gridTx = gridOffsetX * scale;
    const gridTy = -gridOffsetY * scale;
    ctx.translate(gridTx, gridTy);
    
    ctx.rotate((gridRotation * Math.PI) / 180);
    
    const imageTx = imageOffsetX * scale;
    const imageTy = -imageOffsetY * scale;
    ctx.translate(imageTx, imageTy);

    ctx.rotate((imageRotation * Math.PI) / 180);
    
    console.log('[Canvas.jsx] drawImageOverlay Transforms:', {
      bedCenter: { x: bedCenterTx, y: bedCenterTy },
      grid: { x: gridTx, y: gridTy },
      image: { x: imageTx, y: imageTy },
      totalTx: bedCenterTx + gridTx + imageTx, // Simplified, doesn't account for rotation
      totalTy: bedCenterTy + gridTy + imageTy, // Simplified, doesn't account for rotation
    });

    const imgScale = Math.min(bedWidth / image.width, bedHeight / image.height) * imageScale;
    const width = image.width * imgScale * scale;
    const height = image.height * imgScale * scale;
    
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  const drawPoints = (ctx, scale) => {
    // Hide dots if recalculation is needed and auto-recalc is off
    if (needsRecalculation && !autoRecalculate) {
      return;
    }

    ctx.fillStyle = '#ff6b6b';
    points.forEach(point => {
      const bedPoint = gridToBed(point, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight);

      if (bedPoint.x >= 0 && bedPoint.x <= bedWidth && bedPoint.y >= 0 && bedPoint.y <= bedHeight) {
        ctx.beginPath();
        ctx.arc(bedPoint.x * scale, (bedHeight - bedPoint.y) * scale, Math.max(1, (nozzleDiameter / 2) * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawPreviewPoints = (ctx, scale) => {
    if (tool === 'brush') {
      ctx.fillStyle = '#4ade80';
      previewPoints.forEach(point => {
        const bedPoint = gridToBed(point, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight);
        if (bedPoint.x >= 0 && bedPoint.x <= bedWidth && bedPoint.y >= 0 && bedPoint.y <= bedHeight) {
          ctx.beginPath();
          ctx.arc(bedPoint.x * scale, (bedHeight - bedPoint.y) * scale, Math.max(2, (nozzleDiameter / 2) * scale), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else if (tool === 'eraser') {
      ctx.fillStyle = '#ef4444';
      previewPoints.forEach(point => {
        const bedPoint = gridToBed(point, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight);
        if (bedPoint.x >= 0 && bedPoint.x <= bedWidth && bedPoint.y >= 0 && bedPoint.y <= bedHeight) {
          ctx.beginPath();
          ctx.arc(bedPoint.x * scale, (bedHeight - bedPoint.y) * scale, Math.max(2, (nozzleDiameter / 2) * scale), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  };

  const getTestGridPoints = () => {
    const { timeStart, timeStep, timeCount, depthStart, depthStep, depthCount, spacing } = testGrid;
    
    const gridWidth = (timeCount - 1) * spacing;
    const gridHeight = (depthCount - 1) * spacing;
    const startX = (bedWidth - gridWidth) / 2 + testGridOffsetX;
    const startY = (bedHeight - gridHeight) / 2 + testGridOffsetY;
    
    const points = [];
    
    for (let row = 0; row < depthCount; row++) {
      const depth = depthStart + row * depthStep;
      for (let col = 0; col < timeCount; col++) {
        const time = timeStart + col * timeStep;
        const x = startX + col * spacing;
        const y = startY + row * spacing;
        points.push({ x, y, time, depth, row, col });
      }
    }
    
    return points;
  };

  useEffect(() => {
    let rafId = null;
    let pendingDraw = false;

    const scheduleDraw = () => {
      if (!pendingDraw) {
        pendingDraw = true;
        rafId = requestAnimationFrame(() => {
          drawCanvas();
          pendingDraw = false;
        });
      }
    };

    scheduleDraw();

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    points, nozzleDiameter, bedWidth, bedHeight, gridOffsetX, gridOffsetY, gridRotation,
    imageScale, imageOffsetX, imageOffsetY, imageRotation, image, showImage,
    canvasZoom, canvasPanX, canvasPanY, containerSize, mousePos, mouseScreenPos, previewPoints,
    tool, brushSize, activeTab, testGrid, testGridOffsetX, testGridOffsetY
  ]);

  return (
    <div 
      className={`flex-1 bg-gray-800 rounded-lg p-4 flex items-center justify-center overflow-hidden relative ${isDraggingFile ? 'ring-4 ring-blue-500 bg-gray-700' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDraggingFile && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <p className="text-xl font-bold text-blue-400">Drop image here</p>
          </div>
        </div>
      )}
      <canvas
        ref={ref}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
        className={tool === 'move' ? 'cursor-move' : 'cursor-none'}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});

window.Canvas.displayName = 'Canvas';
