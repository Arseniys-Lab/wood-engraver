// G-code generation utilities

const VERSION = "4.3.2";

window.generateEngravingGCode = ({
  points,
  bedWidth,
  bedHeight,
  temperature,
  dwellTime,
  depthZ,
  yAcceleration,
  startGcode,
  useBedLeveling,
  pointPattern
}) => {
  // Optimize point order (nearest neighbor)
  const optimizedPoints = optimizePointOrder(points);
  
  const totalPoints = optimizedPoints.length;
  const estimatedSeconds = totalPoints * (dwellTime + 2) + totalPoints * 0.5;
  
  const safeZ = 5;
  
  // Calculate minimal print area bounds for bed leveling
  const minX = Math.min(...optimizedPoints.map(p => p.x));
  const maxX = Math.max(...optimizedPoints.map(p => p.x));
  const minY = Math.min(...optimizedPoints.map(p => p.y));
  const maxY = Math.max(...optimizedPoints.map(p => p.y));
  
  const levelWidth = maxX - minX;
  const levelHeight = maxY - minY;
  
  let bedLevelingGcode = '';
  if (useBedLeveling) {
    bedLevelingGcode = `
;===== BED LEVELLING (minimal area) =====
G90
G21
G1 Z5 F1200
G29.2 S1
G29 A1 X${minX.toFixed(2)} Y${minY.toFixed(2)} I${levelWidth.toFixed(2)} J${levelHeight.toFixed(2)}
M400
M500
`;
  }
  
  const heatingGcode = `
;===== HEAT TO ${temperature}°C =====
M104 S${temperature}
M109 S${temperature}
G0 Z10 F1000

;===== LIMIT Y ACCELERATION =====
M204 S${yAcceleration} T${yAcceleration}
M204 P${yAcceleration}`;
  
  let gcode = `;===== Wood Engraving Generator v${VERSION} =====
;===== Made by Arseniy's Lab =====
;===== https://www.youtube.com/@ArseniyLab =====


${startGcode}
${bedLevelingGcode}${heatingGcode}

;===== ENGRAVING ${totalPoints} POINTS =====
;===== Estimated time: ${Math.floor(estimatedSeconds / 3600)}h ${Math.floor((estimatedSeconds % 3600) / 60)}m =====
;===== Safe Z: ${safeZ}mm | Engraving Z: ${depthZ}mm (relative to bed surface) =====
;===== Y Acceleration: ${yAcceleration}mm/s² =====
;===== Point Pattern: ${pointPattern} =====

`;
  
  optimizedPoints.forEach((point, index) => {
    const progress = Math.round((index / totalPoints) * 100);
    const remainingPoints = totalPoints - index;
    const remainingTime = Math.ceil((remainingPoints * (dwellTime + 2) + remainingPoints * 0.5) / 60);
    
    gcode += `M73 P${progress} R${remainingTime}\n`;
    
    if (index === 0 || (progress % 10 === 0 && Math.floor(((index - 1) / totalPoints) * 100) !== progress)) {
      gcode += `;===== Progress: ${progress}% | ${index}/${totalPoints} points | ~${remainingTime}min remaining =====\n`;
    }
    
    gcode += `G0 Z${safeZ} F1000
G0 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} F3000
G0 Z${depthZ.toFixed(2)} F300
G4 S${dwellTime}
G0 Z${safeZ} F1000

`;
  });
  
  gcode += `;===== Progress: 100% | COMPLETE =====
;===== Made by Arseniy's Lab =====
;===== END =====
M104 S0
G0 Z30 F1000
G28 X Y
M84`;
  
  return gcode;
};

window.generateTestGridGCode = ({
  testGrid,
  bedWidth,
  bedHeight,
  testGridOffsetX,
  testGridOffsetY,
  yAcceleration,
  testStartGcode,
  useBedLeveling
}) => {
  const { timeStart, timeStep, timeCount, depthStart, depthStep, depthCount, spacing, temperature } = testGrid;
  
  const safeZ = 5;
  const totalPoints = timeCount * depthCount;
  
  // Calculate grid dimensions with offset
  const gridWidth = (timeCount - 1) * spacing;
  const gridHeight = (depthCount - 1) * spacing;
  
  // Center the grid on bed + offset
  const startX = (bedWidth - gridWidth) / 2 + testGridOffsetX;
  const startY = (bedHeight - gridHeight) / 2 + testGridOffsetY;
  
  let bedLevelingGcode = '';
  if (useBedLeveling) {
    bedLevelingGcode = `
;===== BED LEVELLING (minimal area) =====
G90
G21
G1 Z5 F1200
G29.2 S1
G29 A1 X${startX.toFixed(2)} Y${startY.toFixed(2)} I${gridWidth.toFixed(2)} J${gridHeight.toFixed(2)}
M400
M500
`;
  }
  
  const heatingGcode = `
;===== HEAT TO ${temperature}°C =====
M104 S${temperature}
M109 S${temperature}
G0 Z10 F1000

;===== LIMIT Y ACCELERATION =====
M204 S${yAcceleration} T${yAcceleration}
M204 P${yAcceleration}`;
  
  let gcode = `;===== Wood Engraving Test Grid Generator v${VERSION} =====
;===== Made by Arseniy's Lab =====
;===== https://www.youtube.com/@ArseniyLab =====
;
;===== TEST GRID PARAMETERS =====
;===== Time Range: ${timeStart}s to ${timeStart + (timeCount - 1) * timeStep}s (step: ${timeStep}s) =====
;===== Depth Range: ${depthStart}mm to ${(depthStart + (depthCount - 1) * depthStep).toFixed(2)}mm (step: ${depthStep}mm) =====
;===== Grid Size: ${timeCount} x ${depthCount} = ${totalPoints} points =====
;===== Spacing: ${spacing}mm =====
;===== Y Acceleration: ${yAcceleration}mm/s² =====


${testStartGcode}
${bedLevelingGcode}${heatingGcode}

;===== TEST GRID START =====
;===== X-axis: Time (columns) =====
;===== Y-axis: Depth (rows) =====

`;
  
  // Calculate total time for all points (for progress estimation)
  let totalTime = 0;
  for (let r = 0; r < depthCount; r++) {
    for (let c = 0; c < timeCount; c++) {
      const time = timeStart + c * timeStep;
      totalTime += time + 3; // time + move time estimate
    }
  }

  let pointIndex = 0;
  let elapsedTime = 0;

  for (let row = 0; row < depthCount; row++) {
    const depth = depthStart + row * depthStep;

    for (let col = 0; col < timeCount; col++) {
      const time = timeStart + col * timeStep;
      const x = startX + col * spacing;
      const y = startY + row * spacing;

      pointIndex++;
      const progress = Math.round((pointIndex / totalPoints) * 100);

      // Calculate remaining time based on remaining points and their variable dwell times
      const remainingTime = Math.ceil((totalTime - elapsedTime) / 60);
      elapsedTime += time + 3;

      // Add M73 progress command
      gcode += `M73 P${progress} R${remainingTime}\n`;

      // Add periodic progress comment every 10%
      if (pointIndex === 1 || (progress % 10 === 0 && Math.floor(((pointIndex - 2) / totalPoints) * 100) !== progress)) {
        gcode += `;===== Progress: ${progress}% | ${pointIndex}/${totalPoints} points | ~${remainingTime}min remaining =====\n`;
      }

      gcode += `;----- Point ${pointIndex}/${totalPoints} -----
;----- Row ${row + 1}/${depthCount}, Col ${col + 1}/${timeCount} -----
;----- Depth: ${depth.toFixed(2)}mm, Time: ${time}s -----
G0 Z${safeZ} F1000
G0 X${x.toFixed(2)} Y${y.toFixed(2)} F3000
G0 Z${depth.toFixed(2)} F300
G4 S${time}
G0 Z${safeZ} F1000

`;
    }
  }
  
  gcode += `;===== TEST GRID COMPLETE =====
;===== Made by Arseniy's Lab =====
;===== END =====
M104 S0
G0 Z30 F1000
G28 X Y
M84`;
  
  return gcode;
};

// Nearest neighbor optimization
const optimizePointOrder = (points) => {
  if (points.length === 0) return [];
  
  const optimized = [];
  const remaining = [...points];
  
  let current = remaining[0];
  optimized.push(current);
  remaining.splice(0, 1);
  
  while (remaining.length > 0) {
    let nearest = 0;
    let minDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = Math.sqrt(
        (remaining[i].x - current.x) ** 2 + 
        (remaining[i].y - current.y) ** 2
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    
    current = remaining[nearest];
    optimized.push(current);
    remaining.splice(nearest, 1);
  }
  
  return optimized;
};

window.downloadGCode = (gcode, fileName) => {
  const blob = new Blob([gcode], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.gcode`;
  a.click();
  URL.revokeObjectURL(url);
};
