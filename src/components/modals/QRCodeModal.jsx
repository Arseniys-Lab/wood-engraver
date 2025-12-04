const { useState } = React;
const { QRCodeUtil } = window;

window.QRCodeModal = ({ isOpen, onClose, onGenerate, stepSize, bedWidth, bedHeight }) => {
  const [text, setText] = useState('');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState('');
  const [autoDotsPerModule, setAutoDotsPerModule] = useState(true);
  const [manualDotsPerModule, setManualDotsPerModule] = useState(2);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!text.trim()) {
      setError('Please enter text or URL');
      return;
    }

    setError('');
    try {
      const dotsPerModule = autoDotsPerModule ? null : manualDotsPerModule;
      const result = QRCodeUtil.generateQRPoints(text, stepSize, bedWidth, bedHeight, offsetX, offsetY, dotsPerModule);
      onGenerate(result, text, offsetX, offsetY, dotsPerModule);
      onClose();
      setText('');
      setOffsetX(0);
      setOffsetY(0);
      setAutoDotsPerModule(true);
      setManualDotsPerModule(2);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generate QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Text or URL to Encode
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text, URL, or any data to encode in QR code..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">
              Max ~2900 characters (depends on content type)
            </p>
          </div>

          {/* Offset Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Offset X (mm): {offsetX}
              </label>
              <input
                type="range"
                min={-bedWidth / 2}
                max={bedWidth / 2}
                step={1}
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Offset Y (mm): {offsetY}
              </label>
              <input
                type="range"
                min={-bedHeight / 2}
                max={bedHeight / 2}
                step={1}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Dots Per Module Control */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Dot Density per QR Module
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoDotsPerModule(true)}
                className={`px-3 py-1 rounded ${autoDotsPerModule ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                Auto
              </button>
              <button
                onClick={() => setAutoDotsPerModule(false)}
                className={`px-3 py-1 rounded ${!autoDotsPerModule ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                Manual
              </button>
            </div>
            {!autoDotsPerModule && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Grid Size: {manualDotsPerModule}x{manualDotsPerModule} dots
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={manualDotsPerModule}
                  onChange={(e) => setManualDotsPerModule(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x1</span>
                  <span>5x5</span>
                  <span>10x10</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded px-4 py-2 text-red-200">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-900 p-3 rounded text-sm text-gray-400">
            <p className="font-bold mb-1">ℹ️ Info:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>QR code will be centered on the bed</li>
              <li>Uses square pattern with step size: {stepSize}mm</li>
              <li>Size scales with step size and dots-per-module setting</li>
              <li>Dark QR modules will be burned as dot grids</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={!text.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded transition font-bold"
            >
              Generate & Add to Grid
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
