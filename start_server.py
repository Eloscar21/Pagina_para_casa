import http.server
import socketserver
import webbrowser
import threading
import time
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Allow requests for all standard 3D formats
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching rules if needed
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

def open_browser():
    time.sleep(1.5)
    print(f"Opening web browser to http://localhost:{PORT}...")
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    print(f"Starting server in directory: {DIRECTORY}")
    print(f"Starting server on http://localhost:{PORT}...")
    
    # Run the browser opener in a separate thread so it doesn't block the server startup
    threading.Thread(target=open_browser, daemon=True).start()
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
