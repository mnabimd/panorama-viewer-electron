#!/usr/bin/env python3
"""
Simple HTTP server for testing the standalone panorama viewer.
Run this script from the standalone-template directory.
"""

import http.server
import socketserver
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def main():
    # Change to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"╔═══════════════════════════════════════════════════════╗")
        print(f"║  Panorama Viewer - Development Server                ║")
        print(f"╠═══════════════════════════════════════════════════════╣")
        print(f"║  Server running at:                                   ║")
        print(f"║  → http://localhost:{PORT}                              ║")
        print(f"║                                                       ║")
        print(f"║  Press Ctrl+C to stop the server                      ║")
        print(f"╚═══════════════════════════════════════════════════════╝")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()
