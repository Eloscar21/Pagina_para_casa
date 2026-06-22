import http.server
import socketserver
import webbrowser
import threading
import time
import os
import socket
import re

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Smart TV User-Agent keywords
TV_KEYWORDS = [
    'smart-tv', 'smarttv', 'googletv', 'appletv', 'hbbtv', 'pov_tv',
    'netcast.tv', 'nettv', 'tizen', 'webos', 'web0s', 'vidaa',
    'viera', 'roku', 'firetv', 'fire tv', 'amazonwebappplatform',
    'crkey', 'philipstv', 'lg netcast', 'lg browser', 'lg simplesmart',
    'bravia', 'sonybravia', 'sonydtv', 'samsungbrowser',
    'silk-accelerated', 'vewd', 'opera tv', 'tv safari', 'tv browser',
    'espial', 'whale', 'tv bro',
    # Generic TV indicators
    'large screen', 'tv store',
]

def is_smart_tv(user_agent):
    """Detect if User-Agent belongs to a Smart TV browser."""
    if not user_agent:
        return False
    ua_lower = user_agent.lower()
    for keyword in TV_KEYWORDS:
        if keyword in ua_lower:
            return True
    return False

def get_local_ip():
    """Get the local IP address of this machine."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class SmartHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        user_agent = self.headers.get('User-Agent', '')
        
        # If requesting the root page, check if it's a Smart TV
        if self.path == '/' or self.path == '/index.html':
            if is_smart_tv(user_agent):
                print(f"  [TV] Smart TV detected: {user_agent[:80]}...")
                self.path = '/tv.html'
            else:
                self.path = '/index.html'
        
        return super().do_GET()

    def end_headers(self):
        # Enable CORS and disable caching for dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom log with IP info
        print(f"  [{self.client_address[0]}] {args[0]}")

def open_browser():
    time.sleep(1.5)
    ip = get_local_ip()
    print(f"\n  Opening browser at http://localhost:{PORT}...")
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    ip = get_local_ip()
    
    print("\n" + "="*56)
    print("   BLENDER WEB PREVIEW - Servidor de Desarrollo")
    print("="*56)
    print(f"\n  Directorio:  {DIRECTORY}")
    print(f"\n  Desde tu PC:")
    print(f"    http://localhost:{PORT}")
    print(f"\n  Desde Smart TV u otros dispositivos (misma WiFi):")
    print(f"    http://{ip}:{PORT}")
    print(f"\n  Smart TVs recibirán automáticamente la versión")
    print(f"  optimizada (tv.html) para mejor compatibilidad.")
    print("\n" + "-"*56)
    print("  Presiona Ctrl+C para detener el servidor")
    print("-"*56 + "\n")
    
    # Open browser in background
    threading.Thread(target=open_browser, daemon=True).start()
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SmartHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Servidor detenido.")
