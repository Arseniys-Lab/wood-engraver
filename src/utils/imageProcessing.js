// Image processing algorithms
window.ImageProcessing = window.ImageProcessing || {};

// Zhang-Suen thinning algorithm for skeletonization
window.ImageProcessing.skeletonize = (gray, width, height, threshold) => {
  // Binarize first
  const binary = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] < threshold ? 1 : 0; // 1 for dark pixels (lines)
  }

  let changed = true;
  while (changed) {
    changed = false;
    const toDelete = [];

    // Step 1
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (binary[idx] === 1) {
          const p2 = binary[(y - 1) * width + x];
          const p3 = binary[(y - 1) * width + (x + 1)];
          const p4 = binary[y * width + (x + 1)];
          const p5 = binary[(y + 1) * width + (x + 1)];
          const p6 = binary[(y + 1) * width + x];
          const p7 = binary[(y + 1) * width + (x - 1)];
          const p8 = binary[y * width + (x - 1)];
          const p9 = binary[(y - 1) * width + (x - 1)];

          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          let A = 0;
          if (p2 === 0 && p3 === 1) A++;
          if (p3 === 0 && p4 === 1) A++;
          if (p4 === 0 && p5 === 1) A++;
          if (p5 === 0 && p6 === 1) A++;
          if (p6 === 0 && p7 === 1) A++;
          if (p7 === 0 && p8 === 1) A++;
          if (p8 === 0 && p9 === 1) A++;
          if (p9 === 0 && p2 === 1) A++;

          if (A === 1 && B >= 2 && B <= 6 && p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0) {
            toDelete.push(idx);
          }
        }
      }
    }

    for (const idx of toDelete) {
      binary[idx] = 0;
      changed = true;
    }

    toDelete.length = 0;

    // Step 2
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (binary[idx] === 1) {
          const p2 = binary[(y - 1) * width + x];
          const p3 = binary[(y - 1) * width + (x + 1)];
          const p4 = binary[y * width + (x + 1)];
          const p5 = binary[(y + 1) * width + (x + 1)];
          const p6 = binary[(y + 1) * width + x];
          const p7 = binary[(y + 1) * width + (x - 1)];
          const p8 = binary[y * width + (x - 1)];
          const p9 = binary[(y - 1) * width + (x - 1)];

          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          let A = 0;
          if (p2 === 0 && p3 === 1) A++;
          if (p3 === 0 && p4 === 1) A++;
          if (p4 === 0 && p5 === 1) A++;
          if (p5 === 0 && p6 === 1) A++;
          if (p6 === 0 && p7 === 1) A++;
          if (p7 === 0 && p8 === 1) A++;
          if (p8 === 0 && p9 === 1) A++;
          if (p9 === 0 && p2 === 1) A++;

          if (A === 1 && B >= 2 && B <= 6 && p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0) {
            toDelete.push(idx);
          }
        }
      }
    }

    for (const idx of toDelete) {
      binary[idx] = 0;
      changed = true;
    }
  }

  // Convert back to grayscale (0 or 255)
  const result = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < binary.length; i++) {
    result[i] = binary[i] === 1 ? 0 : 255; // Dark pixels where skeleton exists
  }
  return result;
};

window.ImageProcessing.sobelEdgeDetection = (gray, width, height) => {
  const edges = new Uint8ClampedArray(width * height);
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kidx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kidx];
          gy += gray[idx] * sobelY[kidx];
        }
      }
      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return edges;
};

window.ImageProcessing.floydSteinbergDither = (gray, width, height, thresh) => {
  const result = new Uint8ClampedArray(gray);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = result[idx];
      const newPixel = oldPixel < thresh ? 0 : 255;
      result[idx] = newPixel;
      const error = oldPixel - newPixel;
      
      if (x + 1 < width) result[idx + 1] += error * 7 / 16;
      if (y + 1 < height) {
        if (x > 0) result[idx + width - 1] += error * 3 / 16;
        result[idx + width] += error * 5 / 16;
        if (x + 1 < width) result[idx + width + 1] += error * 1 / 16;
      }
    }
  }
  return result;
};

window.ImageProcessing.gaussianBlur = (data, width, height) => {
  const result = new Uint8ClampedArray(data);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kidx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kidx];
          }
        }
        result[(y * width + x) * 4 + c] = sum / kernelSum;
      }
    }
  }
  return result;
};

window.ImageProcessing.sharpenFilter = (data, width, height) => {
  const result = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kidx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kidx];
          }
        }
        result[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  return result;
};

window.ImageProcessing.applyBrightness = (data, amount) => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + amount));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount));
  }
  return data;
};

window.ImageProcessing.rgbToGrayscale = (data, width, height) => {
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return gray;
};

window.ImageProcessing.extractPointsFromGray = (gray, canvasWidth, compareFn, stepSize, pointPattern, bedWidth, bedHeight, threshold) => {
  const newPoints = [];
  const halfCanvas = canvasWidth / 2;
  const halfBedX = bedWidth / 2;
  const halfBedY = bedHeight / 2;

  if (pointPattern === 'square') {
    // Sample at grid intervals (stepSize) like v2.4.1
    // This is critical for dithering - sampling every pixel would fill everything

    const minGridX = -halfCanvas + halfBedX;
    const maxGridX = canvasWidth - halfCanvas + halfBedX;
    const minGridY = -halfCanvas + halfBedY;
    const maxGridY = canvasWidth - halfCanvas + halfBedY;

    const startGx = Math.floor(minGridX / stepSize) * stepSize;
    const startGy = Math.floor(minGridY / stepSize) * stepSize;

    for (let gy = startGy; gy <= maxGridY + stepSize; gy += stepSize) {
      // Convert grid Y to canvas Y
      const cy = canvasWidth - (gy + halfCanvas - halfBedY);

      if (cy >= 0 && cy < canvasWidth) {
        for (let gx = startGx; gx <= maxGridX + stepSize; gx += stepSize) {
          // Convert grid X to canvas X
          const cx = gx + halfCanvas - halfBedX;

          if (cx >= 0 && cx < canvasWidth) {
            const idx = Math.floor(cy) * canvasWidth + Math.floor(cx);
            if (idx >= 0 && idx < gray.length && compareFn(gray[idx])) {
              newPoints.push({
                x: Math.round(gx * 10) / 10,
                y: Math.round(gy * 10) / 10,
                source: 'image'
              });
            }
          }
        }
      }
    }
  } else if (pointPattern === 'triangle') {
    // Triangular/hexagonal packing - sample at grid intervals like v2.4.1
    const rowHeight = stepSize * Math.sqrt(3) / 2;

    const minGridY = -halfCanvas + halfBedY;
    const maxGridY = canvasWidth - halfCanvas + halfBedY;

    const minRow = Math.floor(minGridY / rowHeight) - 1;
    const maxRow = Math.ceil(maxGridY / rowHeight) + 1;

    for (let r = minRow; r <= maxRow; r++) {
      const gridY = r * rowHeight;
      // Convert to canvas Y
      const cy = canvasWidth - (gridY + halfCanvas - halfBedY);

      if (cy >= 0 && cy < canvasWidth) {
        // Calculate X range for this row
        const rowOffset = (Math.abs(r) % 2 === 1) ? (stepSize / 2) : 0;
        const minGridX = -halfCanvas + halfBedX;
        const maxGridX = canvasWidth - halfCanvas + halfBedX;

        const minCol = Math.floor((minGridX - rowOffset) / stepSize) - 1;
        const maxCol = Math.ceil((maxGridX - rowOffset) / stepSize) + 1;

        for (let c = minCol; c <= maxCol; c++) {
          const gridX = c * stepSize + rowOffset;
          // Convert to canvas X
          const cx = gridX + halfCanvas - halfBedX;

          if (cx >= 0 && cx < canvasWidth) {
            const idx = Math.floor(cy) * canvasWidth + Math.floor(cx);
            if (idx >= 0 && idx < gray.length && compareFn(gray[idx])) {
              newPoints.push({
                x: Math.round(gridX * 10) / 10,
                y: Math.round(gridY * 10) / 10,
                source: 'image'
              });
            }
          }
        }
      }
    }
  } else if (pointPattern === 'contour') {
    // Contour mode: Skeleton-based with canvasScale coordinate system
    const skeleton = window.ImageProcessing.skeletonize(gray, canvasWidth, canvasWidth, threshold);

    const minDist = stepSize * 0.9;
    const bucketSize = Math.max(1, minDist);

    // Create spatial grid for O(1) proximity checks
    const buckets = new Map();

    const getBucketKey = (x, y) => {
      const bx = Math.floor(x / bucketSize);
      const by = Math.floor(y / bucketSize);
      return `${bx},${by}`;
    };

    const isNearExisting = (x, y) => {
      const bx = Math.floor(x / bucketSize);
      const by = Math.floor(y / bucketSize);

      // Check surrounding 9 buckets
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const key = `${bx + dx},${by + dy}`;
          const bucket = buckets.get(key);
          if (bucket) {
            for (const point of bucket) {
              const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
              if (dist < minDist) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    const addToBucket = (x, y) => {
      const key = getBucketKey(x, y);
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key).push({ x, y });
    };

    // Variable mode uses canvasScale = 3 coordinate system
    const canvasScale = 3;

    // Sample at PIXEL RESOLUTION for high-resolution line tracing
    for (let y = 0; y < canvasWidth; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const idx = y * canvasWidth + x;
        // Skeleton has dark pixels (value 0) where lines are
        if (skeleton[idx] < 128) {
          // Convert canvas pixel to bed coordinates using canvasScale
          const bedX = (x - halfCanvas) / canvasScale;
          const bedY = ((canvasWidth - y) - halfCanvas) / canvasScale;

          const gridX = Math.round(bedX * 10) / 10;
          const gridY = Math.round(bedY * 10) / 10;

          if (!isNearExisting(gridX, gridY)) {
            newPoints.push({ x: gridX, y: gridY, source: 'image' });
            addToBucket(gridX, gridY);
          }
        }
      }
    }
  }
  
  return newPoints;
};
