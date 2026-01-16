#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Clear screen and show header
clear
echo "========================================"
echo "   Panorama Viewer is Starting..."
echo "========================================"
echo ""
echo "The panorama will open in your browser."
echo ""
echo "To STOP the server:"
echo "  - Close this window, or"
echo "  - Press Ctrl+C"
echo ""
echo "========================================"
echo ""

# Function to open browser
open_browser() {
    sleep 2
    if command -v xdg-open &> /dev/null; then
        xdg-open http://127.0.0.1:8000 &> /dev/null &
    elif command -v sensible-browser &> /dev/null; then
        sensible-browser http://127.0.0.1:8000 &> /dev/null &
    elif command -v firefox &> /dev/null; then
        firefox http://127.0.0.1:8000 &> /dev/null &
    elif command -v google-chrome &> /dev/null; then
        google-chrome http://127.0.0.1:8000 &> /dev/null &
    fi
}

# Try Python 3 first
if command -v python3 &> /dev/null; then
    echo "Starting server with Python3..."
    open_browser
    python3 -m http.server 8000
    exit 0
fi

# Try Python
if command -v python &> /dev/null; then
    echo "Starting server with Python..."
    open_browser
    python -m http.server 8000
    exit 0
fi

# Try Node.js
if command -v node &> /dev/null; then
    echo "Starting server with Node.js..."
    npx -y http-server -p 8000 -o
    exit 0
fi

# No server found
echo ""
echo "========================================"
echo "ERROR: No server software found!"
echo "========================================"
echo ""
echo "Please install Python:"
echo "  Ubuntu/Debian: sudo apt install python3"
echo "  Fedora: sudo dnf install python3"
echo "  Arch: sudo pacman -S python"
echo ""
echo "Or install Node.js from:"
echo "  https://nodejs.org/"
echo ""
read -p "Press Enter to exit..."
