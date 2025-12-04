const { useState } = React;

window.ImportModal = ({
  show,
  onClose,
  onConfirm,
  importData,
  setImportData
}) => {
  if (!show || !importData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Import G-code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-900 rounded">
          <p className="text-sm text-gray-300 mb-2">
            <strong>{importData.points.length}</strong> points found
          </p>
          <p className="text-xs text-gray-400">
            Please review and adjust the detected parameters before importing.
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bed Width (mm)</label>
              <input
                type="number"
                value={importData.bedWidth}
                onChange={(e) => setImportData({...importData, bedWidth: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bed Height (mm)</label>
              <input
                type="number"
                value={importData.bedHeight}
                onChange={(e) => setImportData({...importData, bedHeight: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Step Size (mm) 
              <span className="text-xs text-gray-400 ml-2">
                (Suggested: {importData.stepSize}mm based on point spacing analysis)
              </span>
            </label>
            <input
              type="number"
              step="0.1"
              value={importData.stepSize}
              onChange={(e) => setImportData({...importData, stepSize: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Temperature (°C)</label>
            <input
              type="number"
              value={importData.temperature}
              onChange={(e) => setImportData({...importData, temperature: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dwell Time (s)</label>
              <input
                type="number"
                value={importData.dwellTime}
                onChange={(e) => setImportData({...importData, dwellTime: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Depth Z (mm)</label>
              <input
                type="number"
                step="0.1"
                value={importData.depthZ}
                onChange={(e) => setImportData({...importData, depthZ: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onConfirm} 
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded font-bold transition"
          >
            ✅ Import G-code
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
