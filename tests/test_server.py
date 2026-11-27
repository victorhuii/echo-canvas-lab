import http.client
from http.server import ThreadingHTTPServer
import threading
import unittest
from server import Handler,ASSETS

class ServerTests(unittest.TestCase):
    def test_static_routes_headers_and_boundaries(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
        def request(path,host=None):
            c=http.client.HTTPConnection('127.0.0.1',server.server_port)
            c.request('GET',path,headers={'Host':host} if host else {})
            r=c.getresponse();status,headers,data=r.status,dict(r.getheaders()),r.read();c.close();return status,headers,data
        try:
            for path in ASSETS:
                status,headers,data=request(path)
                self.assertEqual(status,200,path);self.assertTrue(data)
                self.assertIn("connect-src 'none'",headers['Content-Security-Policy'])
                self.assertEqual(headers['X-Content-Type-Options'],'nosniff')
            self.assertEqual(request('/../../etc/passwd')[0],404)
            self.assertEqual(request('/package.json')[0],404)
            self.assertEqual(request('/','evil.example')[0],403)
        finally:server.shutdown();server.server_close();worker.join()

if __name__=='__main__':unittest.main()
