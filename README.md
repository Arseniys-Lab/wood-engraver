# 🔥 Wood Engraver

**Turn your 3D printer into a wood engraving machine**

Convert images into G-code for wood burning using your 3D printer's heated nozzle (hotend). No laser required - just heat and wood!

![Version](https://img.shields.io/badge/version-4.3.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 Try It Online

**[Launch App](https://arseniys-lab.github.io/wood-engraver/)** ← Click and start creating!

No installation needed - runs directly in your browser.

## ✨ Features

- 🎨 **Advanced Image Processing**: Dithering, edge detection, threshold adjustment
- 🔥 **Heated Nozzle Optimized**: Control temperature, burn time, and depth
- 📐 **Coordinate System**: Flexible bed/grid transformations with offset control
- 🔄 **Real-time Preview**: Visual feedback with draggable point cloud
- 🎯 **Test Grid Generator**: Find optimal burn parameters for your wood
- 📱 **QR Code Support**: Generate and burn QR codes directly
- 💾 **Import/Export**: Save and load your configurations
- ⏪ **Undo/Redo**: Full history management

## 🔥 How It Works

1. **Upload your image** to the web app
2. **Adjust settings** (burn time, depth, temperature)
3. **Generate G-code** - includes automatic heating commands
4. **Send to your 3D printer** and watch it burn!

The G-code controls everything automatically:
- **Temperature**: Heats nozzle to specified temperature
- **Dwell time**: How long the nozzle stays at each point
- **Depth (Z-axis)**: How deep the nozzle presses into wood

No manual preparation needed - just load the G-code and start!

## 🚀 Quick Start

### Online (Recommended)
Just visit: **[https://arseniys-lab.github.io/wood-engraver/](https://arseniys-lab.github.io/wood-engraver/)**

### Local Development
```bash
# Clone the repo
git clone https://github.com/Arseniys-Lab/wood-engraver.git
cd wood-engraver

# Start local server
python -m http.server 8000

# Open http://localhost:8000
```

## 📋 Requirements

**Hardware:**
- 3D printer with heated nozzle (any FDM printer works)
- Wood surface (plywood, pine, birch work well)
- Marlin or Klipper firmware

**Software:**
- Modern web browser (Chrome, Firefox, Edge)
- That's it! No installation needed

## 🎓 Usage Guide

### Basic Workflow
1. **Upload image** (📁 button)
2. **Choose processing mode**: Standard, Dithering, or Edge Detection
3. **Adjust threshold** to control detail level
4. **Set engraving parameters**:
   - Burn time: 2-20s per point (use test grid to figure out)
   - Depth: 0.0 to -1.0mm (use test grid)
   - Temperature: 300°C (if your printer supports higher feel free to try)
5. **Generate G-code** (💾 button)
6. **Send to printer**

### Test Grid Feature
Not sure about parameters? Generate a test grid:
- Creates matrix of different time/depth combinations
- Burn once, find optimal settings
- Save time and wood!

## 🏗️ Architecture

Pure client-side React application:

```
src/
├── utils/              # Core algorithms
│   ├── transforms.js   # Coordinate transformations
│   ├── imageProcessing.js # Image processing algorithms  
│   ├── gcodeGenerator.js  # G-code generation
│   ├── gcodeParser.js     # G-code parsing
│   └── qrcode.js          # QR code generation
├── components/         # UI components
│   ├── Canvas.jsx      # Interactive canvas
│   ├── Toolbar.jsx     # Tools panel
│   ├── Sidebar.jsx     # Settings panel
│   └── modals/         # Modal dialogs
└── hooks/              # React hooks
    └── useHistory.js   # Undo/Redo management
```

## 🔧 Technical Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Babel Standalone** - JSX compilation in browser
- **No bundler** - Pure static files
- **No backend** - Everything runs client-side


## 🎬 Created By

**Arseniy's Lab** - Off-meta engineering and maker content

[YouTube Channel](https://youtube.com/@arseniylab)

## 🤝 Contributing

Issues and pull requests welcome! This project is perfect for:
- Adding new image processing algorithms
- Improving G-code optimization
- Supporting different printer types

## 📝 License

MIT License - feel free to use in your projects

## 🙏 Acknowledgments

Developed for the 3D printing and maker community. Inspired by the need to create art without buying expensive laser modules.

---

**Made with ❤️ for makers worldwide**
