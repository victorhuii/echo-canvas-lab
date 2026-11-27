"""Fixed-asset loopback server; all scenes and audio remain in the browser."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parent/'web'
ASSETS={'/':('index.html','text/html'),'/style.css':('style.css','text/css')}
for name in ('app','scene','acoustics','audio','worker'):
    ASSETS['/'+name+'.js']=(name+'.js','text/javascript')
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_GET(self):
        if self.headers.get('Host') not in (f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}'):
            self.send_error(403);return
        asset=ASSETS.get(urlsplit(self.path).path)
        if not asset:self.send_error(404);return
        name,kind=asset;data=(ROOT/name).read_bytes()
        self.send_response(200);self.send_header('Content-Type',kind+'; charset=utf-8');self.send_header('Content-Length',str(len(data)))
        self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cache-Control','no-store')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers();self.wfile.write(data)
def main():
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8772);args=p.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    print(f'Echo Canvas Lab: http://127.0.0.1:{server.server_port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
