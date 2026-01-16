# Standalone Panorama Viewer

A self-contained HTML/CSS/JavaScript panorama viewer that works in any modern web browser without requiring any server-side components or build tools.

> [!IMPORTANT]
> **This application MUST be run through a web server.** You cannot simply double-click `index.html` to open it due to browser security restrictions (CORS). See the Quick Start section below for easy setup instructions.

## Features

- 🌐 **Standalone** - No dependencies on Electron or external servers
- 🎨 **Modern UI** - Dark theme with glassmorphism effects
- 🔄 **Scene Navigation** - Navigate between multiple panoramic scenes
- 📍 **Hotspots** - Support for scene links, information popups, and external URLs
- 📱 **Responsive** - Works on desktop, tablet, and mobile devices
- ⌨️ **Keyboard Shortcuts** - Quick access to common functions
- 🖼️ **Fullscreen Mode** - Immersive viewing experience

## Quick Start

### 1. Extract the ZIP file

Extract all files to a folder on your computer.

### 2. Run a local web server

Choose one of these simple methods:

**Option A: Python (Easiest - No Installation Needed)**

Open a terminal/command prompt in the extracted folder and run:

```bash
python3 -m http.server 8000
```

Or on Windows:
```bash
python -m http.server 8000
```

**Option B: Node.js**

```bash
npx http-server -p 8000
```

**Option C: VS Code**

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` → "Open with Live Server"

### 3. Open in browser

Navigate to: **http://localhost:8000**

That's it! Your panorama tour is now running.

## File Structure

```
standalone-template/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Styling and theme
├── js/
│   └── app.js            # Application logic
├── data/
│   └── project.json      # Project data and scene configuration
├── assets/               # Panorama images and media
│   ├── scene-1.jpg
│   └── scene-2.jpg
└── README.md            # This file
```

## How to Use

### Testing Locally

Since this is a web application that loads external resources, you need to run it through a local web server (not just by opening the HTML file directly).

**Option 1: Python HTTP Server (Recommended)**

```bash
# Navigate to the standalone-template directory
cd standalone-template

# Use the included server script (easiest)
python3 serve.py

# Or use Python's built-in server
python3 -m http.server 8000
```

Then open your browser and navigate to: `http://localhost:8000`

**Option 2: Node.js HTTP Server**

```bash
# Install http-server globally (one time)
npm install -g http-server

# Run the server
http-server -p 8000
```

**Option 3: VS Code Live Server**

If you're using Visual Studio Code:
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Customizing Your Tour

1. **Replace Images**: Add your panoramic images to the `assets/` folder
2. **Edit Project Data**: Modify `data/project.json` to configure:
   - Project name and description
   - Scene names and image paths
   - Hotspot positions and types
   - Initial settings (FOV, auto-rotate, etc.)

### Project Data Structure

The `project.json` file follows this structure:

```json
{
  "name": "Your Tour Name",
  "description": "Tour description",
  "settings": {
    "autoRotate": false,
    "initialFov": 50
  },
  "scenes": [
    {
      "id": "unique-scene-id",
      "name": "Scene Name",
      "imagePath": "./assets/your-image.jpg",
      "isFeatured": true,
      "hotspots": [...]
    }
  ]
}
```

### Hotspot Types

**Scene Hotspot** - Navigate to another scene:
```json
{
  "type": "scene",
  "position": { "yaw": 0.5, "pitch": 0.1 },
  "targetSceneId": "scene-2",
  "tooltip": "Go to Scene 2"
}
```

**Info Hotspot** - Display information:
```json
{
  "type": "info",
  "position": { "yaw": -0.8, "pitch": 0.2 },
  "title": "Information Title",
  "content": "Detailed information text",
  "tooltip": "Learn more"
}
```

**URL Hotspot** - Open external link:
```json
{
  "type": "url",
  "position": { "yaw": 1.2, "pitch": -0.3 },
  "url": "https://example.com",
  "openInNewTab": true,
  "tooltip": "Visit website"
}
```

## Keyboard Shortcuts

- `F` - Toggle fullscreen
- `S` - Open scenes panel
- `ESC` - Close panels and modals

## Browser Compatibility

This viewer works in all modern browsers that support:
- ES6 JavaScript
- WebGL
- Fullscreen API

**Tested Browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

- [Photo Sphere Viewer](https://photo-sphere-viewer.js.org/) - 360° panorama viewer library
- Vanilla JavaScript (ES6+)
- CSS3 with custom properties
- HTML5

## Deployment

To deploy your panorama tour:

1. **Static Hosting**: Upload all files to any static web host (GitHub Pages, Netlify, Vercel, etc.)
2. **ZIP Distribution**: Package the entire folder as a ZIP file for users to download and run locally
3. **CDN**: Host images on a CDN for faster loading

## Troubleshooting

**Images not loading:**
- Ensure you're running through a web server (not `file://`)
- Check that image paths in `project.json` are correct
- Verify images are in the `assets/` folder

**Hotspots not appearing:**
- Check the `isVisible` property in hotspot data
- Verify yaw/pitch coordinates are within valid ranges
- Open browser console to check for errors

**Performance issues:**
- Optimize panorama images (recommended: 4096x2048px or smaller)
- Use JPEG format with appropriate compression
- Consider using progressive JPEGs for faster loading

## License

This template is provided as-is for use with your panorama projects.

## Credits

Built with Photo Sphere Viewer by Damien "Mistic" Sorel
