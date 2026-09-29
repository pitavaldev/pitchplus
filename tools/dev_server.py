#!/usr/bin/env python3
"""Serveur statique de développement avec CORS (pour charger les modules de l'extension depuis une page tierce,
par ex. PITCH, et tester le moteur sur des données réelles). POST /save/<nom> écrit fixtures/private/<nom>.json.
Usage : python3 tools/dev_server.py 8766 — jamais exposé au réseau (127.0.0.1 seulement)."""
import http.server, sys, os, json, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', 'content-type'); self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def do_OPTIONS(self): self.send_response(204); self.end_headers()
    def do_POST(self):
        m = re.match(r'^/save/([A-Za-z0-9_-]+)$', self.path)
        if not m: self.send_response(404); self.end_headers(); return
        n = int(self.headers.get('content-length', 0)); body = self.rfile.read(n)
        os.makedirs(os.path.join(ROOT, 'fixtures', 'private'), exist_ok=True)
        p = os.path.join(ROOT, 'fixtures', 'private', m.group(1) + '.json')
        open(p, 'wb').write(body)
        self.send_response(200); self.send_header('content-type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps({'ok': True, 'bytes': n}).encode())
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8766), H).serve_forever()
