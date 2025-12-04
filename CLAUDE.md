# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Version Management

**Current Version**: 4.3.2

When making changes to the codebase, **always increment the version number** and update it in these files:
- `src/App.jsx` - Line 17: `const VERSION = "x.x.x";`
- `src/utils/gcodeGenerator.js` - Line 3: `const VERSION = "x.x.x";`
- `index.html` - Line 6: `<title>Wood Engraving G-code Generator vx.x.x - Arseniy's Lab</title>`

**Versioning scheme**:
- Major.Minor.Patch (e.g., 4.3.0)
- Increment patch for bug fixes (4.3.0 → 4.3.1)
- Increment minor for new features (4.3.0 → 4.4.0)
- Increment major for breaking changes (4.3.0 → 5.0.0)

**Recent Changes**:
- v4.3.2: Fixed toolbar button text wrapping by using 2xl breakpoint and whitespace-nowrap, ensuring buttons always stay single-row
- v4.3.1: Made toolbar buttons responsive (text hides on small screens, icons remain with tooltips), simplified point pattern buttons (removed icons, consistent text sizing)
- v4.3.0: Combined point pattern & image processing UI sections, moved printer settings before statistics, added test grid cookie persistence, fixed canvas shift between tabs, made generate button sticky, optimized UI for smaller screens

## Project Overview

Wood Engraving G-code Generator v4.3.2 - A modular React application for generating G-code from images for wood engraving on 3D printers. The application processes images into point patterns and generates optimized G-code with features like bed leveling, temperature control, and test grid generation.

## Architecture

### Module System
This is a browser-based React application using **Babel Standalone** for JSX transpilation and a **global module pattern** (`window.*`) instead of ES6 modules. This allows the app to run directly in browsers without a build step.

**Key principle**: All modules export to `window` namespace and import by destructuring from `window`.

Example pattern:
```javascript
// In module file:
window.MyFunction = () => { ... }

// In App.jsx:
const { MyFunction } = window;
```

### Module Loading Order (Critical)

The order in `index.html` must be maintained:

1. **Utils** - Core utilities with no dependencies
   - `transforms.js` - Coordinate transformations (grid ↔ bed space)
   - `imageProcessing.js` - Image processing algorithms
   - `gcodeGenerator.js` - G-code generation logic
   - `gcodeParser.js` - G-code file parsing
   - `qrcode.js` - QR code generation utilities

2. **Hooks** - React hooks
   - `useHistory.js` - Undo/Redo functionality

3. **Components** - React UI components
   - Modal components first (GcodeModal, TestGridModal, ImportModal, QRCodeModal)
   - Then Canvas, Toolbar, Sidebar

4. **App** - Main application logic (`App.jsx`)

5. **Initialization** - ReactDOM render call

### State Architecture

The app uses a **centralized state** pattern in `App.jsx` (~800 lines) with state lifted to the root component and passed down via props. Key state categories:

- **Image & Points**: Raw image data and processed point arrays
- **Transforms**: Grid/image offset, rotation, scale for coordinate transformations
- **UI State**: Canvas zoom/pan, dragging states, tool selection
- **Parameters**: Bed dimensions, processing settings, G-code parameters
- **Test Grid**: Separate state for test grid generation mode

### Coordinate System

Two coordinate spaces exist with transformations between them:

- **Grid Space**: The logical grid where points are generated from images
- **Bed Space**: The physical 3D printer bed coordinates (G-code output)

Functions `gridToBed()` and `bedToGrid()` in `transforms.js` handle conversions, accounting for:
- Grid offset (translation)
- Grid rotation
- Bed dimensions
- Y-axis inversion (screen vs printer coordinates)

## Development Commands

### Running the Application

**Method 1**: Direct browser open
```bash
# Simply open index.html in a modern browser
```

**Method 2**: Local server (recommended for development)
```bash
python -m http.server 8000
# Then open http://localhost:8000
```

**Note**: A local server is recommended to avoid CORS issues with file loading and to better simulate production behavior.

### Testing

No automated tests exist. Manual testing workflow:
1. Open `index.html` in browser
2. Open browser DevTools console (F12)
3. Check for JavaScript errors
4. Test image upload → point generation → G-code export

## Key Workflows

### Image Processing Pipeline

1. User uploads image → `handleFileUpload()` in App.jsx
2. Image loaded to canvas → ImageData extracted
3. Processing mode applied (standard/dithering/edge detection) → `ImageProcessing` utilities
4. Points generated based on `pointPattern` (square/diamond/circle/random)
5. Points transformed via grid offset/rotation → `gridToBed()`
6. Manual editing with tools (add/remove/move points)
7. G-code generation → `generateEngravingGCode()`

### G-code Generation

The `generateEngravingGCode()` function in `gcodeGenerator.js`:
- Optimizes point order using nearest neighbor algorithm
- Generates header with metadata and settings
- Includes optional bed leveling commands (G29)
- Adds heating commands (M104/M109)
- Creates movement commands for each point (G0)
- Includes progress tracking (M73) and comments
- Returns complete G-code string

Format: Each point follows this pattern:
```gcode
G0 Z{safeZ} F1000          ; Move to safe height
G0 X{x} Y{y} F3000         ; Move to point
G0 Z{depthZ} F300          ; Lower to engraving depth
G4 S{dwellTime}            ; Dwell (burn)
G0 Z{safeZ} F1000          ; Return to safe height
```

### Test Grid Mode

Separate mode for generating calibration grids:
- X-axis: Dwell time variation
- Y-axis: Depth variation
- Creates matrix of points with different parameters
- Used for finding optimal engraving settings

## File Structure Reference

```
wood_engraver_ultimate/
├── index.html                      # Main entry point
├── src/
│   ├── App.jsx                     # Main application logic (~800 lines)
│   ├── utils/
│   │   ├── transforms.js           # Coordinate transformations (~70 lines)
│   │   ├── imageProcessing.js      # Image processing algorithms (~200 lines)
│   │   ├── gcodeGenerator.js       # G-code generation (~270 lines)
│   │   ├── gcodeParser.js          # G-code parsing (~120 lines)
│   │   └── qrcode.js               # QR code utilities (~100 lines)
│   ├── components/
│   │   ├── Canvas.jsx              # Canvas rendering with tools (~400 lines)
│   │   ├── Toolbar.jsx             # Tool palette and controls (~200 lines)
│   │   ├── Sidebar.jsx             # Settings panels (~400 lines)
│   │   └── modals/
│   │       ├── GcodeModal.jsx      # G-code preview/export (~100 lines)
│   │       ├── TestGridModal.jsx   # Test grid configuration (~120 lines)
│   │       ├── ImportModal.jsx     # G-code import (~140 lines)
│   │       └── QRCodeModal.jsx     # QR code generation (~200 lines)
│   └── hooks/
│       └── useHistory.js           # Undo/Redo implementation (~50 lines)
├── README.md                       # User documentation
├── QUICKSTART.md                   # Quick start guide
├── STATUS.md                       # Project status
└── SUMMARY.md                      # Project summary
```

## Common Debugging Scenarios

**Coordinate issues** (points appear in wrong location):
- Check `src/utils/transforms.js` (70 lines)
- Verify `gridToBed()` and `bedToGrid()` transformations
- Common issue: Grid rotation or offset calculations

**Image processing problems** (points not generated correctly):
- Check `src/utils/imageProcessing.js` (200 lines)
- Verify threshold, stepSize, and processing mode settings
- Common issue: Image not properly loaded or ImageData extraction

**G-code output errors**:
- Check `src/utils/gcodeGenerator.js` (270 lines)
- Verify parameter passing (temperature, depthZ, dwellTime, etc.)
- Common issue: Missing or incorrect G-code commands

**UI/Canvas rendering issues**:
- Check `src/components/Canvas.jsx` (400 lines)
- Verify canvas zoom/pan calculations
- Common issue: Canvas coordinate transformation or clipping

**Tool behavior problems** (add/remove/brush not working):
- Check tool event handlers in `src/App.jsx`
- Verify mouse position calculations in `src/components/Canvas.jsx`
- Common issue: Coordinate space mismatch between screen and bed

## Important Constraints

### Global Module Pattern
- Never use ES6 `import`/`export` - modules won't load
- Always export to `window`: `window.FunctionName = ...`
- Always import from `window`: `const { FunctionName } = window;`
- React components must use `React.useState`, `React.useEffect`, etc. (no destructuring at top level except from `window`)

### Script Loading
- Changing load order in `index.html` will break the app
- Dependencies must be loaded before dependents
- All scripts use `type="text/babel"` for JSX transpilation

### Coordinate Transforms
- Always use `gridToBed()` / `bedToGrid()` for coordinate conversions
- Never manually calculate transformations - use the utilities
- Y-axis is inverted between screen and printer coordinates

### State Updates
- State is centralized in App.jsx
- Use callback props to update state from child components
- For undo/redo to work, update points through `pushToHistory()`

## Performance Considerations

- **Point optimization**: `generateEngravingGCode()` uses nearest neighbor algorithm to minimize travel distance
- **Canvas rendering**: Large point sets (>10k points) may cause rendering lag - consider limiting preview density
- **Image processing**: Processing runs synchronously - large images may block UI temporarily
- **File size**: Generated G-code files can be large (1 point ≈ 6 lines of G-code)

## Common Modifications

### Adding a new image processing mode
1. Add processing function to `src/utils/imageProcessing.js`
2. Export via `window.ImageProcessing.newMode = ...`
3. Add mode option to `processingMode` select in Sidebar.jsx
4. Handle mode in `processImage()` function in App.jsx

### Adding a new tool
1. Add tool option to Toolbar.jsx
2. Add tool state handling in App.jsx
3. Implement tool behavior in Canvas.jsx mouse event handlers
4. Update cursor rendering for the new tool

### Modifying G-code output
1. Edit `generateEngravingGCode()` in `src/utils/gcodeGenerator.js`
2. Test with small point sets first
3. Verify G-code syntax with target printer firmware

## Known Limitations

- No build system - all transpilation happens in browser (slower startup)
- No module bundling - each file is a separate HTTP request
- No TypeScript - pure JavaScript with no type checking
- No automated tests - manual testing only
- No state persistence - refresh loses all work
- Limited undo/redo history (stored in memory only)
