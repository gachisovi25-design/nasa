# Local Development Server with .env Support
import http.server
import socketserver
import os
import urllib.request
from urllib.parse import urlparse, parse_qs

def load_env():
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        os.environ[k.strip()] = v.strip().strip("'").strip('"')
        except Exception as e:
            print("Failed to parse .env:", e)

load_env()

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/apod':
            api_key = os.environ.get('NASA_API_KEY', 'DEMO_KEY')
            qs = parse_qs(parsed.query)
            target_url = f"https://api.nasa.gov/planetary/apod?api_key={api_key}"
            for k in ['date', 'count', 'start_date', 'end_date']:
                if k in qs:
                    target_url += f"&{k}={qs[k][0]}"
            
            try:
                req = urllib.request.Request(
                    target_url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                )
                with urllib.request.urlopen(req) as resp:
                    data = resp.read()
                    self.send_response(resp.status)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
            except urllib.error.HTTPError as he:
                error_body = he.read() if hasattr(he, 'read') else str(he).encode('utf-8')
                self.send_response(he.code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(error_body)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(f'{{"error": "{str(e)}"}}'.encode('utf-8'))
        else:
            super().do_GET()

if __name__ == '__main__':
    print(f"[Local Server] http://localhost:{PORT} running")
    print(f"[.env Loaded] NASA_API_KEY: {os.environ.get('NASA_API_KEY', 'DEMO_KEY')[:6]}...")
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        httpd.serve_forever()
