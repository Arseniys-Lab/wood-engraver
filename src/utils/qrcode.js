// QR Code generation utility
// Uses qrcode-generator library (loaded via CDN in index.html)

window.QRCodeUtil = window.QRCodeUtil || {};

/**
 * Generate burn points from QR code text
 * @param {string} text - Text or URL to encode
 * @param {number} stepSize - Distance between burn points
 * @param {number} bedWidth - Bed width in mm
 * @param {number} bedHeight - Bed height in mm
 * @param {number} offsetX - Horizontal offset
 * @param {number} offsetY - Vertical offset
 * @param {number} dotsPerModule - Optional: override auto dots-per-module calculation
 * @returns {Object} {points, qrSize, physicalSize, stepSize, dotsPerModule, bounds}
 */
window.QRCodeUtil.generateQRPoints = (text, stepSize, bedWidth, bedHeight, offsetX = 0, offsetY = 0, dotsPerModule = null) => {
  if (!text || text.trim() === '') {
    throw new Error('Text cannot be empty');
  }

  // Check if qrcode library is loaded
  if (typeof qrcode === 'undefined') {
    throw new Error('QR code library not loaded');
  }

  // Create QR code - using error correction level M (15% can be restored)
  const typeNumber = 0; // Auto-detect best size
  const errorCorrectionLevel = 'M';
  const qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount(); // Size of QR matrix (e.g., 21x21, 25x25, etc.)

  // Calculate dots per module
  // Use provided dotsPerModule or auto-calculate (default to 3 for good readability)
  const actualDotsPerModule = dotsPerModule !== null
    ? dotsPerModule
    : 3;

  // QR code VARIABLE physical size - based on stepSize and dotsPerModule
  // Each QR module contains actualDotsPerModule x actualDotsPerModule grid of dots
  // Physical size of one module = actualDotsPerModule * stepSize
  const moduleSize = actualDotsPerModule * stepSize;
  const qrPhysicalSize = moduleCount * moduleSize;

  // Center the QR code on bed
  const startX = (bedWidth - qrPhysicalSize) / 2 + offsetX;
  const startY = (bedHeight - qrPhysicalSize) / 2 + offsetY;

  const points = [];

  // Generate point CLUSTERS for dark modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        // For each dark module, generate an NxN grid of dots
        const moduleStartX = startX + col * moduleSize;
        const moduleStartY = startY + row * moduleSize;

        // Generate dots in a grid within this module
        for (let dy = 0; dy < actualDotsPerModule; dy++) {
          for (let dx = 0; dx < actualDotsPerModule; dx++) {
            const x = moduleStartX + dx * stepSize;
            const y = moduleStartY + dy * stepSize;

            // Round to 1 decimal place and tag as QR source
            points.push({
              x: Math.round(x * 10) / 10,
              y: Math.round(y * 10) / 10,
              source: 'qr'
            });
          }
        }
      }
    }
  }

  // Calculate QR bounds for hover detection
  const bounds = {
    minX: startX,
    maxX: startX + qrPhysicalSize,
    minY: startY,
    maxY: startY + qrPhysicalSize
  };

  return {
    points,
    qrSize: moduleCount,
    physicalSize: qrPhysicalSize,
    stepSize: stepSize,
    dotsPerModule: actualDotsPerModule,
    bounds
  };
};

/**
 * Generate preview matrix for QR code (for visualization)
 * @param {string} text - Text to encode
 * @returns {Object} QR matrix and size
 */
window.QRCodeUtil.generateQRMatrix = (text) => {
  if (!text || text.trim() === '') {
    return null;
  }

  if (typeof qrcode === 'undefined') {
    return null;
  }

  const typeNumber = 0;
  const errorCorrectionLevel = 'M';
  const qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const matrix = [];

  for (let row = 0; row < moduleCount; row++) {
    const rowData = [];
    for (let col = 0; col < moduleCount; col++) {
      rowData.push(qr.isDark(row, col) ? 1 : 0);
    }
    matrix.push(rowData);
  }

  return {
    matrix,
    size: moduleCount
  };
};
