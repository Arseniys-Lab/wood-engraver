const { useState, useRef, useEffect } = React;

// Get all utilities and components from window
const { Canvas } = window;
const { Toolbar } = window;
const { Sidebar } = window;
const { GcodeModal } = window;
const { TestGridModal } = window;
const { ImportModal } = window;
const { QRCodeModal } = window;
const { useHistory } = window;
const { gridToBed, bedToGrid } = window;
const { parseGCodeFile } = window;
const { generateEngravingGCode, generateTestGridGCode, downloadGCode } = window;
const ImageProcessing = window.ImageProcessing;

const VERSION = "4.3.2";

window.App = () => {
  const [activeTab, setActiveTab] = useState('engraving');
  
  // State
  const [image, setImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [fileName, setFileName] = useState('engraving');
  const [testFileName, setTestFileName] = useState('test-grid');
  
  // Test grid
  const [testGrid, setTestGrid] = useState({
    timeStart: 2,
    timeStep: 2,
    timeCount: 10,
    depthStart: 0,
    depthStep: -0.1,
    depthCount: 10,
    spacing: 15,
    temperature: 300
  });
  const [testGridOffsetX, setTestGridOffsetX] = useState(0);
  const [testGridOffsetY, setTestGridOffsetY] = useState(0);
  const [isTestGridDragging, setIsTestGridDragging] = useState(false);
  const [testGridDragStart, setTestGridDragStart] = useState({ x: 0, y: 0 });
  
  // Processing
  const [processingMode, setProcessingMode] = useState('standard');
  const [invertResult, setInvertResult] = useState(false);
  const [autoRecalculate, setAutoRecalculate] = useState(true);
  const [needsRecalculation, setNeedsRecalculation] = useState(false);

  // Transforms
  const [gridOffsetX, setGridOffsetX] = useState(0);
  const [gridOffsetY, setGridOffsetY] = useState(0);
  const [gridRotation, setGridRotation] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const [imageOffsetX, setImageOffsetX] = useState(0);
  const [imageOffsetY, setImageOffsetY] = useState(0);
  const [imageRotation, setImageRotation] = useState(0);
  const [initialTransform, setInitialTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0 });
  
  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPanX, setCanvasPanX] = useState(0);
  const [canvasPanY, setCanvasPanY] = useState(0);
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [canvasPanStart, setCanvasPanStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 900, height: 700 });
  
  // Parameters
  const [stepSize, setStepSize] = useState(2);
  const [threshold, setThreshold] = useState(128);
  const [pointPattern, setPointPattern] = useState('square');
  const [bedWidth, setBedWidth] = useState(256);
  const [bedHeight, setBedHeight] = useState(256);
  const [nozzleDiameter, setNozzleDiameter] = useState(1);
  const [depthZ, setDepthZ] = useState(-0.5);
  const [dwellTime, setDwellTime] = useState(10);
  const [temperature, setTemperature] = useState(300);
  const [yAcceleration, setYAcceleration] = useState(1000);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  
  // Tools
  const [tool, setTool] = useState('move');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showImage, setShowImage] = useState(true);
  const [clipToBed, setClipToBed] = useState(false); // Debug: clip rendering to bed bounds
  const [mousePos, setMousePos] = useState(null);
  const [mouseScreenPos, setMouseScreenPos] = useState(null); // Screen coordinates for cursor rendering
  const [previewPoints, setPreviewPoints] = useState([]);
  const [lastDragPoint, setLastDragPoint] = useState(null); // Track last placed point in variable mode drag
  
  // Modals
  const [showGcodeModal, setShowGcodeModal] = useState(false);
  const [showTestGridModal, setShowTestGridModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [importData, setImportData] = useState(null);

  // QR Code configuration for regeneration
  const [qrConfig, setQrConfig] = useState(null);
  // Structure: { text, offsetX, offsetY, dotsPerModule, bounds }

  // G-code settings
  const [useBedLeveling, setUseBedLeveling] = useState(true);
  const [startGcode, setStartGcode] = useState('');
  const [testStartGcode, setTestStartGcode] = useState('');
  
  // File handling
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  
  // Refs
  const canvasRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // History
  const history = useHistory();
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  
  // Initialize start G-code
  useEffect(() => {
    const defaultGcode = `;===== machine: Bambulab A1 =========================
M1002 gcode_claim_action : 2
M1002 set_filament_type:PLA

;===== HOMING =====
G28

;===== ABSOLUTE POSITIONING =====
G90`;
    
    setStartGcode(defaultGcode);
    setTestStartGcode(defaultGcode);
  }, []);
  
  // Update test file name
  useEffect(() => {
    setTestFileName(`test-grid_${testGrid.timeCount}x${testGrid.depthCount}`);
  }, [testGrid.timeCount, testGrid.depthCount]);
  
  // Container size observer
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        // Account for hints at bottom - find the canvas wrapper div
        const canvasWrapper = containerRef.current.querySelector('.flex-1.min-h-0');
        const canvasRect = canvasWrapper ? canvasWrapper.getBoundingClientRect() : rect;

        setContainerSize({ width: canvasRect.width, height: canvasRect.height });

        // Reset zoom to 1 to ensure bed plate fits on screen
        setCanvasZoom(1);

        const baseScale = Math.min(canvasRect.width / bedWidth, canvasRect.height / bedHeight);
        const scaledWidth = bedWidth * baseScale;
        const scaledHeight = bedHeight * baseScale;
        setCanvasPanX((canvasRect.width - scaledWidth) / 2);
        setCanvasPanY((canvasRect.height - scaledHeight) / 2);
      }
    };

    // Delay initial update to allow DOM to render
    setTimeout(updateSize, 0);
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [bedWidth, bedHeight]);

  // Update document title with version
  useEffect(() => {
    document.title = `Wood Engraving G-code Generator v${VERSION} - Arseniy's Lab`;
  }, []);

  // In contour mode with brush tool, use nozzle diameter for brush size
  const effectiveBrushSize = (tool === 'brush' && pointPattern === 'contour') ? nozzleDiameter : brushSize;

  // Cookie helpers
  const setCookie = (name, value, days = 365) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  };

  const getCookie = (name) => {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  };

  // Load settings from cookies on mount
  useEffect(() => {
    const hasSeenSetup = getCookie('hasSeenSetup');

    if (!hasSeenSetup) {
      setShowSetupModal(true);
    } else {
      // Load saved settings
      const savedBedWidth = getCookie('bedWidth');
      const savedBedHeight = getCookie('bedHeight');
      const savedNozzleDiameter = getCookie('nozzleDiameter');
      const savedDepthZ = getCookie('depthZ');
      const savedTemperature = getCookie('temperature');
      const savedDwellTime = getCookie('dwellTime');
      const savedStepSize = getCookie('stepSize');

      if (savedBedWidth) setBedWidth(Number(savedBedWidth));
      if (savedBedHeight) setBedHeight(Number(savedBedHeight));
      if (savedNozzleDiameter) setNozzleDiameter(Number(savedNozzleDiameter));
      if (savedDepthZ) setDepthZ(Number(savedDepthZ));
      if (savedTemperature) setTemperature(Number(savedTemperature));
      if (savedDwellTime) setDwellTime(Number(savedDwellTime));
      if (savedStepSize) setStepSize(Number(savedStepSize));

      // Load test grid settings
      const savedTestGridTimeStart = getCookie('testGridTimeStart');
      const savedTestGridTimeStep = getCookie('testGridTimeStep');
      const savedTestGridTimeCount = getCookie('testGridTimeCount');
      const savedTestGridDepthStart = getCookie('testGridDepthStart');
      const savedTestGridDepthStep = getCookie('testGridDepthStep');
      const savedTestGridDepthCount = getCookie('testGridDepthCount');
      const savedTestGridSpacing = getCookie('testGridSpacing');
      const savedTestGridTemperature = getCookie('testGridTemperature');

      if (savedTestGridTimeStart) setTestGrid(prev => ({ ...prev, timeStart: Number(savedTestGridTimeStart) }));
      if (savedTestGridTimeStep) setTestGrid(prev => ({ ...prev, timeStep: Number(savedTestGridTimeStep) }));
      if (savedTestGridTimeCount) setTestGrid(prev => ({ ...prev, timeCount: Number(savedTestGridTimeCount) }));
      if (savedTestGridDepthStart) setTestGrid(prev => ({ ...prev, depthStart: parseFloat(savedTestGridDepthStart) }));
      if (savedTestGridDepthStep) setTestGrid(prev => ({ ...prev, depthStep: parseFloat(savedTestGridDepthStep) }));
      if (savedTestGridDepthCount) setTestGrid(prev => ({ ...prev, depthCount: Number(savedTestGridDepthCount) }));
      if (savedTestGridSpacing) setTestGrid(prev => ({ ...prev, spacing: parseFloat(savedTestGridSpacing) }));
      if (savedTestGridTemperature) setTestGrid(prev => ({ ...prev, temperature: Number(savedTestGridTemperature) }));
    }
  }, []);

  // Save settings to cookies when they change
  useEffect(() => {
    if (getCookie('hasSeenSetup')) {
      setCookie('bedWidth', bedWidth);
      setCookie('bedHeight', bedHeight);
      setCookie('nozzleDiameter', nozzleDiameter);
      setCookie('depthZ', depthZ);
      setCookie('temperature', temperature);
      setCookie('dwellTime', dwellTime);
      setCookie('stepSize', stepSize);
    }
  }, [bedWidth, bedHeight, nozzleDiameter, depthZ, temperature, dwellTime, stepSize]);

  // Save test grid settings to cookies when they change
  useEffect(() => {
    if (getCookie('hasSeenSetup')) {
      setCookie('testGridTimeStart', testGrid.timeStart);
      setCookie('testGridTimeStep', testGrid.timeStep);
      setCookie('testGridTimeCount', testGrid.timeCount);
      setCookie('testGridDepthStart', testGrid.depthStart);
      setCookie('testGridDepthStep', testGrid.depthStep);
      setCookie('testGridDepthCount', testGrid.depthCount);
      setCookie('testGridSpacing', testGrid.spacing);
      setCookie('testGridTemperature', testGrid.temperature);
    }
  }, [testGrid]);

  // Auto-regenerate QR code when stepSize changes
  useEffect(() => {
    if (qrConfig) {
      try {
        const { QRCodeUtil } = window;
        const result = QRCodeUtil.generateQRPoints(
          qrConfig.text,
          stepSize,
          bedWidth,
          bedHeight,
          qrConfig.offsetX,
          qrConfig.offsetY,
          qrConfig.dotsPerModule
        );

        // Remove old QR points and add new ones
        const nonQRPoints = points.filter(p => p.source !== 'qr');
        const newPoints = [...nonQRPoints, ...result.points];
        setPoints(newPoints);

        // Update QR config with new bounds
        setQrConfig({
          ...qrConfig,
          bounds: result.bounds
        });
      } catch (err) {
        console.error('Failed to regenerate QR code:', err);
      }
    }
  }, [stepSize]); // Only watch stepSize, not qrConfig to avoid infinite loop

  // History handlers
  const handleUndo = () => {
    const prevState = history.undo();
    if (prevState) {
      setIsUndoRedo(true);
      setPoints(JSON.parse(JSON.stringify(prevState.points)));
      setGridOffsetX(prevState.gridTransform.offsetX);
      setGridOffsetY(prevState.gridTransform.offsetY);
      setGridRotation(prevState.gridTransform.rotation);
      setImageScale(prevState.transform.scale);
      setImageOffsetX(prevState.transform.offsetX);
      setImageOffsetY(prevState.transform.offsetY);
      setImageRotation(prevState.transform.rotation);
      setInitialTransform(prevState.transform);
      setTimeout(() => setIsUndoRedo(false), 0);
    }
  };

  const handleRedo = () => {
    const nextState = history.redo();
    if (nextState) {
      setIsUndoRedo(true);
      setPoints(JSON.parse(JSON.stringify(nextState.points)));
      setGridOffsetX(nextState.gridTransform.offsetX);
      setGridOffsetY(nextState.gridTransform.offsetY);
      setGridRotation(nextState.gridTransform.rotation);
      setImageScale(nextState.transform.scale);
      setImageOffsetX(nextState.transform.offsetX);
      setImageOffsetY(nextState.transform.offsetY);
      setImageRotation(nextState.transform.rotation);
      setInitialTransform(nextState.transform);
      setTimeout(() => setIsUndoRedo(false), 0);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z or Cmd+Z (without shift)
      if (cmdOrCtrl && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y, Cmd+Y, Ctrl+Shift+Z, or Cmd+Shift+Z
      else if ((cmdOrCtrl && key === 'y') || (cmdOrCtrl && e.shiftKey && key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // QR Code handler - Replace old QR points with new ones
  const handleGenerateQR = (qrResult, text, offsetX, offsetY, dotsPerModule) => {
    // Remove old QR points if they exist
    const nonQRPoints = points.filter(p => p.source !== 'qr');

    // Add new QR points
    const newPoints = [...nonQRPoints, ...qrResult.points];
    setPoints(newPoints);

    // Store QR config for regeneration
    setQrConfig({
      text,
      offsetX,
      offsetY,
      dotsPerModule: qrResult.dotsPerModule,
      bounds: qrResult.bounds
    });

    history.saveToHistory(newPoints,
      { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
      { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
    );
  };

  // Image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processImageFile(file);
  };
  
  const processImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setFileName(fileNameWithoutExt);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageScale(1);
        setImageOffsetX(0);
        setImageOffsetY(0);
        setImageRotation(0);
        setGridOffsetX(0);
        setGridOffsetY(0);
        setGridRotation(0);
        setProcessingMode('standard');
        setInvertResult(false);
        setQrConfig(null); // Clear QR config when loading new image
        processImageWithPipeline(img, 1, 0, 0, 0, 'standard', false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  // G-code upload
  const handleGCodeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const gcode = event.target.result;
      const parsed = parseGCodeFile(gcode, file.name, {
        bedWidth, bedHeight, temperature, dwellTime, depthZ, stepSize
      });
      setImportData(parsed);
      setShowImportModal(true);
    };
    reader.readAsText(file);
  };
  
  const confirmImport = () => {
    if (!importData) return;
    
    setBedWidth(importData.bedWidth);
    setBedHeight(importData.bedHeight);
    setTemperature(importData.temperature);
    setDwellTime(importData.dwellTime);
    setDepthZ(importData.depthZ);
    setStepSize(importData.stepSize);
    setFileName(importData.fileName);
    
    setGridOffsetX(0);
    setGridOffsetY(0);
    setGridRotation(0);
    
    setPoints(importData.points);
    history.saveToHistory(importData.points, 
      { offsetX: 0, offsetY: 0, rotation: 0 },
      { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 }
    );
    setInitialTransform({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0 });
    
    setShowImportModal(false);
    setImportData(null);
  };
  
  // File drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.gcode') || file.name.endsWith('.gcode.3mf')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const gcode = event.target.result;
          const parsed = parseGCodeFile(gcode, file.name, {
            bedWidth, bedHeight, temperature, dwellTime, depthZ, stepSize
          });
          setImportData(parsed);
          setShowImportModal(true);
        };
        reader.readAsText(file);
      } else {
        processImageFile(file);
      }
    }
  };
  
  const removeImage = () => {
    setImage(null);
    setPoints([]);
    history.reset();
    setFileName('engraving');
    setGridOffsetX(0);
    setGridOffsetY(0);
    setGridRotation(0);
    setProcessingMode('standard');
    setInvertResult(false);
    setQrConfig(null); // Clear QR config when removing image
  };
  
  // Image processing
  const processImageWithPipeline = (img, scale, offsetX, offsetY, rotation, mode, invert) => {
    console.log('[App.jsx] processImageWithPipeline INPUTS:', { scale, offsetX, offsetY, rotation, mode, bedWidth, bedHeight });

    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Calculate scaled image dimensions in mm
    const scaleFactor = Math.min(bedWidth / img.width, bedHeight / img.height) * scale;

    // Fixed canvas size (matching v2.4.1 behavior)
    const canvasSize = Math.max(bedWidth, bedHeight) * 3;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    console.log('[App.jsx] Fixed canvas size:', { canvasSize, scaleFactor, scale });

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.save();

    const tx = canvasSize / 2 + offsetX;
    const ty = canvasSize / 2 - offsetY;
    console.log('[App.jsx] Processing canvas translate:', { tx, ty });
    ctx.translate(tx, ty);
    ctx.rotate((rotation * Math.PI) / 180);

    // Image dimensions in pixels (scaleFactor already calculated above)
    const width = img.width * scaleFactor;
    const height = img.height * scaleFactor;

    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();

    let imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
    let data = imageData.data;

    const gray = ImageProcessing.rgbToGrayscale(data, canvasSize, canvasSize);
    
    let processedGray = gray;
    let newPoints;

    // Contour mode needs its own canvas and coordinate system for skeleton
    if (pointPattern === 'contour') {
      // Create separate canvas for variable mode processing
      const variableCanvas = document.createElement('canvas');
      const variableCtx = variableCanvas.getContext('2d');

      // Use dynamic canvas size for variable mode (like old working version)
      const scaledWidth = img.width * scaleFactor;
      const scaledHeight = img.height * scaleFactor;
      const diagonal = Math.sqrt(scaledWidth ** 2 + scaledHeight ** 2);
      const maxOffset = Math.max(Math.abs(offsetX), Math.abs(offsetY)) * 2;
      const variableCanvasSize = Math.ceil((diagonal + maxOffset + Math.max(bedWidth, bedHeight)) * 3);

      variableCanvas.width = variableCanvasSize;
      variableCanvas.height = variableCanvasSize;

      variableCtx.fillStyle = 'white';
      variableCtx.fillRect(0, 0, variableCanvasSize, variableCanvasSize);

      variableCtx.save();
      variableCtx.translate(variableCanvasSize / 2 + offsetX * 3, variableCanvasSize / 2 - offsetY * 3);
      variableCtx.rotate((rotation * Math.PI) / 180);

      const varWidth = img.width * scaleFactor * 3;
      const varHeight = img.height * scaleFactor * 3;
      variableCtx.drawImage(img, -varWidth / 2, -varHeight / 2, varWidth, varHeight);
      variableCtx.restore();

      const variableImageData = variableCtx.getImageData(0, 0, variableCanvasSize, variableCanvasSize);
      const variableGray = ImageProcessing.rgbToGrayscale(variableImageData.data, variableCanvasSize, variableCanvasSize);

      // Contour mode uses skeleton with its own coordinate system
      newPoints = ImageProcessing.extractPointsFromGray(variableGray, variableCanvasSize, (val) => val < threshold, stepSize, pointPattern, bedWidth, bedHeight, threshold);
    } else if (mode === 'edge') {
      processedGray = ImageProcessing.sobelEdgeDetection(gray, canvasSize, canvasSize);
    } else if (mode === 'dither') {
      processedGray = ImageProcessing.floydSteinbergDither(gray, canvasSize, canvasSize, threshold);
    }

    if (pointPattern !== 'contour') {
      if (mode === 'dither') {
        if (invert) {
          newPoints = ImageProcessing.extractPointsFromGray(processedGray, canvasSize, (val) => val === 255, stepSize, pointPattern, bedWidth, bedHeight, threshold);
        } else {
          newPoints = ImageProcessing.extractPointsFromGray(processedGray, canvasSize, (val) => val === 0, stepSize, pointPattern, bedWidth, bedHeight, threshold);
        }
      } else {
        if (invert) {
          newPoints = ImageProcessing.extractPointsFromGray(processedGray, canvasSize, (val) => val >= threshold, stepSize, pointPattern, bedWidth, bedHeight, threshold);
        } else {
          newPoints = ImageProcessing.extractPointsFromGray(processedGray, canvasSize, (val) => val < threshold, stepSize, pointPattern, bedWidth, bedHeight, threshold);
        }
      }
    }

    // Contour mode uses different coordinate system and needs correction offset
    let finalPoints = newPoints;
    if (pointPattern === 'contour') {
      const dx = bedWidth / 2;
      const dy = bedHeight / 2;
      finalPoints = newPoints.map(p => ({
        ...p,
        x: p.x + dx,
        y: p.y + dy
      }));
    }

    if (finalPoints.length > 0) {
      console.log('[App.jsx] First extracted point:', { ...finalPoints[0] });
    }

    setPoints(finalPoints);
    history.saveToHistory(finalPoints,
      { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
      { scale, offsetX, offsetY, rotation }
    );
    setInitialTransform({ scale, offsetX, offsetY, rotation });
  };
  
  // Transform points
  const transformPoints = () => {
    if (points.length === 0) return;
    
    const deltaScale = imageScale / initialTransform.scale;
    const deltaOffsetX = imageOffsetX - initialTransform.offsetX;
    const deltaOffsetY = imageOffsetY - initialTransform.offsetY;
    const deltaRotation = imageRotation - initialTransform.rotation;
    
    const centerX = bedWidth / 2;
    const centerY = bedHeight / 2;
    
    const newPoints = points.map(point => {
      let x = point.x;
      let y = bedHeight - point.y;
      
      x = x - centerX - initialTransform.offsetX;
      y = y - centerY + initialTransform.offsetY;
      
      if (initialTransform.rotation !== 0) {
        const angle = -initialTransform.rotation * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = x * cos - y * sin;
        const newY = x * sin + y * cos;
        x = newX;
        y = newY;
      }
      
      if (image && initialTransform.scale !== 0) {
        x = x / initialTransform.scale;
        y = y / initialTransform.scale;
      }
      
      if (image) {
        x = x * imageScale;
        y = y * imageScale;
      }
      
      if (imageRotation !== 0) {
        const angle = imageRotation * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = x * cos - y * sin;
        const newY = x * sin + y * cos;
        x = newX;
        y = newY;
      }
      
      x = x + centerX + imageOffsetX;
      y = y + centerY - imageOffsetY;
      
      return {
        x: Math.round(x * 10) / 10,
        y: Math.round((bedHeight - y) * 10) / 10
      };
    });
    
    setPoints(newPoints);
    history.saveToHistory(newPoints,
      { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
      { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
    );
    setInitialTransform({ scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation });
    setNeedsRecalculation(false);
  };
  
  // Auto-recalculate
  useEffect(() => {
    if (!isUndoRedo && autoRecalculate && image && points.length > 0) {
      processImageWithPipeline(image, imageScale, imageOffsetX, imageOffsetY, imageRotation, processingMode, invertResult);
      setNeedsRecalculation(false);
    } else if (!isUndoRedo && !autoRecalculate && points.length > 0) {
      // Mark as needing recalculation when auto-recalc is off
      setNeedsRecalculation(true);
    }
  }, [stepSize, threshold, imageScale, pointPattern]);

  useEffect(() => {
    if (!isUndoRedo && points.length > 0 && imageRotation !== initialTransform.rotation) {
      if (autoRecalculate) {
        transformPoints();
      } else {
        setNeedsRecalculation(true);
      }
    }
  }, [imageRotation]);
  
  // Mouse handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const baseScale = Math.min(containerSize.width / bedWidth, containerSize.height / bedHeight);
    const scale = baseScale * canvasZoom;

    // Calculate mouse position in canvas buffer coordinates (accounting for CSS scaling)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const x = (canvasX - canvasPanX) / scale;
    const y = bedHeight - (canvasY - canvasPanY) / scale;
    
    if (e.button === 2) {
      e.preventDefault();
      setIsCanvasPanning(true);
      setCanvasPanStart({ x: canvasX - canvasPanX, y: canvasY - canvasPanY });
      return;
    }
    
    if (activeTab === 'test-grid') {
      if (e.button === 0 || e.button === 1) {
        if (e.button === 1) e.preventDefault();
        setIsTestGridDragging(true);
        setTestGridDragStart({ x: x - testGridOffsetX, y: y - testGridOffsetY });
      }
      return;
    }
    
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: x - gridOffsetX, y: y - gridOffsetY });
      return;
    }
    
    if (tool === 'move') {
      setIsDragging(true);
      setDragStart({ x: x - gridOffsetX, y: y - gridOffsetY });
    } else {
      setIsDrawing(true);
      setLastDragPoint(null); // Reset for new drag session
      handleDraw(e);
    }
  };
  
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const baseScale = Math.min(containerSize.width / bedWidth, containerSize.height / bedHeight);
    const scale = baseScale * canvasZoom;

    // Calculate mouse position in canvas buffer coordinates (accounting for CSS scaling)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const x = (canvasX - canvasPanX) / scale;
    const y = bedHeight - (canvasY - canvasPanY) / scale;

    // Always update screen position for cursor rendering when using brush/eraser
    if (activeTab === 'engraving' && (tool === 'brush' || tool === 'eraser')) {
      setMouseScreenPos({ x: canvasX, y: canvasY });
    }

    if (activeTab === 'engraving' && (tool === 'brush' || tool === 'eraser') && !isCanvasPanning) {
      setMousePos({ x, y });
      
      const gridPos = bedToGrid({ x, y }, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight);
      
      if (tool === 'brush') {
        const preview = [];

        if (pointPattern === 'contour') {
          // Contour mode: preview dot following direction from last placed point
          let targetX = gridPos.x;
          let targetY = gridPos.y;

          // If dragging (lastDragPoint exists), preview dot relative to last placed point
          if (lastDragPoint) {
            const dx = gridPos.x - lastDragPoint.x;
            const dy = gridPos.y - lastDragPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist >= stepSize) {
              // Preview point in the direction of movement
              const angle = Math.atan2(dy, dx);
              targetX = lastDragPoint.x + Math.cos(angle) * stepSize;
              targetY = lastDragPoint.y + Math.sin(angle) * stepSize;
            } else {
              // Too close, no preview
              targetX = gridPos.x;
              targetY = gridPos.y;
            }
          }
          // else: First click preview at exact cursor position

          // Round to 0.1mm precision
          const roundedX = Math.round(targetX * 10) / 10;
          const roundedY = Math.round(targetY * 10) / 10;

          // Check if point already exists
          const existing = points.find(p => Math.abs(p.x - roundedX) < 0.01 && Math.abs(p.y - roundedY) < 0.01);
          if (!existing) {
            preview.push({ x: roundedX, y: roundedY });
          }
        } else if (pointPattern === 'triangle') {
          // Hexagonal/triangular grid logic
          const rowHeight = stepSize * Math.sqrt(3) / 2;
          const minRow = Math.floor((gridPos.y - effectiveBrushSize) / rowHeight);
          const maxRow = Math.ceil((gridPos.y + effectiveBrushSize) / rowHeight);
          const minCol = Math.floor((gridPos.x - effectiveBrushSize) / stepSize);
          const maxCol = Math.ceil((gridPos.x + effectiveBrushSize) / stepSize);

          for (let row = minRow; row <= maxRow; row++) {
            const py = row * rowHeight;
            const offsetX = (row % 2) * (stepSize / 2); // Match extraction logic

            for (let col = minCol; col <= maxCol; col++) {
              const px = col * stepSize + offsetX;
              const dist = Math.sqrt((px - gridPos.x) ** 2 + (py - gridPos.y) ** 2);
              if (dist < effectiveBrushSize) {
                const roundedX = Math.round(px * 10) / 10;
                const roundedY = Math.round(py * 10) / 10;

                const existing = points.find(p => Math.abs(p.x - roundedX) < 0.01 && Math.abs(p.y - roundedY) < 0.01);
                if (!existing) {
                  preview.push({ x: roundedX, y: roundedY });
                }
              }
            }
          }
        } else {
          // Square grid logic (original)
          const minX = Math.floor((gridPos.x - effectiveBrushSize) / stepSize) * stepSize;
          const maxX = Math.ceil((gridPos.x + effectiveBrushSize) / stepSize) * stepSize;
          const minY = Math.floor((gridPos.y - effectiveBrushSize) / stepSize) * stepSize;
          const maxY = Math.ceil((gridPos.y + effectiveBrushSize) / stepSize) * stepSize;

          for (let py = minY; py <= maxY; py += stepSize) {
            for (let px = minX; px <= maxX; px += stepSize) {
              const dist = Math.sqrt((px - gridPos.x) ** 2 + (py - gridPos.y) ** 2);
              if (dist < effectiveBrushSize) {
                const roundedX = Math.round(px * 10) / 10;
                const roundedY = Math.round(py * 10) / 10;

                const existing = points.find(p => Math.abs(p.x - roundedX) < 0.01 && Math.abs(p.y - roundedY) < 0.01);
                if (!existing) {
                  preview.push({ x: roundedX, y: roundedY });
                }
              }
            }
          }
        }
        setPreviewPoints(preview);
      } else if (tool === 'eraser') {
        const preview = points.filter(point => {
          const bedPoint = gridToBed(point, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight);
          if (bedPoint.x < 0 || bedPoint.x > bedWidth || bedPoint.y < 0 || bedPoint.y > bedHeight) {
            return false;
          }
          const dist = Math.sqrt((bedPoint.x - x) ** 2 + (bedPoint.y - y) ** 2);
          return dist < brushSize;
        });
        setPreviewPoints(preview);
      }
    } else if (tool === 'move' || isCanvasPanning) {
      setMousePos(null);
      setPreviewPoints([]);
      if (tool === 'move') {
        setMouseScreenPos(null);
      }
    }
    
    if (isCanvasPanning) {
      setCanvasPanX(canvasX - canvasPanStart.x);
      setCanvasPanY(canvasY - canvasPanStart.y);
      return;
    }
    
    if (isTestGridDragging) {
      setTestGridOffsetX(x - testGridDragStart.x);
      setTestGridOffsetY(y - testGridDragStart.y);
    } else if (isDragging) {
      setGridOffsetX(x - dragStart.x);
      setGridOffsetY(y - dragStart.y);
    } else if (isDrawing && (tool === 'eraser' || tool === 'brush')) {
      handleDraw(e);
    }
  };
  
  const handleMouseUp = (e) => {
    if (e.button === 2) {
      setIsCanvasPanning(false);
      return;
    }
    
    if (e.button === 0 && isTestGridDragging) {
      setIsTestGridDragging(false);
      return;
    }
    
    if (e.button === 1) {
      if (isTestGridDragging) {
        setIsTestGridDragging(false);
      } else {
        setIsDragging(false);
        if (points.length > 0) {
          history.saveToHistory(points,
            { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
            { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
          );
        }
      }
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      if (points.length > 0) {
        history.saveToHistory(points,
          { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
          { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
        );
      }
    }
    if (isDrawing) {
      setIsDrawing(false);
      setLastDragPoint(null); // Reset drag point tracking
      history.saveToHistory(points,
        { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
        { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
      );
    }
  };
  
  const handleMouseLeave = () => {
    setMousePos(null);
    setMouseScreenPos(null);
    setPreviewPoints([]);
    
    if (isCanvasPanning) setIsCanvasPanning(false);
    if (isTestGridDragging) setIsTestGridDragging(false);
    if (isDragging) {
      setIsDragging(false);
      if (points.length > 0) {
        history.saveToHistory(points,
          { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
          { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
        );
      }
    }
    if (isDrawing) {
      setIsDrawing(false);
      setLastDragPoint(null); // Reset drag point tracking
      if (points.length > 0) {
        history.saveToHistory(points,
          { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
          { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
        );
      }
    }
  };
  
  const handleWheel = (e) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate mouse position in canvas buffer coordinates (accounting for CSS scaling)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    if (activeTab === 'test-grid') {
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      const newSpacing = Math.max(5, Math.min(50, testGrid.spacing + delta));
      setTestGrid({...testGrid, spacing: Math.round(newSpacing * 10) / 10});
    } else if (tool === 'move' && qrConfig) {
      // QR code density control when hovering over QR
      const baseScale = Math.min(containerSize.width / bedWidth, containerSize.height / bedHeight);
      const scale = baseScale * canvasZoom;

      const bedX = ((mouseX - canvasPanX) / scale);
      const bedY = bedHeight - ((mouseY - canvasPanY) / scale);

      // Transform QR bounds by grid offset (since QR points move with the grid)
      const transformedMinX = qrConfig.bounds.minX + gridOffsetX;
      const transformedMaxX = qrConfig.bounds.maxX + gridOffsetX;
      const transformedMinY = qrConfig.bounds.minY + gridOffsetY;
      const transformedMaxY = qrConfig.bounds.maxY + gridOffsetY;

      // Check if mouse is over QR bounds
      if (bedX >= transformedMinX && bedX <= transformedMaxX &&
          bedY >= transformedMinY && bedY <= transformedMaxY) {
        // Adjust QR dot density
        const delta = e.deltaY > 0 ? -1 : 1;
        const currentDots = Math.max(1, qrConfig.dotsPerModule); // Ensure current value is valid
        const newDotsPerModule = Math.max(1, Math.min(10, currentDots + delta));

        if (newDotsPerModule !== currentDots) {
          try {
            const { QRCodeUtil } = window;
            const result = QRCodeUtil.generateQRPoints(
              qrConfig.text,
              stepSize,
              bedWidth,
              bedHeight,
              qrConfig.offsetX,
              qrConfig.offsetY,
              newDotsPerModule
            );

            // Remove old QR points and add new ones
            const nonQRPoints = points.filter(p => p.source !== 'qr');
            const newPoints = [...nonQRPoints, ...result.points];
            setPoints(newPoints);

            // Update QR config
            setQrConfig({
              ...qrConfig,
              dotsPerModule: newDotsPerModule,
              bounds: result.bounds
            });
          } catch (err) {
            console.error('Failed to adjust QR density:', err);
          }
        }
        return; // Don't do anything else
      }
    } else if (tool === 'move' && image) {
      const baseScale = Math.min(containerSize.width / bedWidth, containerSize.height / bedHeight);
      const scale = baseScale * canvasZoom;

      const bedX = ((mouseX - canvasPanX) / scale);
      const bedY = bedHeight - ((mouseY - canvasPanY) / scale);
      
      const centerX = bedWidth / 2;
      const centerY = bedHeight / 2;
      
      let gridX = bedX - centerX - gridOffsetX;
      let gridY = bedY - centerY + gridOffsetY;
      
      if (gridRotation !== 0) {
        const angle = -gridRotation * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = gridX * cos - gridY * sin;
        const newY = gridX * sin + gridY * cos;
        gridX = newX;
        gridY = newY;
      }
      
      const imgCenterX = imageOffsetX;
      const imgCenterY = imageOffsetY;
      
      const relX = gridX - imgCenterX;
      const relY = gridY - imgCenterY;
      
      const oldScale = imageScale;
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.1, Math.min(10, imageScale + delta));
      const roundedScale = Math.round(newScale * 10) / 10;
      
      const scaleFactor = roundedScale / oldScale;
      const newOffsetX = gridX - relX * scaleFactor;
      const newOffsetY = gridY - relY * scaleFactor;
      
      setImageScale(roundedScale);
      setImageOffsetX(newOffsetX);
      setImageOffsetY(newOffsetY);
    } else {
      const baseScale = Math.min(containerSize.width / bedWidth, containerSize.height / bedHeight);
      const oldScale = baseScale * canvasZoom;

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, canvasZoom + delta);
      const roundedZoom = Math.round(newZoom * 10) / 10;
      const newScale = baseScale * roundedZoom;

      // Calculate bed coordinate under mouse
      const pointX = (mouseX - canvasPanX) / oldScale;
      const pointY = (mouseY - canvasPanY) / oldScale;

      // Adjust pan to keep the same bed point under the mouse
      const newPanX = mouseX - pointX * newScale;
      const newPanY = mouseY - pointY * newScale;

      setCanvasZoom(roundedZoom);
      setCanvasPanX(newPanX);
      setCanvasPanY(newPanY);
    }
  };
  
  const handleDraw = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const baseScale = Math.min(containerSize.width / bedWidth, containerSize.height / bedHeight);
    const scale = baseScale * canvasZoom;

    // Calculate mouse position in canvas buffer coordinates (accounting for CSS scaling)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const x = (canvasX - canvasPanX) / scale;
    const y = bedHeight - (canvasY - canvasPanY) / scale;
    
    const gridPos = bedToGrid({ x, y }, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight);
    
    const newPoints = [...points];
    
    if (tool === 'eraser') {
      const filtered = newPoints.filter(point => {
        const bedPoint = gridToBed(point, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight);
        if (bedPoint.x < 0 || bedPoint.x > bedWidth || bedPoint.y < 0 || bedPoint.y > bedHeight) {
          return true;
        }
        const dist = Math.sqrt((bedPoint.x - x) ** 2 + (bedPoint.y - y) ** 2);
        return dist >= brushSize;
      });
      setPoints(filtered);
    } else if (tool === 'brush') {
      if (pointPattern === 'contour') {
        // Contour mode: place dot following direction from last placed point
        let targetX = gridPos.x;
        let targetY = gridPos.y;

        // If dragging (lastDragPoint exists), place dot relative to last placed point
        if (lastDragPoint) {
          // Calculate direction and distance from last placed point
          const dx = gridPos.x - lastDragPoint.x;
          const dy = gridPos.y - lastDragPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // If moved at least stepSize distance, place a new point
          if (dist >= stepSize) {
            // Place point in the direction of movement, at stepSize distance
            const angle = Math.atan2(dy, dx);
            targetX = lastDragPoint.x + Math.cos(angle) * stepSize;
            targetY = lastDragPoint.y + Math.sin(angle) * stepSize;
          } else {
            // Too close to last point, don't place anything
            return;
          }
        }
        // else: First click, place at exact cursor position (targetX/Y already set)

        // Round to 0.1mm precision
        const roundedX = Math.round(targetX * 10) / 10;
        const roundedY = Math.round(targetY * 10) / 10;

        // Check if point already exists
        const existing = newPoints.find(p => Math.abs(p.x - roundedX) < 0.01 && Math.abs(p.y - roundedY) < 0.01);
        if (!existing) {
          newPoints.push({ x: roundedX, y: roundedY, source: 'manual' });
          // Update last drag point for next iteration
          setLastDragPoint({ x: roundedX, y: roundedY });
        }
      } else if (pointPattern === 'triangle') {
        // Hexagonal/triangular grid logic
        const rowHeight = stepSize * Math.sqrt(3) / 2;
        const minRow = Math.floor((gridPos.y - effectiveBrushSize) / rowHeight);
        const maxRow = Math.ceil((gridPos.y + effectiveBrushSize) / rowHeight);
        const minCol = Math.floor((gridPos.x - effectiveBrushSize) / stepSize);
        const maxCol = Math.ceil((gridPos.x + effectiveBrushSize) / stepSize);

        for (let row = minRow; row <= maxRow; row++) {
          const py = row * rowHeight;
          const offsetX = (row % 2) * (stepSize / 2); // Match extraction logic

          for (let col = minCol; col <= maxCol; col++) {
            const px = col * stepSize + offsetX;
            const dist = Math.sqrt((px - gridPos.x) ** 2 + (py - gridPos.y) ** 2);
            if (dist < effectiveBrushSize) {
              const roundedX = Math.round(px * 10) / 10;
              const roundedY = Math.round(py * 10) / 10;

              const existing = newPoints.find(p => Math.abs(p.x - roundedX) < 0.01 && Math.abs(p.y - roundedY) < 0.01);
              if (!existing) {
                newPoints.push({ x: roundedX, y: roundedY, source: 'manual' });
              }
            }
          }
        }
      } else {
        // Square grid logic (original)
        const minX = Math.floor((gridPos.x - effectiveBrushSize) / stepSize) * stepSize;
        const maxX = Math.ceil((gridPos.x + effectiveBrushSize) / stepSize) * stepSize;
        const minY = Math.floor((gridPos.y - effectiveBrushSize) / stepSize) * stepSize;
        const maxY = Math.ceil((gridPos.y + effectiveBrushSize) / stepSize) * stepSize;

        for (let py = minY; py <= maxY; py += stepSize) {
          for (let px = minX; px <= maxX; px += stepSize) {
            const dist = Math.sqrt((px - gridPos.x) ** 2 + (py - gridPos.y) ** 2);
            if (dist < effectiveBrushSize) {
              const roundedX = Math.round(px * 10) / 10;
              const roundedY = Math.round(py * 10) / 10;

              const existing = newPoints.find(p => Math.abs(p.x - roundedX) < 0.01 && Math.abs(p.y - roundedY) < 0.01);
              if (!existing) {
                newPoints.push({ x: roundedX, y: roundedY, source: 'manual' });
              }
            }
          }
        }
      }
      setPoints(newPoints);
    }
  };
  
  // Threshold change handler
  const handleThresholdChange = (newThreshold) => {
    // Clamp threshold to valid range
    const clampedThreshold = Math.max(0, Math.min(255, newThreshold));
    setThreshold(clampedThreshold);

    // Trigger reprocessing if autoRecalculate is enabled and image is loaded
    if (autoRecalculate && image && processingMode === 'standard') {
      processImageWithPipeline(image, imageScale, imageOffsetX, imageOffsetY, imageRotation, processingMode, invertResult);
    }
  };

  // Processing mode change
  const changeProcessingMode = (newMode) => {
    if (!image) return;
    setProcessingMode(newMode);
    processImageWithPipeline(image, imageScale, imageOffsetX, imageOffsetY, imageRotation, newMode, invertResult);
  };
  
  const toggleInvert = () => {
    if (!image) {
      const canvasSize = Math.max(bedWidth, bedHeight) * 3;
      const halfCanvas = canvasSize / 2;
      const halfBedX = bedWidth / 2;
      const halfBedY = bedHeight / 2;
      
      const allPointsMap = new Map();
      
      for (let y = 0; y < canvasSize; y += stepSize) {
        for (let x = 0; x < canvasSize; x += stepSize) {
          const gridX = Math.round((x - halfCanvas + halfBedX) * 10) / 10;
          const gridY = Math.round(((canvasSize - y) - halfCanvas + halfBedY) * 10) / 10;
          const key = `${gridX},${gridY}`;
          allPointsMap.set(key, { x: gridX, y: gridY });
        }
      }
      
      points.forEach(p => {
        const key = `${p.x},${p.y}`;
        allPointsMap.delete(key);
      });
      
      const newPoints = Array.from(allPointsMap.values());
      setPoints(newPoints);
      history.saveToHistory(newPoints,
        { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
        { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
      );
      setInvertResult(!invertResult);
    } else {
      const newInvert = !invertResult;
      setInvertResult(newInvert);
      processImageWithPipeline(image, imageScale, imageOffsetX, imageOffsetY, imageRotation, processingMode, newInvert);
    }
  };
  
  const resetToOriginal = () => {
    if (image) {
      setProcessingMode('standard');
      setInvertResult(false);
      processImageWithPipeline(image, imageScale, imageOffsetX, imageOffsetY, imageRotation, 'standard', false);
    }
  };
  
  // G-code generation
  const handleGenerateGcode = () => {
    const transformedPoints = points.map(point => gridToBed(point, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight));
    const validPoints = transformedPoints.filter(point => 
      point.x >= 0 && point.x <= bedWidth && point.y >= 0 && point.y <= bedHeight
    );
    
    const gcode = generateEngravingGCode({
      points: validPoints,
      bedWidth,
      bedHeight,
      temperature,
      dwellTime,
      depthZ,
      yAcceleration,
      startGcode,
      useBedLeveling,
      pointPattern
    });
    
    downloadGCode(gcode, fileName);
  };
  
  const handleGenerateTestGrid = () => {
    const gcode = generateTestGridGCode({
      testGrid,
      bedWidth,
      bedHeight,
      testGridOffsetX,
      testGridOffsetY,
      yAcceleration,
      testStartGcode,
      useBedLeveling
    });
    
    downloadGCode(gcode, testFileName);
  };
  
  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Wood Engraving Generator</h1>
          <span className="text-xs text-gray-400">v{VERSION}</span>
          <a 
            href="https://www.youtube.com/@ArseniyLab" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            made by Arseniy's Lab
          </a>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('engraving')}
            className={`px-4 py-2 rounded transition ${
              activeTab === 'engraving' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🎨 Engraving
          </button>
          <button
            onClick={() => setActiveTab('test-grid')}
            className={`px-4 py-2 rounded transition ${
              activeTab === 'test-grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🧪 Test Grid
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'engraving' && (
          <>
            <div className="flex-1 flex flex-col p-4">
              <Toolbar
                tool={tool}
                setTool={setTool}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                pointPattern={pointPattern}
                image={image}
                imageScale={imageScale}
                setImageScale={setImageScale}
                gridRotation={gridRotation}
                setGridRotation={setGridRotation}
                showImage={showImage}
                setShowImage={setShowImage}
                onRemoveImage={removeImage}
                onUploadImage={handleImageUpload}
                onLoadGcode={handleGCodeUpload}
                onClearAll={() => {
                  setPoints([]);
                  history.saveToHistory([],
                    { offsetX: gridOffsetX, offsetY: gridOffsetY, rotation: gridRotation },
                    { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, rotation: imageRotation }
                  );
                }}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={history.canUndo}
                canRedo={history.canRedo}
                points={points}
                onGenerateQR={() => setShowQRCodeModal(true)}
                autoRecalculate={autoRecalculate}
                setAutoRecalculate={setAutoRecalculate}
                onRecalculate={transformPoints}
                needsRecalculation={needsRecalculation}
              />
              
              <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 min-h-0">
                  <Canvas
                    ref={canvasRef}
                    activeTab={activeTab}
                    bedWidth={bedWidth}
                    bedHeight={bedHeight}
                    nozzleDiameter={nozzleDiameter}
                    containerSize={containerSize}
                    canvasZoom={canvasZoom}
                    canvasPanX={canvasPanX}
                    canvasPanY={canvasPanY}
                    points={points}
                    gridOffsetX={gridOffsetX}
                    gridOffsetY={gridOffsetY}
                    gridRotation={gridRotation}
                    image={image}
                    showImage={showImage}
                    clipToBed={clipToBed}
                    imageScale={imageScale}
                    imageOffsetX={imageOffsetX}
                    imageOffsetY={imageOffsetY}
                    imageRotation={imageRotation}
                    tool={tool}
                    brushSize={effectiveBrushSize}
                    mousePos={mousePos}
                    mouseScreenPos={mouseScreenPos}
                    previewPoints={previewPoints}
                    testGrid={testGrid}
                    testGridOffsetX={testGridOffsetX}
                    testGridOffsetY={testGridOffsetY}
                    isDraggingFile={isDraggingFile}
                    needsRecalculation={needsRecalculation}
                    autoRecalculate={autoRecalculate}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  />
                </div>

                <div className="mt-2 py-2 text-sm text-gray-400 text-center flex-shrink-0">
                  {!image && points.length === 0 && '📸 Upload an image or 📄 Load G-code to get started • Drag & drop supported'}
                  {!image && points.length > 0 && '✨ Editing G-code points • You can load an image to overlay or continue editing'}
                  {image && tool === 'move' && '🖱️ Drag to move grid • Scroll to zoom image • Middle/Right click to pan'}
                  {image && tool === 'brush' && '🖌️ Click and drag to add burn points • Middle click to move grid • Right click to pan'}
                  {image && tool === 'eraser' && '🧹 Click and drag to remove burn points • Middle click to move grid • Right click to pan'}
                  {!image && tool === 'move' && points.length > 0 && '🖱️ Drag to move grid • Scroll to zoom canvas • Middle/Right click to pan'}
                </div>
              </div>
            </div>
            
            <Sidebar
              stepSize={stepSize}
              setStepSize={setStepSize}
              threshold={threshold}
              setThreshold={handleThresholdChange}
              pointPattern={pointPattern}
              setPointPattern={setPointPattern}
              autoRecalculate={autoRecalculate}
              setAutoRecalculate={(checked) => {
                setAutoRecalculate(checked);
                if (checked && image) {
                  processImageWithPipeline(image, imageScale, imageOffsetX, imageOffsetY, imageRotation, processingMode, invertResult);
                }
              }}
              onRecalculate={transformPoints}
              image={image}
              processingMode={processingMode}
              onChangeProcessingMode={changeProcessingMode}
              onToggleInvert={toggleInvert}
              onResetToOriginal={resetToOriginal}
              invertResult={invertResult}
              bedWidth={bedWidth}
              setBedWidth={setBedWidth}
              bedHeight={bedHeight}
              setBedHeight={setBedHeight}
              nozzleDiameter={nozzleDiameter}
              setNozzleDiameter={setNozzleDiameter}
              depthZ={depthZ}
              setDepthZ={setDepthZ}
              temperature={temperature}
              setTemperature={setTemperature}
              dwellTime={dwellTime}
              setDwellTime={setDwellTime}
              yAcceleration={yAcceleration}
              setYAcceleration={setYAcceleration}
              showPrinterSettings={showPrinterSettings}
              setShowPrinterSettings={setShowPrinterSettings}
              showPrintSettings={showPrintSettings}
              setShowPrintSettings={setShowPrintSettings}
              points={points}
              gridOffsetX={gridOffsetX}
              gridOffsetY={gridOffsetY}
              gridRotation={gridRotation}
              onGenerateGcode={() => setShowGcodeModal(true)}
            />
          </>
        )}
        
        {activeTab === 'test-grid' && (
          <>
            <div className="flex-1 flex flex-col p-4">
              <div className="mb-3 flex items-center justify-between h-10">
                <div>
                  <h2 className="text-lg font-bold">Test Grid Preview</h2>
                  <p className="text-xs text-gray-400">
                    Generate a test grid to find optimal depth and dwell time parameters
                  </p>
                </div>
              </div>

              <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 min-h-0">
                  <Canvas
                    ref={canvasRef}
                    activeTab={activeTab}
                    bedWidth={bedWidth}
                    bedHeight={bedHeight}
                    nozzleDiameter={nozzleDiameter}
                    containerSize={containerSize}
                    canvasZoom={canvasZoom}
                    canvasPanX={canvasPanX}
                    canvasPanY={canvasPanY}
                    points={points}
                    gridOffsetX={gridOffsetX}
                    gridOffsetY={gridOffsetY}
                    gridRotation={gridRotation}
                    image={null}
                    showImage={false}
                    clipToBed={clipToBed}
                    imageScale={1}
                    imageOffsetX={0}
                    imageOffsetY={0}
                    imageRotation={0}
                    tool="move"
                    brushSize={0}
                    mousePos={null}
                    mouseScreenPos={null}
                    previewPoints={[]}
                    testGrid={testGrid}
                    testGridOffsetX={testGridOffsetX}
                    testGridOffsetY={testGridOffsetY}
                    isDraggingFile={false}
                    needsRecalculation={needsRecalculation}
                    autoRecalculate={autoRecalculate}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    onDragOver={() => {}}
                    onDragLeave={() => {}}
                    onDrop={() => {}}
                  />
                </div>

                <div className="mt-2 py-2 text-sm text-gray-400 text-center flex-shrink-0">
                  🧪 Test grid: {testGrid.timeCount} × {testGrid.depthCount} = {testGrid.timeCount * testGrid.depthCount} points •
                  🖱️ Left/Middle click to drag • Right click to pan • Scroll to adjust spacing ({testGrid.spacing}mm)
                </div>
              </div>
            </div>
            
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  <div className="bg-gray-900 p-2.5 rounded">
                    <h3 className="font-bold mb-2 text-sm">Grid Parameters</h3>

                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-2.5">
                      <h4 className="text-xs font-bold text-blue-400 mb-1.5">Time (X-axis / Columns)</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-400">Start (s)</label>
                            <input
                              type="number"
                              value={testGrid.timeStart}
                              onChange={(e) => setTestGrid({...testGrid, timeStart: Number(e.target.value)})}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Step (s)</label>
                            <input
                              type="number"
                              value={testGrid.timeStep}
                              onChange={(e) => setTestGrid({...testGrid, timeStep: Number(e.target.value)})}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Count</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={testGrid.timeCount}
                              onChange={(e) => setTestGrid({...testGrid, timeCount: Number(e.target.value)})}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
                          Range: {testGrid.timeStart}s → {testGrid.timeStart + (testGrid.timeCount - 1) * testGrid.timeStep}s
                        </div>
                      </div>
                    </div>

                    <div className="border-l-4 border-green-500 pl-2.5">
                      <h4 className="text-xs font-bold text-green-400 mb-1.5">Depth (Y-axis / Rows)</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-400">Start (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={testGrid.depthStart}
                              onChange={(e) => setTestGrid({...testGrid, depthStart: parseFloat(e.target.value)})}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Step (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={testGrid.depthStep}
                              onChange={(e) => setTestGrid({...testGrid, depthStep: parseFloat(e.target.value)})}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Count</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={testGrid.depthCount}
                              onChange={(e) => setTestGrid({...testGrid, depthCount: Number(e.target.value)})}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
                          Range: {testGrid.depthStart}mm → {(testGrid.depthStart + (testGrid.depthCount - 1) * testGrid.depthStep).toFixed(2)}mm
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-700">
                      <div className="space-y-1.5 text-sm">
                        <div>
                          <label className="text-xs text-gray-400">Point Spacing (mm)</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={testGrid.spacing} 
                            onChange={(e) => setTestGrid({...testGrid, spacing: parseFloat(e.target.value)})}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Temperature (°C)</label>
                          <input 
                            type="number" 
                            value={testGrid.temperature} 
                            onChange={(e) => setTestGrid({...testGrid, temperature: Number(e.target.value)})}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 p-2.5 rounded">
                  <h3 className="font-bold mb-2 text-sm">Grid Statistics</h3>
                  <div className="space-y-0.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Grid Size:</span>
                      <span className="font-mono">{testGrid.timeCount} × {testGrid.depthCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Points:</span>
                      <span className="font-mono font-bold text-green-400">{testGrid.timeCount * testGrid.depthCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Physical Size:</span>
                      <span className="font-mono">
                        {((testGrid.timeCount - 1) * testGrid.spacing).toFixed(1)} × {((testGrid.depthCount - 1) * testGrid.spacing).toFixed(1)}mm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Est. Time:</span>
                      <span className="font-mono font-bold text-yellow-400">
                        ~{Math.ceil((testGrid.timeCount * testGrid.depthCount * (testGrid.timeStart + testGrid.timeStep * testGrid.timeCount / 2 + 2)) / 60)}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700/50 p-2.5 rounded">
                  <h4 className="text-xs font-bold text-blue-300 mb-1.5">💡 How to Use</h4>
                  <ol className="text-[10px] text-gray-300 space-y-0.5 list-decimal list-inside">
                    <li>Configure time and depth ranges</li>
                    <li>Generate and print the test grid</li>
                    <li>Examine the results on your material</li>
                    <li>Choose the best combination of depth & time</li>
                    <li>Use those values in the Engraving tab</li>
                  </ol>
                </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-700 bg-gray-800">
                <button
                  onClick={() => setShowTestGridModal(true)}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded font-bold transition"
                >
                  ⚙️ Generate Test Grid G-code
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Modals */}
      <GcodeModal
        show={showGcodeModal}
        onClose={() => setShowGcodeModal(false)}
        onGenerate={() => {
          handleGenerateGcode();
          setShowGcodeModal(false);
        }}
        useBedLeveling={useBedLeveling}
        setUseBedLeveling={setUseBedLeveling}
        startGcode={startGcode}
        setStartGcode={setStartGcode}
        fileName={fileName}
        setFileName={setFileName}
      />
      
      <TestGridModal
        show={showTestGridModal}
        onClose={() => setShowTestGridModal(false)}
        onGenerate={() => {
          handleGenerateTestGrid();
          setShowTestGridModal(false);
        }}
        testGrid={testGrid}
        useBedLeveling={useBedLeveling}
        setUseBedLeveling={setUseBedLeveling}
        testStartGcode={testStartGcode}
        setTestStartGcode={setTestStartGcode}
        testFileName={testFileName}
        setTestFileName={setTestFileName}
        yAcceleration={yAcceleration}
      />
      
      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onConfirm={confirmImport}
        importData={importData}
        setImportData={setImportData}
      />

      <QRCodeModal
        isOpen={showQRCodeModal}
        onClose={() => setShowQRCodeModal(false)}
        onGenerate={handleGenerateQR}
        stepSize={stepSize}
        bedWidth={bedWidth}
        bedHeight={bedHeight}
      />

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Welcome to Wood Engraver!</h2>
            <p className="text-gray-300 mb-4">Please configure your printer settings:</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bed Width (mm)</label>
                  <input
                    type="number"
                    value={bedWidth}
                    onChange={(e) => setBedWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bed Height (mm)</label>
                  <input
                    type="number"
                    value={bedHeight}
                    onChange={(e) => setBedHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Nozzle Diameter (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={nozzleDiameter}
                  onChange={(e) => setNozzleDiameter(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setCookie('hasSeenSetup', 'true');
                setShowSetupModal(false);
              }}
              className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <canvas ref={imageCanvasRef} style={{ display: 'none' }} />
    </div>
  );
};
