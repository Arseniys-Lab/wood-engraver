const { useState } = React;
const { gridToBed } = window;

window.Sidebar = ({
  // Image processing
  stepSize,
  setStepSize,
  threshold,
  setThreshold,
  pointPattern,
  setPointPattern,
  autoRecalculate,
  setAutoRecalculate,
  onRecalculate,
  
  // Processing mode
  image,
  processingMode,
  onChangeProcessingMode,
  onToggleInvert,
  onResetToOriginal,
  invertResult,
  
  // Printer settings
  bedWidth,
  setBedWidth,
  bedHeight,
  setBedHeight,
  nozzleDiameter,
  setNozzleDiameter,
  depthZ,
  setDepthZ,
  temperature,
  setTemperature,
  dwellTime,
  setDwellTime,
  yAcceleration,
  setYAcceleration,
  showPrinterSettings,
  setShowPrinterSettings,
  showPrintSettings,
  setShowPrintSettings,

  // Points and stats
  points,
  gridOffsetX,
  gridOffsetY,
  gridRotation,
  
  // Actions
  onGenerateGcode
}) => {
  // Calculate visible points
  const transformedPoints = points.map(point => 
    gridToBed(point, gridOffsetX, gridOffsetY, gridRotation, bedWidth, bedHeight)
  );
  const visiblePoints = transformedPoints.filter(point => 
    point.x >= 0 && point.x <= bedWidth && point.y >= 0 && point.y <= bedHeight
  );
  
  const estimatedTime = visiblePoints.length * (dwellTime + 2) + visiblePoints.length * 0.5;
  const hours = Math.floor(estimatedTime / 3600);
  const minutes = Math.ceil((estimatedTime % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Print Settings */}
        <div className="bg-gray-900 p-2.5 rounded">
          <h3 className="font-bold mb-2 text-sm">Print Settings</h3>
          <div className="space-y-1.5 text-sm">
            <div>
              <label className="text-xs text-gray-400">Temperature (°C)</label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Depth Z (mm)</label>
              <input
                type="number"
                step="0.1"
                value={depthZ}
                onChange={(e) => setDepthZ(Number(e.target.value))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Dwell Time (s)</label>
              <input
                type="number"
                value={dwellTime}
                onChange={(e) => setDwellTime(Number(e.target.value))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Step Size (mm)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={stepSize}
                onChange={(e) => setStepSize(parseFloat(e.target.value) || 0.1)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
              />
            </div>
          </div>
        </div>

        {/* Image Processing */}
        <div className="bg-gray-900 p-2.5 rounded">
          <h3 className="font-bold mb-2 text-sm">Image Processing</h3>
          <div className="space-y-2.5 text-sm">
            {/* Point Pattern */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Point Pattern</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setPointPattern('square')}
                  className={`px-2 py-1.5 rounded text-xs transition ${pointPattern === 'square' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                  title="Square grid - uniform spacing"
                >
                  Square
                </button>
                <button
                  onClick={() => setPointPattern('triangle')}
                  className={`px-2 py-1.5 rounded text-xs transition ${pointPattern === 'triangle' ? 'bg-green-600 ring-2 ring-green-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                  title="Triangular packing - denser pattern"
                >
                  Triangle
                </button>
                <button
                  onClick={() => setPointPattern('contour')}
                  className={`px-2 py-1.5 rounded text-xs transition ${pointPattern === 'contour' ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                  title="Contour tracing - follows lines and edges"
                >
                  Contour
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {pointPattern === 'square' && '• Uniform grid spacing'}
                {pointPattern === 'triangle' && '• Hexagonal packing - 15% more points'}
                {pointPattern === 'contour' && '• Follows contours - best for line tracing'}
              </p>
            </div>

            {/* Algorithm, Threshold, and Transform - hidden in contour mode */}
            {image && pointPattern !== 'contour' && (
              <>
                {/* Algorithm Selection */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Algorithm</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onChangeProcessingMode('standard')}
                      className={`px-2 py-1.5 rounded text-xs transition ${processingMode === 'standard' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => onChangeProcessingMode('edge')}
                      className={`px-2 py-1.5 rounded text-xs transition ${processingMode === 'edge' ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      Edge
                    </button>
                    <button
                      onClick={() => onChangeProcessingMode('dither')}
                      className={`px-2 py-1.5 rounded text-xs transition ${processingMode === 'dither' ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      Dither
                    </button>
                  </div>
                </div>

                {/* Threshold (only for standard mode) */}
                {processingMode === 'standard' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Threshold (0-255)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                      />
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {/* Invert Option */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Transform</label>
                  <button
                    onClick={onToggleInvert}
                    className={`w-full px-2 py-1.5 rounded text-xs transition ${invertResult ? 'bg-cyan-600 ring-2 ring-cyan-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    ⚪⚫ {invertResult ? 'Inverted' : 'Invert'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Printer Settings */}
        <div className="bg-gray-900 p-2.5 rounded">
          <div
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => setShowPrinterSettings(!showPrinterSettings)}
          >
            <h3 className="font-bold text-sm">Printer Settings</h3>
            <span className="text-gray-400 text-xs">{showPrinterSettings ? '▼' : '▶'}</span>
          </div>
          {showPrinterSettings && (
            <div className="space-y-1.5 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400">Bed W (mm)</label>
                  <input
                    type="number"
                    value={bedWidth}
                    onChange={(e) => setBedWidth(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Bed H (mm)</label>
                  <input
                    type="number"
                    value={bedHeight}
                    onChange={(e) => setBedHeight(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Nozzle Ø (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={nozzleDiameter}
                  onChange={(e) => setNozzleDiameter(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Y Acceleration (mm/s²)</label>
                <input
                  type="number"
                  step="100"
                  value={yAcceleration}
                  onChange={(e) => setYAcceleration(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower values prevent wood from shifting (default: 1000)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-gray-900 p-2.5 rounded">
          <h3 className="font-bold mb-2 text-sm">Statistics & Info</h3>
          <div className="space-y-0.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Points:</span>
              <span className="font-mono font-bold text-green-400">{visiblePoints.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Est. Time:</span>
              <span className="font-mono font-bold text-yellow-400">~{timeStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bed Size:</span>
              <span className="font-mono">{bedWidth}×{bedHeight}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Resolution:</span>
              <span className="font-mono">{stepSize}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pattern:</span>
              <span className="font-mono">
                {pointPattern === 'square' && 'Square'}
                {pointPattern === 'triangle' && 'Triangle'}
                {pointPattern === 'contour' && 'Contour'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Temperature:</span>
              <span className="font-mono">{temperature}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Y Accel:</span>
              <span className="font-mono">{yAcceleration}mm/s²</span>
            </div>
            {visiblePoints.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                💡 Tip: Lower step size = higher detail but longer time
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <button
          onClick={onGenerateGcode}
          disabled={visiblePoints.length === 0}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-bold transition"
        >
          ⚙️ Generate G-code
        </button>
      </div>
    </div>
  );
};
