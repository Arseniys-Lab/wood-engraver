const { useState } = React;

window.GcodeModal = ({
  show,
  onClose,
  onGenerate,
  useBedLeveling,
  setUseBedLeveling,
  startGcode,
  setStartGcode,
  fileName,
  setFileName
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Generate G-code</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-blue-900/30 border border-blue-700/50 rounded">
            <input 
              type="checkbox" 
              id="useBedLeveling" 
              checked={useBedLeveling} 
              onChange={(e) => setUseBedLeveling(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="useBedLeveling" className="text-sm cursor-pointer flex-1">
              <span className="font-medium text-blue-300">Enable Bed Leveling (G29 A1)</span>
              <p className="text-xs text-gray-400 mt-1">
                Levels only the minimal area containing your points. Prevents nozzle from going outside the workpiece. Essential for accurate Z-height.
              </p>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Start G-code Sequence</label>
            <textarea
              value={startGcode}
              onChange={(e) => setStartGcode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded font-mono text-xs"
              rows="18"
              placeholder="Enter your custom start G-code here..."
            />
            <p className="text-xs text-gray-400 mt-2">
              Bed leveling commands will be automatically inserted after this sequence. Z=0 is the bed surface after leveling.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">File Name</label>
            <input 
              type="text" 
              value={fileName} 
              onChange={(e) => setFileName(e.target.value)} 
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              placeholder="engraving"
            />
            <p className="text-xs text-gray-400 mt-2">
              Will be saved as {fileName}.gcode
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onGenerate} 
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded font-bold transition"
          >
            ⬇️ Download G-code
          </button>
          <button 
            onClick={onClose} 
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
