"""Package the existing browser-local workbench for Cloudflare Pages."""
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'site';out.mkdir(exist_ok=True)
for name in ('index.html','style.css','app.js','scene.js','acoustics.js','audio.js','worker.js'):
 shutil.copyfile(ROOT/'web'/name,out/name)
(out/'index.html').write_text((out/'index.html').read_text().replace('href="/','href="./').replace('src="/','src="./'))
(out/'404.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Not found</title><h1>Page not found</h1><a href="./">Return to Echo Canvas</a></html>')
(out/'_headers').write_text("""/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cache-Control: public, max-age=0, must-revalidate
""")
print('Built interactive browser demo: site')
