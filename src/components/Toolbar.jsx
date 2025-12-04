const { useState } = React;

window.Toolbar = ({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  pointPattern,
  image,
  imageScale,
  setImageScale,
  gridRotation,
  setGridRotation,
  showImage,
  setShowImage,
  onRemoveImage,
  onUploadImage,
  onLoadGcode,
  onClearAll,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  points,
  onGenerateQR,
  autoRecalculate,
  setAutoRecalculate,
  onRecalculate,
  needsRecalculation
}) => {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex gap-2">
        <button
          onClick={() => setTool('move')}
          className={`px-3 py-2 rounded whitespace-nowrap ${tool === 'move' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          title="Move tool"
        >
          <span>✋</span>
          <span className="ml-1.5 hidden 2xl:inline">Move</span>
        </button>
        <button
          onClick={() => setTool('brush')}
          className={`px-3 py-2 rounded whitespace-nowrap ${tool === 'brush' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          title="Brush tool"
        >
          <span>🖌️</span>
          <span className="ml-1.5 hidden 2xl:inline">Brush</span>
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`px-3 py-2 rounded whitespace-nowrap ${tool === 'eraser' ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          title="Eraser tool"
        >
          <span>🧹</span>
          <span className="ml-1.5 hidden 2xl:inline">Eraser</span>
        </button>
        <button
          onClick={onClearAll}
          className="px-3 py-2 bg-red-800 hover:bg-red-700 rounded whitespace-nowrap"
          title="Clear all points"
        >
          <span>🗑️</span>
          <span className="ml-1.5 hidden 2xl:inline">Clear All</span>
        </button>
        
        {tool === 'move' && (
          <div className="flex items-center gap-4 ml-4">
            {image && (
              <div className="flex items-center gap-2">
                <label className="text-sm">Scale:</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={imageScale} 
                  onChange={(e) => setImageScale(parseFloat(e.target.value))} 
                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded" 
                  min="0.1" 
                  max="10" 
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm">Rotation:</label>
              <input 
                type="number" 
                value={gridRotation} 
                onChange={(e) => setGridRotation(Number(e.target.value))} 
                className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded" 
              />
              <button 
                onClick={() => setGridRotation(gridRotation - 45)} 
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600" 
                title="Rotate left 45°"
              >
                ↶
              </button>
              <button 
                onClick={() => setGridRotation(gridRotation + 45)} 
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600" 
                title="Rotate right 45°"
              >
                ↷
              </button>
            </div>
          </div>
        )}
        
        {(tool === 'eraser' || (tool === 'brush' && pointPattern !== 'contour')) && (
          <div className="flex items-center gap-2 ml-4">
            <label className="text-sm">Size:</label>
            <input
              type="number"
              step="0.5"
              value={brushSize}
              onChange={(e) => setBrushSize(parseFloat(e.target.value) || 0.5)}
              className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded"
              min="0.5"
              max="50"
            />
            <span className="text-xs text-gray-400">mm</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        {!image && points.length === 0 ? (
          <>
            <label className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer transition whitespace-nowrap" title="Upload an image">
              <span>📁</span>
              <span className="ml-1.5 hidden 2xl:inline">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={onUploadImage}
                className="hidden"
              />
            </label>
            <label className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded cursor-pointer transition whitespace-nowrap" title="Load G-code file">
              <span>📄</span>
              <span className="ml-1.5 hidden 2xl:inline">Load G-code</span>
              <input
                type="file"
                accept=".gcode,.gcode.3mf"
                onChange={onLoadGcode}
                className="hidden"
              />
            </label>
            <button
              onClick={onGenerateQR}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded transition whitespace-nowrap"
              title="Generate QR Code"
            >
              <span>📱</span>
              <span className="ml-1.5 hidden 2xl:inline">QR Code</span>
            </button>
          </>
        ) : (
          <>
            {image && (
              <>
                <button
                  onClick={() => setShowImage(!showImage)}
                  className={`px-3 py-2 rounded transition whitespace-nowrap ${showImage ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  title={showImage ? 'Hide image' : 'Show image'}
                >
                  <span>{showImage ? '👁️' : '👁️‍🗨️'}</span>
                  <span className="ml-1.5 hidden 2xl:inline">{showImage ? 'Hide' : 'Show'} Image</span>
                </button>
                <button
                  onClick={onRemoveImage}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition whitespace-nowrap"
                  title="Remove image"
                >
                  <span>🗑️</span>
                  <span className="ml-1.5 hidden 2xl:inline">Remove Image</span>
                </button>
              </>
            )}
            {!image && points.length > 0 && (
              <label className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer transition whitespace-nowrap" title="Load an image">
                <span>📁</span>
                <span className="ml-1.5 hidden 2xl:inline">Load Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUploadImage}
                  className="hidden"
                />
              </label>
            )}
          </>
        )}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30"
          title="Undo"
        >
          ↶
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30"
          title="Redo"
        >
          ↷
        </button>
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-700">
          <input
            type="checkbox"
            id="autoRecalcToolbar"
            checked={autoRecalculate}
            onChange={(e) => setAutoRecalculate(e.target.checked)}
            className="w-4 h-4"
            title="Automatically recalculate points when settings change"
          />
          <label htmlFor="autoRecalcToolbar" className="text-xs text-gray-400 cursor-pointer whitespace-nowrap hidden 2xl:inline">
            Auto-recalc
          </label>
          <button
            onClick={onRecalculate}
            className={`px-3 py-1 rounded transition text-sm whitespace-nowrap ${
              needsRecalculation && !autoRecalculate
                ? 'bg-yellow-600 hover:bg-yellow-700 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
            title="Recalculate points from image"
          >
            <span>⟳</span>
            <span className="ml-1 hidden 2xl:inline">Recalculate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
