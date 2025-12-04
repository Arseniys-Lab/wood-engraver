// G-code parsing utilities

window.parseGCodeFile = (gcode, fileName, currentSettings) => {
  const lines = gcode.split('\n');
  const extractedPoints = [];
  let detectedBedWidth = currentSettings.bedWidth;
  let detectedBedHeight = currentSettings.bedHeight;
  let detectedTemperature = 0;
  let detectedDwellTime = currentSettings.dwellTime;
  let detectedDepthZ = currentSettings.depthZ;
  let detectedStepSize = currentSettings.stepSize;
  let detectedFileName = 'engraving';
  
  // Extract parameters from comments
  for (const line of lines) {
    if (line.includes('Bed Size:')) {
      const match = line.match(/(\d+)×(\d+)mm/);
      if (match) {
        detectedBedWidth = parseInt(match[1]);
        detectedBedHeight = parseInt(match[2]);
      }
    }
    if (line.includes('Resolution:')) {
      const match = line.match(/Resolution:\s*(\d+\.?\d*)mm/);
      if (match) {
        detectedStepSize = parseFloat(match[1]);
      }
    }
    if (line.includes('Engraving Z:')) {
      const match = line.match(/Engraving Z:\s*([-\d.]+)mm/);
      if (match) {
        detectedDepthZ = parseFloat(match[1]);
      }
    }
  }
  
  // Extract temperature
  let foundPreheat = false;
  for (const line of lines) {
    if (line.includes('M104 S') || line.includes('M109 S')) {
      const match = line.match(/S(\d+)/);
      if (match) {
        const temp = parseInt(match[1]);
        if (temp === 170) {
          foundPreheat = true;
        } else if (foundPreheat && temp > 170) {
          detectedTemperature = temp;
          break;
        } else if (!foundPreheat && temp > 0) {
          detectedTemperature = temp;
        }
      }
    }
    if (line.includes('G4 S')) {
      const match = line.match(/G4 S(\d+)/);
      if (match) {
        detectedDwellTime = parseInt(match[1]);
      }
    }
  }
  
  if (detectedTemperature === 0) {
    detectedTemperature = currentSettings.temperature;
  }
  
  // Extract points
  let currentX = null;
  let currentY = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(';')) continue;
    
    if (trimmed.startsWith('G0 ') || trimmed.startsWith('G1 ')) {
      const xMatch = trimmed.match(/X([-\d.]+)/);
      const yMatch = trimmed.match(/Y([-\d.]+)/);
      const zMatch = trimmed.match(/Z([-\d.]+)/);
      
      if (xMatch) currentX = parseFloat(xMatch[1]);
      if (yMatch) currentY = parseFloat(yMatch[1]);
      
      if (currentX !== null && currentY !== null && zMatch) {
        const z = parseFloat(zMatch[1]);
        if (z < 0 || Math.abs(z - detectedDepthZ) < 0.1) {
          extractedPoints.push({
            x: Math.round(currentX * 10) / 10,
            y: Math.round(currentY * 10) / 10
          });
        }
      }
    }
  }
  
  // Remove duplicates
  const uniquePoints = [];
  const seen = new Set();
  for (const point of extractedPoints) {
    const key = `${point.x},${point.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePoints.push(point);
    }
  }
  
  // Analyze distances for step size suggestion
  let suggestedStepSize = detectedStepSize;
  if (uniquePoints.length > 1) {
    const distances = [];
    for (let i = 0; i < Math.min(100, uniquePoints.length - 1); i++) {
      for (let j = i + 1; j < Math.min(i + 10, uniquePoints.length); j++) {
        const dx = uniquePoints[j].x - uniquePoints[i].x;
        const dy = uniquePoints[j].y - uniquePoints[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1 && dist < 50) {
          distances.push(dist);
        }
      }
    }
    
    if (distances.length > 0) {
      distances.sort((a, b) => a - b);
      const rounded = distances.map(d => Math.round(d * 10) / 10);
      const counts = {};
      let maxCount = 0;
      let modeDistance = rounded[0];
      
      for (const d of rounded) {
        counts[d] = (counts[d] || 0) + 1;
        if (counts[d] > maxCount) {
          maxCount = counts[d];
          modeDistance = d;
        }
      }
      
      suggestedStepSize = modeDistance;
    }
  }
  
  // Extract filename
  if (fileName) {
    const nameMatch = fileName.match(/(.+)\.gcode/);
    if (nameMatch) {
      detectedFileName = nameMatch[1];
    }
  }
  
  return {
    points: uniquePoints,
    bedWidth: detectedBedWidth,
    bedHeight: detectedBedHeight,
    temperature: detectedTemperature,
    dwellTime: detectedDwellTime,
    depthZ: detectedDepthZ,
    stepSize: suggestedStepSize,
    fileName: detectedFileName
  };
};
