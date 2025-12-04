const { useState, useCallback } = React;

window.useHistory = () => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback((points, gridTransform, transform) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        points: JSON.parse(JSON.stringify(points)),
        gridTransform: { ...gridTransform },
        transform: { ...transform }
      });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      return prevState;
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      return nextState;
    }
    return null;
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const reset = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    history,
    historyIndex
  };
};
