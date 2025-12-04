// Coordinate transformation utilities
// Transforms points between grid space and bed space

window.gridToBed = (point, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight) => {
  const centerX = bedWidth / 2;
  const centerY = bedHeight / 2;
  
  let x = point.x;
  let y = bedHeight - point.y;
  
  // Translate to grid center
  x = x - centerX;
  y = y - centerY;
  
  // Apply grid rotation
  if (gridRotation !== 0) {
    const angle = gridRotation * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    x = newX;
    y = newY;
  }
  
  // Apply grid offset
  x = x + gridOffsetX;
  y = y - gridOffsetY;
  
  // Translate back
  x = x + centerX;
  y = y + centerY;
  
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round((bedHeight - y) * 10) / 10
  };
};

window.bedToGrid = (bedPoint, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight) => {
  const centerX = bedWidth / 2;
  const centerY = bedHeight / 2;
  
  let x = bedPoint.x;
  let y = bedHeight - bedPoint.y;
  
  // Translate to bed center
  x = x - centerX;
  y = y - centerY;
  
  // Remove grid offset
  x = x - gridOffsetX;
  y = y + gridOffsetY;
  
  // Remove grid rotation
  if (gridRotation !== 0) {
    const angle = -gridRotation * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    x = newX;
    y = newY;
  }
  
  // Translate back
  x = x + centerX;
  y = y + centerY;
  
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round((bedHeight - y) * 10) / 10
  };
};
